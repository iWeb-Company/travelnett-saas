"use client";
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
  const handleBack = () => { r.back(); };
  const id = searchParams.get("id");
  
  return (
    <Container>
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3"
      >
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={handleBack}
        className="flex items-center my-3 justify-start gap-3"
      >
        {/* <ArrowLeft /> */}
        <h2 className="font-semibold text-secondary underline">Cancelar</h2>
      </button>
      <form className="flex flex-col w-full max-w-3xl mx-auto my-5 gap-5">
        <h2 className="text-black text-center md:text-xl font-medium">
          {id ? "Modificar" : "Agregar"} paquete
        </h2>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino"
        >
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
          id="destino"
        >
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Nombre del paquete
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino"
        >
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Subtitulo
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino"
        >
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Descripcion
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino"
        >
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
          id="destino"
        >
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Periodo
          </option>
          <option className="bg-[#f1f1f1]" value="">
            Destino
          </option>
        </select>
        <select
          className="text-gray-500 font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino"
        >
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Precio
          </option>
          <option className="bg-[#f1f1f1]" value="ARS">
            ARS
          </option>
          <option className="bg-[#f1f1f1]" value="USD">
            USD
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino"
        >
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Gastos administrativos
          </option>
          <option className="bg-[#f1f1f1]" value="ARS">
            ARS
          </option>
          <option className="bg-[#f1f1f1]" value="USD">
            USD
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino"
        >
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Adicional buscama/business
          </option>
          <option className="bg-[#f1f1f1]" value="ARS">
            ARS
          </option>
          <option className="bg-[#f1f1f1]" value="USD">
            USD
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino"
        >
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Hotel
          </option>
          <option className="bg-[#f1f1f1]" value="ARS">
            ARS
          </option>
          <option className="bg-[#f1f1f1]" value="USD">
            USD
          </option>
        </select>
        <select
          className="text-gray-500 bg-[#f1f1f1] font-medium w-full border border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
          name="destino"
          id="destino"
        >
          <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
            Excursiones
          </option>
          <option className="bg-[#f1f1f1]" value="ARS">
            ARS
          </option>
          <option className="bg-[#f1f1f1]" value="USD">
            USD
          </option>
        </select>
        <div className="flex gap-2 items-center">
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M45 36V45H36V51H45V60H51V51H60V45H51V36H45ZM30.9 54H6C2.7 54 0 51.3 0 48V6C0 2.7 2.7 0 6 0H48C51.3 0 54 2.7 54 6V30.9C52.2 30.3 50.1 30 48 30C44.7 30 41.4 30.9 38.7 32.7L34.5 27L24 40.5L16.5 31.5L6 45H30.3C30 45.9 30 47.1 30 48C30 50.1 30.3 52.2 30.9 54Z"
              fill="black"
            />
          </svg>

          <input type="file" name="" id="" />
        </div>
        <ToggleActiveFilters />
        <button className="w-full bg-primary text-white font-medium text-center py-2 rounded-xl">
          {id ? "Modificar" : "Agregar"}
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
