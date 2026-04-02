"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import AddVioleta from "@/app/components/icons/AddVioleta";
import ArrowUpDown from "@/app/components/icons/ArrowUpDown";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Suspense } from "react";
import PaquetesCard from "../PaquetesCard";

function ResultContent() {
  const searchParams = useSearchParams();
  console.log(searchParams.get("destino"));
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
        href={"/paquetes/agregar-paquete"}>
        <AddVioleta />
        <p className="text-secondary font-semibold md:text-lg">Agregar</p>
      </Link>
      <section className="flex justify-between my-5 items-center">
        <h2 className="font-medium text-black text-center mx-auto md:text-xl">Salidas</h2>
      </section>
      <section className="flex flex-col max-w-6xl mx-auto gap-5">
        <button className="flex items-center my-2 font-semibold justify-end gap-1">
          <p className="text-black">Ordenar por fecha</p>
          <ArrowUpDown />
        </button>
        <div className="flex flex-col w-full gap-10">
          <PaquetesCard />
          <PaquetesCard />
          <PaquetesCard />
          <PaquetesCard />
          <PaquetesCard />
        </div>
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
