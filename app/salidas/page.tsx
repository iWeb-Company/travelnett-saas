"use client";
import Link from "next/link";
import Container from "../components/Container";
import ArrowLeft from "../components/icons/ArrowLeft";
import ToggleSalidas from "../components/ToggleSalidas";
import { useRouter } from "next/navigation";
import ToggleActiveFilters from "../components/ToggleActiveFilters";
import { useState } from "react";

type TipoSalida = "aereo" | "bus" | null;

export default function SalidasPage() {
  const router = useRouter();
  const [tipoSalida, setTipoSalida] = useState<TipoSalida>(null);
  const [data, setData] = useState({
    destino: "",
    empresa: "",
    rango: "",
    periodo: "",
  });
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(
      `/salidas/result?tipo=${tipoSalida}&destino=${data.destino}&empresa=${data.empresa}&rango=${data.rango}&periodo=${data.periodo}`,
    );
  };
  return (
    <Container>
      <ToggleSalidas />
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver al menú</h1>
      </Link>
      {!tipoSalida ? (
        <>
          <h2 className="text-black font-semibold text-center md:text-xl my-10">
            Selecciona una opción
          </h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            <button
              onClick={() => setTipoSalida("aereo")}
              className="relative overflow-hidden rounded-xl shadow-md shadow-black/30 size-80 md:size-100">
              <img
                src="/salida-aereo.png"
                alt="Salidas en aéreo"
                className="w-full h-full size-40 object-cover"
              />
              <div className="absolute inset-0 bg-primary/40" />
              <h3 className="absolute top-1/2 left-1/2 -translate-x-1/2 md:text-nowrap md:text-3xl -translate-y-1/2 text-white text-2xl font-bold italic drop-shadow-lg">
                SALIDAS EN AÉREO
              </h3>
            </button>
            <button
              onClick={() => setTipoSalida("bus")}
              className="relative overflow-hidden rounded-xl shadow-md shadow-black/30 size-80 md:size-100">
              <img
                src="/salida-bus.png"
                alt="Salidas en bus"
                className="w-full h-full size-40 object-cover"
              />
              <div className="absolute inset-0 bg-primary/40" />
              <h3 className="absolute top-1/2 left-1/2 -translate-x-1/2 md:text-nowrap md:text-3xl -translate-y-1/2 text-white text-2xl font-bold italic drop-shadow-lg">
                SALIDAS EN BUS
              </h3>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 my-5">
            <button
              onClick={() => setTipoSalida(null)}
              className="text-primary text-sm font-medium underline">
              ← Cambiar tipo
            </button>
            <span className="text-black text-sm font-medium">
              {tipoSalida === "aereo" ? "Aéreo" : "Bus"}
            </span>
          </div>
          <h2 className="text-black font-semibold mb-5 text-center md:text-xl">Filtros</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-5 max-w-3xl md:justify-start items-start mx-auto">
            <select
              className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
              name="destino"
              id="destino"
              onChange={handleChange}>
              <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
                Destino
              </option>
              <option className="bg-[#f1f1f1]" value="Termas de Rio Hondo">
                Termas de Rio Hondo
              </option>
            </select>
            <select
              className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
              name="empresa"
              id="empresa"
              onChange={handleChange}>
              <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
                Empresa de transporte
              </option>
              <option className="bg-[#f1f1f1]" value="Termas de Rio Hondo">
                Termas de Rio Hondo
              </option>
            </select>
            <select
              className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
              name="rango"
              id="rango"
              onChange={handleChange}>
              <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
                Rango de fechas (Desde - Hasta)
              </option>
              <option className="bg-[#f1f1f1]" value="22/06/2025 - 22/06/2025">
                22/06/2025 - 22/06/2025
              </option>
            </select>
            <select
              className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
              name="periodo"
              id="periodo"
              onChange={handleChange}>
              <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
                Periodo
              </option>
              <option className="bg-[#f1f1f1]" value="22/06/2025 - 22/06/2025">
                22/06/2025 - 22/06/2025
              </option>
            </select>
            <ToggleActiveFilters />
            <button className="w-full bg-primary cursor-pointer text-white font-medium text-center py-2 rounded-xl">
              Buscar
            </button>
          </form>
        </>
      )}
    </Container>
  );
}
