"use client";

import Link from "next/link";
import Container from "../components/Container";
import ToggleSalidas from "../components/ToggleSalidas";
import ArrowLeft from "../components/icons/ArrowLeft";
import { useAuth } from "@/context/AuthContext";

export default function Administracion() {
  const { iwebClient } = useAuth();
  const agencyLogo = iwebClient?.logo_xl || iwebClient?.logo_s || "/logo-grande.png";

  return (
    <Container>
      <ToggleSalidas />
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3"
      >
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <section className="my-10 w-full max-w-3xl mx-auto">
        <ul className="text-white flex flex-col gap-8">
          <Link
            href={"/administracion/cuentas"}
            className="bg-primary flex flex-col gap-3 py-2 text-center px-3 rounded-lg font-medium"
          >
            {/* <Micro /> */}
            <i className="text-center">CUENTAS BANCARIAS</i>
          </Link>
          <Link
            href="/administracion/tarjetas"
            className="bg-primary flex flex-col gap-3 py-2 text-center px-3 rounded-lg font-medium"
          >
            {/* <Micro /> */}
            <i className="text-center">TARJETAS</i>
          </Link>
          <Link
            href="/administracion/pagos"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium"
          >
            {/* <Hoteles /> */}
            <i className="text-center">PAGOS</i>
          </Link>
          <Link
            href="/administracion/tesoro"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium"
          >
            {/* <Regimen /> */}
            <i className="text-center">TESORO</i>
          </Link>
          <Link
            href="/administracion/cuentas-corrientes"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium"
          >
            {/* <Usuarios /> */}
            <i className="text-center">CUENTAS CORRIENTES</i>
          </Link>
          <Link
            href="/administracion/saldos"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium"
          >
            {/* <Web /> */}
            <i className="text-center">SALDOS DE CLIENTES</i>
          </Link>
        </ul>
      </section>
      <div className="xl:flex hidden absolute md:right-40 md:top-60 mt-8 justify-end">
        <img src={agencyLogo} className="size-50 object-contain" alt="Logo Empresa" />
      </div>
    </Container>
  );
}
