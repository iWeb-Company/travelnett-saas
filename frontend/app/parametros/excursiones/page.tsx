"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ModalLayout from "@/app/components/ModalLayout";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ExcursionesPage() {
  const r = useRouter();
  const [modalOpenPut, setModalOpenPut] = useState(false);
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [excursionData, setExcursionData] = useState({
    destino: "",
    nombre: "",
    descripcion: "",
  });
  const [search, setSearch] = useState("");

  const excursiones = [
    {
      id: 1,
      nombre: "Tren del Cielo",
      descripcion: "Descripcion",
      destino: "MDQ",
    },
    {
      id: 2,
      nombre: "Tren del Cielo",
      descripcion: "Descripcion",
      destino: "MDQ",
    },
    {
      id: 3,
      nombre: "Tren del Cielo",
      descripcion: "Descripcion",
      destino: "MDQ",
    },
    {
      id: 4,
      nombre: "Tren del Cielo",
      descripcion: "Descripcion",
      destino: "MDQ",
    },
    {
      id: 5,
      nombre: "Tren del Cielo",
      descripcion: "Descripcion",
      destino: "MDQ",
    },
  ];

  const excursionesFiltered = excursiones.filter((e) =>
    e.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const handleClickPut = (exc: any) => {
    setModalOpenPut(true);
    setExcursionData(exc);
  };

  return (
    <Container>
      <ToggleSalidas />
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={() => r.push("/parametros")}
        className="flex items-center my-3 justify-start gap-3">
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>
      <h2 className="text-black font-semibold text-center md:text-xl mb-4">
        Excursiones
      </h2>
      <div className="flex justify-center mb-6">
        <button
          onClick={() => setModalOpenAdd(true)}
          className="flex items-center gap-2  text-primary font-medium px-4 py-2 rounded-lg">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M7.12127 4.3474C9.6995 4.06194 12.3014 4.06194 14.8796 4.3474C16.3071 4.5074 17.4588 5.63156 17.6263 7.06406C17.9318 9.67906 17.9318 12.3207 17.6263 14.9357C17.4588 16.3682 16.3071 17.4924 14.8796 17.6524C12.3014 17.9379 9.6995 17.9379 7.12127 17.6524C5.69377 17.4924 4.5421 16.3682 4.3746 14.9357C4.06914 12.321 4.06914 9.67962 4.3746 7.0649C4.45932 6.36896 4.77658 5.72202 5.27496 5.22893C5.77334 4.73585 6.42363 4.42552 7.12043 4.34823M11.0004 6.83906C11.1662 6.83906 11.3252 6.90491 11.4424 7.02212C11.5596 7.13933 11.6254 7.2983 11.6254 7.46406V10.3749H14.5363C14.702 10.3749 14.861 10.4407 14.9782 10.558C15.0954 10.6752 15.1613 10.8341 15.1613 10.9999C15.1613 11.1657 15.0954 11.3246 14.9782 11.4418C14.861 11.559 14.702 11.6249 14.5363 11.6249H11.6254V14.5357C11.6254 14.7015 11.5596 14.8605 11.4424 14.9777C11.3252 15.0949 11.1662 15.1607 11.0004 15.1607C10.8347 15.1607 10.6757 15.0949 10.5585 14.9777C10.4413 14.8605 10.3754 14.7015 10.3754 14.5357V11.6249H7.4646C7.29884 11.6249 7.13987 11.559 7.02266 11.4418C6.90545 11.3246 6.8396 11.1657 6.8396 10.9999C6.8396 10.8341 6.90545 10.6752 7.02266 10.558C7.13987 10.4407 7.29884 10.3749 7.4646 10.3749H10.3754V7.46406C10.3754 7.2983 10.4413 7.13933 10.5585 7.02212C10.6757 6.90491 10.8347 6.83906 11.0004 6.83906Z"
              fill="#0546F7"
            />
          </svg>
          Agregar
        </button>
      </div>

      <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.41667 10.8333C3.90278 10.8333 2.62167 10.3089 1.57333 9.26C0.525 8.21111 0.000555996 6.93 4.40917e-07 5.41667C-0.000555115 3.90333 0.523889 2.62222 1.57333 1.57333C2.62278 0.524444 3.90389 0 5.41667 0C6.92944 0 8.21083 0.524444 9.26083 1.57333C10.3108 2.62222 10.835 3.90333 10.8333 5.41667C10.8333 6.02778 10.7361 6.60417 10.5417 7.14583C10.3472 7.6875 10.0833 8.16667 9.75 8.58333L14.4167 13.25C14.5694 13.4028 14.6458 13.5972 14.6458 13.8333C14.6458 14.0694 14.5694 14.2639 14.4167 14.4167C14.2639 14.5694 14.0694 14.6458 13.8333 14.6458C13.5972 14.6458 13.4028 14.5694 13.25 14.4167L8.58333 9.75C8.16667 10.0833 7.6875 10.3472 7.14583 10.5417C6.60417 10.7361 6.02778 10.8333 5.41667 10.8333ZM5.41667 9.16667C6.45833 9.16667 7.34389 8.80222 8.07333 8.07333C8.80278 7.34444 9.16722 6.45889 9.16667 5.41667C9.16611 4.37444 8.80167 3.48917 8.07333 2.76083C7.345 2.0325 6.45944 1.66778 5.41667 1.66667C4.37389 1.66556 3.48861 2.03028 2.76083 2.76083C2.03306 3.49139 1.66833 4.37667 1.66667 5.41667C1.665 6.45667 2.02972 7.34222 2.76083 8.07333C3.49195 8.80444 4.37722 9.16889 5.41667 9.16667Z"
                fill="black"
                fill-opacity="0.5"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg py-2 pl-9 pr-4 text-black/60 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <ul className="border border-gray-300 rounded-lg overflow-hidden divide-y divide-gray-200">
          {excursionesFiltered.length === 0 ? (
            <li className="py-4 text-center text-gray-500 text-sm">
              Sin resultados
            </li>
          ) : (
            excursiones.map((excursion) => (
              <li
                key={excursion.id}
                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                <span className="font-medium text-gray-800">
                  {excursion.nombre}
                </span>
                <div className="flex items-center gap-3">
                  {/* BOTON EDITAR */}
                  <button
                    onClick={() => handleClickPut(excursion)}
                    title="Editar"
                    className="text-gray-600 hover:text-primary">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M8.6821 0.655196C9.10147 0.23574 9.67029 5.8616e-05 10.2634 1.09323e-08C10.8566 -5.85942e-05 11.4255 0.23551 11.8449 0.654884C12.2644 1.07426 12.5 1.64308 12.5001 2.23622C12.5002 2.82937 12.2646 3.39824 11.8452 3.8177L11.2877 4.37582L8.12522 1.2127L8.6821 0.655196ZM7.46272 1.87582L1.21272 8.1252C0.958684 8.37897 0.780167 8.69836 0.697097 9.0477L0.0127222 11.9239C-0.00580801 12.0019 -0.00407066 12.0832 0.0177686 12.1602C0.039608 12.2373 0.0808211 12.3075 0.137477 12.3641C0.194133 12.4206 0.264344 12.4618 0.341412 12.4835C0.41848 12.5053 0.499837 12.5069 0.577722 12.4883L3.45335 11.8033C3.80291 11.7204 4.12252 11.5418 4.37647 11.2877L10.6252 5.03832L7.46272 1.87582Z"
                        fill="black"
                      />
                    </svg>
                  </button>
                  {/* BOTON ELIMINAR */}
                  <button
                    title="Eliminar"
                    className="text-gray-600 hover:text-red-500">
                    <svg
                      width="9"
                      height="12"
                      viewBox="0 0 9 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M8.75 0.625H6.5625L5.9375 0H2.8125L2.1875 0.625H0V1.875H8.75M0.625 10C0.625 10.3315 0.756696 10.6495 0.991117 10.8839C1.22554 11.1183 1.54348 11.25 1.875 11.25H6.875C7.20652 11.25 7.52446 11.1183 7.75888 10.8839C7.9933 10.6495 8.125 10.3315 8.125 10V2.5H0.625V10Z"
                        fill="black"
                      />
                    </svg>
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="xl:flex hidden absolute md:right-40 md:top-60 mt-8 justify-end">
        <img src="/logo-grande.png" className="size-50" alt="Logo Empresa" />
      </div>
      {modalOpenAdd && (
        <ModalLayout
          setModalOpen={() => setModalOpenAdd(false)}
          title="Agregar Excursión"
          svg={
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.8568 7.92582L15.4768 3.98777C15.3654 3.85461 15.2261 3.74752 15.0687 3.67404C14.9114 3.60056 14.7398 3.56249 14.5662 3.5625H2.375C2.06006 3.5625 1.75801 3.68761 1.53531 3.91031C1.31261 4.13301 1.1875 4.43506 1.1875 4.75V13.0625C1.1875 13.3774 1.31261 13.6795 1.53531 13.9022C1.75801 14.1249 2.06006 14.25 2.375 14.25H3.63672C3.76752 14.7609 4.06464 15.2137 4.48122 15.537C4.8978 15.8604 5.41015 16.0359 5.9375 16.0359C6.46485 16.0359 6.9772 15.8604 7.39378 15.537C7.81037 15.2137 8.10748 14.7609 8.23828 14.25H11.9492C12.08 14.7609 12.3771 15.2137 12.7937 15.537C13.2103 15.8604 13.7226 16.0359 14.25 16.0359C14.7774 16.0359 15.2897 15.8604 15.7063 15.537C16.1229 15.2137 16.42 14.7609 16.5508 14.25H17.8125C18.1274 14.25 18.4295 14.1249 18.6522 13.9022C18.8749 13.6795 19 13.3774 19 13.0625V8.3125C19 8.17063 18.9492 8.03346 18.8568 7.92582ZM2.375 7.71875V4.75H6.53125V7.71875H2.375ZM5.9375 14.8438C5.70263 14.8438 5.47304 14.7741 5.27776 14.6436C5.08248 14.5131 4.93027 14.3277 4.84039 14.1107C4.75051 13.8937 4.727 13.6549 4.77282 13.4246C4.81864 13.1942 4.93174 12.9826 5.09781 12.8166C5.26389 12.6505 5.47548 12.5374 5.70583 12.4916C5.93618 12.4457 6.17495 12.4693 6.39194 12.5591C6.60892 12.649 6.79439 12.8012 6.92487 12.9965C7.05535 13.1918 7.125 13.4214 7.125 13.6562C7.125 13.9712 6.99989 14.2732 6.77719 14.4959C6.55449 14.7186 6.25244 14.8438 5.9375 14.8438ZM11.875 7.71875H7.71875V4.75H11.875V7.71875ZM14.25 14.8438C14.0151 14.8438 13.7855 14.7741 13.5903 14.6436C13.395 14.5131 13.2428 14.3277 13.1529 14.1107C13.063 13.8937 13.0395 13.6549 13.0853 13.4246C13.1311 13.1942 13.2442 12.9826 13.4103 12.8166C13.5764 12.6505 13.788 12.5374 14.0183 12.4916C14.2487 12.4457 14.4874 12.4693 14.7044 12.5591C14.9214 12.649 15.1069 12.8012 15.2374 12.9965C15.3679 13.1918 15.4375 13.4214 15.4375 13.6562C15.4375 13.9712 15.3124 14.2732 15.0897 14.4959C14.867 14.7186 14.5649 14.8438 14.25 14.8438ZM13.0625 7.71875V4.75H14.5662L17.1141 7.71875H13.0625Z"
                fill="#F1F1F1"
              />
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <select className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                {excursiones.map((excursion) => (
                  <option key={excursion.id} value={excursion.id}>
                    {excursion.destino}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Nombre"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Descripción"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </ModalLayout>
      )}
      {modalOpenPut && (
        <ModalLayout
          setModalOpen={() => setModalOpenPut(false)}
          title="Editar Excursión"
          svg={
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18.8568 7.92582L15.4768 3.98777C15.3654 3.85461 15.2261 3.74752 15.0687 3.67404C14.9114 3.60056 14.7398 3.56249 14.5662 3.5625H2.375C2.06006 3.5625 1.75801 3.68761 1.53531 3.91031C1.31261 4.13301 1.1875 4.43506 1.1875 4.75V13.0625C1.1875 13.3774 1.31261 13.6795 1.53531 13.9022C1.75801 14.1249 2.06006 14.25 2.375 14.25H3.63672C3.76752 14.7609 4.06464 15.2137 4.48122 15.537C4.8978 15.8604 5.41015 16.0359 5.9375 16.0359C6.46485 16.0359 6.9772 15.8604 7.39378 15.537C7.81037 15.2137 8.10748 14.7609 8.23828 14.25H11.9492C12.08 14.7609 12.3771 15.2137 12.7937 15.537C13.2103 15.8604 13.7226 16.0359 14.25 16.0359C14.7774 16.0359 15.2897 15.8604 15.7063 15.537C16.1229 15.2137 16.42 14.7609 16.5508 14.25H17.8125C18.1274 14.25 18.4295 14.1249 18.6522 13.9022C18.8749 13.6795 19 13.3774 19 13.0625V8.3125C19 8.17063 18.9492 8.03346 18.8568 7.92582ZM2.375 7.71875V4.75H6.53125V7.71875H2.375ZM5.9375 14.8438C5.70263 14.8438 5.47304 14.7741 5.27776 14.6436C5.08248 14.5131 4.93027 14.3277 4.84039 14.1107C4.75051 13.8937 4.727 13.6549 4.77282 13.4246C4.81864 13.1942 4.93174 12.9826 5.09781 12.8166C5.26389 12.6505 5.47548 12.5374 5.70583 12.4916C5.93618 12.4457 6.17495 12.4693 6.39194 12.5591C6.60892 12.649 6.79439 12.8012 6.92487 12.9965C7.05535 13.1918 7.125 13.4214 7.125 13.6562C7.125 13.9712 6.99989 14.2732 6.77719 14.4959C6.55449 14.7186 6.25244 14.8438 5.9375 14.8438ZM11.875 7.71875H7.71875V4.75H11.875V7.71875ZM14.25 14.8438C14.0151 14.8438 13.7855 14.7741 13.5903 14.6436C13.395 14.5131 13.2428 14.3277 13.1529 14.1107C13.063 13.8937 13.0395 13.6549 13.0853 13.4246C13.1311 13.1942 13.2442 12.9826 13.4103 12.8166C13.5764 12.6505 13.788 12.5374 14.0183 12.4916C14.2487 12.4457 14.4874 12.4693 14.7044 12.5591C14.9214 12.649 15.1069 12.8012 15.2374 12.9965C15.3679 13.1918 15.4375 13.4214 15.4375 13.6562C15.4375 13.9712 15.3124 14.2732 15.0897 14.4959C14.867 14.7186 14.5649 14.8438 14.25 14.8438ZM13.0625 7.71875V4.75H14.5662L17.1141 7.71875H13.0625Z"
                fill="#F1F1F1"
              />
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={excursionData?.destino}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="CUIT"
                value={excursionData?.nombre}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                value={excursionData?.descripcion}
                placeholder="Web"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}
