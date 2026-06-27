"use client";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const path = usePathname();
  const { logout, user, isLoading } = useAuth();

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
                <div className="font-semibold text-3xl">
                  {isLoading && !user ? (
                    "Cargando datos de informacion..."
                  ) : (
                    <p>
                      Hola 👋 {user?.name || "Usuario"}
                    </p>
                  )}
                </div>
                <h1 className="font-bold text-lg text-start">
                  ¡Bienvenido a Trannet!
                </h1>
              </div>
            ) : (
              <div className="hidden md:flex flex-col items-center absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                <img
                  src="/logo-empresa.png"
                  alt="Logo empresa logeada"
                  className="w-20 md:w-28"
                />
                <span className="text-lg text-black font-medium">
                  {user?.name}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={() => logout()}
            className="font-medium md:text-2xl pr-3"
          >
            <i>Cerrar sesión</i>
          </button>
        </header>
      )}
    </>
  );
}
