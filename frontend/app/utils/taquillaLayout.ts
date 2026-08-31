export type TaquillaSeatCell = number | null;

export interface TaquillaRow {
  seats: TaquillaSeatCell[];
  logoStartColumn?: number;
  logoRowSpan?: number;
}

export interface TaquillaLayout {
  columns: number;
  semicamaRows: TaquillaRow[];
  camaRows: TaquillaRow[];
}

function normalizeQuantity(value: number | string | null | undefined) {
  const quantity = Number(value);
  return Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0;
}

/**
 * The panoramic quantity controls the number of visible seat columns. Values
 * lower than three use the historical four-column distribution.
 */
export function getTaquillaColumns(panoramicosQuantity: number | string | null | undefined) {
  const panoramicos = normalizeQuantity(panoramicosQuantity);
  return panoramicos >= 3 ? panoramicos : 4;
}

function takeSeatRow(nextSeat: { value: number }, totalSeats: number, columns: number): TaquillaSeatCell[] {
  return Array.from({ length: columns }, () => {
    if (nextSeat.value > totalSeats) return null;
    const seat = nextSeat.value;
    nextSeat.value += 1;
    return seat;
  });
}

function buildSemicamaRows(totalSeats: number, columns: number): TaquillaRow[] {
  const nextSeat = { value: 1 };
  const rows: TaquillaRow[] = [];

  if (totalSeats <= 0) return rows;

  rows.push({ seats: takeSeatRow(nextSeat, totalSeats, columns) });

  // The logo is always placed below the first row. The two rows at its left
  // preserve the four seats (2 x 2) and the logo spans the remaining columns.
  for (let rowIndex = 0; rowIndex < 2 && nextSeat.value <= totalSeats; rowIndex += 1) {
    const seats = Array.from({ length: columns }, (_, columnIndex) => {
      if (columnIndex > 1 || nextSeat.value > totalSeats) return null;
      const seat = nextSeat.value;
      nextSeat.value += 1;
      return seat;
    });
    rows.push({ seats, logoStartColumn: rowIndex === 0 ? 2 : undefined, logoRowSpan: rowIndex === 0 ? 2 : undefined });
  }

  while (nextSeat.value <= totalSeats) {
    rows.push({ seats: takeSeatRow(nextSeat, totalSeats, columns) });
  }

  return rows;
}

function buildCamaRows(totalSeats: number, columns: number): TaquillaRow[] {
  const nextSeat = { value: 1 };
  const rows: TaquillaRow[] = [];

  while (nextSeat.value <= totalSeats) {
    rows.push({ seats: takeSeatRow(nextSeat, totalSeats, columns) });
  }

  return rows;
}

export function buildTaquillaLayout({
  semicamaQuantity,
  camaQuantity,
  panoramicosQuantity,
}: {
  semicamaQuantity: number | string | null | undefined;
  camaQuantity: number | string | null | undefined;
  panoramicosQuantity: number | string | null | undefined;
}): TaquillaLayout {
  const columns = getTaquillaColumns(panoramicosQuantity);

  return {
    columns,
    semicamaRows: buildSemicamaRows(normalizeQuantity(semicamaQuantity), columns),
    camaRows: buildCamaRows(normalizeQuantity(camaQuantity), columns),
  };
}

export function getTaquillaSeatKeys(layout: TaquillaLayout, seatType: "S" | "C") {
  const rows = seatType === "S" ? layout.semicamaRows : layout.camaRows;
  return new Set(
    rows.flatMap((row) => row.seats.filter((seat): seat is number => typeof seat === "number"))
      .map((seat) => `${seatType}-${seat}`)
  );
}
