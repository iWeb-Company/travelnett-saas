"use client";
import Link from "next/link";
import Container from "../components/Container";
import ToggleSalidas from "../components/ToggleSalidas";
import ArrowLeft from "../components/icons/ArrowLeft";
import ToggleActiveFilters from "../components/ToggleActiveFilters";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "../components/Loader";

export default function PaquetesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [destinos, setDestinos] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [data, setData] = useState({
    destino: "",
    rango: "",
    periodo: "",
  });
  const [activeOnly, setActiveOnly] = useState(true);

  useEffect(() => {
    const loadFilters = async () => {
      if (!user?.iweb_client_id) return;
      try {
        const [destData, periodData] = await Promise.all([
          apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
          apiClient.getParameters("get_periods", user.iweb_client_id).catch(() => []),
        ]);
        setDestinos(destData);
        setPeriodos(periodData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadFilters();
  }, [user?.iweb_client_id]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(
      `/paquetes/result?destino=${data.destino}&rango=${data.rango}&periodo=${data.periodo}&active=${activeOnly}`,
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
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
      <section className="flex flex-col gap-5 justify-between">
        <Link
          href={"/dashboard"}
          className="flex items-center justify-start gap-3"
        >
          <ArrowLeft />
          <h1 className="font-bold">Volver al menú</h1>
        </Link>
        <h2 className="text-black font-semibold mb-5 text-center md:text-xl">
          Filtros de Paquetes
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 md:gap-5 w-full max-w-3xl md:justify-start items-start mx-auto"
        >
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
              <option key={d.id} className="bg-[#f1f1f1]" value={d.name || d.nombre}>
                {d.name || d.nombre}
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
            <option className="bg-[#f1f1f1]" value="temporada_alta">
              Temporada Alta (Julio - Agosto)
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
      </section>
    </Container>
  );
}

