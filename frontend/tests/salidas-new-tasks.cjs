const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = relative => fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
const list = read('app/salidas/lista/[id]/page.tsx');
const ticketOffice = read('app/salidas/lista/[id]/butacas/page.tsx');
const voucher = read('app/voucher/[id]/page.tsx');
const addDeparture = read('app/salidas/agregar-salida/page.tsx');

assert.match(list, /const exportRows = visiblePasajeros/);
assert.match(list, /disabled=\{units\.length > 1 && !selectedMicro\}/);
assert.match(list, /microNumber: selectedMicro\?\.number/);
assert.match(list, /units\.length > 1 && selectedMicro/);
assert.match(ticketOffice, /microNumber: selectedUnit\.number/g);
assert.match(ticketOffice, /if \(!selectedUnit\) return;/g);
assert.match(voucher, /voucherData\.coordinador_telefono/);
assert.match(addDeparture, /!terrestrial \|\| !hasUnits/);
assert.match(addDeparture, /passengers: parseInt\(pasajerosTotales\)/);

console.log('salidas new tasks wiring: passed');
