/**
 * Formatea el nombre de un pasajero como "APELLIDO, NOMBRE" en mayúsculas.
 * Se usa en rooming, lista, vouchers y cualquier lugar donde se muestren pasajeros.
 */
export function formatPassengerName(
  nombre: string | null | undefined,
  apellido: string | null | undefined
): string {
  const n = (nombre || "").trim().toUpperCase();
  const a = (apellido || "").trim().toUpperCase();
  if (a && n) return `${a}, ${n}`;
  if (a) return a;
  if (n) return n;
  return "DESCONOCIDO";
}

/**
 * Formatea un nombre completo "Nombre Apellido" a "APELLIDO, NOMBRE".
 * Útil cuando solo hay un campo nombre_completo.
 * Asume que la última palabra es el apellido.
 */
export function formatFullName(nombreCompleto: string | null | undefined): string {
  if (!nombreCompleto || nombreCompleto.trim() === "") return "DESCONOCIDO";
  const parts = nombreCompleto.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  const apellido = parts.pop()!;
  return `${apellido.toUpperCase()}, ${parts.join(" ").toUpperCase()}`;
}
