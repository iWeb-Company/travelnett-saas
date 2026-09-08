"""Resolve persisted room indexes and per-passenger hotels, with legacy fallback."""
from collections import defaultdict


def room_capacity(room):
    value = str(room).lower()
    for prefixes, capacity in ((("dbl", "doble"), 2), (("tpl", "triple"), 3),
                               (("cpl", "qpl", "cuadruple"), 4), (("qtl", "dep", "quintuple"), 5)):
        if value.startswith(prefixes):
            return capacity
    return 1


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
