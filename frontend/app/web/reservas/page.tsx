"use client";
import Link from "next/link";
import Container from "@/app/components/Container";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleActiveFilters from "@/app/components/ToggleActiveFilters";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReservasPage() {
  const router = useRouter();
  const [data, setData] = useState({
    numero: "",
    cliente: "",
    rango: "",
    periodo: "",
    paquete: "",
  });
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(
      `/web/reservas/result?numero=${data.numero}&cliente=${data.cliente}&rango=${data.rango}&periodo=${data.periodo}&paquete=${data.paquete}`,
    );
  };
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };
  return (
    <Container>
      <ToggleSalidas />
      <section className="flex flex-col gap-5 justify-between">
        <Link
          href={"/dashboard"}
          className="flex items-center justify-start gap-3">
          <ArrowLeft />
          <h1 className="font-bold">Volver al menú</h1>
        </Link>
        <h2 className="text-black font-semibold mb-5 text-center md:text-xl">
          Filtros
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 md:gap-5 w-full max-w-3xl md:justify-start items-start mx-auto">
          <input
            type="text"
            className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
            name="numero"
            id="numero"
            onChange={(e) => setData({ ...data, numero: e.target.value })}
            placeholder="Número"
          />
          <select
            className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
            name="cliente"
            id="cliente"
            onChange={handleChange}>
            <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
              Cliente
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
          <select
            className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
            name="paquete"
            id="paquete"
            onChange={handleChange}>
            <option hidden className="text-gray-200 bg-[#f1f1f1]" value="">
              Paquete
            </option>
            <option className="bg-[#f1f1f1]" value="Termas de Rio Hondo">
              Termas de Rio Hondo
            </option>
          </select>
          <ToggleActiveFilters />
          <button className="w-full bg-primary cursor-pointer text-white font-medium text-center py-2 rounded-xl">
            Buscar
          </button>
        </form>
      </section>
    </Container>
  );
}
