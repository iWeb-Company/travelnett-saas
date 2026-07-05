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
function AgregarPaqueteContent() {
  const searchParams = useSearchParams();
  const r = useRouter();
  const { user } = useAuth();

  const id = searchParams.get("id");
  const [loadingParams, setLoadingParams] = useState(true);

  // Dynamic parameters from DB
  const [destinos, setDestinos] = useState<any[]>([]);
  const [hoteles, setHoteles] = useState<any[]>([]);
  const [excursiones, setExcursiones] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [regimenes, setRegimenes] = useState<any[]>([]);

  // Form State
  const [nombre, setNombre] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [destino, setDestino] = useState("");
  const [hotel, setHotel] = useState("");
  const [regimen, setRegimen] = useState("");
  const [excursion, setExcursion] = useState("");
  const [selectedSalidaIds, setSelectedSalidaIds] = useState<string[]>([]);
  const [salidasList, setSalidasList] = useState<any[]>([]);
  const [periodo, setPeriodo] = useState("");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [gastosAdmin, setGastosAdmin] = useState("");
  const [adicionalBuscama, setAdicionalBuscama] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [active, setActive] = useState(true);
  const [web, setWeb] = useState(true);

  const loadParameters = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [destData, hotelData, excData, periodData, regData, pkgsData, salidasData] = await Promise.all([
        apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_excursions", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_periods", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_regimenes", user.iweb_client_id).catch(() => []),
        apiClient.getPackages(user.iweb_client_id).catch(() => []),
        apiClient.getSalidas(user.iweb_client_id).catch(() => []),
      ]);

      setDestinos(destData);
      setHoteles(hotelData);
      setExcursiones(excData);
      setPeriodos(periodData);
      setRegimenes(regData);
      setSalidasList(salidasData);

      // If we are editing, populate existing package from context
      if (id) {
        const pkg = pkgsData.find((p: any) => p.id === id);
        if (pkg) {
          setNombre(pkg.name || "");
          setSubtitulo(pkg.subtitle || "");
          setDescripcion(pkg.description || "");
          setDestino(pkg.destino || "");
          setHotel(pkg.hotel || "");
          setRegimen(pkg.regimen || "");
          setExcursion(pkg.excursion || "");
          setSelectedSalidaIds(pkg.dates || []);
          setPeriodo(pkg.periodo || "");
          setPrecio(pkg.price?.toString() || "");
          setMoneda("ARS");
          setGastosAdmin(pkg.gastos?.toString() || "");
          setAdicionalBuscama(pkg.adicional?.toString() || "");
          setActive(pkg.active ?? true);
          setWeb(pkg.web ?? true);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSalidaIds.length === 0) {
      toast.error("Debes seleccionar al menos una fecha de salida precargada.");
      return;
    }

    const apiPayload = {
      name: nombre,
      subtitle: subtitulo,
      description: descripcion,
      price: parseInt(precio) || 0,
      gastos: parseInt(gastosAdmin) || 0,
      adicional: parseInt(adicionalBuscama) || 0,
      destino: destino,
      hotel: hotel,
      regimen: regimen,
      excursion: excursion,
      periodo: periodo,
      image: "",
      active: active,
      web: web,
      dates: selectedSalidaIds,
    };

    if (!user?.iweb_client_id) return;

    if (id) {
      apiClient.updatePackage(user.iweb_client_id, id, apiPayload)
        .then(() => {
          toast.success("Paquete modificado con éxito");
          r.push("/paquetes/result");
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error al modificar el paquete");
        });
    } else {
      apiClient.createPackage(user.iweb_client_id, apiPayload)
        .then(() => {
          toast.success("Paquete agregado con éxito");
          r.push("/paquetes/result");
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error al agregar el paquete");
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

      <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-3xl mx-auto my-5 gap-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-black">
        <h2 className="text-black text-center md:text-xl font-semibold mb-3">
          {id ? "Modificar" : "Agregar"} paquete
        </h2>

        {/* Nombre del paquete */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-700">Nombre del paquete</label>
          <input
            type="text"
            placeholder="Ej: Cataratas Express Bus"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Subtitulo */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-700">Subtítulo</label>
          <input
            type="text"
            placeholder="Ej: Salidas grupales acompañadas"
            value={subtitulo}
            onChange={(e) => setSubtitulo(e.target.value)}
            className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Descripcion */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-gray-700">Descripción</label>
          <textarea
            placeholder="Escribe la descripción del paquete y servicios incluidos..."
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
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
                <option key={d.id} value={d.name || d.nombre}>{d.name || d.nombre}</option>
              ))}
            </select>
          </div>

          {/* Hotel */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Hotel</label>
            <select
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona un hotel</option>
              {hoteles.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name || h.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Régimen */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Régimen Alimenticio</label>
            <select
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={regimen}
              onChange={(e) => setRegimen(e.target.value)}
              required
            >
              <option value="" disabled>Selecciona régimen</option>
              {regimenes.map((r: any) => (
                <option key={r.id} value={r.id}>{r.name || r.nombre || r.description}</option>
              ))}
            </select>
          </div>

          {/* Excursiones */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Excursión Incluida</label>
            <select
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={excursion}
              onChange={(e) => setExcursion(e.target.value)}
            >
              <option value="">Ninguna</option>
              {excursiones.map((ex: any) => (
                <option key={ex.id} value={ex.id}>{ex.name || ex.nombre}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          {/* Fecha de salida */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Asociar salida(s) precargada(s)</label>
            <div className="bg-[#f1f1f1] border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto flex flex-col gap-2">
              {salidasList.length === 0 ? (
                <p className="text-xs text-gray-500 font-semibold p-1">No hay salidas físicas precargadas en el sistema.</p>
              ) : (
                salidasList.map((sal) => {
                  const isChecked = selectedSalidaIds.includes(sal.id);
                  const formattedDate = sal.date_of_out ? new Date(sal.date_of_out + "T00:00:00").toLocaleDateString("es-AR") : "-";
                  const destObj = destinos.find((d) => d.id === sal.destino);
                  const destName = destObj?.name || destObj?.nombre || "Desconocido";
                  return (
                    <label key={sal.id} className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSalidaIds([...selectedSalidaIds, sal.id]);
                          } else {
                            setSelectedSalidaIds(selectedSalidaIds.filter((id) => id !== sal.id));
                          }
                        }}
                        className="accent-primary"
                      />
                      <span>{formattedDate} - {destName}</span>
                    </label>
                  );
                })
              )}
            </div>
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
              <option value="" disabled>Selecciona periodo</option>
              {periodos.map((p: any) => (
                <option key={p.id} value={p.id}>{p.name || p.nombre || p.description}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
          {/* Precio y Moneda */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Precio Base</label>
            <div className="flex gap-2">
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                className="bg-[#f1f1f1] border border-gray-300 rounded-lg px-2 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
              <input
                type="number"
                placeholder="Ej: 180000"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          {/* Gastos Administrativos */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Gastos Admin</label>
            <input
              type="number"
              placeholder="Ej: 1800"
              value={gastosAdmin}
              onChange={(e) => setGastosAdmin(e.target.value)}
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>

          {/* Adicional Buscama */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Adicional Buscama/Cama</label>
            <input
              type="number"
              placeholder="Ej: 20000"
              value={adicionalBuscama}
              onChange={(e) => setAdicionalBuscama(e.target.value)}
              className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Imagen de portada */}
        <div className="flex flex-col gap-2 border-t border-gray-100 pt-4">
          <label className="text-xs font-bold text-gray-700">Imagen de portada del paquete</label>
          <div className="flex items-center gap-4 bg-[#f8f9ff] p-4 rounded-xl border border-dashed border-primary/40">
            <svg
              width="45"
              height="45"
              viewBox="0 0 60 60"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-primary"
            >
              <path
                d="M45 36V45H36V51H45V60H51V51H60V45H51V36H45ZM30.9 54H6C2.7 54 0 51.3 0 48V6C0 2.7 2.7 0 6 0H48C51.3 0 54 2.7 54 6V30.9C52.2 30.3 50.1 30 48 30C44.7 30 41.4 30.9 38.7 32.7L34.5 27L24 40.5L16.5 31.5L6 45H30.3C30 45.9 30 47.1 30 48C30 50.1 30.3 52.2 30.9 54Z"
                fill="currentColor"
              />
            </svg>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <ToggleActiveFilters checked={active} onChange={setActive} />
          <ToggleActiveFilters checked={web} onChange={setWeb} label="Mostrar en Web" />
        </div>

        <button className="w-full bg-primary hover:bg-blue-700 text-white font-semibold text-center py-3 rounded-xl mt-4 shadow transition-all cursor-pointer">
          {id ? "Modificar" : "Agregar"} Paquete
        </button>
      </form>
    </Container>
  );
}

export default function AgregarPaquetePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader /></div>}>
      <AgregarPaqueteContent />
    </Suspense>
  );
}
