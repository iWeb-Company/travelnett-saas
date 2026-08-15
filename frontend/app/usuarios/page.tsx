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

interface UserInternal {
  id: string;
  iweb_client_id: string;
  name?: string;
  last_name?: string;
  username: string;
  dni?: number;
  birthday?: string;
  phone?: number;
  active: boolean;
  rol?: string;
}

interface Permission {
  id: string;
  iweb_client_id: string;
  name?: string;
  salidas?: boolean;
  paquetes?: boolean;
  administracion?: boolean;
  parametros?: boolean;
  web?: boolean;
  permisos_users?: boolean;
}

const emptyUser = {
  name: '',
  last_name: '',
  username: '',
  password: '',
  dni: '',
  birthday: '',
  phone: '',
  rol: 'admin',
};

const emptyPermission = {
  name: '',
  salidas: false,
  paquetes: false,
  administracion: false,
  parametros: false,
  web: false,
  permisos_users: false,
};

export default function UsuariosPage() {
  const r = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'permisos'>('usuarios');

  // Users state
  const [users, setUsers] = useState<UserInternal[]>([]);
  const [modalOpenAddUser, setModalOpenAddUser] = useState(false);
  const [modalOpenEditUser, setModalOpenEditUser] = useState(false);
  const [userData, setUserData] = useState({ ...emptyUser });
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modalOpenAddPerm, setModalOpenAddPerm] = useState(false);
  const [modalOpenEditPerm, setModalOpenEditPerm] = useState(false);
  const [permData, setPermData] = useState<typeof emptyPermission & { id?: string }>({ ...emptyPermission });

  const fetchUsers = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const data = await apiClient.getUsers(user.iweb_client_id);
      setUsers(data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const data = await apiClient.getPermissions(user.iweb_client_id);
      setPermissions(data);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar permisos');
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      fetchUsers();
      fetchPermissions();
    }
  }, [user?.iweb_client_id]);

  // ---- USER HANDLERS ----

  const handleCreateUser = async () => {
    if (!user?.iweb_client_id) return;
    const payload = {
      name: userData.name,
      last_name: userData.last_name,
      username: userData.username,
      password: userData.password,
      dni: userData.dni ? Number(userData.dni) : null,
      birthday: userData.birthday || null,
      phone: userData.phone ? Number(userData.phone) : null,
      active: true,
      rol: userData.rol || 'admin',
    };
    try {
      await apiClient.createUser(user.iweb_client_id, payload);
      toast.success('Usuario creado correctamente');
      setModalOpenAddUser(false);
      setUserData({ ...emptyUser });
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || 'Error al crear usuario');
    }
  };

  const handleEditUser = async () => {
    if (!user?.iweb_client_id || !editUserId) return;
    const payload: any = {
      name: userData.name,
      last_name: userData.last_name,
      username: userData.username,
      dni: userData.dni ? Number(userData.dni) : null,
      birthday: userData.birthday || null,
      phone: userData.phone ? Number(userData.phone) : null,
      rol: userData.rol || 'admin',
    };
    if (userData.password) {
      payload.password = userData.password;
    }
    try {
      await apiClient.updateUser(user.iweb_client_id, editUserId, payload);
      toast.success('Usuario actualizado correctamente');
      setModalOpenEditUser(false);
      setEditUserId(null);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || 'Error al actualizar usuario');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!user?.iweb_client_id) return;
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) return;
    try {
      await apiClient.deleteUser(user.iweb_client_id, userId);
      toast.success('Usuario eliminado correctamente');
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar usuario');
    }
  };

  const handleToggleStatus = async (u: UserInternal) => {
    if (!user?.iweb_client_id) return;
    const newStatus = !u.active;
    try {
      await apiClient.toggleUserStatus(user.iweb_client_id, u.id, newStatus);
      toast.success(`Usuario ${newStatus ? 'activado' : 'desactivado'}`);
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error('Error al cambiar estado del usuario');
    }
  };

  const getMatchingRolValue = (currentRol: string) => {
    if (!currentRol || currentRol.toLowerCase() === 'admin') return 'admin';
    const norm = currentRol.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("adminstr", "administr");
    const matched = permissions.find((p) => {
      const pNorm = (p.name || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace("adminstr", "administr");
      return pNorm === norm || p.id === currentRol;
    });
    return matched ? (matched.name || 'admin') : currentRol;
  };

  const openEditUser = (u: UserInternal) => {
    setEditUserId(u.id);
    setUserData({
      name: u.name || '',
      last_name: u.last_name || '',
      username: u.username,
      password: '',
      dni: u.dni ? String(u.dni) : '',
      birthday: u.birthday || '',
      phone: u.phone ? String(u.phone) : '',
      rol: u.rol || 'admin',
    });
    setModalOpenEditUser(true);
  };

  // ---- PERMISSION HANDLERS ----

  const handleCreatePermission = async () => {
    if (!user?.iweb_client_id) return;
    try {
      await apiClient.createPermission(user.iweb_client_id, permData);
      toast.success('Permiso creado correctamente');
      setModalOpenAddPerm(false);
      setPermData({ ...emptyPermission });
      fetchPermissions();
    } catch (error) {
      console.error(error);
      toast.error('Error al crear permiso');
    }
  };

  const handleEditPermission = async () => {
    if (!user?.iweb_client_id || !permData.id) return;
    try {
      await apiClient.updatePermission(user.iweb_client_id, permData);
      toast.success('Permiso actualizado correctamente');
      setModalOpenEditPerm(false);
      fetchPermissions();
    } catch (error) {
      console.error(error);
      toast.error('Error al actualizar permiso');
    }
  };

  const handleDeletePermission = async (permId: string) => {
    if (!user?.iweb_client_id) return;
    if (!window.confirm('¿Está seguro de eliminar este permiso?')) return;
    try {
      await apiClient.deletePermission(user.iweb_client_id, permId);
      toast.success('Permiso eliminado correctamente');
      fetchPermissions();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar permiso');
    }
  };

  const openEditPermission = (p: Permission) => {
    setPermData({
      id: p.id,
      name: p.name || '',
      salidas: p.salidas || false,
      paquetes: p.paquetes || false,
      administracion: p.administracion || false,
      parametros: p.parametros || false,
      web: p.web || false,
      permisos_users: p.permisos_users || false,
    });
    setModalOpenEditPerm(true);
  };

  const permFields: { key: keyof typeof emptyPermission; label: string }[] = [
    { key: 'salidas', label: 'Salidas' },
    { key: 'paquetes', label: 'Paquetes' },
    { key: 'administracion', label: 'Administración' },
    { key: 'parametros', label: 'Parámetros' },
    { key: 'web', label: 'Web' },
    { key: 'permisos_users', label: 'Usuarios y Permisos' },
  ];

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

      {/* Tab switcher */}
      <div className="flex justify-center items-center gap-4 my-5 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('usuarios')}
          className={`pb-2 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'usuarios'
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500'
            }`}
        >
          USUARIOS
        </button>
        <button
          onClick={() => setActiveTab('permisos')}
          className={`pb-2 font-semibold text-sm border-b-2 transition-colors ${activeTab === 'permisos'
            ? 'border-primary text-primary'
            : 'border-transparent text-gray-500'
            }`}
        >
          PERMISOS
        </button>
      </div>

      {activeTab === 'usuarios' && (
        <>
          <div className="flex justify-center mb-6">
            <button
              onClick={() => {
                setUserData({ ...emptyUser });
                setModalOpenAddUser(true);
              }}
              className="flex items-center gap-2 text-primary font-medium rounded-lg"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M7.12127 4.3474C9.6995 4.06194 12.3014 4.06194 14.8796 4.3474C16.3071 4.5074 17.4588 5.63156 17.6263 7.06406C17.9318 9.67906 17.9318 12.3207 17.6263 14.9357C17.4588 16.3682 16.3071 17.4924 14.8796 17.6524C12.3014 17.9379 9.6995 17.9379 7.12127 17.6524C5.69377 17.4924 4.5421 16.3682 4.3746 14.9357C4.06914 12.321 4.06914 9.67962 4.3746 7.0649C4.45932 6.36896 4.77658 5.72202 5.27496 5.22893C5.77334 4.73585 6.42363 4.42552 7.12043 4.34823M11.0004 6.83906C11.1662 6.83906 11.3252 6.90491 11.4424 7.02212C11.5596 7.13933 11.6254 7.2983 11.6254 7.46406V10.3749H14.5363C14.702 10.3749 14.861 10.4407 14.9782 10.558C15.0954 10.6752 15.1613 10.8341 15.1613 10.9999C15.1613 11.1657 15.0954 11.3246 14.9782 11.4418C14.861 11.559 14.702 11.6249 14.5363 11.6249H11.6254V14.5357C11.6254 14.7015 11.5596 14.8605 11.4424 14.9777C11.3252 15.0949 11.1662 15.1607 11.0004 15.1607C10.8347 15.1607 10.6757 15.0949 10.5585 14.9777C10.4413 14.8605 10.3754 14.7015 10.3754 14.5357V11.6249H7.4646C7.29884 11.6249 7.13987 11.559 7.02266 11.4418C6.90545 11.3246 6.8396 11.1657 6.8396 10.9999C6.8396 10.8341 6.90545 10.6752 7.02266 10.558C7.13987 10.4407 7.29884 10.3749 7.4646 10.3749H10.3754V7.46406C10.3754 7.2983 10.4413 7.13933 10.5585 7.02212C10.6757 6.90491 10.8347 6.83906 11.0004 6.83906Z" fill="#0546F7" />
              </svg>
              Agregar
            </button>
          </div>
          <div className="w-full max-w-2xl mx-auto mb-4 flex justify-between gap-3">
            <select name="" id="" className="w-1/2 border border-gray-300 rounded-lg p-2">
              <option value="">Estado: Todos</option>
              <option value="">Activos</option>
              <option value="">Inactivos</option>
            </select>
            <input placeholder='Buscar' type="text" className="border border-gray-300 text-gray-200 rounded-lg p-2 w-1/2  " />
          </div>
          <div className="w-full max-w-2xl mx-auto">
            <ul className="border border-gray-300 rounded-lg overflow-hidden divide-y divide-gray-200 bg-white">
              {users.length === 0 ? (
                <li className="py-8 text-center text-gray-500 text-sm">No hay usuarios registrados</li>
              ) : (
                users.map((u) => (
                  <li key={u.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{u.name} {u.last_name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 capitalize">
                          {u.rol || 'admin'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">@{u.username}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Toggle activo */}
                      <button
                        onClick={() => handleToggleStatus(u)}
                        title={u.active ? 'Desactivar' : 'Activar'}
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${u.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                          }`}
                      >
                        {u.active ? 'Activo' : 'Inactivo'}
                      </button>
                      {/* Editar */}
                      <button onClick={() => openEditUser(u)} title="Editar" className="text-gray-600 hover:text-primary">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.6821 0.655196C9.10147 0.23574 9.67029 5.8616e-05 10.2634 1.09323e-08C10.8566 -5.85942e-05 11.4255 0.23551 11.8449 0.654884C12.2644 1.07426 12.5 1.64308 12.5001 2.23622C12.5002 2.82937 12.2646 3.39824 11.8452 3.8177L11.2877 4.37582L8.12522 1.2127L8.6821 0.655196ZM7.46272 1.87582L1.21272 8.1252C0.958684 8.37897 0.780167 8.69836 0.697097 9.0477L0.0127222 11.9239C-0.00580801 12.0019 -0.00407066 12.0832 0.0177686 12.1602C0.039608 12.2373 0.0808211 12.3075 0.137477 12.3641C0.194133 12.4206 0.264344 12.4618 0.341412 12.4835C0.41848 12.5053 0.499837 12.5069 0.577722 12.4883L3.45335 11.8033C3.80291 11.7204 4.12252 11.5418 4.37647 11.2877L10.6252 5.03832L7.46272 1.87582Z" fill="black" />
                        </svg>
                      </button>
                      {/* Eliminar */}
                      <button onClick={() => handleDeleteUser(u.id)} title="Eliminar" className="text-gray-600 hover:text-red-500">
                        <svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.75 0.625H6.5625L5.9375 0H2.8125L2.1875 0.625H0V1.875H8.75M0.625 10C0.625 10.3315 0.756696 10.6495 0.991117 10.8839C1.22554 11.1183 1.54348 11.25 1.875 11.25H6.875C7.20652 11.25 7.52446 11.1183 7.75888 10.8839C7.9933 10.6495 8.125 10.3315 8.125 10V2.5H0.625V10Z" fill="black" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}

      {activeTab === 'permisos' && (
        <>
          <div className="flex justify-center mb-6">
            <button
              onClick={() => {
                setPermData({ ...emptyPermission });
                setModalOpenAddPerm(true);
              }}
              className="flex items-center gap-2 text-primary font-medium px-4 py-2 rounded-lg"
            >
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M7.12127 4.3474C9.6995 4.06194 12.3014 4.06194 14.8796 4.3474C16.3071 4.5074 17.4588 5.63156 17.6263 7.06406C17.9318 9.67906 17.9318 12.3207 17.6263 14.9357C17.4588 16.3682 16.3071 17.4924 14.8796 17.6524C12.3014 17.9379 9.6995 17.9379 7.12127 17.6524C5.69377 17.4924 4.5421 16.3682 4.3746 14.9357C4.06914 12.321 4.06914 9.67962 4.3746 7.0649C4.45932 6.36896 4.77658 5.72202 5.27496 5.22893C5.77334 4.73585 6.42363 4.42552 7.12043 4.34823M11.0004 6.83906C11.1662 6.83906 11.3252 6.90491 11.4424 7.02212C11.5596 7.13933 11.6254 7.2983 11.6254 7.46406V10.3749H14.5363C14.702 10.3749 14.861 10.4407 14.9782 10.558C15.0954 10.6752 15.1613 10.8341 15.1613 10.9999C15.1613 11.1657 15.0954 11.3246 14.9782 11.4418C14.861 11.559 14.702 11.6249 14.5363 11.6249H11.6254V14.5357C11.6254 14.7015 11.5596 14.8605 11.4424 14.9777C11.3252 15.0949 11.1662 15.1607 11.0004 15.1607C10.8347 15.1607 10.6757 15.0949 10.5585 14.9777C10.4413 14.8605 10.3754 14.7015 10.3754 14.5357V11.6249H7.4646C7.29884 11.6249 7.13987 11.559 7.02266 11.4418C6.90545 11.3246 6.8396 11.1657 6.8396 10.9999C6.8396 10.8341 6.90545 10.6752 7.02266 10.558C7.13987 10.4407 7.29884 10.3749 7.4646 10.3749H10.3754V7.46406C10.3754 7.2983 10.4413 7.13933 10.5585 7.02212C10.6757 6.90491 10.8347 6.83906 11.0004 6.83906Z" fill="#0546F7" />
              </svg>
              Agregar Permiso
            </button>
          </div>

          <div className="w-full max-w-2xl mx-auto">
            <ul className="border border-gray-300 rounded-lg overflow-hidden divide-y divide-gray-200 bg-white">
              {permissions.length === 0 ? (
                <li className="py-8 text-center text-gray-500 text-sm">No hay permisos registrados</li>
              ) : (
                permissions.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800">{p.name || 'Sin nombre'}</span>
                      <span className="text-xs text-gray-400">
                        {[
                          p.salidas && 'Salidas',
                          p.paquetes && 'Paquetes',
                          p.administracion && 'Admin',
                          p.parametros && 'Parámetros',
                          p.web && 'Web',
                          p.permisos_users && 'Usuarios',
                        ].filter(Boolean).join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => openEditPermission(p)} title="Editar" className="text-gray-600 hover:text-primary">
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.6821 0.655196C9.10147 0.23574 9.67029 5.8616e-05 10.2634 1.09323e-08C10.8566 -5.85942e-05 11.4255 0.23551 11.8449 0.654884C12.2644 1.07426 12.5 1.64308 12.5001 2.23622C12.5002 2.82937 12.2646 3.39824 11.8452 3.8177L11.2877 4.37582L8.12522 1.2127L8.6821 0.655196ZM7.46272 1.87582L1.21272 8.1252C0.958684 8.37897 0.780167 8.69836 0.697097 9.0477L0.0127222 11.9239C-0.00580801 12.0019 -0.00407066 12.0832 0.0177686 12.1602C0.039608 12.2373 0.0808211 12.3075 0.137477 12.3641C0.194133 12.4206 0.264344 12.4618 0.341412 12.4835C0.41848 12.5053 0.499837 12.5069 0.577722 12.4883L3.45335 11.8033C3.80291 11.7204 4.12252 11.5418 4.37647 11.2877L10.6252 5.03832L7.46272 1.87582Z" fill="black" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeletePermission(p.id)} title="Eliminar" className="text-gray-600 hover:text-red-500">
                        <svg width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.75 0.625H6.5625L5.9375 0H2.8125L2.1875 0.625H0V1.875H8.75M0.625 10C0.625 10.3315 0.756696 10.6495 0.991117 10.8839C1.22554 11.1183 1.54348 11.25 1.875 11.25H6.875C7.20652 11.25 7.52446 11.1183 7.75888 10.8839C7.9933 10.6495 8.125 10.3315 8.125 10V2.5H0.625V10Z" fill="black" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}

      {/* Modal: Add User */}
      {modalOpenAddUser && (
        <ModalLayout
          onSubmit={handleCreateUser}
          setModalOpen={() => setModalOpenAddUser(false)}
          title="Agregar Usuario"
          svg={<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#F1F1F1" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="7" r="4" stroke="#F1F1F1" strokeWidth="2" /></svg>}
        >
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Nombre" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" required />
            <input type="text" placeholder="Apellido" value={userData.last_name} onChange={e => setUserData({ ...userData, last_name: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" required />
            <input type="text" placeholder="Usuario" value={userData.username} onChange={e => setUserData({ ...userData, username: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" required />
            <input type="password" placeholder="Contraseña" value={userData.password} onChange={e => setUserData({ ...userData, password: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" required />
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-white/90">Rol / Permiso</label>
              <select
                value={getMatchingRolValue(userData.rol)}
                onChange={e => setUserData({ ...userData, rol: e.target.value })}
                className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none capitalize"
              >
                <option value="admin">admin (Acceso Total)</option>
                {permissions.map((p) => (
                  <option key={p.id} value={p.name || 'sin_nombre'}>
                    {p.name || 'Sin Nombre'}
                  </option>
                ))}
              </select>
            </div>

            <input type="text" placeholder="DNI" value={userData.dni} onChange={e => setUserData({ ...userData, dni: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" />
            <input type="text" placeholder="Teléfono" value={userData.phone} onChange={e => setUserData({ ...userData, phone: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" />
            <input type="date" placeholder="Fecha de Nacimiento" value={userData.birthday} onChange={e => setUserData({ ...userData, birthday: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" />
          </div>
        </ModalLayout>
      )}

      {/* Modal: Edit User */}
      {modalOpenEditUser && (
        <ModalLayout
          onSubmit={handleEditUser}
          setModalOpen={() => setModalOpenEditUser(false)}
          title="Editar Usuario"
          svg={<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="#F1F1F1" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="7" r="4" stroke="#F1F1F1" strokeWidth="2" /></svg>}
        >
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Nombre" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" required />
            <input type="text" placeholder="Apellido" value={userData.last_name} onChange={e => setUserData({ ...userData, last_name: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" required />
            <input type="text" placeholder="Usuario" value={userData.username} onChange={e => setUserData({ ...userData, username: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" required />
            <input type="password" placeholder="Nueva contraseña (dejar vacío para mantener)" value={userData.password} onChange={e => setUserData({ ...userData, password: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" />
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-white/90">Rol / Permiso</label>
              <select
                value={getMatchingRolValue(userData.rol)}
                onChange={e => setUserData({ ...userData, rol: e.target.value })}
                className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none capitalize"
              >
                <option value="admin">admin (Acceso Total)</option>
                {permissions.map((p) => (
                  <option key={p.id} value={p.name || 'sin_nombre'}>
                    {p.name || 'Sin Nombre'}
                  </option>
                ))}
              </select>
            </div>

            <input type="text" placeholder="DNI" value={userData.dni} onChange={e => setUserData({ ...userData, dni: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" />
            <input type="text" placeholder="Teléfono" value={userData.phone} onChange={e => setUserData({ ...userData, phone: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" />
            <input type="date" placeholder="Fecha de Nacimiento" value={userData.birthday} onChange={e => setUserData({ ...userData, birthday: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none" />
          </div>
        </ModalLayout>
      )}

      {/* Modal: Add Permission */}
      {modalOpenAddPerm && (
        <ModalLayout
          onSubmit={handleCreatePermission}
          setModalOpen={() => setModalOpenAddPerm(false)}
          title="Agregar Permiso"
          svg={<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#F1F1F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        >
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Nombre del rol" value={permData.name} onChange={e => setPermData({ ...permData, name: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none mb-3" required />
            {permFields.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm font-semibold text-white/90 cursor-pointer">
                <input type="checkbox" checked={!!(permData as any)[key]} onChange={e => setPermData({ ...permData, [key]: e.target.checked })} className="w-4 h-4 accent-primary" />
                {label}
              </label>
            ))}
          </div>
        </ModalLayout>
      )}

      {/* Modal: Edit Permission */}
      {modalOpenEditPerm && (
        <ModalLayout
          onSubmit={handleEditPermission}
          setModalOpen={() => setModalOpenEditPerm(false)}
          title="Editar Permiso"
          svg={<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="#F1F1F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        >
          <div className="flex flex-col gap-3">
            <input type="text" placeholder="Nombre del rol" value={permData.name} onChange={e => setPermData({ ...permData, name: e.target.value })} className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none mb-3" required />
            {permFields.map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 text-sm font-semibold text-white/90 cursor-pointer">
                <input type="checkbox" checked={!!(permData as any)[key]} onChange={e => setPermData({ ...permData, [key]: e.target.checked })} className="w-4 h-4 accent-primary" />
                {label}
              </label>
            ))}
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}
