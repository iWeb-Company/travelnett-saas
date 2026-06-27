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

interface NewsItem {
  id: string;
  iweb_client_id: string;
  url?: string;
}

export default function NovedadesPage() {
  const r = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchNews = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const data = await apiClient.getNews(user.iweb_client_id);
      setNews(data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar novedades');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      fetchNews();
    }
  }, [user?.iweb_client_id]);

  const handleCreate = async () => {
    if (!user?.iweb_client_id) return;
    if (!file) {
      toast.error('Por favor, selecciona un archivo');
      return;
    }
    const formData = new FormData();
    formData.append('url', file);

    try {
      await apiClient.createNews(user.iweb_client_id, formData);
      toast.success('Archivo subido correctamente');
      setModalOpenAdd(false);
      setFile(null);
      fetchNews();
    } catch (error) {
      console.error(error);
      toast.error('Error al subir archivo');
    }
  };

  const handleEdit = async () => {
    if (!user?.iweb_client_id || !editId) return;
    if (!file) {
      toast.error('Por favor, selecciona un archivo');
      return;
    }
    const formData = new FormData();
    formData.append('id', editId);
    formData.append('url', file);

    try {
      await apiClient.updateNews(user.iweb_client_id, formData);
      toast.success('Archivo actualizado correctamente');
      setModalOpenEdit(false);
      setEditId(null);
      setFile(null);
      fetchNews();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar archivo');
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.iweb_client_id) return;
    if (!window.confirm('¿Está seguro de eliminar esta novedad?')) return;
    try {
      await apiClient.deleteNews(user.iweb_client_id, id);
      toast.success('Archivo eliminado correctamente');
      fetchNews();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar archivo');
    }
  };

  const openEdit = (n: NewsItem) => {
    setEditId(n.id);
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

  const currentNews = news[0];

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

      <h1 className="text-center text-black font-medium text-md md:text-xl my-10">
        La imagen o video que se subirá en este apartado se verá como bienvenida
        a la página. No se permite más de un archivo.
      </h1>

      <div className="flex flex-col items-center gap-6 my-10 max-w-xl mx-auto">
        {currentNews ? (
          <div className="w-full bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-4 flex flex-col items-center gap-4">
            {currentNews.url ? (
              <img src={currentNews.url} alt="Novedades Imagen" className="w-full rounded-xl object-contain max-h-96" />
            ) : (
              <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-gray-400 rounded-xl">
                Sin archivo
              </div>
            )}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => openEdit(currentNews)}
                className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
              >
                Reemplazar Archivo
              </button>
              <button
                onClick={() => handleDelete(currentNews.id)}
                className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-600 text-sm font-semibold rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <p className="text-gray-500">No hay ninguna imagen de bienvenida cargada.</p>
            <button
              onClick={() => {
                setFile(null);
                setModalOpenAdd(true);
              }}
              className="flex items-center gap-2 bg-primary text-white font-medium px-4 py-2 rounded-lg"
            >
              Cargar Imagen/Video
            </button>
          </div>
        )}
      </div>

      {modalOpenAdd && (
        <ModalLayout
          onSubmit={handleCreate}
          setModalOpen={() => setModalOpenAdd(false)}
          title="Subir Novedad"
          svg={<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#F1F1F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        >
          <div className="flex flex-col gap-3">
            <input
              type="file"
              accept="image/*,video/*"
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
          title="Reemplazar Novedad"
          svg={<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#F1F1F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        >
          <div className="flex flex-col gap-3">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full text-white/90 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark cursor-pointer"
              required
            />
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}