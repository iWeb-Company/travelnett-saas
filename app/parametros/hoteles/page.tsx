"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ModalLayout from "@/app/components/ModalLayout";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HotelesPage() {
  const r = useRouter();
  const [modalOpenPut, setModalOpenPut] = useState(false);
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [search, setSearch] = useState("");
  const [hotelData, setHotelData] = useState({
    destino: "",
    nombre: "",
    direccion: "",
    telefono: "",
    web: "",
  });

  const hoteles = [
    { id: 1, nombre: "Dinamar" },
    { id: 2, nombre: "Hotel Sol" },
    { id: 3, nombre: "Hotel Sol" },
    { id: 4, nombre: "Hotel Sol" },
    { id: 5, nombre: "Hotel Sol" },
  ];

  const hotelesFiltered = hoteles.filter((e) =>
    e.nombre.toLowerCase().includes(search.toLowerCase()),
  );

  const handleClickPut = (hotel: any) => {
    setModalOpenPut(true);
    setHotelData(hotel);
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
        Hoteles
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
          {hotelesFiltered.length === 0 ? (
            <li className="py-4 text-center text-gray-500 text-sm">
              Sin resultados
            </li>
          ) : (
            hotelesFiltered.map((hotel) => (
              <li
                key={hotel.id}
                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                <span className="font-medium text-gray-800">
                  {hotel.nombre}
                </span>
                <div className="flex items-center gap-3">
                  {/* BOTON EDITAR */}
                  <button
                    onClick={() => handleClickPut(hotel)}
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
          title="Agregar Hotel"
          svg={
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M13.4583 2.375C13.8783 2.375 14.281 2.54181 14.5779 2.83875C14.8749 3.13568 15.0417 3.53841 15.0417 3.95833V4.75H15.8333C16.0433 4.75 16.2447 4.83341 16.3931 4.98187C16.5416 5.13034 16.625 5.3317 16.625 5.54167C16.625 5.75163 16.5416 5.95299 16.3931 6.10146C16.2447 6.24993 16.0433 6.33333 15.8333 6.33333V15.0417C16.0433 15.0417 16.2447 15.1251 16.3931 15.2735C16.5416 15.422 16.625 15.6234 16.625 15.8333C16.625 16.0433 16.5416 16.2447 16.3931 16.3931C16.2447 16.5416 16.0433 16.625 15.8333 16.625H10.6875V13.0625C10.6875 12.7476 10.5624 12.4455 10.3397 12.2228C10.117 12.0001 9.81494 11.875 9.5 11.875C9.18506 11.875 8.88301 12.0001 8.66031 12.2228C8.43761 12.4455 8.3125 12.7476 8.3125 13.0625V16.625H3.16667C2.9567 16.625 2.75534 16.5416 2.60687 16.3931C2.45841 16.2447 2.375 16.0433 2.375 15.8333C2.375 15.6234 2.45841 15.422 2.60687 15.2735C2.75534 15.1251 2.9567 15.0417 3.16667 15.0417V6.33333C2.9567 6.33333 2.75534 6.24993 2.60687 6.10146C2.45841 5.95299 2.375 5.75163 2.375 5.54167C2.375 5.3317 2.45841 5.13034 2.60687 4.98187C2.75534 4.83341 2.9567 4.75 3.16667 4.75H3.95833V3.95833C3.95833 3.53841 4.12515 3.13568 4.42208 2.83875C4.71901 2.54181 5.12174 2.375 5.54167 2.375H13.4583ZM6.33333 10.2917C6.12337 10.2917 5.92201 10.3751 5.77354 10.5235C5.62507 10.672 5.54167 10.8734 5.54167 11.0833V11.875C5.54167 12.085 5.62507 12.2863 5.77354 12.4348C5.92201 12.5833 6.12337 12.6667 6.33333 12.6667C6.5433 12.6667 6.74466 12.5833 6.89313 12.4348C7.04159 12.2863 7.125 12.085 7.125 11.875V11.0833C7.125 10.8734 7.04159 10.672 6.89313 10.5235C6.74466 10.3751 6.5433 10.2917 6.33333 10.2917ZM12.6667 10.2917C12.4728 10.2917 12.2856 10.3629 12.1407 10.4917C11.9958 10.6206 11.9032 10.7981 11.8805 10.9907L11.875 11.0833V11.875C11.8752 12.0768 11.9525 12.2709 12.091 12.4176C12.2295 12.5643 12.4188 12.6526 12.6203 12.6644C12.8217 12.6763 13.0201 12.6107 13.1748 12.4812C13.3295 12.3517 13.429 12.168 13.4528 11.9676L13.4583 11.875V11.0833C13.4583 10.8734 13.3749 10.672 13.2265 10.5235C13.078 10.3751 12.8766 10.2917 12.6667 10.2917ZM6.33333 7.125C6.13943 7.12503 5.95228 7.19622 5.80737 7.32507C5.66247 7.45392 5.5699 7.63147 5.54721 7.82404L5.54167 7.91667V8.70833C5.54189 8.91011 5.61915 9.10419 5.75767 9.25092C5.89619 9.39764 6.0855 9.48594 6.28694 9.49776C6.48837 9.50959 6.68672 9.44405 6.84145 9.31454C6.99618 9.18503 7.09563 9.00133 7.11946 8.80096L7.125 8.70833V7.91667C7.125 7.7067 7.04159 7.50534 6.89313 7.35687C6.74466 7.20841 6.5433 7.125 6.33333 7.125ZM9.5 7.125C9.30609 7.12503 9.11894 7.19622 8.97404 7.32507C8.82914 7.45392 8.73656 7.63147 8.71388 7.82404L8.70833 7.91667V8.70833C8.70856 8.91011 8.78582 9.10419 8.92434 9.25092C9.06286 9.39764 9.25217 9.48594 9.4536 9.49776C9.65504 9.50959 9.85338 9.44405 10.0081 9.31454C10.1629 9.18503 10.2623 9.00133 10.2861 8.80096L10.2917 8.70833V7.91667C10.2917 7.7067 10.2083 7.50534 10.0598 7.35687C9.91133 7.20841 9.70996 7.125 9.5 7.125ZM12.6667 7.125C12.4567 7.125 12.2553 7.20841 12.1069 7.35687C11.9584 7.50534 11.875 7.7067 11.875 7.91667V8.70833C11.875 8.9183 11.9584 9.11966 12.1069 9.26813C12.2553 9.41659 12.4567 9.5 12.6667 9.5C12.8766 9.5 13.078 9.41659 13.2265 9.26813C13.3749 9.11966 13.4583 8.9183 13.4583 8.70833V7.91667C13.4583 7.7067 13.3749 7.50534 13.2265 7.35687C13.078 7.20841 12.8766 7.125 12.6667 7.125ZM13.4583 3.95833H5.54167V4.75H13.4583V3.95833Z"
                fill="#F1F1F1"
              />
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <select className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                {hoteles.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.nombre}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Destino"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Direccion"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Telefono de contacto"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Web"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </ModalLayout>
      )}
      {modalOpenPut && (
        <ModalLayout
          setModalOpen={() => setModalOpenPut(false)}
          title="Editar Hotel"
          svg={
            <svg
              width="19"
              height="19"
              viewBox="0 0 19 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M13.4583 2.375C13.8783 2.375 14.281 2.54181 14.5779 2.83875C14.8749 3.13568 15.0417 3.53841 15.0417 3.95833V4.75H15.8333C16.0433 4.75 16.2447 4.83341 16.3931 4.98187C16.5416 5.13034 16.625 5.3317 16.625 5.54167C16.625 5.75163 16.5416 5.95299 16.3931 6.10146C16.2447 6.24993 16.0433 6.33333 15.8333 6.33333V15.0417C16.0433 15.0417 16.2447 15.1251 16.3931 15.2735C16.5416 15.422 16.625 15.6234 16.625 15.8333C16.625 16.0433 16.5416 16.2447 16.3931 16.3931C16.2447 16.5416 16.0433 16.625 15.8333 16.625H10.6875V13.0625C10.6875 12.7476 10.5624 12.4455 10.3397 12.2228C10.117 12.0001 9.81494 11.875 9.5 11.875C9.18506 11.875 8.88301 12.0001 8.66031 12.2228C8.43761 12.4455 8.3125 12.7476 8.3125 13.0625V16.625H3.16667C2.9567 16.625 2.75534 16.5416 2.60687 16.3931C2.45841 16.2447 2.375 16.0433 2.375 15.8333C2.375 15.6234 2.45841 15.422 2.60687 15.2735C2.75534 15.1251 2.9567 15.0417 3.16667 15.0417V6.33333C2.9567 6.33333 2.75534 6.24993 2.60687 6.10146C2.45841 5.95299 2.375 5.75163 2.375 5.54167C2.375 5.3317 2.45841 5.13034 2.60687 4.98187C2.75534 4.83341 2.9567 4.75 3.16667 4.75H3.95833V3.95833C3.95833 3.53841 4.12515 3.13568 4.42208 2.83875C4.71901 2.54181 5.12174 2.375 5.54167 2.375H13.4583ZM6.33333 10.2917C6.12337 10.2917 5.92201 10.3751 5.77354 10.5235C5.62507 10.672 5.54167 10.8734 5.54167 11.0833V11.875C5.54167 12.085 5.62507 12.2863 5.77354 12.4348C5.92201 12.5833 6.12337 12.6667 6.33333 12.6667C6.5433 12.6667 6.74466 12.5833 6.89313 12.4348C7.04159 12.2863 7.125 12.085 7.125 11.875V11.0833C7.125 10.8734 7.04159 10.672 6.89313 10.5235C6.74466 10.3751 6.5433 10.2917 6.33333 10.2917ZM12.6667 10.2917C12.4728 10.2917 12.2856 10.3629 12.1407 10.4917C11.9958 10.6206 11.9032 10.7981 11.8805 10.9907L11.875 11.0833V11.875C11.8752 12.0768 11.9525 12.2709 12.091 12.4176C12.2295 12.5643 12.4188 12.6526 12.6203 12.6644C12.8217 12.6763 13.0201 12.6107 13.1748 12.4812C13.3295 12.3517 13.429 12.168 13.4528 11.9676L13.4583 11.875V11.0833C13.4583 10.8734 13.3749 10.672 13.2265 10.5235C13.078 10.3751 12.8766 10.2917 12.6667 10.2917ZM6.33333 7.125C6.13943 7.12503 5.95228 7.19622 5.80737 7.32507C5.66247 7.45392 5.5699 7.63147 5.54721 7.82404L5.54167 7.91667V8.70833C5.54189 8.91011 5.61915 9.10419 5.75767 9.25092C5.89619 9.39764 6.0855 9.48594 6.28694 9.49776C6.48837 9.50959 6.68672 9.44405 6.84145 9.31454C6.99618 9.18503 7.09563 9.00133 7.11946 8.80096L7.125 8.70833V7.91667C7.125 7.7067 7.04159 7.50534 6.89313 7.35687C6.74466 7.20841 6.5433 7.125 6.33333 7.125ZM9.5 7.125C9.30609 7.12503 9.11894 7.19622 8.97404 7.32507C8.82914 7.45392 8.73656 7.63147 8.71388 7.82404L8.70833 7.91667V8.70833C8.70856 8.91011 8.78582 9.10419 8.92434 9.25092C9.06286 9.39764 9.25217 9.48594 9.4536 9.49776C9.65504 9.50959 9.85338 9.44405 10.0081 9.31454C10.1629 9.18503 10.2623 9.00133 10.2861 8.80096L10.2917 8.70833V7.91667C10.2917 7.7067 10.2083 7.50534 10.0598 7.35687C9.91133 7.20841 9.70996 7.125 9.5 7.125ZM12.6667 7.125C12.4567 7.125 12.2553 7.20841 12.1069 7.35687C11.9584 7.50534 11.875 7.7067 11.875 7.91667V8.70833C11.875 8.9183 11.9584 9.11966 12.1069 9.26813C12.2553 9.41659 12.4567 9.5 12.6667 9.5C12.8766 9.5 13.078 9.41659 13.2265 9.26813C13.3749 9.11966 13.4583 8.9183 13.4583 8.70833V7.91667C13.4583 7.7067 13.3749 7.50534 13.2265 7.35687C13.078 7.20841 12.8766 7.125 12.6667 7.125ZM13.4583 3.95833H5.54167V4.75H13.4583V3.95833Z"
                fill="#F1F1F1"
              />
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <select
                value={hotelData?.nombre}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                {hoteles.map((hotel) => (
                  <option key={hotel.id} value={hotel.id}>
                    {hotel.nombre}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Destino"
                value={hotelData?.destino}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                value={hotelData?.direccion}
                placeholder="Direccion"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Telefono de contacto"
                value={hotelData?.telefono}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Web"
                value={hotelData?.web}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}
