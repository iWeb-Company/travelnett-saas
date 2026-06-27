"use client";
import Link from "next/link";
import Container from "@/app/components/Container";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";

interface Cliente {
  id: string;
  name?: string;
  nombre?: string;
  username?: string;
}

export default function CuentasCorrientesClientesPage() {
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [searched, setSearched] = useState(false);

  // Date filters
  const [fechaCreaDesde, setFechaCreaDesde] = useState("");
  const [fechaCreaHasta, setFechaCreaHasta] = useState("");
  const [fechaInDesde, setFechaInDesde] = useState("");
  const [fechaInHasta, setFechaInHasta] = useState("");

  // Mock ledger movements
  const movimientos = [
    {
      fecha: "01/06/2026",
      reserva: "MDQ #1542",
      descripcion: "DEMARCO VALENTÍN x2 MAT",
      consumo: 400000,
      pago: 150000,
      saldo: 250000,
      cliente: "Mio Turismo",
    },
    {
      fecha: "02/06/2026",
      reserva: "MDQ #1541",
      descripcion: "GÓMEZ CARLOS x1 IND",
      consumo: 250000,
      pago: 250000,
      saldo: 0,
      cliente: "Mio Turismo",
    },
    {
      fecha: "05/06/2026",
      reserva: "BRC #9902",
      descripcion: "FERNÁNDEZ JORGE x3 TPL",
      consumo: 600000,
      pago: 150000,
      saldo: 450000,
      cliente: "Jorge Fernández",
    },
  ];

  const loadClientes = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const data = await apiClient.getParameters("get_clients", user.iweb_client_id).catch(() => []);
      setClientes(data);
    } catch {
      toast.error("Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadClientes();
    }
  }, [user?.iweb_client_id]);

  const formatMonto = (monto: number) => {
    const prefix = monto < 0 ? "-" : "";
    return `${prefix}$${Math.abs(monto).toLocaleString("es-AR")}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const handleClear = () => {
    setSelectedCliente("");
    setFechaCreaDesde("");
    setFechaCreaHasta("");
    setFechaInDesde("");
    setFechaInHasta("");
    setSearched(false);
  };

  const handleExportExcel = () => {
    toast.success("Exportando cuenta corriente a Excel...");
  };

  // Filter movements by client
  const filteredMovimientos = movimientos.filter((mov) => {
    if (!selectedCliente) return true;
    const clientObj = clientes.find(c => c.id === selectedCliente);
    const clientName = clientObj?.name || clientObj?.nombre || clientObj?.username || "";
    return mov.cliente.toLowerCase() === clientName.toLowerCase();
  });

  const totalConsumos = filteredMovimientos.reduce((acc, m) => acc + m.consumo, 0);
  const totalPagos = filteredMovimientos.reduce((acc, m) => acc + m.pago, 0);
  const saldoFinal = totalConsumos - totalPagos;

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

      <h3 className="text-center font-semibold text-lg text-black mb-4">
        Cuentas corrientes de Clientes
      </h3>

      <section className="my-5 flex flex-col max-w-4xl mx-auto text-black">
        {/* Filters Form */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col w-full gap-5 bg-white p-6 border border-gray-200 rounded-xl shadow-sm">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Fecha de creación */}
            <div className="flex flex-col gap-2">
              <p className="font-bold text-xs text-gray-700 uppercase tracking-wider">Fecha de creación</p>
              <div className="flex items-center gap-3">
                <input
                  value={fechaCreaDesde}
                  onChange={(e) => setFechaCreaDesde(e.target.value)}
                  className="w-full border border-gray-300 bg-white text-gray-800 p-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  type="date"
                />
                <span className="text-xs text-gray-400 font-semibold">a</span>
                <input
                  value={fechaCreaHasta}
                  onChange={(e) => setFechaCreaHasta(e.target.value)}
                  className="w-full border border-gray-300 bg-white text-gray-800 p-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  type="date"
                />
              </div>
            </div>

            {/* Fecha de IN */}
            <div className="flex flex-col gap-2">
              <p className="font-bold text-xs text-gray-700 uppercase tracking-wider">Fecha de Entrada (IN)</p>
              <div className="flex items-center gap-3">
                <input
                  value={fechaInDesde}
                  onChange={(e) => setFechaInDesde(e.target.value)}
                  className="w-full border border-gray-300 bg-white text-gray-800 p-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  type="date"
                />
                <span className="text-xs text-gray-400 font-semibold">a</span>
                <input
                  value={fechaInHasta}
                  onChange={(e) => setFechaInHasta(e.target.value)}
                  className="w-full border border-gray-300 bg-white text-gray-800 p-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                  type="date"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Cliente</label>
            <select
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los Clientes</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name || c.nombre || c.username}
                </option>
              ))}
            </select>
          </div>

          <button
            className="bg-primary text-white rounded-lg px-4 py-2.5 font-bold shadow hover:bg-blue-700 transition-colors"
            type="submit">
            Buscar
          </button>
        </form>

        {/* Resultados */}
        {searched && (
          <div className="flex flex-col text-black mt-6">
            {/* Header controls */}
            <div className="flex justify-between items-center mb-3">
              <button
                onClick={handleExportExcel}
                className="text-xs text-black font-semibold flex items-center gap-1 hover:underline"
              >
                Exportar a Excel
                <Excel />
              </button>
              <button
                onClick={handleClear}
                className="text-xs md:text-sm text-black font-semibold hover:underline">
                Limpiar búsqueda
              </button>
            </div>

            {/* Tabla de movimientos */}
            <div className="overflow-x-auto border border-black shadow-sm bg-white mb-6">
              <table className="w-full text-xs md:text-sm text-left text-gray-600 border-collapse">
                <thead className="text-white bg-black">
                  <tr className="divide-y divide-gray-100">
                    <th className="py-3 px-4 font-semibold border-r border-gray-100">Fecha</th>
                    <th className="py-3 px-4 font-semibold border-r border-gray-100">Reserva</th>
                    <th className="py-3 px-4 font-semibold border-r border-gray-100">Descripcion</th>
                    <th className="py-3 px-4 font-semibold text-center">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredMovimientos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No hay movimientos registrados para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredMovimientos.map((mov, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 divide-y divide-black">
                        <td className="py-3 px-4 border-r border-black">{mov.fecha}</td>
                        <td className="py-3 px-4 border-r border-black text-primary font-bold">{mov.reserva}</td>
                        <td className="py-3 px-4 border-r border-black">{mov.descripcion}</td>
                        <td className={`py-3 px-4 text-right border-b border-black font-bold ${mov.saldo > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatMonto(mov.saldo)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button onClick={() => handleExportExcel()} className="font-semibold mx-auto text-black flex items-center justify-center gap-2 text-sm md:text-base pb-2 mb-3">Exportar<Excel /></button>
            {/* Resumen de la Cuenta Corriente */}
            <div className="ml-auto w-full">
              <h4 className="font-bold text-primary text-center text-sm md:text-base border-b border-gray-200 pb-2 mb-3">
                Resumen de la Cuenta Corriente
              </h4>
              <div className="text-xs md:text-sm flex flex-col gap-2 font-medium">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total de consumos</span>
                  <span className="font-bold text-gray-900">{formatMonto(totalConsumos)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total de pagos</span>
                  <span className="font-bold text-green-600">{formatMonto(totalPagos)}</span>
                </div>
                <div className="border-t border-gray-200 my-1"></div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-gray-900">Saldo</span>
                  <span className={`text-sm ${saldoFinal > 0 ? "text-red-600" : "text-gray-900"}`}>{formatMonto(saldoFinal)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </Container>
  );
}

