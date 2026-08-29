/**
 * Formatea cualquier fecha de forma segura a "dd/mm/aa" sin desfasaje de zona horaria.
 * Soporta strings (YYYY-MM-DD, DD/MM/YYYY, ISO, etc.), objetos Date o timestamps.
 */
export function formatDateDDMMYY(fecha: string | Date | null | undefined): string {
  if (!fecha) return "—";

  if (fecha instanceof Date) {
    if (isNaN(fecha.getTime())) return "—";
    const d = String(fecha.getDate()).padStart(2, "0");
    const m = String(fecha.getMonth() + 1).padStart(2, "0");
    const yy = String(fecha.getFullYear()).slice(-2);
    return `${d}/${m}/${yy}`;
  }

  let str = String(fecha).trim();
  if (str === "" || str === "-" || str === "—") return "—";

  // Quitar hora si existe (e.g., "2026-08-23 00:00:00" o "2026-08-23T00:00:00Z")
  const datePart = str.split(" ")[0].split("T")[0];

  // Caso 1: YYYY-MM-DD o YYYY/MM/DD
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(datePart)) {
    const [y, m, d] = datePart.split(/[-/]/);
    const dd = d.padStart(2, "0");
    const mm = m.padStart(2, "0");
    const yy = y.slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  // Caso 2: DD/MM/YYYY o DD-MM-YYYY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(datePart)) {
    const [d, m, y] = datePart.split(/[-/]/);
    const dd = d.padStart(2, "0");
    const mm = m.padStart(2, "0");
    const yy = y.slice(-2);
    return `${dd}/${mm}/${yy}`;
  }

  // Caso 3: DD/MM/YY o DD-MM-YY
  if (/^\d{1,2}[-/]\d{1,2}[-/]\d{2}$/.test(datePart)) {
    const [d, m, y] = datePart.split(/[-/]/);
    const dd = d.padStart(2, "0");
    const mm = m.padStart(2, "0");
    return `${dd}/${mm}/${y}`;
  }

  // Fallback
  if (str.includes("-") && str.length >= 10) {
    const parts = str.split("T")[0].split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      const [y, m, d] = parts;
      return `${d.slice(0, 2).padStart(2, "0")}/${m.padStart(2, "0")}/${y.slice(-2)}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const d = String(parsed.getDate()).padStart(2, "0");
    const m = String(parsed.getMonth() + 1).padStart(2, "0");
    const yy = String(parsed.getFullYear()).slice(-2);
    return `${d}/${m}/${yy}`;
  }

  return str;
}

/**
 * Parsea una fecha string de forma segura en hora local (sin offset UTC).
 */
export function safeParseDateLocal(fecha: string | null | undefined): Date | null {
  if (!fecha) return null;
  const raw = String(fecha).split(" ")[0].split("T")[0];
  const parts = raw.split(/[-/]/);
  if (parts.length !== 3) return null;
  if (parts[0].length === 4) {
    const [y, m, d] = parts.map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  } else {
    const [d, m, y] = parts.map(Number);
    const fullY = y < 100 ? 2000 + y : y;
    if (!fullY || !m || !d) return null;
    return new Date(fullY, m - 1, d);
  }
}
