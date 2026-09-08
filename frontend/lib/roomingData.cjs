const { getRoomCapacity, parseRoomItem, parseRoomTypes } = require("./formatRooms.ts");
const { formatFullName, formatPassengerName } = require("./formatPassengerName.ts");

const ROOM_CATEGORIES = [
  "doble_matrimonial", "doble_individual", "single_individual",
  "triple_individual", "cuadruple_individual", "otras_habitaciones",
];

function categoryForRoom(type) {
  const parsed = parseRoomItem(type);
  if (parsed.camaCode === "DBL" && parsed.distribucionCode === "MAT") return "doble_matrimonial";
  if (parsed.camaCode === "DBL" && ["IND", "TWN"].includes(parsed.distribucionCode)) return "doble_individual";
  if (parsed.camaCode === "SGL") return "single_individual";
  if (parsed.camaCode === "TPL") return "triple_individual";
  if (parsed.camaCode === "CPL") return "cuadruple_individual";
  return "otras_habitaciones";
}

function passengerDetails(passenger, reservation) {
  const name = passenger.name || passenger.last_name
    ? formatPassengerName(passenger.name, passenger.last_name)
    : formatFullName(passenger.nombre_completo || reservation.nombre_completo || "") || "DESCONOCIDO";
  return { name, loadingPlace: passenger.lugar_carga_nombre || reservation.lugar_carga_nombre || "-" };
}

function buildRoomingRooms(reservations, hotelId) {
  const rooms = [];
  let roomCounter = 1;
  reservations.forEach((reservation) => {
    const allPassengers = reservation.reservation_passengers?.length ? reservation.reservation_passengers : [reservation];
    const passengers = allPassengers.filter((passenger) => (passenger.hotel_id || reservation.hotel_id || "") === hotelId);
    if (!passengers.length) return;
    const roomDefinitions = parseRoomTypes(reservation.room_type);
    const configuredRooms = roomDefinitions.length ? roomDefinitions : [parseRoomItem("doble_matrimonial_estandar")];
    const addRoom = (roomIndex, roomPassengers) => {
      if (!roomPassengers.length) return;
      const type = configuredRooms[roomIndex]?.raw || configuredRooms[0].raw || "doble_matrimonial_estandar";
      const suffix = configuredRooms.length > 1 ? ` (${roomIndex + 1})` : "";
      rooms.push({
        id: reservation.rooming_id ? `${reservation.rooming_id}${suffix}` : `${reservation.codigo_reserva || "Res"}-H${roomCounter++}`,
        type,
        category: categoryForRoom(type),
        passengers: roomPassengers.map((passenger) => passengerDetails(passenger, reservation)),
      });
    };
    if (passengers.some((passenger) => passenger.room_index !== undefined && passenger.room_index !== null)) {
      const byRoom = new Map();
      passengers.forEach((passenger) => {
        const roomIndex = Number(passenger.room_index) || 0;
        byRoom.set(roomIndex, [...(byRoom.get(roomIndex) || []), passenger]);
      });
      Array.from(byRoom.entries()).sort(([left], [right]) => left - right)
        .forEach(([roomIndex, roomPassengers]) => addRoom(roomIndex, roomPassengers));
      return;
    }
    let passengerIndex = 0;
    configuredRooms.forEach((room, roomIndex) => {
      const assigned = roomIndex === configuredRooms.length - 1
        ? passengers.slice(passengerIndex)
        : passengers.slice(passengerIndex, passengerIndex + getRoomCapacity(room));
      passengerIndex += assigned.length;
      addRoom(roomIndex, assigned);
    });
    if (passengerIndex < passengers.length) addRoom(0, passengers.slice(passengerIndex));
  });
  return rooms;
}

function buildRoomingHotels(reservations, hotelNames) {
  const activeReservations = reservations.filter((reservation) => reservation.active !== false);
  const hotelIds = [...new Set(activeReservations.flatMap((reservation) => {
    const passengers = reservation.reservation_passengers?.length ? reservation.reservation_passengers : [reservation];
    return passengers.map((passenger) => passenger.hotel_id || reservation.hotel_id || "");
  }))];
  return hotelIds.map((hotelId) => {
    const rooms = buildRoomingRooms(activeReservations, hotelId);
    const roomTypes = Object.fromEntries(ROOM_CATEGORIES.map((category) => [category, rooms.filter((room) => room.category === category)]));
    return {
      id: hotelId,
      name: hotelNames[hotelId] || (hotelId ? "Hotel" : "Sin hotel asignado"),
      rooms,
      roomTypes,
      summary: { rooms: rooms.length, passengers: rooms.reduce((total, room) => total + room.passengers.length, 0) },
    };
  }).filter((hotel) => hotel.rooms.length > 0);
}

module.exports = { ROOM_CATEGORIES, buildRoomingRooms, buildRoomingHotels };
