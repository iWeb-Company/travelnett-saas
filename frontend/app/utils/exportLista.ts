import ExcelJS from "exceljs";

export interface PasajeroListaData {
  numero: number;
  bus_number?: string | null;
  apellido: string;
  nombres: string;
  dni: string;
  fecha_nacimiento: string;
  telefono: string;
  pax_type: string;
  hotel: string;
  servicio: string;
  sube_en: string;
  file: string;
  vendio: string;
  observaciones: string;
}

export interface LugarCargaListaData {
  name: string;
  address?: string;
  horario?: string;
}

export interface ExportListaData {
  transportCompany?: string | null;
  destinoName?: string | null;
  salidaDate?: string | null;
  pasajeros: PasajeroListaData[];
  lugaresCarga: LugarCargaListaData[];
}

const THIN = { style: "thin" as const };

function formatDateString(dateStr: string | null | undefined): string {
  if (!dateStr || dateStr === "-") return "-";

  // If already DD-MM-YYYY or DD/MM/YYYY
  if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(dateStr.trim())) {
    return dateStr.trim().replace(/\//g, "-");
  }

  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr.trim())) {
    const parts = dateStr.trim().split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return dateStr;
}

export async function exportListaToExcel(data: ExportListaData) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Lista");

  // Column widths matching lista_example.xlsx exactly
  const columns = [
    { width: 7.54 },  // 1: Numero
    { width: 5.04 },  // 2: BUS
    { width: 20.21 }, // 3: APELLIDO
    { width: 20.06 }, // 4: NOMBRES
    { width: 9.77 },  // 5: DNI/LE/CI
    { width: 10.47 }, // 6: F. NAC.
    { width: 12.27 }, // 7: TELEFONO
    { width: 5.18 },  // 8: PAX
    { width: 22.85 }, // 9: HOTEL
    { width: 12.55 }, // 10: SERVICIO
    { width: 33.70 }, // 11: SUBE EN
    { width: 5.46 },  // 12: FILE
    { width: 21.46 }, // 13: VENDIO
    { width: 21.74 }, // 14: OBSERVACIONES
  ];

  columns.forEach((col, idx) => {
    ws.getColumn(idx + 1).width = col.width;
  });

  // ── Row 1: Header ──────────────────────────────────────────────────────────
  const headers = [
    "Numero",
    "BUS",
    "APELLIDO",
    "NOMBRES",
    "DNI/LE/CI",
    "F. NAC.",
    "TELEFONO",
    "PAX",
    "HOTEL",
    "SERVICIO",
    "SUBE EN",
    "FILE",
    "VENDIO",
    "OBSERVACIONES",
  ];

  const headerRow = ws.getRow(1);
  headers.forEach((h, colIdx) => {
    const cell = headerRow.getCell(colIdx + 1);
    cell.value = h;
    cell.font = { name: "Times New Roman", size: 10 };
  });

  // ── Data Rows ─────────────────────────────────────────────────────────────
  let currentRow = 2;

  data.pasajeros.forEach((p) => {
    const row = ws.getRow(currentRow);
    const rowValues = [
      p.numero,
      p.bus_number && p.bus_number !== "" ? p.bus_number : "-",
      (p.apellido || "-").toUpperCase(),
      (p.nombres || "-").toUpperCase(),
      p.dni || "-",
      formatDateString(p.fecha_nacimiento),
      p.telefono || "-",
      (p.pax_type || "ADL").toUpperCase(),
      p.hotel || "-",
      p.servicio || "Bus Semicama",
      p.sube_en || "-",
      p.file || "-",
      p.vendio || "-",
      p.observaciones || "-",
    ];

    rowValues.forEach((val, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      cell.value = val;
      cell.font = { name: "Times New Roman", size: 10 };
    });

    currentRow++;
  });

  // ── Lugares de Carga Table ────────────────────────────────────────────────
  if (data.lugaresCarga && data.lugaresCarga.length > 0) {
    // Gap row
    currentRow++;

    const headerStartRow = currentRow;

    // Merge C..J for header "Lugares de Carga"
    ws.mergeCells(headerStartRow, 3, headerStartRow, 10);
    const lcHeadCell = ws.getCell(headerStartRow, 3);
    lcHeadCell.value = "Lugares de Carga";
    lcHeadCell.font = { name: "Times New Roman", size: 10, bold: true };
    lcHeadCell.alignment = { horizontal: "center", vertical: "middle" };

    // Apply borders to header row C..J
    for (let c = 3; c <= 10; c++) {
      const cell = ws.getCell(headerStartRow, c);
      const b: Partial<ExcelJS.Borders> = { top: THIN };
      if (c === 3) b.left = THIN;
      if (c === 10) b.right = THIN;
      cell.border = b;
    }

    currentRow++;

    // Data rows for Lugares de Carga
    data.lugaresCarga.forEach((lc, idx) => {
      const isLast = idx === data.lugaresCarga.length - 1;
      const r = ws.getRow(currentRow);

      const cellC = r.getCell(3); // Short name
      cellC.value = (lc.name || "").toUpperCase();
      cellC.font = { name: "Times New Roman", size: 10 };

      const cellE = r.getCell(5); // Address
      cellE.value = lc.address || "";
      cellE.font = { name: "Times New Roman", size: 10 };

      const cellJ = r.getCell(10); // Horario
      cellJ.value = lc.horario || "";
      cellJ.font = { name: "Times New Roman", size: 10 };

      // Set borders for C..J in this row
      for (let c = 3; c <= 10; c++) {
        const cell = r.getCell(c);
        const b: Partial<ExcelJS.Borders> = {};
        if (c === 3) b.left = THIN;
        if (c === 10) b.right = THIN;
        if (isLast) b.bottom = THIN;
        cell.border = b;
      }

      currentRow++;
    });
  }

  // ── Download File ──────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const fileName = `Lista_${(data.destinoName || "Salida").replace(/\s+/g, "_")}_${data.salidaDate || "fecha"}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
