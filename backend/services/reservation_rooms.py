"""Resolve persisted room indexes and per-passenger hotels, with legacy fallback."""
from collections import defaultdict
import json


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


def hotel_room_groups(rooms, passengers, default_hotel_id):
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
