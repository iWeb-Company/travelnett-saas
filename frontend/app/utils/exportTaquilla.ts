import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  asignaciones: Record<string, PasajeroTaquilla>;
}

// ─── Layouts ───────────────────────────────────────────────────────────────
// Each row: [leftWindow, leftAisle, rightSeat]  (number = seat, null = empty)
// For semicama we use the standard 2+1 layout:
//   COL B = left-window passenger name/ascenso
//   COL E = left-aisle  passenger name/ascenso
//   COL J = right       passenger name/ascenso
// Seat numbers to key lookup: S-<n>

const semicamaSeats: { lw: number | null; la: number | null; r: number | null }[] = [
  { lw: 1, la: 2, r: 3 },
  { lw: 5, la: 6, r: null }, // logo row
  { lw: 7, la: 8, r: null },
  { lw: null, la: null, r: null }, // spacer
  { lw: 9, la: 10, r: 11 },
  { lw: 13, la: 14, r: 15 },
  { lw: 17, la: 18, r: 19 },
  { lw: null, la: null, r: null }, // spacer
  { lw: 21, la: 22, r: 23 },
  { lw: 25, la: 26, r: 27 },
  { lw: 29, la: 30, r: 31 },
  { lw: 33, la: 34, r: 35 },
  { lw: 37, la: 38, r: 39 },
  { lw: 41, la: 42, r: 43 },
  { lw: 45, la: 46, r: 47 },
  { lw: 49, la: 50, r: 51 },
];

// Paired twin seats (right side has col 4 = nil in example)
const semicamaRightPaired: Record<number, number> = {
  3: 4, 11: 12, 15: 16, 19: 20, 23: 24, 27: 28,
  31: 32, 35: 36, 39: 40, 43: 44, 47: 48, 51: 52
};

const camaSeats: { lw: number | null; la: number | null; r: number | null }[] = [
  { lw: 1, la: 2, r: 3 },
  { lw: 4, la: 5, r: null },
  { lw: 6, la: 7, r: null },
  { lw: 8, la: 9, r: 10 },
];

// ─── Style helpers ──────────────────────────────────────────────────────────

const THIN = { style: "thin" as const };
const RED_FONT = {
  name: "Arial", size: 8, bold: true,
  color: { argb: "FFFF0000" }
};
const NAME_FONT = { name: "Calibri", size: 11 };
const COORD_FONT = {
  name: "Calibri", size: 11, bold: true,
  color: { argb: "FFFF0000" }
};
const HEADER_FONT = { name: "Calibri", size: 11, bold: true };

function borderBox(): Partial<ExcelJS.Borders> {
  return { top: THIN, left: THIN, right: THIN, bottom: THIN };
}

// Write a passenger "slot" starting at given row, col (name row, +1 = ascenso)
function writePax(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  pax: PasajeroTaquilla | null | undefined,
  isCoord = false
) {
  const nameCell = ws.getCell(row, col);
  const ascCell = ws.getCell(row + 1, col);

  // Both cells get a box border
  nameCell.border = borderBox();
  ascCell.border = borderBox();

  if (pax) {
    nameCell.value = pax.nombre.toUpperCase();
    nameCell.font = isCoord ? COORD_FONT : NAME_FONT;

    ascCell.value = pax.localidad.toUpperCase();
    ascCell.font = isCoord
      ? { ...COORD_FONT }
      : RED_FONT;
  }
}

// ─── EXCEL EXPORT ───────────────────────────────────────────────────────────

export async function exportTaquillaToExcel(data: ExportTaquillaData) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("TAQUILLA");

  // Column widths (matching taquilla_example.xlsx exactly)
  const cols = [
    { width: 2.7 }, // A – left margin / section label
    { width: 20.7 }, // B – left-window name
    { width: 1.7 }, // C – fill/separator
    { width: 2.7 }, // D – seat number box
    { width: 24 }, // E – left-aisle name
    { width: 1.7 }, // F – fill/separator
    { width: 2.7 }, // G
    { width: 1.7 }, // H
    { width: 2.7 }, // I – seat number box (right side)
    { width: 24 }, // J – right-seat name
    { width: 4.7 }, // K – right margin
  ];
  cols.forEach((c, i) => { ws.getColumn(i + 1).width = c.width; });

  // ── Row 3: company name ──────────────────────────────────────────────────
  ws.getCell("B3").value = (data.transportCompany || "BUS CAMA").toUpperCase();
  ws.getCell("B3").font = { name: "Calibri", size: 12, bold: true };

  // ── Row 4: SUPERIOR header ───────────────────────────────────────────────
  ws.getCell("A4").value = "SUPERIOR";
  ws.getCell("A4").font = HEADER_FONT;

  ws.getCell("E4").value = " TAQUILLA ASIENTOS PARTE SUPERIOR";
  ws.getCell("E4").font = HEADER_FONT;
  ws.mergeCells("E4:J4");

  // ── SUPERIOR section: semicama ───────────────────────────────────────────
  // The visible layout in the Excel uses rows that are 2 rows tall per seat pair
  // (name row + ascenso row), with an empty gap row between groups.
  // Starting at row 6 (matching the example).

  let r = 6;
  const isLogoGroup = (idx: number) => idx === 1; // 2nd group has logo

  for (let idx = 0; idx < semicamaSeats.length; idx++) {
    const seat = semicamaSeats[idx];

    if (seat.lw === null && seat.la === null && seat.r === null) {
      r += 1; // spacer row
      continue;
    }

    const pLW = seat.lw ? data.asignaciones[`S-${seat.lw}`] : null;
    const pLA = seat.la ? data.asignaciones[`S-${seat.la}`] : null;
    const pR = seat.r ? data.asignaciones[`S-${seat.r}`] : null;

    // ─── Left window (col B, D) ──────────────────────────────────────────
    if (seat.lw !== null) {
      writePax(ws, r, 2 /* B */, pLW);
    }

    // Seat number box col D (left pair)
    if (seat.lw !== null) {
      const seatNumCell = ws.getCell(r, 4);
      seatNumCell.value = seat.lw;
      seatNumCell.font = { name: "Calibri", size: 9, bold: true };
      seatNumCell.alignment = { horizontal: "center", vertical: "middle" };
      seatNumCell.border = borderBox();
    }

    // ─── Left aisle (col E) ──────────────────────────────────────────────
    if (seat.la !== null) {
      writePax(ws, r, 5 /* E */, pLA);
    }

    // ─── Right seat (col I/J) ────────────────────────────────────────────
    if (isLogoGroup(idx)) {
      // Logo placeholder – span J cols
      const logoCell = ws.getCell(r, 10);
      logoCell.value = "LOGO EMPRESA";
      logoCell.font = { name: "Calibri", size: 9, bold: true };
      logoCell.alignment = { horizontal: "center", vertical: "middle" };
      try { ws.mergeCells(r, 10, r + 1, 11); } catch { }
    } else if (seat.r !== null) {
      const seatNumCellR = ws.getCell(r, 9);
      seatNumCellR.value = seat.r;
      seatNumCellR.font = { name: "Calibri", size: 9, bold: true };
      seatNumCellR.alignment = { horizontal: "center", vertical: "middle" };
      seatNumCellR.border = borderBox();

      writePax(ws, r, 10 /* J */, pR);
    }

    r += 3; // 2 rows for pax + 1 blank row between groups
  }

  // ── INFERIOR header ──────────────────────────────────────────────────────
  r += 0; // already on blank
  ws.getCell(r, 1).value = "INFERIOR";
  ws.getCell(r, 1).font = HEADER_FONT;
  try { ws.mergeCells(r, 1, r, 10); } catch { }
  r += 2;

  // ── INFERIOR section: cama ───────────────────────────────────────────────
  for (let idx = 0; idx < camaSeats.length; idx++) {
    const seat = camaSeats[idx];

    const pLW = seat.lw ? data.asignaciones[`C-${seat.lw}`] : null;
    const pLA = seat.la ? data.asignaciones[`C-${seat.la}`] : null;
    const pR = seat.r ? data.asignaciones[`C-${seat.r}`] : null;

    if (seat.lw !== null) {
      writePax(ws, r, 2, pLW);
      const seatNumCell = ws.getCell(r, 4);
      seatNumCell.value = seat.lw;
      seatNumCell.font = { name: "Calibri", size: 9, bold: true };
      seatNumCell.alignment = { horizontal: "center", vertical: "middle" };
      seatNumCell.border = borderBox();
    }

    if (seat.la !== null) {
      writePax(ws, r, 5, pLA);
    }

    if (seat.r !== null) {
      const seatNumCellR = ws.getCell(r, 9);
      seatNumCellR.value = seat.r;
      seatNumCellR.font = { name: "Calibri", size: 9, bold: true };
      seatNumCellR.alignment = { horizontal: "center", vertical: "middle" };
      seatNumCellR.border = borderBox();

      // Check if this is the last row – last right seat is "COORDINADOR"
      const isLastRow = idx === camaSeats.length - 1;
      if (isLastRow && !pR) {
        const coordNameCell = ws.getCell(r, 10);
        coordNameCell.value = "COORDINADOR";
        coordNameCell.font = COORD_FONT;
        coordNameCell.border = borderBox();
        ws.getCell(r + 1, 10).border = borderBox();
        try { ws.mergeCells(r, 10, r + 1, 10); } catch { }
      } else {
        writePax(ws, r, 10, pR, isLastRow);
      }
    }

    r += 3;
  }

  // ── Download ─────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Taquilla_${(data.transportCompany || "Salida").replace(/\s+/g, "_")}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── PDF EXPORT ─────────────────────────────────────────────────────────────

export function exportTaquillaToPdf(data: ExportTaquillaData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const makeRows = (
    seats: { lw: number | null; la: number | null; r: number | null }[],
    prefix: "S" | "C"
  ) => {
    return seats
      .filter(s => !(s.lw === null && s.la === null && s.r === null))
      .map(seat => {
        const pLW = seat.lw ? data.asignaciones[`${prefix}-${seat.lw}`] : null;
        const pLA = seat.la ? data.asignaciones[`${prefix}-${seat.la}`] : null;
        const pR = seat.r ? data.asignaciones[`${prefix}-${seat.r}`] : null;

        const fmt = (p: PasajeroTaquilla | null, num: number | null) =>
          p ? `${p.nombre.toUpperCase()}\n${p.localidad.toUpperCase()}` : (num ? "" : "—");

        return [
          seat.lw ?? "—",
          fmt(pLW, seat.lw),
          seat.la ?? "—",
          fmt(pLA, seat.la),
          seat.r ?? "—",
          fmt(pR, seat.r),
        ];
      });
  };

  const title = (data.transportCompany || "BUS CAMA").toUpperCase();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(0, 51, 153);
  doc.text(`TAQUILLA DE ASIENTOS — ${title}`, 14, 14);
  if (data.destinoName) {
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(`Destino: ${data.destinoName.toUpperCase()}`, 14, 20);
  }

  const colStyles: any = {
    0: { halign: "center", fontStyle: "bold", cellWidth: 12 },
    1: { cellWidth: 50 },
    2: { halign: "center", fontStyle: "bold", cellWidth: 12 },
    3: { cellWidth: 50 },
    4: { halign: "center", fontStyle: "bold", cellWidth: 12 },
    5: { cellWidth: 50 },
  };

  const headStyle = {
    fillColor: [5, 70, 247] as [number, number, number],
    textColor: 255 as number,
    fontStyle: "bold" as const,
    halign: "center" as const,
    fontSize: 7,
  };

  // SUPERIOR
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("SUPERIOR (SEMICAMA)", 14, 26);

  autoTable(doc, {
    startY: 28,
    head: [["#", "Asiento Izq. Ventana", "#", "Asiento Izq. Pasillo", "#", "Asiento Derecho"]],
    body: makeRows(semicamaSeats, "S"),
    styles: { fontSize: 7.5, cellPadding: 2, valign: "middle", lineColor: [200, 200, 200], lineWidth: 0.2 },
    headStyles: headStyle,
    columnStyles: colStyles,
    didParseCell(hookData) {
      // Color red for ascenso (second line) in content cells
      if (hookData.section === "body" && [1, 3, 5].includes(hookData.column.index)) {
        const val = hookData.cell.raw as string;
        if (val && val.includes("\n")) {
          hookData.cell.styles.fontSize = 7.5;
        }
      }
    },
  });

  const afterSuperior = (doc as any).lastAutoTable?.finalY ?? 130;

  // INFERIOR
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("INFERIOR (CAMA)", 14, afterSuperior + 8);

  autoTable(doc, {
    startY: afterSuperior + 11,
    head: [["#", "Asiento Izq. Ventana", "#", "Asiento Izq. Pasillo", "#", "Asiento Derecho"]],
    body: makeRows(camaSeats, "C"),
    styles: { fontSize: 7.5, cellPadding: 2, valign: "middle", lineColor: [200, 200, 200], lineWidth: 0.2 },
    headStyles: headStyle,
    columnStyles: colStyles,
  });

  doc.save(`Taquilla_${(data.destinoName || "Salida").replace(/\s+/g, "_")}_${data.salidaDate || "Salida"}.pdf`);
}
