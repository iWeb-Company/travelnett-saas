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
import AddVioleta from "@/app/components/icons/AddVioleta";

function Paso2Content() {
  const searchParams = useSearchParams();
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<any[]>([]);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [salidaInfo, setSalidaInfo] = useState<any>(null);
  const [paqueteInfo, setPaqueteInfo] = useState<any>(null);

  // Query Parameters from step 1
  const destinoId = searchParams.get("destino") || "";
  const clienteId = searchParams.get("cliente") || "";
  const tipoReserva = searchParams.get("tipo") || "";
  const itemId = searchParams.get("item") || "";
  const itemType = searchParams.get("itemType") || "";
  const salidaId = searchParams.get("salida") || "";
  const paqueteId = searchParams.get("paquete") || "";

  // Rooms state (supports multiple rooms)
  const [rooms, setRooms] = useState<Array<{
    hotel: string;
    tipoCama: string;
    distribucion: string;
    tipoHabitacion: string;
  }>>([
    { hotel: "", tipoCama: "", distribucion: "", tipoHabitacion: "" }
  ]);

  const loadData = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [hotelsData, destData, clientData] = await Promise.all([
        apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_clients", user.iweb_client_id).catch(() => [])
      ]);
      setHotels(hotelsData || []);
      setDestinos(destData || []);
      setClientes(clientData || []);

      const actualSalidaId = salidaId || (itemType === "salida" ? itemId : "");
      const actualPaqueteId = paqueteId || (itemType === "paquete" ? itemId : "");

      if (actualSalidaId) {
        const sal = await apiClient.getSalida(user.iweb_client_id, actualSalidaId).catch(() => null);
        setSalidaInfo(sal);
      }
      if (actualPaqueteId) {
        const pack = await apiClient.getPackage(user.iweb_client_id, actualPaqueteId).catch(() => null);
        setPaqueteInfo(pack);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos del paso 2");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadData();
    }
  }, [user?.iweb_client_id]);

  const handleRoomChange = (index: number, field: string, value: string) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: value };
    setRooms(updated);
  };

  const handleAddRoom = () => {
    setRooms([...rooms, { hotel: "", tipoCama: "", distribucion: "", tipoHabitacion: "" }]);
  };

  const handleRemoveRoom = (index: number) => {
    if (rooms.length === 1) return;
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < rooms.length; i++) {
      const rm = rooms[i];
      if (!rm.hotel || !rm.tipoCama || !rm.tipoHabitacion) {
        toast.error(`Por favor, completa la configuración de la Habitación ${i + 1}`);
        return;
      }
    }

    const roomsParam = encodeURIComponent(JSON.stringify(rooms));
    r.push(
      `/web/reservas/crear-reserva/paso-3?destino=${destinoId}&cliente=${clienteId}&tipo=${tipoReserva}&item=${itemId}&itemType=${itemType}&salida=${salidaId}&paquete=${paqueteId}&rooms=${roomsParam}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  // Status summary labels & destination matching
  const destinoObj = destinos.find((d) => d.id === destinoId || d.name === destinoId || d.nombre === destinoId);
  const destinoNombre = destinoObj?.name || destinoObj?.nombre || (destinoId ? destinoId : "General");
  const clienteObj = clientes.find((c) => c.id === clienteId);
  const clienteNombre = clienteObj?.complete_name || clienteObj?.name_system || (clienteId === "as" ? "En Espera" : "Cliente");
  const fechaSalidaText = salidaInfo?.date_of_out || paqueteInfo?.name || "Fecha a confirmar";
  const siglaText = destinoObj?.sigla || "DEST";

  // Filter hotels:
  //   - If a package is selected → only show hotels configured in that package
  //   - Otherwise → filter by destination
  const filteredHotels = (() => {
    if (paqueteInfo && paqueteInfo.hotels && paqueteInfo.hotels.length > 0) {
      const packageHotelIds = new Set(paqueteInfo.hotels.map((ph: any) => ph.hotel_id).filter(Boolean));
      return hotels.filter((h) => packageHotelIds.has(h.id));
    }
    if (!destinoId) return hotels;
    return hotels.filter((h) => {
      if (!h.destino) return false;
      const hDest = String(h.destino).trim().toLowerCase();
      const targetId = String(destinoId).trim().toLowerCase();
      const targetName = String(destinoNombre).trim().toLowerCase();
      return hDest === targetId || hDest === targetName;
    });
  })();

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

      <div className="max-w-2xl mx-auto w-full mt-5 flex flex-col items-center gap-2 text-black">
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
        <div className="flex flex-col gap-2 text-black items-start w-full font-semibold p-4 rounded-xl ">
          <p className="text-base font-bold text-primary">{destinoNombre} - {clienteNombre}</p>
          <p className="text-sm font-medium text-gray-700">{fechaSalidaText} - {siglaText}</p>

        </div>

        {/* Form */}
        <form onSubmit={handleNext} className="flex flex-col w-full gap-8">
          {rooms.map((rm, idx) => (
            <div key={idx} className="flex flex-col gap-4 p-5 rounded-xl  relative">
              <div className="flex items-center justify-between border-b pb-2 border-gray-200">
                <h3 className="font-bold text-lg text-primary">Habitación {idx + 1}</h3>
                {rooms.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRoom(idx)}
                    className="text-red-500 hover:text-red-700 font-bold text-sm"
                  >
                    Eliminar habitación
                  </button>
                )}
              </div>

              {/* Hotel */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Hotel</label>
                <select
                  className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={rm.hotel}
                  onChange={(e) => handleRoomChange(idx, "hotel", e.target.value)}
                  required
                >
                  <option value="" disabled>Selecciona un Hotel</option>
                  {filteredHotels.map((h: any) => (
                    <option key={h.id} value={h.id}>{h.name || h.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Tipo de Cama (primero) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Tipo de Cama</label>
                <select
                  className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={rm.tipoCama}
                  onChange={(e) => handleRoomChange(idx, "tipoCama", e.target.value)}
                  required
                >
                  <option value="" disabled>Tipo de cama</option>
                  <option value="individual">Single (Individual)</option>
                  <option value="doble">Doble</option>
                  <option value="triple">Triple</option>
                  <option value="cuadruple">Cuádruple</option>
                  <option value="depto_x5">Depto X5</option>
                </select>
              </div>

              {/* Distribución (segundo) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Distribución</label>
                <select
                  className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={rm.distribucion}
                  onChange={(e) => handleRoomChange(idx, "distribucion", e.target.value)}
                >
                  <option value="" disabled>Distribución</option>
                  <option value="individual">Twin (Individual)</option>
                  <option value="matrimonial">Mat (Matrimonial)</option>
                </select>
              </div>

              {/* Tipo de Habitación (tercero) */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Tipo de Habitación</label>
                <select
                  className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={rm.tipoHabitacion}
                  onChange={(e) => handleRoomChange(idx, "tipoHabitacion", e.target.value)}
                  required
                >
                  <option value="" disabled>Tipo de Habitación</option>
                  <option value="estandar">Estándar (STD)</option>
                  <option value="superior">Superior</option>
                  <option value="suite">Suite</option>
                </select>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-end w-full">
            <button
              type="button"
              onClick={handleAddRoom}
              className="flex items-center gap-2 text-primary font-semibold hover:opacity-85 cursor-pointer "
            >
              <AddVioleta color="#0546f7" />
            </button>
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
