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
      descripcion: "DEMARCO VALENTÍN x2 MAT",
      saldo: -50000,
    },
    {
      fecha: "02/06/25",
      reserva: "MDQ #1",
      descripcion: "DEMARCO VALENTÍN x2 MAT",
      saldo: 100000,
    },
    {
      fecha: "03/06/25",
      reserva: "MDQ #1",
      descripcion: "DEMARCO VALENTÍN x2 MAT",
      saldo: 100000,
    },
    {
      fecha: "04/06/25",
      reserva: "MDQ #1",
      descripcion: "DEMARCO VALENTÍN x2 MAT",
      saldo: 100000,
    },
    {
      fecha: "05/06/25",
      reserva: "MDQ #1",
      descripcion: "DEMARCO VALENTÍN x2 MAT",
      saldo: 100000,
    },
    {
      fecha: "06/06/25",
      reserva: "MDQ #1",
      descripcion: "DEMARCO VALENTÍN x2 MAT",
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
        Cuentas corrientes de Clientes
      </h3>
      <section className="my-5 flex flex-col max-w-2xl mx-auto">
        <form
          onSubmit={handleSearch}
          className="flex flex-col text-black w-full gap-5">
          <p className="text-center text-black font-medium">
            Fecha de creación
          </p>
          <div className="flex items-center justify-between md:flex-row flex-col gap-3 md:gap-5">
            <label className="underline" htmlFor="fecha-creacion-desde">
              Desde
            </label>
            <input
              className="border border-black bg-white text-black/70 px-5 py-1 rounded-sm"
              type="date"
            />
            <label className="underline" htmlFor="fecha-creacion-hasta">
              Hasta
            </label>
            <input
              className="border border-black bg-white text-black/70 px-5 py-1 rounded-sm"
              type="date"
            />
          </div>
          <p className="text-center text-black font-medium">Fecha de IN</p>
          <div className="flex items-center justify-between md:flex-row flex-col gap-3 md:gap-5">
            <label className="underline" htmlFor="fecha-in-desde">
              Desde
            </label>
            <input
              className="border border-black bg-white text-black/70 px-5 py-1 rounded-sm"
              type="date"
            />
            <label className="underline" htmlFor="fecha-in-hasta">
              Hasta
            </label>
            <input
              className="border border-black bg-white text-black/70 px-5 py-1 rounded-sm"
              type="date"
            />
          </div>
          <select
            className="border py-2 px-5 border-black text-black/70 rounded-md"
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
              <table className="w-full text-sm md:text-base border border-black">
                <thead>
                  <tr className="font-bold bg-black divide-x divide-white text-white">
                    <th className="py-2 px-3 text-left">Fecha</th>
                    <th className="py-2 px-3 text-left">Reserva</th>
                    <th className="py-2 px-3 text-left">Descripción</th>
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
                      <td className="py-2 px-3">{mov.descripcion}</td>
                      <td
                        className={`py-2 px-3 text-right font-bold ${
                          mov.saldo < 0 ? "text-red-500" : "text-black"
                        }`}>
                        {formatMonto(mov.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Exportar */}
            <div className="flex justify-center items-center gap-2 mt-4">
              <Excel />
              <span className="text-sm font-medium">Exportar</span>
            </div>

            {/* Separador */}
            <hr className="border-black/30 my-4" />

            {/* Resumen de la Cuenta Corriente */}
            <h4 className="text-center font-bold text-primary text-base md:text-lg underline mb-3">
              Resumen de la Cuenta Corriente
            </h4>
            <div className="text-sm md:text-base">
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">Total de consumos</span>
                <span className="font-bold">$3.600.000</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium">Total de pagos</span>
                <span className="font-bold text-red-500">$500.000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Saldo</span>
                <span className="font-bold text-secondary ">$3.100.000</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </Container>
  );
}
