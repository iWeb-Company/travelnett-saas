"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import React from "react";
import { useRouter } from "next/navigation";

export default function RoomingPage() {
  const router = useRouter();
  const handleBack = () => {
    router.back();
  };
  return (
    <Container>
      <ToggleSalidas />
      <section className="flex flex-col gap-3">
        <Link
          href={"/dashboard"}
          className="flex items-center justify-start gap-3"
        >
          <ArrowLeft />
          <h1 className="font-bold">Volver al menú</h1>
        </Link>
        <button
          onClick={handleBack}
          className="flex items-center cursor-pointer justify-start gap-3"
        >
          <ArrowLeft color="#6005F7" />
          <h1 className="font-semibold text-secondary">Volver a Salidas</h1>
        </button>
      </section>
      <h2 className="md:text-center text-black font-semibold">
        Habitaciones dobles matrimoniales
      </h2>
      {/* HABITACIONES OPEN */}
      <section className="flex items-center justify-center gap-2 md:gap-10">
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion doble matrimonial</p>
          </div>
        </section>
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion doble matrimonial</p>
          </div>
        </section>
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion doble matrimonial</p>
          </div>
        </section>
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion doble matrimonial</p>
          </div>
        </section>
      </section>
      <hr className="border-black/50 md:mx-20 my-5" />
      <h2 className="md:text-center text-black font-semibold">
        Habitaciones dobles matrimoniales
      </h2>
      <section className="flex items-center justify-center gap-2 md:gap-10">
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion doble individual</p>
          </div>
        </section>
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion doble individual</p>
          </div>
        </section>
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion doble individual</p>
          </div>
        </section>
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion doble individual</p>
          </div>
        </section>
      </section>
      <hr className="border-black/50 md:mx-20 my-5" />
      <h3 className="md:text-center text-black font-semibold">
        Habitaciones triples individuales
      </h3>
      <section className="flex md:flex-row flex-col items-center justify-center gap-2 md:gap-10">
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion triple individual</p>
          </div>
        </section>
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion triple individual</p>
          </div>
        </section>
      </section>
      <hr className="border-black/50 md:mx-20 my-5" />
      <h3 className="md:text-center text-black font-semibold">
        Habitaciones cuadruples individuales
      </h3>
      <section className="flex md:flex-row flex-col items-center justify-center gap-2 md:gap-10">
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion cuadruple individual</p>
          </div>
        </section>
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion cuadruple individual</p>
          </div>
        </section>
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion cuadruple individual</p>
          </div>
        </section>
        <section className="flex flex-col mt-5 text-xs md:text-sm font-medium border-border border rounded-xl w-max">
          <div className="flex bg-bg text-black p-2 divide-border divide-x-1 items-center rounded-xl">
            <small className="pr-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
            <small className="pl-2 text-nowrap">Valentin Demarco</small>
          </div>
          <div className="bg-primary text-white">
            <p className="text-center py-1">Habitacion cuadruple individual</p>
          </div>
        </section>
        <hr className="border-black/50 md:mx-20 my-5" />
      </section>
      <hr className="border-black/50 md:mx-20 my-5" />
      {/* HABITACIONES CLOSED */}
      <section className="flex items-center justify-center gap-2 md:gap-10">
        <div className="flex justify-center items-center text-xs bg-gray-100">
          <div className="border border-border rounded-t-2xl overflow-hidden w-full ">
            <div className="grid grid-cols-3 bg-gray-300 text-center font-semibold text-gray-800">
              <div className="py-4 border-r border-border">TIPO</div>
              <div className="py-4 border-r border-border">TOTAL HABS</div>
              <div className="py-4">TOTAL PAX</div>
            </div>

            <div className="divide-y divide-blue-400 text-center text-gray-800">
              <div className="grid grid-cols-3">
                <div className="py-4 border-r border-border">
                  DOBLES MATRIMONIALES
                </div>
                <div className="py-4 border-r border-border">4</div>
                <div className="py-4">8</div>
              </div>

              <div className="grid grid-cols-3">
                <div className="py-4 border-r border-border">
                  DOBLES INDIVIDUALES
                </div>
                <div className="py-4 border-r border-border">4</div>
                <div className="py-4">8</div>
              </div>

              <div className="grid grid-cols-3">
                <div className="py-4 border-r border-border">
                  TRIPLES INDIVIDUALES
                </div>
                <div className="py-4 border-r border-border">1</div>
                <div className="py-4">3</div>
              </div>

              <div className="grid grid-cols-3">
                <div className="py-4 border-r border-border">
                  CUÁDRUPLES INDIVIDUALES
                </div>
                <div className="py-4 border-r border-border">1</div>
                <div className="py-4">4</div>
              </div>

              <div className="grid grid-cols-3 font-semibold bg-gray-300">
                <div className="py-4 border-r border-border">TOTALES</div>
                <div className="py-4 border-r border-border">10</div>
                <div className="py-4">23</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Container>
  );
}
