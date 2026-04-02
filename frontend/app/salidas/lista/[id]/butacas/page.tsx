"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import PDF from "@/app/components/icons/salidas/PDF";
import ButacaDrop from "@/app/components/icons/salidas/ButacaDrop";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Datos de asientos semicama (null = vacío/pasillo, "logo" = logo empresa, number = asiento)
const semicamaLayout: (number | null | "logo")[][] = [
  [1, 2, null, 3, 4],
  [5, 6, null, "logo", null],
  [7, 8, null, null, null],
  [null, null, null, null, null],
  [9, 10, null, 11, 12],
  [13, 14, null, 15, 16],
  [17, 18, null, 19, 20],
  [null, null, null, null, null],
  [21, 22, null, 23, 24],
  [25, 26, null, 27, 28],
  [29, 30, null, 31, 32],
  [33, 34, null, 35, 36],
  [37, 38, null, 39, 40],
  [41, 42, null, 43, 44],
  [45, 46, null, 47, 48],
  [49, 50, null, 51, 52],
];

const camaLayout: (number | null)[][] = [
  [1, 2, null, null, 3],
  [4, 5, null, null, null],
  [6, 7, null, null, null],
  [8, 9, null, null, 10],
];

interface Pasajero {
  id: number;
  nombre: string;
  localidad: string;
}

const pasajerosData: Pasajero[] = [
  { id: 1, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 2, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 3, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 4, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 5, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 6, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 7, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 8, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 9, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 10, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 11, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 12, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 13, nombre: "Demarco Valentin", localidad: "Lanús" },
  { id: 14, nombre: "Demarco Valentin", localidad: "Lanús" },
];

function SeatSlot({
  asiento,
  asignado,
  onDrop,
}: {
  asiento: number;
  asignado?: Pasajero;
  onDrop: (asiento: number, pasajeroId: number) => void;
}) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const pasajeroId = parseInt(e.dataTransfer.getData("pasajeroId"));
    if (!isNaN(pasajeroId)) {
      onDrop(asiento, pasajeroId);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="flex items-center gap-0.5 w-[80px] md:w-[120px]">
      <div className="shrink-0 flex items-center justify-center scale-75 -mx-1 md:scale-100 md:mx-0">
        <ButacaDrop />
      </div>
      <div className="flex flex-col gap-px flex-1 min-w-0">
        <div className="bg-white border border-gray-200 rounded-sm h-3 md:h-4 px-0.5 flex items-center">
          {asignado && (
            <span className="text-[6px] md:text-[9px] text-black font-semibold truncate">
              {asignado.nombre}
            </span>
          )}
        </div>
        <div className="bg-white border border-gray-200 rounded-sm h-3 md:h-4 px-0.5 flex items-center">
          {asignado && (
            <span className="text-[6px] md:text-[9px] text-black truncate">
              {asignado.localidad}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SeatGrid({
  layout,
  asignaciones,
  onDrop,
}: {
  layout: (number | null | "logo")[][];
  asignaciones: Record<string, Pasajero>;
  onDrop: (asiento: number, pasajeroId: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {layout.map((row, rowIdx) => {
        const isEmptyRow = row.every((cell) => cell === null);
        if (isEmptyRow) {
          return <div key={rowIdx} className="h-3" />;
        }

        const leftPair = [row[0], row[1]];
        const rightPair = [row[3], row[4]];
        const hasLogo = row[3] === "logo";

        return (
          <div key={rowIdx} className="flex items-center justify-center gap-2">
            {/* Par izquierdo */}
            <div className="flex items-center gap-1">
              {leftPair.map((cell, colIdx) => {
                if (cell === null)
                  return <div key={colIdx} className="w-[80px] h-8" />;
                const seatKey = `seat-${cell}`;
                return (
                  <SeatSlot
                    key={colIdx}
                    asiento={cell as number}
                    asignado={asignaciones[seatKey]}
                    onDrop={onDrop}
                  />
                );
              })}
            </div>

            {/* Par derecho */}
            <div className="flex items-center gap-1">
              {hasLogo ? (
                <div className="flex items-center justify-center bg-secondary rounded-lg px-3 py-2 w-[164px]">
                  <img
                    src="/logo-empresa.png"
                    alt="Logo"
                    className="h-12 object-contain"
                  />
                </div>
              ) : (
                rightPair.map((cell, colIdx) => {
                  if (cell === null)
                    return <div key={colIdx} className="w-[80px] h-8" />;
                  const seatKey = `seat-${cell}`;
                  return (
                    <SeatSlot
                      key={colIdx}
                      asiento={cell as number}
                      asignado={asignaciones[seatKey]}
                      onDrop={onDrop}
                    />
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PasajeroCard({ pasajero }: { pasajero: Pasajero }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("pasajeroId", pasajero.id.toString());
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="bg-[#D9DFF5] border border-[#3DADFF] rounded-md cursor-grab active:cursor-grabbing text-center md:border-primary">
      <p className="text-xs font-semibold py-1 text-black">{pasajero.nombre}</p>
      <p className="text-xs py-1 bg-primary text-white">{pasajero.localidad}</p>
    </div>
  );
}

export default function ButacasPage() {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };

  const [asignaciones, setAsignaciones] = useState<Record<string, Pasajero>>(
    {},
  );
  const [pasajerosDisponibles, setPasajerosDisponibles] =
    useState<Pasajero[]>(pasajerosData);

  const handleDrop = (asiento: number, pasajeroId: number) => {
    const key = `seat-${asiento}`;
    if (asignaciones[key]) return; // ya asignado

    const pasajero = pasajerosDisponibles.find((p) => p.id === pasajeroId);
    if (!pasajero) return;

    setAsignaciones((prev) => ({ ...prev, [key]: pasajero }));
    setPasajerosDisponibles((prev) => prev.filter((p) => p.id !== pasajeroId));
  };

  return (
    <Container>
      <section className="flex flex-col mx-3 gap-3">
        <button
          onClick={handleBack}
          className="flex items-center cursor-pointer justify-start gap-3">
          <ArrowLeft color="#6005F7" />
          <h1 className="font-medium my-3 text-sm text-secondary">
            Volver a la lista
          </h1>
        </button>
      </section>
      <section className="mx-3 flex flex-col gap-3 md:max-w-md md:mx-auto">
        <h2 className="my-5 text-black font-semibold md:hidden">Taquilla</h2>
        <select
          className="text-gray-500 font-medium bg-[#f1f1f1] w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino">
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Tipo de micro
          </option>
          <option className="bg-[#f1f1f1]" value="Termas de Rio Hondo">
            Micro 1
          </option>
          <option className="bg-[#f1f1f1]" value="Termas de Rio Hondo">
            Micro 2
          </option>
          <option className="bg-[#f1f1f1]" value="Termas de Rio Hondo">
            Micro 3
          </option>
        </select>
        <button className="w-full my-5 bg-primary cursor-pointer text-white font-medium text-center py-2 rounded-xl">
          Confirmar
        </button>
      </section>
      <section className="text-black mx-3 md:max-w-md md:mx-auto">
        <ul className="flex items-start justify-center flex-col gap-3 font-medium md:flex-row">
          <li className="flex gap-2">
            <Excel />
            Exportar
          </li>
          <li className="flex gap-2">
            <PDF />
            Descargar PDF
          </li>
        </ul>
      </section>

      {/* Contenedor butacas + pasajeros: columna en mobile, fila en desktop */}
      <div className="flex flex-col md:flex-row md:justify-center md:gap-30 md:mt-6">
        {/* Columna izquierda: Butacas */}
        <div className="flex flex-col">
          {/* Butacas semicama */}
          <section className="mx-3 md:mx-0 md:px-8 text-black flex flex-col gap-3">
            <h2 className="my-5 font-semibold">Butacas semicama</h2>
            <div className="flex justify-center md:justify-start">
              <SeatGrid
                layout={semicamaLayout}
                asignaciones={asignaciones}
                onDrop={handleDrop}
              />
            </div>
          </section>

          {/* Butacas cama */}
          <section className="mx-3 md:mx-0 md:px-8 text-black flex flex-col gap-3">
            <h2 className="my-5 font-semibold">Butacas cama</h2>
            <div className="flex justify-center md:justify-start">
              <SeatGrid
                layout={camaLayout}
                asignaciones={asignaciones}
                onDrop={handleDrop}
              />
            </div>
          </section>
        </div>

        {/* Separador vertical (solo desktop) */}
        <div className="hidden md:block w-px bg-gray-300 self-stretch" />

        {/* Columna derecha: Pasajeros */}
        <section className="mx-3 md:mx-0 md:px-8 text-black flex flex-col gap-3 mb-6 md:w-80">
          <h2 className="my-5 font-semibold">Pasajeros</h2>
          <div className="grid grid-cols-2 gap-3">
            {pasajerosDisponibles.map((p) => (
              <PasajeroCard key={p.id} pasajero={p} />
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
