"use client";
import Pagination from "@/app/components/Pagination";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import AddVioleta from "@/app/components/icons/AddVioleta";
import ArrowUpDown from "@/app/components/icons/ArrowUpDown";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import ToggleActiveFilters from "@/app/components/ToggleActiveFilters";
import { Suspense, useState, useEffect, useMemo } from "react";
import ReservasCard from "../ReservasCard";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "@/app/components/Loader";
import { Reserva } from "@/app/types";
import { formatDateDDMMYY } from "@/lib/formatDate";
import { formatPassengerName, formatFullName } from "@/lib/formatPassengerName";

interface Passenger {
  dni: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  puntoAscenso: string;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const success = searchParams.get("success") === "true";
  const destino = searchParams.get("destino") || "";
  const cliente = searchParams.get("cliente") || "";
  const hotel = searchParams.get("hotel") || "";
  const cama = searchParams.get("cama") || "";
  const habitacion = searchParams.get("habitacion") || "";

  const filterNumero = searchParams.get("numero") || "";
  const filterCliente = searchParams.get("cliente") || "";
  const filterRango = searchParams.get("rango") || "";
  const filterPeriodo = searchParams.get("periodo") || "";
  const filterPaquete = searchParams.get("paquete") || "";
  const filterActivoParam = searchParams.get("activo");

  const [onlyActive, setOnlyActive] = useState<boolean>(
    filterActivoParam === null ? true : filterActivoParam === "true",
  );

  const [pasajeros, setPasajeros] = useState<Passenger[]>([]);

  const [rawReservas, setRawReservas] = useState<any[]>([]);
  const [salidasList, setSalidasList] = useState<any[]>([]);
  const [selectedSalidaFilter, setSelectedSalidaFilter] = useState<string>("");
  const [loadingList, setLoadingList] = useState(true);

  const fetchReservas = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [resList, salList] = await Promise.all([
        apiClient.getReservas(user.iweb_client_id).catch(() => []),
        apiClient.getSalidas(user.iweb_client_id).catch(() => []),
      ]);

      setSalidasList(salList || []);

      // Map reservations
      const list = (resList || []).map((r: any) => {
        const pasajerosMap =
          r.reservation_passengers && r.reservation_passengers.length > 0
            ? r.reservation_passengers.map((rp: any) => ({
                nombre:
                  rp.name || rp.last_name
                    ? formatPassengerName(rp.name, rp.last_name)
                    : formatFullName(rp.nombre_completo),
                dni: rp.dni ? String(rp.dni) : "-",
                telefono: rp.telefono || "-",
                email: "-",
              }))
            : [
                {
                  nombre: formatFullName(r.nombre_completo),
                  dni: r.dni ? String(r.dni) : "-",
                  telefono: r.telefono || "-",
                  email: "-",
                },
              ];

        return {
          id: r.id,
          iweb_client_id: r.iweb_client_id,
          salida_id: r.salida_id || null,
          package_id: r.package_id || null,
          codigo_reserva: r.codigo_reserva,
          numero:
            r.codigo_reserva || `RES-${r.id.substring(0, 6).toUpperCase()}`,
          destino: r.destino || r.lugar_carga_nombre || "General",
          cliente: (r.client_nombre || "Particular").toUpperCase(),
          client_nombre: r.client_nombre || "",
          client_id: r.client_id || "",
          fechaRaw: r.fecha || "",
          fecha: formatDateDDMMYY(r.fecha),
          nombre_completo: formatFullName(r.nombre_completo),
          reservation_passengers: r.reservation_passengers || [],
          pasajeros: pasajerosMap,
          active: r.active,
        };
      });

      setRawReservas(list);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar listado de reservas");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      fetchReservas();
    }
  }, [user?.iweb_client_id]);

  useEffect(() => {
    if (success) {
      const pasajerosParam = searchParams.get("pasajeros");
      if (pasajerosParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(pasajerosParam));
          setPasajeros(parsed);
        } catch (e) {
          console.error("Error parsing pasajeros", e);
        }
      }
    }
  }, [success, searchParams]);

  // Unique salidas dropdown options
  const uniqueSalidas = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    rawReservas.forEach((r) => {
      if (r.salida_id && !map.has(r.salida_id)) {
        const sal = salidasList.find((s) => s.id === r.salida_id);
        let label = r.destino || "Salida";
        if (sal?.date_of_out) {
          label += ` - ${formatDateDDMMYY(sal.date_of_out)}`;
        } else if (r.fechaRaw) {
          label += ` - ${formatDateDDMMYY(r.fechaRaw)}`;
        }
        map.set(r.salida_id, { id: r.salida_id, label });
      }
    });
    return Array.from(map.values());
  }, [rawReservas, salidasList]);

  // Filtered reservations
  const filteredReservas = useMemo(() => {
    return rawReservas.filter((r) => {
      if (
        filterNumero &&
        !r.numero.toLowerCase().includes(filterNumero.toLowerCase())
      ) {
        return false;
      }
      if (filterCliente && r.client_id !== filterCliente) {
        return false;
      }
      if (filterPaquete && r.package_id !== filterPaquete) {
        return false;
      }
      if (selectedSalidaFilter && r.salida_id !== selectedSalidaFilter) {
        return false;
      }
      if (filterRango && r.fechaRaw) {
        const d = new Date(r.fechaRaw + "T00:00:00");
        if (!isNaN(d.getTime())) {
          const now = new Date();
          if (
            filterRango === "hoy" &&
            d.toDateString() !== now.toDateString()
          ) {
            return false;
          }
          if (filterRango === "ultimos_7") {
            const limit = new Date();
            limit.setDate(now.getDate() - 7);
            if (d < limit) return false;
          }
          if (filterRango === "ultimos_30") {
            const limit = new Date();
            limit.setDate(now.getDate() - 30);
            if (d < limit) return false;
          }
          if (
            filterRango === "este_mes" &&
            (d.getMonth() !== now.getMonth() ||
              d.getFullYear() !== now.getFullYear())
          ) {
            return false;
          }
        }
      }
      return true;
    });
  }, [
    rawReservas,
    filterNumero,
    filterCliente,
    filterPaquete,
    selectedSalidaFilter,
    filterRango,
    onlyActive,
  ]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(filteredReservas.length / pageSize);
  const paginatedReservas = filteredReservas.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  if (loadingList) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <Container>
      <ToggleSalidas />
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver al menú</h1>
      </Link>
      <Link
        className="flex items-center my-2 justify-start gap-2"
        href={"/web/reservas/crear-reserva/paso-1"}>
        <AddVioleta />
        <p className="text-secondary font-semibold md:text-lg">Crear reserva</p>
      </Link>
      <section className="flex justify-between my-5 items-center">
        <h2 className="font-semibold text-black text-center mx-auto md:text-xl">
          Reservas
        </h2>
      </section>

      <section className="flex flex-col w-full max-w-7xl xl:mx-auto gap-5">
        <div className="flex flex-col w-full gap-10">
          {paginatedReservas.map((reserva) => (
            <ReservasCard
              key={reserva.id}
              reserva={reserva}
              onRefresh={fetchReservas}
            />
          ))}
          {filteredReservas.length === 0 && (
            <p className="text-center text-gray-500 font-semibold py-10">
              No se encontraron reservas con los filtros aplicados.
            </p>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredReservas.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>
    </Container>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
