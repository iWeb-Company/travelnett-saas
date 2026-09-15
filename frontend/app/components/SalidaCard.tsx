import Copy from "@/app/components/icons/salidas/Copy";
import Rooming from "@/app/components/icons/salidas/Rooming";
import Update from "@/app/components/icons/salidas/Update";
import Delete from "@/app/components/icons/salidas/Delete";
import Link from "next/link";
import { formatDateDDMMYY } from "@/lib/formatDate";

interface SalidaCardProps {
  id: string | number;
  destino: string;
  fecha: string;
  categorias: {
    tipo: string;
    total: number;
    disponible: number;
  }[];
  totalDisponible: number;
  onDelete?: (id: string | number) => void;
}

export default function SalidaCard({
  id,
  destino,
  fecha,
  categorias,
  totalDisponible,
  onDelete,
}: SalidaCardProps) {
  const semicama = categorias.find(
    (categoria) => categoria.tipo === "Semicama",
  );
  const cama = categorias.find((categoria) => categoria.tipo === "Cama");

  return (
    <div className="flex flex-col sm:flex-row items-stretch w-full sm:items-start sm:gap-5">
      <div className="flex-1 flex w-full">
        <div className="bg-primary flex-col md:flex-row text-white rounded-t-md justify-between w-full px-2 md:text-xl md:px-5 font-semibold text-sm py-3 flex gap-">
          <p className="text-center">{destino}</p>
          <div className="">
            <div className="flex items-center justify-between w-full gap-10">
              <div className="flex text-nowrap font-semibold items-center gap-2">
                <small>Semicama: </small>
                <div className="flex">
                  <p>{semicama?.total ?? 0}/</p>
                  <p
                    className={`${semicama?.disponible === 0 ? "text-[#FF8080]" : "text-[#8AFF00]"}`}>
                    {semicama?.disponible ?? 0}
                  </p>
                </div>
              </div>
              <div className="flex text-nowrap font-semibold items-center gap-2">
                <small>Cama: </small>
                <div className="flex">
                  <p>{cama?.total ?? 0}/</p>
                  <p
                    className={`${cama?.disponible === 0 ? "text-[#FF8080]" : "text-[#8AFF00]"}`}>
                    {cama?.disponible ?? 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center text-nowrap gap-2">
                <small>Total disponible: </small>
                <p
                  className={`${totalDisponible === 0 ? "text-[#FF8080]" : "text-[#8AFF00]"} text-center w-full`}>
                  {totalDisponible}
                </p>
              </div>
            </div>
          </div>
          <p className="text-center">{formatDateDDMMYY(fecha)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 rounded-b-lg md:gap-x-3 justify-between text-white px-2 md:bg-transparent bg-primary/50 py-1">
        <Link
          href={`/salidas/lista/${id}`}
          className="flex items-center justify-center  md:gap-2 text-sm md:text-lg">
          <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
            <Copy id={id} />
            <p className="text-xs md:hidden font-semibold">Salida</p>
          </span>
        </Link>
        <Link
          href={`/salidas/rooming/${id}`}
          className="flex items-center justify-center  gap-1 md:gap-2 text-sm md:text-lg">
          <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
            <Rooming id={id} />
            <p className="text-xs md:hidden font-semibold">Rooming</p>
          </span>
        </Link>
        <Link
          href={`/salidas/agregar-salida?id=${id}`}
          className="flex items-center justify-center hover:text-green-600 gap-1 md:gap-2 text-sm md:text-lg">
          <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
            <Update id={id} />
            <p className="text-xs md:hidden font-semibold">Modificar</p>
          </span>
        </Link>
        <button
          onClick={() => onDelete && onDelete(id)}
          className="flex items-center justify-center  gap-1 md:gap-2 text-sm md:text-lg hover:text-red-600">
          <span className="flex items-center [&>svg]:md:w-8 [&>svg]:md:h-8">
            <Delete id={id} />
            <p className="text-xs md:hidden font-semibold">Eliminar</p>
          </span>
        </button>
      </div>
    </div>
  );
}
