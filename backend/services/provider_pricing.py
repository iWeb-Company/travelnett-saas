"""Resolve provider pricing at reservation time.

The resolver reads the current catalog only once, when a reservation is
created. Callers must persist its result as a snapshot before changing the
reservation or committing the transaction.
"""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from typing import Iterable

from sqlalchemy.orm import Session

from models.models import PackageHotels, Packages, ReservationPassengers, Reservas, Salidas
from models.providers import Provider, ProviderRegimenCost, ProviderService


@dataclass(frozen=True)
class ProviderPriceMatch:
    provider: Provider
    service: ProviderService
    hotel_id: str | None
    excursion_id: str | None
    regimen_id: str | None
    hotel_fecha_in: str | None
    unit_cost: Decimal | None


def _date(value) -> date | None:
    if value is None:
        return None
    try:
        return date.fromisoformat(str(value)[:10])
    except (TypeError, ValueError):
        return None


def _package_excursion_ids(package: Packages | None) -> set[str]:
    if not package or not package.excursiones:
        return set()
    return {part.strip() for part in str(package.excursiones).split(",") if part.strip()}


def _valid(service: ProviderService, departure_date: date | None, package_period: str | None) -> bool:
    if service.validity_type == "period":
        return bool(package_period and service.period_id == package_period)
    start = _date(service.start_date)
    end = _date(service.end_date)
    return bool(start and end and departure_date and start <= departure_date <= end)


def _hotel_cost(service: ProviderService, regimen_id: str | None) -> Decimal | None:
    if not regimen_id:
        return None
    for amount in service.regimen_costs:
        if amount.active and amount.regimen_id == regimen_id:
            return amount.cost
    return None


def _candidate_services(db: Session, tenant: str, *, hotel_ids: set[str], excursion_ids: set[str]):
    query = db.query(Provider, ProviderService).join(
        ProviderService, ProviderService.provider_id == Provider.id
    ).filter(
        Provider.iweb_client_id == tenant,
        Provider.active.is_(True),
        ProviderService.active.is_(True),
    )
    if hotel_ids and excursion_ids:
        query = query.filter(
            (ProviderService.hotel_id.in_(hotel_ids)) |
            (ProviderService.excursion_id.in_(excursion_ids))
        )
    elif hotel_ids:
        query = query.filter(ProviderService.hotel_id.in_(hotel_ids))
    elif excursion_ids:
        query = query.filter(ProviderService.excursion_id.in_(excursion_ids))
    else:
        return []
    return query.all()


def resolve_reservation_provider_pricing(
    db: Session,
    reserva: Reservas,
    passengers: Iterable[ReservationPassengers] | None = None,
) -> list[ProviderPriceMatch]:
    """Return all applicable services, including matches without a price.

    A missing price is represented by ``unit_cost=None`` so the caller can
    persist that the reservation was evaluated without creating a debt row.
    """
    if not reserva.package_id:
        return []
    package = db.query(Packages).filter_by(
        id=reserva.package_id, iweb_client_id=reserva.iweb_client_id
    ).first()
    departure = db.query(Salidas).filter_by(
        id=reserva.salida_id, iweb_client_id=reserva.iweb_client_id
    ).first() if reserva.salida_id else None
    departure_date = _date(departure.date_of_out if departure else None)
    passenger_rows = list(passengers) if passengers is not None else db.query(ReservationPassengers).filter_by(reserva_id=reserva.id).all()
    hotel_ids = {p.hotel_id for p in passenger_rows if p.hotel_id}
    if not hotel_ids and reserva.hotel_id:
        hotel_ids.add(reserva.hotel_id)
    excursion_ids = _package_excursion_ids(package)
    package_hotels = db.query(PackageHotels).filter_by(
        package_id=reserva.package_id, iweb_client_id=reserva.iweb_client_id
    ).all()
    package_hotel_by_id = {row.hotel_id: row for row in package_hotels if row.hotel_id}
    matches = []
    for provider, service in _candidate_services(
        db, reserva.iweb_client_id, hotel_ids=hotel_ids, excursion_ids=excursion_ids
    ):
        if not _valid(service, departure_date, package.periodo if package else None):
            continue
        if service.hotel_id:
            package_hotel = package_hotel_by_id.get(service.hotel_id)
            # The contracted regimen belongs to the package hotel. A
            # reservation may have a legacy/null regimen field, but provider
            # pricing must use package_hotels.hotel_regimen_id for the hotel
            # actually assigned to the passengers.
            regimen_id = package_hotel.hotel_regimen_id if package_hotel else None
            matches.append(ProviderPriceMatch(
                provider=provider,
                service=service,
                hotel_id=service.hotel_id,
                excursion_id=None,
                regimen_id=regimen_id,
                hotel_fecha_in=package_hotel.hotel_fecha_in if package_hotel else None,
                unit_cost=_hotel_cost(service, regimen_id),
            ))
        else:
            matches.append(ProviderPriceMatch(
                provider=provider,
                service=service,
                hotel_id=None,
                excursion_id=service.excursion_id,
                regimen_id=None,
                hotel_fecha_in=None,
                unit_cost=service.cost,
            ))
    return matches
