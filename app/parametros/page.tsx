import Link from "next/link";
import Container from "../components/Container";
import ToggleSalidas from "../components/ToggleSalidas";
import ArrowLeft from "../components/icons/ArrowLeft";

export default function ParametrosPage() {
  return (
    <Container>
      <ToggleSalidas />
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <section className="my-10 w-full max-w-3xl mx-auto">
        <ul className="text-white flex flex-col gap-8">
        <h2 className="text-center text-black font-semibold text-xl">Panel</h2>
          <Link
            href={"/parametros/transporte"}
            className="bg-primary w-full gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Salidas /> */}
            <i className="text-center">EMPRESAS DE TRANSPORTE</i>
          </Link>
          <Link
            href="/parametros/hoteles"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Paquetes /> */}
            <i className="text-center">HOTELES</i>
          </Link>
          <Link
            href="/parametros/excursiones"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Paquetes /> */}
            <i className="text-center">EXCURSIONES</i>
          </Link>
          <Link
            href="/parametros/periodos"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Parametros /> */}
            <i className="text-center">PERÍODOS</i>
          </Link>
          <Link
            href="/parametros/destinos"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Usuarios /> */}
            <i className="text-center">DESTINOS</i>
          </Link>
          <Link
            href="/parametros/cargas"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Web /> */}
            <i className="text-center">LUGARES DE CARGA</i>
          </Link>
          <Link
            href="/parametros/clientes"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Web /> */}
            <i className="text-center">CLIENTES</i>
          </Link>
          <Link
            href="/parametros/regimenes"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Web /> */}
            <i className="text-center">REGIMENES</i>
          </Link>
          <Link
            href="/parametros/pasajeros"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Web /> */}
            <i className="text-center">PASAJEROS</i>
          </Link>
          <Link
            href="/parametros/micros"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Web /> */}
            <i className="text-center">TIPOS DE MICRO</i>
          </Link>
        </ul>
      </section>
        <div className="xl:flex hidden absolute md:right-40 md:top-60 mt-8 justify-end">
          <img src="logo-grande.png" className='size-50' alt="Logo Empresa" />
        </div>
    </Container>
  );
}
