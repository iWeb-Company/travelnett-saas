"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import PasajeroRow from "@/app/components/PasajeroRow";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Butaca from "@/app/components/icons/salidas/Butaca";
import Excel from "@/app/components/icons/salidas/Excel";
import Subir from "@/app/components/icons/salidas/Subir";
import Reloj from "@/app/components/icons/salidas/Reloj";
import Hotel from "@/app/components/icons/salidas/Hotel";
import Transporte from "@/app/components/icons/salidas/Transporte";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { FormSkeleton } from "@/app/components/FormSkeleton";
import toast from "react-hot-toast";
import {
  exportListaToExcel,
  PasajeroListaData,
  LugarCargaListaData,
} from "@/app/utils/exportLista";
import { formatPassengerName, formatFullName } from "@/lib/formatPassengerName";
import { formatDateDDMMYY } from "@/lib/formatDate";
import type { SalidaTransportUnit } from "@/app/types";
import AscensoAsignButton from "@/app/components/AscensoAsignButton";

const formatPendingBalance = (balance: unknown) => {
  const value = Number(balance);
  return Number.isFinite(value)
    ? `$${Math.round(value).toLocaleString("es-AR")}`
    : "-";
};

const normalizeDestination = (value: unknown) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export default function SalidasIDPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [reservas, setReservas] = useState<any[]>([]);
  const [hoteles, setHoteles] = useState<any[]>([]);
  const [lugaresCarga, setLugaresCarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRelojModal, setShowRelojModal] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);
  const [showAscensoOrderModal, setShowAscensoOrderModal] = useState(false);
  const [showBulkAscensoModal, setShowBulkAscensoModal] = useState(false);
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<Set<string>>(
    new Set(),
  );
  const lastSelectedPassengerIndex = useRef<number | null>(null);
  const [bulkLugarCargaId, setBulkLugarCargaId] = useState("");
  const [bulkBusNumber, setBulkBusNumber] = useState("");
  const [orderedCargas, setOrderedCargas] = useState<any[]>([]);
  const [draggedCargaId, setDraggedCargaId] = useState<string | null>(null);
  const [isSavingAscensoOrder, setIsSavingAscensoOrder] = useState(false);
  const [isSavingBulkAscenso, setIsSavingBulkAscenso] = useState(false);

  // Modal States
  const [salida, setSalida] = useState<any>(null);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [transportCompanies, setTransportCompanies] = useState<any[]>([]);
  const [selectedMicroId, setSelectedMicroId] = useState("");
  const units: SalidaTransportUnit[] = (salida?.transport_units || []).filter(
    (unit: SalidaTransportUnit) => unit.active,
  );
  const selectedMicro =
    units.find((unit) => unit.id === selectedMicroId) ||
    (units.length === 1 ? units[0] : null);

  // Hotel modal states
  const [sourceHotelId, setSourceHotelId] = useState("");
  const [targetHotelId, setTargetHotelId] = useState("");
  const [isUpdatingHotel, setIsUpdatingHotel] = useState(false);

  // Horarios modal states
  const [tempCoordinadorNombre, setTempCoordinadorNombre] = useState("");
  const [tempCoordinadorTelefono, setTempCoordinadorTelefono] = useState("");
  const [tempHorarios, setTempHorarios] = useState<Record<string, string>>({});
  const [isSavingHorarios, setIsSavingHorarios] = useState(false);

  const [clientes, setClientes] = useState<any[]>([]);
  const salidaCargas = Array.isArray(salida?.cargas)
    ? salida.cargas.filter((carga: any) => carga?.id)
    : [];
  const pasajerosPorCarga = new Map<string, number>();
  reservas
    .filter((r) => r.active !== false)
    .forEach((r) => {
      const reservationPassengers =
        r.reservation_passengers?.length > 0 ? r.reservation_passengers : [r];
      reservationPassengers.forEach((p: any) => {
        const cargaId = p.lugar_carga_id || r.lugar_carga_id;
        if (cargaId)
          pasajerosPorCarga.set(
            cargaId,
            (pasajerosPorCarga.get(cargaId) || 0) + 1,
          );
      });
    });
  const cargasConPasajeros = salidaCargas.filter((c: any) =>
    pasajerosPorCarga.has(c.id),
  );

  const loadData = async () => {
    if (!user?.iweb_client_id || !id) return;
    try {
      const [
        resData,
        hotelData,
        lcData,
        salidaData,
        destData,
        clientData,
        transportCompanyData,
      ] = await Promise.all([
        apiClient.getReservas(user.iweb_client_id, id).catch(() => []),
        apiClient
          .getParameters("get_hotels", user.iweb_client_id)
          .catch(() => []),
        apiClient
          .getParameters("get_lugares_carga", user.iweb_client_id)
          .catch(() => []),
        apiClient.getSalida(user.iweb_client_id, id).catch(() => null),
        apiClient
          .getParameters("get_destinos", user.iweb_client_id)
          .catch(() => []),
        apiClient
          .getParameters("get_clients", user.iweb_client_id)
          .catch(() => []),
        apiClient
          .getParameters("get_transport_companies", user.iweb_client_id)
          .catch(() => []),
      ]);

      setReservas(resData);
      setHoteles(hotelData);
      setLugaresCarga(lcData);
      setSalida(salidaData);
      setDestinos(destData);
      setClientes(clientData);
      setTransportCompanies(transportCompanyData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBusUpdated = (passengerId: string, busNumber: string) => {
    setReservas((current) =>
      current.map((reservation) => {
        if (!Array.isArray(reservation.reservation_passengers)) {
          return reservation;
        }
        const hasPassenger = reservation.reservation_passengers.some(
          (passenger: any) => passenger.id === passengerId,
        );
        if (!hasPassenger) return reservation;
        return {
          ...reservation,
          reservation_passengers: reservation.reservation_passengers.map(
            (passenger: any) =>
              passenger.id === passengerId
                ? { ...passenger, bus_number: busNumber }
                : passenger,
          ),
        };
      }),
    );
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadData();
    }
  }, [user?.iweb_client_id, id]);

  // Age group stats & boarding stats are computed below, after mappedPasajeros is built.

  const assignedHotelCounts = reservas
    .filter((reservation) => reservation.active !== false)
    .flatMap((reservation) =>
      Array.isArray(reservation.reservation_passengers)
        ? reservation.reservation_passengers
        : [],
    )
    .reduce<Record<string, number>>((counts, passenger) => {
      if (passenger.hotel_id) {
        counts[passenger.hotel_id] = (counts[passenger.hotel_id] || 0) + 1;
      }
      return counts;
    }, {});
  const assignedHotels = hoteles.filter(
    (hotel) => assignedHotelCounts[hotel.id] > 0,
  );
  const departureDestination = destinos.find(
    (destination) => destination.id === salida?.destino,
  );
  const departureDestinationValues = new Set(
    [
      salida?.destino,
      departureDestination?.id,
      departureDestination?.name,
      departureDestination?.nombre,
    ]
      .filter(Boolean)
      .map(normalizeDestination),
  );
  const destinationHotels = hoteles.filter((hotel) =>
    departureDestinationValues.has(normalizeDestination(hotel.destino)),
  );
  const targetHotels = Array.from(
    new Map(
      [...assignedHotels, ...destinationHotels]
        .filter((hotel) => hotel?.id)
        .map((hotel) => [hotel.id, hotel]),
    ).values(),
  );

  // Open modal initializers
  const handleOpenRelojModal = () => {
    setTempCoordinadorNombre(salida?.coordinador_nombre || "");
    setTempCoordinadorTelefono(salida?.coordinador_telefono || "");
    // Solo mostramos los lugares de carga asociados a la salida
    setTempHorarios(
      Object.fromEntries(
        salidaCargas.map((carga: any) => [carga.id, carga.horario || ""]),
      ),
    );
    setShowRelojModal(true);
  };

  const handleOpenHotelModal = () => {
    setSourceHotelId(assignedHotels.length === 1 ? assignedHotels[0].id : "");
    setTargetHotelId("");
    setShowHotelModal(true);
  };

  const handleOpenAscensoOrderModal = () => {
    setOrderedCargas(salidaCargas.map((carga: any) => ({ ...carga })));
    setDraggedCargaId(null);
    setShowAscensoOrderModal(true);
  };

  const handleDropCarga = (targetCargaId: string) => {
    if (!draggedCargaId || draggedCargaId === targetCargaId) return;
    setOrderedCargas((current) => {
      const sourceIndex = current.findIndex(
        (carga) => carga.id === draggedCargaId,
      );
      const targetIndex = current.findIndex(
        (carga) => carga.id === targetCargaId,
      );
      if (sourceIndex < 0 || targetIndex < 0) return current;
      const next = [...current];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
    setDraggedCargaId(null);
  };

  const handleMoveCarga = (index: number, direction: -1 | 1) => {
    setOrderedCargas((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleSaveAscensoOrder = async () => {
    if (!user?.iweb_client_id || !id || orderedCargas.length === 0) return;
    setIsSavingAscensoOrder(true);
    try {
      const cargasIds = orderedCargas.map((carga: any) => carga.id);
      const horarios = orderedCargas.map((carga: any) => carga.horario || "");
      await apiClient.updateSalida(user.iweb_client_id, id, {
        cargas_ids: cargasIds,
        horarios,
      });
      toast.success("Orden de ascensos actualizado");
      setShowAscensoOrderModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar el orden de ascensos");
    } finally {
      setIsSavingAscensoOrder(false);
    }
  };

  const handleOpenBulkAscensoModal = () => {
    if (selectedPassengerIds.size === 0) return;
    setBulkLugarCargaId("");
    setBulkBusNumber("");
    setShowBulkAscensoModal(true);
  };

  const handleSaveBulkAscenso = async () => {
    if (
      !user?.iweb_client_id ||
      !id ||
      selectedPassengerIds.size === 0 ||
      (!bulkLugarCargaId && !bulkBusNumber)
    ) {
      return;
    }
    setIsSavingBulkAscenso(true);
    try {
      const result = await apiClient.assignReservationPassengersBoardingPlace(
        user.iweb_client_id,
        id,
        Array.from(selectedPassengerIds),
        bulkLugarCargaId || null,
        bulkBusNumber || null,
      );
      const changedFields = [
        bulkLugarCargaId ? "lugar de ascenso" : "",
        bulkBusNumber ? "N° de bus" : "",
      ].filter(Boolean);
      toast.success(
        result.updated_passengers === 1
          ? `Se asignó ${changedFields.join(" y ")} a 1 pasajero`
          : `Se asignó ${changedFields.join(" y ")} a ${result.updated_passengers} pasajeros`,
      );
      setShowBulkAscensoModal(false);
      setSelectedPassengerIds(new Set());
      setBulkLugarCargaId("");
      setBulkBusNumber("");
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al asignar el lugar de ascenso",
      );
    } finally {
      setIsSavingBulkAscenso(false);
    }
  };

  const handleUpdateHotel = async () => {
    if (!user?.iweb_client_id || !id || !sourceHotelId || !targetHotelId)
      return;
    setIsUpdatingHotel(true);
    try {
      const result = await apiClient.replaceReservationPassengerHotel(
        user.iweb_client_id,
        id,
        sourceHotelId,
        targetHotelId,
      );

      toast.success(
        result.updated_passengers === 1
          ? "Se cambió el hotel de 1 pasajero"
          : `Se cambió el hotel de ${result.updated_passengers} pasajeros`,
      );
      setShowHotelModal(false);
      await loadData();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Error al cambiar el hotel",
      );
    } finally {
      setIsUpdatingHotel(false);
    }
  };

  // Save schedules and coordinator info
  const handleSaveHorarios = async () => {
    if (!user?.iweb_client_id || !id) return;
    setIsSavingHorarios(true);
    try {
      // Guardamos solo los lugares de carga asociados a la salida
      const cargasIds: string[] = salidaCargas.map((lc: any) => lc.id);
      const horarios = cargasIds.map((cargaId) => tempHorarios[cargaId] || "");

      await apiClient.updateSalida(user.iweb_client_id, id, {
        ...(!salida?.transport_units?.length
          ? {
              coordinador_nombre: tempCoordinadorNombre,
              coordinador_telefono: tempCoordinadorTelefono,
            }
          : {}),
        ...(cargasIds.length > 0 ? { cargas_ids: cargasIds, horarios } : {}),
      });
      toast.success("Horarios y Coordinador actualizados");
      setShowRelojModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar horarios");
    } finally {
      setIsSavingHorarios(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <FormSkeleton />
      </div>
    );
  }

  const resolvePassengerHotel = (
    reservation: any,
    passenger: any,
  ): { id: string | null; name: string } => {
    const hotelId = (passenger?.hotel_id || reservation.hotel_id || null) as
      | string
      | null;
    const hotel = hoteles.find((candidate: any) => candidate.id === hotelId);
    return {
      id: hotelId,
      name: hotel?.name || hotel?.nombre || reservation.hotel_nombre || "-",
    };
  };

  const mappedPasajeros: any[] = [];
  let counter = 1;
  reservas
    .filter((r: any) => r.active !== false)
    .forEach((r: any) => {
      const paxs =
        r.reservation_passengers && r.reservation_passengers.length > 0
          ? r.reservation_passengers
          : [r];

      // Check if this reservation is a group/bloqueo reservation
      const resType = (r.type || "").toLowerCase();
      const isBloqueoReserva =
        resType === "bloqueo_grupo" ||
        resType === "bloqueo" ||
        resType === "grupo" ||
        (resType !== "tradicional" &&
          ((r.observations || "").toLowerCase().includes("bloqueo") ||
            (r.codigo_reserva || "").toLowerCase().includes("bloqueo")));

      if (isBloqueoReserva && paxs.length > 1) {
        const paxsConDatos = paxs.filter((p: any) => {
          const full = (
            p.nombre_completo || `${p.name || ""} ${p.last_name || ""}`
          ).trim();
          return (
            full !== "" &&
            full !== "Desconocido" &&
            full !== "Pasajero Cama" &&
            full !== "Pasajero Semicama"
          );
        });
        const paxsSinDatos = paxs.filter((p: any) => {
          const full = (
            p.nombre_completo || `${p.name || ""} ${p.last_name || ""}`
          ).trim();
          return (
            full === "" ||
            full === "Desconocido" ||
            full === "Pasajero Cama" ||
            full === "Pasajero Semicama"
          );
        });

        // Render individual rows for passengers with loaded data
        paxsConDatos.forEach((pax: any) => {
          const passengerHotel = resolvePassengerHotel(r, pax);
          let apellido = (pax.last_name || "").trim().toUpperCase();
          let nombres = (pax.name || "").trim().toUpperCase();
          if (!apellido && !nombres) {
            const full = (
              pax.nombre_completo ||
              r.nombre_completo ||
              ""
            ).trim();
            const parts = full.split(/\s+/);
            if (parts.length > 1) {
              apellido = parts[0].toUpperCase();
              nombres = parts.slice(1).join(" ").toUpperCase();
            } else {
              apellido = full.toUpperCase();
              nombres = "";
            }
          }

          const formattedNombre =
            apellido && nombres
              ? `${apellido}, ${nombres}`
              : apellido || nombres || "DESCONOCIDO";

          let servicio = "Bus Semicama";
          const bType = (pax.butaca_type || r.butaca_type || "").toLowerCase();
          if (bType.includes("cama") && !bType.includes("semicama")) {
            servicio = "Bus Cama";
          } else if (bType.includes("semicama")) {
            servicio = "Bus Semicama";
          }

          mappedPasajeros.push({
            id: pax.id || r.id,
            reserva_id: r.id,
            numero: counter++,
            apellido: apellido,
            nombres: nombres,
            nombre: formattedNombre,
            dni: pax.dni || r.dni || "-",
            fecha_nacimiento: pax.fecha_nacimiento || r.fecha_nacimiento || "-",
            reserva: r.codigo_reserva || "-",
            saldo: formatPendingBalance(r.balance),
            cliente: (r.client_nombre || "-").toUpperCase(),
            client_id: r.client_id || null,
            ascenso: pax.lugar_carga_nombre || r.lugar_carga_nombre || "-",
            lugar_carga_id: pax.lugar_carga_id || r.lugar_carga_id || null,
            hotel: passengerHotel.name,
            hotel_id: passengerHotel.id,
            regimen_id: r.regimen_id || null,
            edad:
              pax.pasajero_type ||
              pax.edad_categoria ||
              r.edad_categoria ||
              "ADL",
            servicio: servicio,
            butaca:
              pax.butaca_number !== undefined && pax.butaca_number !== null
                ? String(pax.butaca_number)
                : pax.butaca || r.butaca || "-",
            telefono: pax.telefono || r.telefono || "-",
            bus_number: pax.bus_number || "",
            butaca_type: pax.butaca_type || r.butaca_type || "",
            observations: r.observations || pax.observations || "",
            isGroup: false,
            passengerIds: [pax.id || r.id].filter(Boolean),
            groupCount: 1,
          });
        });

        // Group remaining passengers without loaded data in a single row
        if (paxsSinDatos.length > 0) {
          const firstPax = paxsSinDatos[0];
          const groupHotels: Array<{ id: string | null; name: string }> =
            paxsSinDatos.map((pax: any) => resolvePassengerHotel(r, pax));
          const groupHotelNames = Array.from(
            new Set(groupHotels.map((hotel) => hotel.name)),
          ).join(" / ");
          const groupHotelIds = Array.from(
            new Set(groupHotels.map((hotel) => hotel.id).filter(Boolean)),
          );
          const semicamaCount = paxsSinDatos.filter((p: any) =>
            (p.butaca_type || r.butaca_type || "")
              .toLowerCase()
              .includes("semicama"),
          ).length;
          const camaCount = paxsSinDatos.filter((p: any) => {
            const bt = (p.butaca_type || r.butaca_type || "").toLowerCase();
            return bt.includes("cama") && !bt.includes("semicama");
          }).length;

          let servicio = "Bus Semicama";
          if (semicamaCount > 0 && camaCount > 0) {
            servicio = `Semicama (x${semicamaCount}) / Cama (x${camaCount})`;
          } else if (camaCount > 0) {
            servicio = `Bus Cama (x${camaCount})`;
          } else if (semicamaCount > 0) {
            servicio = `Bus Semicama (x${semicamaCount})`;
          }

          const clientName = (
            r.client_nombre ||
            firstPax.nombre_completo ||
            "Desconocido"
          ).toUpperCase();
          const seatsList = paxsSinDatos
            .map((p: any) =>
              p.butaca_number !== undefined && p.butaca_number !== null
                ? String(p.butaca_number)
                : p.butaca || r.butaca,
            )
            .filter((b: any) => b && b !== "-");
          const seatsStr = seatsList.length > 0 ? seatsList.join(", ") : "-";

          const busNumbers = Array.from(
            new Set(
              paxsSinDatos
                .map((p: any) => p.bus_number || r.bus_number)
                .filter(Boolean),
            ),
          ).join(", ");

          mappedPasajeros.push({
            id: firstPax.id || r.id,
            reserva_id: r.id,
            numero: counter++,
            apellido: clientName,
            nombres: `(PENDIENTES x${paxsSinDatos.length})`,
            nombre: `${clientName} (PENDIENTES x${paxsSinDatos.length})`,
            dni: firstPax.dni || r.dni || "-",
            fecha_nacimiento:
              firstPax.fecha_nacimiento || r.fecha_nacimiento || "-",
            reserva: r.codigo_reserva || "-",
            saldo: formatPendingBalance(r.balance),
            cliente: (r.client_nombre || "-").toUpperCase(),
            client_id: r.client_id || null,
            ascenso: firstPax.lugar_carga_nombre || r.lugar_carga_nombre || "-",
            lugar_carga_id: firstPax.lugar_carga_id || r.lugar_carga_id || null,
            hotel: groupHotelNames || "-",
            hotel_id: groupHotelIds.length === 1 ? groupHotelIds[0] : null,
            regimen_id: r.regimen_id || null,
            edad: `ADL (x${paxsSinDatos.length})`,
            servicio: servicio,
            butaca: seatsStr,
            telefono: firstPax.telefono || r.telefono || "-",
            bus_number: busNumbers || "",
            passengerBusNumbers: paxsSinDatos.map((p: any) =>
              String(p.bus_number || r.bus_number || "").trim(),
            ),
            butaca_type: firstPax.butaca_type || r.butaca_type || "",
            observations: r.observations || firstPax.observations || "",
            isGroup: true,
            passengerIds: paxsSinDatos.map((p: any) => p.id).filter(Boolean),
            groupCount: paxsSinDatos.length,
          });
        }
      } else {
        paxs.forEach((pax: any) => {
          const passengerHotel = resolvePassengerHotel(r, pax);
          let apellido = (pax.last_name || "").trim().toUpperCase();
          let nombres = (pax.name || "").trim().toUpperCase();
          if (!apellido && !nombres) {
            const full = (
              pax.nombre_completo ||
              r.nombre_completo ||
              ""
            ).trim();
            const parts = full.split(/\s+/);
            if (parts.length > 1) {
              apellido = parts[0].toUpperCase();
              nombres = parts.slice(1).join(" ").toUpperCase();
            } else {
              apellido = full.toUpperCase();
              nombres = "";
            }
          }

          const formattedNombre =
            apellido && nombres
              ? `${apellido}, ${nombres}`
              : apellido || nombres || "DESCONOCIDO";

          let servicio = "Bus Semicama";
          const bType = (pax.butaca_type || r.butaca_type || "").toLowerCase();
          if (bType.includes("cama") && !bType.includes("semicama")) {
            servicio = "Bus Cama";
          } else if (bType.includes("semicama")) {
            servicio = "Bus Semicama";
          }

          mappedPasajeros.push({
            id: pax.id || r.id,
            reserva_id: r.id,
            numero: counter++,
            apellido: apellido,
            nombres: nombres,
            nombre: formattedNombre,
            dni: pax.dni || r.dni || "-",
            fecha_nacimiento: pax.fecha_nacimiento || r.fecha_nacimiento || "-",
            reserva: r.codigo_reserva || "-",
            saldo: formatPendingBalance(r.balance),
            cliente: (r.client_nombre || "-").toUpperCase(),
            client_id: r.client_id || null,
            ascenso: pax.lugar_carga_nombre || r.lugar_carga_nombre || "-",
            lugar_carga_id: pax.lugar_carga_id || r.lugar_carga_id || null,
            hotel: passengerHotel.name,
            hotel_id: passengerHotel.id,
            regimen_id: r.regimen_id || null,
            edad:
              pax.pasajero_type ||
              pax.edad_categoria ||
              r.edad_categoria ||
              "ADL",
            servicio: servicio,
            butaca:
              pax.butaca_number !== undefined && pax.butaca_number !== null
                ? String(pax.butaca_number)
                : pax.butaca || r.butaca || "-",
            telefono: pax.telefono || r.telefono || "-",
            bus_number: pax.bus_number || "",
            butaca_type: pax.butaca_type || r.butaca_type || "",
            observations: r.observations || pax.observations || "",
            isGroup: false,
            passengerIds: [pax.id || r.id].filter(Boolean),
            groupCount: 1,
          });
        });
      }
    });

  // Age group stats – computed from the passenger list
  const selectedMicroNumber =
    units.length > 1 && selectedMicro
      ? String(selectedMicro.number).trim()
      : "";
  const filteredPasajeros = selectedMicroNumber
    ? mappedPasajeros.flatMap((passenger) => {
        if (!passenger.isGroup) {
          return String(passenger.bus_number || "").trim() ===
            selectedMicroNumber
            ? [passenger]
            : [];
        }

        const matchingPassengerCount = (
          passenger.passengerBusNumbers || []
        ).filter(
          (busNumber: string) => busNumber === selectedMicroNumber,
        ).length;
        if (matchingPassengerCount === 0) return [];

        return [
          {
            ...passenger,
            nombres: `(PENDIENTES x${matchingPassengerCount})`,
            nombre: `${passenger.apellido} (PENDIENTES x${matchingPassengerCount})`,
            edad: `ADL (x${matchingPassengerCount})`,
            bus_number: selectedMicroNumber,
            groupCount: matchingPassengerCount,
            passengerIds: (passenger.passengerIds || []).filter(
              (_: string, index: number) =>
                passenger.passengerBusNumbers?.[index] === selectedMicroNumber,
            ),
          },
        ];
      })
    : mappedPasajeros;

  const cargaOrder = new Map<string, number>();
  const cargaOrderByName = new Map<string, number>();
  salidaCargas.forEach((carga: any, index: number) => {
    cargaOrder.set(carga.id, index);
    cargaOrderByName.set(
      normalizeDestination(carga.name || carga.nombre),
      index,
    );
  });
  const getPassengerCargaOrder = (passenger: any) =>
    cargaOrder.get(passenger.lugar_carga_id) ??
    cargaOrderByName.get(normalizeDestination(passenger.ascenso)) ??
    Number.MAX_SAFE_INTEGER;
  const visiblePasajeros = filteredPasajeros
    .map((passenger, index) => ({ passenger, index }))
    .sort((left, right) => {
      const orderDifference =
        getPassengerCargaOrder(left.passenger) -
        getPassengerCargaOrder(right.passenger);
      return orderDifference || left.index - right.index;
    })
    .map(({ passenger }) => passenger);

  const passengerIdsForRow = (passenger: any): string[] =>
    (passenger.passengerIds || [passenger.id]).filter(Boolean);

  const handlePassengerSelection = (
    passenger: any,
    checked: boolean,
    rowIndex: number,
    shiftKey = false,
  ) => {
    const rangeStart =
      shiftKey && lastSelectedPassengerIndex.current !== null
        ? Math.min(lastSelectedPassengerIndex.current, rowIndex)
        : rowIndex;
    const rangeEnd =
      shiftKey && lastSelectedPassengerIndex.current !== null
        ? Math.max(lastSelectedPassengerIndex.current, rowIndex)
        : rowIndex;
    const passengersToUpdate = shiftKey
      ? visiblePasajeros.slice(rangeStart, rangeEnd + 1)
      : [passenger];
    setSelectedPassengerIds((current) => {
      const next = new Set(current);
      passengersToUpdate.forEach((passengerToUpdate) => {
        passengerIdsForRow(passengerToUpdate).forEach((passengerId) => {
          if (checked) next.add(passengerId);
          else next.delete(passengerId);
        });
      });
      return next;
    });
    lastSelectedPassengerIndex.current = rowIndex;
  };

  const handleMicroChange = (microId: string) => {
    setSelectedMicroId(microId);
    setSelectedPassengerIds(new Set());
    lastSelectedPassengerIndex.current = null;
  };

  const chdCount = visiblePasajeros.reduce(
    (sum, p) => sum + (p.edad === "CHD" ? p.groupCount || 1 : 0),
    0,
  );
  const adlCount = visiblePasajeros.reduce(
    (sum, p) =>
      sum + (p.edad !== "CHD" && p.edad !== "INF" ? p.groupCount || 1 : 0),
    0,
  );
  const infCount = visiblePasajeros.reduce(
    (sum, p) => sum + (p.edad === "INF" ? p.groupCount || 1 : 0),
    0,
  );

  // Boarding stats – count total passengers for each location
  const ascensosGrouped = new Map<
    string,
    { cantidad: number; nombre: string; direccion: string; order: number }
  >();
  visiblePasajeros.forEach((p) => {
    const key = p.lugar_carga_id || `name:${p.ascenso || "Sin especificar"}`;
    if (!ascensosGrouped.has(key)) {
      const cargaIndex = salidaCargas.findIndex(
        (carga: any) => carga.id === p.lugar_carga_id,
      );
      const lc =
        salidaCargas[cargaIndex] ||
        lugaresCarga.find((l: any) => (l.name || l.nombre) === p.ascenso);
      ascensosGrouped.set(key, {
        cantidad: 0,
        nombre: p.ascenso || "Sin especificar",
        direccion: lc?.address || lc?.direccion || "-",
        order: cargaIndex >= 0 ? cargaIndex : Number.MAX_SAFE_INTEGER,
      });
    }
    ascensosGrouped.get(key)!.cantidad += p.groupCount || 1;
  });

  const handleExportExcel = async () => {
    if (units.length > 1 && !selectedMicro) {
      toast.error("Seleccioná un micro antes de exportar");
      return;
    }
    try {
      toast.loading("Generando Excel de lista...", { id: "export-lista" });

      const destObj = destinos.find((d: any) => d.id === salida?.destino);
      const destName =
        destObj?.name || destObj?.nombre || salida?.destino || "Salida";

      const lcData: LugarCargaListaData[] = (salida?.cargas || []).map(
        (lc: any) => ({
          name: lc.name || lc.nombre || "",
          address: lc.address || lc.direccion || "",
          horario: lc.horario || "",
        }),
      );

      const exportRows = visiblePasajeros;
      const pasajerosData: PasajeroListaData[] = exportRows.map((p, index) => ({
        numero: index + 1,
        bus_number: p.bus_number || "-",
        apellido: p.apellido || "-",
        nombres: p.nombres || "-",
        dni: p.dni || "-",
        fecha_nacimiento: p.fecha_nacimiento || "-",
        telefono: p.telefono || "-",
        pax_type: p.edad || "ADL",
        hotel: p.hotel || "-",
        servicio: p.servicio || "Bus Semicama",
        sube_en: p.ascenso || "-",
        file: p.reserva || "-",
        vendio: p.cliente || "-",
        observaciones: p.observations || "-",
      }));

      await exportListaToExcel({
        microNumber: selectedMicro?.number,
        transportCompany: selectedMicro
          ? transportCompanies.find(
              (company) => company.id === selectedMicro.transport_company,
            )?.name || selectedMicro.transport_company
          : undefined,
        coordinator: selectedMicro
          ? [
              selectedMicro.coordinador_nombre,
              selectedMicro.coordinador_telefono,
            ]
              .filter(Boolean)
              .join(" / ")
          : undefined,
        destinoName: destName,
        salidaDate: salida?.date_of_out
          ? String(salida.date_of_out).split(" ")[0]
          : "",
        pasajeros: pasajerosData,
        lugaresCarga: lcData,
      });

      toast.success("Excel descargado correctamente", { id: "export-lista" });
    } catch (error) {
      console.error("Error al exportar Excel:", error);
      toast.error("Error al generar el archivo Excel", { id: "export-lista" });
    }
  };

  const handleToggleVouchersOnline = async () => {
    if (!salida || !user?.iweb_client_id || !id) return;
    const newStatus = !salida.vouchers_online;
    try {
      await apiClient.updateSalida(user.iweb_client_id, id, {
        vouchers_online: newStatus,
      });
      setSalida((prev: any) => ({ ...prev, vouchers_online: newStatus }));
      toast.success(
        newStatus
          ? "Vouchers online habilitados para esta salida"
          : "Vouchers online deshabilitados para esta salida",
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar estado de vouchers online");
    }
  };

  const ascensosList = Array.from(ascensosGrouped.values()).sort(
    (left, right) => left.order - right.order,
  );

  return (
    <Container>
      <ToggleSalidas />

      <section className="flex flex-col gap-3">
        <Link
          href={"/dashboard"}
          className="flex items-center w-max justify-start gap-3">
          <ArrowLeft />
          <h1 className="font-bold md:text-xl">Volver al menú</h1>
        </Link>
        <Link
          href={`/salidas`}
          className="flex items-center w-max cursor-pointer justify-start gap-3">
          <ArrowLeft color="#6005F7" />
          <h1 className="font-semibold text-secondary md:text-lg">
            Volver a Salidas
          </h1>
        </Link>
      </section>

      {/* Iconos de acción */}
      {units.length > 1 && (
        <label className="flex justify-start items-center text-black gap-2 mx-5 mt-3">
          Micro
          <select
            aria-label="Filtrar pasajeros por micro"
            className="border rounded p-1"
            value={selectedMicroId}
            onChange={(event) => handleMicroChange(event.target.value)}>
            <option value="">Seleccionar micro</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                Micro {unit.number}
              </option>
            ))}
          </select>
        </label>
      )}
      <section className="flex items-center justify-end gap-2 mx-5 mb-2 md:mt-[-20px] mt-2">
        <Link
          href={`/salidas/lista/${id}/transporte`}
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Buses">
          <Transporte />
          <p className="text-xs text-black md:block hidden">Buses</p>
        </Link>
        {/* Taquilla */}
        <Link
          href={`/salidas/lista/${id}/butacas`}
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Butacas">
          <Butaca />
          <p className="text-xs text-black md:block hidden">Taquilla</p>
        </Link>
        {/* Vouchers */}
        <button
          onClick={handleToggleVouchersOnline}
          className={`p-1.5 flex items-center gap-2 font-semibold transition-colors cursor-pointer ${
            salida?.vouchers_online
              ? "text-emerald-600 font-bold"
              : "text-black hover:text-secondary"
          }`}
          title={
            salida?.vouchers_online
              ? "Vouchers Online Habilitados (click para deshabilitar)"
              : "Habilitar Vouchers Online"
          }>
          <Subir />
          <p className="text-xs md:block hidden">
            {salida?.vouchers_online
              ? "Vouchers Online: Activo"
              : "Vouchers Online"}
          </p>
        </button>
        {/* Excel */}
        <button
          disabled={units.length > 1 && !selectedMicro}
          className="p-1.5 flex items-center gap-2 font-semibold text-black hover:text-secondary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          title="Exportar Excel"
          onClick={handleExportExcel}>
          <Excel />
          <p className="text-xs text-black md:block hidden">Exportar Excel</p>
        </button>
        {/* Horarios */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold text-black hover:text-secondary transition-colors"
          title="Horarios y Coordinador"
          onClick={handleOpenRelojModal}>
          <Reloj />
          <p className="text-xs text-black md:block hidden">Horarios</p>
        </button>
        {/* Cambiar Hotel */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold text-black hover:text-secondary transition-colors"
          title="Hotel y Régimen de la Salida"
          onClick={handleOpenHotelModal}>
          <Hotel />
          <p className="text-xs text-black md:block hidden">Cambiar Hotel</p>
        </button>
      </section>

      {/* Lista de pasajeros */}
      <section className="md:mx-20 mx-2 flex flex-col gap-1.5 mt-4">
        {/* Header de columnas */}
        <div className="flex items-center gap-2 w-full text-xs font-bold text-black/75 mb-1 select-none">
          {/* Bus Header */}
          <div className="w-14 hidden md:flex text-center">Bus</div>

          {/* Columns Header Container */}
          <div className="flex-1 hidden md:flex items-center justify-between px-3 text-left">
            <span className="flex-1 text-center">Nombre completo</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">
              |
            </span>
            <span className="w-20 md:block hidden text-end">Saldo</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">
              |
            </span>
            <span className="w-20 md:block hidden text-end">Reserva</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">
              |
            </span>
            <span className="w-24 md:block hidden text-center">Cliente</span>
            <span className="text-transparent font-normal px-1 select-none">
              |
            </span>
            <button
              type="button"
              onClick={handleOpenAscensoOrderModal}
              className="w-32 text-center cursor-pointer hover:underline"
              title="Ordenar lugares de ascenso">
              Ascenso
            </button>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">
              |
            </span>
            <span className="w-32 md:block hidden text-center">Hotel</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">
              |
            </span>
            <span className="w-12 md:block hidden text-end">Edad</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">
              |
            </span>
            <span className="w-28 md:block hidden text-center">Teléfono</span>
            <span className="text-transparent font-normal px-1 select-none">
              |
            </span>
            <span className="w-24 text-center">Tipo de Bus</span>
            <span className="text-transparent font-normal px-1 select-none">
              |
            </span>
            <span className="w-16 md:block hidden text-end">Obs</span>
            <span className="text-transparent font-normal px-1 select-none">
              |
            </span>
            <span className="w-20 text-center">Voucher</span>
          </div>
        </div>

        {/* Rows List */}
        <div className="flex flex-col w-full gap-2">
          {visiblePasajeros.length === 0 ? (
            <p className="text-gray-500 py-10 font-medium text-center bg-white rounded-lg border border-[#3DADFF]">
              No hay pasajeros registrados en esta salida.
            </p>
          ) : (
            (() => {
              const salidaCargasIds: string[] = (salida?.cargas || [])
                .map((lc: any) => lc.id)
                .filter(Boolean);
              const salidaCargasNames: string[] = (salida?.cargas || [])
                .map((lc: any) => (lc.name || lc.nombre || "").toLowerCase())
                .filter(Boolean);

              return visiblePasajeros.map((p, idx) => {
                const rowPassengerIds = passengerIdsForRow(p);
                const isRowSelected =
                  rowPassengerIds.length > 0 &&
                  rowPassengerIds.every((passengerId) =>
                    selectedPassengerIds.has(passengerId),
                  );
                return (
                  <PasajeroRow
                    key={p.id || idx}
                    salidaId={id}
                    pasajero={p}
                    lugaresCarga={lugaresCarga}
                    salidaCargasIds={salidaCargasIds}
                    salidaCargasNames={salidaCargasNames}
                    selected={isRowSelected}
                    onSelectionChange={(checked, shiftKey) =>
                      handlePassengerSelection(p, checked, idx, shiftKey)
                    }
                    onUpdated={loadData}
                    onBusUpdated={handleBusUpdated}
                  />
                );
              });
            })()
          )}
        </div>
      </section>

      {/* Pasajeros Totales */}
      <section className="mt-6 md:mx-10 bg-[#D9DFF5]/40 border border-[#3DADFF] rounded-md overflow-hidden">
        <div className="w-full bg-[#D9DFF5] font-semibold text-black text-sm text-center">
          <div className="flex flex-col">
            <div className="py-2 flex justify-center items-center">
              Pasajeros Totales
            </div>
            <div className="text-xs flex justify-center items-center gap-10 md:gap-20">
              <div className="py-2 font-semibold">CHD</div>
              <div className="py-2 font-semibold">ADL</div>
              <div className="py-2 font-semibold">INF</div>
            </div>
          </div>
          <div className="flex justify-center items-center gap-14 md:gap-25">
            <div className="py-2 text-center">{chdCount}</div>
            <div className="py-2 text-center">{adlCount}</div>
            <div className="py-2 text-center">{infCount}</div>
          </div>
        </div>
      </section>

      {/* Pasajeros Totales por ascenso */}
      <section className="mt-4 md:mx-10 bg-[#D9DFF5]/40 border border-[#3DADFF] rounded-md overflow-hidden">
        <table className="w-full bg-[#D9DFF5] text-black text-sm text-center">
          <thead>
            <tr>
              <th colSpan={3} className="py-2 font-bold">
                Pasajeros Totales por ascenso
              </th>
            </tr>
            <tr className="text-xs">
              <th className="py-1 font-semibold">Cantidad</th>
              <th className="py-1 font-semibold">Lugar de carga</th>
              <th className="py-1 font-semibold">Dirección</th>
            </tr>
          </thead>
          <tbody>
            {ascensosList.length === 0 ? (
              <tr className="text-black font-semibold text-xs">
                <td colSpan={3} className="py-2">
                  No hay ascensos asignados
                </td>
              </tr>
            ) : (
              ascensosList.map((asc, i) => (
                <tr
                  key={i}
                  className="text-black font-semibold text-xs border-t border-gray-300">
                  <td className="py-2">{asc.cantidad}</td>
                  <td className="py-2">{asc.nombre}</td>
                  <td className="py-2 text-wrap">{asc.direccion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <AscensoAsignButton
        selectedCount={selectedPassengerIds.size}
        onClick={handleOpenBulkAscensoModal}
        disabled={isSavingBulkAscenso}
        isVisible={selectedPassengerIds.size > 0}
      />

      {showAscensoOrderModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
          onClick={() => setShowAscensoOrderModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ascenso-order-title"
            className="bg-[#5782F7] rounded-2xl w-[90%] max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-white"
            onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-center pt-5 pb-3">
              <img src="/logo.png" alt="Tranett" className="w-20" />
            </div>
            <h3
              id="ascenso-order-title"
              className="text-center font-bold text-sm mb-2">
              Ordenar lugares de ascenso
            </h3>
            <p className="text-center text-xs px-5 pb-3">
              Arrastra cada lugar al orden deseado. Tambien puedes usar las
              flechas.
            </p>
            <div className="px-4 pb-3 overflow-auto space-y-2">
              {orderedCargas.length === 0 ? (
                <p className="text-center text-sm py-4">
                  No hay lugares de ascenso cargados en esta salida.
                </p>
              ) : (
                orderedCargas.map((carga: any, index: number) => (
                  <div
                    key={carga.id}
                    draggable
                    onDragStart={() => setDraggedCargaId(carga.id)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={() => handleDropCarga(carga.id)}
                    className="flex items-center gap-3 rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 cursor-grab active:cursor-grabbing">
                    <span
                      className="w-6 text-center font-bold"
                      aria-label={`Orden ${index + 1}`}>
                      {index + 1}
                    </span>
                    <span className="flex-1 min-w-0 truncate">
                      {carga.name || carga.nombre}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label={`Subir ${carga.name || carga.nombre}`}
                        onClick={() => handleMoveCarga(index, -1)}
                        disabled={index === 0}
                        className="rounded border border-gray-500 px-2 py-1 disabled:opacity-40">
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Bajar ${carga.name || carga.nombre}`}
                        onClick={() => handleMoveCarga(index, 1)}
                        disabled={index === orderedCargas.length - 1}
                        className="rounded border border-gray-500 px-2 py-1 disabled:opacity-40">
                        ↓
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-center gap-3 px-4 py-4">
              <button
                type="button"
                onClick={() => setShowAscensoOrderModal(false)}
                className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer border border-gray-300">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveAscensoOrder}
                disabled={isSavingAscensoOrder || orderedCargas.length === 0}
                className="bg-secondary text-white font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer disabled:opacity-50">
                {isSavingAscensoOrder ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkAscensoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
          onClick={() => setShowBulkAscensoModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="bulk-ascenso-title"
            className="bg-[#5782F7] rounded-2xl w-[90%] max-w-md max-h-[85vh] flex flex-col overflow-hidden text-white"
            onClick={(event) => event.stopPropagation()}>
            <div className="flex justify-center pt-5 pb-3">
              <img src="/logo.png" alt="Tranett" className="w-20" />
            </div>
            <h3
              id="bulk-ascenso-title"
              className="text-center font-bold text-sm mb-2">
              Asignar lugar de ascenso y/o N° de Bus
            </h3>
            <p className="text-center text-xs px-5 pb-4">
              Se actualizaran {selectedPassengerIds.size} pasajeros
              seleccionados.
            </p>
            <div className="px-5 pb-4">
              <label
                htmlFor="bulk-lugar-carga"
                className="block text-sm font-semibold mb-2">
                Lugar de ascenso
              </label>
              <select
                id="bulk-lugar-carga"
                aria-label="Lugar de ascenso nuevo"
                value={bulkLugarCargaId}
                onChange={(event) => setBulkLugarCargaId(event.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer">
                <option value="">-</option>
                {salidaCargas.map((carga: any) => (
                  <option key={carga.id} value={carga.id}>
                    {carga.name || carga.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="px-5 pb-4">
              <label
                htmlFor="bulk-bus-number"
                className="block text-sm font-semibold mb-2">
                N° de Bus
              </label>
              <select
                id="bulk-bus-number"
                aria-label="N° de Bus"
                value={bulkBusNumber}
                onChange={(event) => setBulkBusNumber(event.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer">
                <option value="">-</option>
                {units.map((unit) => (
                  <option key={unit.id} value={String(unit.number)}>
                    {unit.number}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-center gap-3 px-4 py-4">
              <button
                type="button"
                onClick={() => setShowBulkAscensoModal(false)}
                className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer border border-gray-300">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveBulkAscenso}
                disabled={
                  isSavingBulkAscenso || (!bulkLugarCargaId && !bulkBusNumber)
                }
                className="bg-secondary text-white font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer disabled:opacity-50">
                {isSavingBulkAscenso ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reloj (Horarios y Coordinador) */}
      {showRelojModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
          onClick={() => setShowRelojModal(false)}>
          <div
            className="bg-[#5782F7] rounded-2xl w-[90%] max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}>
            {/* Logo */}
            <div className="flex justify-center pt-5 pb-3">
              <img src="/logo.png" alt="Tranett" className="w-20" />
            </div>

            <h3 className="text-center font-bold text-sm mb-3">
              Horarios y Coordinación
            </h3>

            {/* Tabla Ascenso (scrollable) */}
            <div className="px-2 sm:px-6 py-2 max-h-[25dvh] overflow-auto mt-2">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="sticky top-0 bg-gray-700">
                  <tr>
                    <th className="py-1.5 px-2 font-semibold">Cantidad</th>
                    <th className="py-1.5 px-2 text-center font-semibold">
                      Lugar de Carga
                    </th>
                    <th className="py-1.5 px-2 font-semibold">Horario</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    if (cargasConPasajeros.length === 0) {
                      return (
                        <tr className="bg-gray-600">
                          <td colSpan={3} className="py-2 px-3">
                            Sin pasajeros asignados a lugares de carga
                          </td>
                        </tr>
                      );
                    }

                    return cargasConPasajeros.map((lc: any) => {
                      const count = pasajerosPorCarga.get(lc.id) || 0;
                      return (
                        <tr
                          key={lc.id}
                          className="bg-gray-600 border-t border-gray-700">
                          <td className="py-1.5 px-2">{count}</td>
                          <td
                            className="py-1.5 px-2 text-center font-semibold truncate"
                            title={lc.name || lc.nombre}>
                            {lc.name || lc.nombre}
                          </td>
                          <td className="py-1.5 px-2 flex justify-center">
                            <input
                              type="text"
                              value={tempHorarios[lc.id] || ""}
                              onChange={(e) =>
                                setTempHorarios((current) => ({
                                  ...current,
                                  [lc.id]: e.target.value,
                                }))
                              }
                              className="bg-gray-700 text-white text-[11px] font-semibold border border-gray-600 rounded p-1 text-center focus:outline-none focus:ring-1 focus:ring-secondary"
                              placeholder="hh:mm"
                            />
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Formulario Coordinación */}
            {!salida?.transport_units?.length && (
              <div className="px-2 sm:px-6 py-2 max-h-[25dvh] overflow-auto mt-2">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="sticky top-0 bg-gray-700">
                    <tr>
                      <th className="py-1.5 px-2 font-semibold">
                        Coordinador/a
                      </th>
                      <th className="py-1.5 px-2 text-center font-semibold">
                        Teléfono
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-600 border-t border-gray-700">
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={tempCoordinadorNombre}
                          onChange={(e) =>
                            setTempCoordinadorNombre(e.target.value)
                          }
                          className="bg-gray-750 text-white text-xs border border-gray-600 rounded p-2 focus:outline-none focus:ring-1 focus:ring-secondary"
                          placeholder="Nombre de la persona encargada"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={tempCoordinadorTelefono}
                          onChange={(e) =>
                            setTempCoordinadorTelefono(e.target.value)
                          }
                          className="bg-gray-750 text-white text-xs border border-gray-600 rounded p-2 focus:outline-none focus:ring-1 focus:ring-secondary"
                          placeholder="Ej: 1169694995"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {/* Botones */}
            <div className="flex justify-center gap-3 sm:gap-4 px-3 sm:px-4 py-4 sm:py-5">
              <button
                onClick={() => setShowRelojModal(false)}
                className="flex-1 sm:flex-none bg-white text-black font-semibold text-sm px-4 sm:px-6 py-2 rounded-lg cursor-pointer border border-gray-300">
                Cancelar
              </button>
              <button
                onClick={handleSaveHorarios}
                disabled={isSavingHorarios}
                className="flex-1 sm:flex-none bg-secondary text-white font-semibold text-sm px-4 sm:px-6 py-2 rounded-lg cursor-pointer disabled:opacity-50">
                {isSavingHorarios ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de reemplazo de hotel por pasajero */}
      {showHotelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
          onClick={() => setShowHotelModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-hotel-title"
            className="bg-[#5782F7] rounded-2xl w-[90%] px-5 max-w-md max-h-[85vh] flex flex-col overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}>
            {/* Logo */}
            <div className="flex justify-center pt-5 pb-3">
              <img src="/logo.png" alt="Tranett" className="w-20" />
            </div>

            <h3
              id="change-hotel-title"
              className="text-center font-bold text-sm mb-3">
              Cambiar Hotel
            </h3>

            {/* Formulario */}
            <table className="w-full text-xs text-center border-collapse">
              <thead className="sticky top-0 bg-gray-700">
                <tr>
                  <th className="py-1.5 px-2 font-semibold">Hotel actual</th>
                  <th className="py-1.5 px-2 font-semibold">Hotel nuevo</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-gray-600 border-t border-gray-700">
                  <td className="py-1.5 px-2">
                    <select
                      aria-label="Hotel actual"
                      value={sourceHotelId}
                      onChange={(e) => {
                        setSourceHotelId(e.target.value);
                        if (targetHotelId === e.target.value) {
                          setTargetHotelId("");
                        }
                      }}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer">
                      <option value="">
                        {assignedHotels.length > 0
                          ? "Seleccione un hotel"
                          : "Sin hoteles asignados"}
                      </option>
                      {assignedHotels.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name || h.nombre} ({assignedHotelCounts[h.id]}{" "}
                          pasajeros)
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-1.5 px-2">
                    <select
                      aria-label="Hotel nuevo"
                      value={targetHotelId}
                      onChange={(e) => setTargetHotelId(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer">
                      <option value="">Seleccione un hotel</option>
                      {targetHotels
                        .filter((hotel) => hotel.id !== sourceHotelId)
                        .map((hotel) => (
                          <option key={hotel.id} value={hotel.id}>
                            {hotel.name || hotel.nombre}
                          </option>
                        ))}
                    </select>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Botones */}
            <div className="flex justify-center gap-3 sm:gap-4 px-3 sm:px-4 py-4 sm:py-5">
              <button
                onClick={() => setShowHotelModal(false)}
                className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer border border-gray-300">
                Cancelar
              </button>
              <button
                onClick={handleUpdateHotel}
                disabled={isUpdatingHotel || !sourceHotelId || !targetHotelId}
                className="bg-secondary text-white font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer disabled:opacity-50">
                {isUpdatingHotel ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
