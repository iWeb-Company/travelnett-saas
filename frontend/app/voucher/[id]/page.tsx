"use client";

import { useEffect, useMemo, useState } from "react";
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
import { formatRoomType } from "@/lib/formatRooms";
import { formatDateDDMMYY } from "@/lib/formatDate";
import { Voucher } from "@/app/types";
import { useSinglePagePrint } from "@/app/utils/useSinglePagePrint";

export default function VoucherPage() {
  const params = useParams();
  const router = useRouter();
  const bg = "bg-[#DFF1FF]";
  const { user, iwebClient } = useAuth();
  const agencyLogo =
    iwebClient?.logo_s || iwebClient?.logo_xl || "/logo-empresa.png";
  const agencyName = iwebClient?.name || "asd";
  const id = params.id as string;
  const [voucherData, setVoucherData] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);
  const { printRef, printSinglePage } = useSinglePagePrint<HTMLDivElement>();
  console.log(iwebClient, "esto es iwebClient");

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

  const passengers = useMemo(() => {
    const paxs = voucherData?.passengers_names;
    return paxs?.split(",").map((p) => p.toUpperCase().trim());
  }, [voucherData]);

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
            className="mt-4 bg-[#0546F7] text-secondary font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700">
            Volver a la Lista
          </button>
        </div>
      </Container>
    );
  }

  const isAereo = voucherData.tipo_transporte?.toLowerCase() === "aereo";
  const hasExcursion = Boolean(
    voucherData.excursion_id || voucherData.excursion_name?.trim(),
  );

  return (
    <Container>
      <ToggleSalidas />

      <style>{`
        @page {
          size: A4 portrait;
          margin: 6mm;
        }
        @media print {
          html, body {
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            overflow: hidden !important;
          }
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
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: var(--print-source-width) !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            background: white !important;
            zoom: var(--print-scale, 1);
            break-inside: avoid-page !important;
            page-break-inside: avoid !important;
            overflow: visible !important;
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
              className="flex items-center justify-start gap-2 text-primary hover:opacity-85 transition-opacity">
              <ArrowLeft />
              <span className="font-bold md:text-lg">Volver al menú</span>
            </Link>
            {voucherData.salida_id && (
              <Link
                href={`/salidas/lista/${voucherData.salida_id}`}
                className="flex items-center justify-start gap-2 text-secondary hover:opacity-85 transition-opacity">
                <ArrowLeft color="#6005F7" />
                <span className="font-bold md:text-lg">Volver a la Lista</span>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
            <button
              onClick={() =>
                toast.success("Funcionalidad de envío por email en desarrollo")
              }
              className="flex items-center gap-1.5 hover:opacity-80 cursor-pointer text-secondary px-3 py-2 rounded-lg bg-gray-100 md:bg-transparent">
              <svg
                width="22"
                height="22"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M5.5 27.5C4.74375 27.5 4.09658 27.231 3.5585 26.6929C3.02042 26.1548 2.75092 25.5072 2.75 24.75V8.25C2.75 7.49375 3.0195 6.84658 3.5585 6.3085C4.0975 5.77042 4.74467 5.50092 5.5 5.5H27.5C28.2563 5.5 28.9039 5.7695 29.4429 6.3085C29.9819 6.8475 30.2509 7.49467 30.25 8.25V24.75C30.25 25.5063 29.981 26.1539 29.4429 26.6929C28.9048 27.2319 28.2572 27.5009 27.5 27.5H5.5ZM16.5 17.6344C16.6146 17.6344 16.7351 17.617 16.8616 17.5821C16.9881 17.5473 17.1082 17.496 17.2219 17.4281L26.95 11.3438C27.1333 11.2292 27.2708 11.0862 27.3625 10.9148C27.4542 10.7433 27.5 10.554 27.5 10.3469C27.5 9.88854 27.3052 9.54479 26.9156 9.31563C26.526 9.08646 26.125 9.09792 25.7125 9.35L16.5 15.125L7.2875 9.35C6.875 9.09792 6.47396 9.09242 6.08438 9.3335C5.69479 9.57458 5.5 9.91237 5.5 10.3469C5.5 10.576 5.54583 10.7768 5.6375 10.9491C5.72917 11.1215 5.86667 11.253 6.05 11.3438L15.7781 17.4281C15.8927 17.4969 16.0133 17.5487 16.1398 17.5835C16.2663 17.6183 16.3863 17.6353 16.5 17.6344Z"
                  fill="black"
                />
              </svg>
              <span>Enviar por email</span>
            </button>
            <button
              onClick={printSinglePage}
              className="flex items-center gap-1.5 hover:opacity-80 text-secondary cursor-pointer px-3 py-2 rounded-lg bg-gray-100 md:bg-transparent">
              <svg
                width="22"
                height="22"
                viewBox="0 0 33 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
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
        <div ref={printRef} className="max-w-4xl mx-auto bg-white shadow-lg border border-black overflow-hidden print-voucher w-full text-black">
          {/* Header  */}
          <div
            className={`text-black py-4 px-4 sm:px-6 md:px-10 flex flex-col md:flex-row items-center justify-between border-b border-b-black gap-3 md:gap-0`}>
            <div className="flex items-center gap-2">
              <img
                src={agencyLogo}
                alt="Logo"
                className="max-h-16 md:max-h-20 object-contain"
              />
              <h1 className="text-black text-lg md:text-xl font-medium mt-0.5">
                {agencyName?.toUpperCase()}
              </h1>
            </div>
            <div className="flex flex-col justify-center md:justify-end items-center md:items-end gap-1 text-center md:text-right">
              <p className="font-medium uppercase text-xs sm:text-sm md:text-base">
                VOUCHER DE SERVICIOS CONTRATADOS
              </p>
              <p className="text-xl sm:text-2xl font-semibold">
                RESERVA {voucherData.codigo_reserva || voucherData.id.substring(0, 5).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Pasajero titular / Azul Claro */}
          <div
            className={`${bg} text-black py-4 px-4 sm:px-6 md:px-10 flex  flex-row items-center justify-between border-b border-b-black gap-3 md:gap-0`}>
            <div className="flex flex-col items-center md:items-start gap-1 text-center md:text-left">
              <p className="font-semibold text-xl sm:text-2xl">
                {voucherData.titular_name?.toLocaleUpperCase()}
              </p>
              <p>
                <small className="text-base sm:text-lg">DNI:</small>{" "}
                <small className="text-base sm:text-lg font-semibold">
                  {voucherData.titular_dni}
                </small>
              </p>
            </div>
            <div className="bg-[#F1F1F1] px-4 py-1 flex flex-col items-center rounded-xl border border-gray-300">
              <p className="font-semibold">{passengers?.length} ADL</p>
              <p className="font-medium text-sm">PASAJEROS</p>
            </div>
          </div>

          {/* PASAJEROS */}
          <div
            className={`text-black py-4 px-4 sm:px-6 md:px-10 flex flex-col items-start border-b border-b-black gap-1`}>
            <p className="font-semibold text-xl sm:text-2xl">Pasajeros</p>
            <div className="flex flex-wrap items-start">
              {passengers?.map((p, i) => (
                <span
                  key={i}
                  className="text-lg sm:text-xl pr-2 font-semibold">
                  {p} {i + 1 !== passengers?.length ? "/" : ""}
                </span>
              ))}
            </div>
          </div>

          {/* Bloque Transporte */}
          <div className="border-black py-5 px-4 sm:px-6 md:px-10 border-b flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-5">
              <div className="flex items-center gap-2">
                <img
                  src="/trasnport.png"
                  className="h-12 md:h-15 object-contain"
                  alt="Logo"
                />
                <h3 className="font-bold text-lg md:text-xl uppercase">
                  TRANSPORTE
                </h3>
              </div>
              <div className="bg-[#F1F1F1] px-4 py-1 flex flex-col items-center rounded-xl border border-gray-300 self-start sm:self-auto">
                <p className="font-semibold text-sm sm:text-base">
                  Voucher de Transporte
                </p>
              </div>
            </div>

            {/* DATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 w-full place-content-center place-items-start gap-3">
              <div className="min-w-full">
                <div className="flex flex-col items-start w-full py-2">
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.empresa_transporte}
                  </p>
                  <p className="text-sm sm:text-base">
                    Coordinador: {voucherData.coordinador_nombre} -{" "}
                    {voucherData.coordinador_telefono}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <hr className="border border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start w-full py-2">
                  <p className="text-lg sm:text-xl font-medium">Destino</p>
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.destino_name}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <hr className="border border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start w-full py-2">
                  <p className="text-lg sm:text-xl font-medium">
                    Fecha y horario de salida
                  </p>
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.fecha_salida} -{" "}
                    {voucherData.horario_carga || "A confirmar"}
                  </p>
                  <p className="text-base sm:text-xl font-medium">
                    Presentación 30 minutos antes
                  </p>
                </div>
              </div>

              {/* DIVISION */}
              <div className="w-full">
                <div className="hidden md:block md:h-18 w-full py-2" />
                <div className="flex flex-col items-center gap-2">
                  <hr className="border md:block hidden border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start pt-2 md:pt-10 w-full py-2">
                  <p className="text-lg sm:text-xl font-medium">
                    Tipo de butaca
                  </p>
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.tipo_butaca === "semicama"
                      ? "Semicama"
                      : "Cama"}
                  </p>
                </div>
                <div className="flex flex-col w-full items-center gap-2">
                  <hr className="border border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start w-full py-2">
                  <p className="text-lg sm:text-xl font-medium">
                    Fecha de regreso
                  </p>
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.fecha_regreso || voucherData.fecha_salida}
                  </p>
                </div>
              </div>
            </div>
            <hr className="border border-gray-300 w-full" />

            <p className="font-medium border-l-8 md:border-l-12 border-primary bg-[#F7F7F7] py-2 px-4 sm:px-5 text-start text-xs sm:text-sm md:text-base">
              El horario de regreso será informado por el coordinador durante el
              viaje. Ante cualquier cambio nos pondremos en contacto.
            </p>
          </div>

          {/* Bloque Hotelería */}
          <div className="border-black py-5 px-4 sm:px-6 md:px-10 border-b flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-5">
              <div className="flex items-center gap-2">
                <img
                  src="/hoteleria.png"
                  className="h-12 md:h-15 object-contain"
                  alt="Logo"
                />
                <h3 className="font-bold text-lg md:text-xl uppercase">
                  hoteleria
                </h3>
              </div>
              <div className="bg-[#F1F1F1] px-4 py-1 flex flex-col items-center rounded-xl border border-gray-300 self-start sm:self-auto">
                <p className="font-semibold text-sm sm:text-base">
                  Voucher de Hoteleria
                </p>
              </div>
            </div>

            {/* DATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 w-full place-content-center place-items-start gap-3">
              <div className="min-w-full">
                <div className="flex flex-col items-start w-full py-2">
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.hotel_name}
                  </p>
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <p>Dirección:</p>
                    <p className="font-semibold">{voucherData.hotel_address || "-"}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm sm:text-base">
                    <p>Telefono:</p>
                    <p className="font-semibold">{voucherData.hotel_phone || "-"}</p>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <hr className="border border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start w-full pb-2 md:pb-9 pt-2">
                  <p className="text-lg sm:text-xl font-medium">Check-in</p>
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.fecha_salida}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <hr className="border border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start w-full py-2">
                  <p className="text-lg sm:text-xl font-medium">Habitación</p>
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.room_type}
                  </p>
                </div>
              </div>

              {/* DIVISION */}
              <div className="w-full">
                <div className="hidden md:block md:h-24 w-full py-2" />
                <div className="flex flex-col items-center gap-2">
                  <hr className="border md:block hidden border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start py-2 w-full">
                  <p className="text-lg sm:text-xl font-medium">Check-out</p>
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.fecha_regreso || "-"}
                  </p>
                  <p className="text-lg sm:text-xl font-medium">
                    {voucherData.noches} noches
                  </p>
                </div>
                <div className="flex flex-col w-full items-center gap-2">
                  <hr className="border border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start w-full py-2">
                  <p className="text-lg sm:text-xl font-medium">
                    Fecha de regreso
                  </p>
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.fecha_regreso || voucherData.fecha_salida}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE EXCURSIONES */}
          {hasExcursion && (
          <div className="border-black py-5 px-4 sm:px-6 md:px-10 border-b flex flex-col gap-6 md:gap-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-5">
              <div className="flex items-center gap-2">
                <img
                  src="/excursiones.png"
                  className="h-12 md:h-15 object-contain"
                  alt="Logo"
                />
                <h3 className="font-bold text-lg md:text-xl uppercase">
                  excursiones
                </h3>
              </div>
              <div className="bg-[#F1F1F1] px-4 py-1 flex flex-col items-center rounded-xl border border-gray-300 self-start sm:self-auto">
                <p className="font-semibold text-sm sm:text-base">
                  Voucher de Excursión
                </p>
              </div>
            </div>

            {/* DATA */}
            <div className="grid grid-cols-1 md:grid-cols-2 w-full place-content-center place-items-start gap-3">
              <div className="min-w-full">
                <div className="flex flex-col items-start w-full py-2">
                  <p className="font-bold text-xl sm:text-2xl">Pasajeros</p>
                  <div className="flex flex-wrap items-start">
                    {passengers?.map((p, i) => (
                      <span
                        key={i}
                        className="text-lg sm:text-xl pr-2 font-semibold">
                        {p} {i + 1 !== passengers?.length ? "/" : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <hr className="border border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start w-full pb-2 md:pb-9 pt-2">
                  <p className="text-lg sm:text-xl font-medium">Destino</p>
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.destino_name || "-"}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <hr className="border border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start w-full py-2">
                  <p className="text-lg sm:text-xl font-medium">Descripción</p>
                  <p className="font-semibold text-base sm:text-lg">
                    {voucherData.excursion_description || "-"}
                  </p>
                </div>
              </div>

              {/* DIVISION */}
              <div className="w-full">
                <div className="hidden md:block md:h-24 w-full py-2" />
                <div className="flex flex-col mt-2 items-center gap-2">
                  <hr className="border md:block hidden border-gray-300 w-full" />
                </div>
                <div className="flex flex-col items-start pt-2 w-full">
                  <p className="text-lg sm:text-xl font-medium">Excursión</p>
                  <p className="font-semibold text-xl sm:text-2xl">
                    {voucherData.excursion_name || "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Bloque Observaciones */}
          <div
            className={`${bg} flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 p-5 sm:p-8 md:p-12`}>
            <img
              src="/obs.png"
              alt="Observaciones"
              className="h-20 w-20 md:h-28 md:w-28 object-contain shrink-0"
            />
            <div className="flex flex-col gap-2 text-center md:text-left">
              <h5 className="text-lg sm:text-xl font-bold">OBSERVACIONES</h5>
              <p className="text-base sm:text-lg font-medium">
                Servicios contratados a través de <b>Ruta 86 EVT</b>.
                Presentarse en el lugar de salida con este voucher y DNI
                vigente.
              </p>
              <hr className="border border-gray-400 w-full" />
              <p className="text-xs font-medium">
                Esta contratación está sujeta a las condiciones generales de
                venta que el pasajero declaró conocer y aceptar al momento de
                hacer la reserva. Ruta 86 EVT actúa como intermediario entre el
                pasajero y los prestadores de servicios en este documento.
              </p>
              <hr className="border border-gray-400 w-full" />
              <p className="text-xs font-medium">
                Cualquier consulta o queja se deberá realizar con la persona que
                se contrató el viaje.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
