"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ModalLayout from "@/app/components/ModalLayout";
import TarjetaCard from "./TarjetaCard";

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
      tipo: "Visa",
      numero: "21091211",
      titular: "AMADEO GABRIEL DEMARCO",
      cuit: "20-22194061-0",
      cbu: "10101001010101001",
      alias: "lamamadetoto",
    },
    {
      id: 2,
      banco: "BANCO GALICIA",
      tipo: "MasterCard",
      numero: "21091211",
      titular: "AMADEO GABRIEL DEMARCO",
      cuit: "20-22194061-0",
      cbu: "10101001010101001",
      alias: "lamamadetoto",
    },
    {
      id: 3,
      banco: "BANCO GALICIA",
      tipo: "Visa Debito",
      numero: "21091211",
      titular: "AMADEO GABRIEL DEMARCO",
      cuit: "20-22194061-0",
      cbu: "10101001010101001",
      alias: "lamamadetoto",
    },
    {
      id: 4,
      banco: "BANCO GALICIA",
      tipo: "American Express",
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
        Agregar Tarjeta
      </button>
      <section className="flex flex-col w-full justify-center items-center gap-4">
        {cuentas.map((cuenta) => (
          <TarjetaCard key={cuenta.id} tarjeta={cuenta} />
        ))}
      </section>
      {openModal && (
        <ModalLayout
          setModalOpen={setOpenModal}
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
                d="M1.58301 5.54199C1.58301 4.9121 1.83323 4.30801 2.27863 3.86261C2.72403 3.41721 3.32812 3.16699 3.95801 3.16699H15.0413C15.6712 3.16699 16.2753 3.41721 16.7207 3.86261C17.1661 4.30801 17.4163 4.9121 17.4163 5.54199V6.33366H1.58301V5.54199ZM1.58301 7.91699V13.4587C1.58301 14.0885 1.83323 14.6926 2.27863 15.138C2.72403 15.5834 3.32812 15.8337 3.95801 15.8337H15.0413C15.6712 15.8337 16.2753 15.5834 16.7207 15.138C17.1661 14.6926 17.4163 14.0885 17.4163 13.4587V7.91699H1.58301ZM5.54134 9.50033C5.33138 9.50033 5.13001 9.58373 4.98155 9.7322C4.83308 9.88067 4.74967 10.082 4.74967 10.292C4.74967 10.502 4.83308 10.7033 4.98155 10.8518C5.13001 11.0003 5.33138 11.0837 5.54134 11.0837H9.49967C9.70964 11.0837 9.911 11.0003 10.0595 10.8518C10.2079 10.7033 10.2913 10.502 10.2913 10.292C10.2913 10.082 10.2079 9.88067 10.0595 9.7322C9.911 9.58373 9.70964 9.50033 9.49967 9.50033H5.54134Z"
                fill="#F1F1F1"
              />
            </svg>
          }
          title="Agregar Tarjeta">
          <form className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Nombre de la Tarjeta"
              value={cuentasData.titulo}
              onChange={(e) =>
                setCuentasData({ ...cuentasData, titulo: e.target.value })
              }
              className="w-full shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
            />
          </form>
        </ModalLayout>
      )}
    </Container>
  );
}
