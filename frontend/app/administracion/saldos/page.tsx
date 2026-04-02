"use client";
import Link from "next/link";
import Container from "@/app/components/Container";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CuentasCorrientesPage() {
  const r = useRouter();
  const [searched, setSearched] = useState(false);

  const movimientos = [
    {
      fecha: "01/06/25",
      reserva: "MDQ #1",
      detalle: "DEMARCO VALENTÍN x2 MAT",
      neto: 100000,
      cobros: 150000,
      saldo: -50000,
    },
    {
      fecha: "02/06/25",
      reserva: "MDQ #1",
      detalle: "DEMARCO VALENTÍN x2 MAT",
      neto: 100000,
      cobros: 150000,
      saldo: 100000,
    },
    {
      fecha: "03/06/25",
      reserva: "MDQ #1",
      detalle: "DEMARCO VALENTÍN x2 MAT",
      neto: 100000,
      cobros: 150000,
      saldo: 100000,
    },
    {
      fecha: "04/06/25",
      reserva: "MDQ #1",
      detalle: "DEMARCO VALENTÍN x2 MAT",
      neto: 100000,
      cobros: 150000,
      saldo: 100000,
    },
    {
      fecha: "05/06/25",
      reserva: "MDQ #1",
      detalle: "DEMARCO VALENTÍN x2 MAT",
      neto: 100000,
      cobros: 150000,
      saldo: 100000,
    },
    {
      fecha: "06/06/25",
      reserva: "MDQ #1",
      detalle: "DEMARCO VALENTÍN x2 MAT",
      neto: 100000,
      cobros: 150000,
      saldo: 100000,
    },
  ];

  const formatMonto = (monto: number) => {
    const prefix = monto < 0 ? "-" : "";
    return `${prefix}$${Math.abs(monto).toLocaleString("es-AR")}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const handleClear = () => {
    setSearched(false);
  };

  return (
    <Container>
      <ToggleSalidas />
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={() => r.push("/administracion")}
        className="flex items-center my-3 justify-start gap-3">
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>
      <h3 className="text-center font-semibold text-lg text-black">
        Consulta de Saldos
      </h3>
      <section className="my-5 flex flex-col max-w-2xl mx-auto">
        <form
          onSubmit={handleSearch}
          className="flex flex-col text-black w-full gap-5">
          <select
            className="border py-2 px-5 bg-white border-black text-black/70 rounded-md"
            defaultValue="">
            <option value="">Cliente</option>
            <option value="">Cliente 1</option>
            <option value="">Cliente 2</option>
            <option value="">Cliente 3</option>
          </select>
          <button
            className="bg-primary shadow-md shadow-black/50 text-white rounded-md px-4 py-2"
            type="submit">
            Buscar
          </button>
        </form>

        {/* Resultados */}
        {searched && (
          <div className="flex flex-col text-black mt-2">
            {/* Limpiar búsqueda */}
            <div className="flex justify-end mb-3">
              <button
                onClick={handleClear}
                className="text-xs md:text-sm my-2 text-black font-medium hover:underline">
                Limpiar búsqueda
              </button>
            </div>

            {/* Tabla de movimientos */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm overflow-x-scroll md:text-base border border-black">
                <thead>
                  <tr className="font-bold bg-black divide-x divide-white text-white">
                    <th className="py-2 px-3 text-left">Fecha IN</th>
                    <th className="py-2 px-3 text-left">Reserva</th>
                    <th className="py-2 px-3 text-left">Detalle</th>
                    <th className="py-2 px-3 text-right">Neto</th>
                    <th className="py-2 px-3 text-right">Cobros</th>
                    <th className="py-2 px-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((mov, i) => (
                    <tr
                      key={i}
                      className="border-b divide-x divide-black border-black font-medium">
                      <td className="py-2 px-3">{mov.fecha}</td>
                      <td className="py-2 px-3">{mov.reserva}</td>
                      <td className="py-2 px-3">{mov.detalle}</td>
                      <td className="py-2 px-3">${mov.neto}</td>
                      <td className="py-2 px-3">${mov.cobros}</td>
                      <td className="py-2 px-3">${mov.saldo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </Container>
  );
}
