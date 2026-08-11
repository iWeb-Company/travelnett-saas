"use client";

import { useEffect, useState } from "react";
import Wpp from "../components/icons/Wpp";
import Mail from "../components/icons/Mail";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";

function extractSubdomainFromHostname(): string | null {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname.toLowerCase();

  // If local dev or raw IP
  if (hostname === "localhost" || hostname === "127.0.0.1" || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    // Check URL params for testing (e.g. ?slug=ruta86)
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("slug") || null;
  }

  const parts = hostname.split(".");

  // Subdomain for localhost (e.g. ruta86.localhost)
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0];
  }

  // Production {slug}.tranett.com
  if (parts.length >= 3) {
    const sub = parts[0];
    const reserved = ["www", "api", "ops", "operations", "admin", "panel", "mail", "data"];
    if (reserved.includes(sub)) return null;
    return sub;
  }

  return null;
}

export default function LoginPage() {
  const [slug, setSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [tenantInfo, setTenantInfo] = useState<{
    name: string;
    logo_xl: string;
    slug: string;
  } | null>(null);
  const [manualSlug, setManualSlug] = useState("");
  const [loadingTenant, setLoadingTenant] = useState(true);

  const router = useRouter();
  const { login } = useAuth();

  useEffect(() => {
    const detected = extractSubdomainFromHostname();
    setTenantSlug(detected);

    if (detected) {
      apiClient
        .getPublicTenantInfo(detected)
        .then((info) => {
          setTenantInfo({
            name: info.name,
            logo_xl: info.logo_xl,
            slug: info.slug,
          });
        })
        .catch((err) => {
          console.warn("Could not load tenant branding:", err);
        })
        .finally(() => {
          setLoadingTenant(false);
        });
    } else {
      setLoadingTenant(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    const effectiveSlug = tenantSlug || manualSlug.trim() || slug.trim();
    if (!effectiveSlug && email !== "iweb_admin") {
      setError("Por favor ingresa el identificador (slug) de tu agencia.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await login(effectiveSlug, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(
        err.message || "Credenciales inválidas. Por favor intenta nuevamente."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page mx-5 min-h-screen max-w-3xl md:mx-auto flex flex-col justify-center py-10">
      <div className="text-center mb-6">
        {tenantInfo?.logo_xl ? (
          <img
            className="mx-auto my-4 max-h-20 object-contain rounded-lg shadow-sm"
            src={tenantInfo.logo_xl}
            alt={`Logo de ${tenantInfo.name}`}
          />
        ) : (
          <img
            className="mx-auto my-4 max-h-16 object-contain"
            src="/logo.png"
            alt="Logo de TravelNett"
          />
        )}

        <h1 className="text-3xl font-bold text-black mt-2">
          {tenantInfo ? tenantInfo.name : "TravelNett SaaS"}
        </h1>
        <p className="text-sm text-zinc-600 mt-1">
          {tenantInfo ? "Portal de Gestión de la Agencia" : "Iniciar sesión en la plataforma"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:mx-auto w-full max-w-md gap-5 my-4 bg-white/80 backdrop-blur p-8 rounded-2xl shadow-xl border border-black/10"
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {!tenantSlug && (
          <div>
            <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">
              Agencia / Subdominio (slug)
            </label>
            <input
              className="w-full bg-[#F1F1F1] border border-black/25 rounded-lg py-2.5 px-4 text-black focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="ej: ruta86"
              type="text"
              value={manualSlug || slug}
              onChange={(e) => {
                setManualSlug(e.target.value);
                setSlug(e.target.value);
              }}
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">
            Usuario / Email
          </label>
          <input
            className="w-full bg-[#F1F1F1] border border-black/25 rounded-lg py-2.5 px-4 text-black focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="admin@tuagencia.com o usuario"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">
            Contraseña
          </label>
          <div className="relative">
            <input
              className="w-full bg-[#F1F1F1] border border-black/25 rounded-lg py-2.5 px-4 text-black focus:outline-none focus:ring-2 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type={showPass ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Ingrese su contraseña"
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-2.5 text-xs text-zinc-500 hover:text-black"
            >
              {showPass ? "Ocultar" : "Mostrar"}
            </button>
          </div>
        </div>

        <button
          disabled={isSubmitting}
          className="bg-primary hover:opacity-90 disabled:opacity-50 text-md font-medium text-white py-3 rounded-xl shadow-md transition mt-2 cursor-pointer"
        >
          {isSubmitting ? "Ingresando..." : "Ingresar"}
        </button>
      </form>

      <ul className="flex flex-col items-center justify-center text-sm text-zinc-700 gap-3 mt-6">
        <li className="flex items-center gap-2 text-center text-xs text-zinc-500">
          <svg
            width="20"
            height="20"
            viewBox="0 0 28 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M13.8413 20.8488C14.2467 20.8488 14.5896 20.7087 14.8699 20.4284C15.1502 20.1481 15.2899 19.8056 15.2892 19.401C15.2884 18.9963 15.1486 18.6535 14.8699 18.3724C14.5911 18.0914 14.2483 17.9516 13.8413 17.9531C13.4344 17.9547 13.0919 18.0948 12.8139 18.3736C12.536 18.6523 12.3958 18.9948 12.3935 19.401C12.3912 19.8071 12.5313 20.15 12.8139 20.4295C13.0966 20.709 13.439 20.8488 13.8413 20.8488Z"
              fill="#0546F7"
            />
          </svg>
          <p>¿Problemas para ingresar? Contacta al soporte de iWeb.</p>
        </li>
      </ul>
    </main>
  );
}
