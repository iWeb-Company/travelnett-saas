"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useState } from "react";

export default function Paso2Page() {
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
        className="flex items-center my-3 justify-start gap-2"
        href={"/web/reservas"}>
        <ArrowLeft color="#6005F7" />
        <p className="text-secondary font-semibold md:text-lg">
          Volver a Reservas
        </p>
      </Link>
      <Link
        className="flex items-center my-3 justify-start gap-2"
        href={"/web/reservas/crear-reserva/paso-2"}>
        <ArrowLeft />
        <p className="text-primary font-semibold md:text-lg">
          Volver a Habitacion
        </p>
      </Link>

      <h2 className="font-semibold text-black text-center mx-auto md:text-lg mt-5">
        Crear reserva
      </h2>

      <div className="max-w-2xl mx-auto w-full mt-5 flex flex-col items-center gap-5">
        {/* Step Tabs */}
        <div className="flex w-full rounded-xl bg-[#5782F7] overflow-hidden shadow-md shadow-black/20">
          <div className="flex-1  text-white text-center py-2.5 font-semibold text-sm md:text-base">
            1. Paquete
          </div>
          <div className="flex-1 rounded-t-2xl  text-white text-center py-2.5 font-semibold text-sm md:text-base">
            2. Habitación
          </div>
          <div className="flex-1 rounded-t-2xl bg-primary text-white text-center py-2.5 font-semibold text-sm md:text-base">
            3. Datos
          </div>
        </div>
        <div className="flex flex-col gap-2 text-black items-start w-full font-semibold         ">
          <p>Mar del Plata - Mio Turismo</p>
          <p>25/06/2025 - MDQ PRUEBA</p>
          <p>Hotel Garden - DBL MAT</p>
        </div>
        {/* Form */}
        <form className="flex flex-col w-full gap-4">
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">Hotel Garden </option>
            <option value="mdq">Mar del Plata</option>
            <option value="brc">Bariloche</option>
          </select>
          <p className="font-semibold text-black">Pasajero 1</p>
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">DNI</option>
            <option value="mio">Mio Turismo</option>
          </select>
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">Nombre</option>
            <option value="mio">Mio Turismo</option>
          </select>
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">Apellido</option>
            <option value="mio">Mio Turismo</option>
          </select>
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">Fecha de Nacimiento</option>
            <option value="mio">Mio Turismo</option>
          </select>
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">Punto de ascenso</option>
            <option value="mio">Mio Turismo</option>
          </select>
          <p className="font-semibold text-black">Pasajero 2 </p>
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">DNI</option>
            <option value="mio">Mio Turismo</option>
          </select>
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">Nombre</option>
            <option value="mio">Mio Turismo</option>
          </select>
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">Apellido</option>
            <option value="mio">Mio Turismo</option>
          </select>
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">Fecha de Nacimiento</option>
            <option value="mio">Mio Turismo</option>
          </select>
          <select className="w-full border border-black/20 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-black/60 font-medium shadow-sm focus:outline-none appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%23666%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_12px_center]">
            <option value="">Punto de ascenso</option>
            <option value="mio">Mio Turismo</option>
          </select>
          {/* Continuar */}
          <Link
            href="/web/reservas/crear-reserva/paso-3"
            className="w-full bg-primary text-white text-center font-semibold py-2.5 rounded-lg shadow-md shadow-black/30 mt-3 hover:bg-blue-700 transition-colors">
            Continuar
          </Link>
        </form>
      </div>
    </Container>
  );
}
