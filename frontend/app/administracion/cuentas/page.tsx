"use client";
import Container from "@/app/components/Container";
import CuentaCard from "./CuentaCard";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ModalLayout from "@/app/components/ModalLayout";

export default function CuentasPage() {
  const r = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [cuentasData, setCuentasData] = useState({
    titulo: "",
    numero: "",
    titular: "",
    cuit: "",
    cbu: "",
    alias: "",
  });
  const cuentas = [
    {
      id: 1,
      banco: "BANCO GALICIA",
      tipo: "CAJA DE AHORRO",
      numero: "21091211",
      titular: "AMADEO GABRIEL DEMARCO",
      cuit: "20-22194061-0",
      cbu: "10101001010101001",
      alias: "lamamadetoto",
    },
    {
      id: 2,
      banco: "BANCO GALICIA",
      tipo: "CAJA DE AHORRO",
      numero: "21091211",
      titular: "AMADEO GABRIEL DEMARCO",
      cuit: "20-22194061-0",
      cbu: "10101001010101001",
      alias: "lamamadetoto",
    },
    {
      id: 3,
      banco: "BANCO GALICIA",
      tipo: "CAJA DE AHORRO",
      numero: "21091211",
      titular: "AMADEO GABRIEL DEMARCO",
      cuit: "20-22194061-0",
      cbu: "10101001010101001",
      alias: "lamamadetoto",
    },
    {
      id: 4,
      banco: "BANCO GALICIA",
      tipo: "CAJA DE AHORRO",
      numero: "21091211",
      titular: "AMADEO GABRIEL DEMARCO",
      cuit: "20-22194061-0",
      cbu: "10101001010101001",
      alias: "lamamadetoto",
    },
  ];
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
      <button
        onClick={() => setOpenModal(true)}
        className="flex items-center gap-2  text-primary font-medium py-7 justify-center md:mx-auto rounded-lg">
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
        Agregar Cuenta
      </button>
      <section className="flex flex-col max-w-3xl mx-auto ">
        {cuentas.map((cuenta) => (
          <CuentaCard key={cuenta.id} cuenta={cuenta} />
        ))}
      </section>
      {openModal && (
        <ModalLayout
          setModalOpen={setOpenModal}
          svg={
            <svg
              width="29"
              height="29"
              viewBox="0 0 29 29"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M15.2035 4.17567L24.1285 9.4419C24.3905 9.58001 24.6108 9.7925 24.7648 10.0555C24.9187 10.3185 25.0002 10.6217 25 10.9309V12.5274C25 13.2923 24.412 13.9132 23.6875 13.9132H22.9V22.7826H23.95C24.2285 22.7826 24.4955 22.8994 24.6925 23.1074C24.8894 23.3153 25 23.5973 25 23.8913C25 24.1854 24.8894 24.4674 24.6925 24.6753C24.4955 24.8832 24.2285 25 23.95 25H5.05C4.77152 25 4.50445 24.8832 4.30754 24.6753C4.11062 24.4674 4 24.1854 4 23.8913C4 23.5973 4.11062 23.3153 4.30754 23.1074C4.50445 22.8994 4.77152 22.7826 5.05 22.7826H6.1V13.9132H5.3125C4.588 13.9132 4 13.2923 4 12.5274V10.9309C4 10.3521 4.2835 9.81996 4.7413 9.5184L13.7955 4.17567C14.0142 4.06014 14.2554 4 14.5 4C14.7446 4 14.9848 4.06014 15.2035 4.17567ZM19.75 13.9132H9.25V22.7826H11.35V16.1306H13.45V22.7826H15.55V16.1306H17.65V22.7826H19.75V13.9132ZM14.5 8.3698C14.2215 8.3698 13.9545 8.48661 13.7575 8.69453C13.5606 8.90245 13.45 9.18444 13.45 9.47848C13.45 9.77252 13.5606 10.0545 13.7575 10.2624C13.9545 10.4704 14.2215 10.5872 14.5 10.5872C14.7785 10.5872 15.0455 10.4704 15.2425 10.2624C15.4394 10.0545 15.55 9.77252 15.55 9.47848C15.55 9.18444 15.4394 8.90245 15.2425 8.69453C15.0455 8.48661 14.7785 8.3698 14.5 8.3698Z"
                fill="#F1F1F1"
              />
            </svg>
          }
          title="Agregar Cuenta">
          <form className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Titulo de la cuenta"
              value={cuentasData.titulo}
              onChange={(e) =>
                setCuentasData({ ...cuentasData, titulo: e.target.value })
              }
              className="w-full shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
            />
            <input
              type="text"
              placeholder="N° de cuenta (opcional)"
              value={cuentasData.numero}
              onChange={(e) =>
                setCuentasData({ ...cuentasData, numero: e.target.value })
              }
              className="w-full shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
            />
            <input
              type="text"
              placeholder="Titular"
              value={cuentasData.titular}
              onChange={(e) =>
                setCuentasData({ ...cuentasData, titular: e.target.value })
              }
              className="w-full shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
            />
            <input
              type="text"
              placeholder="CUIT/CUIL"
              value={cuentasData.cuit}
              onChange={(e) =>
                setCuentasData({ ...cuentasData, cuit: e.target.value })
              }
              className="w-full shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
            />
            <input
              type="text"
              placeholder="CBU/CVU"
              value={cuentasData.cbu}
              onChange={(e) =>
                setCuentasData({ ...cuentasData, cbu: e.target.value })
              }
              className="w-full shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
            />
            <input
              type="text"
              placeholder="Alias"
              value={cuentasData.alias}
              onChange={(e) =>
                setCuentasData({ ...cuentasData, alias: e.target.value })
              }
              className="w-full shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
            />
          </form>
        </ModalLayout>
      )}
    </Container>
  );
}
