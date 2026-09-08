import { getRoomCapacity, parseRoomTypes, RoomTypeDetails } from "./formatRooms";

type PassengerHotel = { hotel_id?: string | null; room_index?: number | null };
export type ReservationHotelGroup = { hotelId: string | null; rooms: RoomTypeDetails[] };

/** Use assigned passenger hotels; the reservation hotel is only a legacy fallback. */
export function reservationHotelGroups(
  roomTypes: string | string[] | null | undefined,
  passengers: PassengerHotel[],
  defaultHotelId?: string | null,
): ReservationHotelGroup[] {
  const rooms = parseRoomTypes(roomTypes);
  const indexes = new Set(passengers.map(p => p.room_index).filter(i => i != null));
  const legacy = rooms.length > 1 && (indexes.size === 0 || (indexes.size === 1 && indexes.has(0)));
  const groups = new Map<string | null, ReservationHotelGroup>();
  const add = (hotelId: string | null, room?: RoomTypeDetails) => {
    if (!groups.has(hotelId)) groups.set(hotelId, { hotelId, rooms: [] });
    if (room) groups.get(hotelId)!.rooms.push(room);
  };
  let offset = 0;
  rooms.forEach((room, index) => {
    const capacity = getRoomCapacity(room);
    const occupants = legacy ? passengers.slice(offset, offset + capacity)
      : passengers.filter(p => (p.room_index ?? 0) === index);
    offset += capacity;
    const hotelIds = new Set(occupants.map(p => p.hotel_id || defaultHotelId || null));
    if (hotelIds.size === 0) hotelIds.add(defaultHotelId || null);
    hotelIds.forEach(hotelId => add(hotelId, room));
  });
  // Group bookings can have passengers without an explicit room configuration.
  if (rooms.length === 0) passengers.forEach(p => add(p.hotel_id || defaultHotelId || null));
  if (groups.size === 0) add(defaultHotelId || null);
  return [...groups.values()];
}
