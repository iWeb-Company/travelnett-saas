"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { es } from "date-fns/locale";
import {
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subYears,
} from "date-fns";

registerLocale("es", es);

export default function TesoroPage() {
  const r = useRouter();
  const [cuenta, setCuenta] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searched, setSearched] = useState(false);

  const cuentas = [
    { id: 1, label: "Banco Galicia - CAJA DE AHORRO" },
    { id: 2, label: "Banco Nación - CUENTA CORRIENTE" },
  ];

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
    {
      label: "Este Año",
      action: () => {
        setStartDate(startOfYear(new Date()));
        setEndDate(endOfYear(new Date()));
      },
    },
    {
      label: "Año Pasado",
      action: () => {
        const lastYear = subYears(new Date(), 1);
        setStartDate(startOfYear(lastYear));
        setEndDate(endOfYear(lastYear));
      },
    },
  ];

  const movimientos = [
    {
      id: 1,
      cuenta: "Banco Galicia - CAJA DE AHORRO",
      fecha: "19/06/2025",
      recibo: 1,
      monto: 1000000,
      tipo: "reserva",
      detalle: "MDQ #1",
    },
    {
      id: 2,
      cuenta: "Banco Galicia - CAJA DE AHORRO",
      fecha: "22/06/2025",
      recibo: 1,
      monto: -3000000,
      tipo: "pago",
      detalle: "PAGO GARDEN",
    },
    {
      id: 3,
      cuenta: "Banco Galicia - CAJA DE AHORRO",
      fecha: "06/06/2025",
      recibo: 1,
      monto: 1000000,
      tipo: "reserva",
      detalle: "MDQ #1",
    },
  ];

  const totalIngresos = movimientos
    .filter((m) => m.monto > 0)
    .reduce((acc, m) => acc + m.monto, 0);

  const totalEgresos = movimientos
    .filter((m) => m.monto < 0)
    .reduce((acc, m) => acc + m.monto, 0);

  const saldoTotal = totalIngresos + totalEgresos;

  const formatMonto = (monto: number) => {
    const prefix = monto < 0 ? "-" : "";
    return `${prefix}$${Math.abs(monto).toLocaleString("es-AR")}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const handleClear = () => {
    setCuenta("");
    setStartDate(null);
    setEndDate(null);
    setSearched(false);
  };

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
            className="w-full border border-black shadow-md shadow-black/40 rounded-sm py-2 px-3 text-black/80 font-medium  focus:outline-none focus:ring-2 focus:ring-primary bg-white">
            <option value="">Seleccione una cuenta</option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.label}>
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
            placeholderText="Seleccione una fecha"
            calendarClassName="tesoro-datepicker"
            isClearable
            className="w-full border border-black shadow-md shadow-black/40 rounded-sm py-2 px-3 text-black/80 font-medium focus:outline-none focus:ring-2 focus:ring-primary bg-white">
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
            type="submit"
            className="w-full bg-primary md:text-lg text-white shadow-lg shadow-black/60 font-medium py-2.5 rounded-md hover:bg-blue-700 transition-colors">
            Buscar
          </button>
        </form>

        {/* Resultados */}
        {searched && (
          <div className="flex flex-col text-black gap-4 mt-6">
            {/* Resumen */}
            <div className="border border-black flex flex-col gap-3 rounded-md p-4">
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-sm md:text-base">
                  Total Ingresos
                </span>
                <span className="font-bold text-green-500 text-sm md:text-base">
                  {formatMonto(totalIngresos)}
                </span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-medium text-sm md:text-base">
                  Total Egresos
                </span>
                <span className="font-bold text-red-500 text-sm md:text-base">
                  {formatMonto(totalEgresos)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm md:text-base">
                  Saldo Total
                </span>
                <span className="font-bold text-sm md:text-base text-black">
                  {formatMonto(saldoTotal)}
                </span>
              </div>
            </div>

            {/* Movimientos */}
            {movimientos.map((mov) => (
              <div
                key={mov.id}
                className="border border-black rounded-md p-4 bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <p className="font-semibold text-sm md:text-base">
                      {mov.cuenta}
                    </p>
                    <p className="text-sm md:text-base">
                      Fecha: <span className="font-bold">{mov.fecha}</span>
                    </p>
                    <p className="text-sm md:text-base">
                      Recibo: <span className="font-bold">{mov.recibo}</span>
                    </p>
                    {mov.tipo === "reserva" ? (
                      <p className="text-sm md:text-base">
                        Imputado a la reserva:{" "}
                        <span className="font-bold">{mov.detalle}</span>
                      </p>
                    ) : (
                      <p className="text-sm md:text-base">
                        Detalle:{" "}
                        <span className="font-bold">{mov.detalle}</span>
                      </p>
                    )}
                  </div>
                  <span
                    className={`font-bold text-sm md:text-base shrink-0 ml-4 ${
                      mov.monto >= 0 ? "text-green-500" : "text-red-500"
                    }`}>
                    {formatMonto(mov.monto)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
