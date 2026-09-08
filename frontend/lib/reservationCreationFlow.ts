export interface ReservationStepRoom {
  hotel: string;
  tipoCama: string;
  distribucion: string;
  tipoHabitacion: string;
}

interface PackageSelection {
  packageId?: string | null;
  itemId?: string | null;
  itemType?: string | null;
  loadedPackageId?: string | null;
}

export function resolveReservationPackageId({
  packageId,
  itemId,
  itemType,
  loadedPackageId,
}: PackageSelection): string {
  return (
    packageId ||
    (itemType === "paquete" ? itemId : "") ||
    loadedPackageId ||
    ""
  );
}

export function shouldShowManualReservationPricing(
  selectedPackageId: string,
): boolean {
  return !selectedPackageId;
}

interface ReservationStep3Navigation {
  destinoId: string;
  clienteId: string;
  tipoReserva: string;
  itemId: string;
  itemType: string;
  salidaId: string;
  packageId: string;
  rooms: ReservationStepRoom[];
}

export function buildReservationStep3Href({
  destinoId,
  clienteId,
  tipoReserva,
  itemId,
  itemType,
  salidaId,
  packageId,
  rooms,
}: ReservationStep3Navigation): string {
  const params = new URLSearchParams({
    destino: destinoId,
    cliente: clienteId,
    tipo: tipoReserva,
    item: itemId,
    itemType,
    salida: salidaId,
    paquete: packageId,
    rooms: JSON.stringify(rooms),
  });

  return `/web/reservas/crear-reserva/paso-3?${params.toString()}`;
}
