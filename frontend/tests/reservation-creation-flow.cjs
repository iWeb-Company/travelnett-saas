const assert = require("node:assert/strict");
const {
  buildReservationStep3Href,
  resolveReservationPackageId,
  shouldShowManualReservationPricing,
} = require("../lib/reservationCreationFlow.ts");

const packageId = "package-with-two-hotels";
const rooms = [
  {
    hotel: "hotel-a",
    tipoCama: "doble",
    distribucion: "matrimonial",
    tipoHabitacion: "estandar",
  },
  {
    hotel: "hotel-b",
    tipoCama: "triple",
    distribucion: "individual",
    tipoHabitacion: "superior",
  },
];

const href = buildReservationStep3Href({
  destinoId: "destination",
  clienteId: "client",
  tipoReserva: "tradicional",
  itemId: "departure",
  itemType: "salida",
  salidaId: "departure",
  packageId,
  rooms,
});
const params = new URL(href, "http://localhost").searchParams;

assert.equal(params.get("paquete"), packageId);
assert.deepEqual(JSON.parse(params.get("rooms") || "[]"), rooms);
assert.equal(
  resolveReservationPackageId({
    packageId: params.get("paquete"),
    itemId: params.get("item"),
    itemType: params.get("itemType"),
  }),
  packageId,
);
assert.equal(shouldShowManualReservationPricing(packageId), false);
assert.equal(shouldShowManualReservationPricing(""), true);

console.log("reservation creation flow: package and multi-hotel rooms preserved");
