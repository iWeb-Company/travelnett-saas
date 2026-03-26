"use client";
import { useState, useRef, useEffect } from "react";
import Copy from "@/app/components/icons/salidas/Copy";
import Rooming from "@/app/components/icons/salidas/Rooming";
import Update from "@/app/components/icons/salidas/Update";
import Delete from "@/app/components/icons/salidas/Delete";

interface SalidaCardProps {
  id: number;
  destino: string;
  fecha: string;
  categorias: { tipo: string; total: number; disponible: number }[];
}

export default function SalidaCard({
  id,
  destino,
  fecha,
  categorias,
}: SalidaCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [categorias]);

  return (
    <div className="flex items-start gap-5">
      <div className="flex-1 flex flex-col">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className={`bg-primary text-white rounded-md justify-between px-2 md:text-xl md:px-5 font-semibold text-xs py-3 flex gap-2 cursor-pointer select-none transition-all duration-300 ${
            isOpen ? "rounded-t-lg" : "rounded-lg"
          }`}
        >
          <p>{destino}</p>
          <p>{fecha}</p>
        </div>

        {/* Dropdown animado */}
        <div
          ref={contentRef}
          style={{
            maxHeight: isOpen ? `${contentHeight}px` : "0px",
          }}
          className="overflow-hidden transition-all duration-500 ease-in-out"
        >
          <div className="bg-[#5782F7] shadow-lg shadow-black/50 text-white rounded-b-lg mx-2 py-1">
            <table className="w-full text-xs text-center">
              <thead>
                <tr>
                  <th className="py-1 font-medium">Tipo</th>
                  <th className="py-1 font-medium">Total</th>
                  <th className="py-1 font-medium">Disponible</th>
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat, index) => (
                  <tr key={index} className="font-semibold md:font-lg">
                    <td className="py-0.5">{cat.tipo}</td>
                    <td className="py-0.5">{cat.total}</td>
                    <td className="py-0.5">{cat.disponible}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-x-1 md:gap-x-3 justify-center py-3">
        <button className="flex items-center text-black gap-2 text-lg">
          <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
            <Copy id={id} />
          </span>
          <p>Lista</p>
        </button>
        <button className="flex items-center text-black gap-2 text-lg">
          <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
            <Rooming id={id} />
          </span>
          <p>Rooming</p>
        </button>
        <button className="flex items-center text-black gap-2 text-lg">
          <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
            <Update id={id} />
          </span>
          <p>Modificar</p>
        </button>
        <button className="flex items-center text-black gap-2 text-lg">
          <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
            <Delete id={id} />
          </span>
          <p>Eliminar</p>
        </button>
      </div>
    </div>
  );
}
