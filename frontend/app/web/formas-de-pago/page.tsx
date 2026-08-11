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
import Administracion from "@/app/components/icons/home/Administracion";

type CardWeb = {
  id?: string;
  tempId?: number;
  iweb_client_id?: string;
  name: string;
  quotes: number;
  recargo: number;
};

type QuoteOption = {
  id?: string;
  tempId?: number;
  quotes: number;
  recargo: number;
};

type CardGroup = {
  groupTempId: number;
  name: string;
  options: QuoteOption[];
};

type AccountWeb = {
  id: string;
  iweb_client_id: string;
  type_account: string;
  titular: string;
  account_number?: string;
  cbu_cvu: string;
  alias: string;
  active: boolean;
};

function groupCardsByName(rawCards: CardWeb[]): CardGroup[] {
  const map = new Map<string, QuoteOption[]>();
  for (const c of rawCards) {
    const nameKey = (c.name || "Tarjeta").trim();
    if (!map.has(nameKey)) {
      map.set(nameKey, []);
    }
    map.get(nameKey)!.push({
      id: c.id,
      tempId: c.tempId || Math.random(),
      quotes: c.quotes || 1,
      recargo: c.recargo !== undefined ? c.recargo : 0,
    });
  }

  const groups: CardGroup[] = [];
  map.forEach((options, name) => {
    groups.push({
      groupTempId: Math.random(),
      name,
      options: options.sort((a, b) => a.quotes - b.quotes),
    });
  });

  return groups;
}

export default function FormasDePagoPage() {
  const r = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingCards, setSavingCards] = useState(false);
  const [cuentas, setCuentas] = useState<AccountWeb[]>([]);
  const [cardGroups, setCardGroups] = useState<CardGroup[]>([]);
  const [deletedCardIds, setDeletedCardIds] = useState<string[]>([]);

  // Settings
  const [showCalculadora, setShowCalculadora] = useState(true);
  const [cardText, setCardText] = useState(
    "📋 Las tarjetas que aceptamos para cuotas son bancarizadas y de crédito, en caso de débito tenemos el 5% de recargo en todas las tarjetas y en tarjetas que no sean Visa o Mastercard o de banco tenemos otros recargos."
  );

  // Modal states for Accounts
  const [modalOpenAdd, setModalOpenAdd] = useState(false);
  const [modalOpenEdit, setModalOpenEdit] = useState(false);

  // Account Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [accountTitle, setAccountTitle] = useState("");
  const [titular, setTitular] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cbuCvu, setCbuCvu] = useState("");
  const [alias, setAlias] = useState("");
  const [active, setActive] = useState(true);

  const loadAllData = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [fdp, cards, accs] = await Promise.all([
        apiClient.getFormaDePago(user.iweb_client_id).catch(() => null),
        apiClient.getCardsWeb(user.iweb_client_id).catch(() => []),
        apiClient.getAccountsWeb(user.iweb_client_id).catch(() => []),
      ]);

      if (fdp) {
        setShowCalculadora(fdp.calculator ?? true);
        if (fdp.card_text !== null && fdp.card_text !== undefined) {
          setCardText(fdp.card_text);
        }
      }
      setCardGroups(groupCardsByName(cards));
      setCuentas(accs);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos de formas de pago");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadAllData();
    }
  }, [user?.iweb_client_id]);

  // ---- CARDS & SETTINGS HANDLERS ----

  const handleAddCardGroup = () => {
    const newGroup: CardGroup = {
      groupTempId: Date.now() + Math.random(),
      name: "Nueva Tarjeta",
      options: [
        { quotes: 1, recargo: 0, tempId: Date.now() + Math.random() }
      ],
    };
    setCardGroups((prev) => [...prev, newGroup]);
    toast.success("Tarjeta agregada");
  };

  const handleAddQuoteOption = (gIdx: number) => {
    setCardGroups((prev) => {
      const updated = [...prev];
      const targetGroup = { ...updated[gIdx] };
      const existingQuotes = targetGroup.options.map((o) => Number(o.quotes));
      let nextQuote = 1;
      const possibleQuotes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24];
      for (const q of possibleQuotes) {
        if (!existingQuotes.includes(q)) {
          nextQuote = q;
          break;
        }
      }
      targetGroup.options = [
        ...targetGroup.options,
        { quotes: nextQuote, recargo: 0, tempId: Date.now() + Math.random() },
      ];
      updated[gIdx] = targetGroup;
      return updated;
    });
  };

  const handleDeleteQuoteOption = (gIdx: number, oIdx: number) => {
    setCardGroups((prev) => {
      const updated = [...prev];
      const targetGroup = { ...updated[gIdx] };
      const optToDelete = targetGroup.options[oIdx];
      if (optToDelete.id) {
        setDeletedCardIds((prevIds) => [...prevIds, optToDelete.id!]);
      }
      targetGroup.options = targetGroup.options.filter((_, i) => i !== oIdx);
      updated[gIdx] = targetGroup;
      return updated;
    });
    toast.success("Opción de cuota removida");
  };

  const handleDeleteCardGroup = (gIdx: number) => {
    const targetGroup = cardGroups[gIdx];
    for (const opt of targetGroup.options) {
      if (opt.id) {
        setDeletedCardIds((prevIds) => [...prevIds, opt.id!]);
      }
    }
    setCardGroups((prev) => prev.filter((_, i) => i !== gIdx));
    toast.success(`Tarjeta "${targetGroup.name}" removida`);
  };

  const handleUpdateGroupName = (gIdx: number, newName: string) => {
    setCardGroups((prev) => {
      const updated = [...prev];
      updated[gIdx] = { ...updated[gIdx], name: newName };
      return updated;
    });
  };

  const handleUpdateQuoteOption = (
    gIdx: number,
    oIdx: number,
    field: "quotes" | "recargo",
    val: number
  ) => {
    setCardGroups((prev) => {
      const updated = [...prev];
      const targetGroup = { ...updated[gIdx] };
      const options = [...targetGroup.options];
      options[oIdx] = { ...options[oIdx], [field]: val };
      targetGroup.options = options;
      updated[gIdx] = targetGroup;
      return updated;
    });
  };

  const handleToggleCalculadora = async (checked: boolean) => {
    setShowCalculadora(checked);
    if (!user?.iweb_client_id) return;
    try {
      const formData = new FormData();
      formData.append("calculator", String(checked));
      await apiClient.updateFormaDePago(user.iweb_client_id, formData);
      toast.success(`Calculadora de tarjetas ${checked ? "activada" : "desactivada"}`);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar calculadora");
    }
  };

  const handleConfirmTarjetas = async () => {
    if (!user?.iweb_client_id) return;
    setSavingCards(true);
    try {
      // 1. Save Settings
      const settingsData = new FormData();
      settingsData.append("calculator", String(showCalculadora));
      settingsData.append("card_text", cardText);
      await apiClient.updateFormaDePago(user.iweb_client_id, settingsData);

      // 2. Delete removed cards
      for (const cardId of deletedCardIds) {
        await apiClient.deleteCardWeb(user.iweb_client_id, cardId).catch(() => null);
      }
      setDeletedCardIds([]);

      // 3. Create or Update Cards from cardGroups
      for (const group of cardGroups) {
        const cardName = group.name.trim() || "Tarjeta";
        for (const opt of group.options) {
          if (opt.id) {
            const cardData = new FormData();
            cardData.append("id", opt.id);
            cardData.append("name", cardName);
            cardData.append("quotes", String(opt.quotes || 1));
            cardData.append("recargo", String(opt.recargo || 0));
            await apiClient.updateCardWeb(user.iweb_client_id, cardData);
          } else {
            const cardData = new FormData();
            cardData.append("name", cardName);
            cardData.append("quotes", String(opt.quotes || 1));
            cardData.append("recargo", String(opt.recargo || 0));
            await apiClient.createCardWeb(user.iweb_client_id, cardData);
          }
        }
      }

      // 4. Refetch updated list & regroup
      const refreshedCards = await apiClient.getCardsWeb(user.iweb_client_id);
      setCardGroups(groupCardsByName(refreshedCards));

      toast.success("Configuración de tarjetas guardada correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar tarjetas");
    } finally {
      setSavingCards(false);
    }
  };

  // ---- DATABASE ACCOUNTS HANDLERS ----

  const handleCreateAccount = async () => {
    if (!user?.iweb_client_id) return;

    const formData = new FormData();
    formData.append("type_account", accountTitle || "Cuenta Corriente");
    formData.append("titular", titular);
    formData.append("account_number", accountNumber);
    formData.append("cbu_cvu", cbuCvu);
    formData.append("alias", alias);
    formData.append("active", String(active));

    try {
      await apiClient.createAccountWeb(user.iweb_client_id, formData);
      toast.success("Cuenta bancaria web agregada correctamente");
      setModalOpenAdd(false);
      resetForm();
      const updated = await apiClient.getAccountsWeb(user.iweb_client_id);
      setCuentas(updated);
    } catch (error) {
      console.error(error);
      toast.error("Error al agregar cuenta bancaria web");
    }
  };

  const handleEditAccount = async () => {
    if (!user?.iweb_client_id || !editId) return;

    const formData = new FormData();
    formData.append("id", editId);
    formData.append("type_account", accountTitle || "Cuenta Corriente");
    formData.append("titular", titular);
    formData.append("account_number", accountNumber);
    formData.append("cbu_cvu", cbuCvu);
    formData.append("alias", alias);
    formData.append("active", String(active));

    try {
      await apiClient.updateAccountWeb(user.iweb_client_id, formData);
      toast.success("Cuenta bancaria web actualizada correctamente");
      setModalOpenEdit(false);
      resetForm();
      const updated = await apiClient.getAccountsWeb(user.iweb_client_id);
      setCuentas(updated);
    } catch (error) {
      console.error(error);
      toast.error("Error al actualizar cuenta bancaria web");
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!user?.iweb_client_id) return;
    if (!window.confirm("¿Está seguro de eliminar esta cuenta bancaria?")) return;
    try {
      await apiClient.deleteAccountWeb(user.iweb_client_id, id);
      toast.success("Cuenta eliminada correctamente");
      const updated = await apiClient.getAccountsWeb(user.iweb_client_id);
      setCuentas(updated);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar cuenta");
    }
  };

  const openEdit = (c: AccountWeb) => {
    setEditId(c.id);
    setAccountTitle(c.type_account || "");
    setTitular(c.titular || "");
    setAccountNumber(c.account_number || "");
    setCbuCvu(c.cbu_cvu || "");
    setAlias(c.alias || "");
    setActive(c.active);
    setModalOpenEdit(true);
  };

  const resetForm = () => {
    setEditId(null);
    setAccountTitle("");
    setTitular("");
    setAccountNumber("");
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
        className="flex items-center my-3 justify-start gap-3 cursor-pointer"
      >
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>

      <section className="max-w-3/4 flex flex-col justify-around mx-auto">
        <div className="flex gap-10 justify-around items-center w-full my-5">
          <button
            onClick={handleAddCardGroup}
            className="border-2 flex items-center gap-2 border-primary rounded-lg font-semibold px-10 py-2 hover:bg-primary/10 transition-colors cursor-pointer"
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
            onClick={() => {
              resetForm();
              setModalOpenAdd(true);
            }}
            className="border-2 flex items-center gap-2 border-primary rounded-lg font-semibold px-10 py-2 hover:bg-primary/10 transition-colors cursor-pointer"
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
              className="w-30 mx-14 hidden md:block"
              alt="MasterCard Image"
            />
            <div className="flex-1 border border-gray-300 rounded-md gap-5 p-5 bg-white">
              {cardGroups.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-4">
                  No hay tarjetas registradas
                </p>
              ) : (
                cardGroups.map((group, gIdx) => (
                  <div
                    key={group.groupTempId || gIdx}
                    className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50/50"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3 w-full max-w-xs">
                        <label className="text-xs font-bold text-gray-600 uppercase">
                          Tarjeta:
                        </label>
                        <input
                          value={group.name}
                          onChange={(e) =>
                            handleUpdateGroupName(gIdx, e.target.value)
                          }
                          placeholder="Nombre de Tarjeta (Ej: Visa)"
                          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm font-bold text-gray-800 bg-white w-full"
                        />
                      </div>
                      <button
                        onClick={() => handleDeleteCardGroup(gIdx)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        title="Eliminar tarjeta completa"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="14"
                          height="14"
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
                        Eliminar Tarjeta
                      </button>
                    </div>

                    <div className="space-y-2 mt-2">
                      <div className="grid grid-cols-[1fr_1fr_auto] text-center font-semibold text-xs text-gray-500 mb-1 px-2">
                        <span>Cuotas</span>
                        <span>Recargo (%)</span>
                        <span />
                      </div>
                      {group.options.map((opt, oIdx) => (
                        <div
                          key={opt.id || opt.tempId || oIdx}
                          className="grid grid-cols-[1fr_1fr_auto] gap-3 items-center bg-white p-2 border border-gray-200 rounded-md"
                        >
                          <select
                            value={String(opt.quotes || 1)}
                            onChange={(e) =>
                              handleUpdateQuoteOption(
                                gIdx,
                                oIdx,
                                "quotes",
                                Number(e.target.value)
                              )
                            }
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm text-center font-medium"
                          >
                            {[
                              "1",
                              "2",
                              "3",
                              "4",
                              "5",
                              "6",
                              "7",
                              "8",
                              "9",
                              "10",
                              "11",
                              "12",
                              "18",
                              "24",
                            ].map((n) => (
                              <option key={n} value={n}>
                                {n} {Number(n) === 1 ? "cuota" : "cuotas"}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1 justify-center">
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={
                                opt.recargo !== undefined ? opt.recargo : 0
                              }
                              onChange={(e) =>
                                handleUpdateQuoteOption(
                                  gIdx,
                                  oIdx,
                                  "recargo",
                                  Number(e.target.value)
                                )
                              }
                              placeholder="Recargo %"
                              className="border border-gray-300 rounded-md px-3 py-1 text-sm text-center font-medium w-24"
                            />
                            <span className="text-sm font-semibold text-gray-600">
                              %
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteQuoteOption(gIdx, oIdx)}
                            className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                            title="Eliminar esta cuota"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAddQuoteOption(gIdx)}
                      className="mt-3 text-xs font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      + Agregar otra cuota a {group.name || "esta tarjeta"}
                    </button>
                  </div>
                ))
              )}

              {/* Editable Card Text Note */}
              <div className="mt-3">
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  Texto aclaratorio bajo tarjetas
                </label>
                <textarea
                  value={cardText}
                  onChange={(e) => setCardText(e.target.value)}
                  rows={3}
                  className="w-full text-xs text-gray-700 border border-gray-200 rounded-md p-2 focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <img
              src="/visa.png"
              className="w-60 hidden md:block"
              alt="Visa Image"
            />
          </div>
        </div>

        <button
          onClick={handleConfirmTarjetas}
          disabled={savingCards}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-6 rounded-sm w-max mx-auto my-5 transition-colors shadow-sm active:scale-95 cursor-pointer"
        >
          {savingCards ? "Guardando..." : "Confirmar tarjetas"}
        </button>

        <div className="flex justify-start my-5 items-center gap-2">
          <label className="inline-flex gap-2 my-2 items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showCalculadora}
              onChange={(e) => handleToggleCalculadora(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
          </label>
          <p className="text-black font-semibold">
            Calculadora de Tarjetas (en web pública)
          </p>
        </div>

        {/* Cuentas para transferencias y depósitos */}
        <div className="mt-10 text-black">
          <h3 className="text-black font-bold text-xl text-center my-5">
            Cuentas para transferencias y depósitos
          </h3>

          <div className="border border-gray-300 rounded-md p-6 max-w-4xl mx-auto bg-white shadow-sm divide-y divide-gray-200">
            {cuentas.length === 0 ? (
              <p className="text-center py-6 text-gray-500">
                No hay cuentas bancarias web registradas
              </p>
            ) : (
              cuentas.map((cuenta) => (
                <div
                  key={cuenta.id}
                  className="py-6 first:pt-0 last:pb-0"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-gray-600">
                        Tipo / Banco
                      </p>
                      <p className="text-base font-bold text-primary">
                        {cuenta.type_account}
                      </p>
                    </div>
                    <div className="flex justify-end gap-3 items-start">
                      <button
                        onClick={() => openEdit(cuenta)}
                        title="Editar"
                        className="text-gray-600 hover:text-primary transition-colors cursor-pointer"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 13 13"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M8.6821 0.655196C9.10147 0.23574 9.67029 5.8616e-05 10.2634 1.09323e-08C10.8566 -5.85942e-05 11.4255 0.23551 11.8449 0.654884C12.2644 1.07426 12.5 1.64308 12.5001 2.23622C12.5002 2.82937 12.2646 3.39824 11.8452 3.8177L11.2877 4.37582L8.12522 1.2127L8.6821 0.655196ZM7.46272 1.87582L1.21272 8.1252C0.958684 8.37897 0.780167 8.69836 0.697097 9.0477L0.0127222 11.9239C-0.00580801 12.0019 -0.00407066 12.0832 0.0177686 12.1602C0.039608 12.2373 0.0808211 12.3075 0.137477 12.3641C0.194133 12.4206 0.264344 12.4618 0.341412 12.4835C0.41848 12.5053 0.499837 12.5069 0.577722 12.4883L3.45335 11.8033C3.80291 11.7204 4.12252 11.5418 4.37647 11.2877L10.6252 5.03832L7.46272 1.87582Z"
                            fill="currentColor"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(cuenta.id)}
                        title="Eliminar"
                        className="text-gray-600 hover:text-red-500 transition-colors cursor-pointer"
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
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-3 rounded-md text-sm">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Titular</p>
                      <p className="font-semibold">{cuenta.titular || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        N° Cuenta
                      </p>
                      <p className="font-semibold">
                        {cuenta.account_number || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        CBU / CVU
                      </p>
                      <p className="font-semibold">{cuenta.cbu_cvu || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Alias</p>
                      <p className="font-semibold">{cuenta.alias || "-"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Modal Agregar Cuenta */}
      {modalOpenAdd && (
        <ModalLayout
          svg={<Administracion />}
          title="Agregar Cuenta"
          setModalOpen={setModalOpenAdd}
          onSubmit={handleCreateAccount}
        >
          <div className="flex flex-col gap-1 text-white">
            <input
              type="text"
              placeholder="Titulo de la cuenta (Tipo)"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="p-2.5 rounded-lg text-black bg-white outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 text-white">
            <input
              type="text"
              placeholder="Titular"
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              className="p-2.5 rounded-lg text-black bg-white outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 text-white">
            <input
              type="text"
              placeholder="Número de Cuenta"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="p-2.5 rounded-lg text-black bg-white outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 text-white">
            <input
              type="text"
              placeholder="CBU / CVU"
              value={cbuCvu}
              onChange={(e) => setCbuCvu(e.target.value)}
              className="p-2.5 rounded-lg text-black bg-white outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 text-white">
            <input
              type="text"
              placeholder="Alias"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="p-2.5 rounded-lg text-black bg-white outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2 mt-2 text-white">
            <input
              type="checkbox"
              id="activeAdd"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="activeAdd" className="text-sm font-semibold cursor-pointer">
              Cuenta activa
            </label>
          </div>
        </ModalLayout>
      )}

      {/* Modal Editar Cuenta */}
      {modalOpenEdit && (
        <ModalLayout
          title="Editar Cuenta Bancaria Web"
          setModalOpen={setModalOpenEdit}
          onSubmit={handleEditAccount}
        >
          <div className="flex flex-col gap-1 text-white">
            <label className="text-xs font-semibold">Tipo de Cuenta / Banco *</label>
            <input
              type="text"
              placeholder="Ej: Cuenta Corriente Pesos - Banco Galicia"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              className="p-2.5 rounded-lg text-black bg-white outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 text-white">
            <label className="text-xs font-semibold">Titular *</label>
            <input
              type="text"
              placeholder="Ej: Empresa S.A."
              value={titular}
              onChange={(e) => setTitular(e.target.value)}
              className="p-2.5 rounded-lg text-black bg-white outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 text-white">
            <label className="text-xs font-semibold">Número de Cuenta</label>
            <input
              type="text"
              placeholder="Ej: 1234-5678/9"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="p-2.5 rounded-lg text-black bg-white outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 text-white">
            <label className="text-xs font-semibold">CBU / CVU *</label>
            <input
              type="text"
              placeholder="Ej: 0070000000000000000000"
              value={cbuCvu}
              onChange={(e) => setCbuCvu(e.target.value)}
              className="p-2.5 rounded-lg text-black bg-white outline-none text-sm"
            />
          </div>
          <div className="flex flex-col gap-1 text-white">
            <label className="text-xs font-semibold">Alias *</label>
            <input
              type="text"
              placeholder="Ej: EMPRESA.GALICIA"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              className="p-2.5 rounded-lg text-black bg-white outline-none text-sm"
            />
          </div>
          <div className="flex items-center gap-2 mt-2 text-white">
            <input
              type="checkbox"
              id="activeEdit"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="activeEdit" className="text-sm font-semibold cursor-pointer">
              Cuenta activa
            </label>
          </div>
        </ModalLayout>
      )}
    </Container>
  );
}