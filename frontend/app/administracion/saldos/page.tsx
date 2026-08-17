"use client";
import Link from "next/link";
import Container from "@/app/components/Container";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import Pagination from "@/app/components/Pagination";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";
import { Client } from "@/app/types";

interface SaldoRow {
  fecha: string;
  reserva: string;
  reserva_id: string;
  cliente: string;
  client_id: string;
  detalle: string;
  neto: number;
  cobros: number;
  saldo: number;
}

export default function SaldosPage() {
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [clientes, setClientes] = useState<Client[]>([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [searched, setSearched] = useState(false);
  const [movimientos, setMovimientos] = useState<SaldoRow[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(movimientos.length / pageSize);
  const paginatedMovimientos = movimientos.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const loadClientes = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const data = await apiClient.getParameters("get_clients", user.iweb_client_id).catch(() => []);
      setClientes(data);
    } catch {
      toast.error("Error al cargar listado de clientes");
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.iweb_client_id) return;
    setSearching(true);
    try {
      const data = await apiClient.getSaldosClientes(
        user.iweb_client_id,
        selectedCliente || undefined
      );
      setMovimientos(data);
      setSearched(true);
    } catch {
      toast.error("Error al consultar saldos");
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setSelectedCliente("");
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
      const ws = workbook.addWorksheet("Saldos Clientes");

      // Header row
      const headerRow = ws.addRow(["Fecha", "Reserva", "Cliente", "Detalle", "Neto", "Cobros", "Saldo"]);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF000000" } };
        cell.alignment = { horizontal: "center" };
      });

      // Data rows
      movimientos.forEach((mov) => {
        ws.addRow([mov.fecha, mov.reserva, mov.cliente, mov.detalle, mov.neto, mov.cobros, mov.saldo]);
      });

      // Totals row
      const totalNeto = movimientos.reduce((a, m) => a + m.neto, 0);
      const totalCobros = movimientos.reduce((a, m) => a + m.cobros, 0);
      const totalSaldo = movimientos.reduce((a, m) => a + m.saldo, 0);
      const totRow = ws.addRow(["", "", "", "TOTAL GENERAL:", totalNeto, totalCobros, totalSaldo]);
      totRow.eachCell((cell) => { cell.font = { bold: true }; });

      // Column widths
      ws.columns = [
        { width: 14 }, { width: 18 }, { width: 28 }, { width: 32 }, { width: 16 }, { width: 16 }, { width: 16 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Saldos_Clientes.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Archivo exportado correctamente");
    } catch {
      toast.error("Error al exportar a Excel");
    }
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
      <h3 className="text-center font-semibold text-lg text-black">
        Consulta de Saldos de Clientes
      </h3>
      <section className="my-5 flex flex-col max-w-4xl mx-auto">
        <form
          onSubmit={handleSearch}
          className="flex flex-col text-black w-full gap-4 bg-white p-6 border border-gray-200 rounded-xl shadow-sm">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-700">Seleccionar Cliente</label>
            <select
              value={selectedCliente}
              onChange={(e) => setSelectedCliente(e.target.value)}
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los Clientes</option>
              {clientes.map((c) => (
                <option className="text-black" key={c.id} value={c.id}>
                  {c.complete_name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="bg-primary text-white rounded-lg px-4 py-2.5 font-bold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
            type="submit"
            disabled={searching}>
            {searching ? "Buscando..." : "Buscar Saldos"}
          </button>
        </form>

        {/* Resultados */}
        {searched && (
          <div className="flex flex-col text-black mt-6">
            {/* Action Row */}
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
            <div className="overflow-x-auto  shadow-sm bg-white">
              <table className="w-full text-xs md:text-sm text-left text-gray-600 border-collapse">
                <thead className="text-white bg-black">
                  <tr className="divide-x divide-white">
                    <th className="py-3 px-4 font-bold text-center">Fecha IN</th>
                    <th className="py-3 px-4 font-bold text-center">Reserva</th>
                    <th className="py-3 px-4 font-bold">Cliente</th>
                    <th className="py-3 px-4 font-bold">Detalle</th>
                    <th className="py-3 px-4 font-bold text-center">Neto</th>
                    <th className="py-3 px-4 font-bold text-center">Cobros</th>
                    <th className="py-3 px-4 font-bold text-center">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {movimientos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No se encontraron saldos pendientes para este criterio.
                      </td>
                    </tr>
                  ) : (
                    paginatedMovimientos.map((mov, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 border-b border-black">
                        <td className="py-3 px-4 border border-black">{mov.fecha}</td>
                        <td className="py-3 px-4 border border-black text-black"><Link className="hover:underline text-primary" href={`/web/reservas/modificar-reserva/${mov.reserva_id}`}>{mov.reserva}</Link></td>
                        <td className="py-3 px-4 border border-black font-bold text-gray-800">{mov.cliente}</td>
                        <td className="py-3 px-4 border border-black">{mov.detalle}</td>
                        <td className="py-3 px-4 border border-black text-right text-gray-800">{formatMonto(mov.neto)}</td>
                        <td className="py-3 px-4 border border-black text-right text-green-600">{formatMonto(mov.cobros)}</td>
                        <td className={`py-3 px-4 border border-black text-right ${mov.saldo > 0 ? 'text-red-600' : 'text-gray-900'}`}>
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
          </div>
        )}
      </section>
    </Container>
  );
}
