const assert = require("node:assert/strict");
const { trimRoomPassengers } = require("../lib/reservationRoomAssignments.ts");

const passengers = [
  { pasajero_id: "carlos", room_index: 0 },
  { pasajero_id: "alberto", room_index: 0 },
  { pasajero_id: "beatriz", room_index: 1 },
];

assert.deepEqual(
  trimRoomPassengers(passengers, 0, 1).map((passenger) => passenger.pasajero_id),
  ["carlos", "beatriz"],
);

console.log("reservation room assignments: trims only the last passengers in the resized room");
