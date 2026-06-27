"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import ModalLayout from "@/app/components/ModalLayout";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";

type PaymentMethod = "efectivo" | "tarjeta" | "transferencia";

interface Pago {
  id: string;
  fecha: string;
  tipo: string;
  monto: number;
  moneda: string;
  titular: string;
  observaciones: string;
  reciboNumero: string;
}

export default function PagosPage() {
  const r = useRouter();
  const [reservaBusqueda, setReservaBusqueda] = useState("");
  const [clienteSelect, setClienteSelect] = useState("");
  const [searched, setSearched] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tarjeta");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [modalOpenPago, setModalOpenPago] = useState(false);
  const [modalOpenRecibo, setModalOpenRecibo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Selected receipt for electronic receipt popup
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);

  // Form states
  const [inputFecha, setInputFecha] = useState("");
  const [inputMonto, setInputMonto] = useState("");
  const [inputMoneda, setInputMoneda] = useState("$");
  const [inputTitular, setInputTitular] = useState("");
  const [inputTarjetaNum, setInputTarjetaNum] = useState("");
  const [inputTarjetaTipo, setInputTarjetaTipo] = useState("");
  const [inputOperacion, setInputOperacion] = useState("");
  const [inputCuotas, setInputCuotas] = useState("1");
  const [inputCuentaBanco, setInputCuentaBanco] = useState("");
  const [inputObservaciones, setInputObservaciones] = useState("");

  const cuentas = [
    { id: 1, label: "Banco Galicia - CAJA DE AHORRO" },
    { id: 2, label: "Banco Nación - CUENTA CORRIENTE" },
  ];

  const tarjetas = [
    { id: 1, label: "Visa Crédito" },
    { id: 2, label: "Visa Débito" },
    { id: 3, label: "Mastercard" },
    { id: 4, label: "American Express" },
  ];

  // Dynamic Payments list
  const [pagos, setPagos] = useState<Pago[]>([
    {
      id: "1",
      fecha: "10/06/2026",
      tipo: "Transferencia (Galicia)",
      monto: 100000,
      moneda: "$",
      titular: "Mio Turismo",
      observaciones: "Pago inicial reserva",
      reciboNumero: "RC-0000001",
    },
    {
      id: "2",
      fecha: "09/06/2026",
      tipo: "Efectivo",
      monto: 50000,
      moneda: "$",
      titular: "Valentin Demarco",
      observaciones: "Entrega en mano",
      reciboNumero: "RC-0000002",
    },
  ]);

  // Set default date on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setInputFecha(today);
  }, []);

  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file);
      // Aquí puedes subir el archivo al servidor
      // Ejemplo: await uploadFile(file);
    }
  };

  const totalDeLaReserva = 400000;
  const totalPagos = pagos.reduce((acc, p) => acc + (p.moneda === "$" ? p.monto : p.monto * 1000), 0); // basic conversion for total comparison
  const saldoRestante = totalDeLaReserva - totalPagos;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const handleClear = () => {
    setReservaBusqueda("");
    setClienteSelect("");
    setSearched(false);
  };

  const formatMonto = (monto: number, moneda: string = "$") => {
    return `${moneda}${monto.toLocaleString("es-AR")}`;
  };

  // Pre-submit validation
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMonto || parseFloat(inputMonto) <= 0) {
      toast.error("Por favor ingrese un monto válido");
      return;
    }
    if (!inputFecha) {
      toast.error("Por favor ingrese una fecha válida");
      return;
    }
    if (paymentMethod === "tarjeta") {
      if (!inputTarjetaTipo || !inputTarjetaNum || !inputTitular) {
        toast.error("Por favor complete todos los datos obligatorios de la tarjeta");
        return;
      }
    } else if (paymentMethod === "transferencia") {
      if (!inputCuentaBanco) {
        toast.error("Por favor seleccione una cuenta bancaria");
        return;
      }
    }

    setShowConfirmModal(true);
  };

  // Confirm and save payment
  const handleConfirmPago = () => {
    const amountNum = parseFloat(inputMonto);
    const dateFormatted = new Date(inputFecha + "T12:00:00").toLocaleDateString("es-AR");
    const docNumber = `RC-000000${pagos.length + 1}`;

    let tipoStr = "";
    if (paymentMethod === "efectivo") {
      tipoStr = "Efectivo";
    } else if (paymentMethod === "transferencia") {
      tipoStr = `Transf. (${inputCuentaBanco})`;
    } else {
      tipoStr = `Tarjeta (${inputTarjetaTipo} terminada en ${inputTarjetaNum.slice(-4)})`;
    }

    const nuevoPago: Pago = {
      id: Date.now().toString(),
      fecha: dateFormatted,
      tipo: tipoStr,
      monto: amountNum,
      moneda: inputMoneda,
      titular: inputTitular || clienteSelect || "Mio Turismo",
      observaciones: inputObservaciones || "Pago imputado a la reserva",
      reciboNumero: docNumber,
    };

    setShowConfirmModal(false);
    toast.success("Pago agregado y comprobante emitido");

    // Reset fields
    setInputMonto("");
    setInputTarjetaNum("");
    setInputTitular("");
    setInputOperacion("");
    setInputCuotas("1");
    setInputObservaciones("");
  };

  const handleOpenRecibo = (pago: Pago) => {
    setSelectedPago(pago);
    setModalOpenRecibo(true);
  };

  const handleExportExcel = () => {
    toast.success("Exportando historial de pagos a Excel...");
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

        <h3 className="text-center md:text-lg font-semibold text-black py-4">
          Buscar reserva
        </h3>
        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Número de reserva (ej. MDQ #1)"
            value={reservaBusqueda}
            onChange={(e) => setReservaBusqueda(e.target.value)}
            className="w-full border border-black shadow-md shadow-black/40 rounded-sm py-2.5 px-3 text-black/80 font-medium  focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          />
          <select
            value={clienteSelect}
            onChange={(e) => setClienteSelect(e.target.value)}
            className="w-full border border-black shadow-md text-black/80 shadow-black/40 rounded-sm py-2.5 px-3  font-medium  focus:outline-none focus:ring-2 focus:ring-primary bg-white">
            <option value="">Filtrar por Cliente</option>
            <option value="Mio Turismo">Mio Turismo</option>
            <option value="Demarco Valentin">Demarco Valentin</option>
          </select>
          <button
            type="submit"
            className="w-full bg-primary md:text-lg text-white shadow-lg shadow-black/60 font-medium py-2.5 rounded-md hover:bg-blue-700 transition-colors">
            Buscar Reserva
          </button>
        </form>

        {/* Resultados */}
        {searched && (
          <>
            <h4 className="text-center md:text-lg font-semibold my-2 text-black py-4">
              Cargar pago a una reserva
            </h4>
            <div className="w-full font-semibold flex border gap-5 divide-x divide-black border-black shadow-md shadow-black/40 rounded-sm px-3 text-black/80 bg-white items-center">
              <p className="py-2.5 pr-5 pl-2 text-primary">MDQ #1</p>
              <div className="flex-1 flex justify-between items-center py-2.5 pl-4 text-start">
                <p className="font-bold text-gray-800">DEMARCO VALENTIN x2 MAT</p>
                <button
                  onClick={() => setModalOpenPago(true)}
                  className="bg-primary hover:bg-blue-700 text-white rounded-full p-1 shadow transition-colors"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Datos de la reserva */}
      {modalOpenPago && (
        <ModalLayout
          bg="bg-[#F1F1F1]"
          titleColor="text-primary"
          maxWidth="max-w-4xl"
          setModalOpen={() => setModalOpenPago(false)}
          title="Datos de la reserva"
          svg={
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12.3747 13.75H5.49967C3.77084 13.75 2.90734 13.75 2.37017 13.2128C1.83301 12.6757 1.83301 11.8122 1.83301 10.0833V6.41667C1.83301 4.68783 1.83301 3.82433 2.37017 3.28717C2.90734 2.75 3.77084 2.75 5.49967 2.75H16.4997C18.2285 2.75 19.092 2.75 19.6292 3.28717C20.1663 3.82433 20.1663 4.68783 20.1663 6.41667V11C20.1663 11.8543 20.1663 12.2815 20.027 12.6179C19.9349 12.8405 19.7998 13.0427 19.6294 13.2131C19.4591 13.3834 19.2568 13.5185 19.0343 13.6107C18.6978 13.75 18.2707 13.75 17.4163 13.75"
                stroke="#0546F7"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.9167 15.5832C11.9167 14.8538 12.2064 14.1544 12.7221 13.6386C13.2378 13.1229 13.9373 12.8332 14.6667 12.8332V10.9998C14.6667 10.2705 14.9564 9.57102 15.4721 9.05529C15.9878 8.53957 16.6873 8.24984 17.4167 8.24984V13.2915C17.4167 15.4319 17.4167 16.5017 16.984 17.312C16.6422 17.9515 16.1184 18.4753 15.4788 18.8172C14.6685 19.2498 13.5988 19.2498 11.4583 19.2498H11C9.29133 19.2498 8.437 19.2498 7.76417 18.9703C7.31917 18.7862 6.91478 18.5163 6.57411 18.1759C6.23343 17.8356 5.96314 17.4314 5.77867 16.9866C5.5 16.3128 5.5 15.4585 5.5 13.7498M12.8333 8.24984C12.8333 8.73607 12.6402 9.20238 12.2964 9.5462C11.9525 9.89002 11.4862 10.0832 11 10.0832C10.5138 10.0832 10.0475 9.89002 9.70364 9.5462C9.35982 9.20238 9.16667 8.73607 9.16667 8.24984C9.16667 7.76361 9.35982 7.29729 9.70364 6.95347C10.0475 6.60966 10.5138 6.4165 11 6.4165C11.4862 6.4165 11.9525 6.60966 12.2964 6.95347C12.6402 7.29729 12.8333 7.76361 12.8333 8.24984Z"
                stroke="#0546F7"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }>
          {/* Resumen de la reserva */}
          <div className="text-black text-sm md:text-base bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-gray-700">Total de la reserva</span>
              <span className="font-bold text-gray-900">{formatMonto(totalDeLaReserva)}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-gray-700">Total de pagos aplicados</span>
              <span className="font-bold text-green-600">{formatMonto(totalPagos)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-700">Saldo Pendiente</span>
              <span className="font-bold text-secondary">{formatMonto(saldoRestante)}</span>
            </div>
          </div>

          <hr className="border-gray-300 my-4" />

          {/* Formulario Agregar Pago */}
          <form onSubmit={handlePreSubmit}>
            <h4 className="text-center font-bold text-primary text-base md:text-lg flex items-center justify-center gap-2 mb-3">
              Cargar Nuevo Pago
            </h4>

            {/* Método selector */}
            <p className="text-center font-semibold text-gray-700 text-sm mb-2">
              Método de pago
            </p>
            <div className="flex justify-center gap-4 mb-4">
              <button
                type="button"
                onClick={() => setPaymentMethod("tarjeta")}
                className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all ${paymentMethod === "tarjeta" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                💳 Tarjeta
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("efectivo")}
                className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all ${paymentMethod === "efectivo" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                💵 Efectivo
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("transferencia")}
                className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all ${paymentMethod === "transferencia" ? "bg-primary text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
              >
                🏦 Transferencia
              </button>
            </div>

            {/* Form Fields according to selected method */}
            {paymentMethod === "tarjeta" && (
              <div className="flex flex-col gap-3 mt-2 text-black">
                <select
                  required
                  value={inputTarjetaTipo}
                  onChange={(e) => setInputTarjetaTipo(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Seleccionar Tarjeta *</option>
                  {tarjetas.map(t => (
                    <option key={t.id} value={t.label}>{t.label}</option>
                  ))}
                </select>
                <input
                  type="date"
                  required
                  value={inputFecha}
                  onChange={(e) => setInputFecha(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  required
                  placeholder="Número de Tarjeta (Últimos 4 dígitos) *"
                  maxLength={4}
                  value={inputTarjetaNum}
                  onChange={(e) => setInputTarjetaNum(e.target.value.replace(/\D/g, ""))}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  required
                  placeholder="Titular de la tarjeta *"
                  value={inputTitular}
                  onChange={(e) => setInputTitular(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  type="text"
                  required
                  placeholder="Número de operación / Cupón *"
                  value={inputOperacion}
                  onChange={(e) => setInputOperacion(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <select
                  value={inputCuotas}
                  onChange={(e) => setInputCuotas(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="1">1 Cuota</option>
                  <option value="3">3 Cuotas sin interés</option>
                  <option value="6">6 Cuotas</option>
                  <option value="12">12 Cuotas</option>
                </select>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Monto *"
                    value={inputMonto}
                    onChange={(e) => setInputMonto(e.target.value)}
                    className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={inputMoneda}
                    onChange={(e) => setInputMoneda(e.target.value)}
                    className="border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none"
                  >
                    <option value="$">ARS ($)</option>
                    <option value="U$D">USD (U$D)</option>
                  </select>
                </div>
              </div>
            )}

            {paymentMethod === "efectivo" && (
              <div className="flex flex-col gap-3 mt-2 text-black">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500">Fecha de pago *</label>
                  <input
                    type="date"
                    required
                    value={inputFecha}
                    onChange={(e) => setInputFecha(e.target.value)}
                    className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Monto *"
                    value={inputMonto}
                    onChange={(e) => setInputMonto(e.target.value)}
                    className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={inputMoneda}
                    onChange={(e) => setInputMoneda(e.target.value)}
                    className="border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none"
                  >
                    <option value="$">ARS ($)</option>
                    <option value="U$D">USD (U$D)</option>
                  </select>
                </div>

              </div>
            )}

            {paymentMethod === "transferencia" && (
              <div className="flex flex-col gap-3 mt-2 text-black">
                <select
                  required
                  value={inputCuentaBanco}
                  onChange={(e) => setInputCuentaBanco(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">Seleccionar Cuenta Bancaria de Destino *</option>
                  {cuentas.map(c => (
                    <option key={c.id} value={c.label}>{c.label}</option>
                  ))}
                </select>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500">Fecha de transferencia *</label>
                  <input
                    type="date"
                    required
                    value={inputFecha}
                    onChange={(e) => setInputFecha(e.target.value)}
                    className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Monto *"
                    value={inputMonto}
                    onChange={(e) => setInputMonto(e.target.value)}
                    className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={inputMoneda}
                    onChange={(e) => setInputMoneda(e.target.value)}
                    className="border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none"
                  >
                    <option value="$">ARS ($)</option>
                    <option value="U$D">USD (U$D)</option>
                  </select>
                </div>
              </div>
            )}

            <textarea
              placeholder="Observaciones de la operación (opcional)"
              rows={3}
              value={inputObservaciones}
              onChange={(e) => setInputObservaciones(e.target.value)}
              className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm mt-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none text-black"
            />
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
            <button onClick={() => fileInputRef.current?.click()} className="text-primary font-semibold">+ Agregar comprobante</button>
            <button
              type="submit"
              className="w-full bg-primary text-white font-bold py-2.5 rounded-lg shadow mt-4 hover:bg-blue-700 transition-colors text-sm"
            >
              Emitir Comprobante e Ingresar Pago
            </button>
          </form>

          <hr className="border-gray-300 my-4" />

          {/* Historial de pagos */}
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-primary text-sm md:text-base flex items-center gap-1">
              Historial de pagos cargados
            </h4>
            <button
              onClick={handleExportExcel}
              className="text-xs text-black font-medium flex items-center gap-1 hover:underline"
            >
              Exportar a Excel
              <Excel />
            </button>
          </div>

          <table className="w-full text-xs md:text-sm text-black">
            <thead>
              <tr className="font-bold border-b border-gray-200">
                <th className="py-2 text-left">Fecha</th>
                <th className="py-2 text-left">Método</th>
                <th className="py-2 text-left">Monto</th>
                <th className="py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((pago) => (
                <tr key={pago.id} className="font-medium border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2">{pago.fecha}</td>
                  <td className="py-2">{pago.tipo}</td>
                  <td className="py-2 font-bold text-green-600">{formatMonto(pago.monto, pago.moneda)}</td>
                  <td className="py-2 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenRecibo(pago)}
                      className="text-primary hover:text-blue-800 text-xs font-bold hover:underline"
                    >
                      📄
                    </button>
                    <button
                      // onClick={() => handleDeletePago(pago.id)}
                      className="ml-2 text-red-500 hover:text-red-700 text-xs font-bold hover:underline"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModalLayout>
      )}

      {/* Modal: Confirmación de Pago */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">¿Confirmar Operación?</h4>
            <p className="text-gray-600 text-sm mb-4">
              Se registrará un cobro de <span className="font-bold text-primary">{formatMonto(parseFloat(inputMonto), inputMoneda)}</span> asignado a la reserva <span className="font-bold text-gray-800">MDQ #1</span>.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleConfirmPago}
                className="flex-1 bg-primary text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Confirmar
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recibo Electrónico */}
      {modalOpenRecibo && selectedPago && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="rounded-xl max-w-lg w-full overflow-hidden p-4">
            {/* Imprimir */}
            <div className="flex justify-end pt-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="text-white font-medium tracking-wider text-sm flex items-center gap-1 hover:underline mb-2"
              >
                Imprimir / PDF
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"
                    fill="white"
                  />
                </svg>
              </button>
            </div>

            {/* Recibo */}
            <div className="bg-white rounded-xl">
              <div className="border-2 border-black p-6 rounded-xl">
                {/* Header del recibo */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo-travel.png"
                      alt="Logo TravelNett"
                      onError={(e) => {
                        // Fallback image path if logo-travel is missing
                        (e.target as HTMLImageElement).src = "/logo-grande.png";
                      }}
                      className="h-14 object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-primary font-bold text-sm">{selectedPago.reciboNumero}</p>
                    <span className="text-[10px] text-gray-400 font-mono">ORIGINAL</span>
                  </div>
                  <div className="border border-black flex items-center divide-x rounded-lg divide-black text-xs bg-gray-50">
                    <div className="flex flex-col items-center px-2">
                      <small className="font-bold text-gray-500">DÍA</small>
                      <p className="font-extrabold py-0.5 text-black">{selectedPago.fecha.split("/")[0]}</p>
                    </div>
                    <div className="flex flex-col items-center px-2">
                      <small className="font-bold text-gray-500">MES</small>
                      <p className="font-extrabold py-0.5 text-black">{selectedPago.fecha.split("/")[1]}</p>
                    </div>
                    <div className="flex flex-col items-center px-2">
                      <small className="font-bold text-gray-500">AÑO</small>
                      <p className="font-extrabold py-0.5 text-black">{selectedPago.fecha.split("/")[2]}</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-center font-bold text-black text-lg mb-6 tracking-wide border-b border-gray-200 pb-2">
                  RECIBO DE COBRO ELECTRÓNICO
                </h3>

                {/* Campos del recibo */}
                <div className="flex flex-col gap-4 text-black text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-600 whitespace-nowrap">
                      Recibimos de:
                    </span>
                    <span className="flex-1 border-b border-dashed border-gray-400 pb-0.5 font-bold italic text-primary">
                      {selectedPago.titular}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-600 whitespace-nowrap">
                      La suma de:
                    </span>
                    <span className="flex-1 border-b border-dashed border-gray-400 pb-0.5 italic text-gray-800">
                      {selectedPago.monto.toLocaleString("es-AR")}
                    </span>
                    <span className="font-bold text-gray-700">{selectedPago.moneda === "$" ? "Pesos" : "Dólares"}.</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-600 whitespace-nowrap">
                      En concepto de:
                    </span>
                    <span className="flex-1 border-b border-dashed border-gray-400 pb-0.5 italic text-gray-800">
                      {selectedPago.observaciones} ({selectedPago.tipo})
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
                  <div className="text-[10px] text-gray-400 flex flex-col">
                    <span>TravelNett SaaS Travel Agency Solutions</span>
                    <span>CUIT: 30-71458922-3</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-extrabold text-primary text-xl">TOTAL:</span>
                    <span className="font-extrabold text-primary text-2xl">
                      {formatMonto(selectedPago.monto, selectedPago.moneda)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Volver */}
            <div className="flex justify-center pb-4 pt-4">
              <button
                type="button"
                onClick={() => setModalOpenRecibo(false)}
                className="bg-white border border-gray-300 text-gray-800 rounded-full px-12 py-2.5 font-semibold hover:bg-gray-100 transition-colors shadow-sm text-sm">
                Cerrar Recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

