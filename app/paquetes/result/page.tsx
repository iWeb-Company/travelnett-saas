"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import AddVioleta from "@/app/components/icons/AddVioleta";
import ArrowUpDown from "@/app/components/icons/ArrowUpDown";
import Copy from "@/app/components/icons/salidas/Copy";
import Rooming from "@/app/components/icons/salidas/Rooming";
import Update from "@/app/components/icons/salidas/Update";
import Delete from "@/app/components/icons/salidas/Delete";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Suspense } from "react";

function ResultPaquetesContent() {
  const searchParams = useSearchParams();
  console.log(searchParams.get("destino"));
  return (
    <Container>
      <ToggleSalidas />
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <Link
        className="flex items-center my-2 justify-start gap-2"
        href={"/salidas/agregar-salida"}>
        <AddVioleta />
        <p className="text-secondary font-semibold">Agregar</p>
      </Link>
      <section className="flex justify-between my-5 items-center">
        <h2 className="font-medium text-black">Salidas</h2>
        <div className="flex items-center gap-1">
          <p className="text-black">Fecha</p>
          <ArrowUpDown />
        </div>
      </section>
      <section className="flex flex-col  gap-5">
        <div className="flex items-center gap-5">
          <div className="bg-primary flex-1 text-white justify-between rounded-lg px-2 text-sm py-3 flex gap-2">
            <p>Termas de Rio Hondo</p>
            <p>22/06/2025</p>
          </div>
          <div className="flex items-center gap-x-1 justify-center">
            <Copy id={1} />
            <Rooming id={1} />
            <Update id={1} />
            <Delete id={1} />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="bg-primary flex-1 text-white justify-between rounded-lg px-2 text-sm py-3 flex gap-2">
            <p>Termas de Rio Hondo</p>
            <p>22/06/2025</p>
          </div>
          <div className="flex items-center gap-x-1 justify-center">
            <Copy id={2} />
            <Rooming id={2} />
            <Update id={2} />
            <Delete id={2} />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="bg-primary flex-1 text-white justify-between rounded-lg px-2 text-sm py-3 flex gap-2">
            <p>Termas de Rio Hondo</p>
            <p>22/06/2025</p>
          </div>
          <div className="flex items-center gap-x-1 justify-center">
            <Copy id={3} />
            <Rooming id={3} />
            <Update id={3} />
            <Delete id={3} />
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="bg-primary flex-1 text-white justify-between rounded-lg px-2 text-sm py-3 flex gap-2">
            <p>Termas de Rio Hondo</p>
            <p>22/06/2025</p>
          </div>
          <div className="flex items-center gap-x-1 justify-center">
            <Copy id={4} />
            <Rooming id={4} />
            <Update id={4} />
            <Delete id={4} />
          </div>
        </div>
      </section>
    </Container>
  );
}

export default function ResultPaquetesPage() {
  return (
    <Suspense>
      <ResultPaquetesContent />
    </Suspense>
  );
}
