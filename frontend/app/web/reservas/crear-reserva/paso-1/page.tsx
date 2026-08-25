'use client';

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";
import ModalOptions from "@/app/components/ModalOptions";
import { Salida } from "@/app/types";
import AddVioleta from "@/app/components/icons/AddVioleta";
import ModalLayout from "@/app/components/ModalLayout";
import Salidas from "@/app/components/icons/home/Salidas";
import Paquetes from "@/app/components/icons/home/Paquetes";

export default function Paso1Page() {
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [modalSalidas, setModalSalidas] = useState(false)
  const [modalPaquetes, setModalPaquetes] = useState(false)


  // Form states
  const [destino, setDestino] = useState("");
  const [cliente, setCliente] = useState("");
  const [tipoReserva, setTipoReserva] = useState<"tradicional" | "bloqueo">("tradicional");

  const [salidas, setSalidas] = useState<Salida[]>([])
  const [paquetes, setPaquetes] = useState<any[]>([])
  const [salidaSelected, setSalidaSelected] = useState<string | null>(null)
  const [paqueteSelected, setPaqueteSelected] = useState<string | null>(null)
  const [tempSalidaSelected, setTempSalidaSelected] = useState<string | null>(null)
  const [tempPaqueteSelected, setTempPaqueteSelected] = useState<string | null>(null)

  const loadData = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [destData, clientData, salidasData, paquetesData] = await Promise.all([
        apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_clients", user.iweb_client_id).catch(() => []),
        apiClient.getSalidas(user.iweb_client_id).catch(() => []),
        apiClient.getPackages(user.iweb_client_id).catch(() => [])
      ]);
      setDestinos(destData);
      setClientes(clientData);
      setSalidas(salidasData)
      setPaquetes(paquetesData)
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar destinos y clientes");
    } finally {
      setLoading(false);
    }
  };

  const handleSalidaSelect = (salidaId: any) => {
    if (salidaSelected === salidaId) {
      setSalidaSelected(null)
    } else {
      setSalidaSelected(salidaId)
    }
  };

  const handlePaqueteSelect = (paqueteId: any) => {
    if (paqueteSelected === paqueteId) {
      setPaqueteSelected(null)
    } else {
      setPaqueteSelected(paqueteId)
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadData();
    }
  }, [user?.iweb_client_id]);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destino) {
      toast.error("Por favor, completa todos los campos del paso 1");
      return;
    }
    if (tipoReserva === "tradicional" && (!salidaSelected || !paqueteSelected)) {
      toast.error("Por favor, selecciona tanto una salida como un paquete para la reserva tradicional");
      return;
    }
    if (tipoReserva === "bloqueo" && !salidaSelected) {
      toast.error("Por favor, selecciona una salida");
      return;
    }


    const itemId = salidaSelected || paqueteSelected || "";
    const itemType = salidaSelected ? "salida" : (paqueteSelected ? "paquete" : "");

    // Navigate to step 2 passing values in query params
    r.push(`/web/reservas/crear-reserva/paso-2?destino=${destino}&cliente=${cliente}&tipo=${tipoReserva}&item=${itemId}&itemType=${itemType}&salida=${salidaSelected || ""}&paquete=${paqueteSelected || ""}`);
  };

  const targetDestinoKeys = useMemo(() => {
    if (!destino) return [];
    const selectedDestinoObj = destinos.find((d: any) => d.id === destino || d.name === destino || d.nombre === destino);
    if (!selectedDestinoObj) return [String(destino).trim().toLowerCase()];

    const subNames = (selectedDestinoObj.name || selectedDestinoObj.nombre || "")
      .split(/\s*[/,+]\s*/)
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);

    const matchingDestinoIds = destinos
      .filter((d: any) => subNames.includes((d.name || d.nombre || "").trim().toLowerCase()))
      .map((d: any) => d.id)
      .filter(Boolean) as string[];

    const matchingDestinoSiglas = destinos
      .filter((d: any) => subNames.includes((d.name || d.nombre || "").trim().toLowerCase()))
      .map((d: any) => d.sigla)
      .filter(Boolean) as string[];

    const allKeys = [
      destino,
      selectedDestinoObj.id,
      selectedDestinoObj.name,
      selectedDestinoObj.nombre,
      selectedDestinoObj.sigla,
      ...matchingDestinoIds,
      ...matchingDestinoSiglas,
      ...subNames,
    ].filter(Boolean) as string[];

    return Array.from(new Set(allKeys.map((k) => String(k).trim().toLowerCase())));
  }, [destino, destinos]);

  const filteredSalidas = useMemo(() => {
    if (paqueteSelected) {
      const selectedPkg = paquetes.find((p: any) => p.id === paqueteSelected);
      if (selectedPkg && selectedPkg.dates && selectedPkg.dates.length > 0) {
        const linked = salidas.filter((s: any) => selectedPkg.dates.includes(s.id));
        if (linked.length > 0) return linked;
      }
    }
    if (!destino) return salidas;
    return salidas.filter((s: any) => s.destino && targetDestinoKeys.includes(String(s.destino).trim().toLowerCase()));
  }, [salidas, destino, targetDestinoKeys, paqueteSelected, paquetes]);

  const filteredPaquetes = useMemo(() => {
    if (salidaSelected) {
      const pkgsForSalida = paquetes.filter((p: any) => p.dates && p.dates.includes(salidaSelected));
      if (pkgsForSalida.length > 0) return pkgsForSalida;
    }
    if (!destino) return paquetes;
    return paquetes.filter((p: any) => p.destino && targetDestinoKeys.includes(String(p.destino).trim().toLowerCase()));
  }, [paquetes, destino, targetDestinoKeys, salidaSelected]);

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
            {tipoReserva === "bloqueo" ? "2. Habitaciones / Datos" : "2. Habitación"}
          </div>
          {tipoReserva === "tradicional" && (
            <div className="flex-1 bg-[#A8B8F0] text-white text-center py-3 font-semibold text-sm md:text-base">
              3. Datos
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleNext} className="flex flex-col w-full gap-5  p-6 rounded-xl ">
          {/* Destino */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Destino</label>
            <select
              className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={destino}
              onChange={(e) => {
                setDestino(e.target.value);
                setSalidaSelected(null);
                setPaqueteSelected(null);
              }}
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
            >
              <option value="" disabled>Cliente</option>
              {clientes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.complete_name || c.name_system || c.name || c.nombre}</option>
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
                  onChange={() => setTipoReserva("tradicional")}
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
                  onChange={() => {
                    setTipoReserva("bloqueo");
                  }}
                  className="w-5 h-5 accent-primary"
                />
                Bloqueo/Grupo
              </label>
            </div>
          </div>

          {/* Seleccionar salida / paquete */}
          <div className="flex flex-col gap-3 border-gray-100 pt-3">
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => { setTempSalidaSelected(salidaSelected); setModalSalidas(true); }}
                className="flex-1 flex items-center gap-2 py-2 text-start rounded-lg text-sm font-semibold transition-all cursor-pointer"
              >
                <AddVioleta color="#0546F7" />
                <p>Seleccionar salida </p>
              </button>
              {salidaSelected && (
                <p className="text-sm font-semibold text-black flex items-center justify-between bg-blue-50 p-2 rounded-md">
                  <span>
                    Salida seleccionada: {
                      (() => {
                        const sObj = salidas.find(s => s.id === salidaSelected);
                        const dest = destinos.find(d => d.id === sObj?.destino);
                        return sObj ? `${dest?.name || dest?.nombre || "Salida"} - ${sObj.date_of_out || ""}` : "";
                      })()
                    }
                  </span>
                  <button type="button" onClick={() => setSalidaSelected(null)} className="text-red-500 font-bold ml-2">✕</button>
                </p>
              )}
              <button
                type="button"
                onClick={() => { setTempPaqueteSelected(paqueteSelected); setModalPaquetes(true); }}
                className="flex-1 flex items-center gap-2 py-2 text-start rounded-lg text-sm font-semibold transition-all cursor-pointer"
              >
                <AddVioleta color="#0546F7" />
                <p>Seleccionar paquete {tipoReserva === "bloqueo" ? "(opcional)" : ""}</p>
              </button>
              {paqueteSelected && (
                <p className="text-sm font-semibold text-black flex items-center justify-between bg-purple-50 p-2 rounded-md">
                  <span>
                    Paquete seleccionado: {
                      paquetes.find(p => p.id === paqueteSelected)?.name || "Paquete"
                    }
                  </span>
                  <button type="button" onClick={() => setPaqueteSelected(null)} className="text-red-500 font-bold ml-2">✕</button>
                </p>
              )}
            </div>
          </div>

          {modalSalidas && (
            <ModalLayout
              title="Listado de salidas"
              setModalOpen={setModalSalidas}
              svg={<Salidas />}
              onSubmit={() => {
                setSalidaSelected(tempSalidaSelected);
                setModalSalidas(false);
              }}
            >
              <div className="space-y-2">
                {filteredSalidas.map((option) => {
                  const destinoObj = destinos.find((d) => d.id === option.destino);
                  return (
                    <div key={option.id} className="flex items-center justify-between gap-3">
                      <label htmlFor={`salida-${option.id}`} className="text-lg text-white font-medium cursor-pointer">
                        {destinoObj?.name || destinoObj?.nombre || "Salida"} - {option.date_of_out}
                      </label>
                      <input
                        className="w-5 h-5 cursor-pointer"
                        type="radio"
                        name="salidas"
                        value={option.id}
                        id={`salida-${option.id}`}
                        checked={tempSalidaSelected === option.id}
                        onChange={() => {
                          setTempSalidaSelected(option.id || null);
                        }}
                      />
                    </div>
                  );
                })}
                {filteredSalidas.length === 0 && (
                  <p className="text-white text-center py-4">No hay salidas disponibles para este destino.</p>
                )}
              </div>
            </ModalLayout>
          )}

          {modalPaquetes && (
            <ModalLayout
              title="Listado de paquetes"
              setModalOpen={setModalPaquetes}
              svg={<Paquetes />}
              onSubmit={() => {
                setPaqueteSelected(tempPaqueteSelected);
                setModalPaquetes(false);
              }}
            >
              <div className="space-y-2">
                {filteredPaquetes.map((option) => (
                  <div key={option.id} className="flex items-center justify-between gap-3">
                    <label htmlFor={`paquete-${option.id}`} className="text-lg text-white font-medium cursor-pointer">
                      {option.name}
                    </label>
                    <input
                      className="w-5 h-5 cursor-pointer"
                      type="radio"
                      name="paquetes"
                      value={option.id}
                      id={`paquete-${option.id}`}
                      checked={tempPaqueteSelected === option.id}
                      onChange={() => {
                        setTempPaqueteSelected(option.id || null);
                      }}
                    />
                  </div>
                ))}
                {filteredPaquetes.length === 0 && (
                  <p className="text-white text-center py-4">No hay paquetes disponibles para este destino.</p>
                )}
              </div>
            </ModalLayout>
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
