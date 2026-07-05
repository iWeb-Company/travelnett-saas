"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import PDF from "@/app/components/icons/salidas/PDF";
import ButacaDrop from "@/app/components/icons/salidas/ButacaDrop";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "@/app/components/Loader";

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
  id: string; // reservation_id
  nombre: string;
  localidad: string;
}

function SeatSlot({
  asiento,
  asignado,
  layoutType,
  onDrop,
}: {
  asiento: number;
  asignado?: Pasajero;
  layoutType: "S" | "C";
  onDrop: (layoutType: "S" | "C", asiento: number, reservationId: string) => void;
}) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const reservationId = e.dataTransfer.getData("reservationId");
    if (reservationId) {
      onDrop(layoutType, asiento, reservationId);
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
  layoutType,
  asignaciones,
  onDrop,
}: {
  layout: (number | null | "logo")[][];
  layoutType: "S" | "C";
  asignaciones: Record<string, Pasajero>;
  onDrop: (layoutType: "S" | "C", asiento: number, reservationId: string) => void;
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
                const seatKey = `${layoutType}-${cell}`;
                return (
                  <SeatSlot
                    key={colIdx}
                    asiento={cell as number}
                    layoutType={layoutType}
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
                  const seatKey = `${layoutType}-${cell}`;
                  return (
                    <SeatSlot
                      key={colIdx}
                      asiento={cell as number}
                      layoutType={layoutType}
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
    e.dataTransfer.setData("reservationId", pasajero.id);
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
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();
  
  const [salida, setSalida] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [asignaciones, setAsignaciones] = useState<Record<string, Pasajero>>({});
  const [pasajerosDisponibles, setPasajerosDisponibles] = useState<Pasajero[]>([]);

  // Guardamos el estado original para saber a quiénes desasignar al confirmar
  const [initialReservations, setInitialReservations] = useState<any[]>([]);

  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.iweb_client_id || !id) return;
      try {
        // Cargar detalles de la salida
        const s = await apiClient.getSalida(user.iweb_client_id, id);
        setSalida(s);

        // Cargar todas las reservas de esta salida
        const reservas = await apiClient.getReservas(user.iweb_client_id, id);
        setInitialReservations(reservas);

        const newAsignaciones: Record<string, Pasajero> = {};
        const newDisponibles: Pasajero[] = [];

        reservas.forEach((r: any) => {
          const pData: Pasajero = {
            id: r.id, // reservation_id
            nombre: r.nombre_completo || "Desconocido",
            localidad: r.lugar_carga_nombre || "-",
          };

          if (r.butaca && (r.butaca.startsWith("S-") || r.butaca.startsWith("C-"))) {
            newAsignaciones[r.butaca] = pData;
          } else {
            newDisponibles.push(pData);
          }
        });

        setAsignaciones(newAsignaciones);
        setPasajerosDisponibles(newDisponibles);
      } catch (err) {
        console.error("Error loading manifest data:", err);
        toast.error("Error al cargar los datos del viaje");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.iweb_client_id, id]);

  const handleDrop = (layoutType: "S" | "C", asiento: number, reservationId: string) => {
    const newKey = `${layoutType}-${asiento}`;
    if (asignaciones[newKey]) return; // asiento ya ocupado

    // Buscar pasajero en disponibles
    let pasajero = pasajerosDisponibles.find((p) => p.id === reservationId);

    // Si no está en disponibles, buscar en asignaciones actuales (movimiento de butaca a butaca)
    let oldKey: string | null = null;
    if (!pasajero) {
      for (const [key, p] of Object.entries(asignaciones)) {
        if (p.id === reservationId) {
          pasajero = p;
          oldKey = key;
          break;
        }
      }
    }

    if (!pasajero) return;

    setAsignaciones((prev) => {
      const copy = { ...prev };
      if (oldKey) {
        delete copy[oldKey];
      }
      copy[newKey] = pasajero!;
      return copy;
    });

    if (!oldKey) {
      // Si vino de la lista de disponibles, removerlo de ahí
      setPasajerosDisponibles((prev) => prev.filter((p) => p.id !== reservationId));
    }
  };

  const handleConfirm = async () => {
    if (!user?.iweb_client_id || isSaving) return;
    setIsSaving(true);
    const toastId = toast.loading("Guardando distribución de butacas...");

    try {
      // 1. Identificar asignaciones activas
      // 2. Para cada reserva original, actualizar su butaca y tipo_butaca correspondientes
      const promises = initialReservations.map((r) => {
        // Buscar si esta reserva tiene un asiento asignado en el estado actual
        let assignedKey: string | null = null;
        for (const [key, p] of Object.entries(asignaciones)) {
          if (p.id === r.id) {
            assignedKey = key;
            break;
          }
        }

        if (assignedKey) {
          const type = assignedKey.startsWith("S-") ? "semicama" : "cama";
          return apiClient.updateReserva(user.iweb_client_id!, r.id, {
            butaca: assignedKey,
            tipo_butaca: type,
          });
        } else {
          // Si no está asignado, limpiar butaca y tipo_butaca
          return apiClient.updateReserva(user.iweb_client_id!, r.id, {
            butaca: null,
            tipo_butaca: null,
          });
        }
      });

      await Promise.all(promises);
      toast.success("Distribución de butacas guardada con éxito", { id: toastId });
      router.back();
    } catch (err) {
      console.error("Error saving seat layout:", err);
      toast.error("Error al guardar la distribución de butacas", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

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
        <div className="text-gray-700 font-medium bg-[#f9f9fc] w-full border border-gray-300 py-3 px-4 rounded-lg shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Empresa / Micro</p>
          <p className="text-sm font-semibold">{salida?.transport_company || "Cargando..."}</p>
          <p className="text-xs text-gray-500 mt-1">Destino: {salida?.destino}</p>
        </div>
        <button 
          onClick={handleConfirm} 
          disabled={isSaving}
          className="w-full my-5 bg-primary cursor-pointer text-white font-medium text-center py-2 rounded-xl disabled:opacity-50"
        >
          {isSaving ? "Guardando..." : "Confirmar"}
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
            <h2 className="my-5 font-semibold">Butacas semicama ({salida?.semicama_disponibles} libres / {salida?.semicama} totales)</h2>
            <div className="flex justify-center md:justify-start">
              <SeatGrid
                layout={semicamaLayout}
                layoutType="S"
                asignaciones={asignaciones}
                onDrop={handleDrop}
              />
            </div>
          </section>

          {/* Butacas cama */}
          <section className="mx-3 md:mx-0 md:px-8 text-black flex flex-col gap-3">
            <h2 className="my-5 font-semibold">Butacas cama ({salida?.cama_disponibles} libres / {salida?.cama} totales)</h2>
            <div className="flex justify-center md:justify-start">
              <SeatGrid
                layout={camaLayout}
                layoutType="C"
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
          <h2 className="my-5 font-semibold">Pasajeros Sin Asignar ({pasajerosDisponibles.length})</h2>
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
            {pasajerosDisponibles.map((p) => (
              <PasajeroCard key={p.id} pasajero={p} />
            ))}
            {pasajerosDisponibles.length === 0 && (
              <p className="col-span-2 text-center text-xs text-gray-400 py-4">Todos los pasajeros tienen asiento asignado</p>
            )}
          </div>
        </section>
      </div>
    </Container>
  );
}
