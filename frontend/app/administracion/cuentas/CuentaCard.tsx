"use client";
import ToggleActiveFilters from "@/app/components/ToggleActiveFilters";
import { useState, useRef, useEffect } from "react";

export default function CuentaCard({ cuenta }: { cuenta: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, []);

  return (
    <div
      className={`flex ${isOpen ? "items-start" : "items-center"} gap-3 mb-4`}>
      <div className="flex-1 flex flex-col">
        {/* Header azul clickeable */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="bg-[#5782F7] text-white justify-between items-center px-4 md:px-5 font-medium text-sm md:text-base py-1 flex gap-2 cursor-pointer select-none transition-all duration-300 rounded-lg">
          <p className="uppercase tracking-wider">
            {cuenta.banco} - {cuenta.tipo}
          </p>
          {/* Toggle Activo */}
          <ToggleActiveFilters color="text-white" />
        </div>

        {/* Dropdown animado */}
        <div
          ref={contentRef}
          style={{
            maxHeight: isOpen ? `${contentHeight + 20}px` : "0px",
          }}
          className="overflow-hidden transition-all duration-500 ease-in-out">
          <div className="bg-secondary shadow-lg shadow-black/30 text-white rounded-b-lg mx-2 py-4 px-4 flex flex-col gap-1">
            <p className="text-sm md:text-base">
              N° de cuenta: <span className="font-bold">{cuenta.numero}</span>
            </p>
            <p className="text-sm md:text-base">
              Titular: <span className="font-bold">{cuenta.titular}</span>
            </p>
            <p className="text-sm md:text-base">
              CUIT/CUIL: <span className="font-bold">{cuenta.cuit}</span>
            </p>
            <p className="text-sm md:text-base">
              CBU/CVU: <span className="font-bold">{cuenta.cbu}</span>
            </p>
            <p className="text-sm md:text-base">
              Alias: <span className="font-bold">{cuenta.alias}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Botón eliminar fuera de la card */}
      <button className="py-3 text-primary hover:text-red-500 transition-colors">
        <svg
          className="md:w-10 w-8"
          viewBox="0 0 38 38"
          fill="none"
          xmlns="http://www.w3.org/2000/svg">
          <path
            d="M9.5013 31.6667V9.50001H7.91797V7.91668H14.2513V6.69751H23.7513V7.91668H30.0846V9.50001H28.5013V31.6667H9.5013ZM11.0846 30.0833H26.918V9.50001H11.0846V30.0833ZM15.5306 26.9167H17.114V12.6667H15.5306V26.9167ZM20.8886 26.9167H22.472V12.6667H20.8886V26.9167Z"
            fill="#0546F7"
          />
        </svg>
      </button>
    </div>
  );
}
