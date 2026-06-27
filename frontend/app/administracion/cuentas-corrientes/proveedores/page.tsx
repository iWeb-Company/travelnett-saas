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

interface ProviderItem {
  id: string;
  name?: string;
  nombre?: string;
}

export default function CuentasCorrientesProveedoresPage() {
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [providerType, setProviderType] = useState<"hotel" | "transporte">("hotel");
  const [providers, setProviders] = useState<ProviderItem[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [searched, setSearched] = useState(false);

  // Date filters
  const [fechaCreaDesde, setFechaCreaDesde] = useState("");
  const [fechaCreaHasta, setFechaCreaHasta] = useState("");
  const [fechaInDesde, setFechaInDesde] = useState("");
  const [fechaInHasta, setFechaInHasta] = useState("");

  // Mock ledger movements for suppliers
  const movimientos = [
    {
      fecha: "01/06/2026",
      reserva: "MDQ #1542",
      descripcion: "Hospedaje Garden DBL MAT x7 noches",
      gasto: 350000,
      pago: 100000,
      saldo: 250000,
      proveedorId: "hotel-garden-id", // mock garden id
      proveedorTipo: "hotel",
    },
    {
      fecha: "02/06/2026",
      reserva: "MDQ #1541",
      descripcion: "Hospedaje Garden SGL IND x5 noches",
      gasto: 200000,
      pago: 200000,
      saldo: 0,
      proveedorId: "hotel-garden-id",
      proveedorTipo: "hotel",
    },
    {
      fecha: "04/06/2026",
      reserva: "BRC #9902",
      descripcion: "Traslado Charter Aéreo / Bus",
      gasto: 800000,
      pago: 400000,
      saldo: 400000,
      proveedorId: "transporte-charter-id",
      proveedorTipo: "transporte",
    },
  ];

  const loadProviders = async () => {
    if (!user?.iweb_client_id) return;
    setLoading(true);
    try {
      const parameterName = providerType === "hotel" ? "get_hotels" : "get_transport_companies";
      const data = await apiClient.getParameters(parameterName, user.iweb_client_id).catch(() => []);
      setProviders(data);
    } catch {
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadProviders();
    }
  }, [user?.iweb_client_id, providerType]);

  const formatMonto = (monto: number) => {
    const prefix = monto < 0 ? "-" : "";
    return `${prefix}$${Math.abs(monto).toLocaleString("es-AR")}`;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const handleClear = () => {
    setSelectedProvider("");
    setFechaCreaDesde("");
    setFechaCreaHasta("");
    setFechaInDesde("");
    setFechaInHasta("");
    setSearched(false);
  };

  const handleExportExcel = () => {
    toast.success("Exportando cuenta corriente de proveedor a Excel...");
  };

  // Filter movements by selected provider
  const filteredMovimientos = movimientos.filter((mov) => {
    if (mov.proveedorTipo !== providerType) return false;
    if (!selectedProvider) return true;

    // In a real database, we would match IDs. For this layout, we'll return items.
    return true; // Keep list to show maquetación correctly
  });

  const totalGastos = filteredMovimientos.reduce((acc, m) => acc + m.gasto, 0);
  const totalPagos = filteredMovimientos.reduce((acc, m) => acc + m.pago, 0);
  const saldoFinal = totalGastos - totalPagos;

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
        Cuentas corrientes de Proveedores
      </h3>
      <button className="bg-primary text-white py-2 px-4 rounded-lg font-medium">Agregar Consumo/Pago</button>
      <section className="my-5 flex flex-col max-w-4xl mx-auto text-black">
        {/* Filters Form */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col w-full gap-5 bg-white p-6 border border-gray-200 rounded-xl shadow-sm">

          {/* Provider type toggle */}
          <label className="font-semibold text-center text-black">Fecha de consumo/pago</label>

          {/* Fecha de creación */}
          <div className="flex items-center w-full gap-3">
            <input
              value={fechaCreaDesde}
              onChange={(e) => setFechaCreaDesde(e.target.value)}
              className="w-1/2 border border-gray-300 bg-white text-gray-800 p-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              type="date"
            />
            <input
              value={fechaCreaHasta}
              onChange={(e) => setFechaCreaHasta(e.target.value)}
              className="w-1/2 border border-gray-300 bg-white text-gray-800 p-2 text-sm rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
              type="date"
            />
          </div>

          <div className="flex flex-col gap-3">
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los {providerType === "hotel" ? "Hoteles" : "Transportistas"}</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.nombre}
                </option>
              ))}
            </select>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Todos los {providerType === "hotel" ? "Hoteles" : "Transportistas"}</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || p.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={loading}
            className="bg-primary text-white rounded-lg px-4 py-2.5 font-bold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
            type="submit">
            Buscar
          </button>
        </form>

        {/* Resultados */}
        {searched && (
          <div className="flex flex-col text-black mt-6">
            {/* Header controls */}
            <div className="flex justify-end mb-3">
              <button
                onClick={handleClear}
                className="text-xs md:text-sm text-black font-semibold hover:underline">
                Limpiar búsqueda
              </button>
            </div>

            {/* Tabla de movimientos */}
            <div className="overflow-x-auto border shadow-sm bg-white mb-6">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="text-white bg-black">
                  <tr className="divide-x divide-white">
                    <th className="py-3 px-4 font-bold">Fecha</th>
                    <th className="py-3 px-4 font-bold">Tipo</th>
                    <th className="py-3 px-4 font-bold">Detalle</th>
                    <th className="py-3 px-4 font-bold text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredMovimientos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No hay movimientos registrados para el proveedor y rango seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredMovimientos.map((mov, i) => (
                      <tr key={i} className="divide-x divide-black">
                        <td className="py-3 px-4">{mov.fecha}</td>
                        <td className="py-3 px-4 text-black font-bold">{mov.reserva}</td>
                        <td className="py-3 px-4">{mov.descripcion}</td>
                        <td className={`py-3 px-4 text-right font-bold ${mov.saldo > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatMonto(mov.saldo)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button className="py-2 px-4 rounded-lg font-medium w-full">Exportar</button>
            {/* Resumen de la Cuenta Corriente */}
            <div className="p-5 w-full">
              <h4 className="font-bold text-primary text-center text-sm md:text-base pb-2 mb-3">
                Resumen de la Cuenta Corriente
              </h4>
              <div className="text-xs md:text-sm flex flex-col gap-2 font-medium">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total de consumos</span>
                  <span className="font-bold text-gray-900">{formatMonto(totalGastos)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total de pagos</span>
                  <span className="font-bold text-green-600">{formatMonto(totalPagos)}</span>
                </div>
                <div className="my-1"></div>
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

