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
import { Salida } from "@/app/types";
import { exportTaquillaToExcel, exportTaquillaToPdf } from "@/app/utils/exportTaquilla";
import Link from "next/link";

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
  pasajero_id?: string;
  pasajero_type?: string;
  uniqueId?: string;
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
  const handleDragStart = (e: React.DragEvent) => {
    if (!asignado) return;
    e.dataTransfer.setData("reservationId", asignado.uniqueId || asignado.id);
  };

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
      draggable={!!asignado}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex items-center gap-0.5 w-[80px] md:w-[120px] p-0.5 rounded transition-colors ${asignado ? "cursor-grab active:cursor-grabbing hover:bg-blue-100/60" : ""
        }`}>
      <div className="shrink-0 flex items-center justify-center scale-75 -mx-1 md:scale-100 md:mx-0">
        <ButacaDrop />
      </div>
      <div className="flex flex-col gap-px flex-1 min-w-0">
        <div className={`bg-white border rounded-sm h-3 md:h-4 px-0.5 flex items-center ${asignado ? "border-blue-400 bg-blue-50/70" : "border-gray-200"}`}>
          {asignado && (
            <span className="text-[6px] md:text-[9px] text-black font-semibold truncate" title={asignado.nombre}>
              {asignado.nombre}
            </span>
          )}
        </div>
        <div className={`bg-white border rounded-sm h-3 md:h-4 px-0.5 flex items-center ${asignado ? "border-blue-400 bg-blue-50/70" : "border-gray-200"}`}>
          {asignado && (
            <span className="text-[6px] md:text-[9px] text-black truncate" title={asignado.localidad}>
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
  const { iwebClient } = useAuth();
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
                    src={iwebClient?.logo_s || iwebClient?.logo_xl || "/logo-empresa.png"}
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
    e.dataTransfer.setData("reservationId", pasajero.uniqueId || pasajero.id);
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
  const { user, iwebClient } = useAuth();

  const [salida, setSalida] = useState<Salida | null>(null);
  const [destinoName, setDestinoName] = useState<string>("");
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
        const getDestinos = await apiClient.getParameters('get_destinos', user.iweb_client_id);
        const getDestinoName = getDestinos.find((d: any) => d.id === s.destino);
        setDestinoName(getDestinoName?.name);
        const newAsignaciones: Record<string, Pasajero> = {};
        const newDisponibles: Pasajero[] = [];

        reservas.forEach((r: any) => {
          const paxs = r.reservation_passengers && r.reservation_passengers.length > 0
            ? r.reservation_passengers
            : [{
              pasajero_id: r.passenger_id || r.id,
              pasajero_type: r.edad_categoria || "ADL",
              nombre_completo: r.nombre_completo || "Desconocido",
              butaca_number: r.butaca ? Number(r.butaca.split("-")[1]) : null,
              butaca_type: r.tipo_butaca || (r.butaca ? (r.butaca.startsWith("S-") ? "semicama" : "cama") : null)
            }];

          paxs.forEach((pax: any) => {
            const passengerId = pax.pasajero_id || pax.passenger_id || r.passenger_id || pax.id || r.id;
            const uId = `${r.id}_${passengerId}`;
            const pData: Pasajero = {
              id: r.id,
              nombre: pax.nombre_completo || "Desconocido",
              localidad: pax.lugar_carga_nombre || r.lugar_carga_nombre || "-",
              pasajero_id: passengerId,
              pasajero_type: pax.pasajero_type || pax.edad_categoria || r.edad_categoria || "ADL",
              uniqueId: uId
            };

            const butacaKey = pax.butaca_number !== null && pax.butaca_number !== undefined && pax.butaca_type
              ? `${pax.butaca_type === "semicama" ? "S" : "C"}-${pax.butaca_number}`
              : (r.butaca && paxs.length === 1 ? r.butaca : null);

            if (butacaKey && (butacaKey.startsWith("S-") || butacaKey.startsWith("C-"))) {
              newAsignaciones[butacaKey] = pData;
            } else {
              newDisponibles.push(pData);
            }
          });
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

  const handleDrop = (layoutType: "S" | "C", asiento: number, uniqueId: string) => {
    const newKey = `${layoutType}-${asiento}`;

    // 1. Find passenger being dragged (A) in unassigned list or in current seat assignments
    let pasajeroA = pasajerosDisponibles.find((p) => p.uniqueId === uniqueId);
    let oldKeyA: string | null = null;

    if (!pasajeroA) {
      for (const [key, p] of Object.entries(asignaciones)) {
        if (p.uniqueId === uniqueId) {
          pasajeroA = p;
          oldKeyA = key;
          break;
        }
      }
    }

    if (!pasajeroA) return;

    // 2. Check if target seat has a passenger (B)
    const pasajeroB = asignaciones[newKey];

    // If target seat is occupied by the exact same passenger, do nothing
    if (pasajeroB && pasajeroB.uniqueId === uniqueId) return;

    setAsignaciones((prev) => {
      const copy = { ...prev };

      // Remove passenger A from old seat if assigned
      if (oldKeyA) {
        delete copy[oldKeyA];
      }

      // If target seat was occupied by passenger B:
      if (pasajeroB) {
        if (oldKeyA) {
          // Swap: put passenger B into passenger A's old seat
          copy[oldKeyA] = pasajeroB;
        } else {
          // Put passenger B back into unassigned passengers list
          setPasajerosDisponibles((prevDisp) => {
            if (prevDisp.some((p) => p.uniqueId === pasajeroB.uniqueId)) return prevDisp;
            return [...prevDisp, pasajeroB];
          });
        }
      }

      // Assign passenger A to target seat
      copy[newKey] = pasajeroA!;
      return copy;
    });

    if (!oldKeyA) {
      // Remove passenger A from unassigned list since they came from there
      setPasajerosDisponibles((prev) => prev.filter((p) => p.uniqueId !== uniqueId));
    }
  };

  const handleDropToUnassigned = (uniqueId: string) => {
    let oldKey: string | null = null;
    let pasajero: Pasajero | null = null;

    for (const [key, p] of Object.entries(asignaciones)) {
      if (p.uniqueId === uniqueId) {
        pasajero = p;
        oldKey = key;
        break;
      }
    }

    if (pasajero && oldKey) {
      setAsignaciones((prev) => {
        const copy = { ...prev };
        delete copy[oldKey!];
        return copy;
      });
      setPasajerosDisponibles((prev) => {
        if (prev.some((p) => p.uniqueId === uniqueId)) return prev;
        return [...prev, pasajero!];
      });
    }
  };

  const handleConfirm = async () => {
    if (!user?.iweb_client_id || isSaving) return;
    setIsSaving(true);
    const toastId = toast.loading("Guardando distribución de butacas...");

    try {
      const promises = initialReservations.map((r) => {
        const paxs = r.reservation_passengers && r.reservation_passengers.length > 0
          ? r.reservation_passengers
          : [{
            pasajero_id: r.passenger_id || r.id,
            pasajero_type: r.edad_categoria || "ADL",
          }];

        const passengersPayload = paxs.map((pax: any) => {
          const passengerId = pax.pasajero_id || pax.passenger_id || r.passenger_id || pax.id || r.id;
          const uId = `${r.id}_${passengerId}`;

          let assignedKey: string | null = null;
          for (const [key, p] of Object.entries(asignaciones)) {
            if (p.uniqueId === uId) {
              assignedKey = key;
              break;
            }
          }

          let bNum = null;
          let bType = null;
          if (assignedKey) {
            bNum = Number(assignedKey.split("-")[1]);
            bType = assignedKey.startsWith("S-") ? "semicama" : "cama";
          }

          return {
            pasajero_id: passengerId,
            pasajero_type: pax.pasajero_type || pax.edad_categoria || r.edad_categoria || "ADL",
            butaca_number: bNum,
            butaca_type: bType
          };
        });

        return apiClient.updateReserva(user.iweb_client_id!, r.id, {
          passengers: passengersPayload
        });
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

  const handleExportExcel = async () => {
    try {
      toast.loading("Generando Excel de taquilla...", { id: "export-taquilla" });
      await exportTaquillaToExcel({
        transportCompany: salida?.transport_company,
        destinoName: destinoName,
        salidaDate: salida?.date_of_out,
        asignaciones,
      });
      toast.success("Excel descargado correctamente", { id: "export-taquilla" });
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      toast.error("Error al generar el archivo Excel", { id: "export-taquilla" });
    }
  };

  const handleExportPdf = () => {
    try {
      toast.loading("Generando PDF de taquilla...", { id: "export-taquilla" });
      exportTaquillaToPdf({
        transportCompany: salida?.transport_company,
        destinoName: destinoName,
        salidaDate: salida?.date_of_out,
        asignaciones,
      });
      toast.success("PDF descargado correctamente", { id: "export-taquilla" });
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("Error al generar el archivo PDF", { id: "export-taquilla" });
    }
  };


  return (
    <Container>
      <section className="flex flex-col mx-3 my-10 gap-3">
        <div className="flex flex-col gap-2">
          <Link
            href="/dashboard"
            className="flex items-center cursor-pointer justify-start gap-3">
            <ArrowLeft color="#6005F7" />
            <h2 className="font-semibold text-lg text-primary">
              Volver al menu
            </h2>
          </Link>
          <button
            onClick={handleBack}
            className="flex items-center cursor-pointer justify-start gap-3">
            <ArrowLeft color="#6005F7" />
            <h1 className="font-semibold text-lg text-secondary">
              Volver a la Lista
            </h1>
          </button>
        </div>
      </section>
      <section className="mx-3 flex flex-col gap-3 md:max-w-md md:mx-auto">
        <h2 className="my-5 text-black font-semibold md:hidden">Taquilla</h2>
        <div className="text-gray-700 font-medium bg-[#f9f9fc] w-full border border-gray-300 py-3 px-4 rounded-lg shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase">Empresa / Micro</p>
          <p className="text-sm font-semibold">{salida?.transport_company || "Cargando..."}</p>
          <p className="text-xs text-gray-500 mt-1">Destino: {destinoName ?? 'Cargando...'}</p>
        </div>
        <button
          onClick={handleConfirm}
          disabled={isSaving}
          className="w-full my-5 bg-primary cursor-pointer text-white font-medium text-center py-2 rounded-xl disabled:opacity-50"
        >
          {isSaving ? "Guardando..." : "Confirmar"}
        </button>
      </section>
      <section className="text-black mx-3 md:max-w-md md:mx-auto select-none">
        <ul className="flex items-start justify-center flex-col gap-3 font-medium md:flex-row">
          <li
            onClick={handleExportExcel}
            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors px-4 py-2 rounded-lg"
          >
            <Excel />
            <span>Exportar Excel</span>
          </li>
          <li
            onClick={handleExportPdf}
            className="flex items-center gap-2 cursor-pointer hover:text-secondary transition-colors px-4 py-2 rounded-lg"
          >
            <PDF />
            <span>Descargar PDF</span>
          </li>
        </ul>
      </section>

      {/* Contenedor butacas + pasajeros: columna en mobile, fila en desktop */}
      <div className="flex flex-col md:flex-row md:justify-center md:gap-30 md:my-10">
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
        <section
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const uniqueId = e.dataTransfer.getData("reservationId");
            if (uniqueId) handleDropToUnassigned(uniqueId);
          }}
          className="mx-3 md:mx-0 md:px-8 text-black flex flex-col gap-3 mb-6 md:w-80 border-2 border-dashed border-transparent hover:border-blue-300/60 rounded-xl transition-colors"
        >
          <h2 className="my-5 font-semibold">Pasajeros Sin Asignar ({pasajerosDisponibles.length})</h2>
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
            {pasajerosDisponibles.map((p) => (
              <PasajeroCard key={p.uniqueId || p.id} pasajero={p} />
            ))}
            {pasajerosDisponibles.length === 0 && (
              <p className="col-span-2 text-center text-xs text-gray-400 py-4">Todos los pasajeros tienen asiento asignado (Arrastra aquí para desasignar)</p>
            )}
          </div>
        </section>
      </div>
    </Container>
  );
}
