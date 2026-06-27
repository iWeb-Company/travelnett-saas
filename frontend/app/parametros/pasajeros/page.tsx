"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Passengers } from "@/app/types";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader } from "@/app/components/Loader";

export default function PasajerosPage() {
  const { user } = useAuth();
  const r = useRouter();
  const [loading, setLoading] = useState(true);
  const [passengers, setPassengers] = useState<Passengers[]>([]);
  const [filteredPassengers, setFilteredPassengers] = useState<Passengers[]>([]);

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

  const getPassengers = async () => {
    try {
      const data = await apiClient.getParameters("get_passengers", user?.iweb_client_id);
      setPassengers(data);
    } catch (error) {
      console.error("Error fetching passengers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPassengers();
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearch(input);

    const filtered = passengers.filter((p: any) => {
      const matchNombre = !input.nombre || (p.name || "").toLowerCase().includes(input.nombre.toLowerCase());
      const matchApellido = !input.last_name || (p.last_name || "").toLowerCase().includes(input.last_name.toLowerCase());
      const matchDni = !input.dni || (String(p.dni) || "").includes(input.dni);
      // 'reserva' no está en el tipo base, pero lo incluimos por si viene del API
      const matchReserva = !input.reserva || (String(p.reserva || "")).toLowerCase().includes(input.reserva.toLowerCase());

      return matchNombre && matchApellido && matchDni && matchReserva;
    });

    setFilteredPassengers(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

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
      <div className="relative flex justify-center items-start gap-2">
        <h2 className="text-black items-center font-semibold text-center md:text-xl my-3">
          Pasajeros
        </h2>
        <div className="relative flex items-center group">
          {/* Signo de pregunta */}
          <small className="bg-primary rounded-full h-5 w-5 flex items-center justify-center text-white font-semibold cursor-pointer select-none">
            ?
          </small>

          {/* Tooltip - oculto por defecto, visible en hover */}
          <div
            className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-300
                  absolute left-1/2 -translate-x-1/2 top-full mt-2
                  w-50 spaccing-y-1 bg-primary text-white rounded-xl px-2 py-3
                   font-medium
                  flex flex-col items-center
                  whitespace-normal
                  z-50
                  drop-shadow-md"
          >
            <p className="text-sm">Que es esto?</p>
            <p className="text-xs">
              Usa los campos de busqueda para encontrar a tus pasajeros tanto por nombre, apellido, DNI o  N° de Reserva.
            </p>
          </div>
        </div>
      </div>
      <form
        onSubmit={handleSearch}
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
      {
        (search.nombre || search.last_name || search.dni || search.reserva) ? (
          <div className="flex flex-col justify-center mx-auto max-w-4xl items-end overflow-x-auto">
            <button onClick={() => setSearch({ nombre: "", last_name: "", dni: "", reserva: "", birstday: "" })} className="hover:underline text-black py-2 px-4 mt-3 font-semibold rounded-sm">
              Limpiar búsqueda
            </button>
            <table className="w-full mx-auto mt-6 border divide-x divide-white border-black rounded-lg overflow-hidden">
              <thead className="bg-black text-white">
                <tr>
                  <th className="px-4 py-2 text-left">DNI</th>
                  <th className="px-4 py-2 text-left">Reserva</th>
                  <th className="px-4 py-2 text-left">Nombre</th>
                  <th className="px-4 py-2 text-left">Apellido</th>
                  <th className="px-4 py-2 text-left">Fecha de nacimiento</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-black divide-x text-black bg-white">
                {filteredPassengers.length > 0 ? (
                  filteredPassengers.map((pasajero: any, index) => (
                    <tr key={pasajero.id || index}>
                      <td className="px-4 py-2 text-center">{pasajero.dni}</td>
                      <td className="px-4 py-2 text-center">{pasajero.reserva || "-"}</td>
                      <td className="px-4 py-2 text-center">{pasajero.name}</td>
                      <td className="px-4 py-2 text-center">{pasajero.last_name}</td>
                      <td className="px-4 py-2 text-center">{pasajero.date_of_birth}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No se encontraron pasajeros con esos criterios.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-6">
            Ingrese un criterio de búsqueda para ver resultados.
          </p>
        )
      }

      <div className="xl:flex hidden absolute md:right-40 md:top-60 mt-8 justify-end">
        <img src="/logo-grande.png" className="size-50" alt="Logo Empresa" />
      </div>
    </Container >
  );
}
