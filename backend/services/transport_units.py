"""Transport inventory. Call under get_inventory_db; caller owns commit/rollback.

All writers share the tenant mutex, including bookings and legacy adapters.
"""
import uuid
from collections import Counter
from datetime import date, datetime, timezone

from fastapi import HTTPException
from sqlalchemy.exc import OperationalError, ProgrammingError

from models.models import (SalidaTransportUnit, TransportCompany, BusTypes,
                           Reservas, ReservationPassengers, ccProvidersConsumptionPayments)


def _is_missing_transport_units_table(error):
    message = str(error).lower()
    return "salida_transport_units" in message and (
        "no such table" in message or "doesn't exist" in message or "does not exist" in message
    )


def _legacy_schema_or_raise(error):
    if _is_missing_transport_units_table(error):
        return True
    raise error


def units_for(db, salida):
    """Return no units while a legacy database awaits the additive migration.

    Read paths must remain available during the staged rollout. Writers call
    ``require_transport_units_schema`` before attempting a multi-micro change.
    """
    try:
        return db.query(SalidaTransportUnit).filter_by(
            salida_id=salida.id, iweb_client_id=salida.iweb_client_id,
        ).order_by(SalidaTransportUnit.number).all()
    except (OperationalError, ProgrammingError) as error:
        if _legacy_schema_or_raise(error):
            return []


def units_for_departures(db, iweb_client_id, salida_ids):
    if not salida_ids:
        return {}
    try:
        units = db.query(SalidaTransportUnit).filter(
            SalidaTransportUnit.iweb_client_id == iweb_client_id,
            SalidaTransportUnit.salida_id.in_(salida_ids),
        ).order_by(SalidaTransportUnit.number).all()
    except (OperationalError, ProgrammingError) as error:
        if _legacy_schema_or_raise(error):
            return {}
    grouped = {}
    for unit in units:
        grouped.setdefault(unit.salida_id, []).append(unit)
    return grouped


def require_transport_units_schema(db):
    try:
        db.query(SalidaTransportUnit.id).limit(1).all()
    except (OperationalError, ProgrammingError) as error:
        if _legacy_schema_or_raise(error):
            raise HTTPException(409, "La base todavía no tiene micros. Ejecutá la migración de transporte antes de modificar micros.")


def passenger_rows(db, salida, *, active_only=True):
    q = db.query(ReservationPassengers).join(Reservas, Reservas.id == ReservationPassengers.reserva_id).filter(
        Reservas.salida_id == salida.id, Reservas.iweb_client_id == salida.iweb_client_id)
    if active_only:
        q = q.filter(Reservas.active.is_not(False))
    return q.all()


def assign_passenger_to_unit_number(db, salida, passenger, bus_number):
    """Link a passenger to the active micro selected from the departure list."""
    value = (bus_number or "").strip()
    if not value:
        passenger.bus_number = None
        passenger.salida_transport_unit_id = None
        passenger.butaca_number = None
        return None
    if not value.isdecimal() or int(value) < 1:
        raise HTTPException(422, "El número de micro debe ser un entero positivo")

    number = int(value)
    unit = next((item for item in units_for(db, salida) if item.active and item.number == number), None)
    if not unit:
        raise HTTPException(422, f"El Micro {number} no está activo en esta salida")

    if passenger.salida_transport_unit_id != unit.id:
        passenger.butaca_number = None
    passenger.bus_number = str(unit.number)
    passenger.salida_transport_unit_id = unit.id
    return unit


def validate_inventory(db, salida):
    db.flush()
    units = units_for(db, salida)
    if not units:
        if any(p.salida_transport_unit_id for p in passenger_rows(db, salida)):
            raise HTTPException(409, "Desasigná el transporte antes de cambiar la salida")
        return  # Unmigrated legacy inventory stays under its existing validator.
    by_id = {u.id: u for u in units if u.active}
    rows = passenger_rows(db, salida)
    demand = Counter((p.butaca_type or "semicama").strip().lower() for p in rows)
    # The commercial inventory belongs to the departure itself. Micros are
    # only the physical distribution of that inventory; requiring their
    # configured bus types here made a valid departure fail before passengers
    # could be distributed between micros.
    for kind in ("semicama", "cama"):
        departure_capacity = getattr(salida, kind, 0) or 0
        if demand[kind] > departure_capacity:
            raise HTTPException(409, f"La capacidad {kind} es inferior a la demanda reservada")
    occupied = set()
    for p in rows:
        if not p.salida_transport_unit_id:
            if p.butaca_number is not None or p.bus_number:
                raise HTTPException(409, "Asigná el micro desde su taquilla antes de elegir una butaca")
            continue
        unit = by_id.get(p.salida_transport_unit_id)
        if not unit:
            raise HTTPException(409, "El micro del pasajero no está activo o no pertenece a la salida")
        if p.bus_number and p.bus_number != str(unit.number):
            raise HTTPException(409, "Modificá la asignación de micro desde la taquilla")
        kind = (p.butaca_type or "semicama").strip().lower()
        if kind not in {"semicama", "cama"}:
            raise HTTPException(409, "Categoría de butaca inválida")
        if p.butaca_number is not None:
            if not 1 <= p.butaca_number <= getattr(unit, kind):
                raise HTTPException(409, "La butaca no existe en el micro")
            key = (unit.id, kind, p.butaca_number)
            if key in occupied:
                raise HTTPException(409, "La butaca ya está ocupada en este micro")
            occupied.add(key)


def project_legacy(db, salida):
    """Project Micro 1 metadata without changing the departure's sale limits."""
    units = units_for(db, salida)
    if not units:
        return
    first = units[0]
    salida.transport_company = first.transport_company
    salida.precio_transporte = first.price
    salida.type_bus = first.type_bus
    salida.coordinador_nombre = first.coordinador_nombre
    salida.coordinador_telefono = first.coordinador_telefono


def set_template(db, salida, unit, template_id):
    template = None
    if template_id:
        template = db.query(BusTypes).filter_by(id=template_id, iweb_client_id=salida.iweb_client_id).first()
        if not template:
            raise HTTPException(400, "El tipo de bus no pertenece a la agencia")
    unit.type_bus = template_id
    unit.semicama = (template.semicama_quantity or 0) if template else 0
    unit.cama = (template.cama_quantity or 0) if template else 0
    if unit.semicama < 0 or unit.cama < 0:
        raise HTTPException(400, "El tipo de bus tiene capacidades inválidas")
    unit.layout_snapshot = dict(name=template.name if template else None,
        semicama_quantity=unit.semicama, cama_quantity=unit.cama,
        panoramicos_quantity=(template.panoramicos_quantity or 0) if template else 0)


def sync_consumption(db, salida, unit, actor):
    expense = db.query(ccProvidersConsumptionPayments).filter_by(
        salida_transport_unit_id=unit.id, iweb_client_id=salida.iweb_client_id).one_or_none()
    amount = unit.price if unit.active else 0
    if expense and expense.amount == amount and expense.transport_id == unit.transport_company:
        return expense
    stamp = datetime.now(timezone.utc).isoformat()
    if expense is None:
        expense = ccProvidersConsumptionPayments(id=str(uuid.uuid4()),
            salida_transport_unit_id=unit.id, salida_id=salida.id,
            iweb_client_id=salida.iweb_client_id, provider_type="transporte", type="consumo",
            date=date.fromisoformat(salida.date_of_out[:10]) if salida.date_of_out else date.today(),
            detail=f"Consumo transporte - Micro {unit.number}")
        db.add(expense)
    expense.detail = f"{expense.detail or ''} | {stamp} {actor}: empresa {expense.transport_id or '-'} → {unit.transport_company}; importe {expense.amount or 0} → {amount}"
    expense.transport_id = unit.transport_company
    expense.amount = amount
    return expense


def validate_company(db, salida, company):
    if not company or not db.query(TransportCompany).filter_by(id=company, iweb_client_id=salida.iweb_client_id).first():
        raise HTTPException(400, "La empresa de transporte no pertenece a la agencia")


def create_unit(db, salida, payload, actor):
    if (salida.type or "").strip().lower() not in {"bus", "micro"}:
        raise HTTPException(400, "Los micros requieren una salida terrestre")
    units = units_for(db, salida)
    legacy_expense = db.query(ccProvidersConsumptionPayments).filter(
        ccProvidersConsumptionPayments.salida_id == salida.id,
        ccProvidersConsumptionPayments.salida_transport_unit_id.is_(None),
    ).first()
    if not units and (legacy_expense or passenger_rows(db, salida, active_only=False)):
        raise HTTPException(409, "La salida requiere resolver el diagnóstico y migrar Micro 1")
    validate_company(db, salida, payload.transport_company)
    unit = SalidaTransportUnit(id=str(uuid.uuid4()), iweb_client_id=salida.iweb_client_id,
        salida_id=salida.id, number=max((u.number for u in units), default=0) + 1,
        transport_company=payload.transport_company, price=payload.price,
        coordinador_nombre=payload.coordinador_nombre, coordinador_telefono=payload.coordinador_telefono,
        active=True, revision=0)
    set_template(db, salida, unit, payload.type_bus)
    db.add(unit)
    db.flush()
    validate_inventory(db, salida)
    sync_consumption(db, salida, unit, actor)
    project_legacy(db, salida)
    return unit


def update_unit(db, salida, unit, payload, actor):
    if not unit.active:
        raise HTTPException(409, "El micro está anulado")
    data = payload.model_dump(exclude_unset=True)
    if "transport_company" in data:
        validate_company(db, salida, data["transport_company"])
    if "price" in data and data["price"] is None:
        raise HTTPException(422, "El precio es obligatorio")
    if "type_bus" in data and data["type_bus"] != unit.type_bus:
        set_template(db, salida, unit, data.pop("type_bus"))
    for key, value in data.items():
        setattr(unit, key, value)
    validate_inventory(db, salida)
    sync_consumption(db, salida, unit, actor)
    unit.revision += 1
    project_legacy(db, salida)
    return unit


def cancel_unit(db, salida, unit, actor):
    if not unit.active:
        return unit
    if any(p.salida_transport_unit_id == unit.id for p in passenger_rows(db, salida)):
        raise HTTPException(409, "Desasigná todos los pasajeros antes de anular el micro")
    unit.active = False
    validate_inventory(db, salida)
    sync_consumption(db, salida, unit, actor)
    unit.revision += 1
    project_legacy(db, salida)
    return unit


def save_assignments(db, salida, unit, payload):
    if not unit.active or unit.revision != payload.revision:
        raise HTTPException(409, "La taquilla cambió; recargá antes de guardar")
    passengers = {p.id: p for p in passenger_rows(db, salida)}
    requested = {a.reservation_passenger_id: a for a in payload.assignments}
    if len(requested) != len(payload.assignments):
        raise HTTPException(422, "No repitas pasajeros en las asignaciones")
    for association_id, assignment in requested.items():
        passenger = passengers.get(association_id)
        if passenger is None:
            raise HTTPException(409, "El pasajero ya no está activo en esta salida; recargá la taquilla")
        if passenger.salida_transport_unit_id not in {None, unit.id}:
            raise HTTPException(409, "Desasigná primero al pasajero del otro micro")
    # Seat saves are patch operations. Passengers omitted from the payload can
    # still be assigned to this micro without a seat; never clear them merely
    # because the current screen did not include them.
    for passenger_id, assignment in requested.items():
        passenger = passengers[passenger_id]
        if assignment.butaca_number is None:
            # Explicitly removing a seat keeps the passenger on the micro.
            if passenger.salida_transport_unit_id != unit.id:
                raise HTTPException(409, "El pasajero no estÃ¡ asignado a este micro")
            passenger.butaca_number = None
            passenger.bus_number = str(unit.number)
            continue
        passenger.salida_transport_unit_id = unit.id
        passenger.bus_number = str(unit.number)
        passenger.butaca_number = assignment.butaca_number
    validate_inventory(db, salida)
    unit.revision += 1
    return unit


def apply_legacy_update(db, salida, payload, actor):
    """Translate compatible singular writes; reject multibus inventory writes."""
    units = units_for(db, salida)
    if not units:
        return False
    fields = {"transport_company", "precio_transporte", "type_bus",
              "coordinador_nombre", "coordinador_telefono", "type"}
    data = payload.model_dump(exclude_unset=True)
    changed = {key: value for key, value in data.items() if key in fields and value is not None and value != getattr(salida, key)}
    if not changed:
        return True
    if len(units) > 1:
        raise HTTPException(409, "Esta salida tiene varios micros; modificá el transporte desde cada micro")
    if "type" in changed:
        raise HTTPException(409, "No se puede cambiar la modalidad de una salida con micros")
    from schemas.transport_units import TransportUnitUpdate
    unit = units[0]
    unit_data = {("price" if key == "precio_transporte" else key): value for key, value in changed.items()
                 if key not in {"semicama", "cama", "passengers"}}
    update_unit(db, salida, unit, TransportUnitUpdate(**unit_data), actor)
    if "semicama" in changed or "cama" in changed:
        for kind in ("semicama", "cama"):
            if kind in changed:
                setattr(unit, kind, changed[kind])
        unit.layout_snapshot = {**unit.layout_snapshot, "semicama_quantity": unit.semicama, "cama_quantity": unit.cama}
        validate_inventory(db, salida)
    project_legacy(db, salida)
    return True
