"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import AddVioleta from "@/app/components/icons/AddVioleta";
import ArrowUpDown from "@/app/components/icons/ArrowUpDown";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Suspense } from "react";
import ReservasCard from "../ReservasCard";

function ResultContent() {
  const searchParams = useSearchParams();
  console.log(searchParams.get("destino"));

  const RESERVAS = [
    {
      id: 1,
      numero: "MDQ #1",
      destino: "Mar del Plata",
      cliente: "Mio Turismo",
      fecha: "22/06/2025",
      titulo: "Demarco Valentin x2 MAT",
      pasajeros: [
        {
          nombre: "Demarco Valentin",
          dni: "12345678",
          telefono: "12345678",
          email: "[EMAIL_ADDRESS]",
        },
        {
          nombre: "Demarco Valentin",
          dni: "12345678",
          telefono: "12345678",
          email: "[EMAIL_ADDRESS]",
        },
      ],
    },
    {
      id: 2,
      numero: "MDQ #2",
      destino: "Mar del Plata",
      cliente: "Mio Turismo",
      fecha: "22/06/2025",
      titulo: "Demarco Valentin x2 MAT",
      pasajeros: [
        {
          nombre: "Demarco Valentin",
          dni: "12345678",
          telefono: "12345678",
          email: "[EMAIL_ADDRESS]",
        },
        {
          nombre: "Demarco Valentin",
          dni: "12345678",
          telefono: "12345678",
          email: "[EMAIL_ADDRESS]",
        },
      ],
    },
    {
      id: 3,
      numero: "MDQ #3",
      destino: "Mar del Plata",
      cliente: "Mio Turismo",
      fecha: "22/06/2025",
      titulo: "Demarco Valentin x2 MAT",
      pasajeros: [
        {
          nombre: "Demarco Valentin",
          dni: "12345678",
          telefono: "12345678",
          email: "[EMAIL_ADDRESS]",
        },
        {
          nombre: "Demarco Valentin",
          dni: "12345678",
          telefono: "12345678",
          email: "[EMAIL_ADDRESS]",
        },
      ],
    },
    {
      id: 4,
      numero: "MDQ #4",
      destino: "Mar del Plata",
      cliente: "Mio Turismo",
      fecha: "22/06/2025",
      titulo: "Demarco Valentin x2 MAT",
      pasajeros: [
        {
          nombre: "Demarco Valentin",
          dni: "12345678",
          telefono: "12345678",
          email: "[EMAIL_ADDRESS]",
        },
        {
          nombre: "Demarco Valentin",
          dni: "12345678",
          telefono: "12345678",
          email: "[EMAIL_ADDRESS]",
        },
      ],
    },
    {
      id: 5,
      numero: "MDQ #5",
      destino: "Mar del Plata",
      cliente: "Mio Turismo",
      fecha: "22/06/2025",
      titulo: "Demarco Valentin x2 MAT",
      pasajeros: [
        {
          nombre: "Demarco Valentin",
          dni: "12345678",
          telefono: "12345678",
          email: "[EMAIL_ADDRESS]",
        },
        {
          nombre: "Demarco Valentin",
          dni: "12345678",
          telefono: "12345678",
          email: "[EMAIL_ADDRESS]",
        },
      ],
    },
  ];
  return (
    <Container>
      <ToggleSalidas />
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver al menú</h1>
      </Link>
      <Link
        className="flex items-center my-2 justify-start gap-2"
        href={"/web/reservas/crear-reserva/paso-1"}>
        <AddVioleta />
        <p className="text-secondary font-semibold md:text-lg">Crear reserva</p>
      </Link>
      <section className="flex justify-between my-5 items-center">
        <h2 className="font-semibold text-black text-center mx-auto md:text-xl">
          Reservas
        </h2>
      </section>
      <section className="flex flex-col max-w-5xl mx-auto gap-5">
        <button className="flex items-center my-2 font-semibold justify-end gap-1">
          <p className="text-black">Ordenar por fecha</p>
          <ArrowUpDown />
        </button>
        <div className="flex flex-col w-full gap-10">
          {RESERVAS.map((reserva) => (
            <ReservasCard key={reserva.id} reserva={reserva} />
          ))}
        </div>
      </section>
    </Container>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}
