"use client";
import { usePathname } from "next/navigation";

export default function Header() {
  const path = usePathname();
  return (
    <>
      {path !== "/login" && (
        <header className="relative flex px-3 justify-between items-center">
          <div className="flex gap-5">
            <img
              src="/logo.png"
              alt="TravelNett Logo"
              className="w-20 md:w-40 aspect-square"
            />
            {path === "/dashboard" ? (
              <div className="text-black flex-col hidden md:flex items-start justify-center gap-2">
                <p className="font-semibold text-3xl">¡Hola 👋 Gabriel!</p>
                <h1 className="font-bold text-lg text-start">
                  ¡Bienvenido a Tranett!
                </h1>
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <img
                  src="/logo-empresa.png"
                  alt="Logo empresa logeada"
                  className="w-20 md:w-28"
                />
                <span className="text-lg text-black font-medium">GABRIEL</span>
              </div>
            )}
          </div>
          <button className="font-medium md:text-2xl pr-3">
            <i>Cerrar sesión</i>
          </button>
        </header>
      )}
    </>
  );
}
