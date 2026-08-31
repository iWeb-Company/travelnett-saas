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
import DateRangePicker, {
  formatDateRangeParam,
} from "../components/DateRangePicker";

type TipoSalida = "aereo" | "bus" | null;

export default function SalidasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tipoSalida, setTipoSalida] = useState<TipoSalida>(null);
  const [alcance, setAlcance] = useState<"argentina" | "internacional" | null>(
    "argentina",
  );

  const [destinos, setDestinos] = useState<any[]>([]);
  const [transportes, setTransportes] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [data, setData] = useState({
    destino: "",
    empresa: "",
    periodo: "",
  });
  const [activeOnly, setActiveOnly] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      if (!user?.iweb_client_id) return;
      try {
        const [destData, transData, periodData] = await Promise.all([
          apiClient
            .getParameters("get_destinos", user.iweb_client_id)
            .catch(() => []),
          apiClient
            .getParameters("get_transport_companies", user.iweb_client_id)
            .catch(() => []),
          apiClient
            .getParameters("get_periods", user.iweb_client_id)
            .catch(() => []),
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
    const fechaDesde = startDate && endDate ? formatDateRangeParam(startDate) : "";
    const fechaHasta = startDate && endDate ? formatDateRangeParam(endDate) : "";
    router.push(
      `/salidas/result?tipo=${tipoSalida}&destino=${data.destino}&empresa=${data.empresa}&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&periodo=${data.periodo}&active=${activeOnly}&alcance=${alcance || ""}`,
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
          <h2 className="text-black font-semibold text-center text-xl md:text-2xl my-8">
            Seleccione una opción
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto w-full px-4 mb-10">
            <button
              onClick={() => setTipoSalida("aereo")}
              className="group relative overflow-hidden aspect-[4/3] w-full cursor-pointer shadow-md transition-all duration-300 hover:shadow-xl focus:outline-none">
              <img
                src="/salida-aereo.png"
                alt="Salidas en aéreo"
                className="w-full h-full object-cover transition-all duration-300 group-hover:blur-md group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
              <div className="absolute inset-0 flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3
                  className="text-white text-2xl sm:text-3xl md:text-4xl font-extrabold italic tracking-wider text-center uppercase"
                  style={{
                    WebkitTextStroke: "1.5px black",
                    paintOrder: "stroke fill",
                    filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.7))",
                  }}>
                  SALIDAS EN AÉREO
                </h3>
              </div>
            </button>
            <button
              onClick={() => setTipoSalida("bus")}
              className="group relative overflow-hidden aspect-[4/3] w-full cursor-pointer shadow-md transition-all duration-300 hover:shadow-xl focus:outline-none">
              <img
                src="/salida-bus.png"
                alt="Salidas en bus"
                className="w-full h-full object-cover transition-all duration-300 group-hover:blur-md group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300" />
              <div className="absolute inset-0 flex items-center justify-center p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <h3
                  className="text-white text-2xl sm:text-3xl md:text-4xl font-extrabold italic tracking-wider text-center uppercase"
                  style={{
                    WebkitTextStroke: "1.5px black",
                    paintOrder: "stroke fill",
                    filter: "drop-shadow(0px 2px 4px rgba(0,0,0,0.7))",
                  }}>
                  SALIDAS EN BUS
                </h3>
              </div>
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
          <h2 className="text-black font-semibold mb-5 text-center text-xl md:text-2xl">
            Filtros
          </h2>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-3 md:gap-5 max-w-3xl md:justify-start items-start mx-auto w-full">
            {/* Destino */}
            <select
              className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
              name="destino"
              id="destino"
              onChange={handleChange}
              value={data.destino}>
              <option value="">Destino</option>
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
              value={data.empresa}>
              <option value="">Empresa de Transporte</option>
              {transportes
                .filter((t: any) => !tipoSalida || t.type === tipoSalida)
                .map((t: any) => (
                  <option key={t.id} className="bg-[#f1f1f1]" value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>

            {/* Rango de fechas */}
            <DateRangePicker
              startDate={startDate}
              endDate={endDate}
              onChange={([start, end]) => {
                setStartDate(start);
                setEndDate(end);
              }}
            />

            {/* Periodo */}
            <select
              className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
              name="periodo"
              id="periodo"
              onChange={handleChange}
              value={data.periodo}>
              <option value="">Periodo</option>
              {periodos.map((p: any) => (
                <option key={p.id} className="bg-[#f1f1f1]" value={p.id}>
                  {p.name || p.nombre || p.description}
                </option>
              ))}
            </select>

            {/* Filtros de Alcance: Argentina / Internacional */}
            <div className="w-full flex rounded-sm overflow-hidden  shadow-md shadow-gray-500 h-12 sm:h-14">
              <button
                type="button"
                onClick={() =>
                  setAlcance(alcance === "argentina" ? null : "argentina")
                }
                className="relative w-1/2 h-full p-0 border-none cursor-pointer overflow-hidden focus:outline-none">
                <img
                  src="/argentina.png"
                  alt="Argentina"
                  className="w-full h-full object-cover"
                />
                {alcance === "argentina" && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-[70%] w-3 bg-[#00c6ff] rounded-full shadow-sm" />
                )}
              </button>
              <button
                type="button"
                onClick={() =>
                  setAlcance(
                    alcance === "internacional" ? null : "internacional",
                  )
                }
                className="relative w-1/2 h-full p-0 border-none cursor-pointer overflow-hidden focus:outline-none">
                <img
                  src="/internacional.png"
                  alt="Internacional"
                  className="w-full h-full object-cover"
                />
                {alcance === "internacional" && (
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 h-[70%] w-3 bg-secondary rounded-full shadow-sm" />
                )}
              </button>
            </div>

            <ToggleActiveFilters
              checked={activeOnly}
              onChange={setActiveOnly}
            />
            <button className="w-full bg-primary cursor-pointer text-white font-medium text-center py-2.5 rounded-xl text-lg shadow-md hover:bg-primary/90 transition-colors">
              Buscar
            </button>
          </form>
        </>
      )}
    </Container>
  );
}
