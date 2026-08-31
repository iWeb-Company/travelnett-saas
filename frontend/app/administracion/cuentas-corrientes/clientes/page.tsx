"use client";
import Link from "next/link";
import Container from "@/app/components/Container";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import Pagination from "@/app/components/Pagination";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";
import DateInput from "@/app/components/DateComponent";
import { filterAndSortClients } from "@/app/utils/clientSearch";

interface Cliente {
  id: string;
  name?: string;
  nombre?: string;
  name_system?: string;
  complete_name?: string;
  username?: string;
}

interface MovimientoCliente {
  id?: string;
  reserva_id?: string;
  fecha: string;
  reserva: string;
  cliente: string;
  client_id: string;
  detalle: string;
  neto: number;
  cobros: number;
  saldo: number;
}

export default function CuentasCorrientesClientesPage() {
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [searched, setSearched] = useState(false);
  const [movimientos, setMovimientos] = useState<MovimientoCliente[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(movimientos.length / pageSize);
  const paginatedMovimientos = movimientos.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const filteredClients = useMemo(
    () => filterAndSortClients(clientes, clientSearch),
    [clientes, clientSearch],
  );

  // Date filters
  const [fechaCreaDesde, setFechaCreaDesde] = useState("");
  const [fechaCreaHasta, setFechaCreaHasta] = useState("");
  const [fechaInDesde, setFechaInDesde] = useState("");
  const [fechaInHasta, setFechaInHasta] = useState("");

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
    const num = Math.round(Number(monto) || 0);
    const prefix = num < 0 ? "-" : "";
    return `${prefix}$${Math.abs(num).toLocaleString("es-AR")}`;
  };

  const cleanDetalle = (detalle?: string) => {
    if (!detalle) return "";
    return detalle.replace(/\s*\[.*?\]\s*$/, "").trim();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.iweb_client_id) return;

    setSearching(true);
    try {
      const data = await apiClient.getSaldosClientes(user.iweb_client_id, {
        clientId: selectedCliente || undefined,
        fechaCreaDesde: fechaCreaDesde || undefined,
        fechaCreaHasta: fechaCreaHasta || undefined,
        fechaInDesde: fechaInDesde || undefined,
        fechaInHasta: fechaInHasta || undefined,
      });

      setMovimientos(data);
      setSearched(true);
    } catch {
      toast.error("Error al buscar cuentas corrientes de clientes");
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setSelectedCliente("");
    setClientSearch("");
    setFechaCreaDesde("");
    setFechaCreaHasta("");
    setFechaInDesde("");
    setFechaInHasta("");
    setSearched(false);
    setMovimientos([]);
  };

  const handleExportExcel = async () => {
    if (movimientos.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("Cuenta Corriente Clientes");

      const headerRow = ws.addRow(["Fecha", "Reserva", "Cliente", "Descripción", "Consumo", "Pago", "Saldo"]);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF000000" } };
        cell.alignment = { horizontal: "center" };
      });

      movimientos.forEach((mov) => {
        ws.addRow([
          mov.fecha || "",
          mov.reserva || "",
          mov.cliente || "",
          mov.detalle || "",
          mov.neto || 0,
          mov.cobros || 0,
          mov.saldo || 0,
        ]);
      });

      const totRow = ws.addRow(["", "", "", "TOTAL CONSUMOS:", totalConsumos]);
      totRow.eachCell((cell) => { cell.font = { bold: true }; });
      const totRow2 = ws.addRow(["", "", "", "TOTAL PAGOS:", totalPagos]);
      totRow2.eachCell((cell) => { cell.font = { bold: true }; });
      const totRow3 = ws.addRow(["", "", "", "SALDO TOTAL:", saldoFinal]);
      totRow3.eachCell((cell) => { cell.font = { bold: true }; });

      ws.columns = [
        { width: 14 }, { width: 16 }, { width: 25 }, { width: 36 }, { width: 16 }, { width: 16 }, { width: 16 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Cuenta_Corriente_Clientes.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Archivo exportado correctamente");
    } catch {
      toast.error("Error al exportar a Excel");
    }
  };

  const totalConsumos = movimientos.reduce((acc, m) => acc + (m.neto || 0), 0);
  const totalPagos = movimientos.reduce((acc, m) => acc + (m.cobros || 0), 0);
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
                <DateInput
                  placeholder="Desde"
                  value={fechaCreaDesde}
                  onChange={setFechaCreaDesde}
                />
                <span className="text-xs text-gray-400 font-semibold">a</span>
                <DateInput
                  placeholder="Hasta"
                  value={fechaCreaHasta}
                  onChange={setFechaCreaHasta}
                />
              </div>
            </div>

            {/* Fecha de IN */}
            <div className="flex flex-col gap-2">
              <p className="font-bold text-xs text-gray-700 uppercase tracking-wider">Fecha de Entrada (IN)</p>
              <div className="flex items-center gap-3">
                <DateInput
                  placeholder="Desde"
                  value={fechaInDesde}
                  onChange={setFechaInDesde}
                />
                <span className="text-xs text-gray-400 font-semibold">a</span>
                <DateInput
                  placeholder="Hasta"
                  value={fechaInHasta}
                  onChange={setFechaInHasta}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Cliente</label>
            <input
              type="text"
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
              placeholder="Filtrar clientes"
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los Clientes</option>
              {filteredClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.complete_name || c.name_system || c.name || c.nombre || c.username}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={searching}
            className="bg-primary text-white rounded-lg px-4 py-2.5 font-bold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
            type="submit">
            {searching ? "Buscando..." : "Buscar"}
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
                  {searching ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse divide-y divide-black">
                        <td className="py-3 px-4 border-r border-black"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="py-3 px-4 border-r border-black"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="py-3 px-4 border-r border-black"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                        <td className="py-3 px-4 border-b border-black text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No hay movimientos registrados para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    paginatedMovimientos.map((mov, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 divide-y divide-black">
                        <td className="py-3 px-4 border-r border-black">{mov.fecha || "-"}</td>
                        <td className="py-3 px-4 border-r border-black font-bold">
                          {mov.reserva_id || mov.id ? (
                            <Link
                              href={`/web/reservas/modificar-reserva/${mov.reserva_id || mov.id}`}
                              className="text-primary hover:underline"
                            >
                              {mov.reserva}
                            </Link>
                          ) : (
                            <span className="text-primary">{mov.reserva}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 border-r border-black">{cleanDetalle(mov.detalle)}</td>
                        <td className={`py-3 px-4 text-right border-b border-black font-bold ${mov.saldo > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatMonto(mov.saldo)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={movimientos.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />

            <button onClick={handleExportExcel} className="font-semibold mx-auto text-black flex items-center justify-center gap-2 text-sm md:text-base pb-2 mb-3 hover:underline">
              Exportar <Excel />
            </button>

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
