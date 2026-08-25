"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import Wpp from "../components/icons/Wpp";
import Mail from "../components/icons/Mail";

function extractSubdomainFromHostname(): string | null {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname.toLowerCase();

  const parts = hostname.split(".");

  // Subdomain for localhost (e.g. ruta86.localhost)
  if (parts.length === 2 && parts[1] === "localhost") {
    return parts[0];
  }

  // Production {slug}.tranett.com or {slug}.domain.com
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

  const handleContinue = (inputSlug?: string) => {
    const cleanSlug = (inputSlug || manualSlug || slug).trim().toLowerCase();
    if (!cleanSlug) {
      setError("Por favor ingresa el identificador (slug) de tu agencia.");
      return;
    }

    if (typeof window !== "undefined") {
      const hostname = window.location.hostname.toLowerCase();
      const port = window.location.port ? `:${window.location.port}` : "";
      const protocol = window.location.protocol;

      let baseDomain = hostname;
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        baseDomain = "localhost";
      } else {
        const parts = hostname.split(".");
        if (parts.length >= 2) {
          baseDomain = parts.slice(-2).join(".");
        }
      }

      const targetUrl = `${protocol}//${cleanSlug}.${baseDomain}${port}/login`;
      window.location.assign(targetUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!tenantSlug) {
      handleContinue();
      return;
    }

    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await login(tenantSlug, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      let msg = err.message || "Credenciales inválidas. Por favor intenta nuevamente.";
      if (
        msg.includes("Failed to parse") ||
        msg.includes("http:") ||
        msg.includes("https:") ||
        msg.includes("fetch") ||
        msg.includes("MdpuF8K") ||
        msg.includes("Proxy") ||
        msg.includes("502") ||
        msg.includes("500")
      ) {
        msg = "Error de conexión con el servidor. Por favor intenta nuevamente más tarde.";
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page mx-5 min-h-screen max-w-3xl md:mx-auto flex flex-col justify-center py-10">
      <div className="text-center">
        <img
          className="mx-auto my-4 md:max-h-auto max-h-28 object-contain"
          src="/logo.png"
          alt="Logo de TravelNett"
        />
        <h1 className="text-3xl font-bold text-black mt-2">
          {tenantInfo ? 'Inicio de sesión' : "Tranett"}
        </h1>
        <p className="text-md text-zinc-600 mt-1">
          {tenantInfo ? tenantInfo.name : "Indica el slug proporcionado por los administradores para iniciar sesión en tu cuenta"}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:mx-auto w-full max-w-xl gap-5 md:mb-4 p-8"
      >
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
            {error}
          </div>
        )}

        {!tenantSlug ? (
          <div>
            <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">
              Agencia / Subdominio (slug)
            </label>
            <input
              className="w-full bg-[#F1F1F1] border border-black/25 rounded-lg py-2.5 px-4 text-black focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder=""
              type="text"
              value={manualSlug || slug}
              onChange={(e) => {
                setManualSlug(e.target.value);
                setSlug(e.target.value);
              }}
            />
          </div>
        ) : <>
          <div>
            <label className="block text-xs font-semibold text-zinc-600 uppercase mb-1">
              Usuario
            </label>
            <input
              className="w-full bg-[#F1F1F1] border border-black/25 rounded-lg py-2.5 px-4 text-black focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Usuario"
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
                placeholder="Contraseña"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-0 h-full flex items-center text-xs text-zinc-500 hover:text-black"
              >
                {showPass ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>
        </>}



        {tenantSlug ? (
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:opacity-90 disabled:opacity-50 text-md font-medium text-white py-3 rounded-xl shadow-md transition mt-2 cursor-pointer"
          >
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </button>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary hover:opacity-90 disabled:opacity-50 text-md font-medium text-white py-3 rounded-xl shadow-md transition mt-2 cursor-pointer"
          >
            {isSubmitting ? "Comprobando..." : "Comprobar"}
          </button>
        )}
      </form>

      <ul className="flex flex-col items-start md:mx-auto w-full max-w-xl text-black text-sm px-8 gap-5">
        <li className="flex items-center justify-center gap-2"><svg
          width="28"
          height="28"
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13.8413 20.8488C14.2467 20.8488 14.5896 20.7087 14.8699 20.4284C15.1502 20.1481 15.2899 19.8056 15.2892 19.401C15.2884 18.9963 15.1486 18.6535 14.8699 18.3724C14.5911 18.0914 14.2483 17.9516 13.8413 17.9531C13.4344 17.9547 13.0919 18.0948 12.8139 18.3736C12.536 18.6523 12.3958 18.9948 12.3935 19.401C12.3912 19.8071 12.5313 20.15 12.8139 20.4295C13.0966 20.709 13.439 20.8488 13.8413 20.8488ZM12.7989 16.3895H14.9417C14.9417 15.7524 15.0143 15.2505 15.1594 14.8837C15.3046 14.5169 15.7146 14.015 16.3895 13.378C16.8914 12.8761 17.2872 12.3981 17.5767 11.944C17.8663 11.49 18.0111 10.9448 18.0111 10.3086C18.0111 9.22751 17.6154 8.39742 16.8239 7.81828C16.0324 7.23915 15.0961 6.94958 14.0151 6.94958C12.9147 6.94958 12.0221 7.23915 11.3371 7.81828C10.6522 8.39742 10.1742 9.09238 9.90321 9.90316L11.8144 10.656C11.9109 10.3086 12.1282 9.93212 12.4665 9.52673C12.8047 9.12133 13.3209 8.91864 14.0151 8.91864C14.6328 8.91864 15.0961 9.08774 15.405 9.42596C15.7139 9.76417 15.8683 10.1356 15.8683 10.5402C15.8683 10.9263 15.7525 11.2885 15.5208 11.6267C15.2892 11.9649 14.9996 12.2784 14.6521 12.5672C13.8027 13.3201 13.2815 13.8895 13.0885 14.2756C12.8954 14.6617 12.7989 15.3663 12.7989 16.3895ZM13.8992 25.4819C12.297 25.4819 10.7912 25.178 9.38199 24.5703C7.97277 23.9626 6.74693 23.1372 5.70449 22.0939C4.66205 21.0507 3.83697 19.8249 3.22927 18.4164C2.62156 17.008 2.31732 15.5022 2.31655 13.8992C2.31578 12.2961 2.62002 10.7904 3.22927 9.38194C3.83852 7.97349 4.66359 6.74765 5.70449 5.70444C6.74539 4.66123 7.97122 3.83615 9.38199 3.22922C10.7928 2.62229 12.2985 2.31805 13.8992 2.3165C15.5 2.31496 17.0057 2.6192 18.4165 3.22922C19.8273 3.83924 21.0531 4.66431 22.094 5.70444C23.1349 6.74457 23.9603 7.9704 24.5704 9.38194C25.1804 10.7935 25.4842 12.2992 25.4819 13.8992C25.4796 15.4991 25.1754 17.0049 24.5692 18.4164C23.9631 19.828 23.138 21.0538 22.094 22.0939C21.05 23.1341 19.8242 23.9595 18.4165 24.5703C17.0088 25.1811 15.5031 25.485 13.8992 25.4819Z"
            fill="#0546F7"
          />
        </svg>
          Si no podes iniciar sesión comunicate con nosotros</li>
        <Link target='_blank' href="https://wa.me/5491167877298" className="flex items-center justify-start gap-2">
          <Wpp />
          <p>Whatsapp</p>
        </Link>
        <Link href="mailto:support@travelnett.com" className="flex items-center gap-2">
          <Mail />
          <p>Email</p>
        </Link>
      </ul>
    </main>
  );
}
