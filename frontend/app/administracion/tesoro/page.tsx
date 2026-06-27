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
} from "date-fns";
import toast from "react-hot-toast";
import ModalLayout from "@/app/components/ModalLayout";

registerLocale("es", es);

interface Movimiento {
  id: number;
  cuenta: string;
  fecha: string;
  recibo: string | number;
  monto: number;
  tipo: string;
  detalle: string;
}

export default function TesoroPage() {
  const r = useRouter();
  const [cuenta, setCuenta] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [searched, setSearched] = useState(false);

  // Modal states
  const [isOpenMovimiento, setIsOpenMovimiento] = useState(false);
  const [isOpenPase, setIsOpenPase] = useState(false);

  // Form states for Ingresar Movimiento
  const [movCuenta, setMovCuenta] = useState("");
  const [movTipo, setMovTipo] = useState("ingreso"); // ingreso or egreso
  const [movMonto, setMovMonto] = useState("");
  const [movFecha, setMovFecha] = useState("");
  const [movDetalle, setMovDetalle] = useState("");

  // Form states for Pase de Dinero
  const [paseOrigen, setPaseOrigen] = useState("");
  const [paseDestino, setPaseDestino] = useState("");
  const [paseMonto, setPaseMonto] = useState("");
  const [paseDetalle, setPaseDetalle] = useState("");

  const cuentas = [
    { id: 1, label: "Banco Galicia - CAJA DE AHORRO" },
    { id: 2, label: "Banco Nación - CUENTA CORRIENTE" },
    { id: 3, label: "Caja Chica - EFECTIVO PESOS" },
    { id: 4, label: "Caja Chica - EFECTIVO DÓLARES" },
  ];

  const [movimientos, setMovimientos] = useState<Movimiento[]>([
    {
      id: 1,
      cuenta: "Banco Galicia - CAJA DE AHORRO",
      fecha: "10/06/2026",
      recibo: "RC-00125",
      monto: 1000000,
      tipo: "reserva",
      detalle: "Seña Reserva MDQ #1542",
    },
    {
      id: 2,
      cuenta: "Banco Galicia - CAJA DE AHORRO",
      fecha: "09/06/2026",
      recibo: "OP-00084",
      monto: -3000000,
      tipo: "pago",
      detalle: "PAGO SEÑA HOTEL GARDEN",
    },
    {
      id: 3,
      cuenta: "Banco Nación - CUENTA CORRIENTE",
      fecha: "06/06/2026",
      recibo: "RC-00121",
      monto: 1500000,
      tipo: "reserva",
      detalle: "Cobro Reserva BRC #9902",
    },
  ]);

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

  // Calculate totals dynamically from current state
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

  // Submit hander for Ingresar Movimiento
  const handleSubmitMovimiento = () => {
    if (!movCuenta || !movMonto || !movFecha || !movDetalle.trim()) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    const valorMonto = parseFloat(movMonto);
    const montoFinal = movTipo === "egreso" ? -Math.abs(valorMonto) : Math.abs(valorMonto);

    const nuevoMov: Movimiento = {
      id: Date.now(),
      cuenta: movCuenta,
      fecha: new Date(movFecha + "T12:00:00").toLocaleDateString("es-AR"),
      recibo: `MAN-${Math.floor(100 + Math.random() * 900)}`,
      monto: montoFinal,
      tipo: movTipo,
      detalle: movDetalle.toUpperCase(),
    };

    setMovimientos((prev) => [nuevoMov, ...prev]);
    setIsOpenMovimiento(false);
    toast.success("Movimiento registrado con éxito");

    // Clear form
    setMovCuenta("");
    setMovMonto("");
    setMovFecha("");
    setMovDetalle("");
  };

  // Submit handler for Pase de Dinero
  const handleSubmitPase = () => {
    if (!paseOrigen || !paseDestino || !paseMonto || !paseDetalle.trim()) {
      toast.error("Por favor complete todos los campos");
      return;
    }
    if (paseOrigen === paseDestino) {
      toast.error("La cuenta origen y destino deben ser diferentes");
      return;
    }

    const montoVal = Math.abs(parseFloat(paseMonto));
    const fechaActualStr = new Date().toLocaleDateString("es-AR");

    // Creates two movements: one egreso in origin, one ingreso in destination
    const egresoMov: Movimiento = {
      id: Date.now(),
      cuenta: paseOrigen,
      fecha: fechaActualStr,
      recibo: `TRF-${Math.floor(100 + Math.random() * 900)}`,
      monto: -montoVal,
      tipo: "egreso_pase",
      detalle: `PASE DE DINERO A: ${paseDestino.toUpperCase()}`,
    };

    const ingresoMov: Movimiento = {
      id: Date.now() + 1,
      cuenta: paseDestino,
      fecha: fechaActualStr,
      recibo: egresoMov.recibo,
      monto: montoVal,
      tipo: "ingreso_pase",
      detalle: `PASE DE DINERO DESDE: ${paseOrigen.toUpperCase()}`,
    };

    setMovimientos((prev) => [ingresoMov, egresoMov, ...prev]);
    setIsOpenPase(false);
    toast.success("Pase de dinero realizado con éxito");

    // Clear form
    setPaseOrigen("");
    setPaseDestino("");
    setPaseMonto("");
    setPaseDetalle("");
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
            className="w-full border border-black shadow-md shadow-black/40 rounded-sm py-2.5 px-3 text-black/80 font-medium  focus:outline-none focus:ring-2 focus:ring-primary bg-white">
            <option value="">Seleccione una cuenta para filtrar</option>
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
            type="submit"
            className="w-full bg-primary md:text-lg text-white shadow-lg shadow-black/60 font-medium py-2.5 rounded-md hover:bg-blue-700 transition-colors">
            Buscar Movimientos
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
                <span className="font-bold text-sm md:text-base">
                  Saldo Total
                </span>
                <span className="font-bold text-sm md:text-base text-black">
                  {formatMonto(saldoTotal)}
                </span>
              </div>
            </div>

            {/* Movimientos */}
            {movimientos
              .filter((mov) => !cuenta || mov.cuenta === cuenta)
              .map((mov) => (
                <div
                  key={mov.id}
                  className="border border-black rounded-md p-4 bg-white hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-3">
                      <p className="font-semibold text-sm md:text-base text-black">
                        {mov.cuenta}
                      </p>
                      <p className="text-sm">
                        Fecha: <span className="font-bold text-gray-700">{mov.fecha}</span>
                      </p>
                      <p className="text-sm">
                        Comprobante / Nro: <span className="font-bold text-gray-700">{mov.recibo}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Detalle: <span className="font-bold text-gray-800">{mov.detalle}</span>
                      </p>
                    </div>
                    <span
                      className={`font-bold text-sm md:text-base shrink-0 ml-4 ${mov.monto >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                      {formatMonto(mov.monto)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal: Ingresar Movimiento */}
      {isOpenMovimiento && (
        <ModalLayout
          title="Ingresar Movimiento Manual"
          setModalOpen={() => setIsOpenMovimiento(false)}
          onSubmit={handleSubmitMovimiento}
        >
          <div className="flex flex-col gap-4 text-black">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Cuenta / Caja *</label>
              <select
                required
                value={movCuenta}
                onChange={(e) => setMovCuenta(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
              >
                <option value="">Seleccione cuenta</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-700">Tipo de Movimiento *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="movTipo"
                    value="ingreso"
                    checked={movTipo === "ingreso"}
                    onChange={() => setMovTipo("ingreso")}
                    className="w-4 h-4 accent-primary"
                  />
                  Ingreso / Entrada
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="movTipo"
                    value="egreso"
                    checked={movTipo === "egreso"}
                    onChange={() => setMovTipo("egreso")}
                    className="w-4 h-4 accent-primary"
                  />
                  Egreso / Salida
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Monto *</label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                placeholder="Ej: 50000"
                value={movMonto}
                onChange={(e) => setMovMonto(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Fecha del Movimiento *</label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                value={movFecha}
                onChange={(e) => setMovFecha(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Concepto / Detalle *</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                placeholder="Ej. Pago servicio telefónico, Ajuste caja"
                value={movDetalle}
                onChange={(e) => setMovDetalle(e.target.value)}
              />
            </div>
          </div>
        </ModalLayout>
      )}

      {/* Modal: Pase de Dinero */}
      {isOpenPase && (
        <ModalLayout
          title="Registrar Pase de Dinero (Transferencia Interna)"
          setModalOpen={() => setIsOpenPase(false)}
          onSubmit={handleSubmitPase}
        >
          <div className="flex flex-col gap-4 text-black">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Cuenta de Origen *</label>
              <select
                required
                value={paseOrigen}
                onChange={(e) => setPaseOrigen(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
              >
                <option value="">Seleccione origen</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Cuenta de Destino *</label>
              <select
                required
                value={paseDestino}
                onChange={(e) => setPaseDestino(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
              >
                <option value="">Seleccione destino</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Monto del Pase *</label>
              <input
                type="number"
                required
                min="0.01"
                step="any"
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                placeholder="Ej: 150000"
                value={paseMonto}
                onChange={(e) => setPaseMonto(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Comentario / Motivo *</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white"
                placeholder="Ej. Retiro caja chica para depósito bancario"
                value={paseDetalle}
                onChange={(e) => setPaseDetalle(e.target.value)}
              />
            </div>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}

