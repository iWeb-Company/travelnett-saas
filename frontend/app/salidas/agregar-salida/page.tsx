'use client';

import Link from "next/link";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleActiveFilters from "@/app/components/ToggleActiveFilters";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";
import DateInput from "@/app/components/DateComponent";
import ComponentToogleModal from "@/app/components/ComponentToogleModal";

function AgregarSalidaContent() {
  const searchParams = useSearchParams();
  const r = useRouter();
  const { user } = useAuth();

  const id = searchParams.get("id");
  const typeParam = searchParams.get("type") || "bus";
  const [loadingParams, setLoadingParams] = useState(true);

  // Dynamic parameters from DB
  const [destinos, setDestinos] = useState<any[]>([]);
  const [transportes, setTransportes] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [lugaresCarga, setLugaresCarga] = useState<any[]>([]);

  // Form State
  const [destino, setDestino] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [fecha, setFecha] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [pasajerosTotales, setPasajerosTotales] = useState("");
  const [economy, setEconomy] = useState("");
  const [business, setBusiness] = useState("");
  const [selectedCargas, setSelectedCargas] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  const loadParameters = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [destData, transData, periodData, cargaData, salidasData] = await Promise.all([
        apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_transport_companies", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_periods", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_lugares_carga", user.iweb_client_id).catch(() => []),
        apiClient.getSalidas(user.iweb_client_id).catch(() => [])
      ]);

      setDestinos(destData);
      setTransportes(transData);
      setPeriodos(periodData);
      setLugaresCarga(cargaData);

      // If we are editing, fetch the existing data from context
      if (id) {
        const sal = salidasData.find((x: any) => x.id === id);
        if (sal) {
          setDestino(sal.destino || "");
          setEmpresa(sal.transport_company || "");
          setFecha(sal.date_of_out || "");
          setPeriodo(sal.periodo || "");
          setPasajerosTotales(sal.passengers?.toString() || "");
          setEconomy(sal.semicama?.toString() || "");
          setBusiness(sal.cama?.toString() || "");
          setSelectedCargas(sal.cargas ? sal.cargas.map((c: any) => c.id) : []);
          setActive(sal.active ?? true);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar parámetros del servidor");
    } finally {
      setLoadingParams(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadParameters();
    }
  }, [user?.iweb_client_id]);

  const handleBack = () => {
    r.back();
  };

  const handleCargaToggle = (idCarga: string) => {
    setSelectedCargas((prev) =>
      prev.includes(idCarga) ? prev.filter((x) => x !== idCarga) : [...prev, idCarga]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const apiPayload = {
      date_of_out: fecha,
      type: typeParam,
      active: active,
      periodo: periodo,
      transport_company: empresa,
      destino: destino,
      passengers: parseInt(pasajerosTotales) || 0,
      semicama: parseInt(economy) || 0,
      cama: parseInt(business) || 0,
      cargas_ids: selectedCargas,
    };

    if (!user?.iweb_client_id) return;

    if (id) {
      apiClient.updateSalida(user.iweb_client_id, id, apiPayload)
        .then(() => {
          toast.success("Salida modificada con éxito");
          r.push(`/salidas/result?tipo=${typeParam}`);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error al modificar la salida");
        });
    } else {
      apiClient.createSalida(user.iweb_client_id, apiPayload)
        .then(() => {
          toast.success("Salida agregada con éxito");
          r.push(`/salidas/result?tipo=${typeParam}`);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error al agregar la salida");
        });
    }
  };

  if (loadingParams) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <Container>
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button onClick={handleBack} className="flex items-center my-3 justify-start gap-3">
        <h2 className="font-semibold text-secondary underline">Cancelar</h2>
      </button>

      <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-3xl mx-auto my-5 gap-5 bg-white p-6 rounded-xl border border-gray-200 text-lg shadow-sm text-black">
        <h2 className="text-black text-center md:text-xl font-semibold mb-3">
          {id ? "Modificar" : "Agregar"} salida
        </h2>

        {/* Destino */}
        <select
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          required
        >
          <option value="" disabled>Destino</option>
          {destinos.map((d: any) => (
            <option key={d.id} value={d.id}>{d.name || d.nombre}</option>
          ))}
        </select>

        {/* Empresa de Transporte */}
        <select
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={empresa}
          onChange={(e) => setEmpresa(e.target.value)}
          required
        >
          <option value="" disabled>Empresa de Transporte</option>
          {transportes.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name} ({t.type === 'aereo' ? 'Aéreo' : 'Bus'})</option>
          ))}
        </select>

        {/* Fecha de salida */}
        <DateInput value={fecha} onChange={(e) => setFecha(e)} placeholder="Fecha de salida" />

        {/* Periodo */}
        <select
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          required
        >
          <option value="" disabled>Período</option>
          {periodos.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name || p.nombre || p.description}</option>
          ))}
        </select>

        {/* Pasajeros totales */}
        <input
          type="number"
          placeholder="Cantidad de pasajeros totales"
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={pasajerosTotales}
          onChange={(e) => setPasajerosTotales(e.target.value)}
          required
        />

        {/* Semicama */}
        <input
          type="number"
          placeholder="Economy"
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={economy}
          onChange={(e) => setEconomy(e.target.value)}
        />

        {/* Cama */}
        <input
          type="number"
          placeholder="Business"
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
        />

        {/* Lugares de Carga */}
        {lugaresCarga.length === 0 ? (
          <p className="text-xs text-gray-500">No hay lugares de carga registrados en parámetros.</p>
        ) : (
          <ComponentToogleModal
            onSelect={(value) => {
              setSelectedCargas(value ? value.split(", ") : []);
            }}
            value={selectedCargas.join(", ")}
            options={lugaresCarga.map((lugar) => ({
              id: lugar.id,
              label: lugar.name,
            }))}
            placeholder="Lugares de carga"
          />
        )}
        <ToggleActiveFilters checked={active} onChange={setActive} />
        <button className="w-full bg-primary hover:bg-blue-700 text-white font-semibold text-center py-3 rounded-xl shadow transition-all cursor-pointer">
          {id ? "Modificar" : "Agregar"} Salida
        </button>
      </form>
    </Container >
  );
}

// Wrapping helper for load parameter toggle inside checkbox
function handleCoggleToggle(id: string) {
  const checkbox = document.querySelector(`input[type=checkbox][value="${id}"]`) as HTMLInputElement;
  if (checkbox) checkbox.checked = !checkbox.checked;
}

export default function AgregarSalidaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader /></div>}>
      <AgregarSalidaContent />
    </Suspense>
  );
}
