"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import PasajeroRow from "@/app/components/PasajeroRow";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Butaca from "@/app/components/icons/salidas/Butaca";
import Excel from "@/app/components/icons/salidas/Excel";
import Subir from "@/app/components/icons/salidas/Subir";
import Reloj from "@/app/components/icons/salidas/Reloj";
import Hotel from "@/app/components/icons/salidas/Hotel";

const pasajeros = [
  {
    numero: 1,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 2,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",

  },
  {
    numero: 3,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 4,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 5,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 6,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 7,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 8,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 9,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 10,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 11,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 12,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
  {
    numero: 13,
    nombre: "Demarco Valentin",
    reserva: 'MDQ',
    cliente: "Mio Turismo",
    ascenso: "Lanús",
    hotel: "Garden",
    edad: 'ADL',
    butaca: "Semicama",
    telefono: "1169694995",
  },
];

export default function SalidasIDPage() {
  const router = useRouter();
  const [showRelojModal, setShowRelojModal] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);

  useEffect(() => {
    if (showRelojModal || showHotelModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showRelojModal, showHotelModal]);

  const handleBack = () => {
    router.back();
  };
  return (
    <Container>
      <ToggleSalidas />

      <section className="flex flex-col gap-3">
        <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver al menú</h1>
      </Link>
        <button
          onClick={handleBack}
          className="flex items-center cursor-pointer justify-start gap-3"
        >
          <ArrowLeft color="#6005F7" />
          <h1 className="font-semibold text-secondary md:text-lg">Volver a Salidas</h1>
        </button>
      </section>

      {/* Iconos de acción */}
      <section className="flex items-center justify-end gap-2 mx-5 mb-2 mt-[-20px]">
        {/* Imprimir */}
        <Link
          href={"/salidas/lista/1/butacas"}
           className="p-1.5 flex items-center gap-2 font-semibold"
          title="Butacas"
        >
          <Butaca />
          <p className="text-xs text-black md:block hidden">Taquilla</p>
        </Link>
        {/* Configuración */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Vouchers Online"
        >
          <Subir />
          <p className="text-xs text-black md:block hidden">Vouchers Online</p>
        </button>
        {/* Excel */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Exportar Excel"
        >
          <Excel />
          <p className="text-xs text-black md:block hidden">Exportar Excel</p>
        </button>
        {/* Asiento */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Horarios"
          onClick={() => setShowRelojModal(true)}
        >
          <Reloj />
          <p className="text-xs text-black md:block hidden">Horarios</p>
        </button>
        {/* Equipaje */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Hoteles"
          onClick={() => setShowHotelModal(true)}
        >
          <Hotel />
          <p className="text-xs text-black md:block hidden">Cambiar Hotel</p>
        </button>
      </section>

      {/* Lista de pasajeros */}
      <section className="flex flex-col justify-center items-center gap-3">
        {pasajeros.map((p) => (
          <PasajeroRow
            pasajero={p}
          />
        ))}
      </section>

      {/* Pasajeros Totales */}
      <section className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full bg-[#D9DFF5] font-semibold text-black text-sm text-center">
          <thead>
            <tr>
              <th colSpan={3} className="py-2">
                Pasajeros Totales
              </th>
            </tr>
            <tr className="text-xs">
              <th className="py-1 font-semibold">CHD</th>
              <th className="py-1 font-semibold">ADL</th>
              <th className="py-1 font-semibold">INF</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">0</td>
              <td className="py-2">56</td>
              <td className="py-2">0</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Pasajeros Totales por ascenso */}
      <section className="mt-4 mb-6 border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full bg-[#D9DFF5] text-black text-sm text-center">
          <thead>
            <tr>
              <th colSpan={3} className="py-2 font-bold">
                Pasajeros Totales por ascenso
              </th>
            </tr>
            <tr className="text-xs">
              <th className="py-1 font-semibold">Cantidad</th>
              <th className="py-1 font-semibold">Lugar de carga</th>
              <th className="py-1 font-semibold">Dirección</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-black font-semibold text-xs">
              <td className="py-2">56</td>
              <td className="py-2">Lanús</td>
              <td className="py-2 text-wrap">25 de Mayo y Pavon</td>
            </tr>
          </tbody>
        </table>
      </section>
      {/* Modal Reloj */}
      {showRelojModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowRelojModal(false)}
        >
          <div
            className="bg-primary rounded-2xl w-[90%] max-w-md max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo */}
            <div className="flex justify-center pt-5 pb-3">
              <img
                src="/logo-travel.png"
                alt="Tranett"
                className="w-20 invert brightness-0 filter"
              />
            </div>

            {/* Tabla Ascenso (scrollable) */}
            <div className="px-4 max-h-[40vh] overflow-y-auto">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-gray-700 text-white">
                    <th className="py-2 px-3 font-semibold">Cantidad</th>
                    <th className="py-2 px-3 font-semibold">Ascenso</th>
                    <th className="py-2 px-3 font-semibold">Horario</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(8)].map((_, i) => (
                    <tr className="bg-gray-600 text-white">
                      <td className="py-2 px-3">1</td>
                      <td className="py-2 px-3">Lanús</td>
                      <td className="py-2 px-3">03:15 / 03:45</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tabla Coordinador (fija) */}
            <div className="px-4 mt-4">
              <table className="w-full text-sm text-center border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-white">
                    <th className="py-2 px-3 font-semibold">Coordinador/a</th>
                    <th className="py-2 px-3 font-semibold">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-600 text-white">
                    <td className="py-2 px-3">Diego</td>
                    <td className="py-2 px-3">1169694995</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-4 px-4 py-5">
              <button
                onClick={() => setShowRelojModal(false)}
                className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer border border-gray-300"
              >
                Cancelar
              </button>
              <button className="bg-secondary text-white font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
      {showHotelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowRelojModal(false)}
        >
          <div
            className="bg-primary rounded-2xl w-[90%] max-w-md max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo */}
            <div className="flex justify-center pt-5 pb-3">
              <img
                src="/logo-travel.png"
                alt="Tranett"
                className="w-20 invert brightness-0 filter"
              />
            </div>

            {/* Tabla Ascenso (scrollable) */}
            <div className="px-4 max-h-[40vh] overflow-y-auto">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-gray-700 text-white">
                    <th className="py-2 px-3 font-semibold">Destino</th>
                    <th className="py-2 px-3 font-semibold">Hotel</th>
                    <th className="py-2 px-3 font-semibold">Régimen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-600 text-white">
                    <td className="py-2 px-3">MDQ</td>
                    <td className="py-2 px-3">
                      <select name="hotel" id="hotel">
                        <option value="">Garden</option>
                        <option value="">Garden</option>
                        <option value="">Garden</option>
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <select name="hotel" id="hotel">
                        <option value="">MAP</option>
                        <option value="">MAP</option>
                        <option value="">MAP</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-4 px-4 py-5">
              <button
                onClick={() => setShowHotelModal(false)}
                className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer border border-gray-300"
              >
                Cancelar
              </button>
              <button className="bg-secondary text-white font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
