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
        <section className="my-10 w-full max-w-3xl mx-auto">
          <ul className="text-white flex flex-col gap-8">
            <Link
              href="/administracion/cuentas-corrientes/clientes"
              className="bg-primary cursor-pointer w-full gap-3 py-2 text-center px-3 rounded-lg font-medium"
            >
              <i className="text-center">CLIENTES</i>
            </Link>
            <Link
              href="/administracion/cuentas-corrientes/proveedores"
              className="bg-primary cursor-pointer gap-3 py-2 text-center px-3 rounded-lg font-medium"
            >
              <i className="text-center">PROVEEDORES</i>
            </Link>
          </ul>
        </section>
        <div className="xl:flex hidden absolute md:right-40 md:top-60 mt-8 justify-end">
          <img src="/logo-grande.png" className='size-50' alt="Logo Empresa" />
        </div>
      </section>
    </Container>
  );
}
