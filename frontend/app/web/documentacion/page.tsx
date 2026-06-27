"use client";

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Loader } from "@/app/components/Loader";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import ModalLayout from "@/app/components/ModalLayout";

type Documentacion = {
  id: string;
  titulo: string;
  descripcion: string;
};

const defaultDocs: Documentacion[] = [
  {
    id: "1",
    titulo: "Documentación para menores",
    descripcion: `Se les recuerda a los sres. pasajeros que todos, independientemente que crucen o no a países limítrofes, deberán llevar el documento actualizado y en buen estado de conservación ya que los mismos pueden ser requeridos por la autoridad competente en cualquier momento del viaje.
menores de 18 años que viajan con:
padre y madre: documento del menor o partida de nacimiento + documento de ambos mayores (todo original)
padre o madre: documento del menor o partida de nacimiento + documento del mayor + autorizacion de ministerio de transporte firmada por el padre que no viaja (todo original)
padre o madre viudo/a: documento del menor o partida de nacimiento + documento del mayor + certificado de defuncion (todo original)
terceros (abuelos, tios,primos, conocidos): documento del menor o partida de nacimiento…`,
  },
  {
    id: "2",
    titulo: "Documentación para salir del país",
    descripcion: `Se les recuerda a los sres pasajeros que todos, independientemente que crucen o no a países limítrofes, deberán llevar el documento actualizado y en buen estado de conservación ya que los mismos pueden ser requeridos por la autoridad competente en cualquier momento del viaje.

si usted es: Argentino/a Extranjero/a con residencia permanente en argentina Y tiene destino a: Uruguay Brasil Chile Debe contar con esta documentación:
Cédula de identidad o documento nacional de identidad + pasaporte válido de origen y visa (si corresponde según nacionalidad de origen) dni, cédula o pasaporte vigente.
menores de 18 años que viajan con:
padre y madre: documento del menor + libreta de matrimonio o partida de nacimiento (todo original)
padre o madre: documento del menor + libreta de matrimonio o partida de nacimiento…`,
  },
];

export default function DocumentacionPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<Documentacion[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Local storage key scoped to current client ID
  const getStorageKey = () => `travelnett_doc_${user?.iweb_client_id || "global"}`;

  useEffect(() => {
    if (user?.iweb_client_id) {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          setDocs(JSON.parse(stored));
        } catch {
          setDocs(defaultDocs);
        }
      } else {
        setDocs(defaultDocs);
        localStorage.setItem(key, JSON.stringify(defaultDocs));
      }
      setLoading(false);
    }
  }, [user?.iweb_client_id]);

  const saveToStorage = (updatedDocs: Documentacion[]) => {
    setDocs(updatedDocs);
    localStorage.setItem(getStorageKey(), JSON.stringify(updatedDocs));
  };

  const handleCreate = () => {
    if (!newTitle.trim() || !newDesc.trim()) {
      toast.error("Por favor complete todos los campos.");
      return;
    }
    const newDoc: Documentacion = {
      id: Date.now().toString(),
      titulo: newTitle,
      descripcion: newDesc,
    };
    const updated = [...docs, newDoc];
    saveToStorage(updated);
    setShowAddModal(false);
    setNewTitle("");
    setNewDesc("");
    toast.success("Documento agregado con éxito");
  };

  const handleUpdate = (id: string) => {
    if (!editDesc.trim()) {
      toast.error("La descripción no puede estar vacía.");
      return;
    }
    const updated = docs.map((d) => (d.id === id ? { ...d, descripcion: editDesc } : d));
    saveToStorage(updated);
    setEditingId(null);
    setEditDesc("");
    toast.success("Modificación documentación éxito");
  };

  const handleDelete = (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este documento?")) return;
    const updated = docs.filter((d) => d.id !== id);
    saveToStorage(updated);
    toast.success("Documento eliminado correctamente");
  };

  const startEditing = (doc: Documentacion) => {
    setEditingId(doc.id);
    setEditDesc(doc.descripcion);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <Container>
      <ToggleSalidas />
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={() => router.push("/web")}
        className="flex items-center my-3 justify-start gap-3"
      >
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>

      <section className="flex justify-center max-w-4xl flex-col items-center gap-10 mx-auto text-black">
        <div className="flex justify-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="border-2 flex items-center gap-2 border-primary rounded-lg font-semibold px-10 py-2 hover:bg-blue-50 transition-colors"
          >
            <svg
              width="29"
              height="29"
              viewBox="0 0 29 29"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8.8754 4.8539C12.6138 4.43998 16.3865 4.43998 20.125 4.8539C22.1949 5.0859 23.8648 6.71594 24.1076 8.79306C24.5506 12.5848 24.5506 16.4152 24.1076 20.207C23.8648 22.2841 22.1949 23.9141 20.125 24.1461C16.3865 24.5601 12.6138 24.5601 8.8754 24.1461C6.80552 23.9141 5.1356 22.2841 4.89273 20.207C4.44982 16.4156 4.44982 12.5856 4.89273 8.79427C5.01558 7.78516 5.4756 6.8471 6.19825 6.13213C6.9209 5.41715 7.86382 4.96717 8.87419 4.8551M14.5002 8.46681C14.7405 8.46681 14.971 8.56229 15.141 8.73225C15.311 8.9022 15.4064 9.13271 15.4064 9.37306V13.5938H19.6271C19.8675 13.5938 20.098 13.6892 20.268 13.8592C20.4379 14.0292 20.5334 14.2597 20.5334 14.5C20.5334 14.7404 20.4379 14.9709 20.268 15.1408C20.098 15.3108 19.8675 15.4063 19.6271 15.4063H15.4064V19.627C15.4064 19.8673 15.311 20.0978 15.141 20.2678C14.971 20.4377 14.7405 20.5332 14.5002 20.5332C14.2598 20.5332 14.0293 20.4377 13.8594 20.2678C13.6894 20.0978 13.5939 19.8673 13.5939 19.627V15.4063H9.37323C9.13288 15.4063 8.90237 15.3108 8.73241 15.1408C8.56246 14.9709 8.46698 14.7404 8.46698 14.5C8.46698 14.2597 8.56246 14.0292 8.73241 13.8592C8.90237 13.6892 9.13288 13.5938 9.37323 13.5938H13.5939V9.37306C13.5939 9.13271 13.6894 8.9022 13.8594 8.73225C14.0293 8.56229 14.2598 8.46681 14.5002 8.46681Z"
                fill="#0546F7"
              />
            </svg>
            <p>Agregar Documentación</p>
          </button>
        </div>

        {/* Documentaciones List */}
        <div className="w-full space-y-6">
          {docs.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No hay registros de documentación creados.</p>
          ) : (
            docs.map((doc) => (
              <div
                key={doc.id}
                className="border border-gray-300 rounded-lg p-6 bg-white shadow-sm flex flex-col gap-4"
              >
                <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                  <h3 className="text-black font-bold text-lg">{doc.titulo}</h3>
                  <div className="flex gap-2">
                    {editingId === doc.id ? (
                      <>
                        <button
                          onClick={() => handleUpdate(doc.id)}
                          className="bg-green-600 text-white font-semibold px-4 py-1.5 rounded-md hover:bg-green-700 text-xs"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="bg-gray-200 text-gray-700 font-semibold px-4 py-1.5 rounded-md hover:bg-gray-300 text-xs"
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditing(doc)}
                          className="bg-primary text-white font-semibold px-4 py-1.5 rounded-md hover:bg-blue-700 text-xs"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="bg-red-500 text-white font-semibold px-4 py-1.5 rounded-md hover:bg-red-600 text-xs"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingId === doc.id ? (
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-4 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary min-h-[200px]"
                  />
                ) : (
                  <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                    {doc.descripcion}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* Add Documentación Modal */}
      {showAddModal && (
        <ModalLayout
          title="Agregar Documentación"
          setModalOpen={() => setShowAddModal(false)}
          onSubmit={handleCreate}
        >
          <div className="flex flex-col gap-4 text-black">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Título / Sección *</label>
              <input
                type="text"
                required
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                placeholder="Ej. Documentación para menores"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-bold text-gray-700">Contenido / Descripción *</label>
              <textarea
                required
                rows={8}
                className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                placeholder="Escriba los requisitos de documentación aquí..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}
 