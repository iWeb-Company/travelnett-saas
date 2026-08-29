"use client";
import { useEffect, useState } from "react";
import ModalOptions from "./ModalOptions";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface PasajeroRowProps {
  id: string; // intermediate ID (rp.id)
  reserva_id: string; // reservation ID
  nombre: string;
  ascenso: string;
  lugar_carga_id?: string | null;
  butaca: string;
  telefono: string;
  reserva: string;
  cliente: string;
  edad: string;
  hotel: string;
  bus_number?: string | null;
  butaca_type?: string | null;
  isGroup?: boolean;
  observations?: string;
}

export default function PasajeroRow({
  pasajero,
  salidaCargasIds = [],
  salidaCargasNames = [],
  salidaId,
  onUpdated,
}: {
  pasajero: PasajeroRowProps;
  salidaCargasIds?: string[];
  salidaCargasNames?: string[];
  salidaId: string;
  onUpdated?: () => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [lugaresCarga, setLugaresCarga] = useState<any[]>([]);
  const [selectedLugarCarga, setSelectedLugarCarga] = useState(pasajero.lugar_carga_id || "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [busVal, setBusVal] = useState(pasajero.bus_number || "");

  useEffect(() => {
    setBusVal(pasajero.bus_number || "");
  }, [pasajero.bus_number]);

  const handleBusBlur = async () => {
    if (!user?.iweb_client_id || !pasajero.id) return;
    try {
      await apiClient.updateReservationPassenger(user.iweb_client_id, pasajero.id, {
        bus_number: busVal
      });
      toast.success("Número de bus actualizado");
      if (onUpdated) onUpdated();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar número de bus");
    }
  };

  const loadLugaresCarga = async () => {
    if (!user?.iweb_client_id) return;
    const data = await apiClient.getParameters("get_lugares_carga", user.iweb_client_id).catch(() => []);
    setLugaresCarga(data);
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadLugaresCarga();
    }
  }, [user?.iweb_client_id]);

  useEffect(() => {
    setSelectedLugarCarga(pasajero.lugar_carga_id || "");
  }, [pasajero.lugar_carga_id]);

  const handleConfirm = async () => {
    if (!user?.iweb_client_id || (!pasajero.id && !pasajero.reserva_id)) return;
    setIsUpdating(true);
    try {
      const promises = [];
      if (pasajero.id) {
        promises.push(
          apiClient.updateReservationPassenger(user.iweb_client_id, pasajero.id, {
            lugar_carga_id: selectedLugarCarga || null,
          }).catch(() => null)
        );
      }
      if (pasajero.isGroup && pasajero.reserva_id) {
        promises.push(
          apiClient.updateReserva(user.iweb_client_id, pasajero.reserva_id, {
            lugar_carga_id: selectedLugarCarga || null,
          }).catch(() => null)
        );
      }
      await Promise.all(promises);
      toast.success("Lugar de ascenso actualizado");
      setIsOpenModal(false);
      if (onUpdated) {
        onUpdated();
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar lugar de ascenso");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full flex flex-col justify-center">
      {/* Fila principal */}
      <div className="w-full flex items-center gap-2">
        {/* Left 'Bus' Box */}
        <input
          type="text"
          value={busVal}
          onChange={(e) => setBusVal(e.target.value)}
          onBlur={handleBusBlur}
          className="w-14 h-9 bg-[#D9DFF5]/70 border border-[#3DADFF] rounded-md flex items-center justify-center text-center text-xs font-semibold text-black cursor-pointer hover:bg-blue-100 transition-colors focus:outline-none"
        />


        {/* Right Columns Container */}
        <div className="flex-1 h-9 bg-[#D9DFF5]/40 border border-[#3DADFF] rounded-md flex items-center justify-between px-3 text-xs font-semibold text-black">
          <span className="flex-1 text-left md:truncate pr-2" title={pasajero.nombre}>
            {pasajero.nombre}
          </span>
          <span className="text-black/35 font-normal md:inline hidden px-1">|</span>
          <Link
            href={pasajero.reserva_id ? `/web/reservas/modificar-reserva/${pasajero.reserva_id}` : '#'}
            className="w-20 md:block hidden text-center truncate text-primary hover:underline cursor-pointer font-bold"
            title={`Modificar reserva ${pasajero.reserva}`}
          >
            {pasajero.reserva}
          </Link>
          <span className="text-black/35 font-normal md:inline hidden px-1">|</span>
          <span className="w-24 md:block hidden text-center truncate" title={pasajero.cliente}>
            {pasajero.cliente}
          </span>
          <span className="text-black/35 font-normal px-1">|</span>
          <span className="w-16 md:w-32 text-center md:truncate cursor-pointer" onClick={() => setIsOpenModal(true)} title={pasajero.ascenso}>
            {pasajero.ascenso}
          </span>
          <span className="text-black/35 font-normal md:inline hidden px-1">|</span>
          <span className="w-16 md:w-32 md:block hidden text-center truncate" title={pasajero.hotel}>
            {pasajero.hotel}
          </span>
          <span className="text-black/35 font-normal md:inline hidden px-1">|</span>
          <span className="w-12 md:block hidden text-center truncate" title={pasajero.edad}>
            {pasajero.edad}
          </span>
          <span className="text-black/35 font-normal md:inline hidden px-1">|</span>
          <span className="w-28 md:block hidden text-center truncate" title={pasajero.telefono}>
            {pasajero.telefono}
          </span>
          <span className="text-black/35 font-normal px-1">|</span>
          <span className="md:w-24 w-12 text-center md:truncate" title={pasajero.butaca}>
            {pasajero.butaca_type === 'cama' ? 'Cama' : 'Semicama'}
          </span>
          <span className="text-black/35 font-normal px-1">|</span>
          <span
            className="w-16 md:block hidden text-center truncate text-[10px] text-gray-500"
            title={pasajero.observations || ""}
          >
            {pasajero.observations || "—"}
          </span>
          <span className="text-black/35 font-normal px-1">|</span>
          <span
            className="md:w-16 flex justify-center items-center cursor-pointer text-center hover:opacity-75"
            onClick={() => router.push(`/voucher/${pasajero.reserva_id}`)}
          >
            📄
          </span>
        </div>
      </div>

      {/* Expanded Detail Row */}
      {isOpenModal && (
        <ModalOptions
          isOpen={isOpenModal}
          onCancel={() => setIsOpenModal(false)}
          onConfirmed={handleConfirm}
        >
          <small className="text-white text-center">Las opciones remarcadas son los lugares de carga que la salida tiene precargada.</small>
          <small className="text-white text-center">Si necesitas un lugar de carga para el pasajero no precargado en la salida, agregalo <Link className="cursor-pointer underline" href={`/salidas/agregar-salida?id=${salidaId}`}>Acá</Link>.</small>
          <div className="space-y-2">
            {lugaresCarga.map((option) => {
              const optName = (option.name || option.nombre || "").toLowerCase();
              const isCargaSalida =
                salidaCargasIds.includes(option.id) ||
                (optName && salidaCargasNames.includes(optName));

              return (
                <div key={option.id} className="flex items-center justify-between gap-3 p-1 rounded-lg transition-colors">
                  <label
                    htmlFor={option.id}
                    className={`text-lg cursor-pointer flex items-center gap-2 flex-wrap ${isCargaSalida
                      ? "text-yellow-300 font-bold"
                      : "text-white font-medium"
                      }`}
                  >
                    <span>{option.name || option.nombre} - {option.address || option.direccion || "Sin dirección especificada"}</span>
                    {isCargaSalida && (
                      <span className="text-xs font-bold text-yellow-200 bg-yellow-500/25 border border-yellow-300/50 px-2 py-0.5 rounded-full">
                        (Lugar de carga precargado)
                      </span>
                    )}
                  </label>
                  <input
                    className="w-5 h-5 cursor-pointer accent-yellow-400"
                    type="radio"
                    name={`lugares_carga_${pasajero.id}`}
                    id={option.id}
                    checked={selectedLugarCarga === option.id}
                    onChange={() => setSelectedLugarCarga(option.id)}
                  />
                </div>
              );
            })}
          </div>
        </ModalOptions>
      )}
    </div>
  );
}
