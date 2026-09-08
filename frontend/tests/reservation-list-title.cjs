const fs = require("fs");
const assert = require("assert");

const source = fs.readFileSync(
  "app/web/reservas/result/page.tsx",
  "utf8",
);

assert.match(
  source,
  /titulo:\s*r\.titulo\s*\|\|\s*null/,
  "El listado debe conservar titulo al pasar la reserva a ReservasCard",
);

console.log("reservation-list-title: passed");
