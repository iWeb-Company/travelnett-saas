'use client';

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";

function Paso2Content() {
  const searchParams = useSearchParams();
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<any[]>([]);

  // Query Parameters from step 1
  const destinoId = searchParams.get("destino") || "";
  const clienteId = searchParams.get("cliente") || "";
  const tipoReserva = searchParams.get("tipo") || "";
  const itemId = searchParams.get("item") || "";
  const itemType = searchParams.get("itemType") || "";

  // Form states
  const [hotel, setHotel] = useState("");
  const [tipoCama, setTipoCama] = useState("");
  const [tipoHabitacion, setTipoHabitacion] = useState("");

  const loadHotels = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const data = await apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []);
      setHotels(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar hoteles de la base de datos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadHotels();
    }
  }, [user?.iweb_client_id]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hotel || !tipoCama || !tipoHabitacion) {
      toast.error("Por favor, selecciona el hotel y la configuración de la habitación");
      return;
    }
    r.push(
      `/web/reservas/crear-reserva/paso-3?destino=${destinoId}&cliente=${clienteId}&tipo=${tipoReserva}&item=${itemId}&itemType=${itemType}&hotel=${hotel}&cama=${tipoCama}&habitacion=${tipoHabitacion}`
    );
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
      <Link className="flex items-center my-3 justify-start gap-2" href="/web/reservas/crear-reserva/paso-1">
        <ArrowLeft />
        <p className="text-primary font-semibold md:text-lg">Volver a Paquete / Salida</p>
      </Link>

      <h2 className="font-semibold text-black text-center mx-auto md:text-lg mt-5">
        Crear reserva
      </h2>

      <div className="max-w-2xl mx-auto w-full mt-5 flex flex-col items-center gap-5 text-black">
        {/* Step Tabs */}
        <div className="flex w-full rounded-xl bg-[#A8B8F0] overflow-hidden shadow-md shadow-black/20">
          <div className="flex-1 text-white text-center py-3 font-semibold text-sm md:text-base">
            1. Paquete / Salida
          </div>
          <div className="flex-1 bg-primary rounded-tr-4xl rounded-bl-4xl text-white text-center py-3 font-semibold text-sm md:text-base">
            2. Habitación
          </div>
          <div className="flex-1 bg-[#A8B8F0] text-white text-center py-3 font-semibold text-sm md:text-base">
            3. Datos
          </div>
        </div>

        {/* Current status summary */}
        <div className="flex flex-col gap-2 text-black items-start w-full font-semibold bg-gray-50 border border-gray-200 p-4 rounded-xl">
          <p className="text-sm"><span className="text-primary font-bold">{destinoId ? "Mar del Plata" : "General"} - Mio Turismo</span></p>
          <p className="text-sm"><span className="text-primary font-bold">25/06/2026 - MDQ</span></p>
          <p className="text-sm">Tipo: <span className="text-primary font-bold">{tipoReserva === "bloqueo" ? "Bloqueo Grupal" : "Reserva Tradicional"}</span></p>
          <p className="text-sm">Habitación 1</p>

        </div>

        {/* Form */}
        <form onSubmit={handleNext} className="flex flex-col w-full gap-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          {/* Hotel */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Hotel</label>
            <select
              className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona un Hotel</option>
              {hotels.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name || h.nombre}</option>
              ))}
            </select>
          </div>

          {/* Tipo de Cama */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Tipo de Cama</label>
            <select
              className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={tipoCama}
              onChange={(e) => setTipoCama(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona tipo de cama</option>
              <option value="matrimonial">Cama Matrimonial</option>
              <option value="individuales">Camas Individuales (Twin)</option>
              <option value="triple">Matrimonial + Individual</option>
            </select>
          </div>

          {/* Tipo de Habitación */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Tipo de Habitación</label>
            <select
              className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={tipoHabitacion}
              onChange={(e) => setTipoHabitacion(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona tipo de habitación</option>
              <option value="single">Single (SGL)</option>
              <option value="doble">Doble (DBL Mat / DBL Twin)</option>
              <option value="triple">Triple (TPL)</option>
              <option value="cuadruple">Cuádruple (CPL)</option>
            </select>
          </div>

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

export default function Paso2Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader /></div>}>
      <Paso2Content />
    </Suspense>
  );
}
