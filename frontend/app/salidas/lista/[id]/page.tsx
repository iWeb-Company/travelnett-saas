"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import PasajeroRow from "@/app/components/PasajeroRow";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Butaca from "@/app/components/icons/salidas/Butaca";
import Excel from "@/app/components/icons/salidas/Excel";
import Subir from "@/app/components/icons/salidas/Subir";
import Reloj from "@/app/components/icons/salidas/Reloj";
import Hotel from "@/app/components/icons/salidas/Hotel";
import Transporte from "@/app/components/icons/salidas/Transporte";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "@/app/components/Loader";
import toast from "react-hot-toast";
import { exportListaToExcel, PasajeroListaData, LugarCargaListaData } from "@/app/utils/exportLista";
import { formatPassengerName, formatFullName } from "@/lib/formatPassengerName";
import { formatDateDDMMYY } from "@/lib/formatDate";

export default function SalidasIDPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [reservas, setReservas] = useState<any[]>([]);
  const [hoteles, setHoteles] = useState<any[]>([]);
  const [regimenes, setRegimenes] = useState<any[]>([]);
  const [lugaresCarga, setLugaresCarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRelojModal, setShowRelojModal] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);

  // Modal States
  const [salida, setSalida] = useState<any>(null);
  const [destinos, setDestinos] = useState<any[]>([]);

  // Hotel modal states
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedRegimen, setSelectedRegimen] = useState("");
  const [isUpdatingHotel, setIsUpdatingHotel] = useState(false);

  // Horarios modal states
  const [tempCoordinadorNombre, setTempCoordinadorNombre] = useState("");
  const [tempCoordinadorTelefono, setTempCoordinadorTelefono] = useState("");
  const [tempHorarios, setTempHorarios] = useState<string[]>([]);
  const [isSavingHorarios, setIsSavingHorarios] = useState(false);

  const [clientes, setClientes] = useState<any[]>([]);
  const [packageHotelCount, setPackageHotelCount] = useState<number>(0);

  const loadData = async () => {
    if (!user?.iweb_client_id || !id) return;
    try {
      const [resData, hotelData, regData, lcData, salidaData, destData, clientData] = await Promise.all([
        apiClient.getReservas(user.iweb_client_id, id).catch(() => []),
        apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_regimenes", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_lugares_carga", user.iweb_client_id).catch(() => []),
        apiClient.getSalida(user.iweb_client_id, id).catch(() => null),
        apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_clients", user.iweb_client_id).catch(() => []),
      ]);

      setReservas(resData);
      setHoteles(hotelData);
      setRegimenes(regData);
      setLugaresCarga(lcData);
      setSalida(salidaData);
      setDestinos(destData);
      setClientes(clientData);

      const firstWithPkg = resData.find((r: any) => r.package_id);
      if (firstWithPkg?.package_id) {
        const pkgData = await apiClient.getPackage(user.iweb_client_id, firstWithPkg.package_id).catch(() => null);
        setPackageHotelCount(pkgData?.hotels?.length || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadData();
    }
  }, [user?.iweb_client_id, id]);

  // Age group stats & boarding stats are computed below, after mappedPasajeros is built.

  // Open modal initializers
  const handleOpenRelojModal = () => {
    setTempCoordinadorNombre(salida?.coordinador_nombre || "");
    setTempCoordinadorTelefono(salida?.coordinador_telefono || "");
    // Solo mostramos los lugares de carga asociados a la salida
    setTempHorarios((salida?.cargas || []).map((c: any) => c.horario || ""));
    setShowRelojModal(true);
  };

  const handleOpenHotelModal = () => {
    setSelectedHotel(salida?.hotel_id || "");
    setSelectedRegimen(salida?.regimen_id || "");
    setShowHotelModal(true);
  };

  // Batch Update Hotel and Regimen on the departure AND passenger reservations
  const handleUpdateHotel = async () => {
    if (!user?.iweb_client_id || !id) return;
    setIsUpdatingHotel(true);
    try {
      // 1. Update the departure parameter
      await apiClient.updateSalida(user.iweb_client_id, id, {
        hotel_id: selectedHotel || null,
        regimen_id: selectedRegimen || null,
      });

      // 2. Update all passenger reservations to maintain consistency
      if (reservas.length > 0) {
        await Promise.all(
          reservas.map(r =>
            apiClient.updateReserva(user.iweb_client_id, r.id, {
              hotel_id: selectedHotel || null,
              regimen_id: selectedRegimen || null,
            })
          )
        );
      }

      toast.success("Hotel y Régimen actualizados con éxito");
      setShowHotelModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar hotel/régimen");
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
      const cargasIds: string[] = (salida?.cargas || []).map((lc: any) => lc.id).filter(Boolean);

      await apiClient.updateSalida(user.iweb_client_id, id, {
        ...(tempCoordinadorNombre !== undefined ? { coordinador_nombre: tempCoordinadorNombre } : {}),
        ...(tempCoordinadorTelefono !== undefined ? { coordinador_telefono: tempCoordinadorTelefono } : {}),
        ...(cargasIds.length > 0 ? { cargas_ids: cargasIds, horarios: tempHorarios } : {}),
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

  // Resolved departure's destination name for hotel filtering
  const departureDestObj = destinos.find(d => d.id === salida?.destino);
  const destName = departureDestObj ? (departureDestObj.name || departureDestObj.nombre) : "";
  const destId = salida?.destino || "";
  const _filtered = hoteles.filter(h => {
    if (!destName && !destId) return true;
    const hDest = (h.destino || "").toLowerCase();
    // Match by name or by ID
    return hDest === destName.toLowerCase() || hDest === destId.toLowerCase();
  });
  // If the filter returns nothing (mismatch), show all hotels as fallback
  const filteredHoteles = _filtered.length > 0 ? _filtered : hoteles;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  const mappedPasajeros: any[] = [];
  let counter = 1;
  reservas.forEach((r: any) => {
    const paxs = r.reservation_passengers && r.reservation_passengers.length > 0
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
        const full = (p.nombre_completo || `${p.name || ''} ${p.last_name || ''}`).trim();
        return full !== "" && full !== "Desconocido" && full !== "Pasajero Cama" && full !== "Pasajero Semicama";
      });
      const paxsSinDatos = paxs.filter((p: any) => {
        const full = (p.nombre_completo || `${p.name || ''} ${p.last_name || ''}`).trim();
        return full === "" || full === "Desconocido" || full === "Pasajero Cama" || full === "Pasajero Semicama";
      });

      // Render individual rows for passengers with loaded data
      paxsConDatos.forEach((pax: any) => {
        let apellido = (pax.last_name || "").trim().toUpperCase();
        let nombres = (pax.name || "").trim().toUpperCase();
        if (!apellido && !nombres) {
          const full = (pax.nombre_completo || r.nombre_completo || "").trim();
          const parts = full.split(/\s+/);
          if (parts.length > 1) {
            apellido = parts[0].toUpperCase();
            nombres = parts.slice(1).join(" ").toUpperCase();
          } else {
            apellido = full.toUpperCase();
            nombres = "";
          }
        }

        const formattedNombre = apellido && nombres ? `${apellido}, ${nombres}` : (apellido || nombres || "DESCONOCIDO");

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
          cliente: (r.client_nombre || "-").toUpperCase(),
          client_id: r.client_id || null,
          ascenso: pax.lugar_carga_nombre || r.lugar_carga_nombre || "-",
          lugar_carga_id: pax.lugar_carga_id || r.lugar_carga_id || null,
          hotel: r.hotel_nombre || "-",
          hotel_id: r.hotel_id || null,
          regimen_id: r.regimen_id || null,
          edad: pax.pasajero_type || pax.edad_categoria || r.edad_categoria || "ADL",
          servicio: servicio,
          butaca: pax.butaca_number !== undefined && pax.butaca_number !== null ? String(pax.butaca_number) : (pax.butaca || r.butaca || "-"),
          telefono: pax.telefono || r.telefono || "-",
          bus_number: pax.bus_number || "",
          butaca_type: pax.butaca_type || r.butaca_type || "",
          observations: r.observations || pax.observations || "",
          isGroup: false,
          groupCount: 1,
        });
      });

      // Group remaining passengers without loaded data in a single row
      if (paxsSinDatos.length > 0) {
        const firstPax = paxsSinDatos[0];
        const semicamaCount = paxsSinDatos.filter((p: any) => (p.butaca_type || r.butaca_type || "").toLowerCase().includes("semicama")).length;
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

        const clientName = (r.client_nombre || firstPax.nombre_completo || "Desconocido").toUpperCase();
        const seatsList = paxsSinDatos
          .map((p: any) => (p.butaca_number !== undefined && p.butaca_number !== null ? String(p.butaca_number) : (p.butaca || r.butaca)))
          .filter((b: any) => b && b !== "-");
        const seatsStr = seatsList.length > 0 ? seatsList.join(", ") : "-";

        const busNumbers = Array.from(new Set(paxsSinDatos.map((p: any) => p.bus_number || r.bus_number).filter(Boolean))).join(", ");

        mappedPasajeros.push({
          id: firstPax.id || r.id,
          reserva_id: r.id,
          numero: counter++,
          apellido: clientName,
          nombres: `(PENDIENTES x${paxsSinDatos.length})`,
          nombre: `${clientName} (PENDIENTES x${paxsSinDatos.length})`,
          dni: firstPax.dni || r.dni || "-",
          fecha_nacimiento: firstPax.fecha_nacimiento || r.fecha_nacimiento || "-",
          reserva: r.codigo_reserva || "-",
          cliente: (r.client_nombre || "-").toUpperCase(),
          client_id: r.client_id || null,
          ascenso: firstPax.lugar_carga_nombre || r.lugar_carga_nombre || "-",
          lugar_carga_id: firstPax.lugar_carga_id || r.lugar_carga_id || null,
          hotel: r.hotel_nombre || "-",
          hotel_id: r.hotel_id || null,
          regimen_id: r.regimen_id || null,
          edad: `ADL (x${paxsSinDatos.length})`,
          servicio: servicio,
          butaca: seatsStr,
          telefono: firstPax.telefono || r.telefono || "-",
          bus_number: busNumbers || "",
          butaca_type: firstPax.butaca_type || r.butaca_type || "",
          observations: r.observations || firstPax.observations || "",
          isGroup: true,
          groupCount: paxsSinDatos.length,
        });
      }
    } else {
      paxs.forEach((pax: any) => {
        let apellido = (pax.last_name || "").trim().toUpperCase();
        let nombres = (pax.name || "").trim().toUpperCase();
        if (!apellido && !nombres) {
          const full = (pax.nombre_completo || r.nombre_completo || "").trim();
          const parts = full.split(/\s+/);
          if (parts.length > 1) {
            apellido = parts[0].toUpperCase();
            nombres = parts.slice(1).join(" ").toUpperCase();
          } else {
            apellido = full.toUpperCase();
            nombres = "";
          }
        }

        const formattedNombre = apellido && nombres ? `${apellido}, ${nombres}` : (apellido || nombres || "DESCONOCIDO");

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
          cliente: (r.client_nombre || "-").toUpperCase(),
          client_id: r.client_id || null,
          ascenso: pax.lugar_carga_nombre || r.lugar_carga_nombre || "-",
          lugar_carga_id: pax.lugar_carga_id || r.lugar_carga_id || null,
          hotel: r.hotel_nombre || "-",
          hotel_id: r.hotel_id || null,
          regimen_id: r.regimen_id || null,
          edad: pax.pasajero_type || pax.edad_categoria || r.edad_categoria || "ADL",
          servicio: servicio,
          butaca: pax.butaca_number !== undefined && pax.butaca_number !== null ? String(pax.butaca_number) : (pax.butaca || r.butaca || "-"),
          telefono: pax.telefono || r.telefono || "-",
          bus_number: pax.bus_number || "",
          butaca_type: pax.butaca_type || r.butaca_type || "",
          observations: r.observations || pax.observations || "",
          isGroup: false,
          groupCount: 1,
        });
      });
    }
  });

  // Age group stats – computed from the passenger list
  const chdCount = mappedPasajeros.reduce((sum, p) => sum + (p.edad === "CHD" ? (p.groupCount || 1) : 0), 0);
  const adlCount = mappedPasajeros.reduce((sum, p) => sum + (p.edad !== "CHD" && p.edad !== "INF" ? (p.groupCount || 1) : 0), 0);
  const infCount = mappedPasajeros.reduce((sum, p) => sum + (p.edad === "INF" ? (p.groupCount || 1) : 0), 0);

  // Boarding stats – count total passengers for each location
  const ascensosGrouped: Record<string, { cantidad: number; nombre: string; direccion: string }> = {};
  mappedPasajeros.forEach(p => {
    const key = p.ascenso || "Sin especificar";
    if (!ascensosGrouped[key]) {
      const lc = lugaresCarga.find((l: any) => (l.name || l.nombre) === key);
      ascensosGrouped[key] = {
        cantidad: 0,
        nombre: key,
        direccion: lc?.address || lc?.direccion || "-"
      };
    }
    ascensosGrouped[key].cantidad += (p.groupCount || 1);
  });

  const handleExportExcel = async () => {
    try {
      toast.loading("Generando Excel de lista...", { id: "export-lista" });

      const destObj = destinos.find((d: any) => d.id === salida?.destino);
      const destName = destObj?.name || destObj?.nombre || salida?.destino || "Salida";

      const lcData: LugarCargaListaData[] = (salida?.cargas || []).map((lc: any) => ({
        name: lc.name || lc.nombre || "",
        address: lc.address || lc.direccion || "",
        horario: lc.horario || "",
      }));

      const pasajerosData: PasajeroListaData[] = mappedPasajeros.map((p) => ({
        numero: p.numero,
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
        destinoName: destName,
        salidaDate: salida?.date_of_out ? String(salida.date_of_out).split(" ")[0] : "",
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

  const ascensosList = Object.values(ascensosGrouped);

  return (
    <Container>
      <ToggleSalidas />

      <section className="flex flex-col gap-3">
        <Link
          href={"/dashboard"}
          className="flex items-center justify-start gap-3"
        >
          <ArrowLeft />
          <h1 className="font-bold md:text-xl">Volver al menú</h1>
        </Link>
        <Link
          href={`/salidas`}
          className="flex items-center cursor-pointer justify-start gap-3"
        >
          <ArrowLeft color="#6005F7" />
          <h1 className="font-semibold text-secondary md:text-lg">Volver a Salidas</h1>
        </Link>
      </section>

      {/* Iconos de acción */}
      <section className="flex items-center justify-end gap-2 mx-5 mb-2 md:mt-[-20px] mt-2">
        <Link
          href={`/salidas/lista/${id}/transporte`}
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Cambiar transporte"
        >
          <Transporte />
          <p className="text-xs text-black md:block hidden">Cambiar transporte</p>
        </Link>
        {/* Taquilla */}
        <Link
          href={`/salidas/lista/${id}/butacas`}
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Butacas"
        >
          <Butaca />
          <p className="text-xs text-black md:block hidden">Taquilla</p>
        </Link>
        {/* Vouchers */}
        <button
          onClick={handleToggleVouchersOnline}
          className={`p-1.5 flex items-center gap-2 font-semibold transition-colors cursor-pointer ${
            salida?.vouchers_online ? "text-emerald-600 font-bold" : "text-black hover:text-secondary"
          }`}
          title={salida?.vouchers_online ? "Vouchers Online Habilitados (click para deshabilitar)" : "Habilitar Vouchers Online"}
        >
          <Subir />
          <p className="text-xs md:block hidden">
            {salida?.vouchers_online ? "Vouchers Online: Activo" : "Vouchers Online"}
          </p>
        </button>
        {/* Excel */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold text-black hover:text-secondary transition-colors cursor-pointer"
          title="Exportar Excel"
          onClick={handleExportExcel}
        >
          <Excel />
          <p className="text-xs text-black md:block hidden">Exportar Excel</p>
        </button>
        {/* Horarios */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold text-black hover:text-secondary transition-colors"
          title="Horarios y Coordinador"
          onClick={handleOpenRelojModal}
        >
          <Reloj />
          <p className="text-xs text-black md:block hidden">Horarios</p>
        </button>
        {/* Cambiar Hotel */}
        {packageHotelCount === 1 && (
          <button
            className="p-1.5 flex items-center gap-2 font-semibold text-black hover:text-secondary transition-colors"
            title="Hotel y Régimen de la Salida"
            onClick={handleOpenHotelModal}
          >
            <Hotel />
            <p className="text-xs text-black md:block hidden">Cambiar Hotel</p>
          </button>
        )}
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
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">|</span>
            <span className="w-20 md:block hidden text-center">Reserva</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">|</span>
            <span className="w-24 md:block hidden text-center">Cliente</span>
            <span className="text-transparent font-normal px-1 select-none">|</span>
            <span className="w-32 text-center">Ascenso</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">|</span>
            <span className="w-32 md:block hidden text-center">Hotel</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">|</span>
            <span className="w-12 md:block hidden text-center">Edad</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">|</span>
            <span className="w-28 md:block hidden text-center">Teléfono</span>
            <span className="text-transparent font-normal px-1 select-none">|</span>
            <span className="w-24 text-center">Tipo de Bus</span>
            <span className="text-transparent font-normal px-1 select-none">|</span>
            <span className="w-16 md:block hidden text-center">Obs</span>
            <span className="text-transparent font-normal px-1 select-none">|</span>
            <span className="w-20 text-center">Voucher</span>
          </div>
        </div>

        {/* Rows List */}
        <div className="flex flex-col w-full gap-2">
          {mappedPasajeros.length === 0 ? (
            <p className="text-gray-500 py-10 font-medium text-center bg-white rounded-lg border border-[#3DADFF]">
              No hay pasajeros registrados en esta salida.
            </p>
          ) : (
            (() => {
              const salidaCargasIds: string[] = (salida?.cargas || []).map((lc: any) => lc.id).filter(Boolean);
              const salidaCargasNames: string[] = (salida?.cargas || []).map((lc: any) => (lc.name || lc.nombre || "").toLowerCase()).filter(Boolean);

              return mappedPasajeros.map((p, idx) => (
                <PasajeroRow
                  key={idx}
                  salidaId={id}
                  pasajero={p}
                  salidaCargasIds={salidaCargasIds}
                  salidaCargasNames={salidaCargasNames}
                  onUpdated={loadData}
                />
              ));
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
                <td colSpan={3} className="py-2">No hay ascensos asignados</td>
              </tr>
            ) : (
              ascensosList.map((asc, i) => (
                <tr key={i} className="text-black font-semibold text-xs border-t border-gray-300">
                  <td className="py-2">{asc.cantidad}</td>
                  <td className="py-2">{asc.nombre}</td>
                  <td className="py-2 text-wrap">{asc.direccion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Modal Reloj (Horarios y Coordinador) */}
      {
        showRelojModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowRelojModal(false)}
          >
            <div
              className="bg-primary rounded-2xl w-[90%] max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Logo */}
              <div className="flex justify-center pt-5 pb-3">
                <img
                  src="/logo.png"
                  alt="Tranett"
                  className="w-20"
                />
              </div>

              <h3 className="text-center font-bold text-sm mb-3">Horarios y Coordinación</h3>

              {/* Tabla Ascenso (scrollable) */}
              <div className="px-6 py-2 max-h-[25vh] overflow-y-auto mt-2">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="sticky top-0 bg-gray-700">
                    <tr>
                      <th className="py-1.5 px-2 font-semibold">Cantidad</th>
                      <th className="py-1.5 px-2 text-center font-semibold">Lugar de Carga</th>
                      <th className="py-1.5 px-2 font-semibold">Horario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const salidaCargas = salida?.cargas || [];
                      if (salidaCargas.length === 0) {
                        return (
                          <tr className="bg-gray-600">
                            <td colSpan={3} className="py-2 px-3">Sin lugares de carga configurados</td>
                          </tr>
                        );
                      }

                      return salidaCargas.map((lc: any, i: number) => {
                        const lcName = (lc.name || lc.nombre || "").toLowerCase();
                        const count = mappedPasajeros.filter((p) => p.lugar_carga_id === lc.id || (lcName && (p.ascenso || "").toLowerCase() === lcName)).length;
                        return (
                          <tr key={i} className="bg-gray-600 border-t border-gray-700">
                            <td className="py-1.5 px-2">{count}</td>
                            <td className="py-1.5 px-2 text-center font-semibold truncate" title={lc.name || lc.nombre}>
                              {lc.name || lc.nombre}
                            </td>
                            <td className="py-1.5 px-2 flex justify-center">
                              <input
                                type="text"
                                value={tempHorarios[i] || ""}
                                onChange={(e) => {
                                  const copy = [...tempHorarios];
                                  copy[i] = e.target.value;
                                  setTempHorarios(copy);
                                }}
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
              <div className="px-6 py-2 max-h-[25vh] overflow-y-auto mt-2">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="sticky top-0 bg-gray-700">
                    <tr>
                      <th className="py-1.5 px-2 font-semibold">Coordinador/a</th>
                      <th className="py-1.5 px-2 text-center font-semibold">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-600 border-t border-gray-700">
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={tempCoordinadorNombre}
                          onChange={(e) => setTempCoordinadorNombre(e.target.value)}
                          className="bg-gray-750 text-white text-xs border border-gray-600 rounded p-2 focus:outline-none focus:ring-1 focus:ring-secondary"
                          placeholder="Nombre de la persona encargada"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={tempCoordinadorTelefono}
                          onChange={(e) => setTempCoordinadorTelefono(e.target.value)}
                          className="bg-gray-750 text-white text-xs border border-gray-600 rounded p-2 focus:outline-none focus:ring-1 focus:ring-secondary"
                          placeholder="Ej: 1169694995"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Botones */}
              <div className="flex justify-center gap-4 px-4 py-5">
                <button
                  onClick={() => setShowRelojModal(false)}
                  className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer border border-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveHorarios}
                  disabled={isSavingHorarios}
                  className="bg-secondary text-white font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSavingHorarios ? "Guardando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal Hotel y Régimen */}
      {
        showHotelModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowHotelModal(false)}
          >
            <div
              className="bg-primary rounded-2xl w-[90%] max-w-md max-h-[85vh] flex flex-col overflow-hidden text-white"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Logo */}
              <div className="flex justify-center pt-5 pb-3">
                <img
                  src="/logo.png"
                  alt="Tranett"
                  className="w-20"
                />
              </div>

              <h3 className="text-center font-bold text-sm mb-3">Cambiar Hotel y Régimen</h3>

              {/* Formulario */}
              <table className="w-full text-xs text-center border-collapse">
                <thead className="sticky top-0 bg-gray-700">
                  <tr>
                    <th className="py-1.5 px-2 font-semibold">Destino</th>
                    <th className="py-1.5 px-2 text-center font-semibold">Hotel</th>
                    <th className="py-1.5 px-2 font-semibold">Régimen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-600 border-t border-gray-700">
                    <td className="py-1.5 px-2">{destName || salida?.destino || ""}</td>
                    <td className="py-1.5 px-2">
                      <select
                        value={selectedHotel}
                        onChange={(e) => setSelectedHotel(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                      >
                        <option value="">Seleccione un hotel</option>
                        {filteredHoteles.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={selectedRegimen}
                        onChange={(e) => setSelectedRegimen(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                      >
                        <option value="">Seleccione un régimen</option>
                        {regimenes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name || r.nombre || r.sigla}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Botones */}
              <div className="flex justify-center gap-4 px-4 py-5">
                <button
                  onClick={() => setShowHotelModal(false)}
                  className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer border border-gray-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateHotel}
                  disabled={isUpdatingHotel}
                  className="bg-secondary text-white font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingHotel ? "Guardando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </Container >
  );
}
