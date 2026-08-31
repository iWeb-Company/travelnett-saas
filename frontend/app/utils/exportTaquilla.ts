import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import { TaquillaLayout, TaquillaRow } from "./taquillaLayout";

export interface PasajeroTaquilla {
  id: string;
  nombre: string;
  localidad: string;
  pasajero_id?: string;
  pasajero_type?: string;
  uniqueId?: string;
}

export interface ExportTaquillaData {
  transportCompany?: string | null;
  destinoName?: string | null;
  salidaDate?: string | null;
  logoUrl?: string | null;
  asignaciones: Record<string, PasajeroTaquilla>;
  layout: TaquillaLayout;
}

const THIN = { style: "thin" as const };

function borderBox(): Partial<ExcelJS.Borders> {
  return { top: THIN, left: THIN, right: THIN, bottom: THIN };
}

function writeSeat(
  worksheet: ExcelJS.Worksheet,
  row: number,
  column: number,
  seat: number | null,
  passenger: PasajeroTaquilla | undefined
) {
  const numberCell = worksheet.getCell(row, column);
  const nameCell = worksheet.getCell(row, column + 1);
  const localityCell = worksheet.getCell(row + 1, column + 1);

  numberCell.border = borderBox();
  nameCell.border = borderBox();
  localityCell.border = borderBox();
  numberCell.alignment = { horizontal: "center", vertical: "middle" };
  nameCell.alignment = { vertical: "middle" };
  localityCell.alignment = { vertical: "middle" };

  if (seat !== null) {
    numberCell.value = seat;
    numberCell.font = { name: "Calibri", size: 9, bold: true };
  }
  if (passenger) {
    nameCell.value = passenger.nombre.toUpperCase();
    nameCell.font = { name: "Calibri", size: 10 };
    localityCell.value = passenger.localidad.toUpperCase();
    localityCell.font = { name: "Arial", size: 8, bold: true, color: { argb: "FFFF0000" } };
  }
}

function writeExcelRows(
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  rows: TaquillaRow[],
  prefix: "S" | "C",
  data: ExportTaquillaData
) {
  let currentRow = startRow;
  const totalColumns = data.layout.columns * 2;

  rows.forEach((layoutRow) => {
    layoutRow.seats.forEach((seat, index) => {
      writeSeat(
        worksheet,
        currentRow,
        index * 2 + 1,
        seat,
        seat ? data.asignaciones[prefix + "-" + seat] : undefined
      );
    });

    if (layoutRow.logoStartColumn !== undefined) {
      const logoStart = layoutRow.logoStartColumn * 2 + 1;
      if (logoStart <= totalColumns) {
        const logoEndRow = currentRow + ((layoutRow.logoRowSpan || 1) * 3) - 1;
        worksheet.mergeCells(currentRow, logoStart, logoEndRow, totalColumns);
        const logoCell = worksheet.getCell(currentRow, logoStart);
        logoCell.value = "LOGO EMPRESA";
        logoCell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        logoCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6005F7" } };
        logoCell.alignment = { horizontal: "center", vertical: "middle" };
        logoCell.border = borderBox();
      }
    }

    worksheet.getRow(currentRow).height = 18;
    worksheet.getRow(currentRow + 1).height = 16;
    currentRow += 3;
  });

  return currentRow;
}

export async function exportTaquillaToExcel(data: ExportTaquillaData) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("TAQUILLA");
  const totalColumns = data.layout.columns * 2;

  for (let column = 1; column <= totalColumns; column += 2) {
    worksheet.getColumn(column).width = 5;
    worksheet.getColumn(column + 1).width = 24;
  }

  worksheet.mergeCells(1, 1, 1, totalColumns);
  const title = worksheet.getCell(1, 1);
  title.value = "TAQUILLA DE ASIENTOS - " + (data.transportCompany || "BUS").toUpperCase();
  title.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FF003399" } };

  if (data.destinoName) {
    worksheet.mergeCells(2, 1, 2, totalColumns);
    worksheet.getCell(2, 1).value = "DESTINO: " + data.destinoName.toUpperCase();
    worksheet.getCell(2, 1).font = { name: "Calibri", size: 10, bold: true };
  }

  worksheet.mergeCells(4, 1, 4, totalColumns);
  worksheet.getCell(4, 1).value = "SUPERIOR (SEMICAMA)";
  worksheet.getCell(4, 1).font = { name: "Calibri", size: 11, bold: true };
  const currentRow = writeExcelRows(worksheet, 6, data.layout.semicamaRows, "S", data);

  worksheet.mergeCells(currentRow, 1, currentRow, totalColumns);
  worksheet.getCell(currentRow, 1).value = "INFERIOR (CAMA)";
  worksheet.getCell(currentRow, 1).font = { name: "Calibri", size: 11, bold: true };
  writeExcelRows(worksheet, currentRow + 2, data.layout.camaRows, "C", data);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "Taquilla_" + (data.transportCompany || "Salida").replace(/\s+/g, "_") + ".xlsx";
  anchor.click();
  URL.revokeObjectURL(url);
}

async function getLogoDataUrl(logoUrl?: string | null) {
  if (!logoUrl) return null;

  try {
    const response = await fetch(logoUrl);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawSeatCard(
  document: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  seat: number | null,
  passenger: PasajeroTaquilla | undefined
) {
  if (seat === null) return;

  document.setDrawColor(210, 210, 220);
  document.setFillColor(passenger ? 239 : 255, passenger ? 245 : 255, passenger ? 255 : 255);
  document.roundedRect(x + 1, y + 0.7, width - 2, height - 1.4, 1.5, 1.5, "FD");
  document.setFillColor(96, 5, 247);
  document.circle(x + 4.5, y + height / 2, 2.2, "F");
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(Math.max(4.5, Math.min(7, width / 9)));
  document.text(String(seat), x + 4.5, y + height / 2 + 1.2, { align: "center" });

  if (!passenger) return;

  const textX = x + 8;
  const textWidth = Math.max(10, width - 10);
  document.setTextColor(15, 15, 15);
  document.setFont("helvetica", "bold");
  document.setFontSize(Math.max(4, Math.min(6.5, width / 10)));
  const name = document.splitTextToSize(passenger.nombre.toUpperCase(), textWidth)[0] || "";
  document.text(name, textX, y + height / 2 - 0.4);
  document.setTextColor(96, 5, 247);
  document.setFont("helvetica", "normal");
  document.setFontSize(Math.max(3.5, Math.min(5.5, width / 12)));
  const locality = document.splitTextToSize(passenger.localidad.toUpperCase(), textWidth)[0] || "";
  document.text(locality, textX, y + height / 2 + 2.8);
}

function drawLogoBlock(
  document: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  logoDataUrl: string | null
) {
  document.setFillColor(96, 5, 247);
  document.roundedRect(x + 1, y + 0.7, width - 2, height - 1.4, 2, 2, "F");

  if (logoDataUrl) {
    try {
      document.addImage(logoDataUrl, "PNG", x + 3, y + 2, Math.max(5, width - 6), Math.max(5, height - 4));
      return;
    } catch {
      // Keep the visual fallback when the stored image format is unsupported.
    }
  }

  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(Math.max(5, Math.min(10, width / 8)));
  document.text("LOGO EMPRESA", x + width / 2, y + height / 2 + 1.5, { align: "center" });
}

function drawPdfRows(
  document: jsPDF,
  rows: TaquillaRow[],
  prefix: "S" | "C",
  startY: number,
  data: ExportTaquillaData,
  logoDataUrl: string | null
) {
  const pageWidth = 297;
  const margin = 14;
  const availableWidth = pageWidth - margin * 2;
  const columnWidth = availableWidth / data.layout.columns;
  const rowHeight = 10.5;
  let currentY = startY;

  rows.forEach((layoutRow) => {
    layoutRow.seats.forEach((seat, columnIndex) => {
      if (layoutRow.logoStartColumn !== undefined && columnIndex >= layoutRow.logoStartColumn) return;
      const passenger = seat ? data.asignaciones[prefix + "-" + seat] : undefined;
      drawSeatCard(document, margin + columnIndex * columnWidth, currentY, columnWidth, rowHeight, seat, passenger);
    });

    if (layoutRow.logoStartColumn !== undefined) {
      const logoColumnCount = data.layout.columns - layoutRow.logoStartColumn;
      drawLogoBlock(
        document,
        margin + layoutRow.logoStartColumn * columnWidth,
        currentY,
        logoColumnCount * columnWidth,
        rowHeight * (layoutRow.logoRowSpan || 1),
        logoDataUrl
      );
    }

    currentY += rowHeight;
  });

  return currentY;
}

export async function exportTaquillaToPdf(data: ExportTaquillaData) {
  const document = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const title = (data.transportCompany || "BUS").toUpperCase();
  const logoDataUrl = await getLogoDataUrl(data.logoUrl);

  document.setFont("helvetica", "bold");
  document.setFontSize(13);
  document.setTextColor(0, 51, 153);
  document.text("TAQUILLA DE ASIENTOS - " + title, 14, 14);
  if (data.destinoName) {
    document.setFontSize(9);
    document.setTextColor(80, 80, 80);
    document.text("Destino: " + data.destinoName.toUpperCase(), 14, 20);
  }

  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(0, 0, 0);
  document.text("SUPERIOR (SEMICAMA)", 14, 28);
  const afterSemicama = drawPdfRows(
    document,
    data.layout.semicamaRows,
    "S",
    31,
    data,
    logoDataUrl
  );

  document.setFont("helvetica", "bold");
  document.setFontSize(10);
  document.setTextColor(0, 0, 0);
  document.text("INFERIOR (CAMA)", 14, afterSemicama + 7);
  drawPdfRows(document, data.layout.camaRows, "C", afterSemicama + 10, data, logoDataUrl);

  document.save(
    "Taquilla_" + (data.destinoName || "Salida").replace(/\s+/g, "_") + "_" + (data.salidaDate || "Salida") + ".pdf"
  );
}
