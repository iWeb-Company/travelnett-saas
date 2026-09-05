"""Inventory shared by all booking channels. Mutations use get_inventory_db.

A tenant row is the transaction mutex (including absent hotel capacity rows).
Acquire it BEFORE reading inventory, so MySQL REPEATABLE READ takes its snapshot
after the previous writer commits. Locks live until the booking/package commit.
"""
import uuid
from collections import Counter

from fastapi import Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from db.database import get_db
from models.models import (
    iWebClient, Packages, PackagesDatesOfExit, PackageHotels, PackageHotelCapacity,
    Reservas, ReservationPassengers, Passengers, Salidas, Hotels,
)


def get_inventory_db(iweb_client_id: str, db: Session = Depends(get_db)):
    tenant = db.query(iWebClient).filter(
        iWebClient.id == iweb_client_id.strip()
    ).with_for_update().first()
    if tenant is None:
        raise HTTPException(404, "Agencia no encontrada")
    return db


def passengers_for(db, reserva):
    return db.query(ReservationPassengers).filter_by(reserva_id=reserva.id).all()


def snapshot(db, reserva):
    rows = passengers_for(db, reserva)
    active = reserva.active is not False
    return {
        "selection": (reserva.package_id, reserva.salida_id, reserva.hotel_id),
        "hotels": Counter(
            (reserva.package_id, reserva.salida_id, p.hotel_id or reserva.hotel_id)
            for p in rows if active
        ),
        "seats": Counter(
            (reserva.salida_id, seat_type(p.butaca_type)) for p in rows if active
        ),
        "active": active,
    }


def seat_type(value):
    return "cama" if (value or "").strip().lower() == "cama" else "semicama"


def occupied_hotels(db, tenant, package_id=None):
    hotel = func.coalesce(func.nullif(ReservationPassengers.hotel_id, ""), Reservas.hotel_id)
    q = db.query(Reservas.package_id, Reservas.salida_id, hotel, func.count(ReservationPassengers.id)).join(
        ReservationPassengers, ReservationPassengers.reserva_id == Reservas.id
    ).filter(Reservas.iweb_client_id == tenant, Reservas.active.is_not(False))
    if package_id is not None:
        q = q.filter(Reservas.package_id == package_id)
    return {(p, s, h): n for p, s, h, n in q.group_by(Reservas.package_id, Reservas.salida_id, hotel).all()}


def resolve_selection(db, tenant, package_id, salida_id, hotel_id):
    def clean(value):
        return None if not value or value.strip().lower() in {"null", "none", "undefined"} else value.strip()

    package_id, salida_id, hotel_id = map(clean, (package_id, salida_id, hotel_id))
    q = db.query(PackagesDatesOfExit).filter_by(iweb_client_id=tenant, active=True)
    if package_id:
        q = q.filter_by(package_id=package_id)
    if salida_id:
        q = q.filter_by(salida_id=salida_id)
    choices = {(r.package_id, r.salida_id) for r in q.all()}
    if len(choices) != 1:
        raise HTTPException(400, "Seleccioná un paquete y una salida válidos y sin ambigüedad")
    package_id, salida_id = choices.pop()
    package = db.query(Packages).filter_by(id=package_id, iweb_client_id=tenant).first()
    salida = db.query(Salidas).filter_by(id=salida_id, iweb_client_id=tenant).first()
    if not package or not salida:
        raise HTTPException(400, "El paquete o la salida no pertenecen a la agencia")
    hotels = {h.hotel_id for h in db.query(PackageHotels).filter_by(
        package_id=package_id, iweb_client_id=tenant
    ).all() if h.hotel_id}
    if hotel_id is None and len(hotels) == 1:
        hotel_id = next(iter(hotels))
    if hotel_id not in hotels:
        raise HTTPException(400, "Seleccioná un hotel del paquete para controlar su cupo")
    return package_id, salida_id, hotel_id


def validate_reservation(db, reserva, previous=None):
    """Validate pending final state. On rejection the dependency rolls it back."""
    db.flush()
    rows = passengers_for(db, reserva)
    for passenger in rows:
        if passenger.hotel_id is not None:
            passenger.hotel_id = passenger.hotel_id.strip() or None
    db.flush()
    passenger_ids = {p.pasajero_id for p in rows}
    if passenger_ids:
        found = db.query(Passengers.id).filter(
            Passengers.iweb_client_id == reserva.iweb_client_id, Passengers.id.in_(passenger_ids)
        ).count()
        if found != len(passenger_ids):
            raise HTTPException(400, "Hay pasajeros que no pertenecen a esta agencia")
    if reserva.active is False:
        return
    tenant = reserva.iweb_client_id
    before_hotels = previous["hotels"] if previous else Counter()
    before_seats = previous["seats"] if previous else Counter()
    current = snapshot(db, reserva)
    changed_selection = previous is None or current["selection"] != previous["selection"]
    increasing = any(n > before_hotels[k] for k, n in current["hotels"].items())
    reactivating = previous is not None and not previous["active"]
    if previous and previous["selection"][0] and not reserva.package_id:
        raise HTTPException(400, "No se puede quitar el paquete de una reserva vigente")
    if (changed_selection or increasing or reactivating) and (previous is None or reserva.package_id):
        reserva.package_id, reserva.salida_id, reserva.hotel_id = resolve_selection(
            db, tenant, reserva.package_id, reserva.salida_id, reserva.hotel_id
        )
        db.flush()
        current = snapshot(db, reserva)
    elif not reserva.package_id:
        salida = db.query(Salidas).filter_by(id=reserva.salida_id, iweb_client_id=tenant).first()
        if not salida:
            raise HTTPException(400, "Salida no encontrada")

    if reserva.package_id:
        hotel_keys = set(current["hotels"])
        if changed_selection or reactivating:
            hotel_keys.add((reserva.package_id, reserva.salida_id, reserva.hotel_id))
        occupied = occupied_hotels(db, tenant, reserva.package_id)
        valid_hotels = {h.hotel_id for h in db.query(PackageHotels).filter_by(
            package_id=reserva.package_id, iweb_client_id=tenant
        ).all()}
        for key in hotel_keys:
            requested = current["hotels"][key]
            if previous and not changed_selection and not reactivating and requested <= before_hotels[key]:
                continue  # Legacy bookings can be corrected or reduced without inventing capacity.
            package_id, salida_id, hotel_id = key
            if hotel_id not in valid_hotels:
                raise HTTPException(400, "El hotel de un pasajero no pertenece al paquete")
            cap = db.query(PackageHotelCapacity).filter_by(
                iweb_client_id=tenant, package_id=package_id, salida_id=salida_id, hotel_id=hotel_id
            ).first()
            if cap is None:
                raise HTTPException(400, "Cupo hotelero sin configurar para el hotel y la salida seleccionados")
            used = occupied.get(key, 0)
            if used > cap.capacidad or (cap.capacidad == 0 and requested == 0):
                available = max(0, cap.capacidad - (used - requested))
                raise HTTPException(400, f"Cupo hotelero insuficiente. Requeridos: {requested}, Disponibles: {available}")

    if current["seats"]:
        salida = db.query(Salidas).filter_by(id=reserva.salida_id, iweb_client_id=tenant).first()
        if not salida:
            raise HTTPException(400, "Salida no encontrada")
        all_seats = db.query(ReservationPassengers.butaca_type).join(
            Reservas, Reservas.id == ReservationPassengers.reserva_id
        ).filter(Reservas.iweb_client_id == tenant, Reservas.salida_id == salida.id,
                 Reservas.active.is_not(False)).all()
        used = Counter(seat_type(t) for (t,) in all_seats)
        for key, requested in current["seats"].items():
            if previous and requested <= before_seats[key]:
                continue
            kind = key[1]
            total = getattr(salida, kind) or 0
            if used[kind] > total:
                available = max(0, total - (used[kind] - requested))
                raise HTTPException(400, f"Butacas {kind.upper()} insuficientes. Requeridos: {requested}, Disponibles: {available}")


def save_package_capacity(db, tenant, package_id, dates, hotels):
    """Reconcile stable business keys, independently of package_hotels row IDs."""
    dates = set(dates)
    ids = [h.hotel_id for h in hotels if h.hotel_id]
    if len(ids) != len(set(ids)):
        raise HTTPException(400, "No repitas el mismo hotel dentro del paquete")
    hotel_ids = set(ids)
    if dates and db.query(Salidas).filter(Salidas.iweb_client_id == tenant, Salidas.id.in_(dates)).count() != len(dates):
        raise HTTPException(400, "Hay salidas que no pertenecen a la agencia")
    if hotel_ids and db.query(Hotels).filter(Hotels.iweb_client_id == tenant, Hotels.id.in_(hotel_ids)).count() != len(hotel_ids):
        raise HTTPException(400, "Hay hoteles que no pertenecen a la agencia")
    occupied = occupied_hotels(db, tenant, package_id)
    active = db.query(Reservas).filter_by(iweb_client_id=tenant, package_id=package_id).filter(Reservas.active.is_not(False)).all()
    for r in active:
        assigned = {p.hotel_id or r.hotel_id for p in passengers_for(db, r)} or {r.hotel_id}
        if r.salida_id not in dates or any(h not in hotel_ids for h in assigned if h):
            raise HTTPException(400, "No se puede quitar un hotel o salida con reservas vigentes")
    existing = db.query(PackageHotelCapacity).filter_by(iweb_client_id=tenant, package_id=package_id).all()
    by_key = {(c.hotel_id, c.salida_id): c for c in existing}
    desired = {k: c.capacidad for k, c in by_key.items() if k[0] in hotel_ids and k[1] in dates}
    for hotel in hotels:
        cupos = getattr(hotel, "cupos", None)
        if cupos is None:
            continue  # Older API clients and metadata-only edits preserve capacities.
        for key in list(desired):
            if key[0] == hotel.hotel_id:
                del desired[key]
        seen = set()
        for c in cupos:
            if c.salida_id not in dates or c.salida_id in seen:
                raise HTTPException(400, "El cupo debe corresponder a una salida del paquete sin repetirse")
            seen.add(c.salida_id)
            desired[hotel.hotel_id, c.salida_id] = c.capacidad
    for (_, salida_id, hotel_id), count in occupied.items():
        key = (hotel_id, salida_id)
        # Missing legacy capacity stays missing, but cannot be explicitly cleared.
        if (key in desired and desired[key] < count) or (key in by_key and key not in desired and count):
            raise HTTPException(400, "El cupo hotelero no puede ser menor a los pasajeros ya reservados")
    for key, row in by_key.items():
        if key not in desired:
            db.delete(row)
    for (hotel_id, salida_id), capacity in desired.items():
        row = by_key.get((hotel_id, salida_id))
        if row:
            row.capacidad = capacity
        else:
            db.add(PackageHotelCapacity(id=str(uuid.uuid4()), iweb_client_id=tenant,
                package_id=package_id, hotel_id=hotel_id, salida_id=salida_id, capacidad=capacity))


def hotel_availability(db, tenant, package_id):
    occupied = occupied_hotels(db, tenant, package_id)
    caps = {(c.hotel_id, c.salida_id): c.capacidad for c in db.query(PackageHotelCapacity).filter_by(
        iweb_client_id=tenant, package_id=package_id
    ).all()}
    dates = db.query(PackagesDatesOfExit).filter_by(iweb_client_id=tenant, package_id=package_id, active=True).all()
    hotels = db.query(PackageHotels).filter_by(iweb_client_id=tenant, package_id=package_id).all()
    return [dict(hotel_id=h.hotel_id, salida_id=d.salida_id,
                 capacidad=caps.get((h.hotel_id, d.salida_id)),
                 ocupacion=occupied.get((package_id, d.salida_id, h.hotel_id), 0),
                 disponible=max(0, caps.get((h.hotel_id, d.salida_id), 0) - occupied.get((package_id, d.salida_id, h.hotel_id), 0)))
            for h in hotels for d in dates if h.hotel_id]
