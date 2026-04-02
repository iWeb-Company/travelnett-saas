import ToggleActiveFilters from "@/app/components/ToggleActiveFilters";

export default function TarjetaCard({ tarjeta }: { tarjeta: any }) {
  return (
    <div className={`flex items-start justify-center w-full mx-auto`}>
      <div className="flex gap-2">
        {/* Header azul clickeable */}
        <div className="bg-[#5782F7] text-white justify-between items-center px-4 md:px-5 font-medium text-sm md:text-base py-1 flex gap-2 select-none transition-all duration-300 rounded-lg">
          <p className="tracking-wider md:w-150 w-50">{tarjeta.tipo}</p>
          {/* Toggle Activo */}
          <ToggleActiveFilters color="text-white" />
        </div>

        {/* Botón eliminar fuera de la card */}
        <button className="text-primary hover:text-red-500 transition-colors">
          <svg
            className="md:w-8 w-5"
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
    </div>
  );
}
