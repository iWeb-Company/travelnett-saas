/**
 * Utility module for parsing, structuring, and formatting room types in TravelNett SaaS.
 * 
 * Supports:
 * - Abbreviated codes: DBL_MAT_STD, DBL_SGL_STD, DBL_MAT_SUI, SGL_STD, TPL_IND_SUP, etc.
 * - Snake_case strings: doble_matrimonial_estandar, simple_individual_suite, triple_individual_superior
 * - Legacy short codes: DBL_MAT, SGL, doble_individual, triple_individual, etc.
 * - JSON strings/arrays or comma-separated lists of room types.
 */

export interface RoomTypeDetails {
  raw: string;                 // Original input string (e.g., "DBL_MAT_SUI")
  cama: string;                // "Doble", "Single", "Triple", "Cuádruple", "Quíntuple", "Departamento"
  camaCode: string;            // "DBL", "SGL", "TPL", "CPL", "QTL", "DEP"
  distribucion: string;        // "Matrimonial", "Individual", "Twin"
  distribucionCode: string;    // "MAT", "IND", "TWN"
  tipoHabitacion: string;      // "Estándar", "Superior", "Suite"
  tipoHabitacionCode: string;  // "STD", "SUP", "SUI"
  label: string;               // Full combined text (e.g., "Doble Matrimonial Suite")
}

export interface FormattedRoomsSummary {
  camas: string[];
  distribuciones: string[];
  tiposHabitacion: string[];
  labelCompleto: string;
  rooms: RoomTypeDetails[];
}

// ---- Mappings ----

const CAMA_MAP: Record<string, { label: string; code: string }> = {
  // Codes
  DBL: { label: "Doble", code: "DBL" },
  SGL: { label: "Single", code: "SGL" },
  TPL: { label: "Triple", code: "TPL" },
  CPL: { label: "Cuádruple", code: "CPL" },
  QPL: { label: "Cuádruple", code: "CPL" },
  QTL: { label: "Quíntuple", code: "QTL" },
  DEP: { label: "Departamento", code: "DEP" },
  // Snake_case & Words
  doble: { label: "Doble", code: "DBL" },
  simple: { label: "Single", code: "SGL" },
  single: { label: "Single", code: "SGL" },
  triple: { label: "Triple", code: "TPL" },
  cuadruple: { label: "Cuádruple", code: "CPL" },
  quintuple: { label: "Quíntuple", code: "QTL" },
  depto: { label: "Departamento", code: "DEP" },
  depto_x5: { label: "Departamento x5", code: "DEP" },
};

const DISTRIBUCION_MAP: Record<string, { label: string; code: string }> = {
  // Codes
  MAT: { label: "Matrimonial", code: "MAT" },
  TWN: { label: "Twin", code: "TWN" },
  // Words
  matrimonial: { label: "Matrimonial", code: "MAT" },
  individual: { label: "Individual", code: "IND" },
  twin: { label: "Twin", code: "TWN" },
};

const TIPO_HABITACION_MAP: Record<string, { label: string; code: string }> = {
  // Codes
  STD: { label: "Estándar", code: "STD" },
  SUP: { label: "Superior", code: "SUP" },
  SUI: { label: "Suite", code: "SUI" },
  // Words
  estandar: { label: "Estándar", code: "STD" },
  standard: { label: "Estándar", code: "STD" },
  superior: { label: "Superior", code: "SUP" },
  suite: { label: "Suite", code: "SUI" },
};

/**
 * Normalizes an input string to lower/trimmed key.
 */
function cleanKey(str: string): string {
  return str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Parses a single room string (e.g. "DBL_MAT_SUI", "doble_matrimonial_estandar", "DBL_SGL_STD").
 */
export function parseRoomItem(roomStr: string): RoomTypeDetails {
  if (!roomStr || typeof roomStr !== "string") {
    return {
      raw: "",
      cama: "Estándar",
      camaCode: "DBL",
      distribucion: "Matrimonial",
      distribucionCode: "MAT",
      tipoHabitacion: "Estándar",
      tipoHabitacionCode: "STD",
      label: "Habitación Estándar",
    };
  }

  const cleanRaw = roomStr.trim();
  const lowerRaw = cleanRaw.toLowerCase();

  let cama = "Doble";
  let camaCode = "DBL";
  let distribucion = "Matrimonial";
  let distribucionCode = "MAT";
  let tipoHabitacion = "Estándar";
  let tipoHabitacionCode = "STD";

  // 1. Check Cama / Bed Type
  if (lowerRaw.includes("depto_x5") || lowerRaw.includes("depto_5") || lowerRaw.includes("departamento_x5")) {
    cama = "Departamento x5";
    camaCode = "DEP";
  } else if (lowerRaw.includes("depto") || lowerRaw.includes("departamento") || lowerRaw.includes("dep")) {
    cama = "Departamento";
    camaCode = "DEP";
  } else if (lowerRaw.includes("quintuple") || lowerRaw.includes("qtl")) {
    cama = "Quíntuple";
    camaCode = "QTL";
  } else if (lowerRaw.includes("cuadruple") || lowerRaw.includes("cpl") || lowerRaw.includes("qpl")) {
    cama = "Cuádruple";
    camaCode = "CPL";
  } else if (lowerRaw.includes("triple") || lowerRaw.includes("tpl")) {
    cama = "Triple";
    camaCode = "TPL";
  } else if (lowerRaw.includes("single") || lowerRaw.includes("simple") || lowerRaw.includes("sgl") || lowerRaw.startsWith("individual")) {
    cama = "Single";
    camaCode = "SGL";
  } else if (lowerRaw.includes("doble") || lowerRaw.includes("dbl")) {
    cama = "Doble";
    camaCode = "DBL";
  }

  // 2. Check Distribución
  if (lowerRaw.includes("matrimonial") || lowerRaw.includes("mat")) {
    distribucion = "Matrimonial";
    distribucionCode = "MAT";
  } else if (lowerRaw.includes("twin") || lowerRaw.includes("twn")) {
    distribucion = "Twin";
    distribucionCode = "TWN";
  } else if (lowerRaw.includes("individual") || lowerRaw.includes("ind") || camaCode === "SGL") {
    distribucion = "Individual";
    distribucionCode = "IND";
  }

  // 3. Check Tipo de Habitación / Categoría
  if (lowerRaw.includes("superior") || lowerRaw.endsWith("_sup") || lowerRaw.includes("_sup_")) {
    tipoHabitacion = "Superior";
    tipoHabitacionCode = "SUP";
  } else if (lowerRaw.includes("suite") || lowerRaw.endsWith("_sui") || lowerRaw.includes("_sui_")) {
    tipoHabitacion = "Suite";
    tipoHabitacionCode = "SUI";
  } else if (lowerRaw.includes("estandar") || lowerRaw.includes("standard") || lowerRaw.endsWith("_std") || lowerRaw.includes("_std_")) {
    tipoHabitacion = "Estándar";
    tipoHabitacionCode = "STD";
  }

  // Label construction e.g. "Departamento x5 Individual Estándar"
  const labelParts = [cama];
  if (distribucion && distribucion.toLowerCase() !== cama.toLowerCase() && !(camaCode === "SGL" && distribucionCode === "IND")) {
    labelParts.push(distribucion);
  }
  if (tipoHabitacion) {
    labelParts.push(tipoHabitacion);
  }

  const label = labelParts.join(" ");

  return {
    raw: cleanRaw,
    cama,
    camaCode,
    distribucion,
    distribucionCode,
    tipoHabitacion,
    tipoHabitacionCode,
    label,
  };
}

/**
 * Returns estimated capacity for a given parsed room type.
 */
export function getRoomCapacity(input: RoomTypeDetails | string | null | undefined): number {
  if (!input) return 2;
  const parsed = typeof input === "string" ? parseRoomItem(input) : input;
  switch (parsed?.camaCode) {
    case "SGL":
      return 1;
    case "DBL":
      return 2;
    case "TPL":
      return 3;
    case "CPL":
      return 4;
    case "QTL":
    case "DEP":
      return 5;
    default:
      return 2;
  }
}

/**
 * Parses any room_type input (JSON string, string array, comma-separated string, single code).
 */
export function parseRoomTypes(input: string | string[] | null | undefined): RoomTypeDetails[] {
  if (!input) return [];

  let items: string[] = [];

  if (Array.isArray(input)) {
    items = input;
  } else if (typeof input === "string") {
    const trimmed = input.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          items = parsed.map((x) => String(x));
        }
      } catch {
        items = [trimmed];
      }
    } else if (trimmed.includes(",")) {
      items = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      items = [trimmed];
    }
  }

  return items.map(parseRoomItem);
}

/**
 * Formats room_type into a clean human-readable combined string (e.g. "Doble Matrimonial Suite + Single Individual Estándar").
 */
export function formatRoomType(input: string | string[] | null | undefined): string {
  const rooms = parseRoomTypes(input);
  if (rooms.length === 0) return "-";
  return rooms.map((r) => r.label).join(" + ");
}

/**
 * Returns room type details grouped into separated property arrays (camas, distribuciones, tiposHabitacion).
 */
export function formatRoomTypeDetails(input: string | string[] | null | undefined): FormattedRoomsSummary {
  const rooms = parseRoomTypes(input);
  const camas = Array.from(new Set(rooms.map((r) => r.cama)));
  const distribuciones = Array.from(new Set(rooms.map((r) => r.distribucion)));
  const tiposHabitacion = Array.from(new Set(rooms.map((r) => r.tipoHabitacion)));
  const labelCompleto = formatRoomType(input);

  return {
    camas,
    distribuciones,
    tiposHabitacion,
    labelCompleto,
    rooms,
  };
}

/**
 * Constructs a room_type code string e.g. "DBL_MAT_SUI" or "doble_matrimonial_suite".
 */
export function buildRoomTypeCode(
  cama: string,
  distribucion: string,
  tipoHabitacion: string,
  format: 'code' | 'snake' = 'code'
): string {
  const cObj = CAMA_MAP[cleanKey(cama)] || { code: cama.toUpperCase(), label: cama };
  const dObj = DISTRIBUCION_MAP[cleanKey(distribucion)] || { code: distribucion.toUpperCase(), label: distribucion };
  const tObj = TIPO_HABITACION_MAP[cleanKey(tipoHabitacion)] || { code: tipoHabitacion.toUpperCase(), label: tipoHabitacion };

  if (format === 'snake') {
    return `${cObj.label.toLowerCase()}_${dObj.label.toLowerCase()}_${tObj.label.toLowerCase()}`;
  }

  return `${cObj.code}_${dObj.code}_${tObj.code}`;
}
