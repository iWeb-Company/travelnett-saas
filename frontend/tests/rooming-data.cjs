const assert = require("node:assert/strict");
const { buildRoomingHotels } = require("../lib/roomingData.cjs");

const hotels = buildRoomingHotels(
  [
    {
      codigo_reserva: "PAQ-01",
      hotel_id: "hotel-a",
      room_type: '["doble_matrimonial_estandar"]',
      reservation_passengers: [
        { hotel_id: "hotel-a", room_index: 0, name: "Ana", last_name: "Uno", lugar_carga_nombre: "Terminal" },
        { hotel_id: "hotel-a", room_index: 0, name: "Beto", last_name: "Dos", lugar_carga_nombre: "Terminal" },
      ],
    },
    {
      codigo_reserva: "PAQ-02",
      hotel_id: "hotel-a",
      room_type: '["single_individual_estandar"]',
      reservation_passengers: [
        { hotel_id: "hotel-a", room_index: 0, name: "Carla", last_name: "Tres", lugar_carga_nombre: "Centro" },
      ],
    },
    {
      codigo_reserva: "PAQ-03",
      hotel_id: "hotel-b",
      room_type: '["triple_individual_estandar"]',
      reservation_passengers: [
        { hotel_id: "hotel-b", room_index: 0, nombre_completo: "Dani Cuatro" },
        { hotel_id: "hotel-b", room_index: 0, nombre_completo: "Ema Cinco" },
        { hotel_id: "hotel-b", room_index: 0, nombre_completo: "Fede Seis" },
      ],
    },
  ],
  { "hotel-a": "Hotel Compartido", "hotel-b": "Hotel B" },
);

assert.equal(hotels.length, 2);
assert.equal(hotels[0].name, "Hotel Compartido");
assert.equal(hotels[0].rooms.length, 2);
assert.deepEqual(hotels[0].summary, { rooms: 2, passengers: 3 });
assert.equal(hotels[0].roomTypes.doble_matrimonial.length, 1);
assert.equal(hotels[0].roomTypes.single_individual.length, 1);
assert.equal(hotels[0].rooms[0].passengers[0].name, "UNO, ANA");
assert.equal(hotels[0].rooms[0].passengers[0].loadingPlace, "Terminal");
assert.equal(hotels[1].roomTypes.triple_individual.length, 1);
assert.equal(hotels[1].summary.passengers, 3);

console.log("rooming data: hotels consolidate rooms, passengers and totals");
