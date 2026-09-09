export interface RoomAssignedPassenger {
  room_index?: number | null;
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
