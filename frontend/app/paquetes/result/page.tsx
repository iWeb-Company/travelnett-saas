"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import AddVioleta from "@/app/components/icons/AddVioleta";
import ArrowUpDown from "@/app/components/icons/ArrowUpDown";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Suspense, useState } from "react";
import PaquetesCard from "../PaquetesCard";
import { useMockData } from "@/context/MockDataContext";

function ResultContent() {
  const searchParams = useSearchParams();
  const { paquetes, deletePaquete, updatePaquete } = useMockData();
  const [sortAsc, setSortAsc] = useState(true);

  const destinoFilter = searchParams.get("destino") || "";
  const periodFilter = searchParams.get("periodo") || "";

  const filtered = paquetes.filter((p) => {
    if (destinoFilter && p.destinoId !== destinoFilter && p.destinoNombre !== destinoFilter) {
      return false;
    }
    if (periodFilter && p.periodoId !== periodFilter && p.periodoNombre !== periodFilter) {
      return false;
    }
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.fechaSalida).getTime();
    const db = new Date(b.fechaSalida).getTime();
    return sortAsc ? da - db : db - da;
  });

  const handleDelete = (id: string) => {
    if (window.confirm("¿Está seguro de eliminar este paquete?")) {
      deletePaquete(id);
    }
  };

  const handleToggleActive = (id: string, active: boolean) => {
    updatePaquete(id, { active });
  };

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
            sorted.map((pkg) => (
              <PaquetesCard
                key={pkg.id}
                paquete={pkg}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            ))
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
