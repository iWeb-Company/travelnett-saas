"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
export default function PasajerosPage() {
  const r = useRouter();
  const [input, setInput] = useState({
    nombre: "",
    last_name: "",
    dni: "",
    reserva: "",
    birstday: "",
  });

  const [search, setSearch] = useState({
    nombre: "",
    last_name: "",
    dni: "",
    reserva: "",
    birstday: "",
  });

  const pasajeros = [
    {
      id: 1,
      nombre: "Pablo",
      last_name: "Perez",
      dni: "123456789",
      reserva: "Reserva 1",
      birstday: "01/01/1990",
    },
    {
      id: 2,
      nombre: "Pablo",
      last_name: "Perez",
      dni: "123456789",
      reserva: "Reserva 2",
      birstday: "01/01/1990",
    },
    {
      id: 3,
      nombre: "Pablo",
      last_name: "Perez",
      dni: "123456789",
      reserva: "Reserva 3",
      birstday: "01/01/1990",
    },
    {
      id: 4,
      nombre: "Pablo",
      last_name: "Perez",
      dni: "123456789",
      reserva: "Reserva 4",
      birstday: "01/01/1990",
    },
    {
      id: 5,
      nombre: "Pablo",
      last_name: "Perez",
      dni: "123456789",
      reserva: "Reserva 5",
      birstday: "01/01/1990",
    },
  ];

  const onClick = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch(input);
    console.log(input);
  };

  return (
    <Container>
      <ToggleSalidas />
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={() => r.push("/parametros")}
        className="flex items-center my-3 justify-start gap-3">
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>
      <h2 className="text-black font-semibold text-center md:text-xl my-6">
        Pasajeros
      </h2>
      <form
        onSubmit={onClick}
        className="w-full max-w-xl mx-auto flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nombre"
          value={input.nombre}
          onChange={(e) => setInput({ ...input, nombre: e.target.value })}
          className="w-full border bg-white border-gray-300 rounded-sm p-2 pl-4 text-black/60 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Apellido"
          value={input.last_name}
          onChange={(e) => setInput({ ...input, last_name: e.target.value })}
          className="w-full border bg-white border-gray-300 rounded-sm p-2 pl-4 text-black/60 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="DNI"
          value={input.dni}
          onChange={(e) => setInput({ ...input, dni: e.target.value })}
          className="w-full border bg-white border-gray-300 rounded-sm p-2 pl-4 text-black/60 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <input
          type="text"
          placeholder="Reserva"
          value={input.reserva}
          onChange={(e) => setInput({ ...input, reserva: e.target.value })}
          className="w-full border bg-white border-gray-300 rounded-sm p-2 pl-4 text-black/60 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button className="bg-primary text-white py-2 font-semibold rounded-sm">
          Buscar
        </button>
      </form>

      {/* RESULTADOS */}
      {search.nombre || search.last_name || search.dni || search.reserva ? (
        <table className="w-full max-w-3xl mx-auto mt-6 border divide-x overflow-x-scroll divide-white border-black rounded-lg overflow-hidden">
          <thead className="bg-black text-white">
            <tr>
              <th className="px-4 py-2 text-left">DNI</th>
              <th className="px-4 py-2 text-left">Reserva</th>
              <th className="px-4 py-2 text-left">Nombre</th>
              <th className="px-4 py-2 text-left">Apellido</th>
              <th className="px-4 py-2 text-left">Fecha de nacimiento</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black divide-x text-black">
            {pasajeros.map((pasajero, index) => (
              <tr key={index}>
                <td className="px-4 py-2 text-center">{pasajero.dni}</td>
                <td className="px-4 py-2 text-center">{pasajero.reserva}</td>
                <td className="px-4 py-2 text-center">{pasajero.nombre}</td>
                <td className="px-4 py-2 text-center">{pasajero.last_name}</td>
                <td className="px-4 py-2 text-center">{pasajero.birstday}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-center text-gray-500 mt-6">
          Ingrese un criterio de búsqueda para ver resultados.
        </p>
      )}

      <div className="xl:flex hidden absolute md:right-40 md:top-60 mt-8 justify-end">
        <img src="/logo-grande.png" className="size-50" alt="Logo Empresa" />
      </div>
    </Container>
  );
}
