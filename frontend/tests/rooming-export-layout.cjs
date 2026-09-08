const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const ExcelJS = require("exceljs");

async function loadExporter() {
  const source = fs.readFileSync(path.join(__dirname, "../app/utils/exportRooming.ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "exports", "module", compiled)(require, module.exports, module);
  return module.exports.exportRoomingHotelToExcel;
}

(async () => {
  const exportRoomingHotelToExcel = await loadExporter();
  const originalFetch = global.fetch;
  const originalDocument = global.document;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;
  let download;

  global.fetch = async () => ({ ok: true, arrayBuffer: async () => fs.readFileSync(path.join(__dirname, "../public/ROOMING PLANTILLA TRANETT.xlsx")) });
  global.document = { createElement: () => ({ click() {} }) };
  URL.createObjectURL = (blob) => { download = blob; return "blob:rooming"; };
  URL.revokeObjectURL = () => {};

  try {
    await exportRoomingHotelToExcel({
      destino: "Carlos Paz",
      checkIn: "2026-08-26",
      checkOut: "2026-08-30",
      regimen: "All inclusive",
      hotel: {
        id: "hotel-1",
        name: "Hotel Condado",
        rooms: [],
        roomTypes: {
          doble_matrimonial: [{ passengers: [{ name: "Ana Uno", loadingPlace: "Terminal" }] }],
          doble_individual: [], single_individual: [], triple_individual: [], cuadruple_individual: [], otras_habitaciones: [],
        },
        summary: { rooms: 1, passengers: 1 },
      },
    });
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await download.arrayBuffer());
    const sheet = workbook.worksheets[0];
    assert.equal(sheet.getCell("A1").value, "CARLOS PAZ");
    assert.equal(sheet.getCell("A7").value, 1);
    assert.equal(sheet.getCell("A8").value, "ANA UNO");
    assert.equal(sheet.getColumn(1).width, 27);
    assert.equal(Object.keys(sheet._merges).length, 0);
    console.log("rooming export layout: passed");
  } finally {
    global.fetch = originalFetch;
    global.document = originalDocument;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  }
})().catch((error) => { console.error(error); process.exit(1); });
