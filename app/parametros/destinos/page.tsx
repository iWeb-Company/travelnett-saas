"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ModalLayout from "@/app/components/ModalLayout";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DestinosPage() {
  const r = useRouter();
  const [modalOpenPut, setModalOpenPut] = useState(false);
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [destinosData, setDestinosData] = useState({
    nombre: "",
    sigla: "",
  });

  const destinos = [
    { id: 1, nombre: "Mar Del Plata", sigla: "MDQ" },
    { id: 2, nombre: "Salta", sigla: "SLA" },
    { id: 3, nombre: "San Bernardo", sigla: "SBE" },
    { id: 4, nombre: "Puerto Madryn", sigla: "PMY" },
  ];

  const destinosFiltered = destinos.filter((e) =>
    e.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const handleClickPut = (destino: any) => {
    setModalOpenPut(true);
    setDestinosData(destino);
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
        Destinos
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
          {destinosFiltered.length === 0 ? (
            <li className="py-4 text-center text-gray-500 text-sm">
              Sin resultados
            </li>
          ) : (
            destinosFiltered.map((destino) => (
              <li
                key={destino.id}
                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                <span className="font-medium text-gray-800">
                  {destino.nombre}
                </span>
                <div className="flex items-center gap-3">
                  {/* BOTON EDITAR */}
                  <button
                    onClick={() => handleClickPut(destino)}
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
          title="Agregar Destino"
          svg={
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14.1705 13.7668C13.9647 13.1334 13.3709 12.6663 12.6663 12.6663H11.8747V10.2913C11.8747 10.0814 11.7913 9.88002 11.6428 9.73155C11.4943 9.58308 11.293 9.49967 11.083 9.49967H6.33301V7.91634H7.91634C8.1263 7.91634 8.32767 7.83293 8.47613 7.68447C8.6246 7.536 8.70801 7.33464 8.70801 7.12467V5.54134H10.2913C10.7113 5.54134 11.114 5.37453 11.4109 5.07759C11.7079 4.78066 11.8747 4.37793 11.8747 3.95801V3.63342C12.8219 4.0153 13.6625 4.62101 14.3244 5.39871C14.9864 6.17641 15.4501 7.10294 15.6757 8.09899C15.9014 9.09503 15.8823 10.1309 15.6202 11.118C15.3581 12.1051 14.8606 13.0139 14.1705 13.7668ZM8.70801 15.7776C5.58092 15.3897 3.16634 12.7297 3.16634 9.49967C3.16634 9.00884 3.22967 8.53384 3.33259 8.08259L7.12467 11.8747V12.6663C7.12467 13.0863 7.29149 13.489 7.58842 13.7859C7.88535 14.0829 8.28808 14.2497 8.70801 14.2497M9.49967 1.58301C8.46004 1.58301 7.43059 1.78778 6.4701 2.18563C5.5096 2.58348 4.63688 3.16662 3.90175 3.90175C2.41708 5.38641 1.58301 7.40004 1.58301 9.49967C1.58301 11.5993 2.41708 13.6129 3.90175 15.0976C4.63688 15.8327 5.5096 16.4159 6.4701 16.8137C7.43059 17.2116 8.46004 17.4163 9.49967 17.4163C11.5993 17.4163 13.6129 16.5823 15.0976 15.0976C16.5823 13.6129 17.4163 11.5993 17.4163 9.49967C17.4163 8.46004 17.2116 7.43059 16.8137 6.4701C16.4159 5.5096 15.8327 4.63688 15.0976 3.90175C14.3625 3.16662 13.4897 2.58348 12.5293 2.18563C11.5688 1.78778 10.5393 1.58301 9.49967 1.58301Z"
                fill="#F1F1F1"
              />
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <select className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                {destinos.map((destino) => (
                  <option key={destino.id} value={destino.id}>
                    {destino.nombre}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Nombre"
                value={destinosData?.nombre}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                value={destinosData?.sigla}
                placeholder="Sigla"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </ModalLayout>
      )}
      {modalOpenPut && (
        <ModalLayout
          setModalOpen={() => setModalOpenPut(false)}
          title="Editar Destino"
          svg={
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M14.1705 13.7668C13.9647 13.1334 13.3709 12.6663 12.6663 12.6663H11.8747V10.2913C11.8747 10.0814 11.7913 9.88002 11.6428 9.73155C11.4943 9.58308 11.293 9.49967 11.083 9.49967H6.33301V7.91634H7.91634C8.1263 7.91634 8.32767 7.83293 8.47613 7.68447C8.6246 7.536 8.70801 7.33464 8.70801 7.12467V5.54134H10.2913C10.7113 5.54134 11.114 5.37453 11.4109 5.07759C11.7079 4.78066 11.8747 4.37793 11.8747 3.95801V3.63342C12.8219 4.0153 13.6625 4.62101 14.3244 5.39871C14.9864 6.17641 15.4501 7.10294 15.6757 8.09899C15.9014 9.09503 15.8823 10.1309 15.6202 11.118C15.3581 12.1051 14.8606 13.0139 14.1705 13.7668ZM8.70801 15.7776C5.58092 15.3897 3.16634 12.7297 3.16634 9.49967C3.16634 9.00884 3.22967 8.53384 3.33259 8.08259L7.12467 11.8747V12.6663C7.12467 13.0863 7.29149 13.489 7.58842 13.7859C7.88535 14.0829 8.28808 14.2497 8.70801 14.2497M9.49967 1.58301C8.46004 1.58301 7.43059 1.78778 6.4701 2.18563C5.5096 2.58348 4.63688 3.16662 3.90175 3.90175C2.41708 5.38641 1.58301 7.40004 1.58301 9.49967C1.58301 11.5993 2.41708 13.6129 3.90175 15.0976C4.63688 15.8327 5.5096 16.4159 6.4701 16.8137C7.43059 17.2116 8.46004 17.4163 9.49967 17.4163C11.5993 17.4163 13.6129 16.5823 15.0976 15.0976C16.5823 13.6129 17.4163 11.5993 17.4163 9.49967C17.4163 8.46004 17.2116 7.43059 16.8137 6.4701C16.4159 5.5096 15.8327 4.63688 15.0976 3.90175C14.3625 3.16662 13.4897 2.58348 12.5293 2.18563C11.5688 1.78778 10.5393 1.58301 9.49967 1.58301Z"
                fill="#F1F1F1"
              />
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <select
                value={destinosData?.nombre}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                {destinos.map((destino) => (
                  <option key={destino.id} value={destino.id}>
                    {destino.nombre}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Nombre"
                value={destinosData?.nombre}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                value={destinosData?.sigla}
                placeholder="Sigla"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}
