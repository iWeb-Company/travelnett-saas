"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "@/app/components/Loader";
import toast from "react-hot-toast";
import Link from "next/link";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Copy from "@/app/components/icons/salidas/Copy";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Salidas from "@/app/components/icons/home/Salidas";
import Hotel from "@/app/components/icons/salidas/Hotel";

export default function VoucherPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const id = params.id as string;
  const [voucherData, setVoucherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadVoucher = async () => {
    if (!user?.iweb_client_id || !id) return;
    try {
      const data = await apiClient.getVoucher(user.iweb_client_id, id);
      setVoucherData(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar el voucher");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadVoucher();
    }
  }, [user?.iweb_client_id, id]);

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader />
        </div>
      </Container>
    );
  }

  if (!voucherData) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center h-[50vh]">
          <p className="font-bold text-lg text-white">
            No se pudo cargar la información del voucher.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-4 bg-[#0546F7] text-secondary font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700"
          >
            Volver a la Lista
          </button>
        </div>
      </Container>
    );
  }

  const isAereo = voucherData.tipo_transporte?.toLowerCase() === "aereo";

  return (
    <Container>
      <ToggleSalidas />

      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          header, footer, .no-print, .no-print * {
            display: none !important;
          }
          .print-voucher, .print-voucher * {
            visibility: visible !important;
          }
          .print-voucher {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Contenedor de la sección */}
      <section className="flex flex-col gap-3 my-10">
        {/* Navegación y Herramientas superiores (No se imprimen) */}
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 no-print">
          <div className="flex flex-col gap-2">
            <Link
              href={"/dashboard"}
              className="flex items-center justify-start gap-2 text-primary hover:opacity-85 transition-opacity"
            >
              <ArrowLeft />
              <span className="font-bold md:text-lg">Volver al menú</span>
            </Link>
            {voucherData.salida_id && (
              <Link
                href={`/salidas/lista/${voucherData.salida_id}`}
                className="flex items-center justify-start gap-2 text-secondary hover:opacity-85 transition-opacity"
              >
                <ArrowLeft color="#6005F7" />
                <span className="font-bold md:text-lg">Volver a la Lista</span>
              </Link>
            )}
          </div>

          <div className="flex items-center mr-20 text-xs font-bold text-white">
            <button
              onClick={() =>
                toast.success("Funcionalidad de envío por email en desarrollo")
              }
              className="flex items-center gap-1.5 hover:opacity-80 cursor-pointer text-secondary  px-3 py-2 rounded-lg"
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.5 27.5C4.74375 27.5 4.09658 27.231 3.5585 26.6929C3.02042 26.1548 2.75092 25.5072 2.75 24.75V8.25C2.75 7.49375 3.0195 6.84658 3.5585 6.3085C4.0975 5.77042 4.74467 5.50092 5.5 5.5H27.5C28.2563 5.5 28.9039 5.7695 29.4429 6.3085C29.9819 6.8475 30.2509 7.49467 30.25 8.25V24.75C30.25 25.5063 29.981 26.1539 29.4429 26.6929C28.9048 27.2319 28.2572 27.5009 27.5 27.5H5.5ZM16.5 17.6344C16.6146 17.6344 16.7351 17.617 16.8616 17.5821C16.9881 17.5473 17.1082 17.496 17.2219 17.4281L26.95 11.3438C27.1333 11.2292 27.2708 11.0862 27.3625 10.9148C27.4542 10.7433 27.5 10.554 27.5 10.3469C27.5 9.88854 27.3052 9.54479 26.9156 9.31563C26.526 9.08646 26.125 9.09792 25.7125 9.35L16.5 15.125L7.2875 9.35C6.875 9.09792 6.47396 9.09242 6.08438 9.3335C5.69479 9.57458 5.5 9.91237 5.5 10.3469C5.5 10.576 5.54583 10.7768 5.6375 10.9491C5.72917 11.1215 5.86667 11.253 6.05 11.3438L15.7781 17.4281C15.8927 17.4969 16.0133 17.5487 16.1398 17.5835C16.2663 17.6183 16.3863 17.6353 16.5 17.6344Z"
                  fill="black"
                />
              </svg>
              <span>Enviar por email</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 hover:opacity-80 text-secondary cursor-pointer px-3 py-2 rounded-lg"
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24.75 9.625H8.25V4.125H24.75V9.625ZM24.75 17.1875C25.1396 17.1875 25.4664 17.0555 25.7304 16.7915C25.9944 16.5275 26.1259 16.2012 26.125 15.8125C26.1241 15.4238 25.9921 15.0975 25.729 14.8335C25.4659 14.5695 25.1396 14.4375 24.75 14.4375C24.3604 14.4375 24.0341 14.5695 23.771 14.8335C23.5079 15.0975 23.3759 15.4238 23.375 15.8125C23.3741 16.2012 23.5061 16.528 23.771 16.7929C24.0359 17.0578 24.3622 17.1893 24.75 17.1875ZM22 26.125V20.625H11V26.125H22ZM24.75 28.875H8.25V23.375H2.75V15.125C2.75 13.9563 3.15104 12.9768 3.95312 12.1866C4.75521 11.3965 5.72917 11.0009 6.875 11H26.125C27.2938 11 28.2737 11.3955 29.0648 12.1866C29.8558 12.9777 30.2509 13.9572 30.25 15.125V23.375H24.75V28.875Z"
                  fill="black"
                />
              </svg>
              <span>Imprimir</span>
            </button>
          </div>
        </div>

        {/* Contenedor Principal del Voucher */}
        <div className="max-w-4xl mx-auto bg-white shadow-lg border border-black overflow-hidden print-voucher w-full text-black">
          {/* Header / Azul Claro */}
          <div className="bg-[#3DADFF]/50 text-black p-5 flex items-center justify-around border-b border-b-black">
            <div className="flex items-center justify-around w-full">
              <img src="/logo-empresa.png" alt="Logo" />
              <div className="flex flex-col gap-5">
                <div className="flex flex-col">
                  <p className="text-[10px] uppercase font-bold text-center tracking-wider text-blue-900">
                    Voucher Reserva #
                    {voucherData.reserva_id.substring(0, 5).toUpperCase()}
                  </p>
                  <h2 className="text-xl md:text-xl font-bold text-black">
                    {voucherData.titular_name?.toUpperCase()}
                  </h2>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold mt-1">
                    DNI:{" "}
                    <span className="font-bold">{voucherData.titular_dni}</span>
                  </p>
                  <p className="text-xs font-semibold mt-1">
                    Total pax:{" "}
                    <span className="font-bold">
                      {voucherData.total_passengers}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque Transporte */}
          <div className="border-black border-b flex flex-col gap-5 p-5">
            <div className="flex items-center justify-center gap-5">
              <img src="/logo-empresa.png" className="h-15" alt="Logo" />
              <h3 className="font-bold text-sm text-[#1105F7] uppercase">
                Voucher de Transporte #
                {voucherData.reserva_id.substring(0, 5).toUpperCase()}
              </h3>
              <Salidas width="40" height="40" color="#1105F7" />
            </div>
            {/* DATA */}
            <div className="grid grid-cols-2 place-content-center place-items-center gap-4 text-xs font-semibold">
              <div className="flex items-start gap-2">
                <p className="font-semibold text-lg">📍</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Destino
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.destino_name || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <p className="font-semibold text-lg">📅</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Fecha de salida
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.fecha_salida || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 ml-13">
                <p className="font-semibold text-lg">🛎️</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Tipo de Butaca
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.tipo_butaca === "economy"
                      ? "Economy"
                      : "Semicama"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <p className="font-semibold text-lg">👤</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Coordinador/a
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.coordinador_nombre
                      ? `${voucherData.coordinador_nombre} (${voucherData.coordinador_telefono || "-"})`
                      : "A confirmar"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <p className="font-semibold text-lg">🕒</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Horario
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.horario_carga || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start justify-start gap-2">
                <p className="font-semibold text-lg">�</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    {isAereo ? "Empresa Aérea" : "Empresa de transporte"}
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.empresa_transporte || "A confirmar"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <p className="font-medium text-xl">
                🗺️ Lugar de salida
              </p>
              <p className="font-semibold text-sm mt-1">
                {voucherData.lugar_carga || "A confirmar"}
              </p>
            </div>

            <p className="text-xs text-center mx-10 mt-5">
              {isAereo
                ? "El horario de presentación al aeropuerto es 2 horas antes del horario marcado que es el de abordaje y salida."
                : "El horario de presentacion es el primer horario marcado, siendo el segundo el horario de salida. El horario de regreso será informado durante el viaje."}
            </p>
          </div>

          {/* Bloque Hotelería */}
          <div className="border-black border-b flex flex-col gap-5 p-5">
            <div className="flex items-center justify-center gap-5">
              <img src="/logo-empresa.png" className="h-15" alt="Logo" />
              <h3 className="font-bold text-sm text-[#1105F7] uppercase">
                Voucher de Hoteleria #
                {voucherData.reserva_id.substring(0, 5).toUpperCase()}
              </h3>
              <Salidas width="40" height="40" color="#1105F7" />
            </div>
            {/* DATA */}
            <div className="grid grid-cols-2 place-content-center place-items-center gap-4 text-xs font-semibold">
              <div className="flex items-start justify-start gap-2">
                <Hotel />
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Hotel
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.hotel_name || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start justify-start gap-2">
                <p className="font-semibold text-lg">📅</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Tipo de Habitacion
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.room_type || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start justify-start gap-2 ml-13">
                <p className="font-semibold text-lg">🛎️</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Acompañante
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.passengers_names || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start justify-start gap-2">
                <p className="font-semibold text-lg">👤</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Regimen
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.regimen_name || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start justify-start gap-2">
                <p className="font-semibold text-lg">�</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Fecha de entrada
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.fecha_salida || "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-start justify-start gap-2">
                <p className="font-semibold text-lg">👤</p>
                <div className="flex flex-col items-start">
                  <p className="text-black text-xl font-medium mt-0.5">
                    Cantidad de noches
                  </p>
                  <p className="text-black text-xl font-bold mt-0.5">
                    {voucherData.noches || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque Observaciones */}
          <div className="border-black border-b flex flex-col gap-5 p-5">
            <div className="flex items-center justify-center gap-5">
              <img src="/logo-empresa.png" className="h-15" alt="Logo" />
              <h3 className="font-bold text-sm text-[#1105F7] uppercase">
                Observaciones de Voucher
              </h3>
            </div>
            <p className='text-center text-sm' >{voucherData.observations || 'No hay observaciones.'}</p>
          </div>
        </div>
      </section>
    </Container>
  );
}
