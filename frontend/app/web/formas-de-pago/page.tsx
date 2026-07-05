'use client';

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";
import ModalLayout from "@/app/components/ModalLayout";

type TarjetaRow = {
  id: number;
  nombre: string;
  cuotas: string;
  recargo: string;
};

type Account = {
  id: string;
  iweb_client_id: string;
  account_title: string;
  titular: string;
  account_number: string;
  cuit_cuil: string;
  cbu_cvu: string;
  alias: string;
  active: boolean;
};

export default function FormasDePagoPage() {
  const r = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cuentas, setCuentas] = useState<Account[]>([]);
  
  // Local card state (no backend persistence)
  const [tarjetas, setTarjetas] = useState<TarjetaRow[]>([
    { id: 1, nombre: "Naranja", cuotas: "1", recargo: "5%" },
    { id: 2, nombre: "Visa", cuotas: "1", recargo: "5%" },
    { id: 3, nombre: "Mastercard", cuotas: "1", recargo: "5%" },
  ]);
  const [showCalculadora, setShowCalculadora] = useState(false);

  // Modal states
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [modalOpenEdit, setModalOpenEdit] = useState(false);
  
  // Account Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [accountTitle, setAccountTitle] = useState("");
  const [titular, setTitular] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cuitCuil, setCuitCuil] = useState("");
  const [cbuCvu, setCbuCvu] = useState("");
  const [alias, setAlias] = useState("");
  const [active, setActive] = useState(true);

  const fetchAccounts = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const data = await apiClient.getAccounts(user.iweb_client_id);
      setCuentas(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar las cuentas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      fetchAccounts();
    }
  }, [user?.iweb_client_id]);

  // ---- LOCAL TARJETA HANDLERS ----
  const addTarjetaLocal = () => {
    const newId = tarjetas.length > 0 ? Math.max(...tarjetas.map(t => t.id)) + 1 : 1;
    setTarjetas([...tarjetas, { id: newId, nombre: "Nueva Tarjeta", cuotas: "1", recargo: "5%" }]);
    toast.success("Fila de tarjeta agregada localmente");
  };

  const updateTarjeta = (id: number, field: keyof TarjetaRow, value: string) =>
    setTarjetas((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );

  const removeTarjeta = (id: number) => {
    setTarjetas((prev) => prev.filter((t) => t.id !== id));
    toast.success("Fila de tarjeta eliminada");
  };

  // ---- DATABASE ACCOUNT HANDLERS ----

  const handleCreateAccount = async () => {
    if (!user?.iweb_client_id) return;

    const formData = new FormData();
    formData.append("account_title", accountTitle);
    formData.append("titular", titular);
    formData.append("account_number", accountNumber);
    formData.append("cuit_cuil", cuitCuil);
    formData.append("cbu_cvu", cbuCvu);
    formData.append("alias", alias);
    formData.append("active", String(active));

    try {
      await apiClient.createAccount(user.iweb_client_id, formData);
      toast.success("Cuenta agregada correctamente");
      setModalOpenAdd(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error(error);
      toast.error("Error al agregar cuenta");
    }
  };

  const handleEditAccount = async () => {
    if (!user?.iweb_client_id || !editId) return;

    const formData = new FormData();
    formData.append("id", editId);
    formData.append("account_title", accountTitle);
    formData.append("titular", titular);
    formData.append("account_number", accountNumber);
    formData.append("cuit_cuil", cuitCuil);
    formData.append("cbu_cvu", cbuCvu);
    formData.append("alias", alias);
    formData.append("active", String(active));

    try {
      await apiClient.updateAccount(user.iweb_client_id, formData);
      toast.success("Cuenta actualizada correctamente");
      setModalOpenEdit(false);
      resetForm();
      fetchAccounts();
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar cuenta");
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!user?.iweb_client_id) return;
    if (!window.confirm("¿Está seguro de eliminar esta cuenta bancaria?")) return;
    try {
      await apiClient.deleteAccount(user.iweb_client_id, id);
      toast.success("Cuenta eliminada correctamente");
      fetchAccounts();
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar cuenta");
    }
  };

  const openEdit = (c: Account) => {
    setEditId(c.id);
    setAccountTitle(c.account_title || "");
    setTitular(c.titular || "");
    setAccountNumber(c.account_number || "");
    setCuitCuil(String(c.cuit_cuil || ""));
    setCbuCvu(String(c.cbu_cvu || ""));
    setAlias(c.alias || "");
    setActive(c.active);
    setModalOpenEdit(true);
  };

  const resetForm = () => {
    setEditId(null);
    setAccountTitle("");
    setTitular("");
    setAccountNumber("");
    setCuitCuil("");
    setCbuCvu("");
    setAlias("");
    setActive(true);
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
        onClick={() => r.push("/web")}
        className="flex items-center my-3 justify-start gap-3"
      >
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>
      
      <section className="max-w-3/4 flex flex-col justify-around mx-auto">
        <div className="flex gap-10 justify-around items-center w-full my-5">
          <button
            onClick={addTarjetaLocal}
            className="border-2 flex items-center gap-2 border-primary rounded-lg font-semibold px-10 py-2 hover:bg-primary/10 transition-colors"
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
            <p>Agregar Tarjeta</p>
          </button>
          <button
            onClick={() => { resetForm(); setModalOpenAdd(true); }}
            className="border-2 flex items-center gap-2 border-primary rounded-lg font-semibold px-10 py-2 hover:bg-primary/10 transition-colors"
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
            <p>Agregar Cuenta</p>
          </button>
        </div>

        <div>
          <h3 className="text-black font-bold text-xl text-center my-5">
            Financiaciones con Tarjeta
          </h3>
          <div className="flex w-full gap-10 justify-between items-center">
            <img
              src="/master.png"
              className="w-30 mx-14"
              alt="MasterCard Image"
            />
            <div className="flex-10 border border-gray-300 rounded-md gap-5 p-5">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] text-center font-semibold text-sm mb-1">
                <span>Tarjeta</span>
                <span>Cuotas</span>
                <span>Recargo</span>
                <span />
              </div>
              {/* Rows */}
              {tarjetas.map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center mb-5"
                >
                  <input
                    value={t.nombre}
                    onChange={(e) =>
                      updateTarjeta(t.id, "nombre", e.target.value)
                    }
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-center w-full"
                  />
                  <select
                    value={t.cuotas}
                    onChange={(e) =>
                      updateTarjeta(t.id, "cuotas", e.target.value)
                    }
                    className="border border-gray-300 rounded-md px-2 py-1.5 text-sm text-center w-full"
                  >
                    {[
                      "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"
                    ].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <input
                    value={t.recargo}
                    onChange={(e) =>
                      updateTarjeta(t.id, "recargo", e.target.value)
                    }
                    className="border border-gray-300 rounded-md px-3 py-1.5 text-sm text-center w-full"
                  />
                  <button
                    onClick={() => removeTarjeta(t.id)}
                    className="text-blue-400 hover:text-red-500"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              ))}
              {/* Note */}
              <p className="text-xs text-gray-500 mt-3 border border-gray-200 rounded-md p-2">
                📋 Las tarjetas que aceptamos para cuotas son bancarizadas y de
                crédito, en caso de débito tenemos el 5% de recargo en todas las
                tarjetas y en tarjetas que no sean Visa o Mastercard o de banco
                tenemos otros recargos. Consultar si ese es el caso que desea.
                ✏️
              </p>
            </div>
            <img src="/visa.png" className="w-60" alt="Visa Image" />
          </div>
        </div>

        <div className="flex justify-start my-5 items-center gap-2">
          <label className="inline-flex gap-2 my-2 items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showCalculadora}
              onChange={(e) => setShowCalculadora(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
          <p className="text-black">Calculadora de Tarjetas</p>
        </div>

        {/* Cuentas para transferencias y depósitos */}
        <div className="mt-10 text-black">
          <h3 className="text-black font-bold text-xl text-center my-5">
            Cuentas para transferencias y depósitos
          </h3>
          
          <div className="border border-gray-300 rounded-md p-6 max-w-4xl mx-auto bg-white shadow-sm divide-y divide-gray-200">
            {cuentas.length === 0 ? (
              <p className="text-center py-6 text-gray-500">No hay cuentas bancarias registradas</p>
            ) : (
              cuentas.map((cuenta) => (
                <div
                  key={cuenta.id}
                  className="py-6 first:pt-0 last:pb-0"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Tipo / Banco</p>
                      <p className="text-base font-bold text-primary">{cuenta.account_title}</p>
                    </div>
                    <div className="flex justify-end gap-3 items-start">
                      <button
                        onClick={() => openEdit(cuenta)}
                        title="Editar"
                        className="text-gray-600 hover:text-primary transition-colors"
                      >
                        <svg width="15" height="15" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8.6821 0.655196C9.10147 0.23574 9.67029 5.8616e-05 10.2634 1.09323e-08C10.8566 -5.85942e-05 11.4255 0.23551 11.8449 0.654884C12.2644 1.07426 12.5 1.64308 12.5001 2.23622C12.5002 2.82937 12.2646 3.39824 11.8452 3.8177L11.2877 4.37582L8.12522 1.2127L8.6821 0.655196ZM7.46272 1.87582L1.21272 8.1252C0.958684 8.37897 0.780167 8.69836 0.697097 9.0477L0.0127222 11.9239C-0.00580801 12.0019 -0.00407066 12.0832 0.0177686 12.1602C0.039608 12.2373 0.0808211 12.3075 0.137477 12.3641C0.194133 12.4206 0.264344 12.4618 0.341412 12.4835C0.41848 12.5053 0.499837 12.5069 0.577722 12.4883L3.45335 11.8033C3.80291 11.7204 4.12252 11.5418 4.37647 11.2877L10.6252 5.03832L7.46272 1.87582Z" fill="currentColor" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(cuenta.id)}
                        title="Eliminar"
                        className="text-gray-600 hover:text-red-500 transition-colors"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Titular
                      </p>
                      <p className="text-base font-semibold">{cuenta.titular}</p>
                    </div>
                    {cuenta.account_number && (
                      <div>
                        <p className="text-sm font-semibold text-gray-600">
                          N° de cuenta
                        </p>
                        <p className="text-base font-mono">{cuenta.account_number}</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        CBU/CVU
                      </p>
                      <p className="text-base font-mono">{cuenta.cbu_cvu}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-600">Alias</p>
                      <p className="text-base font-semibold">{cuenta.alias}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cuenta.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {cuenta.active ? "Activa" : "Inactiva"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CUIT y Logo */}
        <div className="mt-10 flex flex-col items-center gap-4">
          <p className="text-black font-bold text-lg">CUIT: 20-22194061-0</p>
          <img src="/logo-grande.png" className="w-32" alt="Ruta 86 Logo" />
        </div>
      </section>

      {/* Modal: Add Account */}
      {modalOpenAdd && (
        <ModalLayout
          onSubmit={handleCreateAccount}
          setModalOpen={() => { setModalOpenAdd(false); resetForm(); }}
          title="Agregar Cuenta Bancaria"
          svg={<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#F1F1F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        >
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Banco / Tipo (ej: BANCO GALICIA)"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Titular de la cuenta"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Número de cuenta"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="CUIT / CUIL (solo números)"
              value={cuitCuil}
              onChange={(e) => setCuitCuil(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="CBU / CVU (solo números, 22 dígitos)"
              value={cbuCvu}
              onChange={(e) => setCbuCvu(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <label className="flex items-center gap-2 text-sm text-white font-medium cursor-pointer my-1">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              Cuenta Activa
            </label>
          </div>
        </ModalLayout>
      )}

      {/* Modal: Edit Account */}
      {modalOpenEdit && (
        <ModalLayout
          onSubmit={handleEditAccount}
          setModalOpen={() => { setModalOpenEdit(false); resetForm(); }}
          title="Editar Cuenta Bancaria"
          svg={<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#F1F1F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        >
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Banco / Tipo (ej: BANCO GALICIA)"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Titular de la cuenta"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Número de cuenta"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="CUIT / CUIL (solo números)"
              value={cuitCuil}
              onChange={(e) => setCuitCuil(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="CBU / CVU (solo números, 22 dígitos)"
              value={cbuCvu}
              onChange={(e) => setCbuCvu(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <input
              type="text"
              placeholder="Alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="w-full border bg-white rounded-sm p-2 text-black/90 font-medium shadow-sm focus:outline-none"
              required
            />
            <label className="flex items-center gap-2 text-sm text-white font-medium cursor-pointer my-1">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              Cuenta Activa
            </label>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}