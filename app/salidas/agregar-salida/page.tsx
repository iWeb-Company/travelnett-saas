'use client'
import Link from "next/link";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleActiveFilters from "@/app/components/ToggleActiveFilters";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense } from "react";

function AgregarSalidaContent() {
  const searchParams = useSearchParams();
  const r = useRouter();
  const handleBack = () => {
    r.back();
  };
  console.log(searchParams.get("id"));
  return (
    <Container>
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button onClick={handleBack} className="flex items-center my-3 justify-start gap-3">
        {/* <ArrowLeft /> */}
        <h2 className="font-semibold text-secondary underline">Cancelar</h2>
      </button>
      <form className="flex flex-col my-5 gap-3">
        <h2 className="text-black text-center font-medium">Agregar salida</h2>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino">
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Destino
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino">
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Empresa de transporte
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino">
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Fecha de salida
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino">
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Periodo
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino">
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Cantidad de pasajeros totales
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino">
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Semicama
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino">
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Cama
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino">
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Lugares de carga
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <ToggleActiveFilters />
        <button className="w-full bg-primary text-white font-medium text-center py-2 rounded-xl">
          Agregar
        </button>
      </form>
    </Container>
  );
}

export default function AgregarSalidaPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AgregarSalidaContent />
    </Suspense>
  );
}
