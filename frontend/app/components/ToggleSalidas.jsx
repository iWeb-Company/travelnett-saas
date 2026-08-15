"use client";

import { useState } from "react";
import Link from "next/link";
import Web from "./icons/Web";
import Salidas from "./icons/home/Salidas";
import Paquetes from "./icons/home/Paquetes";
import Parametros from "./icons/home/Parametros";
import Usuarios from "./icons/home/Usuarios";
import Administracion from "./icons/home/Administracion";

import { useAuth } from "@/context/AuthContext";

export default function ToggleSalidas() {
  const [toggle, setToggle] = useState(false);
  const { user, permissions } = useAuth();

  const isAdmin = user?.username === 'iweb_admin' || (user?.rol || '').toLowerCase().trim() === 'admin';
  const isAllowed = (sec) => isAdmin || (permissions && permissions[sec]);

  const handleClick = () => {
    setToggle(!toggle);
  };
  return (
    <>
      <button
        onClick={handleClick}
        className="bg-primary cursor-pointer transition-all duration-300 text-white text-3xl font-medium w-max absolute top-20 md:top-40 -right-9 rounded-full">
        {toggle ? (
          <p className="text-[22px] pr-12 py-3 transition-all duration-300 pl-2">
            x
          </p>
        ) : (
          <p className="pr-10 transition-all duration-300 p-2">+</p>
        )}
      </button>
      {toggle && (
        <ul
          className={`flex absolute transition-all ${toggle ? "opacity-100 transition-all" : "opacity-0 transition-all"
            } duration-300 right-11 top-22 md:top-42 bg-primary z-40 rounded-lg shadow-md shadow-black/80 gap-4 p-2 text-white italic md:px-3 text-sm`}>
          {isAllowed('salidas') && (
            <Link className="flex gap-2 items-center" href="/salidas">
              <Salidas />
              <p className="hidden md:block">Salidas</p>
            </Link>
          )}
          {isAllowed('paquetes') && (
            <Link className="flex gap-2 items-center" href="/paquetes">
              <Paquetes />
              <p className="hidden md:block">Paquetes</p>
            </Link>
          )}
          {isAllowed('administracion') && (
            <Link className="flex gap-2 items-center" href="/administracion">
              <Administracion />
              <p className="hidden md:block">Administracion</p>
            </Link>
          )}
          {isAllowed('parametros') && (
            <Link className="flex gap-2 items-center" href="/parametros">
              <Parametros />
              <p className="hidden md:block">Parámetros</p>
            </Link>
          )}
          {isAllowed('permisos_users') && (
            <Link className="flex gap-2 items-center" href="/usuarios">
              <Usuarios />
              <p className="hidden md:block">Usuarios</p>
            </Link>
          )}
          {isAllowed('web') && (
            <Link className="flex gap-2 items-center" href="/web">
              <Web />
              <p className="hidden md:block">Web</p>
            </Link>
          )}
        </ul>
      )}
      {toggle && (
        <button className="bg-[#3DADFF] transition-all duration-300 z-10 size-4 rounded-full absolute right-8 top-25 md:top-45"></button>
      )}
    </>
  );
}
