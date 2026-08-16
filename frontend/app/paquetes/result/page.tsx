"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import AddVioleta from "@/app/components/icons/AddVioleta";
import ArrowUpDown from "@/app/components/icons/ArrowUpDown";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Suspense, useState, useEffect, useRef } from "react";
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
  const loadedRef = useRef<string | null>(null);

  const destinoFilter = searchParams.get("destino") || "";
  const periodFilter = searchParams.get("periodo") || "";

  useEffect(() => {
    const loadAll = async () => {
      if (!user?.iweb_client_id) return;
      if (loadedRef.current === user.iweb_client_id) return;
      loadedRef.current = user.iweb_client_id;

      try {
        const [params, pkgsData, salidasData] = await Promise.all([
          apiClient.getAllParameters(user.iweb_client_id).catch(() => ({ destinos: [], hotels: [], excursions: [], periods: [], regimenes: [] })),
          apiClient.getPackages(user.iweb_client_id).catch(() => []),
          apiClient.getSalidas(user.iweb_client_id).catch(() => []),
        ]);
        setPaquetes(pkgsData);
        setDestinos(params.destinos || []);
        setPeriodos(params.periods || []);
        setHoteles(params.hotels || []);
        setRegimenes(params.regimenes || []);
        setExcursiones(params.excursions || []);
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
  // activeFilter: "true" = only actives, "false" = show all (no restriction)
  const activeFilter = searchParams.get("active") || "";

  const filtered = paquetes.filter((p) => {
    // ── 1. Filtro Destino ────────────────────────────────────────────────
    // pkg.destino may be stored as a name string OR an id — handle both
    if (destinoFilter) {
      const destObj = destinos.find(
        (d: any) => d.id === p.destino || (d.name || d.nombre) === p.destino
      );
      const destName = destObj ? (destObj.name || destObj.nombre) : p.destino;
      if (!destName || destName !== destinoFilter) return false;
    }

    // ── 2. Filtro Periodo ────────────────────────────────────────────────
    // pkg.periodo may be stored as an id OR a name — normalize to id
    if (periodFilter) {
      const periodObj = periodos.find(
        (pr: any) =>
          pr.id === p.periodo ||
          (pr.name || pr.nombre || pr.description) === p.periodo
      );
      const periodId = periodObj ? periodObj.id : p.periodo;
      if (!periodId || periodId !== periodFilter) return false;
    }

    // ── 3. Filtro Active ────────────────────────────────────────────────
    // Only restrict when toggle is ON (activeFilter === "true")
    // When activeFilter === "false" show everything (no restriction)
    if (activeFilter === "true") {
      const isActive = p.active ?? true; // null treated as active
      if (!isActive) return false;
    }

    // ── 4. Filtro Rango de fechas ────────────────────────────────────────
    if (rangoFilter) {
      const dates: string[] = Array.isArray(p.dates) ? p.dates : [];
      if (dates.length === 0) return false; // no dates assigned → exclude

      // Find the earliest departure date among all assigned salidas
      const departureDates = dates
        .map((dId: string) => salidas.find((s: any) => s.id === dId))
        .filter((s: any) => s && s.date_of_out)
        .map((s: any) => new Date(s.date_of_out + "T00:00:00"));

      if (departureDates.length === 0) return false;

      const earliest = departureDates.reduce((min, d) => (d < min ? d : min));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (rangoFilter === "proximos") {
        const limit = new Date();
        limit.setDate(today.getDate() + 30);
        limit.setHours(23, 59, 59, 999);
        if (earliest < today || earliest > limit) return false;
      } else if (rangoFilter === "temporada_alta") {
        // July (6) or August (7)
        const month = earliest.getMonth();
        if (month !== 6 && month !== 7) return false;
      }
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
              // pkg.destino may be stored as a name OR an id — search both ways
              const destObj = destinos.find((d: any) => d.id === pkg.destino || (d.name || d.nombre) === pkg.destino);
              // pkg.periodo may be stored as an id OR a name — search both ways
              const periodObj = periodos.find((pr: any) => pr.id === pkg.periodo || (pr.name || pr.nombre || pr.description) === pkg.periodo);
              // Resolve hotels array
              const resolvedHotels = (pkg.hotels || []).map((ph: any) => {
                const hotelObj = hoteles.find((h: any) => h.id === ph.hotel_id);
                const regimenObj = regimenes.find((r: any) => r.id === ph.hotel_regimen_id);
                return {
                  hotel_id: ph.hotel_id,
                  hotelNombre: hotelObj?.name || "Desconocido",
                  regimenNombre: regimenObj?.name || "Desconocido",
                  hotel_noches: ph.hotel_noches,
                  pricing_type: ph.pricing_type,
                  tarifa_doble: ph.tarifa_doble,
                  tarifa_triple: ph.tarifa_triple,
                };
              });
              const excursionObj = excursiones.find((e: any) => e.id === pkg.excursiones);

              let resolvedDate = "";
              let resolvedDates: string[] = [];
              if (pkg.dates && pkg.dates.length > 0) {
                pkg.dates.forEach((dId: string) => {
                  const matchedSal = salidas.find((s: any) => s.id === dId);
                  if (matchedSal && matchedSal.date_of_out) {
                    resolvedDates.push(matchedSal.date_of_out);
                  } else if (dId && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(dId)) {
                    resolvedDates.push(dId);
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
                moneda: pkg.moneda === "dolares" ? "USD" : (pkg.moneda === "pesos" ? "ARS" : (pkg.moneda || "ARS")),
                precio: pkg.price || 0,
                gastosAdmin: pkg.gastos || 0,
                hotels: resolvedHotels,
                // backward-compat single hotel for card display
                hotelNombre: resolvedHotels.length > 0 ? resolvedHotels.map((h: any) => h.hotelNombre).join(" / ") : "Sin hotel",
                regimenNombre: resolvedHotels.length > 0 ? resolvedHotels[0].regimenNombre : "Desconocido",
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
