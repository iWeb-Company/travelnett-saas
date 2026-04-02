"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ModalLayout from "@/app/components/ModalLayout";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientesPage() {
  const r = useRouter();
  const [modalOpenPut, setModalOpenPut] = useState(false);
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [modalOpenClientType, setModalOpenClientType] = useState(false);
  const [modalOpenAddClientType, setModalOpenAddClientType] = useState(false);
  const [modalOpenPutClientType, setModalOpenPutClientType] = useState(false);
  const [search, setSearch] = useState("");
  const [clientTypeData, setClientTypeData] = useState({
    nombre: "",
    admin: false,
    si_es_admin: "",
  });
  const [clientesData, setClientesData] = useState({
    nombre_sistema: "",
    full_name: "",
    dni: "",
    fecha: "",
    tipo_cliente: "",
    telefono: "",
    forma_pago: "",
    comision: "",
  });

  const clientes = [
    {
      id: 1,
      nombre_sistema: "PEREZ, PABLO",
      full_name: "Pablo Perez",
      dni: "12345678",
      fecha: "2022-01-01",
      tipo_cliente: "Particular",
      telefono: "123456789",
      forma_pago: "Contado",
      comision: "10%",
    },
    {
      id: 2,
      nombre_sistema: "PEREZ, PABLO",
      full_name: "Pablo Perez",
      dni: "12345678",
      fecha: "2022-01-01",
      tipo_cliente: "Particular",
      telefono: "123456789",
      forma_pago: "Contado",
      comision: "10%",
    },
    {
      id: 3,
      nombre_sistema: "PEREZ, PABLO",
      full_name: "Pablo Perez",
      dni: "12345678",
      fecha: "2022-01-01",
      tipo_cliente: "Particular",
      telefono: "123456789",
      forma_pago: "Contado",
      comision: "10%",
    },
    {
      id: 4,
      nombre_sistema: "PEREZ, PABLO",
      full_name: "Pablo Perez",
      dni: "12345678",
      fecha: "2022-01-01",
      tipo_cliente: "Particular",
      telefono: "123456789",
      forma_pago: "Contado",
      comision: "10%",
    },
  ];

  const clientesFiltered = clientes.filter((e) =>
    e.nombre_sistema.toLowerCase().includes(search.toLowerCase()),
  );

  const handleClickPut = (cliente: any) => {
    setModalOpenPut(true);
    setClientesData(cliente);
  };

  const handleClickPutClientType = (tipo: any) => {
    setModalOpenPutClientType(true);
    setClientTypeData(tipo);
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
        Clientes
      </h2>
      <div className="flex justify-center flex-col items-center mb-6">
        <button
          onClick={() => setModalOpenClientType(true)}
          className="flex items-center gap-2  text-primary font-semibold px-4 py-2 rounded-lg">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14.2421 3.53961C14.8013 2.98034 15.5597 2.66609 16.3506 2.66602C17.1415 2.66594 17.9 2.98003 18.4592 3.53919C19.0185 4.09836 19.3327 4.85679 19.3328 5.64765C19.3329 6.43851 19.0188 7.197 18.4596 7.75628L17.7163 8.50044L13.4996 4.28294L14.2421 3.53961ZM12.6163 5.16711L4.28298 13.4996C3.94426 13.838 3.70624 14.2638 3.59548 14.7296L2.68298 18.5646C2.65827 18.6685 2.66059 18.777 2.68971 18.8797C2.71883 18.9824 2.77378 19.076 2.84932 19.1514C2.92486 19.2269 3.01847 19.2817 3.12123 19.3107C3.22399 19.3397 3.33246 19.3419 3.43631 19.3171L7.27048 18.4038C7.73656 18.2932 8.16271 18.0551 8.50131 17.7163L16.833 9.38378L12.6163 5.16711Z"
              fill="#0546F7"
            />
          </svg>
          Administrar tipo de Cliente
        </button>
        <button
          onClick={() => setModalOpenAdd(true)}
          className="flex items-center gap-2  text-primary font-semibold px-4 py-2 rounded-lg">
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
          {clientesFiltered.length === 0 ? (
            <li className="py-4 text-center text-gray-500 text-sm">
              Sin resultados
            </li>
          ) : (
            clientesFiltered.map((cliente) => (
              <li
                key={cliente.id}
                className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                <span className="font-medium text-gray-800">
                  {cliente.nombre_sistema.toUpperCase()}
                </span>
                <div className="flex items-center gap-3">
                  {/* BOTON EDITAR */}
                  <button
                    onClick={() => handleClickPut(cliente)}
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
      {modalOpenClientType && (
        <ModalLayout
          bg="bg-[#F1F1F1]"
          titleColor="text-black"
          setModalOpen={() => setModalOpenClientType(false)}
          title="Administrador de Tipo de Cliente"
          svg={
            <svg
              width="24"
              height="19"
              viewBox="0 0 24 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_581_4561)">
                <path
                  d="M23.4012 13.5412L20.0502 10.1939C19.6049 9.74863 19 9.5 18.3691 9.5H15.4264C14.7695 9.5 14.2389 10.0307 14.2389 10.6875V13.6266C14.2389 14.2574 14.4875 14.8586 14.9328 15.3039L18.2838 18.6512C18.7477 19.115 19.501 19.115 19.9648 18.6512L23.3975 15.2186C23.865 14.7547 23.865 14.0051 23.4012 13.5412ZM16.6176 12.7619C16.124 12.7619 15.727 12.3648 15.727 11.8713C15.727 11.3777 16.124 10.9807 16.6176 10.9807C17.1111 10.9807 17.5082 11.3777 17.5082 11.8713C17.5082 12.3611 17.1111 12.7619 16.6176 12.7619ZM8.3125 9.49629C10.9361 9.49629 13.0625 7.36992 13.0625 4.74629C13.0625 2.12637 10.9361 0 8.3125 0C5.68887 0 3.5625 2.12637 3.5625 4.75C3.5625 7.36992 5.68887 9.49629 8.3125 9.49629ZM13.0551 13.6229V10.9102C12.6023 10.7766 12.1311 10.6801 11.6375 10.6801H11.0178C10.1939 11.0586 9.27734 11.2738 8.3125 11.2738C7.34766 11.2738 6.43477 11.0586 5.60723 10.6801H4.9875C2.23398 10.6838 0 12.9178 0 15.6713V17.215C0 18.1984 0.797852 18.9963 1.78125 18.9963H14.8438C15.4189 18.9963 15.9236 18.718 16.2502 18.2949L14.0979 16.1426C13.4262 15.4709 13.0551 14.5766 13.0551 13.6229Z"
                  fill="black"
                />
              </g>
              <defs>
                <clipPath id="clip0_581_4561">
                  <rect width="23.75" height="19" fill="white" />
                </clipPath>
              </defs>
            </svg>
          }>
          <button
            onClick={() => setModalOpenAddClientType(true)}
            className="flex items-center gap-2  text-primary font-semibold px-4 py-2 rounded-lg">
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
          <div className="w-full mt-2">
            <div className="flex items-center justify-end gap-0 pr-2 mb-1">
              <span className="text-xs font-semibold text-black/70 w-14 text-center">Editar</span>
              <span className="text-xs font-semibold text-black/70 w-14 text-center">Borrar</span>
              <span className="text-xs font-semibold text-black/70 w-14 text-center">Admin</span>
            </div>
            <ul className="rounded-lg overflow-hidden divide-y divide-gray-200">
              {[
                { id: 1, nombre: "Vendedor", admin: true },
                { id: 2, nombre: "Agencia", admin: true },
                { id: 3, nombre: "CJyP", admin: true },
                { id: 4, nombre: "Clientes Gaston", admin: false },
                { id: 5, nombre: "Clientes Claudia", admin: false },
                { id: 6, nombre: "Particulares", admin: true },
              ].map((tipo) => (
                <li
                  key={tipo.id}
                  className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 last:border-b-0">
                  <span className="font-medium text-gray-800">{tipo.nombre}</span>
                  <div className="flex items-center gap-0">
                    <button
                      onClick={() => handleClickPutClientType(tipo)}
                      title="Editar"
                      className="w-14 flex justify-center text-gray-600 hover:text-primary">
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
                    <button
                      title="Borrar"
                      className="w-14 flex justify-center text-gray-600 hover:text-red-500">
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
                    <div className="w-14 flex justify-center">
                      <span
                        className={`inline-block w-4 h-4 rounded-full border-2 ${
                          tipo.admin
                            ? "bg-black border-black"
                            : "bg-white border-blue-500"
                        }`}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </ModalLayout>
      )}
      {modalOpenAddClientType && (
        <ModalLayout
          setModalOpen={() => setModalOpenAddClientType(false)}
          title="Agregar Tipo de Cliente"
          svg={
            <svg
              width="24"
              height="19"
              viewBox="0 0 24 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_add_ct)">
                <path
                  d="M23.4012 13.5412L20.0502 10.1939C19.6049 9.74863 19 9.5 18.3691 9.5H15.4264C14.7695 9.5 14.2389 10.0307 14.2389 10.6875V13.6266C14.2389 14.2574 14.4875 14.8586 14.9328 15.3039L18.2838 18.6512C18.7477 19.115 19.501 19.115 19.9648 18.6512L23.3975 15.2186C23.865 14.7547 23.865 14.0051 23.4012 13.5412ZM16.6176 12.7619C16.124 12.7619 15.727 12.3648 15.727 11.8713C15.727 11.3777 16.124 10.9807 16.6176 10.9807C17.1111 10.9807 17.5082 11.3777 17.5082 11.8713C17.5082 12.3611 17.1111 12.7619 16.6176 12.7619ZM8.3125 9.49629C10.9361 9.49629 13.0625 7.36992 13.0625 4.74629C13.0625 2.12637 10.9361 0 8.3125 0C5.68887 0 3.5625 2.12637 3.5625 4.75C3.5625 7.36992 5.68887 9.49629 8.3125 9.49629ZM13.0551 13.6229V10.9102C12.6023 10.7766 12.1311 10.6801 11.6375 10.6801H11.0178C10.1939 11.0586 9.27734 11.2738 8.3125 11.2738C7.34766 11.2738 6.43477 11.0586 5.60723 10.6801H4.9875C2.23398 10.6838 0 12.9178 0 15.6713V17.215C0 18.1984 0.797852 18.9963 1.78125 18.9963H14.8438C15.4189 18.9963 15.9236 18.718 16.2502 18.2949L14.0979 16.1426C13.4262 15.4709 13.0551 14.5766 13.0551 13.6229Z"
                  fill="#F1F1F1"
                />
              </g>
              <defs>
                <clipPath id="clip0_add_ct">
                  <rect width="23.75" height="19" fill="white" />
                </clipPath>
              </defs>
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <input
                type="text"
                placeholder="Nombre"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <div className="flex items-center justify-between w-full border bg-white rounded-sm p-2 pr-4 shadow-sm">
                <span className="text-black/90 font-medium">Administrador para vendedores</span>
                <span className="inline-block w-4 h-4 rounded-full bg-black border-2 border-black" />
              </div>
              <p className="text-white/80 text-sm font-medium self-start">Si es Admin 👇</p>
              <select className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                <option value="">Cliente</option>
              </select>
            </div>
          </div>
        </ModalLayout>
      )}
      {modalOpenPutClientType && (
        <ModalLayout
          setModalOpen={() => setModalOpenPutClientType(false)}
          title="Editar Tipo de Cliente"
          svg={
            <svg
              width="24"
              height="19"
              viewBox="0 0 24 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_edit_ct)">
                <path
                  d="M23.4012 13.5412L20.0502 10.1939C19.6049 9.74863 19 9.5 18.3691 9.5H15.4264C14.7695 9.5 14.2389 10.0307 14.2389 10.6875V13.6266C14.2389 14.2574 14.4875 14.8586 14.9328 15.3039L18.2838 18.6512C18.7477 19.115 19.501 19.115 19.9648 18.6512L23.3975 15.2186C23.865 14.7547 23.865 14.0051 23.4012 13.5412ZM16.6176 12.7619C16.124 12.7619 15.727 12.3648 15.727 11.8713C15.727 11.3777 16.124 10.9807 16.6176 10.9807C17.1111 10.9807 17.5082 11.3777 17.5082 11.8713C17.5082 12.3611 17.1111 12.7619 16.6176 12.7619ZM8.3125 9.49629C10.9361 9.49629 13.0625 7.36992 13.0625 4.74629C13.0625 2.12637 10.9361 0 8.3125 0C5.68887 0 3.5625 2.12637 3.5625 4.75C3.5625 7.36992 5.68887 9.49629 8.3125 9.49629ZM13.0551 13.6229V10.9102C12.6023 10.7766 12.1311 10.6801 11.6375 10.6801H11.0178C10.1939 11.0586 9.27734 11.2738 8.3125 11.2738C7.34766 11.2738 6.43477 11.0586 5.60723 10.6801H4.9875C2.23398 10.6838 0 12.9178 0 15.6713V17.215C0 18.1984 0.797852 18.9963 1.78125 18.9963H14.8438C15.4189 18.9963 15.9236 18.718 16.2502 18.2949L14.0979 16.1426C13.4262 15.4709 13.0551 14.5766 13.0551 13.6229Z"
                  fill="#F1F1F1"
                />
              </g>
              <defs>
                <clipPath id="clip0_edit_ct">
                  <rect width="23.75" height="19" fill="white" />
                </clipPath>
              </defs>
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <input
                type="text"
                placeholder="Nombre"
                value={clientTypeData?.nombre}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <div className="flex items-center justify-between w-full border bg-white rounded-sm p-2 pr-4 shadow-sm">
                <span className="text-black/90 font-medium">Administrador para vendedores</span>
                <span
                  className={`inline-block w-4 h-4 rounded-full border-2 ${
                    clientTypeData?.admin
                      ? "bg-black border-black"
                      : "bg-white border-blue-500"
                  }`}
                />
              </div>
              <p className="text-white/80 text-sm font-medium self-start">Si es Admin 👇</p>
              <select
                value={clientTypeData?.si_es_admin}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                <option value="">Cliente</option>
              </select>
            </div>
          </div>
        </ModalLayout>
      )}
      {modalOpenAdd && (
        <ModalLayout
          setModalOpen={() => setModalOpenAdd(false)}
          title="Agregar Cliente"
          svg={
            <svg
              width="24"
              height="19"
              viewBox="0 0 24 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_580_4388)">
                <path
                  d="M23.4012 13.5412L20.0502 10.1939C19.6049 9.74863 19 9.5 18.3691 9.5H15.4264C14.7695 9.5 14.2389 10.0307 14.2389 10.6875V13.6266C14.2389 14.2574 14.4875 14.8586 14.9328 15.3039L18.2838 18.6512C18.7477 19.115 19.501 19.115 19.9648 18.6512L23.3975 15.2186C23.865 14.7547 23.865 14.0051 23.4012 13.5412ZM16.6176 12.7619C16.124 12.7619 15.727 12.3648 15.727 11.8713C15.727 11.3777 16.124 10.9807 16.6176 10.9807C17.1111 10.9807 17.5082 11.3777 17.5082 11.8713C17.5082 12.3611 17.1111 12.7619 16.6176 12.7619ZM8.3125 9.49629C10.9361 9.49629 13.0625 7.36992 13.0625 4.74629C13.0625 2.12637 10.9361 0 8.3125 0C5.68887 0 3.5625 2.12637 3.5625 4.75C3.5625 7.36992 5.68887 9.49629 8.3125 9.49629ZM13.0551 13.6229V10.9102C12.6023 10.7766 12.1311 10.6801 11.6375 10.6801H11.0178C10.1939 11.0586 9.27734 11.2738 8.3125 11.2738C7.34766 11.2738 6.43477 11.0586 5.60723 10.6801H4.9875C2.23398 10.6838 0 12.9178 0 15.6713V17.215C0 18.1984 0.797852 18.9963 1.78125 18.9963H14.8438C15.4189 18.9963 15.9236 18.718 16.2502 18.2949L14.0979 16.1426C13.4262 15.4709 13.0551 14.5766 13.0551 13.6229Z"
                  fill="#F1F1F1"
                />
              </g>
              <defs>
                <clipPath id="clip0_580_4388">
                  <rect width="23.75" height="19" fill="white" />
                </clipPath>
              </defs>
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <input
                type="text"
                placeholder="Nombre en sistema"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="Nombre completo"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                placeholder="DNI"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="date"
                placeholder="Fecha de nacimiento"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <select className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                <option value={clientesData?.tipo_cliente}>
                  {clientesData?.tipo_cliente}
                </option>
              </select>
              <input
                type="text"
                placeholder="Telefono de contacto"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <select className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                <option value={clientesData?.forma_pago}>
                  {clientesData?.forma_pago}
                </option>
              </select>
              <input
                type="text"
                placeholder="Comision"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </ModalLayout>
      )}
      {modalOpenPut && (
        <ModalLayout
          setModalOpen={() => setModalOpenPut(false)}
          title="Editar Cliente"
          svg={
            <svg
              width="24"
              height="19"
              viewBox="0 0 24 19"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <g clip-path="url(#clip0_580_4388)">
                <path
                  d="M23.4012 13.5412L20.0502 10.1939C19.6049 9.74863 19 9.5 18.3691 9.5H15.4264C14.7695 9.5 14.2389 10.0307 14.2389 10.6875V13.6266C14.2389 14.2574 14.4875 14.8586 14.9328 15.3039L18.2838 18.6512C18.7477 19.115 19.501 19.115 19.9648 18.6512L23.3975 15.2186C23.865 14.7547 23.865 14.0051 23.4012 13.5412ZM16.6176 12.7619C16.124 12.7619 15.727 12.3648 15.727 11.8713C15.727 11.3777 16.124 10.9807 16.6176 10.9807C17.1111 10.9807 17.5082 11.3777 17.5082 11.8713C17.5082 12.3611 17.1111 12.7619 16.6176 12.7619ZM8.3125 9.49629C10.9361 9.49629 13.0625 7.36992 13.0625 4.74629C13.0625 2.12637 10.9361 0 8.3125 0C5.68887 0 3.5625 2.12637 3.5625 4.75C3.5625 7.36992 5.68887 9.49629 8.3125 9.49629ZM13.0551 13.6229V10.9102C12.6023 10.7766 12.1311 10.6801 11.6375 10.6801H11.0178C10.1939 11.0586 9.27734 11.2738 8.3125 11.2738C7.34766 11.2738 6.43477 11.0586 5.60723 10.6801H4.9875C2.23398 10.6838 0 12.9178 0 15.6713V17.215C0 18.1984 0.797852 18.9963 1.78125 18.9963H14.8438C15.4189 18.9963 15.9236 18.718 16.2502 18.2949L14.0979 16.1426C13.4262 15.4709 13.0551 14.5766 13.0551 13.6229Z"
                  fill="#F1F1F1"
                />
              </g>
              <defs>
                <clipPath id="clip0_580_4388">
                  <rect width="23.75" height="19" fill="white" />
                </clipPath>
              </defs>
            </svg>
          }>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3">
              <input
                type="text"
                placeholder="Nombre en sistema"
                value={clientesData?.nombre_sistema}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                value={clientesData?.full_name}
                placeholder="Nombre completo"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="text"
                value={clientesData?.dni}
                placeholder="DNI"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <input
                type="date"
                value={clientesData?.full_name}
                placeholder="Fecha de nacimiento"
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <select
                value={clientesData?.tipo_cliente}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                <option value={clientesData?.tipo_cliente}>
                  {clientesData?.tipo_cliente}
                </option>
              </select>
              <input
                type="text"
                placeholder="Telefono de contacto"
                value={clientesData?.telefono}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
              <select
                value={clientesData?.forma_pago}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none">
                <option value={clientesData?.forma_pago}>
                  {clientesData?.forma_pago}
                </option>
              </select>
              <input
                type="text"
                placeholder="Comision"
                value={clientesData?.comision}
                className="w-full border bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none"
              />
            </div>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}
