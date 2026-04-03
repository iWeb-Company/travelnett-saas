"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Documentacion = {
  id: number;
  titulo: string;
  descripcion: string;
};

export default function DocumentacionPage() {
  const r = useRouter();
  const [docs, setDocs] = useState<Documentacion[]>([
    {
      id: 1,
      titulo: "Documentación para menores",
      descripcion: `Se les recuerda a los sres. pasajeros que todos, independientemente que crucen o no a países limítrofes, deberán llevar el documento actualizado y en buen estado de conservación ya que los mismos pueden ser requeridos por la autoridad competente en cualquier momento del viaje.
menores de 18 años que viajan con:
padre y madre: documento del menor o partida de nacimiento + documento de ambos mayores (todo original)
padre o madre: documento del menor o partida de nacimiento + documento del mayor + autorizacion de ministerio de transporte firmada por el padre que no viaja (todo original)
padre o madre viudo/a: documento del menor o partida de nacimiento + documento del mayor + certificado de defuncion (todo original)
terceros (abuelos, tios,primos, conocidos): documento del menor o partida de nacimiento…`,
    },
    {
      id: 2,
      titulo: "Documentación para salir del país",
      descripcion: `Se les recuerda a los sres pasajeros que todos, independientemente que crucen o no a países limítrofes, deberán llevar el documento actualizado y en buen estado de conservación ya que los mismos pueden ser requeridos por la autoridad competente en cualquier momento del viaje.

si usted es: Argentino/a Extranjero/a con residencia permanente en argentina Y tiene destino a: Uruguay Brasil Chile Debe contar con esta documentación:
Cédula de identidad o documento nacional de identidad + pasaporte válido de origen y visa (si corresponde según nacionalidad de origen) dni, cédula o pasaporte vigente.
menores de 18 años que viajan con:
padre y madre: documento del menor + libreta de matrimonio o partida de nacimiento (todo original)
padre o madre: documento del menor + libreta de matrimonio o partida de nacimiento…`,
    },
  ]);

  const [editingId, setEditingId] = useState<number | null>(null);

  const updateDoc = (id: number, descripcion: string) => {
    setDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, descripcion } : d))
    );
  };

  return (
    <Container>
      <ToggleSalidas />
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={() => r.push("/web")}
        className="flex items-center my-3 justify-start gap-3"
      >
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>
      <section className="flex justify-center max-w-3/4 flex-col items-center gap-10 mx-auto">
        <div className="flex justify-center">
          <button className="border-2 flex items-center gap-2 border-primary rounded-lg font-semibold px-10 py-2">
            <svg
              width="29"
              height="29"
              viewBox="0 0 29 29"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M8.8754 4.8539C12.6138 4.43998 16.3865 4.43998 20.125 4.8539C22.1949 5.0859 23.8648 6.71594 24.1076 8.79306C24.5506 12.5848 24.5506 16.4152 24.1076 20.207C23.8648 22.2841 22.1949 23.9141 20.125 24.1461C16.3865 24.5601 12.6138 24.5601 8.8754 24.1461C6.80552 23.9141 5.1356 22.2841 4.89273 20.207C4.44982 16.4156 4.44982 12.5856 4.89273 8.79427C5.01558 7.78516 5.4756 6.8471 6.19825 6.13213C6.9209 5.41715 7.86382 4.96717 8.87419 4.8551M14.5002 8.46681C14.7405 8.46681 14.971 8.56229 15.141 8.73225C15.311 8.9022 15.4064 9.13271 15.4064 9.37306V13.5938H19.6271C19.8675 13.5938 20.098 13.6892 20.268 13.8592C20.4379 14.0292 20.5334 14.2597 20.5334 14.5C20.5334 14.7404 20.4379 14.9709 20.268 15.1408C20.098 15.3108 19.8675 15.4063 19.6271 15.4063H15.4064V19.627C15.4064 19.8673 15.311 20.0978 15.141 20.2678C14.971 20.4377 14.7405 20.5332 14.5002 20.5332C14.2598 20.5332 14.0293 20.4377 13.8594 20.2678C13.6894 20.0978 13.5939 19.8673 13.5939 19.627V15.4063H9.37323C9.13288 15.4063 8.90237 15.3108 8.73241 15.1408C8.56246 14.9709 8.46698 14.7404 8.46698 14.5C8.46698 14.2597 8.56246 14.0292 8.73241 13.8592C8.90237 13.6892 9.13288 13.5938 9.37323 13.5938H13.5939V9.37306C13.5939 9.13271 13.6894 8.9022 13.8594 8.73225C14.0293 8.56229 14.2598 8.46681 14.5002 8.46681Z"
                fill="#0546F7"
              />
            </svg>
            <p>Agregar Documentación</p>
          </button>
        </div>

        {/* Documentaciones */}
        <div className="w-full space-y-6">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="border border-gray-300 rounded-lg p-6 bg-white"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-black font-bold text-lg">{doc.titulo}</h3>
                <button
                  onClick={() =>
                    setEditingId(editingId === doc.id ? null : doc.id)
                  }
                  className="bg-primary text-white font-semibold px-6 py-1.5 rounded-md hover:bg-blue-700"
                >
                  {editingId === doc.id ? "Cancelar" : "Editar"}
                </button>
              </div>

              {editingId === doc.id ? (
                <textarea
                  value={doc.descripcion}
                  onChange={(e) => updateDoc(doc.id, e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary min-h-64"
                />
              ) : (
                <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                  {doc.descripcion}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
} 