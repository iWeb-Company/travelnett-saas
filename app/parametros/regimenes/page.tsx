"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ModalLayout from "@/app/components/ModalLayout";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function RegimenesPage() {
  const r = useRouter();
  const [modalOpenPut, setModalOpenPut] = useState(false);
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [regimenesData, setRegimenesData] = useState({
    nombre: "",
    sigla: "",
    descripcion: "",
  });

  const regimenes = [
    { id: 1, nombre: "S/C", sigla: "SC", descripcion: "Sin Comidas" },
    { id: 2, nombre: "DES", sigla: "DES", descripcion: "Desayuno" },
    { id: 3, nombre: "MAP", sigla: "MAP", descripcion: "Media Pensión" },
    { id: 4, nombre: "PC", sigla: "PC", descripcion: "Pensión Completa" },
    { id: 5, nombre: "ALL", sigla: "ALL", descripcion: "Todo Incluido" },
  ];

  const regimenesFiltered = regimenes.filter((e) =>
    e.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const handleClickPut = (regimen: any) => {
    setModalOpenPut(true);
    setRegimenesData(regimen);
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
        Regimenes
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
          {regimenesFiltered.length === 0 ? (
            <li className="py-4 text-center text-gray-500 text-sm">
              Sin resultados
            </li>
          ) : (
            regimenesFiltered.map((regimen) => (
              <li
                key={regimen.id}
                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                <span className="font-medium text-gray-800">
                  {regimen.nombre}
                </span>
                <div className="flex items-center gap-3">
                  {/* BOTON EDITAR */}
                  <button
                    onClick={() => handleClickPut(regimen)}
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
          title="Agregar Regimen"
          svg={
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7.98356 1.25163C8.06214 1.29058 8.13111 1.34645 8.18552 1.41524C8.23994 1.48402 8.27843 1.56401 8.29825 1.64944C8.31962 1.74325 8.90625 4.25363 8.90625 5.9375C8.90625 7.06563 8.38137 8.07144 7.56437 8.72338C7.2675 8.96088 7.125 9.21975 7.125 9.43588V10.013C7.125 10.0407 7.12658 10.0668 7.12975 10.0914C7.17013 10.3859 7.31619 11.4796 7.45275 12.6136C7.58694 13.7263 7.71875 14.9399 7.71875 15.4375C7.71875 16.0674 7.46853 16.6715 7.02313 17.1169C6.57773 17.5623 5.97364 17.8125 5.34375 17.8125C4.71386 17.8125 4.10977 17.5623 3.66437 17.1169C3.21897 16.6715 2.96875 16.0674 2.96875 15.4375C2.96875 14.9388 3.10056 13.7275 3.23475 12.6136C3.37131 11.4796 3.51738 10.3859 3.55775 10.0914L3.5625 10.013V9.43588C3.5625 9.21975 3.42 8.96088 3.12313 8.72338C2.70451 8.38968 2.36648 7.96593 2.13417 7.48362C1.90185 7.00131 1.78123 6.47284 1.78125 5.9375C1.78125 4.25956 2.36313 1.76225 2.38925 1.65063C2.42012 1.51862 2.49481 1.40098 2.60113 1.31687C2.70744 1.23276 2.83912 1.18716 2.97469 1.1875C3.30719 1.1875 3.57675 1.45706 3.57675 1.78956V5.34969C3.57207 5.42988 3.58387 5.51018 3.61143 5.58563C3.639 5.66109 3.68173 5.73009 3.737 5.78838C3.79227 5.84667 3.8589 5.89302 3.93277 5.92456C4.00665 5.9561 4.08621 5.97216 4.16654 5.97175C4.24687 5.97134 4.32626 5.95448 4.39981 5.92219C4.47337 5.88991 4.53952 5.84289 4.5942 5.78404C4.64887 5.72519 4.69091 5.65576 4.71771 5.58003C4.7445 5.50431 4.75549 5.42389 4.75 5.34375V1.78125C4.75 1.62378 4.81256 1.47276 4.92391 1.36141C5.03526 1.25006 5.18628 1.1875 5.34375 1.1875C5.50122 1.1875 5.65224 1.25006 5.76359 1.36141C5.87494 1.47276 5.9375 1.62378 5.9375 1.78125V5.37463C5.94081 5.53052 6.00591 5.67872 6.11848 5.78662C6.23106 5.89452 6.38188 5.95328 6.53778 5.94997C6.69368 5.94666 6.84188 5.88156 6.94978 5.76899C7.05767 5.65641 7.11643 5.50559 7.11312 5.34969V1.78719C7.11312 1.45588 7.3815 1.1875 7.714 1.1875C7.74012 1.1875 7.8565 1.1875 7.98356 1.25163ZM10.6875 6.53125C10.6875 5.114 11.2505 3.7548 12.2526 2.75265C13.2548 1.7505 14.614 1.1875 16.0312 1.1875C16.1887 1.1875 16.3397 1.25006 16.4511 1.36141C16.5624 1.47276 16.625 1.62378 16.625 1.78125V8.87419L16.6476 9.08438C16.742 9.97065 16.8327 10.8573 16.9195 11.7444C17.0656 13.2359 17.2188 14.9079 17.2188 15.4375C17.2188 16.0674 16.9685 16.6715 16.5231 17.1169C16.0777 17.5623 15.4736 17.8125 14.8438 17.8125C14.2139 17.8125 13.6098 17.5623 13.1644 17.1169C12.719 16.6715 12.4688 16.0674 12.4688 15.4375C12.4688 14.9079 12.6219 13.2359 12.768 11.7444C12.8428 10.9879 12.9176 10.2636 12.9734 9.72681L12.9972 9.5H11.875C11.5601 9.5 11.258 9.37489 11.0353 9.15219C10.8126 8.92949 10.6875 8.62745 10.6875 8.3125V6.53125Z"
                fill="#F1F1F1"
              />
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <input
                type="text"
                placeholder="Nombre"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Sigla (Abreviación)"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Descripcion"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </ModalLayout>
      )}
      {modalOpenPut && (
        <ModalLayout
          setModalOpen={() => setModalOpenPut(false)}
          title="Editar Regimen"
          svg={
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M7.98356 1.25163C8.06214 1.29058 8.13111 1.34645 8.18552 1.41524C8.23994 1.48402 8.27843 1.56401 8.29825 1.64944C8.31962 1.74325 8.90625 4.25363 8.90625 5.9375C8.90625 7.06563 8.38137 8.07144 7.56437 8.72338C7.2675 8.96088 7.125 9.21975 7.125 9.43588V10.013C7.125 10.0407 7.12658 10.0668 7.12975 10.0914C7.17013 10.3859 7.31619 11.4796 7.45275 12.6136C7.58694 13.7263 7.71875 14.9399 7.71875 15.4375C7.71875 16.0674 7.46853 16.6715 7.02313 17.1169C6.57773 17.5623 5.97364 17.8125 5.34375 17.8125C4.71386 17.8125 4.10977 17.5623 3.66437 17.1169C3.21897 16.6715 2.96875 16.0674 2.96875 15.4375C2.96875 14.9388 3.10056 13.7275 3.23475 12.6136C3.37131 11.4796 3.51738 10.3859 3.55775 10.0914L3.5625 10.013V9.43588C3.5625 9.21975 3.42 8.96088 3.12313 8.72338C2.70451 8.38968 2.36648 7.96593 2.13417 7.48362C1.90185 7.00131 1.78123 6.47284 1.78125 5.9375C1.78125 4.25956 2.36313 1.76225 2.38925 1.65063C2.42012 1.51862 2.49481 1.40098 2.60113 1.31687C2.70744 1.23276 2.83912 1.18716 2.97469 1.1875C3.30719 1.1875 3.57675 1.45706 3.57675 1.78956V5.34969C3.57207 5.42988 3.58387 5.51018 3.61143 5.58563C3.639 5.66109 3.68173 5.73009 3.737 5.78838C3.79227 5.84667 3.8589 5.89302 3.93277 5.92456C4.00665 5.9561 4.08621 5.97216 4.16654 5.97175C4.24687 5.97134 4.32626 5.95448 4.39981 5.92219C4.47337 5.88991 4.53952 5.84289 4.5942 5.78404C4.64887 5.72519 4.69091 5.65576 4.71771 5.58003C4.7445 5.50431 4.75549 5.42389 4.75 5.34375V1.78125C4.75 1.62378 4.81256 1.47276 4.92391 1.36141C5.03526 1.25006 5.18628 1.1875 5.34375 1.1875C5.50122 1.1875 5.65224 1.25006 5.76359 1.36141C5.87494 1.47276 5.9375 1.62378 5.9375 1.78125V5.37463C5.94081 5.53052 6.00591 5.67872 6.11848 5.78662C6.23106 5.89452 6.38188 5.95328 6.53778 5.94997C6.69368 5.94666 6.84188 5.88156 6.94978 5.76899C7.05767 5.65641 7.11643 5.50559 7.11312 5.34969V1.78719C7.11312 1.45588 7.3815 1.1875 7.714 1.1875C7.74012 1.1875 7.8565 1.1875 7.98356 1.25163ZM10.6875 6.53125C10.6875 5.114 11.2505 3.7548 12.2526 2.75265C13.2548 1.7505 14.614 1.1875 16.0312 1.1875C16.1887 1.1875 16.3397 1.25006 16.4511 1.36141C16.5624 1.47276 16.625 1.62378 16.625 1.78125V8.87419L16.6476 9.08438C16.742 9.97065 16.8327 10.8573 16.9195 11.7444C17.0656 13.2359 17.2188 14.9079 17.2188 15.4375C17.2188 16.0674 16.9685 16.6715 16.5231 17.1169C16.0777 17.5623 15.4736 17.8125 14.8438 17.8125C14.2139 17.8125 13.6098 17.5623 13.1644 17.1169C12.719 16.6715 12.4688 16.0674 12.4688 15.4375C12.4688 14.9079 12.6219 13.2359 12.768 11.7444C12.8428 10.9879 12.9176 10.2636 12.9734 9.72681L12.9972 9.5H11.875C11.5601 9.5 11.258 9.37489 11.0353 9.15219C10.8126 8.92949 10.6875 8.62745 10.6875 8.3125V6.53125Z"
                fill="#F1F1F1"
              />
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={regimenesData?.nombre}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                value={regimenesData?.sigla}
                placeholder="Sigla (Abreviación)"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Descripcion"
                value={regimenesData?.descripcion}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}
