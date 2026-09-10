"""Transport inventory. Call under get_inventory_db; caller owns commit/rollback.

All writers share the tenant mutex, including bookings and legacy adapters.
"""
import uuid
from collections import Counter
from datetime import date, datetime, timezone

from fastapi import HTTPException

from models.models import (SalidaTransportUnit, TransportCompany, BusTypes,
                           Reservas, ReservationPassengers, ccProvidersConsumptionPayments)


def units_for(db, salida):
    return db.query(SalidaTransportUnit).filter_by(
        salida_id=salida.id, iweb_client_id=salida.iweb_client_id,
    ).order_by(SalidaTransportUnit.number).all()


def passenger_rows(db, salida, *, active_only=True):
    q = db.query(ReservationPassengers).join(Reservas, Reservas.id == ReservationPassengers.reserva_id).filter(
        Reservas.salida_id == salida.id, Reservas.iweb_client_id == salida.iweb_client_id)
    if active_only:
        q = q.filter(Reservas.active.is_not(False))
    return q.all()


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
    for kind in ("semicama", "cama"):
        if demand[kind] > sum(getattr(u, kind) for u in by_id.values()):
            raise HTTPException(409, f"La capacidad {kind} es inferior a la demanda reservada")
    occupied, assigned = set(), Counter()
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
        assigned[unit.id, kind] += 1
        if assigned[unit.id, kind] > getattr(unit, kind):
            raise HTTPException(409, "El micro no tiene capacidad para sus pasajeros asignados")
        if p.butaca_number is not None:
            if not 1 <= p.butaca_number <= getattr(unit, kind):
                raise HTTPException(409, "La butaca no existe en el micro")
            key = (unit.id, kind, p.butaca_number)
            if key in occupied:
                raise HTTPException(409, "La butaca ya está ocupada en este micro")
            occupied.add(key)


def project_legacy(db, salida):
    units = units_for(db, salida)
    if not units:
        return
    first = units[0]
    salida.transport_company = first.transport_company
    salida.precio_transporte = first.price
    salida.type_bus = first.type_bus
    salida.coordinador_nombre = first.coordinador_nombre
    salida.coordinador_telefono = first.coordinador_telefono
    salida.semicama = sum(u.semicama for u in units if u.active)
    salida.cama = sum(u.cama for u in units if u.active)
    salida.passengers = salida.semicama + salida.cama


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
    if not units and (salida.transport_company or salida.type_bus or salida.semicama or salida.cama or passenger_rows(db, salida, active_only=False)):
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
    for passenger in passengers.values():
        if passenger.id in requested:
            passenger.salida_transport_unit_id = unit.id
            passenger.bus_number = str(unit.number)
            passenger.butaca_number = requested[passenger.id].butaca_number
        elif passenger.salida_transport_unit_id == unit.id:
            passenger.salida_transport_unit_id = None
            passenger.bus_number = None
            passenger.butaca_number = None
    validate_inventory(db, salida)
    unit.revision += 1
    return unit


def apply_legacy_update(db, salida, payload, actor):
    """Translate compatible singular writes; reject multibus inventory writes."""
    units = units_for(db, salida)
    if not units:
        return False
    fields = {"transport_company", "precio_transporte", "type_bus", "semicama", "cama",
              "passengers", "coordinador_nombre", "coordinador_telefono", "type"}
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
