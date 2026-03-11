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
        <div className="text-black">
          <p className="font-semibold text-lg">¡Hola 👋 Gabriel!</p>
          <h1 className="font-bold">¡Bienvenido a Tranett!</h1>
          <div className="max-w-32">
            <hr className="my-3 border-gray-500" />
          </div>
        </div>
        <div className="flex text-sm bg-primary rounded-lg shadow-md justify-between px-3 shadow-black/50 gap-10 py-3 text-white">
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
      </section>
      <section className="p-5 flex items-start justify-between">
        <div className="">
          <hr className="my-5 border-gray-400" />
          <ul className="text-white flex flex-col gap-7">
            <Link
              href={"/salidas"}
              className="bg-primary flex items-center gap-3 py-2 text-center px-3 rounded-lg font-medium">
              <Salidas />
              <i>SALIDAS</i>
            </Link>
            <Link
              href="/paquetes"
              className="bg-primary flex items-center gap-3 py-2 text-center px-3 rounded-lg font-medium">
              <Paquetes />
              <i>PAQUETES</i>
            </Link>
            <Link
              href="/administracion"
              className="bg-primary flex items-center gap-3 py-2 text-center px-3 rounded-lg font-medium">
              <Administracion />
              <i>ADMINISTRACIÓN</i>
            </Link>
            <Link
              href="/parametros"
              className="bg-primary flex items-center gap-3 py-2 text-center px-3 rounded-lg font-medium">
              <Parametros />
              <i>PARÁMETROS</i>
            </Link>
            <Link
              href="/usuarios"
              className="bg-primary flex items-center gap-3 py-2 text-center px-3 rounded-lg font-medium">
              <Usuarios />
              <i>USUARIOS Y PERMISOS</i>
            </Link>
            <Link
              href="/web"
              className="bg-primary flex items-center gap-3 py-2 text-center px-3 rounded-lg font-medium">
              <Web />
              <i>WEB</i>
            </Link>
          </ul>
        </div>
        <img
          src="logo-empresa.png"
          className="w-20 self-start mt-5"
          alt="Logo de empresa logeada"
        />
      </section>
      <ul className="flex p-5 flex-col text-sm text-black gap-4">
        <Link href="" className="flex items-center gap-2">
          <Wpp />
          <p>Whatsapp</p>
        </Link>
        <Link href="" className="flex items-center gap-2">
          <Mail />
          <p>Email</p>
        </Link>
      </ul>
    </main>
  );
}
