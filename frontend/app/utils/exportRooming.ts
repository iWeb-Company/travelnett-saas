import ExcelJS from "exceljs";
import type { RoomingHotel, RoomingRoom, RoomingRoomCategory } from "@/lib/roomingData";

export interface RoomingExportData {
  hotel: RoomingHotel;
  destino: string;
  checkIn: string;
  checkOut: string;
  regimen: string;
}

const ROOM_TYPE_LABELS: Record<RoomingRoomCategory, string> = {
  doble_matrimonial: "Dobles Matrimoniales",
  doble_individual: "Dobles Individuales",
  single_individual: "Singles / Individuales",
  triple_individual: "Triples Individuales",
  cuadruple_individual: "Cuadruples Individuales",
  otras_habitaciones: "Otras Habitaciones",
};

const ROOM_TYPES = Object.keys(ROOM_TYPE_LABELS) as RoomingRoomCategory[];
const ROOM_COLUMNS = [1, 3, 5, 7, 9, 11, 13];

type TemplateStyles = {
  header: Partial<ExcelJS.Style>;
  section: Partial<ExcelJS.Style>[];
  roomNumber: Partial<ExcelJS.Style>[];
  passenger: Partial<ExcelJS.Style>[];
  loading: Partial<ExcelJS.Style>[];
  summaryLabel: Partial<ExcelJS.Style>;
  summaryValue: Partial<ExcelJS.Style>;
  summaryLastValue: Partial<ExcelJS.Style>;
  summaryTotalLabel: Partial<ExcelJS.Style>;
  summaryTotalValue: Partial<ExcelJS.Style>;
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function captureTemplateStyles(sheet: ExcelJS.Worksheet): TemplateStyles {
  return {
    header: clone(sheet.getCell("A1").style),
    section: Array.from({ length: 13 }, (_, index) => clone(sheet.getCell(6, index + 1).style)),
    roomNumber: ROOM_COLUMNS.map((column) => clone(sheet.getCell(7, column).style)),
    passenger: ROOM_COLUMNS.map((column) => clone(sheet.getCell(8, column).style)),
    loading: ROOM_COLUMNS.map((column) => clone(sheet.getCell(10, column).style)),
    summaryLabel: clone(sheet.getCell("E39").style),
    summaryValue: clone(sheet.getCell("G39").style),
    summaryLastValue: clone(sheet.getCell("I39").style),
    summaryTotalLabel: clone(sheet.getCell("E46").style),
    summaryTotalValue: clone(sheet.getCell("G46").style),
  };
}

function applyStyle(cell: ExcelJS.Cell, style: Partial<ExcelJS.Style>) {
  cell.style = clone(style);
}

function addTemplateSheet(workbook: ExcelJS.Workbook, source: ExcelJS.Worksheet, styles: TemplateStyles) {
  const sheet = workbook.addWorksheet("ROOMING");
  source.columns.forEach((column, index) => {
    sheet.getColumn(index + 1).width = column.width;
    if (column.hidden !== undefined) sheet.getColumn(index + 1).hidden = column.hidden;
  });
  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  sheet.pageSetup.margins = clone(source.pageSetup.margins);
  return { sheet, styles };
}

function writeSectionHeader(sheet: ExcelJS.Worksheet, row: number, label: string, styles: TemplateStyles) {
  styles.section.forEach((style, index) => applyStyle(sheet.getCell(row, index + 1), style));
  sheet.getCell(row, 1).value = label;
  sheet.getRow(row).height = 15;
}

function writeRoomBlock(sheet: ExcelJS.Worksheet, row: number, rooms: RoomingRoom[], roomOffset: number, styles: TemplateStyles) {
  const maxPassengers = Math.max(...rooms.map((room) => room.passengers.length), 1);
  const loadingRow = row + maxPassengers + 1;

  rooms.forEach((room, index) => {
    const column = ROOM_COLUMNS[index];
    const numberCell = sheet.getCell(row, column);
    numberCell.value = roomOffset + index + 1;
    applyStyle(numberCell, styles.roomNumber[index]);

    for (let passengerIndex = 0; passengerIndex < maxPassengers; passengerIndex += 1) {
      const passengerCell = sheet.getCell(row + passengerIndex + 1, column);
      passengerCell.value = room.passengers[passengerIndex]?.name?.toUpperCase() || "";
      applyStyle(passengerCell, styles.passenger[index]);
    }

    const loadingCell = sheet.getCell(loadingRow, column);
    loadingCell.value = Array.from(new Set(room.passengers.map((passenger) => passenger.loadingPlace)))
      .filter(Boolean)
      .join(" / ")
      .toUpperCase();
    applyStyle(loadingCell, styles.loading[index]);
  });

  return loadingRow;
}

function writeRoomType(sheet: ExcelJS.Worksheet, startRow: number, label: string, rooms: RoomingRoom[], styles: TemplateStyles) {
  if (!rooms.length) return startRow;
  writeSectionHeader(sheet, startRow, label, styles);

  let row = startRow + 1;
  for (let index = 0; index < rooms.length; index += ROOM_COLUMNS.length) {
    const block = rooms.slice(index, index + ROOM_COLUMNS.length);
    row = writeRoomBlock(sheet, row, block, index, styles) + 1;
  }
  return row + 1;
}

function writeSummary(sheet: ExcelJS.Worksheet, startRow: number, hotel: RoomingHotel, styles: TemplateStyles) {
  sheet.getCell(startRow, 7).value = "Habitaciones";
  sheet.getCell(startRow, 9).value = "Pasajeros";
  sheet.getRow(startRow).height = 15;

  const entries = ROOM_TYPES.filter((type) => hotel.roomTypes[type].length);
  const firstDataRow = startRow + 2;
  entries.forEach((type, index) => {
    const row = firstDataRow + index;
    const rooms = hotel.roomTypes[type];
    sheet.getCell(row, 5).value = ROOM_TYPE_LABELS[type];
    sheet.getCell(row, 7).value = rooms.length;
    sheet.getCell(row, 9).value = rooms.reduce((sum, room) => sum + room.passengers.length, 0);
    applyStyle(sheet.getCell(row, 5), styles.summaryLabel);
    applyStyle(sheet.getCell(row, 7), styles.summaryValue);
    applyStyle(sheet.getCell(row, 9), styles.summaryLastValue);
  });

  const totalRow = firstDataRow + entries.length;
  sheet.getCell(totalRow, 5).value = "TOTAL";
  sheet.getCell(totalRow, 7).value = { formula: `SUM(G${firstDataRow}:G${totalRow - 1})` };
  sheet.getCell(totalRow, 9).value = { formula: `SUM(I${firstDataRow}:I${totalRow - 1})` };
  applyStyle(sheet.getCell(totalRow, 5), styles.summaryTotalLabel);
  applyStyle(sheet.getCell(totalRow, 7), styles.summaryTotalValue);
  applyStyle(sheet.getCell(totalRow, 9), styles.summaryTotalValue);
  return totalRow;
}

export async function exportRoomingHotelToExcel(data: RoomingExportData) {
  const workbook = new ExcelJS.Workbook();
  const template = await fetch("/ROOMING%20PLANTILLA%20TRANETT.xlsx").catch(() => null);
  if (template?.ok) await workbook.xlsx.load(await template.arrayBuffer());

  const referenceSheet = workbook.worksheets[0] || workbook.addWorksheet("Plantilla");
  const styles = captureTemplateStyles(referenceSheet);
  const { sheet } = addTemplateSheet(workbook, referenceSheet, styles);
  workbook.removeWorksheet(referenceSheet.id);

  [["A1", data.destino], ["A2", `ROOMING HOTEL: ${data.hotel.name}`], ["A3", `IN: ${data.checkIn || "-"}`], ["A4", `OUT: ${data.checkOut || "-"}`], ["A5", `REGIMEN: ${data.regimen || "-"}`]].forEach(([address, value]) => {
    const cell = sheet.getCell(String(address));
    cell.value = String(value).toUpperCase();
    applyStyle(cell, styles.header);
  });

  let row = 6;
  ROOM_TYPES.forEach((type) => {
    row = writeRoomType(sheet, row, ROOM_TYPE_LABELS[type], data.hotel.roomTypes[type], styles);
  });
  const totalRow = writeSummary(sheet, row, data.hotel, styles);
  sheet.pageSetup.printArea = `A1:M${totalRow}`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `Rooming_${data.hotel.name.replace(/[^a-z0-9]+/gi, "_")}_${data.checkIn || "Salida"}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
