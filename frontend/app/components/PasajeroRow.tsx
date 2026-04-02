"use client";
import { useState, useRef, useEffect } from "react";

interface PasajeroRowProps {
  nombre: string;
  ascenso: string;
  butaca: string;
  telefono: string;
  reserva: string;
  cliente: string;
  edad: string;
  hotel: string;
}

export default function PasajeroRow({
  pasajero
}: {
  pasajero: PasajeroRowProps;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  return (
    <div className="flex flex-col justify-center">
      {/* Fila principal */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center cursor-pointer">
          <svg
            width="8"
            viewBox="0 0 10 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={`transition-transform duration-300 ${
              isOpen ? "rotate-90" : "rotate-0"
            }`}>
            <path d="M10 6L0 12V0L10 6Z" fill="#6B7280" />
          </svg>
        </button>
        <div className="flex-1 bg-[#D9DFF5] flex font-semibold border border-[#3DADFF] mx-auto rounded-t-md px-2 py-2.5 items-center justify-center text-xs text-black">
          <span className="px-2 flex-1 text-end">{pasajero.nombre}</span>
          <span className="px-2 border-l border-black md:block hidden">{pasajero.reserva}</span>
          <span className="px-2 border-l border-black md:block hidden">{pasajero.cliente}</span>
          <span className="px-2 border-l border-black">{pasajero.ascenso}</span>
          <span className="px-2 border-l border-black md:block hidden">{pasajero.hotel}</span>
          <span className="px-2 border-l border-black md:block hidden">{pasajero.edad}</span>
          <span className="px-2 border-l border-black md:block hidden">{pasajero.telefono}</span>
          <span className="px-2 border-l border-black">{pasajero.butaca}</span>
          <span className="pl-2 border-l cursor-pointer  border-black">📄</span>
        </div>
      </div>

      {/* Dropdown animado */}
      <div
        ref={contentRef}
        style={{
          maxHeight: isOpen ? `${contentHeight}px` : "0px",
        }}
        className="overflow-hidden transition-all duration-300 ease-in-out">
        <div className="flex items-center gap-2 pl-5 pt-1.5">
          <input className="text-xs text-primary font-semibold size-7 border rounded-md text-center" />
          <div className="flex-1 bg-blue-50/70 rounded-lg px-3 py-2 flex items-center text-xs text-gray-400">
            <span className="flex-1">{pasajero.nombre}</span>
            <span className="px-2 border-l border-gray-200">{pasajero.ascenso}</span>
            <span className="px-2 border-l border-gray-200">{pasajero.butaca}</span>
            <button className="pl-2 border-l border-gray-200">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21 16V14L13 9V3.5C13 2.67 12.33 2 11.5 2C10.67 2 10 2.67 10 3.5V9L2 14V16L10 13.5V19L8 20.5V22L11.5 21L15 22V20.5L13 19V13.5L21 16Z"
                  fill="#D1D5DB"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
