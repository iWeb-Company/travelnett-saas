import Link from "next/link";
import Container from "@/app/components/Container";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import ArrowLeft from "@/app/components/icons/ArrowLeft";

export default function CuentasCorrientesPage() {
  return (
    <Container>
      <ToggleSalidas />
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <section className="my-10">
        <ul className="text-white flex flex-col gap-8">
          <Link
            href={"/administracion/cuentas-corrientes/clientes"}
            className="bg-primary w-full gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Salidas /> */}
            <i className="text-center">CLIENTES</i>
          </Link>
          <Link
            href="/administracion/cuentas-corrientes/proveedores"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Paquetes /> */}
            <i className="text-center">PROVEEDORES</i>
          </Link>
        </ul>
        <div className="flex mt-8 justify-end">
          <img src="/logo-empresa.png" alt="Logo Empresa" />
        </div>
      </section>
    </Container>
  );
}
