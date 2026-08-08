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
              <div className="text-black flex-col hidden md:flex items-start justify-center gap-1.5 py-2 min-h-[64px]">
                {isLoading ? (
                  <div className="flex flex-col gap-2 animate-pulse">
                    <div className="h-7 w-48 bg-gray-300/80 rounded-md"></div>
                    <div className="h-5 w-36 bg-gray-200/80 rounded-md"></div>
                  </div>
                ) : user ? (
                  <>
                    <div className="font-semibold text-3xl">
                      <p>Hola 👋 {user.name}</p>
                    </div>
                    <h1 className="font-bold text-lg text-start">
                      ¡Bienvenido a Trannet!
                    </h1>
                  </>
                ) : null}
              </div>
            ) : (
              user && (
                <div className="hidden md:flex flex-col items-center absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2">
                  <img
                    src="/logo-empresa.png"
                    alt="Logo empresa logeada"
                    className="w-20 md:w-28"
                  />
                  <span className="text-lg text-black font-medium">
                    {user.name}
                  </span>
                </div>
              )
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
