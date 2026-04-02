"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import ModalLayout from "@/app/components/ModalLayout";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type PaymentMethod = "efectivo" | "tarjeta" | "transferencia";

export default function TesoroPage() {
  const r = useRouter();
  const [cuenta, setCuenta] = useState("");
  const [searched, setSearched] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tarjeta");
  const [modalOpenPago, setModalOpenPago] = useState(false);
  const [modalOpenRecibo, setModalOpenRecibo] = useState(false);

  const cuentas = [
    { id: 1, label: "Banco Galicia - CAJA DE AHORRO" },
    { id: 2, label: "Banco Nación - CUENTA CORRIENTE" },
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
      monto: 3000000,
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

        <h3 className="text-center md:text-lg font-semibold text-black py-4">
          Buscar reserva
        </h3>
        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Número de reserva"
            value={cuenta}
            onChange={(e) => setCuenta(e.target.value)}
            className="w-full border border-black shadow-md shadow-black/40 rounded-sm py-2 px-3 text-black/80 font-medium  focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          />
          <select
            value={cuenta}
            onChange={(e) => setCuenta(e.target.value)}
            className="w-full border border-black shadow-md text-black/80 shadow-black/40 rounded-sm py-2 px-3  font-medium  focus:outline-none focus:ring-2 focus:ring-primary bg-white">
            <option className="text-black/80" value="">
              Cliente
            </option>
            {cuentas.map((c) => (
              <option key={c.id} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full bg-primary md:text-lg text-white shadow-lg shadow-black/60 font-medium py-2.5 rounded-md hover:bg-blue-700 transition-colors">
            Buscar
          </button>
        </form>

        {/* Resultados */}
        {searched && (
          <>
            <h4 className="text-center md:text-lg font-semibold my-2 text-black py-4">
              Cargar pago a una reserva
            </h4>
            <div className="w-full font-semibold flex border gap-5 divide-x divide-black border-black shadow-md shadow-black/40 rounded-sm  px-3 text-black/80  bg-white">
              <p className="py-2 pr-5 pl-2">MDQ #1</p>
              <div className="flex-1 flex justify-between items-cente py-2 text-start">
                <p>DEMARCO VALENTIN x2 MAT</p>
                <button onClick={() => setModalOpenPago(true)}>
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M7.12127 4.3474C9.6995 4.06194 12.3014 4.06194 14.8796 4.3474C16.3071 4.5074 17.4588 5.63156 17.6263 7.06406C17.9318 9.67906 17.9318 12.3207 17.6263 14.9357C17.4588 16.3682 16.3071 17.4924 14.8796 17.6524C12.3014 17.9379 9.6995 17.9379 7.12127 17.6524C5.69377 17.4924 4.5421 16.3682 4.3746 14.9357C4.06914 12.321 4.06914 9.67962 4.3746 7.0649C4.45932 6.36896 4.77658 5.72202 5.27496 5.22893C5.77334 4.73585 6.42363 4.42552 7.12043 4.34823M11.0004 6.83906C11.1662 6.83906 11.3252 6.90491 11.4424 7.02212C11.5596 7.13933 11.6254 7.2983 11.6254 7.46406V10.3749H14.5363C14.702 10.3749 14.861 10.4407 14.9782 10.558C15.0954 10.6752 15.1613 10.8341 15.1613 10.9999C15.1613 11.1657 15.0954 11.3246 14.9782 11.4418C14.861 11.559 14.702 11.6249 14.5363 11.6249H11.6254V14.5357C11.6254 14.7015 11.5596 14.8605 11.4424 14.9777C11.3252 15.0949 11.1662 15.1607 11.0004 15.1607C10.8347 15.1607 10.6757 15.0949 10.5585 14.9777C10.4413 14.8605 10.3754 14.7015 10.3754 14.5357V11.6249H7.4646C7.29884 11.6249 7.13987 11.559 7.02266 11.4418C6.90545 11.3246 6.8396 11.1657 6.8396 10.9999C6.8396 10.8341 6.90545 10.6752 7.02266 10.558C7.13987 10.4407 7.29884 10.3749 7.4646 10.3749H10.3754V7.46406C10.3754 7.2983 10.4413 7.13933 10.5585 7.02212C10.6757 6.90491 10.8347 6.83906 11.0004 6.83906Z"
                      fill="#0546F7"
                    />
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
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
              <path
                d="M11.9167 15.5832C11.9167 14.8538 12.2064 14.1544 12.7221 13.6386C13.2378 13.1229 13.9373 12.8332 14.6667 12.8332V10.9998C14.6667 10.2705 14.9564 9.57102 15.4721 9.05529C15.9878 8.53957 16.6873 8.24984 17.4167 8.24984V13.2915C17.4167 15.4319 17.4167 16.5017 16.984 17.312C16.6422 17.9515 16.1184 18.4753 15.4788 18.8172C14.6685 19.2498 13.5988 19.2498 11.4583 19.2498H11C9.29133 19.2498 8.437 19.2498 7.76417 18.9703C7.31917 18.7862 6.91478 18.5163 6.57411 18.1759C6.23343 17.8356 5.96314 17.4314 5.77867 16.9866C5.5 16.3128 5.5 15.4585 5.5 13.7498M12.8333 8.24984C12.8333 8.73607 12.6402 9.20238 12.2964 9.5462C11.9525 9.89002 11.4862 10.0832 11 10.0832C10.5138 10.0832 10.0475 9.89002 9.70364 9.5462C9.35982 9.20238 9.16667 8.73607 9.16667 8.24984C9.16667 7.76361 9.35982 7.29729 9.70364 6.95347C10.0475 6.60966 10.5138 6.4165 11 6.4165C11.4862 6.4165 11.9525 6.60966 12.2964 6.95347C12.6402 7.29729 12.8333 7.76361 12.8333 8.24984Z"
                stroke="#0546F7"
                stroke-width="1.25"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          }>
          {/* Resumen de la reserva */}
          <div className="text-black text-sm md:text-base">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">Total de la reserva</span>
              <span className="font-bold">$400.000</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold">Total de pagos</span>
              <span className="font-bold flex items-center gap-1">
                $100.000
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 10L2 14L6 18" stroke="black" strokeWidth="2" />
                  <path d="M18 14L22 10L18 6" stroke="black" strokeWidth="2" />
                  <path d="M2 14H16" stroke="black" strokeWidth="2" />
                  <path d="M22 10H8" stroke="black" strokeWidth="2" />
                </svg>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold">Saldo</span>
              <span className="font-bold text-secondary">$300.000</span>
            </div>
          </div>

          <hr className="border-black/60 md:mx-0 mx-20 my-2" />

          {/* Agregar Pago */}
          <h4 className="text-center font-bold text-primary text-base md:text-lg flex items-center justify-center gap-2">
            Agregar Pago
            <svg
              width="29"
              height="29"
              viewBox="0 0 29 29"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10.15 25.375C8.31736 25.375 6.7715 24.7459 5.51242 23.4876C4.25333 22.2293 3.6242 20.6834 3.625 18.85C3.625 18.0847 3.7559 17.3396 4.01771 16.6146C4.27951 15.8896 4.65208 15.2351 5.13542 14.651L9.425 9.48542L7.37083 5.37708C7.16945 4.97431 7.18475 4.5816 7.41675 4.19896C7.64875 3.81632 7.99594 3.625 8.45833 3.625H20.5417C21.0049 3.625 21.3525 3.81632 21.5845 4.19896C21.8165 4.5816 21.8314 4.97431 21.6292 5.37708L19.575 9.48542L23.8646 14.651C24.3479 15.2351 24.7205 15.8896 24.9823 16.6146C25.2441 17.3396 25.375 18.0847 25.375 18.85C25.375 20.6826 24.7406 22.2285 23.4719 23.4876C22.2031 24.7467 20.6625 25.3758 18.85 25.375H10.15ZM14.5 19.3333C13.8354 19.3333 13.2667 19.0969 12.7938 18.624C12.321 18.1512 12.0841 17.5821 12.0833 16.9167C12.0825 16.2513 12.3194 15.6826 12.7938 15.2105C13.2683 14.7384 13.837 14.5016 14.5 14.5C15.163 14.4984 15.7321 14.7352 16.2074 15.2105C16.6827 15.6858 16.9191 16.2545 16.9167 16.9167C16.9143 17.5788 16.6778 18.148 16.2074 18.624C15.7369 19.1001 15.1678 19.3366 14.5 19.3333ZM11.6302 8.45833H17.3698L18.5781 6.04167H10.4219L11.6302 8.45833ZM10.15 22.9583H18.85C19.9979 22.9583 20.9698 22.5608 21.7657 21.7657C22.5616 20.9706 22.9591 19.9987 22.9583 18.85C22.9583 18.3667 22.8725 17.8986 22.701 17.4459C22.5294 16.9932 22.2929 16.5852 21.9917 16.2219L17.551 10.875H11.4792L7.00833 16.1917C6.70625 16.5542 6.46982 16.967 6.29904 17.4302C6.12826 17.8934 6.04247 18.3667 6.04167 18.85C6.04167 19.9979 6.43961 20.9698 7.2355 21.7657C8.03139 22.5616 9.00289 22.9591 10.15 22.9583Z"
                fill="#0546F7"
              />
            </svg>
          </h4>
          <p className="text-center font-semibold text-primary text-sm md:text-base">
            Método de pago
          </p>
          {paymentMethod === "tarjeta" && (
            <div className="text-center text-primary flex items-center justify-center gap-2 text-sm font-medium">
              <p>Tarjeta de Crédito/Débito</p>
              <button onClick={() => setPaymentMethod("efectivo")}>|▶</button>
            </div>
          )}
          {paymentMethod === "efectivo" && (
            <div className="text-center text-primary flex items-center justify-center gap-2 text-sm font-medium">
              <p>Efectivo</p>
              <button onClick={() => setPaymentMethod("transferencia")}>
                |▶
              </button>
            </div>
          )}
          {paymentMethod === "transferencia" && (
            <div className="text-center text-primary flex items-center justify-center gap-2 text-sm font-medium">
              <p>Transferencia</p>
              <button onClick={() => setPaymentMethod("tarjeta")}>|▶</button>
            </div>
          )}

          {/* Formulario de pago START*/}
          {paymentMethod === "tarjeta" && (
            <div className="flex flex-col gap-3 mt-2">
              <select className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none">
                <option value="">
                  Seleccionar Tarjeta <span className="text-red-500">*</span>
                </option>
              </select>
              <input
                type="date"
                placeholder="Fecha de pago *"
                className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Número de Tarjeta *"
                className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Titular *"
                className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Número de operación *"
                className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none"
              />
              <select className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none">
                <option value="">Cantidad de cuotas *</option>
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Monto *"
                  className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none"
                />
                <select className="border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none">
                  <option value="$">$</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <textarea
                placeholder="Observaciones"
                rows={3}
                className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none resize-none"
              />
            </div>
          )}
          {paymentMethod === "efectivo" && (
            <div className="flex flex-col gap-3 mt-2">
              <label htmlFor="fecha" className="text-black/30">
                Fecha de pago *
              </label>
              <input
                type="date"
                id="fecha"
                className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Monto *"
                  className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none"
                />
                <select className="border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none">
                  <option value="$">$</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <textarea
                placeholder="Observaciones"
                rows={3}
                className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none resize-none"
              />
            </div>
          )}
          {paymentMethod === "transferencia" && (
            <div className="flex flex-col gap-3 mt-2">
              <select className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none">
                <option value="">Seleccionar Cuenta *</option>
              </select>
              <label htmlFor="fecha" className="text-black/30">
                Fecha de pago *
              </label>
              <input
                type="date"
                id="fecha"
                className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Monto *"
                  className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none"
                />
                <select className="border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none">
                  <option value="ARS">ARS</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <textarea
                placeholder="Observaciones"
                rows={3}
                className="w-full border border-black/30 bg-white rounded-sm p-2 text-black/80 font-medium shadow-sm focus:outline-none resize-none"
              />
            </div>
          )}
          {/* Formulario de pago END*/}

          <button className="text-primary font-semibold text-sm mt-1 self-start">
            + Agregar comprobante
          </button>

          <hr className="border-black/20 my-3" />

          {/* Historial de pagos */}
          <div className="flex items-center justify-center md:justify-end md:gap-50 gap-10 mb-2">
            <h4 className="font-bold text-primary text-sm md:text-base flex items-center gap-1">
              Historial de pagos
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M11 19.25C9.075 19.25 7.37153 18.6658 5.88958 17.4973C4.40764 16.3289 3.44514 14.8353 3.00208 13.0167C2.94097 12.7875 2.98681 12.5776 3.13958 12.3869C3.29236 12.1962 3.49861 12.0853 3.75833 12.0542C4.00278 12.0236 4.22431 12.0694 4.42292 12.1917C4.62153 12.3139 4.75903 12.4972 4.83542 12.7417C5.20208 14.1167 5.95833 15.2396 7.10417 16.1104C8.25 16.9813 9.54861 17.4167 11 17.4167C12.7875 17.4167 14.304 16.7942 15.5494 15.5494C16.7949 14.3046 17.4173 12.7881 17.4167 11C17.4161 9.21189 16.7936 7.69572 15.5494 6.4515C14.3052 5.20728 12.7887 4.58456 11 4.58333C9.94583 4.58333 8.96042 4.82778 8.04375 5.31667C7.12708 5.80556 6.35556 6.47778 5.72917 7.33333H7.33333C7.59306 7.33333 7.81092 7.42133 7.98692 7.59733C8.16292 7.77333 8.25061 7.99089 8.25 8.25C8.24939 8.50911 8.16139 8.72697 7.986 8.90358C7.81061 9.08019 7.59306 9.16789 7.33333 9.16667H3.66667C3.40694 9.16667 3.18939 9.07867 3.014 8.90267C2.83861 8.72667 2.75061 8.50911 2.75 8.25V4.58333C2.75 4.32361 2.838 4.10606 3.014 3.93067C3.19 3.75528 3.40756 3.66728 3.66667 3.66667C3.92578 3.66606 4.14364 3.75406 4.32025 3.93067C4.49686 4.10728 4.58456 4.32483 4.58333 4.58333V5.82083C5.3625 4.84306 6.31369 4.08681 7.43692 3.55208C8.56014 3.01736 9.74783 2.75 11 2.75C12.1458 2.75 13.2192 2.96786 14.2203 3.40358C15.2212 3.83931 16.0921 4.42719 16.8328 5.16725C17.5734 5.90731 18.1616 6.77814 18.5973 7.77975C19.0331 8.78136 19.2506 9.85478 19.25 11C19.2494 12.1452 19.0318 13.2186 18.5973 14.2203C18.1628 15.2219 17.5746 16.0927 16.8328 16.8328C16.0909 17.5728 15.22 18.161 14.2203 18.5973C13.2205 19.0337 12.1471 19.2512 11 19.25ZM11.9167 10.6333L14.2083 12.925C14.3764 13.0931 14.4604 13.3069 14.4604 13.5667C14.4604 13.8264 14.3764 14.0403 14.2083 14.2083C14.0403 14.3764 13.8264 14.4604 13.5667 14.4604C13.3069 14.4604 13.0931 14.3764 12.925 14.2083L10.3583 11.6417C10.2667 11.55 10.1979 11.447 10.1521 11.3328C10.1062 11.2185 10.0833 11.0999 10.0833 10.9771V7.33333C10.0833 7.07361 10.1713 6.85606 10.3473 6.68067C10.5233 6.50528 10.7409 6.41728 11 6.41667C11.2591 6.41606 11.477 6.50406 11.6536 6.68067C11.8302 6.85728 11.9179 7.07483 11.9167 7.33333V10.6333Z"
                  fill="#0546F7"
                />
              </svg>
            </h4>
            <button className="text-xs text-black font-medium flex items-center gap-1">
              Exportar a Excel
              <Excel />
            </button>
          </div>

          <table className="w-full text-xs md:text-sm text-black">
            <thead>
              <tr className="font-bold ">
                <th className="py-1 text-left">Fecha</th>
                <th className="py-1 text-left">Tipo</th>
                <th className="py-1 text-left">Monto</th>
                <th className="py-1 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {[
                { fecha: "8/7/2025", tipo: "Transferencia", monto: "$50.000" },
                { fecha: "8/7/2025", tipo: "Transferencia", monto: "$50.000" },
                { fecha: "8/7/2025", tipo: "Pase de dinero", monto: "$50.000" },
              ].map((pago, i) => (
                <tr key={i} className="font-medium">
                  <td className="py-2">{pago.fecha}</td>
                  <td className="py-2">{pago.tipo}</td>
                  <td className="py-2">{pago.monto}</td>
                  <td className="py-2 flex justify-center gap-2">
                    <button className="text-black/70 ">
                      <svg
                        width="25"
                        height="25"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M4.46387 12.4998V3.7498H3.83887V3.1248H6.33887V2.64355H10.0889V3.1248H12.5889V3.7498H11.9639V12.4998H4.46387ZM5.08887 11.8748H11.3389V3.7498H5.08887V11.8748ZM6.84387 10.6248H7.46887V4.9998H6.84387V10.6248ZM8.95887 10.6248H9.58387V4.9998H8.95887V10.6248Z"
                          fill="#0546F7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setModalOpenRecibo(true)}
                      className="text-black/70 hover:text-primary">
                      <svg
                        width="25"
                        height="25"
                        viewBox="0 0 15 15"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M5.42573 12.86H10.3096C11.2617 12.86 11.7353 12.3771 11.7353 11.4205V7.2448C11.7353 6.65144 11.671 6.394 11.3031 6.01687L8.76439 3.43698C8.41512 3.0781 8.12982 3 7.61023 3H5.42573C4.47838 3 4 3.48741 4 4.44417V11.4205C4 12.3816 4.47838 12.86 5.42573 12.86ZM5.46242 12.1197C4.98875 12.1197 4.74033 11.8665 4.74033 11.4068V4.45791C4.74033 4.00268 4.98875 3.74033 5.46713 3.74033H7.50898V6.41244C7.50898 6.99188 7.80331 7.27698 8.37352 7.27698H10.995V11.4068C10.995 11.8665 10.7511 12.1197 10.2729 12.1197H5.46242ZM8.45633 6.58237C8.27698 6.58237 8.2032 6.50898 8.2032 6.32493V3.88298L10.8522 6.58256L8.45633 6.58237Z"
                          fill="#0546F7"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ModalLayout>
      )}

      {/* Modal Recibo Electrónico */}
      {modalOpenRecibo && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="rounded-xl max-w-lg w-full overflow-hidden">
            {/* Imprimir */}
            <div className="flex justify-end pt-3">
              <button className="text-white font-medium tracking-wider text-sm flex items-center gap-1 hover:underline">
                Imprimir
                <svg
                  width="25"
                  height="25"
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
              <div className="border-2 border-black p-4 rounded-md">
                {/* Header del recibo */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo-grande.png"
                      alt="Logo"
                      className="size-20 object-contain"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-primary font-bold text-sm">N° 0000001</p>
                  </div>
                  <div className="border border-black flex items-center divide-x rounded-lg divide-black text-xs">
                    <div className="flex flex-col items-center">
                      <small className="bg-primary rounded-tl-lg text-white px-2 py-1">
                        DÍA
                      </small>
                      <p className="font-extrabold py-1 text-black">8</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <small className="bg-primary text-white px-2 py-1">
                        MES
                      </small>
                      <p className="font-extrabold py-1 text-black">7</p>
                    </div>
                    <div className="flex flex-col items-center">
                      <small className="bg-primary rounded-tr-lg text-white w-full px-2 py-1 text-center">
                        AÑO
                      </small>
                      <p className="font-extrabold py-1 text-black">2025</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-center font-bold text-black text-base mb-4">
                  Recibo electrónico
                </h3>

                {/* Campos del recibo */}
                <div className="flex flex-col gap-3 text-black text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">
                      Recibí de:
                    </span>
                    <span className="flex-1 border-b border-black pb-0.5 italic">
                      Mio Turismo
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">
                      La suma de:
                    </span>
                    <span className="flex-1 border-b border-black pb-0.5 italic">
                      Cincuenta mil
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="flex-1 border-b border-black pb-0.5"></span>
                    <span className="font-bold">Pesos.</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold whitespace-nowrap">
                      Por concepto de:
                    </span>
                    <span className="flex-1 border-b border-black pb-0.5 italic">
                      Pago reserva MDQ #1
                    </span>
                  </div>
                  <div className="border-b border-black mt-5"></div>
                </div>

                {/* Total */}
                <div className="flex justify-end items-center gap-4 mt-4">
                  <span className="font-bold text-primary text-lg">TOTAL:</span>
                  <span className="font-bold text-primary text-lg">
                    $50.000
                  </span>
                </div>
              </div>
            </div>

            {/* Botón Volver */}
            <div className="flex justify-center pb-4 pt-2">
              <button
                onClick={() => setModalOpenRecibo(false)}
                className="bg-white border border-black/30 text-black rounded-full px-10 py-2.5 font-semibold hover:bg-gray-100">
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
