"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import AddVioleta from "@/app/components/icons/AddVioleta";
import ArrowUpDown from "@/app/components/icons/ArrowUpDown";
import SalidaCard from "@/app/components/SalidaCard";
import Pagination from "@/app/components/Pagination";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "@/app/components/Loader";

function ResultContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [salidas, setSalidas] = useState<any[]>([]);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [transportes, setTransportes] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(true);

  const tipoFilter = searchParams.get("tipo") || "";
  const destinoFilter = searchParams.get("destino") || "";
  const empresaFilter = searchParams.get("empresa") || "";
  const periodFilter = searchParams.get("periodo") || "";
  const rangoFilter = searchParams.get("rango") || "";
  const activeFilter = searchParams.get("active") || "";

  useEffect(() => {
    const loadAll = async () => {
      if (!user?.iweb_client_id) return;
      try {
        const [salidasData, destData, transData, periodData] = await Promise.all([
          apiClient.getSalidas(user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_transport_companies", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_periods", user.iweb_client_id).catch(() => []),
        ]);
        setSalidas(salidasData);
        setDestinos(destData);
        setTransportes(transData);
        setPeriodos(periodData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [user?.iweb_client_id]);

  const filtered = salidas.filter((s) => {
    if (tipoFilter && tipoFilter !== "null" && s.type !== tipoFilter) {
      return false;
    }
    if (destinoFilter && s.destino !== destinoFilter) {
      return false;
    }
    if (empresaFilter && s.transport_company !== empresaFilter) {
      return false;
    }
    if (periodFilter && s.periodo !== periodFilter) {
      return false;
    }
    if (activeFilter === "true" && !s.active) {
      return false;
    }
    if (rangoFilter === "proximos" && s.date_of_out) {
      const depDate = new Date(s.date_of_out + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + 30);
      targetDate.setHours(23, 59, 59, 999);
      if (depDate < today || depDate > targetDate) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = a.date_of_out ? new Date(a.date_of_out).getTime() : 0;
    const db = b.date_of_out ? new Date(b.date_of_out).getTime() : 0;
    return sortAsc ? da - db : db - da;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginatedSalidas = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (id: string | number) => {
    if (!user?.iweb_client_id) return;
    if (window.confirm("¿Está seguro de eliminar esta salida?")) {
      try {
        await apiClient.deleteSalida(user.iweb_client_id, id.toString());
        setSalidas((prev) => prev.filter((s) => s.id !== id));
      } catch (err) {
        console.error(err);
      }
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
      <ToggleSalidas />
      <Link
        href={"/salidas"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver a filtros</h1>
      </Link>
      <Link
        className="flex items-center my-2 justify-start gap-2"
        href={`/salidas/agregar-salida?type=${tipoFilter}`}>
        <AddVioleta />
        <p className="text-secondary font-semibold md:text-lg">Agregar Salida</p>
      </Link>
      <section className="flex justify-between my-5 items-center">
        <h2 className="font-medium text-black text-center mx-auto md:text-xl">Resultados de Salidas</h2>
      </section>
      <section className="flex flex-col max-w-6xl mx-auto gap-5">
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center my-2 font-semibold justify-end gap-1 text-black self-end hover:opacity-85"
        >
          <p>Ordenar por fecha ({sortAsc ? "Ascendente" : "Descendente"})</p>
          <ArrowUpDown />
        </button>
        <div className="flex flex-col w-full gap-4">

          {sorted.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No se encontraron salidas que coincidan con los criterios.</p>
          ) : (
            paginatedSalidas.map((salida) => {
              const destObj = destinos.find((d) => d.id === salida.destino);
              const destName = destObj?.name || destObj?.nombre || "Desconocido";
              return (
                <SalidaCard
                  key={salida.id}
                  id={salida.id}
                  destino={destName}
                  fecha={salida.date_of_out || ""}
                  categorias={[
                    { tipo: "Semicama", total: salida.semicama || 0, disponible: salida.semicama_disponibles ?? (salida.semicama || 0) },
                    { tipo: "Cama", total: salida.cama || 0, disponible: salida.cama_disponibles ?? (salida.cama || 0) }
                  ]}
                  onDelete={handleDelete}
                />
              );
            })
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sorted.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </section>
    </Container>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><p className="text-black">Cargando...</p></div>}>
      <ResultContent />
    </Suspense>
  );
}
