"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import AddVioleta from "@/app/components/icons/AddVioleta";
import ArrowUpDown from "@/app/components/icons/ArrowUpDown";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Suspense, useState, useEffect } from "react";
import PaquetesCard from "../PaquetesCard";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "@/app/components/Loader";

function ResultContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [hoteles, setHoteles] = useState<any[]>([]);
  const [regimenes, setRegimenes] = useState<any[]>([]);
  const [excursiones, setExcursiones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(true);

  const destinoFilter = searchParams.get("destino") || "";
  const periodFilter = searchParams.get("periodo") || "";

  useEffect(() => {
    const loadAll = async () => {
      if (!user?.iweb_client_id) return;
      try {
        const [pkgsData, destData, periodData, hotelData, regimenData, excursionData] = await Promise.all([
          apiClient.getPackages(user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_periods", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_regimenes", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_excursiones", user.iweb_client_id).catch(() => []),
        ]);
        setPaquetes(pkgsData);
        setDestinos(destData);
        setPeriodos(periodData);
        setHoteles(hotelData);
        setRegimenes(regimenData);
        setExcursiones(excursionData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [user?.iweb_client_id]);

  const filtered = paquetes.filter((p) => {
    if (destinoFilter && p.destino !== destinoFilter) {
      return false;
    }
    if (periodFilter && p.periodo !== periodFilter) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = a.dates && a.dates.length > 0 ? new Date(a.dates[0]).getTime() : 0;
    const db = b.dates && b.dates.length > 0 ? new Date(b.dates[0]).getTime() : 0;
    return sortAsc ? da - db : db - da;
  });

  const handleDelete = async (id: string) => {
    if (!user?.iweb_client_id) return;
    if (window.confirm("¿Está seguro de eliminar este paquete?")) {
      try {
        await apiClient.deletePackage(user.iweb_client_id, id);
        setPaquetes((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    if (!user?.iweb_client_id) return;
    try {
      await apiClient.updatePackage(user.iweb_client_id, id, { active });
      setPaquetes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active } : p))
      );
    } catch (err) {
      console.error(err);
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
        href={"/paquetes"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver a filtros</h1>
      </Link>
      <Link
        className="flex items-center my-2 justify-start gap-2"
        href={"/paquetes/agregar-paquete"}>
        <AddVioleta />
        <p className="text-secondary font-semibold md:text-lg">Agregar Paquete</p>
      </Link>
      <section className="flex justify-between my-5 items-center">
        <h2 className="font-medium text-black text-center mx-auto md:text-xl">Resultados de Paquetes</h2>
      </section>
      <section className="flex flex-col max-w-6xl mx-auto gap-5">
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="flex items-center my-2 font-semibold justify-end gap-1 text-black self-end hover:opacity-85"
        >
          <p>Ordenar por fecha ({sortAsc ? "Ascendente" : "Descendente"})</p>
          <ArrowUpDown />
        </button>
        <div className="flex flex-col w-full gap-6">
          {sorted.length === 0 ? (
            <p className="text-center text-gray-500 py-10">No se encontraron paquetes que coincidan con los criterios.</p>
          ) : (
            sorted.map((pkg) => {
              const destObj = destinos.find((d) => d.id === pkg.destino);
              const periodObj = periodos.find((pr) => pr.id === pkg.periodo);
              const hotelObj = hoteles.find((h) => h.id === pkg.hotel);
              const regimenObj = regimenes.find((r) => r.id === pkg.regimen);
              const excursionObj = excursiones.find((e) => e.id === pkg.excursion);

              const mappedPkg = {
                id: pkg.id,
                nombre: pkg.name || "",
                destinoNombre: destObj?.name || destObj?.nombre || "Desconocido",
                fechaSalida: pkg.dates && pkg.dates.length > 0 ? pkg.dates[0] : "",
                periodoNombre: periodObj?.name || periodObj?.nombre || periodObj?.description || "Desconocido",
                moneda: "ARS",
                precio: pkg.price || 0,
                gastosAdmin: pkg.gastos || 0,
                hotelNombre: hotelObj?.name || "Desconocido",
                regimenNombre: regimenObj?.name || "Desconocido",
                excursionNombre: excursionObj?.name || "Ninguna",
                active: pkg.active ?? true,
              };

              return (
                <PaquetesCard
                  key={pkg.id}
                  paquete={mappedPkg as any}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                />
              );
            })
          )}
        </div>
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
