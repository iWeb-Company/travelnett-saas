import assert from "node:assert/strict";
import { reservationHotelGroups } from "../lib/reservationHotels";

const rooms = ["triple_individual_estandar", "triple_individual_estandar"];
const passengers = Array.from({ length: 6 }, (_, index) => ({
  room_index: index < 3 ? 0 : 1,
  hotel_id: index < 3 ? "hotel-a" : "hotel-b",
}));

const groups = reservationHotelGroups(rooms, passengers, "legacy");
assert.deepEqual(groups.map(group => [group.hotelId, group.rooms.length]), [
  ["hotel-a", 1],
  ["hotel-b", 1],
]);
assert.equal(groups[0].rooms[0].label, "Triple Individual Estándar");

const legacy = reservationHotelGroups(rooms, passengers.map(p => ({ ...p, room_index: 0, hotel_id: null })), "legacy");
assert.deepEqual(legacy.map(group => [group.hotelId, group.rooms.length]), [["legacy", 2]]);

const explicitZero = reservationHotelGroups(
  ["doble_matrimonial_estandar"],
  [{ room_index: 0, hotel_id: "hotel-a" }, { room_index: 0, hotel_id: "hotel-a" }],
  "legacy",
);
assert.deepEqual(explicitZero.map(group => group.hotelId), ["hotel-a"]);

console.log("reservationHotelGroups: ok");
