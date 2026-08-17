"use client";
import Container from "@/app/components/Container";
import Pagination from "@/app/components/Pagination";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
} from "date-fns";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "@/app/components/Loader";

registerLocale("es", es);

interface Movimiento {
  id: string | number;
  cuenta: string;
  fecha: string;
  recibo: string | number;
  monto: number;
  tipo: string;
  detalle: string;
}

interface CuentaOption {
  id: string;
  label: string;
}

export default function TesoroPage() {
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [cuenta, setCuenta] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searched, setSearched] = useState(false);

  const [cuentas, setCuentas] = useState<CuentaOption[]>([]);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(movimientos.length / pageSize);
  const paginatedMovimientos = movimientos.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const [totals, setTotals] = useState({
    totalIngresos: 0,
    totalEgresos: 0,
    saldoTotal: 0,
  });

  const loadAccounts = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const data = await apiClient.getAccounts(user.iweb_client_id).catch(() => []);
      const mapped = data.map((acc: any) => ({
        id: acc.id,
        label: acc.account_title || "Cuenta",
      }));
      setCuentas(mapped);
    } catch {
      toast.error("Error al cargar cuentas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadAccounts();
    }
  }, [user?.iweb_client_id]);

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
  };

  const presets = [
    {
      label: "Ayer",
      action: () => {
        const yesterday = subDays(new Date(), 1);
        setStartDate(yesterday);
        setEndDate(yesterday);
      },
    },
    {
      label: "Últimos 7 Días",
      action: () => {
        setStartDate(subDays(new Date(), 7));
        setEndDate(new Date());
      },
    },
    {
      label: "Últimos 15 Días",
      action: () => {
        setStartDate(subDays(new Date(), 15));
        setEndDate(new Date());
      },
    },
    {
      label: "Últimos 30 Días",
      action: () => {
        setStartDate(subDays(new Date(), 30));
        setEndDate(new Date());
      },
    },
    {
      label: "Este Mes",
      action: () => {
        setStartDate(startOfMonth(new Date()));
        setEndDate(endOfMonth(new Date()));
      },
    },
    {
      label: "Mes Pasado",
      action: () => {
        const lastMonth = subMonths(new Date(), 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
      },
    },
  ];

  const formatMonto = (monto: number) => {
    const prefix = monto < 0 ? "-" : "";
    return `${prefix}$${Math.abs(monto).toLocaleString("es-AR")}`;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.iweb_client_id) return;

    setSearching(true);
    try {
      const sDateStr = startDate ? startDate.toISOString().split("T")[0] : undefined;
      const eDateStr = endDate ? endDate.toISOString().split("T")[0] : undefined;

      const res = await apiClient.getTesoroMovimientos(user.iweb_client_id, {
        accountId: cuenta || undefined,
        startDate: sDateStr,
        endDate: eDateStr,
      });

      setMovimientos(res.movimientos || []);
      setTotals({
        totalIngresos: res.total_ingresos || 0,
        totalEgresos: res.total_egresos || 0,
        saldoTotal: res.saldo_total || 0,
      });
      setSearched(true);
    } catch (err) {
      console.error("Error al consultar movimientos del Tesoro:", err);
      toast.error("Error al consultar movimientos del Tesoro");
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setCuenta("");
    setStartDate(null);
    setEndDate(null);
    setSearched(false);
    setMovimientos([]);
    setTotals({ totalIngresos: 0, totalEgresos: 0, saldoTotal: 0 });
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
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={() => r.push("/administracion")}
        className="flex items-center my-3 justify-start gap-3">
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>
      <div className="max-w-xl mx-auto w-full">
        {/* Limpiar búsqueda */}
        {searched && (
          <div className="flex justify-end mb-2">
            <button
              onClick={handleClear}
              className="text-sm text-black font-medium hover:underline">
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <select
            value={cuenta}
            onChange={(e) => setCuenta(e.target.value)}
            className="w-full border border-black shadow-md shadow-black/40 rounded-sm py-2.5 px-3 text-black/80 font-medium focus:outline-none focus:ring-2 focus:ring-primary bg-white">
            <option value="">Seleccione una cuenta para filtrar</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <DatePicker
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={handleDateChange}
            monthsShown={2}
            locale="es"
            dateFormat="dd/MM/yyyy"
            placeholderText="Seleccione rango de fechas"
            calendarClassName="tesoro-datepicker"
            isClearable
            className="w-full border border-black shadow-md shadow-black/40 rounded-sm py-2.5 px-3 text-black/80 font-medium focus:outline-none focus:ring-2 focus:ring-primary bg-white">
            <div className="flex flex-col gap-1 px-2 pb-2 border-t pt-2">
              <p className="text-xs font-semibold text-gray-500 mb-1">
                Rangos rápidos
              </p>
              <div className="flex flex-col flex-wrap gap-1">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={preset.action}
                    className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded font-medium transition-colors">
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </DatePicker>
          <button
            disabled={searching}
            type="submit"
            className="w-full bg-primary md:text-lg text-white shadow-lg shadow-black/60 font-medium py-2.5 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">
            {searching ? "Buscando..." : "Buscar Movimientos"}
          </button>
        </form>

        {/* Resultados */}
        {searched && (
          <div className="flex flex-col text-black gap-4 mt-6">
            {/* Resumen */}
            <div className="border border-black flex flex-col gap-3 rounded-md p-4 bg-gray-50">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm md:text-base">
                  Total Ingresos
                </span>
                <span className="font-bold text-green-500 text-sm md:text-base">
                  {formatMonto(totals.totalIngresos)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm md:text-base">
                  Total Egresos
                </span>
                <span className="font-bold text-red-500 text-sm md:text-base">
                  {formatMonto(totals.totalEgresos)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm md:text-base">
                  Saldo Total
                </span>
                <span className="font-bold text-sm md:text-base text-black">
                  {formatMonto(totals.saldoTotal)}
                </span>
              </div>
            </div>

            {/* Movimientos */}
            {movimientos.length === 0 ? (
              <div className="p-6 text-center text-gray-500 bg-white border border-gray-200 rounded-md">
                No hay movimientos registrados para los filtros seleccionados.
              </div>
            ) : (
              paginatedMovimientos.map((mov) => (
                <div
                  key={mov.id}
                  className="border border-black rounded-md p-4 bg-white hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-3">
                      <p className="font-semibold text-sm md:text-base text-black">
                        {mov.cuenta}
                      </p>
                      <p className="text-sm">
                        Fecha: <span className="font-bold">{mov.fecha}</span>
                      </p>
                      <p className="text-sm">
                        Recibo: <Link href={mov.tipo === 'reserva' ? String(mov.recibo) : ''} target="_blank" className="font-bold hover:underline">{mov.tipo === 'reserva' ? 'Ver' : '-'}</Link>
                      </p>
                      <p className="text-sm">
                        {mov.tipo === 'reserva' ? 'Imputado a la reserva: ' : 'Detalle: '} <span className="font-bold">{mov.tipo === 'reserva' ? mov.detalle.split(' ')[2] : mov.detalle}</span>
                      </p>
                    </div>
                    <span
                      className={`font-bold text-sm md:text-base shrink-0 ml-4 ${mov.monto >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                      {formatMonto(mov.monto)}
                    </span>
                  </div>
                </div>
              ))
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={movimientos.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </Container>
  );
}
