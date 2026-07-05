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
  const [salidas, setSalidas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortAsc, setSortAsc] = useState(true);

  const destinoFilter = searchParams.get("destino") || "";
  const periodFilter = searchParams.get("periodo") || "";

  useEffect(() => {
    const loadAll = async () => {
      if (!user?.iweb_client_id) return;
      try {
        const [pkgsData, destData, periodData, hotelData, regimenData, excursionData, salidasData] = await Promise.all([
          apiClient.getPackages(user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_periods", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_regimenes", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_excursiones", user.iweb_client_id).catch(() => []),
          apiClient.getSalidas(user.iweb_client_id).catch(() => []),
        ]);
        setPaquetes(pkgsData);
        setDestinos(destData);
        setPeriodos(periodData);
        setHoteles(hotelData);
        setRegimenes(regimenData);
        setExcursiones(excursionData);
        setSalidas(salidasData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [user?.iweb_client_id]);

  const rangoFilter = searchParams.get("rango") || "";
  const activeFilter = searchParams.get("active") || "";

  const filtered = paquetes.filter((p) => {
    if (destinoFilter && p.destino !== destinoFilter) {
      return false;
    }
    if (periodFilter && p.periodo !== periodFilter) {
      return false;
    }
    if (activeFilter !== "" && String(p.active ?? true) !== activeFilter) {
      return false;
    }
    if (rangoFilter && p.dates && p.dates.length > 0) {
      const salObj = salidas.find((s: any) => s.id === p.dates[0]);
      if (salObj && salObj.date_of_out) {
        const depDate = new Date(salObj.date_of_out + "T00:00:00");
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (rangoFilter === "proximos") {
          const targetDate = new Date();
          targetDate.setDate(today.getDate() + 30);
          targetDate.setHours(23, 59, 59, 999);
          if (depDate < today || depDate > targetDate) {
            return false;
          }
        } else if (rangoFilter === "temporada_alta") {
          const month = depDate.getMonth();
          if (month !== 6 && month !== 7) {
            return false;
          }
        }
      } else {
        return false;
      }
    } else if (rangoFilter) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    let dateA = 0;
    if (a.dates && a.dates.length > 0) {
      const salA = salidas.find((s: any) => s.id === a.dates[0]);
      if (salA && salA.date_of_out) {
        dateA = new Date(salA.date_of_out).getTime();
      }
    }
    let dateB = 0;
    if (b.dates && b.dates.length > 0) {
      const salB = salidas.find((s: any) => s.id === b.dates[0]);
      if (salB && salB.date_of_out) {
        dateB = new Date(salB.date_of_out).getTime();
      }
    }
    return sortAsc ? dateA - dateB : dateB - dateA;
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

  const handleToggleWeb = async (id: string, web: boolean) => {
    if (!user?.iweb_client_id) return;
    try {
      await apiClient.updatePackage(user.iweb_client_id, id, { web });
      setPaquetes((prev) =>
        prev.map((p) => (p.id === id ? { ...p, web } : p))
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

              let resolvedDate = "";
              let resolvedDates: string[] = [];
              if (pkg.dates && pkg.dates.length > 0) {
                pkg.dates.forEach((dId: string) => {
                  const matchedSal = salidas.find((s: any) => s.id === dId);
                  if (matchedSal && matchedSal.date_of_out) {
                    resolvedDates.push(matchedSal.date_of_out);
                  }
                });
                if (resolvedDates.length > 0) {
                  resolvedDate = resolvedDates[0];
                }
              }

              const mappedPkg = {
                id: pkg.id,
                nombre: pkg.name || "",
                destinoNombre: destObj?.name || destObj?.nombre || "Desconocido",
                fechaSalida: resolvedDate,
                fechasSalida: resolvedDates,
                periodoNombre: periodObj?.name || periodObj?.nombre || periodObj?.description || "Desconocido",
                moneda: "ARS",
                precio: pkg.price || 0,
                gastosAdmin: pkg.gastos || 0,
                hotelNombre: hotelObj?.name || "Desconocido",
                regimenNombre: regimenObj?.name || "Desconocido",
                excursionNombre: excursionObj?.name || "Ninguna",
                active: pkg.active ?? true,
                web: pkg.web ?? true,
              };

              return (
                <PaquetesCard
                  key={pkg.id}
                  paquete={mappedPkg as any}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onToggleWeb={handleToggleWeb}
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
