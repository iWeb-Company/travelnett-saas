"use client";

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";

export default function InicioWebPage() {
  const { user } = useAuth();
  const [imageBannerFile, setImageBannerFile] = useState<File | string | null>(null);
  const [imageBannerPreviewUrl, setImageBannerPreviewUrl] = useState<string | null>(null);

  const [filesCarrusel, setFilesCarrusel] = useState<File[] | null>(null);
  const [filesCarruselPreviewUrl, setFilesCarruselPreviewUrl] = useState<string[] | string | null>(null);

  const [imagePortadaFile, setImagePortadaFile] = useState<File | string | null>(null);
  const [imagePortadaPreviewUrl, setImagePortadaPreviewUrl] = useState<string | null>(null);

  // const handleSave = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!user?.iweb_client_id) return;
  //   setIsSubmitting(true);
  //   try {
  //     await apiClient.updateInicio(user.iweb_client_id, {
  //       title,
  //       subtitle,
  //       aboutTitle,
  //       aboutText,
  //       whatsapp,
  //       email,
  //       instagram,
  //       facebook,
  //       primaryColor,
  //       secondaryColor,
  //     });
  //     toast.success("¡Configuración de Inicio guardada correctamente!");
  //   } catch (error) {
  //     console.error("Error guardando configuración de Inicio:", error);
  //     toast.error("Error al guardar configuración de Inicio.");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleImageBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageBannerFile(file);
      setImageBannerPreviewUrl(URL.createObjectURL(file));
    }
  }

  const handleCarruselChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files) {
      setFilesCarrusel(files);
      setFilesCarruselPreviewUrl(files.map(file => URL.createObjectURL(file)));
    }
  }

  const handleImagePortadaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImagePortadaFile(file);
      setImagePortadaPreviewUrl(URL.createObjectURL(file));
    }
  }

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

      <form className="w-full max-w-3xl mx-auto rounded-2xl p-6 md:p-8  flex flex-col gap-6 text-black mb-10">
        <div className="flex flex-col items-center justify-center gap-2 font-semibold">
          <p>Formato de imagen: JPG, JEPG, PNG, WEBP</p>
          <p>Formato de video: MP4, GIF</p>
          <p>Los videos que se subiran se veran en bucle.</p>
        </div>
        <h2 className="text-center font-bold text-xl">Banner</h2>
        <div className="flex flex-col justify-center items-center gap-2 my-2">
          {imageBannerPreviewUrl ? (
            <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-gray-300 shadow-md group">
              <img
                src={imageBannerPreviewUrl}
                alt="Vista previa del paquete"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImageBannerFile(null)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-all cursor-pointer"
                title="Eliminar imagen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-[#f1f1f1] border border-gray-300 py-2.5 px-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-all font-semibold text-gray-700 text-sm">
                <span>Cargar imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageBannerChange}
                />
              </label>
              <p className="text-xs text-gray-500">No hay imagen seleccionada</p>
            </div>
          )}
        </div>
        <h3 className="text-center font-bold text-xl">Carrusel de Portadas</h3>
        <div className="flex flex-col justify-center items-center gap-2 my-2">
          {filesCarruselPreviewUrl ? (
            <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-gray-300 shadow-md group">
              <img
                src={imageBannerPreviewUrl || filesCarruselPreviewUrl[0]}
                alt="Vista previa del paquete"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImageBannerFile(null)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-all cursor-pointer"
                title="Eliminar imagen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-[#f1f1f1] border border-gray-300 py-2.5 px-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-all font-semibold text-gray-700 text-sm">
                <span>Cargar imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCarruselChange}
                />
              </label>
              <p className="text-xs text-gray-500">No hay imagen seleccionada</p>
            </div>
          )}
        </div>
        <h2 className="text-center font-bold text-xl">Portada antes del Pie de Pagina</h2>
        <div className="flex flex-col justify-center items-center gap-2 my-2">
          {imagePortadaPreviewUrl ? (
            <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-gray-300 shadow-md group">
              <img
                src={imagePortadaPreviewUrl}
                alt="Vista previa del paquete"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImagePortadaFile(null)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-all cursor-pointer"
                title="Eliminar imagen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-[#f1f1f1] border border-gray-300 py-2.5 px-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-all font-semibold text-gray-700 text-sm">
                <span>Cargar imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImagePortadaChange}
                />
              </label>
              <p className="text-xs text-gray-500">No hay imagen seleccionada</p>
            </div>
          )}
        </div>
        {/* BOTÓN GUARDAR */}
        <div className="flex justify-center gap-4 mt-4">
          <button
            type="submit"
            className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
          >
            Guardar Cambios
          </button>
        </div>
      </form>
    </Container>
  );
}
