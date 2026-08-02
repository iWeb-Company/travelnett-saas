"use client";
import Link from "next/link";
import Container from "../components/Container";
import ArrowLeft from "../components/icons/ArrowLeft";
import ToggleSalidas from "../components/ToggleSalidas";
import { useRouter } from "next/navigation";
import ToggleActiveFilters from "../components/ToggleActiveFilters";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "../components/Loader";

type TipoSalida = "aereo" | "bus" | null;

export default function SalidasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tipoSalida, setTipoSalida] = useState<TipoSalida>(null);
  
  const [destinos, setDestinos] = useState<any[]>([]);
  const [transportes, setTransportes] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    destino: "",
    empresa: "",
    rango: "",
    periodo: "",
  });
  const [activeOnly, setActiveOnly] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      if (!user?.iweb_client_id) return;
      try {
        const [destData, transData, periodData] = await Promise.all([
          apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_transport_companies", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_periods", user.iweb_client_id).catch(() => []),
        ]);
        setDestinos(destData);
        setTransportes(transData);
        setPeriodos(periodData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFilters();
  }, [user?.iweb_client_id]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(
      `/salidas/result?tipo=${tipoSalida}&destino=${data.destino}&empresa=${data.empresa}&rango=${data.rango}&periodo=${data.periodo}&active=${activeOnly}`,
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
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver al menú</h1>
      </Link>
      {!tipoSalida ? (
        <>
          <h2 className="text-black font-semibold text-center md:text-xl my-10">
            Selecciona una opción
          </h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6">
            <button
              onClick={() => setTipoSalida("aereo")}
              className="relative overflow-hidden rounded-xl shadow-md shadow-black/30 size-80 md:size-100">
              <img
                src="/salida-aereo.png"
                alt="Salidas en aéreo"
                className="w-full h-full size-40 object-cover"
              />
              <div className="absolute inset-0 bg-primary/40" />
              <h3 className="absolute top-1/2 left-1/2 -translate-x-1/2 md:text-nowrap md:text-3xl -translate-y-1/2 text-white text-2xl font-bold italic drop-shadow-lg">
                SALIDAS EN AÉREO
              </h3>
            </button>
            <button
              onClick={() => setTipoSalida("bus")}
              className="relative overflow-hidden rounded-xl shadow-md shadow-black/30 size-80 md:size-100">
              <img
                src="/salida-bus.png"
                alt="Salidas en bus"
                className="w-full h-full size-40 object-cover"
              />
              <div className="absolute inset-0 bg-primary/40" />
              <h3 className="absolute top-1/2 left-1/2 -translate-x-1/2 md:text-nowrap md:text-3xl -translate-y-1/2 text-white text-2xl font-bold italic drop-shadow-lg">
                SALIDAS EN BUS
              </h3>
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-3 my-5">
            <button
              onClick={() => setTipoSalida(null)}
              className="text-primary text-sm font-medium underline">
              ← Cambiar tipo
            </button>
            <span className="text-black text-sm font-medium">
              {tipoSalida === "aereo" ? "Aéreo" : "Bus"}
            </span>
          </div>
          <h2 className="text-black font-semibold mb-5 text-center md:text-xl">Filtros de Salidas</h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:gap-5 max-w-3xl md:justify-start items-start mx-auto w-full">
            {/* Destino */}
            <select
              className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
              name="destino"
              id="destino"
              onChange={handleChange}
              value={data.destino}
            >
              <option value="">Cualquier Destino</option>
              {destinos.map((d: any) => (
                <option key={d.id} className="bg-[#f1f1f1]" value={d.id}>
                  {d.name || d.nombre}
                </option>
              ))}
            </select>

            {/* Empresa de transporte */}
            <select
              className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
              name="empresa"
              id="empresa"
              onChange={handleChange}
              value={data.empresa}
            >
              <option value="">Cualquier Empresa</option>
              {transportes
                .filter((t: any) => !tipoSalida || t.type === tipoSalida)
                .map((t: any) => (
                  <option key={t.id} className="bg-[#f1f1f1]" value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>

            {/* Rango de fechas */}
            <select
              className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
              name="rango"
              id="rango"
              onChange={handleChange}
              value={data.rango}
            >
              <option value="">Rango de fechas (Todos)</option>
              <option className="bg-[#f1f1f1]" value="proximos">
                Próximos 30 días
              </option>
            </select>

            {/* Periodo */}
            <select
              className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
              name="periodo"
              id="periodo"
              onChange={handleChange}
              value={data.periodo}
            >
              <option value="">Cualquier Periodo</option>
              {periodos.map((p: any) => (
                <option key={p.id} className="bg-[#f1f1f1]" value={p.id}>
                  {p.name || p.nombre || p.description}
                </option>
              ))}
            </select>

            <ToggleActiveFilters checked={activeOnly} onChange={setActiveOnly} />
            <button className="w-full bg-primary cursor-pointer text-white font-medium text-center py-2 rounded-xl">
              Buscar
            </button>
          </form>
        </>
      )}
    </Container>
  );
}

