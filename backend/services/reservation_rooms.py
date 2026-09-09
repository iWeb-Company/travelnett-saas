"""Resolve persisted room indexes and per-passenger hotels, with legacy fallback."""
from collections import defaultdict
import json
import uuid

from models.models import ReservationPassengers, ReservationRooms


def room_capacity(room):
    value = str(room).lower()
    for prefixes, capacity in ((("dbl", "doble"), 2), (("tpl", "triple"), 3),
                               (("cpl", "qpl", "cuadruple"), 4), (("qtl", "dep", "quintuple"), 5)):
        if value.startswith(prefixes):
            return capacity
    return 1


def parse_room_types(value):
    """Normalize persisted room types without duplicating room-capacity rules."""
    if isinstance(value, (list, tuple)):
        return [str(room).strip() for room in value if str(room).strip()]
    if not value:
        return []
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(room).strip() for room in parsed if str(room).strip()]
        except (TypeError, ValueError):
            pass
        return [room.strip() for room in value.split(",") if room.strip()]
    return [str(value).strip()]


def room_payload_value(room, field, default=None):
    if isinstance(room, dict):
        return room.get(field, default)
    return getattr(room, field, default)


def sync_reservation_rooms(db, reservation, rooms=None):
    """Persist the reservation's rooms while keeping legacy fields compatible.

    Existing rows are kept by position so passenger references remain stable.
    When no explicit payload is supplied, legacy room types and passenger hotel
    assignments are used only to bootstrap reservations that predate this model.
    """
    existing = db.query(ReservationRooms).filter_by(reserva_id=reservation.id).all()
    existing_by_position = {room.position: room for room in existing}
    passengers = db.query(ReservationPassengers).filter_by(reserva_id=reservation.id).all()

    if rooms is None:
        if existing:
            return sorted(existing, key=lambda room: room.position)
        room_types = parse_room_types(reservation.room_type)
        specs = []
        for position, room_type in enumerate(room_types):
            assigned = [p for p in passengers if (p.room_index or 0) == position]
            hotel_id = next((p.hotel_id for p in assigned if p.hotel_id), reservation.hotel_id)
            specs.append((position, room_type, hotel_id))
    else:
        specs = []
        for fallback_position, payload in enumerate(rooms):
            position = room_payload_value(payload, "position", fallback_position)
            room_type = str(room_payload_value(payload, "room_type", "")).strip()
            if not room_type:
                raise ValueError("El tipo de habitación es obligatorio")
            specs.append((int(position), room_type, room_payload_value(payload, "hotel_id")))
        if sorted(position for position, _, _ in specs) != list(range(len(specs))):
            raise ValueError("Las posiciones de las habitaciones deben ser consecutivas")

    kept_ids = set()
    result = []
    for position, room_type, hotel_id in specs:
        room = existing_by_position.get(position)
        if room is None:
            room = ReservationRooms(
                id=str(uuid.uuid4()),
                iweb_client_id=reservation.iweb_client_id,
                reserva_id=reservation.id,
                position=position,
                room_type=room_type,
                hotel_id=hotel_id or reservation.hotel_id,
            )
            db.add(room)
        else:
            room.room_type = room_type
            room.hotel_id = hotel_id or reservation.hotel_id
        kept_ids.add(room.id)
        result.append(room)

    for room in existing:
        if room.id not in kept_ids:
            for passenger in passengers:
                if passenger.reservation_room_id == room.id:
                    passenger.reservation_room_id = None
            db.delete(room)

    reservation.room_type = json.dumps([room.room_type for room in result], ensure_ascii=False)
    db.flush()

    by_position = {room.position: room for room in result}
    for passenger in passengers:
        target = by_position.get(passenger.room_index or 0)
        passenger.reservation_room_id = target.id if target else None
        if target:
            passenger.hotel_id = target.hotel_id
    return result


def clone_reservation_rooms(db, source_reservation, target_reservation):
    source_rooms = sync_reservation_rooms(db, source_reservation)
    return sync_reservation_rooms(db, target_reservation, [
        {"position": room.position, "room_type": room.room_type, "hotel_id": room.hotel_id}
        for room in source_rooms
    ])


def room_details(rooms):
    return [
        {
            "id": room.id,
            "position": room.position,
            "room_type": room.room_type,
            "hotel_id": room.hotel_id,
        }
        for room in sorted(rooms, key=lambda item: item.position)
    ]


def trim_passengers_to_room_capacity(room_types, passengers):
    """Keep only the first occupants of each room and return their resolved index.

    Old bookings that persisted every passenger in room 0 are distributed in room
    order, matching the existing rooming and liquidation fallback.
    """
    rooms = parse_room_types(room_types)
    if not rooms:
        return [(passenger, getattr(passenger, "room_index", 0) or 0) for passenger in passengers]

    raw_indexes = [getattr(passenger, "room_index", None) for passenger in passengers]
    legacy = len(rooms) > 1 and all(index in (None, 0) for index in raw_indexes)
    kept = []

    if legacy:
        room_index = 0
        occupants = 0
        for passenger in passengers:
            while room_index < len(rooms) and occupants >= room_capacity(rooms[room_index]):
                room_index += 1
                occupants = 0
            if room_index >= len(rooms):
                break
            kept.append((passenger, room_index))
            occupants += 1
        return kept

    counts = defaultdict(int)
    for passenger in passengers:
        room_index = getattr(passenger, "room_index", None)
        room_index = 0 if room_index is None else room_index
        if not isinstance(room_index, int) or room_index < 0 or room_index >= len(rooms):
            raise ValueError("La habitación asignada no existe en la reserva")
        if counts[room_index] >= room_capacity(rooms[room_index]):
            continue
        counts[room_index] += 1
        kept.append((passenger, room_index))
    return kept


def hotel_room_groups(rooms, passengers, default_hotel_id, persisted_rooms=None):
    if persisted_rooms:
        groups = []
        for room in sorted(persisted_rooms, key=lambda item: item.position):
            occupants = [
                passenger for passenger in passengers
                if passenger.reservation_room_id == room.id
                or (passenger.reservation_room_id is None and (passenger.room_index or 0) == room.position)
            ]
            groups.append((
                room.position,
                room.room_type,
                room.hotel_id or default_hotel_id,
                occupants,
                len(occupants),
            ))
        return groups

    indexes = {p.room_index for p in passengers if p.room_index is not None}
    legacy = len(rooms) > 1 and (not indexes or indexes == {0})
    offset = 0
    groups = []
    for index, room in enumerate(rooms):
        capacity = room_capacity(room)
        if legacy:
            occupants = passengers[offset:offset + capacity]
        else:
            occupants = [p for p in passengers if (p.room_index or 0) == index]
        offset += capacity
        by_hotel = defaultdict(list)
        for passenger in occupants:
            by_hotel[passenger.hotel_id or default_hotel_id].append(passenger)
        if not by_hotel:
            by_hotel[default_hotel_id] = []
        for hotel_id, pax in by_hotel.items():
            groups.append((index, room, hotel_id, pax, len(pax) if len(by_hotel) > 1 else capacity))
    return groups
