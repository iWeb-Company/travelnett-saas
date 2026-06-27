"use client";

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function InicioWebPage() {
  const [title, setTitle] = useState("Tu próximo viaje comienza aquí");
  const [subtitle, setSubtitle] = useState("Encuentra los mejores paquetes turísticos y salidas en bus o aéreo.");
  const [aboutTitle, setAboutTitle] = useState("Sobre Nosotros");
  const [aboutText, setAboutText] = useState("Somos una empresa de turismo con más de 10 años de experiencia, brindando servicios y transportes premium a los principales destinos del país.");
  const [whatsapp, setWhatsapp] = useState("+54 9 11 1234-5678");
  const [email, setEmail] = useState("contacto@agenciadeviajes.com");
  const [instagram, setInstagram] = useState("https://instagram.com/agenciadeviajes");
  const [facebook, setFacebook] = useState("https://facebook.com/agenciadeviajes");
  const [primaryColor, setPrimaryColor] = useState("#0546F7");
  const [secondaryColor, setSecondaryColor] = useState("#6005F7");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("¡Configuración de Inicio guardada correctamente!");
  };

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

      <form onSubmit={handleSave} className="w-full max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-6 text-black mb-10">
        
        {/* SECCIÓN HERO / BIENVENIDA */}
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-6">
          <h3 className="font-bold text-primary text-lg">Banner Principal (Hero)</h3>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Título de Bienvenida</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full shadow-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-black focus:outline-none focus:border-primary font-medium"
              placeholder="Ej: Tu próximo viaje comienza aquí"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Subtítulo descriptivo</label>
            <textarea
              rows={2}
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full shadow-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-black focus:outline-none focus:border-primary font-medium"
              placeholder="Ej: Encuentra los mejores paquetes turísticos..."
            />
          </div>
        </div>

        {/* SECCIÓN SOBRE NOSOTROS */}
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-6">
          <h3 className="font-bold text-primary text-lg">Quiénes Somos</h3>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Título de la sección</label>
            <input
              type="text"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              className="w-full shadow-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-black focus:outline-none focus:border-primary font-medium"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Texto de presentación</label>
            <textarea
              rows={4}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              className="w-full shadow-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-black focus:outline-none focus:border-primary font-medium"
            />
          </div>
        </div>

        {/* REDES SOCIALES Y CONTACTO */}
        <div className="flex flex-col gap-4 border-b border-gray-100 pb-6">
          <h3 className="font-bold text-primary text-lg">Contacto & Redes Sociales</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">WhatsApp de contacto</label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full shadow-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-black focus:outline-none focus:border-primary font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Email público</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full shadow-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-black focus:outline-none focus:border-primary font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">URL Instagram</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full shadow-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-black focus:outline-none focus:border-primary font-medium"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">URL Facebook</label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                className="w-full shadow-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-black focus:outline-none focus:border-primary font-medium"
              />
            </div>
          </div>
        </div>

        {/* COLORES Y APARIENCIA */}
        <div className="flex flex-col gap-4 pb-2">
          <h3 className="font-bold text-primary text-lg">Estilo Visual y Colores</h3>
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Color Primario</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-10 h-10 border-0 rounded cursor-pointer"
                />
                <span className="text-sm font-mono text-gray-600 uppercase">{primaryColor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Color Secundario</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-10 h-10 border-0 rounded cursor-pointer"
                />
                <span className="text-sm font-mono text-gray-600 uppercase">{secondaryColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTÓN GUARDAR */}
        <div className="flex justify-end gap-4 mt-4">
          <Link
            href="/web"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-center"
          >
            Cancelar
          </Link>
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
