'use client';

import Container from '@/app/components/Container';
import ArrowLeft from '@/app/components/icons/ArrowLeft';
import { Loader } from '@/app/components/Loader';
import ModalLayout from '@/app/components/ModalLayout';
import ToggleSalidas from '@/app/components/ToggleSalidas';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface Flyer {
  id: string;
  iweb_client_id: string;
  name?: string;
  url?: string;
}

export default function CarteleraPage() {
  const r = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchFlyers = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const data = await apiClient.getFlyers(user.iweb_client_id);
      setFlyers(data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar la cartelera');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      fetchFlyers();
    }
  }, [user?.iweb_client_id]);

  const handleCreate = async () => {
    if (!user?.iweb_client_id) return;
    if (!file) {
      toast.error('Por favor, selecciona una imagen');
      return;
    }
    const formData = new FormData();
    formData.append('name', name);
    formData.append('url', file);

    try {
      await apiClient.createFlyer(user.iweb_client_id, formData);
      toast.success('Flyer agregado correctamente');
      setModalOpenAdd(false);
      setName('');
      setFile(null);
      fetchFlyers();
    } catch (error) {
      console.error(error);
      toast.error('Error al agregar flyer');
    }
  };

  const handleEdit = async () => {
    if (!user?.iweb_client_id || !editId) return;
    const formData = new FormData();
    formData.append('id', editId);
    if (name) formData.append('name', name);
    if (file) formData.append('url', file);

    try {
      await apiClient.updateFlyer(user.iweb_client_id, formData);
      toast.success('Flyer actualizado correctamente');
      setModalOpenEdit(false);
      setEditId(null);
      setName('');
      setFile(null);
      fetchFlyers();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar flyer');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.iweb_client_id) return;
    if (!window.confirm('¿Está seguro de eliminar este flyer?')) return;
    try {
      await apiClient.deleteFlyer(user.iweb_client_id, id);
      toast.success('Flyer eliminado correctamente');
      fetchFlyers();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar flyer');
    }
  };

  const openEdit = (f: Flyer) => {
    setEditId(f.id);
    setName(f.name || '');
    setFile(null);
    setModalOpenEdit(true);
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
        onClick={() => r.push('/web')}
        className="flex items-center my-3 justify-start gap-3"
      >
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>

      <div className="flex justify-center mb-6">
        <button
          onClick={() => {
            setName('');
            setFile(null);
            setModalOpenAdd(true);
          }}
          className="flex items-center gap-2 text-primary font-medium px-4 py-2 rounded-lg"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" clipRule="evenodd" d="M7.12127 4.3474C9.6995 4.06194 12.3014 4.06194 14.8796 4.3474C16.3071 4.5074 17.4588 5.63156 17.6263 7.06406C17.9318 9.67906 17.9318 12.3207 17.6263 14.9357C17.4588 16.3682 16.3071 17.4924 14.8796 17.6524C12.3014 17.9379 9.6995 17.9379 7.12127 17.6524C5.69377 17.4924 4.5421 16.3682 4.3746 14.9357C4.06914 12.321 4.06914 9.67962 4.3746 7.0649C4.45932 6.36896 4.77658 5.72202 5.27496 5.22893C5.77334 4.73585 6.42363 4.42552 7.12043 4.34823M11.0004 6.83906C11.1662 6.83906 11.3252 6.90491 11.4424 7.02212C11.5596 7.13933 11.6254 7.2983 11.6254 7.46406V10.3749H14.5363C14.702 10.3749 14.861 10.4407 14.9782 10.558C15.0954 10.6752 15.1613 10.8341 15.1613 10.9999C15.1613 11.1657 15.0954 11.3246 14.9782 11.4418C14.861 11.559 14.702 11.6249 14.5363 11.6249H11.6254V14.5357C11.6254 14.7015 11.5596 14.8605 11.4424 14.9777C11.3252 15.0949 11.1662 15.1607 11.0004 15.1607C10.8347 15.1607 10.6757 15.0949 10.5585 14.9777C10.4413 14.8605 10.3754 14.7015 10.3754 14.5357V11.6249H7.4646C7.29884 11.6249 7.13987 11.559 7.02266 11.4418C6.90545 11.3246 6.8396 11.1657 6.8396 10.9999C6.8396 10.8341 6.90545 10.6752 7.02266 10.558C7.13987 10.4407 7.29884 10.3749 7.4646 10.3749H10.3754V7.46406C10.3754 7.2983 10.4413 7.13933 10.5585 7.02212C10.6757 6.90491 10.8347 6.83906 11.0004 6.83906Z" fill="#0546F7" />
          </svg>
          Agregar Flyer
        </button>
      </div>

      <div className="w-full max-w-4xl mx-auto my-10">
        {flyers.length === 0 ? (
          <p className="text-center text-gray-500">No hay flyers en la cartelera</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {flyers.map((f) => (
              <div key={f.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
                {f.url ? (
                  <img src={f.url} alt={f.name || 'Flyer'} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400">
                    Sin imagen
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                  <h3 className="font-semibold text-gray-800 text-lg">{f.name || 'Sin título'}</h3>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => openEdit(f)}
                      className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(f.id)}
                      className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-lg transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpenAdd && (
        <ModalLayout
          onSubmit={handleCreate}
          setModalOpen={() => setModalOpenAdd(false)}
          title="Agregar Flyer"
          svg={<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#F1F1F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        >
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nombre del Flyer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-white/90 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
              required
            />
          </div>
        </ModalLayout>
      )}

      {modalOpenEdit && (
        <ModalLayout
          onSubmit={handleEdit}
          setModalOpen={() => setModalOpenEdit(false)}
          title="Editar Flyer"
          svg={<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#F1F1F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        >
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Nombre del Flyer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-white/90 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
            />
            <p className="text-xs text-gray-300">Sube una nueva imagen para reemplazar la actual (opcional).</p>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}
