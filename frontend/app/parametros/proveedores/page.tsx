"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ModalLayout from "@/app/components/ModalLayout";
import Pagination from "@/app/components/Pagination";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Proveedor from "@/app/components/icons/Proveedor";
import ProviderForm from "./ProviderForm";
import { emptyProvider, providerDraft, providerPayload, type Provider, type ProviderInput, type CatalogOption } from "@/lib/providerCatalog";

export default function ProvidersPage() {
  const { user, iwebClient } = useAuth();
  const r = useRouter();
  const tenant = user?.iweb_client_id;
  const [editing, setEditing] = useState<Provider | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  const [prov, setProv] = useState<Provider[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [listLoading, setListLoading] = useState(true);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [error, setError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [provData, setProvData] = useState<ProviderInput>(emptyProvider);
  const [catalogs, setCatalogs] = useState<{ destinos: CatalogOption[]; hotels: CatalogOption[]; excursions: CatalogOption[]; periods: CatalogOption[]; regimenes: CatalogOption[] }>({ destinos: [], hotels: [], excursions: [], periods: [], regimenes: [] });
  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const paginatedProv = prov;

  useEffect(() => {
    if (!tenant) return;
    let cancelled = false;
    setCatalogLoading(true);
    setCatalogError("");
    Promise.all(["get_destinos", "get_hotels", "get_excursions", "get_periods", "get_regimenes"].map(name => apiClient.getParameters(name, tenant))).then(([destinos, hotels, excursions, periods, regimenes]) => {
      if (!cancelled) setCatalogs({ destinos, hotels, excursions, periods, regimenes });
    }).catch((e: Error) => { if (!cancelled) setCatalogError(e.message || "No se pudieron cargar los parámetros."); })
      .finally(() => { if (!cancelled) setCatalogLoading(false); });
    return () => { cancelled = true; };
  }, [tenant, reload]);

  useEffect(() => {
    if (!tenant) return;
    let cancelled = false;
    setListLoading(true);
    setError("");
    const timer = setTimeout(() => {
      apiClient.getProviders(tenant, currentPage, search).then(data => {
        if (cancelled) return;
        const lastPage = Math.max(1, Math.ceil(data.total / pageSize));
        if (currentPage > lastPage) { setCurrentPage(lastPage); return; }
        setProv(data.items); setTotal(data.total);
      }).catch((e: Error) => { if (!cancelled) setError(e.message); })
        .finally(() => { if (!cancelled) setListLoading(false); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [tenant, currentPage, search, reload]);

  const handleClickPut = async (provider: Provider) => {
    if (!tenant || saving.current) return;
    saving.current = true; setBusy(true);
    try {
      const latest = await apiClient.getProvider(tenant, provider.id);
      setEditing(latest); setProvData(providerDraft(latest)); setModalOpen(true);
    } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo abrir el proveedor."); }
    finally { saving.current = false; setBusy(false); }
  };
  const handleSave = async () => {
    if (!tenant || saving.current || catalogLoading || catalogError) return;
    saving.current = true; setBusy(true);
    try {
      const payload = providerPayload(provData);
      if (editing) await apiClient.updateProvider(tenant, editing.id, payload);
      else await apiClient.createProvider(tenant, payload);
      setModalOpen(false); setReload(n => n + 1);
      toast.success(editing ? "Proveedor actualizado" : "Proveedor agregado");
    } catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo guardar el proveedor."); }
    finally { saving.current = false; setBusy(false); }
  };
  const handleDelete = async (provider: Provider) => {
    if (!tenant || saving.current || !window.confirm(`¿Dar de baja a ${provider.name}?`)) return;
    saving.current = true; setBusy(true);
    try { await apiClient.deleteProvider(tenant, provider.id, provider.revision); setReload(n => n + 1); toast.success("Proveedor dado de baja"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "No se pudo dar de baja el proveedor."); }
    finally { saving.current = false; setBusy(false); }
  };
  return (
    <Container>
      <ToggleSalidas />
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={() => r.push("/parametros")}
        className="flex items-center my-3 justify-start gap-3">
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>
      <h2 className="text-black font-semibold text-center md:text-xl mb-4">
        Proveedores
      </h2>
      <div className="flex justify-center mb-6">
        <button
          disabled={!tenant || catalogLoading || Boolean(catalogError) || busy}
          onClick={() => {
            setEditing(null); setProvData(emptyProvider()); setModalOpen(true);
          }}
          className="flex items-center gap-2  text-primary font-medium px-4 py-2 rounded-lg">
          <svg
            width="22"
            height="22"
            viewBox="0 0 22 22"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.12127 4.3474C9.6995 4.06194 12.3014 4.06194 14.8796 4.3474C16.3071 4.5074 17.4588 5.63156 17.6263 7.06406C17.9318 9.67906 17.9318 12.3207 17.6263 14.9357C17.4588 16.3682 16.3071 17.4924 14.8796 17.6524C12.3014 17.9379 9.6995 17.9379 7.12127 17.6524C5.69377 17.4924 4.5421 16.3682 4.3746 14.9357C4.06914 12.321 4.06914 9.67962 4.3746 7.0649C4.45932 6.36896 4.77658 5.72202 5.27496 5.22893C5.77334 4.73585 6.42363 4.42552 7.12043 4.34823M11.0004 6.83906C11.1662 6.83906 11.3252 6.90491 11.4424 7.02212C11.5596 7.13933 11.6254 7.2983 11.6254 7.46406V10.3749H14.5363C14.702 10.3749 14.861 10.4407 14.9782 10.558C15.0954 10.6752 15.1613 10.8341 15.1613 10.9999C15.1613 11.1657 15.0954 11.3246 14.9782 11.4418C14.861 11.559 14.702 11.6249 14.5363 11.6249H11.6254V14.5357C11.6254 14.7015 11.5596 14.8605 11.4424 14.9777C11.3252 15.0949 11.1662 15.1607 11.0004 15.1607C10.8347 15.1607 10.6757 15.0949 10.5585 14.9777C10.4413 14.8605 10.3754 14.7015 10.3754 14.5357V11.6249H7.4646C7.29884 11.6249 7.13987 11.559 7.02266 11.4418C6.90545 11.3246 6.8396 11.1657 6.8396 10.9999C6.8396 10.8341 6.90545 10.6752 7.02266 10.558C7.13987 10.4407 7.29884 10.3749 7.4646 10.3749H10.3754V7.46406C10.3754 7.2983 10.4413 7.13933 10.5585 7.02212C10.6757 6.90491 10.8347 6.83906 11.0004 6.83906Z"
              fill="#0546F7"
            />
          </svg>
          Agregar
        </button>
      </div>

      <div className="w-full max-w-xl mx-auto flex flex-col gap-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5.41667 10.8333C3.90278 10.8333 2.62167 10.3089 1.57333 9.26C0.525 8.21111 0.000555996 6.93 4.40917e-07 5.41667C-0.000555115 3.90333 0.523889 2.62222 1.57333 1.57333C2.62278 0.524444 3.90389 0 5.41667 0C6.92944 0 8.21083 0.524444 9.26083 1.57333C10.3108 2.62222 10.835 3.90333 10.8333 5.41667C10.8333 6.02778 10.7361 6.60417 10.5417 7.14583C10.3472 7.6875 10.0833 8.16667 9.75 8.58333L14.4167 13.25C14.5694 13.4028 14.6458 13.5972 14.6458 13.8333C14.6458 14.0694 14.5694 14.2639 14.4167 14.4167C14.2639 14.5694 14.0694 14.6458 13.8333 14.6458C13.5972 14.6458 13.4028 14.5694 13.25 14.4167L8.58333 9.75C8.16667 10.0833 7.6875 10.3472 7.14583 10.5417C6.60417 10.7361 6.02778 10.8333 5.41667 10.8333ZM5.41667 9.16667C6.45833 9.16667 7.34389 8.80222 8.07333 8.07333C8.80278 7.34444 9.16722 6.45889 9.16667 5.41667C9.16611 4.37444 8.80167 3.48917 8.07333 2.76083C7.345 2.0325 6.45944 1.66778 5.41667 1.66667C4.37389 1.66556 3.48861 2.03028 2.76083 2.76083C2.03306 3.49139 1.66833 4.37667 1.66667 5.41667C1.665 6.45667 2.02972 7.34222 2.76083 8.07333C3.49195 8.80444 4.37722 9.16889 5.41667 9.16667Z"
                fill="black"
                fillOpacity="0.5"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Buscar (nombre del hotel, sigla o nombre del destino)"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full border border-gray-400 bg-[#F5F5F5] rounded-md py-2 pl-9 pr-4 text-black font-normal shadow-sm focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-gray-500"
          />
        </div>

        {error || catalogError ? (
          <div role="alert" className="py-12 text-center text-gray-500 text-sm border border-gray-400 rounded-lg bg-white">
            <p>{error || catalogError}</p>
            <button onClick={() => setReload(n => n + 1)}>Reintentar</button>
          </div>
        ) : listLoading || !tenant ? (
          <div role="status" aria-label="Cargando proveedores" className="flex flex-col w-full animate-pulse">
            {Array.from({ length: pageSize }, (_, index) => <div key={index} className="flex items-stretch gap-3 w-full">
              <div className="w-20 sm:w-24 h-12 bg-[#D8E2FD] border border-gray-400 rounded-md" />
              <div className="flex-1 h-12 bg-[#F5F5F5] border border-gray-400 rounded-md" />
            </div>)}
          </div>
        ) : prov.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-sm flex flex-col items-center gap-2 border border-gray-400 rounded-lg bg-white">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-gray-300">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>No se encontraron resultados</span>
          </div>
        ) : (
          <ul className="flex flex-col w-full">
            {paginatedProv.map((prov, index) => {
              const isFirst = index === 0;
              const isLast = index === paginatedProv.length - 1;

              return (
                <li
                  key={prov.id}
                  className="flex items-stretch gap-3 w-full">
                  {/* Destino Sigla Badge */}
                  <div
                    className={`w-20 sm:w-24 flex items-center justify-center px-3 py-3 bg-[#D8E2FD] border-x border-gray-400 text-black font-medium text-sm text-center shrink-0 ${
                      isFirst ? "border-t rounded-t-md" : "border-t"
                    } ${isLast ? "border-b rounded-b-md" : ""}`}>
                    {prov.type === 'hotel' ? 'HOTEL' : 'RECEPTIVO'}
                  </div>

                  {/* Hotel Name Item */}
                  <div
                    className={`flex-1 flex items-center justify-between px-4 py-3 bg-[#F5F5F5] hover:bg-[#EFEFEF] transition-colors border-x border-gray-400 text-black text-sm ${
                      isFirst ? "border-t rounded-t-md" : "border-t"
                    } ${isLast ? "border-b rounded-b-md" : ""}`}>
                    <span className="font-normal text-gray-900">
                      {prov.name}
                    </span>
                    <div className="flex items-center gap-3">
                      {/* BOTON EDITAR */}
                      <button
                        onClick={() => handleClickPut(prov)}
                        title="Editar"
                        className="text-black hover:text-primary transition-colors cursor-pointer">
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 13 13"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M8.6821 0.655196C9.10147 0.23574 9.67029 5.8616e-05 10.2634 1.09323e-08C10.8566 -5.85942e-05 11.4255 0.23551 11.8449 0.654884C12.2644 1.07426 12.5 1.64308 12.5001 2.23622C12.5002 2.82937 12.2646 3.39824 11.8452 3.8177L11.2877 4.37582L8.12522 1.2127L8.6821 0.655196ZM7.46272 1.87582L1.21272 8.1252C0.958684 8.37897 0.780167 8.69836 0.697097 9.0477L0.0127222 11.9239C-0.00580801 12.0019 -0.00407066 12.0832 0.0177686 12.1602C0.039608 12.2373 0.0808211 12.3075 0.137477 12.3641C0.194133 12.4206 0.264344 12.4618 0.341412 12.4835C0.41848 12.5053 0.499837 12.5069 0.577722 12.4883L3.45335 11.8033C3.80291 11.7204 4.12252 11.5418 4.37647 11.2877L10.6252 5.03832L7.46272 1.87582Z"
                            fill="black"
                          />
                        </svg>
                      </button>
                      {/* BOTON ELIMINAR */}
                      <button
                        onClick={() => handleDelete(prov)}
                        title="Eliminar"
                        className="text-black hover:text-red-500 transition-colors cursor-pointer">
                        <svg
                          width="10"
                          height="13"
                          viewBox="0 0 9 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M8.75 0.625H6.5625L5.9375 0H2.8125L2.1875 0.625H0V1.875H8.75M0.625 10C0.625 10.3315 0.756696 10.6495 0.991117 10.8839C1.22554 11.1183 1.54348 11.25 1.875 11.25H6.875C7.20652 11.25 7.52446 11.1183 7.75888 10.8839C7.9933 10.6495 8.125 10.3315 8.125 10V2.5H0.625V10Z"
                            fill="black"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={total}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      <div className="xl:flex hidden absolute md:right-40 md:top-60 mt-8 justify-end">
        <img
          src={iwebClient?.logo_xl || iwebClient?.logo_s || "/logo-grande.png"}
          className="size-50 object-contain"
          alt="Logo Empresa"
        />
      </div>
      {modalOpen && (
        <ModalLayout maxWidth="max-w-2xl"
          setModalOpen={() => { if (!saving.current) setModalOpen(false); }}
          title={editing ? "Editar Proveedor" : "Agregar Proveedor"} svg={<Proveedor />}
          submitLabel={busy ? "Guardando..." : "Confirmar"}
          onSubmit={() => (document.getElementById("provider-form") as HTMLFormElement | null)?.requestSubmit()}>
          <ProviderForm value={provData} onChange={setProvData} onSubmit={handleSave} busy={busy} catalogs={catalogs} />
        </ModalLayout>
      )}
    </Container>
  );
}
