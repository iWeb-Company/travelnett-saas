"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type TarjetaRow = {
  id: number;
  nombre: string;
  cuotas: string;
  recargo: string;
};

type Cuenta = {
  id: number;
  tipo: string;
  titular: string;
  numeroCuenta: string;
  cbuCvu: string;
  alias: string;
};

export default function FormasDePagoPage() {
  const r = useRouter();
  const [tarjetas, setTarjetas] = useState<TarjetaRow[]>([
    { id: 1, nombre: "Naranja", cuotas: "1", recargo: "5%" },
    { id: 2, nombre: "Visa", cuotas: "1", recargo: "5%" },
    { id: 3, nombre: "Mastercard", cuotas: "1", recargo: "5%" },
  ]);

  const [cuentas, setCuentas] = useState<Cuenta[]>([
    {
      id: 1,
      tipo: "BANCO GALICIA",
      titular: "Demarco Armadeo Gabriel",
      numeroCuenta: "4034355 2 045-7 Caja Ahorro en $",
      cbuCvu: "0070045030004034335272",
      alias: "SILLON.CANICA.ALCE",
    },
    {
      id: 2,
      tipo: "MERCADO PAGO",
      titular: "Demarco Armadeo Gabriel",
      numeroCuenta: "",
      cbuCvu: "000000031000662804644626",
      alias: "GABY.DEMARCO.MP",
    },
    {
      id: 3,
      tipo: "BURBANK",
      titular: "Demarco Armadeo Gabriel",
      numeroCuenta: "",
      cbuCvu: "1430001713034793639014",
      alias: "GABRIEL.RUTA86",
    },
  ]);

  const [showCalculadora, setShowCalculadora] = useState(false);

  const updateTarjeta = (id: number, field: keyof TarjetaRow, value: string) =>
    setTarjetas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );

  const removeTarjeta = (id: number) =>
    setTarjetas((prev) => prev.filter((t) => t.id !== id));


  const updateCuenta = (id: number, field: keyof Cuenta, value: string) =>
    setCuentas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );

  const removeCuenta = (id: number) =>
    setCuentas((prev) => prev.filter((c) => c.id !== id));
  return (
    <Container>
      <ToggleSalidas />
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={() => r.push("/web")}
        className="flex items-center my-3 justify-start gap-3"
      >
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>
      <section className="max-w-3/4 flex flex-col justify-around mx-auto">
        <div className="flex gap-10 justify-around items-center w-full">
          <button className="border-2 flex items-center gap-2 border-primary rounded-lg font-semibold px-10 py-2">
            <svg
              width="29"
              height="29"
              viewBox="0 0 29 29"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8.8754 4.8539C12.6138 4.43998 16.3865 4.43998 20.125 4.8539C22.1949 5.0859 23.8648 6.71594 24.1076 8.79306C24.5506 12.5848 24.5506 16.4152 24.1076 20.207C23.8648 22.2841 22.1949 23.9141 20.125 24.1461C16.3865 24.5601 12.6138 24.5601 8.8754 24.1461C6.80552 23.9141 5.1356 22.2841 4.89273 20.207C4.44982 16.4156 4.44982 12.5856 4.89273 8.79427C5.01558 7.78516 5.4756 6.8471 6.19825 6.13213C6.9209 5.41715 7.86382 4.96717 8.87419 4.8551M14.5002 8.46681C14.7405 8.46681 14.971 8.56229 15.141 8.73225C15.311 8.9022 15.4064 9.13271 15.4064 9.37306V13.5938H19.6271C19.8675 13.5938 20.098 13.6892 20.268 13.8592C20.4379 14.0292 20.5334 14.2597 20.5334 14.5C20.5334 14.7404 20.4379 14.9709 20.268 15.1408C20.098 15.3108 19.8675 15.4063 19.6271 15.4063H15.4064V19.627C15.4064 19.8673 15.311 20.0978 15.141 20.2678C14.971 20.4377 14.7405 20.5332 14.5002 20.5332C14.2598 20.5332 14.0293 20.4377 13.8594 20.2678C13.6894 20.0978 13.5939 19.8673 13.5939 19.627V15.4063H9.37323C9.13288 15.4063 8.90237 15.3108 8.73241 15.1408C8.56246 14.9709 8.46698 14.7404 8.46698 14.5C8.46698 14.2597 8.56246 14.0292 8.73241 13.8592C8.90237 13.6892 9.13288 13.5938 9.37323 13.5938H13.5939V9.37306C13.5939 9.13271 13.6894 8.9022 13.8594 8.73225C14.0293 8.56229 14.2598 8.46681 14.5002 8.46681Z"
                fill="#0546F7"
              />
            </svg>
            <p>Agregar Tarjeta</p>
          </button>
          <button className="border-2 flex items-center gap-2 border-primary rounded-lg  font-semibold  px-10 py-2">
            <svg
              width="29"
              height="29"
              viewBox="0 0 29 29"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8.8754 4.8539C12.6138 4.43998 16.3865 4.43998 20.125 4.8539C22.1949 5.0859 23.8648 6.71594 24.1076 8.79306C24.5506 12.5848 24.5506 16.4152 24.1076 20.207C23.8648 22.2841 22.1949 23.9141 20.125 24.1461C16.3865 24.5601 12.6138 24.5601 8.8754 24.1461C6.80552 23.9141 5.1356 22.2841 4.89273 20.207C4.44982 16.4156 4.44982 12.5856 4.89273 8.79427C5.01558 7.78516 5.4756 6.8471 6.19825 6.13213C6.9209 5.41715 7.86382 4.96717 8.87419 4.8551M14.5002 8.46681C14.7405 8.46681 14.971 8.56229 15.141 8.73225C15.311 8.9022 15.4064 9.13271 15.4064 9.37306V13.5938H19.6271C19.8675 13.5938 20.098 13.6892 20.268 13.8592C20.4379 14.0292 20.5334 14.2597 20.5334 14.5C20.5334 14.7404 20.4379 14.9709 20.268 15.1408C20.098 15.3108 19.8675 15.4063 19.6271 15.4063H15.4064V19.627C15.4064 19.8673 15.311 20.0978 15.141 20.2678C14.971 20.4377 14.7405 20.5332 14.5002 20.5332C14.2598 20.5332 14.0293 20.4377 13.8594 20.2678C13.6894 20.0978 13.5939 19.8673 13.5939 19.627V15.4063H9.37323C9.13288 15.4063 8.90237 15.3108 8.73241 15.1408C8.56246 14.9709 8.46698 14.7404 8.46698 14.5C8.46698 14.2597 8.56246 14.0292 8.73241 13.8592C8.90237 13.6892 9.13288 13.5938 9.37323 13.5938H13.5939V9.37306C13.5939 9.13271 13.6894 8.9022 13.8594 8.73225C14.0293 8.56229 14.2598 8.46681 14.5002 8.46681Z"
                fill="#0546F7"
              />
            </svg>
            <p>Agregar Cuenta</p>
          </button>
        </div>
        <div>
          <h3 className="text-black font-bold text-xl text-center my-5">
            Financiaciones con Tarjeta
          </h3>
          <div className="flex w-full gap-10 justify-between items-center">
            <img
              src="/master.png"
              className="w-30 mx-14"
              alt="MasterCard Image"
            />
            <div className="flex-10 border border-gray-300 rounded-md gap-5 p-5">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] text-center font-semibold text-sm mb-1">
                <span>Tarjeta</span>
                <span>Cuotas</span>
                <span>Recargo</span>
                <span />
              </div>
              {/* Rows */}
              {tarjetas.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center mb-5"
                >
                  <input
                    value={t.nombre}
                    onChange={(e) =>
                      updateTarjeta(t.id, "nombre", e.target.value)
                    }
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-center w-full"
                  />
                  <select
                    value={t.cuotas}
                    onChange={(e) =>
                      updateTarjeta(t.id, "cuotas", e.target.value)
                    }
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-sm text-center w-full"
                  >
                    {[
                      "1",
                      "2",
                      "3",
                      "4",
                      "5",
                      "6",
                      "7",
                      "8",
                      "9",
                      "10",
                      "11",
                      "12",
                    ].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <input
                    value={t.recargo}
                    onChange={(e) =>
                      updateTarjeta(t.id, "recargo", e.target.value)
                    }
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-center w-full"
                  />
                  <button
                    onClick={() => removeTarjeta(t.id)}
                    className="text-blue-400 hover:text-red-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              ))}
              {/* Note */}
              <p className="text-xs text-gray-500 mt-3 border border-gray-200 rounded-md p-2">
                📋 Las tarjetas que aceptamos para cuotas son bancarizadas y de
                crédito, en caso de débito tenemos el 5% de recargo en todas las
                tarjetas y en tarjetas que no sean Visa o Mastercard o de banco
                tenemos otros recargos. Consultar si ese es el caso que desea.
                ✏️
              </p>
            </div>
            <img src="/visa.png" className="w-60" alt="Visa Image" />
          </div>
        </div>
        <div className="flex justify-start my-5 items-center gap-2">
          <label className="inline-flex gap-2 my-2 items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showCalculadora}
              onChange={(e) => setShowCalculadora(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary dark:peer-checked:bg-primary"></div>
          </label>
          <p className="text-black">Calculadora de Tarjetas</p>
        </div>
        {/* Cuentas para transferencias y depósitos */}
        <div className="mt-10 text-black">
          <h3 className="text-black font-bold text-xl text-center my-5">
            Cuentas para transferencias y depósitos
          </h3>
          <div className="border border-gray-300 rounded-md p-6 max-w-4xl mx-auto">
            {cuentas.map((cuenta) => (
              <div
                key={cuenta.id}
                className="mb-8 pb-8 border-b border-gray-200 last:border-b-0"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Tipo</p>
                    <p className="text-base font-bold">{cuenta.tipo}</p>
                  </div>
                  <div className="flex justify-end items-start">
                    <button className="text-blue-400 hover:text-red-500">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      Titular
                    </p>
                    <p className="text-base">{cuenta.titular}</p>
                  </div>
                  {cuenta.numeroCuenta && (
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        N° de cuenta
                      </p>
                      <p className="text-base">{cuenta.numeroCuenta}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      CBU/CVU
                    </p>
                    <p className="text-base font-mono">{cuenta.cbuCvu}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Alias</p>
                    <p className="text-base">{cuenta.alias}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CUIT y Logo */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-black font-bold text-lg">CUIT: 20-22194061-0</p>
          <img src="/logo-grande.png" className="w-32" alt="Ruta 86 Logo" />
        </div>
      </section>
    </Container>
  );
}
