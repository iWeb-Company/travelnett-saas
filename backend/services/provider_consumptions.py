"""Create and reconcile provider consumption from a new reservation.

All writes happen in the caller's transaction. The service is intentionally
not called by GET endpoints and never reads current provider prices for an
existing snapshot.
"""
from datetime import date
from decimal import Decimal
import uuid

from sqlalchemy import func, inspect
from sqlalchemy.orm import Session

from models.models import (
    Excursions, Hotels, ReservationPassengers, Reservas,
    ccProvidersConsumptionPayments, cuentasCorrientesProviders,
)
from models.providers import Provider
from models.provider_consumptions import (
    ProviderConsumptionContribution, ProviderConsumptionGroup,
    ReservationProviderEvaluation, ReservationProviderServiceSnapshot,
)
from services.provider_pricing import ProviderPriceMatch, resolve_reservation_provider_pricing


def _eligible(passenger: ReservationPassengers) -> bool:
    return (passenger.pasajero_type or "ADL").strip().upper() in {"ADL", "CHD"}


def _departure_date(db: Session, reserva: Reservas) -> str:
    from models.models import Salidas
    salida = db.query(Salidas).filter_by(id=reserva.salida_id, iweb_client_id=reserva.iweb_client_id).first()
    return str(salida.date_of_out)[:10] if salida and salida.date_of_out else ""


def _group_key(match: ProviderPriceMatch, reserva: Reservas) -> str:
    return "|".join(str(value or "") for value in (
        match.provider.id, match.service.id, reserva.salida_id,
        match.hotel_id, match.excursion_id, match.regimen_id,
        match.hotel_fecha_in,
    ))


def _detail(db: Session, match: ProviderPriceMatch, reserva: Reservas) -> str:
    departure = _departure_date(db, reserva)
    if match.hotel_id:
        hotel = db.query(Hotels).filter_by(id=match.hotel_id, iweb_client_id=reserva.iweb_client_id).first()
        return f"IN {hotel.name if hotel else match.hotel_id} {match.hotel_fecha_in or '-'}"
    excursion = db.query(Excursions).filter_by(id=match.excursion_id, iweb_client_id=reserva.iweb_client_id).first()
    return f"{excursion.name if excursion else match.excursion_id} - salida {departure or '-'}"


def _account(db: Session, match: ProviderPriceMatch, tenant: str):
    account = db.query(cuentasCorrientesProviders).filter_by(
        iweb_client_id=tenant, provider_id=match.provider.id, type="proveedor"
    ).with_for_update().first()
    if account is None:
        account = cuentasCorrientesProviders(
            id=str(uuid.uuid4()), iweb_client_id=tenant, provider_id=match.provider.id,
            type="proveedor", detail=match.provider.name, balance=Decimal("0"),
            total_consumption=Decimal("0"), total_payments=Decimal("0"),
            created_at=date.today(),
        )
        db.add(account)
        db.flush()
    return account


def _movement(db: Session, account, group: ProviderConsumptionGroup, tenant: str):
    movement = db.query(ccProvidersConsumptionPayments).filter_by(
        iweb_client_id=tenant, consumption_group_id=group.id, type="consumo"
    ).with_for_update().first()
    if movement is None:
        movement = ccProvidersConsumptionPayments(
            id=str(uuid.uuid4()), cc_provider_id=account.id,
            consumption_group_id=group.id, provider_type="proveedor",
            salida_id=group.salida_id, hotel_id=group.hotel_id,
            iweb_client_id=tenant, date=date.today(), detail=group.detail,
            type="consumo", amount=group.amount,
        )
        db.add(movement)
    else:
        movement.amount = group.amount
        movement.detail = group.detail
    return movement


def _reconcile_account(db: Session, account, tenant: str):
    total = db.query(func.coalesce(func.sum(ccProvidersConsumptionPayments.amount), 0)).filter(
        ccProvidersConsumptionPayments.iweb_client_id == tenant,
        ccProvidersConsumptionPayments.cc_provider_id == account.id,
        ccProvidersConsumptionPayments.provider_type == "proveedor",
        ccProvidersConsumptionPayments.type == "consumo",
    ).scalar()
    account.total_consumption = Decimal(str(total or 0))
    account.balance = account.total_consumption - Decimal(str(account.total_payments or 0))


def create_provider_consumptions(db: Session, reserva: Reservas) -> None:
    """Evaluate one newly-created reservation exactly once.

    Existing reservations without an evaluation row are deliberately ignored
    by other code; this function is only called from the creation transaction.
    """
    required_tables = {
        ReservationProviderEvaluation.__tablename__,
        ReservationProviderServiceSnapshot.__tablename__,
        ProviderConsumptionGroup.__tablename__,
        ProviderConsumptionContribution.__tablename__,
    }
    if not required_tables <= set(inspect(db.connection()).get_table_names()):
        return
    tenant = reserva.iweb_client_id
    if db.query(ReservationProviderEvaluation).filter_by(
        iweb_client_id=tenant, reserva_id=reserva.id
    ).first():
        return
    evaluation = ReservationProviderEvaluation(iweb_client_id=tenant, reserva_id=reserva.id)
    db.add(evaluation)
    db.flush()
    passengers = db.query(ReservationPassengers).filter_by(reserva_id=reserva.id).all()
    matches = resolve_reservation_provider_pricing(db, reserva, passengers)
    for match in matches:
        snapshot = ReservationProviderServiceSnapshot(
            iweb_client_id=tenant, reserva_id=reserva.id,
            provider_id=match.provider.id, provider_service_id=match.service.id,
            package_id=reserva.package_id, salida_id=reserva.salida_id,
            hotel_id=match.hotel_id, excursion_id=match.excursion_id,
            regimen_id=match.regimen_id, hotel_fecha_in=match.hotel_fecha_in,
            validity_type=match.service.validity_type, period_id=match.service.period_id,
            unit_cost=match.unit_cost, currency="ARS",
        )
        db.add(snapshot)
        db.flush()
        if match.unit_cost is None:
            continue
        selected = [p for p in passengers if _eligible(p) and (not match.hotel_id or p.hotel_id == match.hotel_id)]
        exempt = 0
        if (reserva.type or "").strip().lower() in {"grupo", "bloqueo"}:
            exempt = min(max(reserva.liberados or 0, 0), len(selected))
        quantity = len(selected) - exempt
        if quantity <= 0:
            continue
        group_key = _group_key(match, reserva)
        group = db.query(ProviderConsumptionGroup).filter_by(
            iweb_client_id=tenant, group_key=group_key
        ).with_for_update().first()
        if group is None:
            group = ProviderConsumptionGroup(
                iweb_client_id=tenant, provider_id=match.provider.id,
                provider_service_id=match.service.id, salida_id=reserva.salida_id,
                hotel_id=match.hotel_id, excursion_id=match.excursion_id,
                regimen_id=match.regimen_id, hotel_fecha_in=match.hotel_fecha_in,
                group_key=group_key, detail=_detail(db, match, reserva), amount=Decimal("0"),
                created_at=date.today(),
            )
            db.add(group)
            db.flush()
        passenger_ids = [p.id for p in selected[:quantity]]
        for passenger_id in passenger_ids:
            source_key = f"{snapshot.id}:passenger:{passenger_id}"
            if db.query(ProviderConsumptionContribution).filter_by(
                iweb_client_id=tenant, source_key=source_key
            ).first():
                continue
            contribution = ProviderConsumptionContribution(
                iweb_client_id=tenant, group_id=group.id, snapshot_id=snapshot.id,
                reserva_id=reserva.id, reservation_passenger_id=passenger_id,
                source_key=source_key, quantity=1, amount=match.unit_cost,
            )
            db.add(contribution)
            group.amount += match.unit_cost
        if exempt:
            source_key = f"{snapshot.id}:liberados"
            if not db.query(ProviderConsumptionContribution).filter_by(
                iweb_client_id=tenant, source_key=source_key
            ).first():
                db.add(ProviderConsumptionContribution(
                    iweb_client_id=tenant, group_id=group.id, snapshot_id=snapshot.id,
                    reserva_id=reserva.id, source_key=source_key,
                    quantity=exempt, amount=Decimal("0"),
                ))
        account = _account(db, match, tenant)
        db.flush()
        _movement(db, account, group, tenant)
        db.flush()
        _reconcile_account(db, account, tenant)


def reverse_provider_consumptions(db: Session, reserva: Reservas) -> None:
    """Reverse active contributions for a cancelled/deleted reservation.

    Snapshots and groups remain as audit history; only their active monetary
    contributions are reversed. Repeating the operation is a no-op.
    """
    required_tables = {
        ReservationProviderEvaluation.__tablename__,
        ReservationProviderServiceSnapshot.__tablename__,
        ProviderConsumptionGroup.__tablename__,
        ProviderConsumptionContribution.__tablename__,
    }
    inspector = inspect(db.connection())
    if not required_tables <= set(inspector.get_table_names()):
        return
    cc_columns = {column["name"] for column in inspector.get_columns(ccProvidersConsumptionPayments.__tablename__)}
    account_columns = {column["name"] for column in inspector.get_columns(cuentasCorrientesProviders.__tablename__)}
    if "consumption_group_id" not in cc_columns or "provider_id" not in account_columns:
        return
    tenant = reserva.iweb_client_id
    contributions = db.query(ProviderConsumptionContribution).filter_by(
        iweb_client_id=tenant, reserva_id=reserva.id, active=True
    ).with_for_update().all()
    if not contributions:
        return
    group_ids = {contribution.group_id for contribution in contributions}
    for contribution in contributions:
        contribution.active = False
    db.flush()
    groups = db.query(ProviderConsumptionGroup).filter(
        ProviderConsumptionGroup.iweb_client_id == tenant,
        ProviderConsumptionGroup.id.in_(group_ids),
    ).with_for_update().all()
    for group in groups:
        amount = db.query(func.coalesce(func.sum(ProviderConsumptionContribution.amount), 0)).filter(
            ProviderConsumptionContribution.group_id == group.id,
            ProviderConsumptionContribution.active.is_(True),
        ).scalar()
        group.amount = Decimal(str(amount or 0))
        provider = db.query(Provider).filter_by(id=group.provider_id, iweb_client_id=tenant).first()
        if provider is None:
            continue
        match = ProviderPriceMatch(
            provider=provider, service=None, hotel_id=group.hotel_id,
            excursion_id=group.excursion_id, regimen_id=group.regimen_id,
            hotel_fecha_in=group.hotel_fecha_in, unit_cost=None,
        )
        account = _account(db, match, tenant)
        _movement(db, account, group, tenant)
        db.flush()
        _reconcile_account(db, account, tenant)


def reconcile_provider_consumptions(db: Session, reserva: Reservas) -> None:
    """Reconcile passenger quantity using the original snapshot prices.

    This is intentionally limited to services already snapshotted at booking
    creation. Adding a newly contracted hotel/service does not create a
    retroactive provider charge.
    """
    tenant = reserva.iweb_client_id
    snapshots = db.query(ReservationProviderServiceSnapshot).filter_by(
        iweb_client_id=tenant, reserva_id=reserva.id, evaluated=True
    ).with_for_update().all()
    if not snapshots:
        return
    passengers = db.query(ReservationPassengers).filter_by(reserva_id=reserva.id).all()
    for snapshot in snapshots:
        if snapshot.unit_cost is None:
            continue
        selected = [p for p in passengers if _eligible(p) and (
            not snapshot.hotel_id or p.hotel_id == snapshot.hotel_id
        )]
        desired = selected
        if (reserva.type or "").strip().lower() in {"grupo", "bloqueo"}:
            desired = selected[:max(0, len(selected) - min(max(reserva.liberados or 0, 0), len(selected)))]
        group_key = "|".join(str(value or "") for value in (
            snapshot.provider_id, snapshot.provider_service_id, snapshot.salida_id,
            snapshot.hotel_id, snapshot.excursion_id, snapshot.regimen_id,
            snapshot.hotel_fecha_in,
        ))
        group = db.query(ProviderConsumptionGroup).filter_by(
            iweb_client_id=tenant, group_key=group_key
        ).with_for_update().first()
        if group is None:
            continue
        all_contributions = db.query(ProviderConsumptionContribution).filter_by(
            iweb_client_id=tenant, snapshot_id=snapshot.id
        ).all()
        current = [row for row in all_contributions if row.active]
        current_by_passenger = {
            row.reservation_passenger_id: row for row in current if row.reservation_passenger_id
        }
        known_by_passenger = {
            row.reservation_passenger_id: row for row in all_contributions
            if row.reservation_passenger_id
        }
        desired_ids = {p.id for p in desired}
        for passenger_id, contribution in current_by_passenger.items():
            if passenger_id not in desired_ids:
                contribution.active = False
                group.amount -= contribution.amount
        provider = db.query(Provider).filter_by(id=snapshot.provider_id, iweb_client_id=tenant).first()
        if provider is None:
            continue
        for passenger in desired:
            if passenger.id in current_by_passenger:
                continue
            previous = known_by_passenger.get(passenger.id)
            if previous is not None:
                previous.active = True
                group.amount += previous.amount
                continue
            db.add(ProviderConsumptionContribution(
                iweb_client_id=tenant, group_id=group.id, snapshot_id=snapshot.id,
                reserva_id=reserva.id, reservation_passenger_id=passenger.id,
                source_key=f"{snapshot.id}:passenger:{passenger.id}", quantity=1,
                amount=snapshot.unit_cost,
            ))
            group.amount += snapshot.unit_cost
        match = ProviderPriceMatch(
            provider=provider, service=None, hotel_id=snapshot.hotel_id,
            excursion_id=snapshot.excursion_id, regimen_id=snapshot.regimen_id,
            hotel_fecha_in=snapshot.hotel_fecha_in, unit_cost=snapshot.unit_cost,
        )
        account = _account(db, match, tenant)
        db.flush()
        _movement(db, account, group, tenant)
        _reconcile_account(db, account, tenant)
