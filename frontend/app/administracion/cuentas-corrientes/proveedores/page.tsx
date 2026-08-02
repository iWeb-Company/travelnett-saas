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
import DateInput from "@/app/components/DateComponent";
import ModalLayout from "@/app/components/ModalLayout";
import Administracion from "@/app/components/icons/home/Administracion";
import { Hotel, TransportCompany } from "@/app/types";

interface FormDataType {
  type: 'consumo' | 'pago';
  provider: "hotel" | "transporte";
  providerId: string;
  date: string;
  detail: string;
  ammount: string;
  paymentMethod: 'transferencia' | 'efectivo' | 'tarjeta';
  account: string;
}

interface MovimientoRow {
  id: string;
  date: string | null;
  type: string | null;
  detail: string | null;
  amount: number | null;
  provider_type: string | null;
  hotel_id: string | null;
  transport_id: string | null;
  transf_account: string | null;
}

export default function CuentasCorrientesProveedoresPage() {
  const r = useRouter();
  const { user } = useAuth();

  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoteles, setHoteles] = useState<Hotel[]>([]);
  const [transportes, setTransportes] = useState<TransportCompany[]>([]);
  const [cuentas, setCuentas] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoRow[]>([]);
  const [searched, setSearched] = useState(false);

  // Filtros mutuamente excluyentes
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedTransporte, setSelectedTransporte] = useState("");

  // Date filters
  const [fechaCreaDesde, setFechaCreaDesde] = useState("");
  const [fechaCreaHasta, setFechaCreaHasta] = useState("");

  const [formData, setFormData] = useState<FormDataType>({
    type: 'pago',
    provider: 'hotel',
    providerId: '',
    date: '',
    detail: '',
    ammount: '',
    paymentMethod: 'transferencia',
    account: '',
  });

  const paymentMethods: ('transferencia' | 'efectivo' | 'tarjeta')[] = ['transferencia', 'efectivo', 'tarjeta'];
  const paymentMethodLabels: Record<string, string> = {
    transferencia: 'Transferencia',
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
  };

  const cyclePaymentMethod = () => {
    const currentIndex = paymentMethods.indexOf(formData.paymentMethod);
    const nextIndex = (currentIndex + 1) % paymentMethods.length;
    const nextMethod = paymentMethods[nextIndex];
    setFormData({
      ...formData,
      paymentMethod: nextMethod,
      account: nextMethod !== 'transferencia' ? '' : formData.account,
    });
  };

  const loadProviders = async () => {
    if (!user?.iweb_client_id) return;
    setLoading(true);
    try {
      const [hotelData, transportData, cuentasData] = await Promise.all([
        apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_transport_companies", user.iweb_client_id).catch(() => []),
        apiClient.getAccounts(user.iweb_client_id).catch(() => []),
      ]);
      setHoteles(hotelData);
      setTransportes(transportData);
      setCuentas(cuentasData);
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
      const data: MovimientoRow[] = await apiClient.getCCProvidersConsumptionPayments(user.iweb_client_id);
      setMovimientos(data);
      setSearched(true);
    } catch {
      toast.error("Error al consultar movimientos");
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setSelectedHotel("");
    setSelectedTransporte("");
    setFechaCreaDesde("");
    setFechaCreaHasta("");
    setSearched(false);
    setMovimientos([]);
  };

  const handleSubmitModal = async () => {
    if (!user?.iweb_client_id) return;
    if (!formData.providerId) {
      toast.error("Seleccioná un proveedor");
      return;
    }
    if (!formData.ammount || isNaN(Number(formData.ammount))) {
      toast.error("Ingresá un monto válido");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        iweb_client_id: user.iweb_client_id,
        provider_type: formData.provider,
        hotel_id: formData.provider === 'hotel' ? formData.providerId : null,
        transport_id: formData.provider === 'transporte' ? formData.providerId : null,
        date: formData.date || null,
        detail: formData.detail || null,
        type: formData.type,
        amount: Number(formData.ammount),
        transf_account: formData.type === 'pago' && formData.paymentMethod === 'transferencia' ? formData.account : null,
      };

      await apiClient.createCCProviderConsumptionPayment(payload);
      toast.success(`${formData.type === 'pago' ? 'Pago' : 'Consumo'} registrado correctamente`);

      // Reset form
      setFormData({
        type: 'pago',
        provider: 'hotel',
        providerId: '',
        date: '',
        detail: '',
        ammount: '',
        paymentMethod: 'transferencia',
        account: '',
      });
      setModal(false);

      // Reload data if we already searched
      if (searched && user?.iweb_client_id) {
        const data = await apiClient.getCCProvidersConsumptionPayments(user.iweb_client_id);
        setMovimientos(data);
      }
    } catch {
      toast.error("Error al registrar movimiento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = async () => {
    if (filteredMovimientos.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("Cuenta Corriente Proveedor");

      const headerRow = ws.addRow(["Fecha", "Tipo", "Detalle", "Monto"]);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF000000" } };
        cell.alignment = { horizontal: "center" };
      });

      filteredMovimientos.forEach((mov) => {
        const tipoLabel = mov.type === 'consumo' ? 'Consumo' : 'Pago';
        ws.addRow([
          mov.date ? new Date(mov.date).toLocaleDateString("es-AR") : "",
          tipoLabel,
          mov.detail || "",
          mov.amount || 0,
        ]);
      });

      const totRow = ws.addRow(["", "", "TOTAL CONSUMOS:", totalConsumos]);
      totRow.eachCell((cell) => { cell.font = { bold: true }; });
      const totRow2 = ws.addRow(["", "", "TOTAL PAGOS:", totalPagos]);
      totRow2.eachCell((cell) => { cell.font = { bold: true }; });
      const totRow3 = ws.addRow(["", "", "SALDO:", saldoFinal]);
      totRow3.eachCell((cell) => { cell.font = { bold: true }; });

      ws.columns = [
        { width: 14 }, { width: 14 }, { width: 36 }, { width: 18 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Cuenta_Corriente_Proveedor.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Archivo exportado correctamente");
    } catch {
      toast.error("Error al exportar a Excel");
    }
  };

  // Filtrado por proveedor y fechas
  const filteredMovimientos = movimientos.filter((mov) => {
    // Filtrar por hotel seleccionado
    if (selectedHotel) {
      if (mov.provider_type !== 'hotel' || mov.hotel_id !== selectedHotel) return false;
    }
    // Filtrar por transporte seleccionado
    if (selectedTransporte) {
      if (mov.provider_type !== 'transporte' || mov.transport_id !== selectedTransporte) return false;
    }
    // Filtrar por rango de fechas
    if (fechaCreaDesde && mov.date) {
      if (mov.date < fechaCreaDesde) return false;
    }
    if (fechaCreaHasta && mov.date) {
      if (mov.date > fechaCreaHasta) return false;
    }
    return true;
  });

  const totalConsumos = filteredMovimientos
    .filter((m) => m.type === 'consumo')
    .reduce((acc, m) => acc + (m.amount || 0), 0);
  const totalPagos = filteredMovimientos
    .filter((m) => m.type === 'pago')
    .reduce((acc, m) => acc + (m.amount || 0), 0);
  const saldoFinal = totalConsumos - totalPagos;

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
      <section className="flex flex-col max-w-4xl mx-auto text-black">
        <button onClick={() => setModal(true)} className="text-primary font-bold py-2 px-4"> Agregar Consumo/Pago</button>
        {/* Filters Form */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col w-full gap-5 p-6">

          {/* Provider type toggle */}
          <label className="font-semibold text-center text-black">Fecha de consumo/pago</label>

          {/* Fecha de creación */}
          <div className="flex items-center w-full gap-3">
            <DateInput
              placeholder="Desde"
              value={fechaCreaDesde}
              onChange={setFechaCreaDesde}
            />
            <DateInput
              placeholder="Hasta"
              value={fechaCreaHasta}
              onChange={setFechaCreaHasta}
            />
          </div>

          <div className="flex flex-col gap-3">
            <select
              value={selectedTransporte}
              onChange={(e) => {
                setSelectedTransporte(e.target.value);
                if (e.target.value) setSelectedHotel("");
              }}
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Empresa de transporte</option>
              {transportes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={selectedHotel}
              onChange={(e) => {
                setSelectedHotel(e.target.value);
                if (e.target.value) setSelectedTransporte("");
              }}
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Hotel</option>
              {hoteles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={loading || searching}
            className="bg-primary text-white rounded-lg px-4 py-2.5 font-bold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
            type="submit">
            {searching ? "Buscando..." : "Buscar"}
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
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No hay movimientos registrados para el proveedor y rango seleccionado.
                      </td>
                    </tr>
                  ) : (
                    filteredMovimientos.map((mov, i) => (
                      <tr key={mov.id || i} className="divide-x divide-black">
                        <td className="py-3 px-4">
                          {mov.date ? new Date(mov.date + "T00:00:00").toLocaleDateString("es-AR") : "-"}
                        </td>
                        <td className="py-3 px-4 text-black font-bold">
                          {mov.type === 'consumo' ? 'Consumo' : 'Pago'}
                        </td>
                        <td className="py-3 px-4">{mov.detail || "-"}</td>
                        <td className={`py-3 px-4 text-right font-bold ${mov.type === 'consumo' ? 'text-red-600' : 'text-green-600'}`}>
                          {mov.type === 'consumo' ? '-' : '+'}{formatMonto(mov.amount || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <button onClick={handleExportExcel} className="py-2 px-4 rounded-lg font-medium w-full flex items-center justify-center gap-2">
              Exportar <Excel />
            </button>
            {/* Resumen de la Cuenta Corriente */}
            <div className="p-5 w-full">
              <h4 className="font-bold text-primary text-center text-sm md:text-base pb-2 mb-3">
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
      {modal &&
        <ModalLayout
          setModalOpen={() => setModal(false)}
          title="Agregar Consumo/Pago"
          svg={<Administracion />}
          onSubmit={handleSubmitModal}
        >
          <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            {/* Tipo: Pago / Consumo */}
            <button
              type="button"
              className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
              onClick={() => {
                setFormData({ ...formData, type: formData.type === "pago" ? "consumo" : "pago" })
              }}>{formData.type === "pago" ? "Pago" : "Consumo"}
            </button>
            {/* Tipo de proveedor: Hotel / Transporte */}
            <button
              type="button"
              className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
              onClick={() => {
                const next = formData.provider === "hotel" ? "transporte" : "hotel";
                setFormData({ ...formData, provider: next, providerId: '' })
              }}>{formData.provider === "hotel" ? "Hotel" : "Empresa de Transporte"}
            </button>
            {/* Selector de proveedor específico */}
            <select
              className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
              value={formData.providerId}
              onChange={(e) =>
                setFormData({ ...formData, providerId: e.target.value })
              }
            >
              {formData.provider === "hotel" ? (
                <>
                  <option value="">Seleccionar hotel</option>
                  {hoteles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  <option value="">Seleccionar empresa de transporte</option>
                  {transportes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {/* Fecha */}
            <DateInput
              value={formData.date}
              onChange={(val) => setFormData({ ...formData, date: val })}
            />
            {/* Detalle */}
            <input
              placeholder="Detalle"
              className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
              type="text"
              value={formData.detail}
              onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
            />
            {/* Campos condicionales: solo si type === 'pago' */}
            {formData.type === 'pago' && (
              <>
                {/* Switch rotativo de método de pago */}
                <button
                  type="button"
                  className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
                  onClick={cyclePaymentMethod}>
                  {paymentMethodLabels[formData.paymentMethod]}
                </button>
                {/* Cuenta: solo si el método es transferencia */}
                {formData.paymentMethod === 'transferencia' && (
                  <select
                    className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
                    value={formData.account}
                    onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  >
                    <option value="">Seleccionar una cuenta</option>
                    {cuentas.map((cuenta) => (
                      <option className="text-black" key={cuenta.id} value={cuenta.id}>
                        {cuenta.name}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
            {/* Monto */}
            <input
              placeholder="Monto"
              className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
              type="text"
              value={formData.ammount}
              onChange={(e) => setFormData({ ...formData, ammount: e.target.value })}
            />
          </form>
        </ModalLayout>}
    </Container>
  );
}
