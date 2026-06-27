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
import { useMockData } from "@/context/MockDataContext";

function AgregarSalidaContent() {
  const searchParams = useSearchParams();
  const r = useRouter();
  const { user } = useAuth();
  const { salidas, addSalida, updateSalida } = useMockData();
  
  const id = searchParams.get("id");
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
  const [semicama, setSemicama] = useState("");
  const [cama, setCama] = useState("");
  const [precioBase, setPrecioBase] = useState("");
  const [gastosAdmin, setGastosAdmin] = useState("");
  const [adicionalBuscama, setAdicionalBuscama] = useState("");
  const [selectedCargas, setSelectedCargas] = useState<string[]>([]);
  const [coordinadores, setCoordinadores] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const loadParameters = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [destData, transData, periodData, cargaData] = await Promise.all([
        apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_transport_companies", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_periods", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_lugares_carga", user.iweb_client_id).catch(() => [])
      ]);

      setDestinos(destData);
      setTransportes(transData);
      setPeriodos(periodData);
      setLugaresCarga(cargaData);

      // If we are editing, fetch the existing data from context
      if (id) {
        const sal = salidas.find(x => x.id === id);
        if (sal) {
          setDestino(sal.destinoId);
          setEmpresa(sal.empresaId);
          setFecha(sal.fecha);
          setPeriodo(sal.periodoId);
          setPasajerosTotales(sal.pasajerosTotales?.toString() || "");
          setSemicama(sal.semicama?.toString() || "");
          setCama(sal.cama?.toString() || "");
          setPrecioBase(sal.precioBase?.toString() || "");
          setGastosAdmin(sal.gastosAdmin?.toString() || "");
          setAdicionalBuscama(sal.adicionalBuscama?.toString() || "");
          setCoordinadores(sal.coordinadores || "");
          setObservaciones(sal.observaciones || "");
          setSelectedCargas(sal.cargas || []);
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
  }, [user?.iweb_client_id, salidas]);

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
    
    const destObj = destinos.find(d => d.id === destino);
    const destName = destObj?.name || destObj?.nombre || "Desconocido";
    
    const transObj = transportes.find(t => t.id === empresa);
    const transName = transObj ? transObj.name : "Desconocido";
    const transType = transObj ? transObj.type : "bus";
    
    const perObj = periodos.find(p => p.id === periodo);
    const perName = perObj?.name || perObj?.nombre || perObj?.description || "Desconocido";

    const payload = {
      destinoId: destino,
      destinoNombre: destName,
      empresaId: empresa,
      empresaNombre: transName,
      empresaTipo: transType as 'aereo' | 'bus',
      fecha,
      periodoId: periodo,
      periodoNombre: perName,
      pasajerosTotales: parseInt(pasajerosTotales) || 0,
      semicama: parseInt(semicama) || 0,
      cama: parseInt(cama) || 0,
      precioBase: parseFloat(precioBase) || 0,
      gastosAdmin: parseFloat(gastosAdmin) || 0,
      adicionalBuscama: parseFloat(adicionalBuscama) || 0,
      cargas: selectedCargas,
      coordinadores,
      observaciones,
      active: true,
    };

    if (id) {
      updateSalida(id, payload);
      toast.success("Salida modificada con éxito");
    } else {
      addSalida(payload);
      toast.success("Salida agregada con éxito");
    }
    r.push("/salidas/result");
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

      <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-3xl mx-auto my-5 gap-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-black">
        <h2 className="text-black text-center md:text-xl font-semibold mb-3">
          {id ? "Modificar" : "Agregar"} salida
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Destino */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Destino</label>
            <select
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona un destino</option>
              {destinos.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name || d.nombre}</option>
              ))}
            </select>
          </div>

          {/* Empresa de Transporte */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Empresa de Transporte</label>
            <select
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona transporte</option>
              {transportes.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name} ({t.type === 'aereo' ? 'Aéreo' : 'Bus'})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Fecha de salida */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Fecha de salida</label>
            <input
              type="date"
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>

          {/* Periodo */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Periodo</label>
            <select
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona un periodo</option>
              {periodos.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name || p.nombre || p.description}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
          {/* Pasajeros totales */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Pasajeros Totales</label>
            <input
              type="number"
              placeholder="Ej: 60"
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={pasajerosTotales}
              onChange={(e) => setPasajerosTotales(e.target.value)}
              required
            />
          </div>

          {/* Semicama */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Butacas Semicama</label>
            <input
              type="number"
              placeholder="Ej: 40"
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={semicama}
              onChange={(e) => setSemicama(e.target.value)}
            />
          </div>

          {/* Cama */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Butacas Cama</label>
            <input
              type="number"
              placeholder="Ej: 20"
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={cama}
              onChange={(e) => setCama(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
          {/* Precio Base */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Precio Base ($)</label>
            <input
              type="number"
              placeholder="Ej: 150000"
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={precioBase}
              onChange={(e) => setPrecioBase(e.target.value)}
              required
            />
          </div>

          {/* Gastos Administrativos */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Gastos Admin ($)</label>
            <input
              type="number"
              placeholder="Ej: 15000"
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={gastosAdmin}
              onChange={(e) => setGastosAdmin(e.target.value)}
              required
            />
          </div>

          {/* Adicional Buscama/Cama */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Adicional Cama/Business ($)</label>
            <input
              type="number"
              placeholder="Ej: 25000"
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={adicionalBuscama}
              onChange={(e) => setAdicionalBuscama(e.target.value)}
            />
          </div>
        </div>

        {/* Lugares de Carga */}
        <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
          <label className="text-xs font-bold text-gray-700">Lugares de Carga / Paradas</label>
          {lugaresCarga.length === 0 ? (
            <p className="text-xs text-gray-500">No hay lugares de carga registrados en parámetros.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {lugaresCarga.map((l: any) => (
                <label key={l.id} className="flex items-center gap-2 text-sm text-gray-800 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={selectedCargas.includes(l.id)}
                    onChange={() => handleCoggleToggle(l.id)} // local helper
                    className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
                  />
                  {l.name || l.nombre || l.description}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Coordinadores */}
        <div className="flex flex-col gap-1 border-t border-gray-100 pt-4">
          <label className="text-xs font-bold text-gray-700">Coordinadores</label>
          <input
            type="text"
            placeholder="Ej: Juan Pérez, María Gómez"
            className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={coordinadores}
            onChange={(e) => setCoordinadores(e.target.value)}
          />
        </div>

        {/* Observaciones */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-700">Observaciones</label>
          <textarea
            placeholder="Observaciones adicionales sobre la salida..."
            rows={3}
            className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
          />
        </div>

        <button className="w-full bg-primary hover:bg-blue-700 text-white font-semibold text-center py-3 rounded-xl mt-4 shadow transition-all cursor-pointer">
          {id ? "Modificar" : "Agregar"} Salida
        </button>
      </form>
    </Container>
  );
}

// Wrapping helper for load parameter toggle inside checkbox
function handleCoggleToggle(id: string) {
  const checkbox = document.querySelector(`input[type=checkbox][value="${id}"]`) as HTMLInputElement;
  if(checkbox) checkbox.checked = !checkbox.checked;
}

export default function AgregarSalidaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader /></div>}>
      <AgregarSalidaContent />
    </Suspense>
  );
}
