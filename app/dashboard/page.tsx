import Link from "next/link";
import React from "react";
import Salidas from "../components/icons/home/Salidas";
import Paquetes from "../components/icons/home/Paquetes";
import Administracion from "../components/icons/home/Administracion";
import Parametros from "../components/icons/home/Parametros";
import Usuarios from "../components/icons/home/Usuarios";
import Web from "../components/icons/home/Web";
import Mail from "../components/icons/Mail";
import Wpp from "../components/icons/Wpp";

export default function DashboardPage() {
  return (
    <main>
      <section className="px-5">
        {/* MOBILE  */}
        <div className="flex md:hidden text-sm bg-primary rounded-lg shadow-md justify-between px-3 shadow-black/50 gap-10 py-3 text-white">
          <div className="flex flex-col gap-5 justify-between items-center">
            <div className="flex flex-col items-center">
              <p>Proxima salida</p>
              <b>TRH 22/06/2025</b>
            </div>
            <div className="flex flex-col items-center">
              <p>Reservas este día</p>
              <b>10</b>
            </div>
            <div className="flex flex-col items-center">
              <p>Saldo Gral del mes</p>
              <b>$10.000.000</b>
            </div>
          </div>
          <div className="flex flex-col gap-5 justify-between items-center">
            <div className="flex flex-col items-center">
              <p>Reservas este mes</p>
              <b>45</b>
            </div>
            <div className="flex flex-col items-center">
              <p>Paquetes activos</p>
              <b>12</b>
            </div>
            <div className="flex flex-col items-center">
              <p>Cliente del mes</p>
              <b>Mio Turismo</b>
            </div>
          </div>
        </div>
        {/* DESKTOP  */}
        <div className="hidden md:flex overflow-hidden text-sm bg-primary rounded-lg shadow-md shadow-black/50 text-white">
          <div
            className="flex items-center animate-infinite-scroll"
            style={{ width: "max-content" }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex items-center gap-8 text-lg px-8 py-3 whitespace-nowrap"
              >
                <p>
                  Proxima salida <b>TRH 22/06/2025</b>
                </p>
                <span className="opacity-30">|</span>
                <p>
                  Reservas este día <b>10</b>
                </p>
                <span className="opacity-30">|</span>
                <p>
                  Saldo Gral del mes <b>$10.000.000</b>
                </p>
                <span className="opacity-30">|</span>
                <p>
                  Reservas este mes <b>45</b>
                </p>
                <span className="opacity-30">|</span>
                <p>
                  Paquetes activos <b>12</b>
                </p>
                <span className="opacity-30">|</span>
                <p>
                  Cliente del mes <b>Mio Turismo</b>
                </p>
                <span className="opacity-30">|</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="p-5 flex items-start justify-between">
        <div className="flex flex-col mx-auto">
          <hr className="my-5 border-gray-400" />
          <ul className="text-white flex md:grid grid-cols-2 place-content-center mx-auto flex-col md:gap-x-20 gap-7">
            <Link
              href={"/salidas"}
              className="bg-primary flex items-center gap-3 py-2 px-3 md:text-xl md:px-7 md:py-4 md:gap-5 rounded-lg font-medium"
            >
              <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
                <Salidas />
              </span>
              <i>SALIDAS</i>
            </Link>
            <Link
              href="/paquetes"
              className="bg-primary flex items-center gap-3 py-2 px-3 md:text-xl md:px-7 md:py-4 md:gap-5 rounded-lg font-medium"
            >
              <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
                <Paquetes />
              </span>
              <i>PAQUETES</i>
            </Link>
            <Link
              href="/administracion"
              className="bg-primary flex items-center gap-3 py-2 px-3 md:text-xl md:px-7 md:py-4 md:gap-5 rounded-lg font-medium"
            >
              <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
                <Administracion />
              </span>
              <i>ADMINISTRACIÓN</i>
            </Link>
            <Link
              href="/parametros"
              className="bg-primary flex items-center gap-3 py-2 px-3 md:text-xl md:px-7 md:py-4 md:gap-5 rounded-lg font-medium"
            >
              <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
                <Parametros />
              </span>
              <i>PARÁMETROS</i>
            </Link>
            <Link
              href="/usuarios"
              className="bg-primary flex items-center gap-3 py-2 px-3 md:text-xl md:px-7 md:py-4 md:gap-5 rounded-lg font-medium"
            >
              <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
                <Usuarios />
              </span>
              <i>USUARIOS Y PERMISOS</i>
            </Link>
            <Link
              href="/web"
              className="bg-primary flex items-center gap-3 py-2 px-3 md:text-xl md:px-7 md:py-4 md:gap-5 rounded-lg font-medium"
            >
              <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
                <Web />
              </span>
              <i>WEB</i>
            </Link>
          </ul>
          <ul className="flex flex-col md:grid grid-cols-2  md:gap-x-20 gap-4 mt-6 text-sm md:text-lg text-black">
            <hr className="my-2 border-gray-400 hidden md:block" />
            <hr className="my-2 border-gray-400" />
            <Link href="/" className="flex items-center gap-2 md:gap-4">
              <span className="flex items-center [&>svg]:md:w-9 [&>svg]:md:h-9">
                <Wpp />
              </span>
              <p>Whatsapp</p>
            </Link>
            <Link href="/" className="flex items-center gap-2 md:gap-4">
              <span className="flex items-center [&>svg]:md:w-9 [&>svg]:md:h-9">
                <Mail />
              </span>
              <p>Email</p>
            </Link>
          </ul>
        </div>
        <img
          src="logo-empresa.png"
          className="w-20 md:absolute right-10 md:w-50 self-start mt-5"
          alt="Logo de empresa logeada"
        />
      </section>
      <img className="w-116 hidden md:block" src="/fotohome.png" alt="Foto Dashboard" />
    </main>
  );
}
