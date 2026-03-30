"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ModalLayout from "@/app/components/ModalLayout";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PeriodosPage() {
  const r = useRouter();
  const [modalOpenPut, setModalOpenPut] = useState(false);
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [periodosData, setPeriodosData] = useState({
    id: 0,
    nombre: "",
    img: "",
  });

  const periodos = [
    { id: 1, nombre: "Vacaciones de Invierno 2025", img: "" },
    { id: 2, nombre: "FSL Agosto", img: "" },
    { id: 4, nombre: "Segundo Semestre 2025", img: "" },
    { id: 5, nombre: "MiniTurismo", img: "" },
  ];

  const periodosFiltered = periodos.filter((e) =>
    e.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const handleClickPut = (periodo: any) => {
    setModalOpenPut(true);
    setPeriodosData(periodo);
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
        Periodos
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
          {periodosFiltered.length === 0 ? (
            <li className="py-4 text-center text-gray-500 text-sm">
              Sin resultados
            </li>
          ) : (
            periodosFiltered.map((periodo) => (
              <li
                key={periodo.id}
                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                <span className="font-medium text-gray-800">
                  {periodo.nombre}
                </span>
                <div className="flex items-center gap-3">
                  {/* BOTON FOTO */}
                  <button
                    title="Editar Foto"
                    className="text-gray-600 hover:text-primary">
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 15 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3.125 13.125C2.78125 13.125 2.48708 13.0027 2.2425 12.7581C1.99792 12.5135 1.87542 12.2192 1.875 11.875V3.125C1.875 2.78125 1.9975 2.48708 2.2425 2.2425C2.4875 1.99792 2.78167 1.87542 3.125 1.875H11.875C12.2188 1.875 12.5131 1.9975 12.7581 2.2425C13.0031 2.4875 13.1254 2.78167 13.125 3.125V11.875C13.125 12.2188 13.0027 12.5131 12.7581 12.7581C12.5135 13.0031 12.2192 13.1254 11.875 13.125H3.125ZM3.75 10.625H11.25L8.90625 7.5L7.03125 10L5.625 8.125L3.75 10.625Z"
                        fill="black"
                      />
                      <g clip-path="url(#clip0_567_3505)">
                        <path
                          d="M4 14.5C5.933 14.5 7.5 12.933 7.5 11C7.5 9.067 5.933 7.5 4 7.5C2.067 7.5 0.5 9.067 0.5 11C0.5 12.933 2.067 14.5 4 14.5Z"
                          fill="#4CAF50"
                        />
                        <path
                          d="M5.76628 9.43359L3.49961 11.7003L2.56628 10.7669L2.09961 11.2336L3.49961 12.6336L6.23294 9.90026L5.76628 9.43359Z"
                          fill="#CCFF90"
                        />
                      </g>
                      <defs>
                        <clipPath id="clip0_567_3505">
                          <rect
                            width="8"
                            height="8"
                            fill="white"
                            transform="translate(0 7)"
                          />
                        </clipPath>
                      </defs>
                    </svg>
                  </button>
                  {/* BOTON EDITAR */}
                  <button
                    onClick={() => handleClickPut(periodo)}
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
          title="Agregar Empresa de Transporte"
          svg={
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.33301 14.2497C5.89759 14.2497 5.52498 14.0948 5.21517 13.785C4.90537 13.4752 4.7502 13.1023 4.74967 12.6663V3.16634C4.74967 2.73092 4.90484 2.35831 5.21517 2.04851C5.52551 1.7387 5.89812 1.58354 6.33301 1.58301H15.833C16.2684 1.58301 16.6413 1.73817 16.9516 2.04851C17.262 2.35884 17.4169 2.73145 17.4163 3.16634V12.6663C17.4163 13.1018 17.2614 13.4746 16.9516 13.785C16.6418 14.0953 16.269 14.2502 15.833 14.2497H6.33301ZM3.16634 17.4163C2.73092 17.4163 2.35831 17.2614 2.04851 16.9516C1.7387 16.6418 1.58354 16.269 1.58301 15.833V5.54134C1.58301 5.31704 1.65901 5.12915 1.81101 4.97767C1.96301 4.8262 2.1509 4.7502 2.37467 4.74967C2.59845 4.74915 2.78661 4.82515 2.93913 4.97767C3.09166 5.1302 3.1674 5.31809 3.16634 5.54134V15.833H13.458C13.6823 15.833 13.8705 15.909 14.0225 16.061C14.1745 16.213 14.2502 16.4009 14.2497 16.6247C14.2491 16.8485 14.1731 17.0366 14.0217 17.1891C13.8702 17.3417 13.6823 17.4174 13.458 17.4163H3.16634ZM6.33301 4.74967H15.833V3.16634H6.33301V4.74967Z"
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
              <div className="flex gap-2 items-center">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 60 60"
                  fill="white"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M45 36V45H36V51H45V60H51V51H60V45H51V36H45ZM30.9 54H6C2.7 54 0 51.3 0 48V6C0 2.7 2.7 0 6 0H48C51.3 0 54 2.7 54 6V30.9C52.2 30.3 50.1 30 48 30C44.7 30 41.4 30.9 38.7 32.7L34.5 27L24 40.5L16.5 31.5L6 45H30.3C30 45.9 30 47.1 30 48C30 50.1 30.3 52.2 30.9 54Z"
                    fill="white"
                  />
                </svg>
                <input type="file" name="" id="" />
              </div>
            </div>
          </div>
        </ModalLayout>
      )}
      {modalOpenPut && (
        <ModalLayout
          setModalOpen={() => setModalOpenPut(false)}
          title="Editar Empresa de Transporte"
          svg={
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6.33301 14.2497C5.89759 14.2497 5.52498 14.0948 5.21517 13.785C4.90537 13.4752 4.7502 13.1023 4.74967 12.6663V3.16634C4.74967 2.73092 4.90484 2.35831 5.21517 2.04851C5.52551 1.7387 5.89812 1.58354 6.33301 1.58301H15.833C16.2684 1.58301 16.6413 1.73817 16.9516 2.04851C17.262 2.35884 17.4169 2.73145 17.4163 3.16634V12.6663C17.4163 13.1018 17.2614 13.4746 16.9516 13.785C16.6418 14.0953 16.269 14.2502 15.833 14.2497H6.33301ZM3.16634 17.4163C2.73092 17.4163 2.35831 17.2614 2.04851 16.9516C1.7387 16.6418 1.58354 16.269 1.58301 15.833V5.54134C1.58301 5.31704 1.65901 5.12915 1.81101 4.97767C1.96301 4.8262 2.1509 4.7502 2.37467 4.74967C2.59845 4.74915 2.78661 4.82515 2.93913 4.97767C3.09166 5.1302 3.1674 5.31809 3.16634 5.54134V15.833H13.458C13.6823 15.833 13.8705 15.909 14.0225 16.061C14.1745 16.213 14.2502 16.4009 14.2497 16.6247C14.2491 16.8485 14.1731 17.0366 14.0217 17.1891C13.8702 17.3417 13.6823 17.4174 13.458 17.4163H3.16634ZM6.33301 4.74967H15.833V3.16634H6.33301V4.74967Z"
                fill="#F1F1F1"
              />
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={periodosData?.nombre}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              {periodosData.img ? (
                <img src={periodosData.img} alt="" />
              ) : (
                <div className="flex gap-2 items-center">
                  <svg
                    width="30"
                    height="30"
                    viewBox="0 0 60 60"
                    fill="white"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M45 36V45H36V51H45V60H51V51H60V45H51V36H45ZM30.9 54H6C2.7 54 0 51.3 0 48V6C0 2.7 2.7 0 6 0H48C51.3 0 54 2.7 54 6V30.9C52.2 30.3 50.1 30 48 30C44.7 30 41.4 30.9 38.7 32.7L34.5 27L24 40.5L16.5 31.5L6 45H30.3C30 45.9 30 47.1 30 48C30 50.1 30.3 52.2 30.9 54Z"
                      fill="white"
                    />
                  </svg>
                  <input type="file" name="" id="" />
                </div>
              )}
            </div>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}
