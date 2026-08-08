"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import Salidas from "../components/icons/home/Salidas";
import Paquetes from "../components/icons/home/Paquetes";
import Administracion from "../components/icons/home/Administracion";
import Parametros from "../components/icons/home/Parametros";
import Usuarios from "../components/icons/home/Usuarios";
import Web from "../components/icons/home/Web";
import Mail from "../components/icons/Mail";
import Wpp from "../components/icons/Wpp";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";

export default function DashboardPage() {
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    proxima_salida: "Cargando...",
    reservas_hoy: 0,
    saldo_mes: "$0",
    reservas_mes: 0,
    paquetes_activos: 0,
    cliente_del_mes: "Cargando...",
  });

  useEffect(() => {
    if (user?.iweb_client_id) {
      apiClient
        .getDashboardSummary(user.iweb_client_id)
        .then((data) => setSummary(data))
        .catch((err) => console.error("Error fetching dashboard summary:", err))
        .finally(() => setLoading(false));
    }
  }, [user?.iweb_client_id]);

  const sections = [
    { key: "salidas", label: "SALIDAS", href: "/salidas", icon: <Salidas />, allowed: permissions?.salidas ?? true },
    { key: "paquetes", label: "PAQUETES", href: "/paquetes", icon: <Paquetes />, allowed: permissions?.paquetes ?? true },
    { key: "administracion", label: "ADMINISTRACIÓN", href: "/administracion", icon: <Administracion />, allowed: permissions?.administracion ?? true },
    { key: "parametros", label: "PARÁMETROS", href: "/parametros", icon: <Parametros />, allowed: permissions?.parametros ?? true },
    { key: "permisos_users", label: "USUARIOS Y PERMISOS", href: "/usuarios", icon: <Usuarios />, allowed: permissions?.permisos_users ?? true },
    { key: "web", label: "WEB", href: "/web", icon: <Web />, allowed: permissions?.web ?? true },
  ];

  if (loading) {
    return (
      <main>
        <section className="px-5">
          {/* MOBILE SKELETON */}
          <div className="flex md:hidden text-sm bg-primary/90 rounded-lg shadow-md justify-between px-4 py-4 text-white animate-pulse">
            <div className="flex flex-col gap-4 flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="h-3.5 w-20 bg-white/30 rounded-xs"></div>
                <div className="h-5 w-24 bg-white/50 rounded-xs"></div>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="h-3.5 w-24 bg-white/30 rounded-xs"></div>
                <div className="h-5 w-12 bg-white/50 rounded-xs"></div>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="h-3.5 w-24 bg-white/30 rounded-xs"></div>
                <div className="h-5 w-28 bg-white/50 rounded-xs"></div>
              </div>
            </div>
            <div className="flex flex-col gap-4 flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="h-3.5 w-24 bg-white/30 rounded-xs"></div>
                <div className="h-5 w-12 bg-white/50 rounded-xs"></div>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="h-3.5 w-24 bg-white/30 rounded-xs"></div>
                <div className="h-5 w-12 bg-white/50 rounded-xs"></div>
              </div>
              <div className="flex flex-col items-center gap-1.5 w-full">
                <div className="h-3.5 w-24 bg-white/30 rounded-xs"></div>
                <div className="h-5 w-24 bg-white/50 rounded-xs"></div>
              </div>
            </div>
          </div>

          {/* DESKTOP SKELETON */}
          <div className="hidden md:flex overflow-hidden text-sm bg-primary/90 rounded-lg shadow-md py-4 px-8 text-white animate-pulse justify-between items-center">
            <div className="flex items-center gap-8 w-full justify-around">
              <div className="flex items-center gap-3">
                <div className="h-4 w-24 bg-white/30 rounded-xs"></div>
                <div className="h-6 w-28 bg-white/60 rounded-xs"></div>
              </div>
              <span className="opacity-30">|</span>
              <div className="flex items-center gap-3">
                <div className="h-4 w-28 bg-white/30 rounded-xs"></div>
                <div className="h-6 w-12 bg-white/60 rounded-xs"></div>
              </div>
              <span className="opacity-30">|</span>
              <div className="flex items-center gap-3">
                <div className="h-4 w-28 bg-white/30 rounded-xs"></div>
                <div className="h-6 w-28 bg-white/60 rounded-xs"></div>
              </div>
              <span className="opacity-30">|</span>
              <div className="flex items-center gap-3">
                <div className="h-4 w-28 bg-white/30 rounded-xs"></div>
                <div className="h-6 w-12 bg-white/60 rounded-xs"></div>
              </div>
              <span className="opacity-30">|</span>
              <div className="flex items-center gap-3">
                <div className="h-4 w-24 bg-white/30 rounded-xs"></div>
                <div className="h-6 w-12 bg-white/60 rounded-xs"></div>
              </div>
              <span className="opacity-30">|</span>
              <div className="flex items-center gap-3">
                <div className="h-4 w-24 bg-white/30 rounded-xs"></div>
                <div className="h-6 w-24 bg-white/60 rounded-xs"></div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTIONS BUTTONS SKELETON */}
        <section className="p-5 flex items-start justify-between">
          <div className="flex flex-col mx-auto w-full max-w-4xl">
            <hr className="my-5 border-gray-400" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-7 md:gap-x-20">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="bg-primary/30 animate-pulse flex items-center gap-5 py-4 px-7 rounded-lg h-[68px] w-full"
                >
                  <div className="w-8 h-8 rounded-full bg-white/20"></div>
                  <div className="h-6 w-40 bg-white/30 rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="px-5">
        {/* MOBILE  */}
        <div className="flex md:hidden text-sm bg-primary rounded-lg shadow-md justify-between px-3 shadow-black/50 gap-10 py-3 text-white">
          <div className="flex flex-col gap-5 justify-between items-center">
            <div className="flex flex-col items-center">
              <p>Proxima salida</p>
              <b>{summary.proxima_salida}</b>
            </div>
            <div className="flex flex-col items-center">
              <p>Reservas este día</p>
              <b>{summary.reservas_hoy}</b>
            </div>
            <div className="flex flex-col items-center">
              <p>Saldo Gral del mes</p>
              <b>{summary.saldo_mes}</b>
            </div>
          </div>
          <div className="flex flex-col gap-5 justify-between items-center">
            <div className="flex flex-col items-center">
              <p>Reservas este mes</p>
              <b>{summary.reservas_mes}</b>
            </div>
            <div className="flex flex-col items-center">
              <p>Paquetes activos</p>
              <b>{summary.paquetes_activos}</b>
            </div>
            <div className="flex flex-col items-center">
              <p>Cliente del mes</p>
              <b>{summary.cliente_del_mes}</b>
            </div>
          </div>
        </div>
        {/* DESKTOP  */}
        <div className="hidden md:flex overflow-hidden text-sm bg-primary rounded-lg shadow-md shadow-black/50 text-white">
          <div
            className="flex items-center animate-infinite-scroll"
            style={{ width: "max-content" }}
          >
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex items-center gap-8 text-lg px-8 py-3 whitespace-nowrap"
              >
                <p>
                  Proxima salida <b>{summary.proxima_salida}</b>
                </p>
                <span className="opacity-30">|</span>
                <p>
                  Reservas este día <b>{summary.reservas_hoy}</b>
                </p>
                <span className="opacity-30">|</span>
                <p>
                  Saldo Gral del mes <b>{summary.saldo_mes}</b>
                </p>
                <span className="opacity-30">|</span>
                <p>
                  Reservas este mes <b>{summary.reservas_mes}</b>
                </p>
                <span className="opacity-30">|</span>
                <p>
                  Paquetes activos <b>{summary.paquetes_activos}</b>
                </p>
                <span className="opacity-30">|</span>
                <p>
                  Cliente del mes <b>{summary.cliente_del_mes}</b>
                </p>
                <span className="opacity-30">|</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="p-5 flex items-start justify-between">
        <div className="flex flex-col mx-auto">
          <hr className="my-5 border-gray-400" />
          <ul className="text-white flex md:grid grid-cols-2 place-content-center mx-auto flex-col md:gap-x-20 gap-7">
            {sections.map((sec) => {
              if (sec.allowed) {
                return (
                  <Link
                    key={sec.key}
                    href={sec.href}
                    className="bg-primary flex items-center gap-3 py-2 px-3 md:text-xl md:px-7 md:py-4 md:gap-5 rounded-lg font-medium transition-all hover:scale-[1.02]"
                  >
                    <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
                      {sec.icon}
                    </span>
                    <i>{sec.label}</i>
                  </Link>
                );
              } else {
                return (
                  <div
                    key={sec.key}
                    title="No tienes permiso para acceder a esta sección"
                    className="bg-gray-300 text-gray-500 flex items-center justify-between py-2 px-3 md:text-xl md:px-7 md:py-4 md:gap-5 rounded-lg font-medium opacity-60 cursor-not-allowed select-none pointer-events-none"
                  >
                    <div className="flex items-center gap-3 md:gap-5">
                      <span className="flex items-center grayscale opacity-70 [&>svg]:md:w-8 [&>svg]:md:h-8">
                        {sec.icon}
                      </span>
                      <i>{sec.label}</i>
                    </div>
                    <span className="text-xs bg-gray-400 text-white font-bold px-2 py-1 rounded uppercase tracking-wider">
                      Deshabilitado
                    </span>
                  </div>
                );
              }
            })}
          </ul>
          <ul className="flex flex-col md:grid grid-cols-2  md:gap-x-20 gap-4 mt-6 text-sm md:text-lg text-black">
            <hr className="my-2 border-gray-400 hidden md:block" />
            <hr className="my-2 border-gray-400" />
            <Link href="/" className="flex items-center gap-2 md:gap-4">
              <span className="flex items-center [&>svg]:md:w-9 [&>svg]:md:h-9">
                <Wpp />
              </span>
              <p>Whatsapp</p>
            </Link>
            <Link href="/" className="flex items-center gap-2 md:gap-4">
              <span className="flex items-center [&>svg]:md:w-9 [&>svg]:md:h-9">
                <Mail />
              </span>
              <p>Email</p>
            </Link>
          </ul>
        </div>
        <img
          src="/logo-empresa.png"
          className="w-20 md:absolute right-10 md:w-50 self-start mt-5"
          alt="Logo de empresa logeada"
        />
      </section>
      <img className="w-117 hidden md:block" src="/fotohome.png" alt="Foto Dashboard" />
    </main>
  );
}
