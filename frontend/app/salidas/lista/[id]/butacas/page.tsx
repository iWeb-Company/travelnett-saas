"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import PDF from "@/app/components/icons/salidas/PDF";
import ButacaDrop from "@/app/components/icons/salidas/ButacaDrop";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { BusType, Salida, SalidaTransportUnit } from "@/app/types";
import {
  exportTaquillaToExcel,
  exportTaquillaToPdf,
} from "@/app/utils/exportTaquilla";
import { formatPassengerName, formatFullName } from "@/lib/formatPassengerName";
import { buildTaquillaLayout, TaquillaRow } from "@/app/utils/taquillaLayout";
import Link from "next/link";

// Datos de asientos semicama (null = vacío/pasillo, "logo" = logo empresa, number = asiento)
// Datos de asientos cama (1 al 12)
interface Pasajero {
  id: string; // reservation_id
  nombre: string;
  localidad: string;
  pasajero_id?: string;
  pasajero_type?: string;
  butaca_type?: string;
  uniqueId?: string;
  observations?: string;
  reservationPassengerId?: string;
}

function layoutForBusType(busType?: BusType) {
  return buildTaquillaLayout({
    semicamaQuantity: busType?.semicama_quantity,
    camaQuantity: busType?.cama_quantity,
    panoramicosQuantity: busType?.panoramicos_quantity,
  });
}

function ObservationBadge({
  text,
  isSeat = false,
}: {
  text: string;
  isSeat?: boolean;
}) {
  const [coords, setCoords] = useState<{
    x: number;
    y: number;
    placeAbove: boolean;
  } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const placeAbove = rect.top > 160;
    setCoords({
      x: rect.left + rect.width / 2,
      y: placeAbove ? rect.top - 8 : rect.bottom + 8,
      placeAbove,
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setCoords(null);
  };

  return (
    <>
      <span
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={
          isSeat
            ? "bg-primary rounded-full h-3 w-3 md:h-3.5 md:w-3.5 flex items-center justify-center text-white text-[7px] md:text-[8px] font-bold cursor-help select-none shadow-sm hover:opacity-90 transition-opacity"
            : "bg-primary rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center text-white text-[10px] md:text-xs font-semibold cursor-pointer select-none shadow-sm hover:opacity-90 transition-opacity"
        }>
        ?
      </span>
      {coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              left: `${coords.x}px`,
              top: `${coords.y}px`,
              transform: coords.placeAbove
                ? "translate(-50%, -100%)"
                : "translate(-50%, 0)",
              zIndex: 999999,
              pointerEvents: "none",
            }}
            className="w-52 space-y-1 bg-primary text-white rounded-xl px-3 py-2.5 font-medium flex flex-col items-center text-center whitespace-normal drop-shadow-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <p className="text-xs leading-relaxed">{text}</p>
          </div>,
          document.body,
        )}
    </>
  );
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
  onDrop: (
    layoutType: "S" | "C",
    asiento: number,
    reservationId: string,
  ) => void;
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
      aria-label={`Butaca ${layoutType}-${asiento}`}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative flex items-center gap-0.5 w-[80px] md:w-[120px] p-0.5 rounded transition-colors ${
        asignado
          ? "cursor-grab active:cursor-grabbing hover:bg-blue-100/60"
          : ""
      }`}>
      <div className="shrink-0 flex items-center justify-center scale-75 -mx-1 md:scale-100 md:mx-0">
        <ButacaDrop />
      </div>
      <div className="flex flex-col gap-px flex-1 min-w-0 relative">
        {asignado?.observations && (
          <div className="relative flex justify-end -mb-0.5 z-20">
            <ObservationBadge text={asignado.observations} isSeat />
          </div>
        )}
        <div
          className={`bg-white border rounded-sm h-3 md:h-4 px-0.5 flex items-center ${asignado ? "border-blue-400 bg-blue-50/70" : "border-gray-200"}`}>
          {asignado && (
            <span
              className="text-[6px] md:text-[9px] text-black font-semibold truncate"
              title={asignado.nombre}>
              {asignado.nombre}
            </span>
          )}
        </div>
        <div
          className={`bg-white border rounded-sm h-3 md:h-4 px-0.5 flex items-center ${asignado ? "border-blue-400 bg-blue-50/70" : "border-gray-200"}`}>
          {asignado && (
            <span
              className="text-[6px] md:text-[9px] text-black truncate"
              title={asignado.localidad}>
              {asignado.localidad}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SeatGrid({
  rows,
  columns,
  layoutType,
  asignaciones,
  onDrop,
}: {
  rows: TaquillaRow[];
  columns: number;
  layoutType: "S" | "C";
  asignaciones: Record<string, Pasajero>;
  onDrop: (
    layoutType: "S" | "C",
    asiento: number,
    reservationId: string,
  ) => void;
}) {
  const { iwebClient } = useAuth();
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, rowIdx) => {
        return (
          <div
            key={rowIdx}
            className="relative hover:z-50 focus-within:z-50 grid items-center gap-1"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(80px, 120px))`,
            }}>
            {row.seats.map((seat, columnIdx) => {
              if (
                row.logoStartColumn !== undefined &&
                columnIdx >= row.logoStartColumn
              )
                return null;
              if (seat === null) return <div key={columnIdx} className="h-8" />;
              const seatKey = `${layoutType}-${seat}`;
              return (
                <SeatSlot
                  key={columnIdx}
                  asiento={seat}
                  layoutType={layoutType}
                  asignado={asignaciones[seatKey]}
                  onDrop={onDrop}
                />
              );
            })}
            {row.logoStartColumn !== undefined && (
              <div
                className="flex items-center justify-center bg-secondary rounded-lg px-3 py-2 min-h-[64px]"
                style={{
                  gridColumn: `${row.logoStartColumn + 1} / span ${columns - row.logoStartColumn}`,
                  gridRow: `span ${row.logoRowSpan || 1} / span ${row.logoRowSpan || 1}`,
                }}>
                <img
                  src={
                    iwebClient?.logo_s ||
                    iwebClient?.logo_xl ||
                    "/logo-empresa.png"
                  }
                  alt="Logo Empresa"
                  className="h-12 object-contain"
                />
              </div>
            )}
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
      className="bg-[#D9DFF5] border border-[#3DADFF] rounded-md cursor-grab active:cursor-grabbing text-center md:border-primary relative flex flex-col justify-between">
      {pasajero.observations && (
        <div className="absolute top-0.5 right-1 z-20">
          <ObservationBadge text={pasajero.observations} />
        </div>
      )}
      <p
        className="text-xs font-semibold py-1 text-black truncate px-1 pr-6"
        title={pasajero.nombre}>
        {pasajero.nombre}
      </p>
      <p
        className="text-xs py-1 bg-primary rounded-b-md text-white truncate px-1"
        title={pasajero.localidad}>
        {pasajero.localidad}
      </p>
    </div>
  );
}

function TaquillaSwitchSkeleton() {
  const skeletonSeat = (key: number) => (
    <div
      key={key}
      className="relative flex items-center gap-0.5 w-[80px] md:w-[120px] p-0.5 rounded">
      <div className="shrink-0 w-5 h-7 md:w-7 md:h-9 rounded bg-gray-200" />
      <div className="flex flex-col gap-px flex-1 min-w-0">
        <div className="h-3 md:h-4 rounded-sm bg-gray-200" />
        <div className="h-3 md:h-4 rounded-sm bg-gray-200" />
      </div>
    </div>
  );

  const skeletonSeatSection = (label: string, rows: number) => (
    <section
      key={label}
      className="mx-3 md:mx-0 md:px-8 text-black flex flex-col gap-3">
      <div className="h-5 w-72 rounded bg-gray-200" />
      <div className="flex flex-col gap-1.5">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="grid grid-cols-4 items-center gap-1">
            {Array.from({ length: 4 }).map((__, seatIndex) =>
              skeletonSeat(rowIndex * 4 + seatIndex),
            )}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div
      className="flex flex-col md:flex-row md:justify-center md:gap-30 md:my-10 animate-pulse"
      aria-busy="true"
      aria-label="Cargando la taquilla del micro seleccionado">
      <div className="flex flex-col gap-8">
        {skeletonSeatSection("semicama", 6)}
        {skeletonSeatSection("cama", 3)}
      </div>
      <div className="hidden md:block w-px bg-gray-200 self-stretch" />
      <div className="mx-3 md:mx-0 md:px-8 md:w-80 space-y-4">
        <div className="h-5 w-52 rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-14 rounded-md border border-gray-200 bg-[#D9DFF5]"
            />
          ))}
        </div>
      </div>
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
  const [companyName, setCompanyName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [asignaciones, setAsignaciones] = useState<Record<string, Pasajero>>(
    {},
  );
  const [pasajerosDisponibles, setPasajerosDisponibles] = useState<Pasajero[]>(
    [],
  );
  const [busTypes, setBusTypes] = useState<BusType[]>([]);
  const [transportCompanies, setTransportCompanies] = useState<any[]>([]);
  const [selectedBusTypeId, setSelectedBusTypeId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<SalidaTransportUnit | null>(
    null,
  );
  const [isSwitchingMicro, setIsSwitchingMicro] = useState(false);
  const [reload, setReload] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [clearedAssignments, setClearedAssignments] = useState<Set<string>>(
    () => new Set(),
  );

  const selectedBusType = useMemo(
    () =>
      selectedUnit && selectedBusTypeId === selectedUnit.type_bus
        ? ({
            ...selectedUnit.layout_snapshot,
            id: selectedUnit.type_bus || "",
            name: selectedUnit.layout_snapshot.name || "",
          } as BusType)
        : busTypes.find(
            (busType) =>
              busType.id === selectedBusTypeId ||
              busType.name === selectedBusTypeId,
          ),
    [busTypes, selectedBusTypeId, selectedUnit],
  );
  const taquillaLayout = useMemo(
    () => layoutForBusType(selectedBusType),
    [selectedBusType],
  );
  const semicamaTotal = Number(selectedBusType?.semicama_quantity) || 0;
  const camaTotal = Number(selectedBusType?.cama_quantity) || 0;
  const semicamaAssigned = Object.keys(asignaciones).filter((key) =>
    key.startsWith("S-"),
  ).length;
  const camaAssigned = Object.keys(asignaciones).filter((key) =>
    key.startsWith("C-"),
  ).length;
  const pasajerosSemicama = pasajerosDisponibles.filter(
    (passenger) => passenger.butaca_type?.toLowerCase() !== "cama",
  );
  const pasajerosCama = pasajerosDisponibles.filter(
    (passenger) => passenger.butaca_type?.toLowerCase() === "cama",
  );

  const handleBack = () => {
    router.back();
  };

  const handleMicroChange = (nextUnitId: string) => {
    const nextUnit =
      (salida?.transport_units || []).find(
        (unit: SalidaTransportUnit) => unit.active && unit.id === nextUnitId,
      ) || null;
    setSelectedUnitId(nextUnitId);
    setIsSwitchingMicro(Boolean(nextUnitId));
    setSelectedUnit(nextUnit);
    setSelectedBusTypeId(nextUnit?.type_bus || "");
    setAsignaciones({});
    setPasajerosDisponibles([]);
    setClearedAssignments(new Set());
    setDirty(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.iweb_client_id || !id) return;
      const isMicroSwitch = Boolean(selectedUnitId && salida);
      if (isMicroSwitch) setIsSwitchingMicro(true);
      if (!isMicroSwitch) setLoading(true);
      try {
        let s: any;
        let reservas: any[];
        let destinos: any[];
        let loadedBusTypes: BusType[];
        let loadedTransportCompanies: any[];
        if (isMicroSwitch) {
          s = salida;
          reservas = await apiClient.getReservas(user.iweb_client_id, id);
          destinos = [];
          loadedBusTypes = busTypes;
          loadedTransportCompanies = transportCompanies;
        } else {
          [s, reservas, destinos, loadedBusTypes, loadedTransportCompanies] =
            await Promise.all([
              apiClient.getSalida(user.iweb_client_id, id),
              apiClient.getReservas(user.iweb_client_id, id),
              apiClient
                .getParameters("get_destinos", user.iweb_client_id)
                .catch(() => []),
              apiClient
                .getParameters("get_bus_types", user.iweb_client_id)
                .catch(() => []),
              apiClient
                .getParameters("get_transport_companies", user.iweb_client_id)
                .catch(() => []),
            ]);
        }
        setSalida(s);
        const units = (s.transport_units || []).filter(
          (unit: SalidaTransportUnit) => unit.active,
        );
        const requestedUnit =
          selectedUnitId ||
          new URLSearchParams(window.location.search).get("micro");
        const unit =
          units.find(
            (item: SalidaTransportUnit) => item.id === requestedUnit,
          ) || units[0] || null;
        setSelectedUnit(unit);
        const getDestinoName = destinos.find((d: any) => d.id === s.destino);
        // Use the freshly loaded catalog on the initial request. React state
        // still contains the previous (empty) catalog at this point.
        const getComapanyName = loadedTransportCompanies.find(
          (c: any) => c.id === unit?.transport_company,
        );
        if (!isMicroSwitch) setDestinoName(getDestinoName?.name);
        setCompanyName(getComapanyName?.name || "");
        const types = (loadedBusTypes || []) as BusType[];
        if (!isMicroSwitch) setBusTypes(types);
        if (!isMicroSwitch)
          setTransportCompanies(loadedTransportCompanies || []);
        setSelectedBusTypeId(unit?.type_bus || "");
        const newAsignaciones: Record<string, Pasajero> = {};
        const newDisponibles: Pasajero[] = [];

        reservas.forEach((r: any) => {
          if (r.active === false || !unit) return;
          const paxs = r.reservation_passengers || [];

          paxs.forEach((pax: any) => {
            if (
              !pax.id ||
              String(pax.bus_number || "").trim() !== String(unit.number)
            )
              return;
            const passengerId =
              pax.pasajero_id ||
              pax.passenger_id ||
              r.passenger_id ||
              pax.id ||
              r.id;
            const uId = pax.id;
            let rawNom = pax.nombre_completo || "";
            if (pax.name || pax.last_name) {
              rawNom = formatPassengerName(pax.name, pax.last_name);
            } else if (rawNom && rawNom !== "Desconocido") {
              rawNom = formatFullName(rawNom);
            } else {
              rawNom = "DESCONOCIDO";
            }

            const pData: Pasajero = {
              id: r.id,
              reservationPassengerId: pax.id,
              nombre: rawNom,
              localidad: pax.lugar_carga_nombre || r.lugar_carga_nombre || "-",
              pasajero_id: passengerId,
              pasajero_type:
                pax.pasajero_type ||
                pax.edad_categoria ||
                r.edad_categoria ||
                "ADL",
              butaca_type: pax.butaca_type || r.tipo_butaca || "",
              uniqueId: uId,
              observations: r.observations || pax.observations || "",
            };

            const butacaKey =
              pax.butaca_number !== null &&
              pax.butaca_number !== undefined &&
              pax.butaca_type
                ? `${pax.butaca_type === "semicama" ? "S" : "C"}-${pax.butaca_number}`
                : r.butaca && paxs.length === 1
                  ? r.butaca
                  : null;

            if (
              butacaKey &&
              (butacaKey.startsWith("S-") || butacaKey.startsWith("C-"))
            ) {
              newAsignaciones[butacaKey] = pData;
            } else {
              newDisponibles.push(pData);
            }
          });
        });

        const reconciled = {
          assignments: newAsignaciones,
          disponibles: newDisponibles,
        };
        setAsignaciones(reconciled.assignments);
        setPasajerosDisponibles(reconciled.disponibles);
        setClearedAssignments(new Set());
        setDirty(false);
      } catch (err) {
        console.error("Error loading manifest data:", err);
        toast.error("Error al cargar los datos del viaje");
      } finally {
        if (isMicroSwitch) setIsSwitchingMicro(false);
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.iweb_client_id, id, selectedUnitId, reload]);

  const handleDrop = (
    layoutType: "S" | "C",
    asiento: number,
    uniqueId: string,
  ) => {
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
    if (
      (pasajeroA.butaca_type?.toLowerCase() === "cama" ? "C" : "S") !==
      layoutType
    ) {
      toast.error("El pasajero debe conservar su categoría Cama/Semicama");
      return;
    }

    // 2. Check if target seat has a passenger (B)
    const pasajeroB = asignaciones[newKey];

    // If target seat is occupied by the exact same passenger, do nothing
    if (pasajeroB && pasajeroB.uniqueId === uniqueId) return;
    setDirty(true);

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
            if (prevDisp.some((p) => p.uniqueId === pasajeroB.uniqueId))
              return prevDisp;
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
      setPasajerosDisponibles((prev) =>
        prev.filter((p) => p.uniqueId !== uniqueId),
      );
      setClearedAssignments((prev) => {
        if (!prev.has(pasajeroA!.reservationPassengerId!)) return prev;
        const next = new Set(prev);
        next.delete(pasajeroA!.reservationPassengerId!);
        return next;
      });
    }

    if (pasajeroB && !oldKeyA) {
      setClearedAssignments((prev) => {
        const next = new Set(prev);
        next.add(pasajeroB!.reservationPassengerId!);
        return next;
      });
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
      setDirty(true);
      setAsignaciones((prev) => {
        const copy = { ...prev };
        delete copy[oldKey!];
        return copy;
      });
      setPasajerosDisponibles((prev) => {
        if (prev.some((p) => p.uniqueId === uniqueId)) return prev;
        return [...prev, pasajero!];
      });
      setClearedAssignments((prev) => {
        const next = new Set(prev);
        next.add(pasajero!.reservationPassengerId!);
        return next;
      });
    }
  };

  const handleBusTypeChange = async (nextBusTypeId: string) => {
    if (!selectedUnit || !user?.iweb_client_id || isSaving) return;
    if (dirty) {
      toast.error("Guardá la distribución antes de cambiar el tipo de bus");
      return;
    }
    setIsSaving(true);
    try {
      const unit = await apiClient.updateTransportUnit(
        user.iweb_client_id,
        id,
        selectedUnit.id,
        { type_bus: nextBusTypeId || null },
      );
      setSelectedUnit(unit);
      setSelectedBusTypeId(unit.type_bus || "");
      toast.success("Tipo y capacidad del micro guardados");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo cambiar el tipo",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!user?.iweb_client_id || !selectedUnit || isSaving) return;
    setIsSaving(true);
    try {
      const unit = await apiClient.saveSeatAssignments(
        user.iweb_client_id,
        id,
        selectedUnit.id,
        selectedUnit.revision,
        [
          ...Object.entries(asignaciones).map(([key, passenger]) => ({
            reservation_passenger_id: passenger.reservationPassengerId!,
            butaca_number: Number(key.split("-")[1]),
          })),
          ...Array.from(clearedAssignments).map((reservationPassengerId) => ({
            reservation_passenger_id: reservationPassengerId,
            butaca_number: null,
          })),
        ],
      );
      setSelectedUnit(unit);
      setClearedAssignments(new Set());
      setReload((value) => value + 1);
      toast.success("Distribución de butacas guardada con éxito");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la taquilla",
      );
    } finally {
      setIsSaving(false);
    }
  };
  if (loading) {
    return (
      <Container>
        <section className="flex flex-col mx-3 my-10 gap-3 animate-pulse">
          <div className="flex flex-col gap-3">
            <div className="h-6 w-40 rounded bg-gray-200" />
            <div className="h-6 w-48 rounded bg-gray-200" />
          </div>
          <div className="mx-auto w-full max-w-md space-y-4 rounded-lg border border-gray-200 p-4">
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-10 w-full rounded bg-gray-200" />
            <div className="h-4 w-20 rounded bg-gray-200" />
            <div className="h-5 w-48 rounded bg-gray-200" />
            <div className="h-10 w-full rounded-xl bg-gray-300" />
          </div>
        </section>
        <TaquillaSwitchSkeleton />
      </Container>
    );
  }

  if (!salida) {
    return (
      <Container>
        <p className="mx-3 my-10 text-sm text-gray-500">
          No se pudo cargar la salida.
        </p>
      </Container>
    );
  }

  const handleExportExcel = async () => {
    if (!selectedUnit) return;
    try {
      toast.loading("Generando Excel de taquilla...", {
        id: "export-taquilla",
      });
      await exportTaquillaToExcel({
        transportCompany: companyName,
        microNumber: selectedUnit.number,
        coordinator: [
          selectedUnit.coordinador_nombre,
          selectedUnit.coordinador_telefono,
        ]
          .filter(Boolean)
          .join(" / "),
        destinoName: destinoName,
        salidaDate: salida?.date_of_out,
        asignaciones,
        layout: taquillaLayout,
      });
      toast.success("Excel descargado correctamente", {
        id: "export-taquilla",
      });
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      toast.error("Error al generar el archivo Excel", {
        id: "export-taquilla",
      });
    }
  };

  const handleExportPdf = async () => {
    if (!selectedUnit) return;
    try {
      toast.loading("Generando PDF de taquilla...", { id: "export-taquilla" });
      await exportTaquillaToPdf({
        transportCompany: companyName,
        microNumber: selectedUnit.number,
        coordinator: [
          selectedUnit.coordinador_nombre,
          selectedUnit.coordinador_telefono,
        ]
          .filter(Boolean)
          .join(" / "),
        destinoName: destinoName,
        salidaDate: salida?.date_of_out,
        logoUrl:
          iwebClient?.logo_s || iwebClient?.logo_xl || "/logo-empresa.png",
        asignaciones,
        layout: taquillaLayout,
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
            <ArrowLeft color="#0546f7" />
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
        {(salida.transport_units || []).filter((unit) => unit.active).length >
          1 && (
          <label>
            <div className="flex items-end gap-2">
              <p className="text-xs text-gray-400 mt-3 font-bold">Micro</p>
              <div className="relative flex items-center group">
                {/* Signo de pregunta */}
                <small className="bg-primary rounded-full h-4 w-4 flex items-center justify-center text-white font-semibold cursor-pointer select-none">
                  ?
                </small>

                {/* Tooltip - oculto por defecto, visible en hover */}
                <div
                  className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  absolute left-1/2 -translate-x-1/2 top-full mt-2
                  w-50 spaccing-y-1 bg-primary text-white rounded-xl px-2 py-3
                   font-medium
                  flex flex-col items-center
                  whitespace-normal
                  z-50
                  drop-shadow-md">
                  <p className="text-sm">Que es esto?</p>
                  <p className="text-xs">
                    Seleccioná el micro que queres asignar butacas. Podes
                    configurarlos desde la sección de transportes de la lista.
                  </p>
                </div>
              </div>
            </div>
            <select
              aria-label="Micro"
              value={selectedUnit?.id || ""}
              disabled={isSaving}
              onChange={(event) => {
                if (
                  !dirty ||
                  window.confirm(
                    "Hay cambios de butacas sin guardar. ¿Cambiar de micro y descartarlos?",
                  )
                )
                  handleMicroChange(event.target.value);
              }}
              className="mt-2 bg-transparent outline-none  shadow-md text-gray-700 font-semibold w-full rounded-sm p-2  cursor-pointer">
              {(salida.transport_units || [])
                .filter((unit) => unit.active)
                .map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    Micro {unit.number}
                  </option>
                ))}
            </select>
          </label>
        )}
        {!selectedUnit && (
          <small>
            Configurá los micros desde{" "}
            <Link
              className="text-secondary underline"
              href={`/salidas/lista/${id}/transporte`}>
              Transportes
            </Link>
            .
          </small>
        )}
        <div className="text-gray-700 font-medium  w-full  py-3 px-4 rounded-lg">
          <p className="text-xs text-gray-400 font-bold">Empresa</p>
          <p className="text-sm font-semibold">{companyName || "-"}</p>
          <p className="text-xs text-gray-400 mt-3 font-bold">Tipo de Bus</p>

          <select
            aria-label="Tipo de bus del micro"
            disabled={!selectedUnit || isSaving}
            value={selectedBusType?.id || ""}
            onChange={(event) => handleBusTypeChange(event.target.value)}
            className="mt-2 bg-transparent outline-none  shadow-md text-gray-700 font-semibold w-full rounded-sm p-2  cursor-pointer">
            <option value="">Seleccionar tipo de bus</option>
            {busTypes.map((busType) => (
              <option key={busType.id || busType.name} value={busType.id || ""}>
                {busType.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-3 font-bold">Destino</p>
          <p className="text-sm font-semibold">
            {destinoName || "Cargando..."}
          </p>
        </div>
        <button
          onClick={handleConfirm}
          disabled={isSaving || !selectedUnit}
          className="w-full mb-5 bg-primary cursor-pointer text-white font-medium text-center py-2 rounded-xl disabled:opacity-50">
          {isSaving ? "Guardando..." : "Confirmar"}
        </button>
      </section>
      <section className="text-black mx-3 md:max-w-md md:mx-auto select-none">
        <ul className="flex items-start justify-center flex-col gap-3 font-medium md:flex-row">
          <li
            onClick={handleExportExcel}
            className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors px-4 py-2 rounded-lg">
            <Excel />
            <span>Exportar Excel</span>
          </li>
          <li
            onClick={handleExportPdf}
            className="flex items-center gap-2 cursor-pointer hover:text-secondary transition-colors px-4 py-2 rounded-lg">
            <PDF />
            <span>Descargar PDF</span>
          </li>
        </ul>
      </section>

      {/* Contenedor butacas + pasajeros: columna en mobile, fila en desktop */}
      {isSwitchingMicro ? (
        <TaquillaSwitchSkeleton />
      ) : (
        <div className="flex flex-col md:flex-row md:justify-center md:gap-30 md:my-10">
          {/* Columna izquierda: Butacas */}
          <div className="flex flex-col">
            {/* Butacas semicama */}
            <section className="mx-3 md:mx-0 md:px-8 text-black flex flex-col gap-3">
              <h2 className="my-5 font-semibold">
                Butacas semicama (
                {Math.max(semicamaTotal - semicamaAssigned, 0)} libres /{" "}
                {semicamaTotal} totales)
              </h2>
              <div className="flex justify-center md:justify-start">
                <SeatGrid
                  rows={taquillaLayout.semicamaRows}
                  columns={taquillaLayout.columns}
                  layoutType="S"
                  asignaciones={asignaciones}
                  onDrop={handleDrop}
                />
              </div>
            </section>

            {/* Butacas cama */}
            <section className="mx-3 md:mx-0 md:px-8 text-black flex flex-col gap-3">
              <h2 className="my-5 font-semibold">
                Butacas cama ({Math.max(camaTotal - camaAssigned, 0)} libres /{" "}
                {camaTotal} totales)
              </h2>
              <div className="flex justify-center md:justify-start">
                <SeatGrid
                  rows={taquillaLayout.camaRows}
                  columns={taquillaLayout.columns}
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
            className="mx-3 md:mx-0 md:px-8 text-black flex flex-col gap-3 mb-6 md:w-80 border-2 border-dashed border-transparent hover:border-blue-300/60 rounded-xl transition-colors">
            <h2 className="my-5 font-semibold">
              Pasajeros Semi Cama ({pasajerosSemicama.length})
            </h2>
            <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
              {pasajerosSemicama.map((p) => (
                <PasajeroCard key={p.uniqueId || p.id} pasajero={p} />
              ))}
              {pasajerosSemicama.length === 0 && (
                <p className="col-span-2 text-center text-xs text-gray-400 py-4">
                  Todos los pasajeros tienen asiento asignado (Arrastra aquí
                  para desasignar)
                </p>
              )}
            </div>
            <div>
              <h2 className="my-2 font-semibold">
                Pasajeros Cama ({pasajerosCama.length})
              </h2>
              <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto p-1">
                {pasajerosCama.map((p) => (
                  <PasajeroCard key={p.uniqueId || p.id} pasajero={p} />
                ))}
                {pasajerosCama.length === 0 && (
                  <p className="col-span-2 text-center text-xs text-gray-400 py-4">
                    Sin pasajeros cama sin asignar
                  </p>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </Container>
  );
}
