import Link from "next/link";
import Container from "../components/Container";
import ToggleSalidas from "../components/ToggleSalidas";
import ArrowLeft from "../components/icons/ArrowLeft";

export default function Parametros() {
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
            href={"/web/reservas"}
            className="bg-primary w-full gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Salidas /> */}
            <i className="text-center">RESERVAS</i>
          </Link>
          <Link
            href="/web/novedades"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Paquetes /> */}
            <i className="text-center">NOVEDADES</i>
          </Link>
          <Link
            href="/web/formas-de-pago"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Paquetes /> */}
            <i className="text-center">FORMAS DE PAGO</i>
          </Link>
          <Link
            href="/web/documentacion"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Paquetes /> */}
            <i className="text-center">DOCUMENTACIÓN</i>
          </Link>
          <Link
            href="/web/cartelera"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Paquetes /> */}
            <i className="text-center">CARTELERA</i>
          </Link>
          <Link
            href="/web/inicio"
            className="bg-primary gap-3 py-2 text-center px-3 rounded-lg font-medium">
            {/* <Paquetes /> */}
            <i className="text-center">PAGINA DE INICIO</i>
          </Link>
        </ul>
        <div className="flex mt-8 justify-end">
          <img src="logo-empresa.png" alt="Logo Empresa" />
        </div>
      </section>
    </Container>
  );
}
