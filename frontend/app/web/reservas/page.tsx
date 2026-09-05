"use client";
import Link from "next/link";
import Container from "@/app/components/Container";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleActiveFilters from "@/app/components/ToggleActiveFilters";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import DateRangePicker, {
  formatDateRangeParam,
} from "@/app/components/DateRangePicker";
import { FormSkeleton } from "@/app/components/FormSkeleton";

export default function ReservasPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clientes, setClientes] = useState<any[]>([]);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [paquetes, setPaquetes] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [data, setData] = useState({
    numero: "",
    cliente: "",
    periodo: "",
    paquete: "",
    activo: true,
  });

  const loadFilterData = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [cliData, perData, packData] = await Promise.all([
        apiClient.getParameters("get_clients", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_periods", user.iweb_client_id).catch(() => []),
        apiClient.getPackages(user.iweb_client_id).catch(() => []),
      ]);
      setClientes(cliData || []);
      setPeriodos(perData || []);
      setPaquetes(packData || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingFilters(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadFilterData();
    }
  }, [user?.iweb_client_id]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fechaDesde = startDate && endDate ? formatDateRangeParam(startDate) : "";
    const fechaHasta = startDate && endDate ? formatDateRangeParam(endDate) : "";
    router.push(
      `/web/reservas/result?numero=${data.numero}&cliente=${data.cliente}&fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&periodo=${data.periodo}&paquete=${data.paquete}&activo=${data.activo}`,
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setData({
      ...data,
      [e.target.name]: e.target.value,
    });
  };

  if (loadingFilters) return <Container><FormSkeleton /></Container>;

  return (
    <Container>
      <ToggleSalidas />
      <section className="flex flex-col gap-5 justify-between">
        <Link
          href={"/dashboard"}
          className="flex items-center justify-start gap-3">
          <ArrowLeft />
          <h1 className="font-bold">Volver al menú</h1>
        </Link>
        <h2 className="text-black font-semibold mb-5 text-center md:text-xl">
          Filtros
        </h2>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-3 md:gap-5 w-full max-w-3xl md:justify-start items-start mx-auto">
          <input
            type="text"
            className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
            name="numero"
            id="numero"
            value={data.numero}
            onChange={(e) => setData({ ...data, numero: e.target.value })}
            placeholder="Número"
          />
          <select
            className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500 cursor-pointer"
            name="cliente"
            id="cliente"
            value={data.cliente}
            onChange={handleChange}>
            <option className="text-gray-200 bg-[#f1f1f1]" value="">
              Cliente
            </option>
            {clientes.map((c) => (
              <option key={c.id} className="bg-[#f1f1f1]" value={c.id}>
                {c.complete_name || c.name_system}
              </option>
            ))}
          </select>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onChange={([start, end]) => {
              setStartDate(start);
              setEndDate(end);
            }}
            placeholder="Rango de fechas (Fecha de alta)"
          />
          <select
            className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
            name="periodo"
            id="periodo"
            value={data.periodo}
            onChange={handleChange}>
            <option className="text-gray-200 bg-[#f1f1f1]" value="">
              Periodo
            </option>
            {periodos.map((p) => (
              <option key={p.id} className="bg-[#f1f1f1]" value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            className="text-gray-500 font-medium bg-[#f1f1f1] w-full border md:text-xl border-gray-400 py-2 px-4 rounded-lg shadow-md shadow-gray-500"
            name="paquete"
            id="paquete"
            value={data.paquete}
            onChange={handleChange}>
            <option className="text-gray-200 bg-[#f1f1f1]" value="">
              Paquete
            </option>
            {paquetes.map((pkg) => (
              <option key={pkg.id} className="bg-[#f1f1f1]" value={pkg.id}>
                {pkg.name}
              </option>
            ))}
          </select>
          <ToggleActiveFilters
            checked={data.activo}
            onChange={(val) => setData({ ...data, activo: val })}
          />
          <button className="w-full bg-primary cursor-pointer text-white font-medium text-center py-2 rounded-xl">
            Buscar
          </button>
        </form>
      </section>
    </Container>
  );
}
