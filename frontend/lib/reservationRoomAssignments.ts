export interface RoomAssignedPassenger {
  room_index?: number | null;
}

export interface RoomSlotPassenger extends RoomAssignedPassenger {
  globalIndex?: number;
  room_slot_index?: number;
  [key: string]: unknown;
}

export interface PersistableReservationPassenger {
  pasajero_id?: string | null;
  nombre?: string | null;
  apellido?: string | null;
  dni?: string | null;
}

export interface ReservationRoomPayload {
  position: number;
  room_type: string;
  hotel_id: string | null;
}

/** Empty visual room slots are not passenger records and must not be persisted. */
export function hasPersistablePassengerData(
  passenger: PersistableReservationPassenger,
): boolean {
  return Boolean(
    passenger.pasajero_id
      || passenger.nombre?.trim()
      || passenger.apellido?.trim()
      || passenger.dni?.trim(),
  );
}

/** Build the room contract independently from passenger occupancy. */
export function buildReservationRooms(
  roomTypes: string[],
  hotelIds: Array<string | null | undefined>,
  defaultHotelId?: string | null,
): ReservationRoomPayload[] {
  return roomTypes.map((roomType, position) => ({
    position,
    room_type: roomType,
    hotel_id: hotelIds[position] || defaultHotelId || null,
  }));
}

/**
 * Update one rendered room slot. Empty slots do not have a database/global
 * index yet, so their stable identity is the room plus their local position.
 */
export function upsertPassengerInRoomSlot<T extends RoomSlotPassenger>(
  passengers: T[],
  target: T,
  changes: Partial<T>,
): T[] {
  const globalIndex = target.globalIndex ?? -1;
  let targetIndex = globalIndex >= 0 && passengers[globalIndex]
    ? globalIndex
    : passengers.findIndex(
        (passenger) =>
          (passenger.room_index ?? 0) === (target.room_index ?? 0)
          && passenger.room_slot_index === target.room_slot_index,
      );

  if (targetIndex < 0) {
    return [...passengers, { ...target, ...changes }];
  }

  const result = [...passengers];
  result[targetIndex] = { ...result[targetIndex], ...changes };
  return result;
}

export function missingRoomSlotIndexes(
  passengers: RoomSlotPassenger[],
  capacity: number,
): number[] {
  const occupied = new Set(
    passengers
      .map((passenger) => passenger.room_slot_index)
      .filter((slot): slot is number => slot !== undefined && slot >= 0 && slot < capacity),
  );
  return Array.from({ length: capacity }, (_, slot) => slot).filter(
    (slot) => !occupied.has(slot),
  );
}

/**
 * Keep the first passengers assigned to one room and leave every other room
 * untouched. Passenger master records are never affected by this UI helper.
 */
export function trimRoomPassengers<T extends RoomAssignedPassenger>(
  passengers: T[],
  roomIndex: number,
  capacity: number,
): T[] {
  let keptInRoom = 0;

  return passengers.filter((passenger) => {
    const assignedRoom = passenger.room_index ?? 0;
    if (assignedRoom !== roomIndex) return true;
    if (keptInRoom >= capacity) return false;
    keptInRoom += 1;
    return true;
  });
}
