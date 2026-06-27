'use client';

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";

export default function Paso1Page() {
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  // Form states
  const [destino, setDestino] = useState("");
  const [cliente, setCliente] = useState("");
  const [tipoReserva, setTipoReserva] = useState<"tradicional" | "bloqueo">("tradicional");
  const [seleccionadoId, setSeleccionadoId] = useState("");
  const [seleccionadoTipo, setSeleccionadoTipo] = useState<"salida" | "paquete" | "">("");

  const loadData = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [destData, clientData] = await Promise.all([
        apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_clients", user.iweb_client_id).catch(() => [])
      ]);
      setDestinos(destData);
      setClientes(clientData);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar destinos y clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadData();
    }
  }, [user?.iweb_client_id]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destino || !cliente || (tipoReserva === "tradicional" && !seleccionadoId)) {
      toast.error("Por favor, completa todos los campos del paso 1");
      return;
    }
    // Navigate to step 2 passing values in query params
    r.push(`/web/reservas/crear-reserva/paso-2?destino=${destino}&cliente=${cliente}&tipo=${tipoReserva}&item=${seleccionadoId}&itemType=${seleccionadoTipo}`);
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
        <h1 className="font-bold md:text-xl">Volver al menú</h1>
      </Link>
      <Link className="flex items-center my-3 justify-start gap-2" href="/web/reservas">
        <ArrowLeft color="#6005F7" />
        <p className="text-secondary font-semibold md:text-lg">Volver a Reservas</p>
      </Link>

      <h2 className="font-semibold text-black text-center mx-auto md:text-lg mt-5">
        Crear reserva
      </h2>

      <div className="max-w-2xl mx-auto w-full mt-5 flex flex-col items-center gap-5 text-black">
        {/* Step Tabs */}
        <div className="flex w-full rounded-2xl bg-[#A8B8F0] overflow-hidden shadow-md shadow-black/20">
          <div className="flex-1 bg-primary rounded-tr-4xl text-white text-center py-3 font-semibold text-sm md:text-base">
            1. Paquete / Salida
          </div>
          <div className="flex-1 bg-[#A8B8F0] text-white text-center py-3 font-semibold text-sm md:text-base">
            2. Habitación
          </div>
          <div className="flex-1 bg-[#A8B8F0] text-white text-center py-3 font-semibold text-sm md:text-base">
            3. Datos
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleNext} className="flex flex-col w-full gap-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          {/* Destino */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Destino</label>
            <select
              className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              required
            >
              <option value="" disabled>Destino</option>
              {destinos.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name || d.nombre}</option>
              ))}
            </select>
          </div>

          {/* Cliente */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Cliente (Agencia/Empresa)</label>
            <select
              className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              required
            >
              <option value="" disabled>Cliente</option>
              <option value="as">En Espera</option>
              {clientes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name || c.nombre || c.username}</option>
              ))}
            </select>
          </div>

          {/* Tipo de reserva */}
          <div className="flex flex-col gap-1.5 mt-1">
            <label className="text-xs font-bold text-gray-700">Tipo de Reserva</label>
            <div className="flex items-center gap-8 mt-1">
              <label className="flex items-center gap-2 cursor-pointer text-black font-semibold">
                <input
                  type="radio"
                  name="tipoReserva"
                  value="tradicional"
                  checked={tipoReserva === "tradicional"}
                  onChange={() => { setTipoReserva("tradicional"); setSeleccionadoId(""); setSeleccionadoTipo(""); }}
                  className="w-5 h-5 accent-primary"
                />
                Reserva tradicional
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-black font-semibold">
                <input
                  type="radio"
                  name="tipoReserva"
                  value="bloqueo"
                  checked={tipoReserva === "bloqueo"}
                  onChange={() => { setTipoReserva("bloqueo"); setSeleccionadoId("bloqueo-general"); setSeleccionadoTipo("salida"); }}
                  className="w-5 h-5 accent-primary"
                />
                Bloqueo/Grupo
              </label>
            </div>
          </div>

          {/* Seleccionar salida / paquete */}
          {tipoReserva === "tradicional" && (
            <div className="flex flex-col gap-3 border-gray-100 pt-3">
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={() => { setSeleccionadoId("salida-mock-id"); setSeleccionadoTipo("salida"); }}
                  className={`flex-1 py-2 px-4 text-start rounded-lg text-sm font-semibold transition-all"
                    }`}
                >
                  + Seleccionar Salida
                </button>
                <button
                  type="button"
                  onClick={() => { setSeleccionadoId("paquete-mock-id"); setSeleccionadoTipo("paquete"); }}
                  className={`flex-1 py-2 px-4 text-start rounded-lg text-sm font-semibold transition-all "
                    }`}
                >
                  + Seleccionar Paquete
                </button>
              </div>

              {seleccionadoId && (
                <div className="bg-green-50 border border-green-200 text-green-800 text-xs rounded-lg p-3 font-semibold">
                  ✓ Seleccionado: {seleccionadoTipo === "salida" ? "Salida Grupal Especial (Bus/Aéreo)" : "Paquete Vacacional Todo Incluido"}
                </div>
              )}
            </div>
          )}

          {/* Continuar */}
          <button
            type="submit"
            className="w-full bg-primary text-white text-center font-semibold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer mt-3"
          >
            Continuar
          </button>
        </form>
      </div>
    </Container>
  );
}
