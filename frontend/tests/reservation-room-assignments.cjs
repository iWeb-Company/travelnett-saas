const assert = require("node:assert/strict");
const {
  buildReservationRooms,
  hasPersistablePassengerData,
  missingRoomSlotIndexes,
  trimRoomPassengers,
  upsertPassengerInRoomSlot,
} = require("../lib/reservationRoomAssignments.ts");

const passengers = [
  { pasajero_id: "carlos", room_index: 0 },
  { pasajero_id: "alberto", room_index: 0 },
  { pasajero_id: "beatriz", room_index: 1 },
];

assert.deepEqual(
  trimRoomPassengers(passengers, 0, 1).map((passenger) => passenger.pasajero_id),
  ["carlos", "beatriz"],
);

assert.equal(hasPersistablePassengerData({ nombre: " ", apellido: "", dni: "" }), false);
assert.equal(hasPersistablePassengerData({ pasajero_id: "existing-passenger" }), true);
assert.equal(hasPersistablePassengerData({ dni: "12345678" }), true);

assert.deepEqual(
  buildReservationRooms(
    ["doble_matrimonial_estandar", "single_individual_estandar"],
    ["hotel-1", "hotel-2"],
    "fallback-hotel",
  ),
  [
    { position: 0, room_type: "doble_matrimonial_estandar", hotel_id: "hotel-1" },
    { position: 1, room_type: "single_individual_estandar", hotel_id: "hotel-2" },
  ],
);

let duplicatedRoomPassengers = [];
const emptyFirstSlot = { globalIndex: -1, room_index: 0, room_slot_index: 0, dni: "" };
duplicatedRoomPassengers = upsertPassengerInRoomSlot(
  duplicatedRoomPassengers,
  emptyFirstSlot,
  { dni: "1" },
);
duplicatedRoomPassengers = upsertPassengerInRoomSlot(
  duplicatedRoomPassengers,
  { ...emptyFirstSlot, dni: "1" },
  { dni: "12" },
);
assert.equal(duplicatedRoomPassengers.length, 1);
assert.equal(duplicatedRoomPassengers[0].dni, "12");
assert.deepEqual(
  missingRoomSlotIndexes([{ room_index: 0, room_slot_index: 1 }], 2),
  [0],
);

console.log("reservation room assignments: occupancy and room persistence rules pass");
