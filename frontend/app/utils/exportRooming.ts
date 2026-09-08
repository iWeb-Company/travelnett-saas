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
// One visible room per wide column. The narrow columns are only separators.
const ROOM_COLUMNS = [1, 3, 5, 7, 9, 11, 13];
const COLUMN_WIDTHS = [27, 1.89, 25.22, 1.89, 25.22, 1.89, 27.33, 1.89, 25.22, 1.89, 26.11, 1.89, 22.78];
const THIN = { style: "thin" as const };
const MEDIUM = { style: "medium" as const };
const SECTION_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFB4C7E7" } };
const LOADING_FILL = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FFFFFFCC" } };

function configureSheet(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet("ROOMING");
  COLUMN_WIDTHS.forEach((width, index) => { sheet.getColumn(index + 1).width = width; });
  sheet.views = [{ showGridLines: false }];
  sheet.pageSetup = { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 };
  sheet.pageSetup.margins = { left: 0.25, right: 0.25, top: 0.4, bottom: 0.4, header: 0.1, footer: 0.1 };
  return sheet;
}

function writeSectionHeader(sheet: ExcelJS.Worksheet, row: number, label: string) {
  for (let column = 1; column <= 13; column += 1) {
    const cell = sheet.getCell(row, column);
    cell.fill = SECTION_FILL;
    cell.font = { name: "Arial", size: 8, bold: true };
    cell.alignment = { horizontal: "left", vertical: "middle" };
    cell.border = {
      top: MEDIUM,
      bottom: MEDIUM,
      ...(column === 1 ? { left: MEDIUM } : {}),
      ...(column === 13 ? { right: MEDIUM } : {}),
    };
  }
  sheet.getCell(row, 1).value = label;
  sheet.getRow(row).height = 15;
}

function writeRoomBlock(sheet: ExcelJS.Worksheet, row: number, rooms: RoomingRoom[], roomOffset: number) {
  const maxPassengers = Math.max(...rooms.map((room) => room.passengers.length), 1);
  const loadingRow = row + maxPassengers + 1;

  rooms.forEach((room, index) => {
    const column = ROOM_COLUMNS[index];
    const numberCell = sheet.getCell(row, column);
    numberCell.value = roomOffset + index + 1;
    numberCell.font = { name: "Arial", size: 8, bold: true };
    numberCell.alignment = { horizontal: "left", vertical: "middle" };

    for (let passengerIndex = 0; passengerIndex < maxPassengers; passengerIndex += 1) {
      const passengerCell = sheet.getCell(row + passengerIndex + 1, column);
      passengerCell.value = room.passengers[passengerIndex]?.name?.toUpperCase() || "";
      passengerCell.font = { name: "Calibri", size: 9 };
      passengerCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      passengerCell.border = { top: THIN, right: THIN, bottom: THIN, left: THIN };
    }

    const loadingCell = sheet.getCell(loadingRow, column);
    loadingCell.value = Array.from(new Set(room.passengers.map((passenger) => passenger.loadingPlace)))
      .filter(Boolean)
      .join(" / ")
      .toUpperCase();
    loadingCell.fill = LOADING_FILL;
    loadingCell.font = { name: "Arial", size: 8, bold: true, italic: true };
    loadingCell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
    loadingCell.border = { right: THIN, bottom: THIN, left: THIN };
  });
  return loadingRow;
}

function writeRoomType(sheet: ExcelJS.Worksheet, startRow: number, label: string, rooms: RoomingRoom[]) {
  if (!rooms.length) return startRow;
  writeSectionHeader(sheet, startRow, label);

  let row = startRow + 1;
  for (let index = 0; index < rooms.length; index += ROOM_COLUMNS.length) {
    const block = rooms.slice(index, index + ROOM_COLUMNS.length);
    row = writeRoomBlock(sheet, row, block, index) + 1;
  }
  return row + 1;
}

function writeSummary(sheet: ExcelJS.Worksheet, startRow: number, hotel: RoomingHotel) {
  sheet.getCell(startRow, 7).value = "Habitaciones";
  sheet.getCell(startRow, 9).value = "Pasajeros";
  [7, 9].forEach((column) => {
    const cell = sheet.getCell(startRow, column);
    cell.font = { name: "Arial", size: 8 };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  });

  const entries = ROOM_TYPES.filter((type) => hotel.roomTypes[type].length);
  const firstDataRow = startRow + 2;
  entries.forEach((type, index) => {
    const row = firstDataRow + index;
    const rooms = hotel.roomTypes[type];
    const label = sheet.getCell(row, 5);
    label.value = ROOM_TYPE_LABELS[type];
    label.font = { name: "Arial", size: 8 };
    label.alignment = { horizontal: "left", vertical: "middle" };
    label.border = { top: THIN, right: THIN, bottom: THIN, left: MEDIUM };
    [7, 9].forEach((column) => {
      const cell = sheet.getCell(row, column);
      cell.value = column === 7 ? rooms.length : rooms.reduce((sum, room) => sum + room.passengers.length, 0);
      cell.font = { name: "Arial", size: 8 };
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = { top: THIN, right: column === 9 ? MEDIUM : THIN, bottom: THIN, left: THIN };
    });
  });

  const totalRow = firstDataRow + entries.length;
  const totalLabel = sheet.getCell(totalRow, 5);
  totalLabel.value = "TOTAL";
  totalLabel.font = { name: "Arial", size: 8, bold: true };
  totalLabel.alignment = { horizontal: "left", vertical: "middle" };
  totalLabel.border = { top: MEDIUM, right: MEDIUM, bottom: MEDIUM, left: MEDIUM };
  [7, 9].forEach((column) => {
    const cell = sheet.getCell(totalRow, column);
    cell.value = { formula: `SUM(${column === 7 ? "G" : "I"}${firstDataRow}:${column === 7 ? "G" : "I"}${totalRow - 1})` };
    cell.font = { name: "Arial", size: 8, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { top: MEDIUM, right: MEDIUM, bottom: MEDIUM, left: MEDIUM };
  });
  return totalRow;
}

export async function exportRoomingHotelToExcel(data: RoomingExportData) {
  const workbook = new ExcelJS.Workbook();
  const sheet = configureSheet(workbook);

  [["A1", data.destino], ["A2", `ROOMING HOTEL: ${data.hotel.name}`], ["A3", `IN: ${data.checkIn || "-"}`], ["A4", `OUT: ${data.checkOut || "-"}`], ["A5", `REGIMEN: ${data.regimen || "-"}`]].forEach(([address, value]) => {
    const cell = sheet.getCell(String(address));
    cell.value = String(value).toUpperCase();
    cell.font = { name: "Arial", size: 8, bold: true };
    cell.alignment = { horizontal: "left", vertical: "middle" };
  });

  let row = 6;
  ROOM_TYPES.forEach((type) => {
    row = writeRoomType(sheet, row, ROOM_TYPE_LABELS[type], data.hotel.roomTypes[type]);
  });
  const totalRow = writeSummary(sheet, row, data.hotel);
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
