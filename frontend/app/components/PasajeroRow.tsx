"use client";
import { useEffect, useState } from "react";
import ModalOptions from "./ModalOptions";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

interface PasajeroRowProps {
  id: string;
  nombre: string;
  ascenso: string;
  lugar_carga_id?: string | null;
  butaca: string;
  telefono: string;
  reserva: string;
  cliente: string;
  edad: string;
  hotel: string;
}

export default function PasajeroRow({
  pasajero,
  onUpdated,
}: {
  pasajero: PasajeroRowProps;
  onUpdated?: () => void;
}) {
  const { user } = useAuth();
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [lugaresCarga, setLugaresCarga] = useState<any[]>([]);
  const [selectedLugarCarga, setSelectedLugarCarga] = useState(pasajero.lugar_carga_id || "");
  const [isUpdating, setIsUpdating] = useState(false);

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
    if (!user?.iweb_client_id || !pasajero.id) return;
    setIsUpdating(true);
    try {
      await apiClient.updateReserva(user.iweb_client_id, pasajero.id, {
        lugar_carga_id: selectedLugarCarga || null,
      });
      setIsOpenModal(false);
      if (onUpdated) {
        onUpdated();
      }
    } catch (error) {
      console.error(error);
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
          className="w-14 h-9 bg-[#D9DFF5]/70 border border-[#3DADFF] rounded-md flex items-center justify-center text-center text-xs font-semibold text-black cursor-pointer hover:bg-blue-100 transition-colors focus:outline-none"
        />


        {/* Right Columns Container */}
        <div className="flex-1 h-9 bg-[#D9DFF5]/40 border border-[#3DADFF] rounded-md flex items-center justify-between px-3 text-xs font-semibold text-black">
          <span className="flex-1 text-left md:truncate pr-2" title={pasajero.nombre}>
            {pasajero.nombre}
          </span>
          <span className="text-black/35 font-normal md:inline hidden px-1">|</span>
          <span className="w-20 md:block hidden text-center truncate" title={pasajero.reserva}>
            {pasajero.reserva}
          </span>
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
            {pasajero.butaca}
          </span>
          <span className="text-black/35 font-normal px-1">|</span>
          <span className="md:w-16 flex justify-center items-center cursor-pointer text-center">
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
          <div className="space-y-2">
            {lugaresCarga.map((option) => (
              <div key={option.id} className="flex items-center justify-between gap-3">
                <label htmlFor={option.id} className="text-lg text-white font-medium cursor-pointer">
                  {option.name} - {option.address || "Sin direccion especificada"}
                </label>
                <input
                  className="w-5 h-5 cursor-pointer"
                  type="radio"
                  name={`lugares_carga_${pasajero.id}`}
                  id={option.id}
                  checked={selectedLugarCarga === option.id}
                  onChange={() => setSelectedLugarCarga(option.id)}
                />
              </div>
            ))}
          </div>
        </ModalOptions>
      )}
    </div>
  );
}
