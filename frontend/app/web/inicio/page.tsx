"use client";

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Loader } from "@/app/components/Loader";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";

function MediaDisplay({ url, className = "w-full h-full object-cover" }: { url: string; className?: string }) {
  const isVideo = url.toLowerCase().endsWith(".mp4") || url.toLowerCase().includes("video/mp4") || url.startsWith("data:video");
  if (isVideo) {
    return (
      <video
        src={url}
        autoPlay
        loop
        muted
        playsInline
        className={className}
      />
    );
  }
  return (
    <img
      src={url}
      alt="Portada"
      className={className}
    />
  );
}

export default function InicioWebPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Banner state
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [removeBanner, setRemoveBanner] = useState(false);

  // 2. Carrusel state
  const [carruselUrls, setCarruselUrls] = useState<string[]>([]);
  const [carruselNewFiles, setCarruselNewFiles] = useState<File[]>([]);

  // 3. Portada Footer state
  const [portadaFooterUrl, setPortadaFooterUrl] = useState<string | null>(null);
  const [portadaFooterFile, setPortadaFooterFile] = useState<File | null>(null);
  const [removePortadaFooter, setRemovePortadaFooter] = useState(false);

  const fetchInicioData = async () => {
    if (!user?.iweb_client_id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await apiClient.getInicioWeb(user.iweb_client_id);
      if (data) {
        setBannerUrl(data.banner_url || null);
        setCarruselUrls(data.carrusel_urls || []);
        setPortadaFooterUrl(data.portada_footer_url || null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al cargar configuración de inicio");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (user?.iweb_client_id) {
      fetchInicioData();
    } else {
      setLoading(false);
    }
  }, [user?.iweb_client_id, authLoading]);

  // Handlers for Banner
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setRemoveBanner(false);
    }
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerUrl(null);
    setRemoveBanner(true);
  };

  // Handlers for Carrusel
  const handleCarruselChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      setCarruselNewFiles((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveExistingCarruselItem = (index: number) => {
    setCarruselUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewCarruselItem = (index: number) => {
    setCarruselNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Handlers for Portada Footer
  const handlePortadaFooterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPortadaFooterFile(file);
      setRemovePortadaFooter(false);
    }
  };

  const handleRemovePortadaFooter = () => {
    setPortadaFooterFile(null);
    setPortadaFooterUrl(null);
    setRemovePortadaFooter(true);
  };

  // Save changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.iweb_client_id) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Banner
      if (removeBanner) {
        formData.append("remove_banner", "true");
      } else if (bannerFile) {
        formData.append("banner_file", bannerFile);
      }

      // Portada Footer
      if (removePortadaFooter) {
        formData.append("remove_portada_footer", "true");
      } else if (portadaFooterFile) {
        formData.append("portada_footer_file", portadaFooterFile);
      }

      // Carrusel
      formData.append("carrusel_urls_kept", JSON.stringify(carruselUrls));
      carruselNewFiles.forEach((file) => {
        formData.append("carrusel_files", file);
      });

      const updated = await apiClient.updateInicioWeb(user.iweb_client_id, formData);
      if (updated) {
        setBannerUrl(updated.banner_url || null);
        setBannerFile(null);
        setRemoveBanner(false);

        setCarruselUrls(updated.carrusel_urls || []);
        setCarruselNewFiles([]);

        setPortadaFooterUrl(updated.portada_footer_url || null);
        setPortadaFooterFile(null);
        setRemovePortadaFooter(false);

        toast.success("¡Configuración de Inicio guardada con éxito!");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar la configuración de Inicio");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader />
        </div>
      </Container>
    );
  }

  // Derived previews
  const currentBannerDisplay = bannerFile ? URL.createObjectURL(bannerFile) : bannerUrl;
  const currentPortadaFooterDisplay = portadaFooterFile ? URL.createObjectURL(portadaFooterFile) : portadaFooterUrl;

  return (
    <Container>
      <ToggleSalidas />
      <Link href="/web" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver al menú</h1>
      </Link>
      <h2 className="text-black font-semibold text-center md:text-xl my-5">
        Configuración de Página de Inicio
      </h2>

      <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto rounded-2xl p-6 md:p-8 flex flex-col gap-6 text-black mb-10">
        <div className="flex flex-col items-center justify-center gap-2 font-semibold text-sm md:text-base text-gray-700 bg-gray-100 p-4 rounded-xl">
          <p>Formato de imagen: JPG, JPEG, PNG, WEBP</p>
          <p>Formato de video: MP4, GIF</p>
          <p className="text-primary font-bold">Los videos que se subirán se verán en bucle.</p>
        </div>

        {/* ── 1. BANNER ──────────────────────────────────────────────────────── */}
        <h2 className="text-center font-bold text-xl">Banner Principal</h2>
        <div className="flex flex-col justify-center items-center gap-2 my-2">
          {currentBannerDisplay ? (
            <div className="relative w-72 h-44 rounded-xl overflow-hidden border border-gray-300 shadow-md group">
              <MediaDisplay url={currentBannerDisplay} />
              <button
                type="button"
                onClick={handleRemoveBanner}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-all cursor-pointer"
                title="Eliminar banner"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-[#f1f1f1] border border-gray-300 py-2.5 px-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-all font-semibold text-gray-700 text-sm">
                <span>Cargar banner (Imagen / Video)</span>
                <input
                  type="file"
                  accept="image/*,video/mp4,.gif"
                  className="hidden"
                  onChange={handleBannerChange}
                />
              </label>
              <p className="text-xs text-gray-500">No hay banner seleccionado</p>
            </div>
          )}
        </div>

        {/* ── 2. CARRUSEL DE PORTADAS ────────────────────────────────────────── */}
        <h3 className="text-center font-bold text-xl">Carrusel de Portadas</h3>
        <div className="flex flex-col justify-center items-center gap-4 my-2">
          {/* Display grid of items */}
          <div className="flex flex-wrap justify-center gap-4 w-full">
            {carruselUrls.map((url, idx) => (
              <div key={`existing-${idx}`} className="relative w-36 h-36 rounded-xl overflow-hidden border border-gray-300 shadow-md group">
                <MediaDisplay url={url} />
                <button
                  type="button"
                  onClick={() => handleRemoveExistingCarruselItem(idx)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-all cursor-pointer"
                  title="Eliminar elemento"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {carruselNewFiles.map((file, idx) => (
              <div key={`new-${idx}`} className="relative w-36 h-36 rounded-xl overflow-hidden border border-blue-400 border-2 shadow-md group">
                <MediaDisplay url={URL.createObjectURL(file)} />
                <button
                  type="button"
                  onClick={() => handleRemoveNewCarruselItem(idx)}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-all cursor-pointer"
                  title="Eliminar nuevo elemento"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <label className="flex items-center gap-2 bg-[#f1f1f1] border border-gray-300 py-2.5 px-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-all font-semibold text-gray-700 text-sm mt-2">
            <span>+ Agregar portadas al carrusel</span>
            <input
              type="file"
              accept="image/*,video/mp4,.gif"
              multiple
              className="hidden"
              onChange={handleCarruselChange}
            />
          </label>
        </div>

        {/* ── 3. PORTADA ANTES DEL PIE DE PÁGINA ───────────────────────────── */}
        <h2 className="text-center font-bold text-xl">Portada antes del Pie de Página</h2>
        <div className="flex flex-col justify-center items-center gap-2 my-2">
          {currentPortadaFooterDisplay ? (
            <div className="relative w-72 h-44 rounded-xl overflow-hidden border border-gray-300 shadow-md group">
              <MediaDisplay url={currentPortadaFooterDisplay} />
              <button
                type="button"
                onClick={handleRemovePortadaFooter}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-all cursor-pointer"
                title="Eliminar portada"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-[#f1f1f1] border border-gray-300 py-2.5 px-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-all font-semibold text-gray-700 text-sm">
                <span>Cargar portada footer (Imagen / Video)</span>
                <input
                  type="file"
                  accept="image/*,video/mp4,.gif"
                  className="hidden"
                  onChange={handlePortadaFooterChange}
                />
              </label>
              <p className="text-xs text-gray-500">No hay portada seleccionada</p>
            </div>
          )}
        </div>

        {/* BOTÓN GUARDAR */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-white px-10 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center cursor-pointer disabled:opacity-50 shadow-md"
          >
            {isSubmitting ? "Guardando cambios..." : "Guardar Cambios"}
          </button>
        </div>
      </form>
    </Container>
  );
}
