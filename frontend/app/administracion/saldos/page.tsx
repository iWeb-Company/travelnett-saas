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

export default function SaldosPage() {
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState("");
  const [searched, setSearched] = useState(false);

  // Mock outstanding balances movements
  const [movimientos, setMovimientos] = useState([
    {
      fecha: "01/06/2026",
      reserva: "MDQ #1542",
      detalle: "DEMARCO VALENTÍN x2 MAT",
      neto: 400000,
      cobros: 150000,
      saldo: 250000,
      cliente: "Mio Turismo",
    },
    {
      fecha: "02/06/2026",
      reserva: "MDQ #1541",
      detalle: "GÓMEZ CARLOS x1 IND",
      neto: 250000,
      cobros: 250000,
      saldo: 0,
      cliente: "Mio Turismo",
    },
    {
      fecha: "05/06/2026",
      reserva: "BRC #9902",
      detalle: "FERNÁNDEZ JORGE x3 TPL",
      neto: 600000,
      cobros: 150000,
      saldo: 450000,
      cliente: "Jorge Fernández",
    },
  ]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const handleClear = () => {
    setSelectedCliente("");
    setSearched(false);
  };

  const handleExportExcel = () => {
    toast.success("Exportando saldos a Excel...");
  };

  // Filter movements by selected client (if any)
  const filteredMovimientos = movimientos.filter((mov) => {
    if (!selectedCliente) return true;

    // Match selectedCliente name or id
    const clientObj = clientes.find(c => c.id === selectedCliente);
    const clientName = clientObj?.name || clientObj?.nombre || clientObj?.username || "";
    return mov.cliente.toLowerCase() === clientName.toLowerCase();
  });

  const totalNeto = filteredMovimientos.reduce((acc, m) => acc + m.neto, 0);
  const totalCobros = filteredMovimientos.reduce((acc, m) => acc + m.cobros, 0);
  const totalSaldo = filteredMovimientos.reduce((acc, m) => acc + m.saldo, 0);

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
                <option key={c.id} value={c.id}>
                  {c.name || c.nombre || c.username}
                </option>
              ))}
            </select>
          </div>
          <button
            className="bg-primary text-white rounded-lg px-4 py-2.5 font-bold shadow hover:bg-blue-700 transition-colors"
            type="submit">
            Buscar Saldos
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
            <div className="overflow-x-auto border border-black shadow-sm bg-white">
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
                  {filteredMovimientos.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">
                        No se encontraron saldos pendientes para este criterio.
                      </td>
                    </tr>
                  ) : (
                    filteredMovimientos.map((mov, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 border-b border-black">
                        <td className="py-3 px-4 border border-black">{mov.fecha}</td>
                        <td className="py-3 px-4 border border-black text-primary font-bold">{mov.reserva}</td>
                        <td className="py-3 px-4 border border-black font-bold text-gray-800">{mov.cliente}</td>
                        <td className="py-3 px-4 border border-black">{mov.detalle}</td>
                        <td className="py-3 px-4 border border-black text-right text-gray-800">{formatMonto(mov.neto)}</td>
                        <td className="py-3 px-4 border border-black text-right text-green-600">{formatMonto(mov.cobros)}</td>
                        <td className={`py-3 px-4 border border-black text-right font-bold ${mov.saldo > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatMonto(mov.saldo)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredMovimientos.length > 0 && (
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50/80 font-bold text-gray-900">
                    <tr>
                      <td colSpan={4} className="py-3 px-4 text-right text-sm">TOTAL GENERAL:</td>
                      <td className="py-3 px-4 text-right text-sm">{formatMonto(totalNeto)}</td>
                      <td className="py-3 px-4 text-right text-sm text-green-600">{formatMonto(totalCobros)}</td>
                      <td className="py-3 px-4 text-right text-sm text-red-600">{formatMonto(totalSaldo)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </section>
    </Container>
  );
}

