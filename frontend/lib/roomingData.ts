export type RoomingRoomCategory =
  | "doble_matrimonial"
  | "doble_individual"
  | "single_individual"
  | "triple_individual"
  | "cuadruple_individual"
  | "otras_habitaciones";

export type RoomingPassenger = { name: string; loadingPlace: string };
export type RoomingRoom = { id: string; type: string; category: RoomingRoomCategory; passengers: RoomingPassenger[] };
export type RoomingHotel = {
  id: string;
  name: string;
  rooms: RoomingRoom[];
  roomTypes: Record<RoomingRoomCategory, RoomingRoom[]>;
  summary: { rooms: number; passengers: number };
};

const roomingData = require("./roomingData.cjs") as {
  ROOM_CATEGORIES: RoomingRoomCategory[];
  buildRoomingRooms: (reservations: any[], hotelId: string) => RoomingRoom[];
  buildRoomingHotels: (reservations: any[], hotelNames: Record<string, string>) => RoomingHotel[];
  getRoomingPackageHotelDate: (
    packageInfo: any,
    reservations: any[],
    hotelId: string,
  ) => string | undefined;
};

export const ROOM_CATEGORIES = roomingData.ROOM_CATEGORIES;
export const buildRoomingRooms = roomingData.buildRoomingRooms;
export const buildRoomingHotels = roomingData.buildRoomingHotels;
export const getRoomingPackageHotelDate = roomingData.getRoomingPackageHotelDate;
