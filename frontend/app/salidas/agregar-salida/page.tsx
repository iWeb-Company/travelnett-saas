"use client";

import Link from "next/link";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleActiveFilters from "@/app/components/ToggleActiveFilters";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";
import DateInput from "@/app/components/DateComponent";
import ComponentToogleModal from "@/app/components/ComponentToogleModal";

function AgregarSalidaContent() {
  const searchParams = useSearchParams();
  const r = useRouter();
  const { user } = useAuth();

  const id = searchParams.get("id");
  const typeParam = searchParams.get("type") || "bus";
  const [loadingParams, setLoadingParams] = useState(true);

  // Dynamic parameters from DB
  const [destinos, setDestinos] = useState<any[]>([]);
  const [transportes, setTransportes] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [lugaresCarga, setLugaresCarga] = useState<any[]>([]);

  // Form State
  const [destino, setDestino] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [precioTransporte, setPrecioTransporte] = useState("");
  const [fecha, setFecha] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [alcance, setAlcance] = useState<"argentina" | "internacional">(
    "argentina",
  );
  const [pasajerosTotales, setPasajerosTotales] = useState("");
  const [economy, setEconomy] = useState("");
  const [business, setBusiness] = useState("");
  const [selectedCargas, setSelectedCargas] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  const loadParameters = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [destData, transData, periodData, cargaData, salidasData] =
        await Promise.all([
          apiClient
            .getParameters("get_destinos", user.iweb_client_id)
            .catch(() => []),
          apiClient
            .getParameters("get_transport_companies", user.iweb_client_id)
            .catch(() => []),
          apiClient
            .getParameters("get_periods", user.iweb_client_id)
            .catch(() => []),
          apiClient
            .getParameters("get_lugares_carga", user.iweb_client_id)
            .catch(() => []),
          apiClient.getSalidas(user.iweb_client_id).catch(() => []),
        ]);

      const transportFilterByType = transData.filter(
        (x: any) => x.type === typeParam,
      );

      setDestinos(destData);
      setTransportes(transportFilterByType);
      setPeriodos(periodData);
      setLugaresCarga(
        [...cargaData].sort((left: any, right: any) => {
          const essentialOrder = Number(Boolean(right.is_essential)) - Number(Boolean(left.is_essential));
          if (essentialOrder !== 0) return essentialOrder;
          return String(left.name || left.nombre || "").localeCompare(
            String(right.name || right.nombre || ""),
            "es",
            { sensitivity: "base" },
          );
        }),
      );

      // If we are editing, fetch the existing data
      if (id) {
        const sal = await apiClient
          .getSalida(user.iweb_client_id, id)
          .catch(() => salidasData.find((x: any) => x.id === id));
        if (sal) {
          setDestino(sal.destino || "");
          setEmpresa(sal.transport_company || "");
          setPrecioTransporte(
            sal.precio_transporte?.toString() ||
              sal.precio_micro?.toString() ||
              sal.precio?.toString() ||
              "",
          );
          const rawDate = String(sal.date_of_out || "")
            .split(" ")[0]
            .split("T")[0];
          setFecha(rawDate);
          setPeriodo(sal.periodo || "");
          setAlcance(sal.alcance || "argentina");
          setPasajerosTotales(sal.passengers?.toString() || "");
          setEconomy(sal.semicama?.toString() || "");
          setBusiness(sal.cama?.toString() || "");
          const cargas = sal.cargas || sal.lugares_carga || [];
          setSelectedCargas(
            Array.isArray(cargas)
              ? cargas.map((c: any) =>
                  typeof c === "object" && c !== null ? c.id || c.name : c,
                )
              : [],
          );
          setActive(sal.active ?? true);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar parámetros del servidor");
    } finally {
      setLoadingParams(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadParameters();
    }
  }, [user?.iweb_client_id]);

  const handleBack = () => {
    r.back();
  };

  const handleCargaToggle = (idCarga: string) => {
    setSelectedCargas((prev) =>
      prev.includes(idCarga)
        ? prev.filter((x) => x !== idCarga)
        : [...prev, idCarga],
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const apiPayload = {
      date_of_out: fecha,
      type: typeParam,
      active: active,
      periodo: periodo,
      alcance: alcance,
      transport_company: empresa,
      precio_transporte: parseFloat(precioTransporte) || 0,
      destino: destino,
      passengers: parseInt(pasajerosTotales) || 0,
      semicama: parseInt(economy) || 0,
      cama: parseInt(business) || 0,
      cargas_ids: selectedCargas,
    };

    if (!user?.iweb_client_id) return;

    if (id) {
      apiClient
        .updateSalida(user.iweb_client_id, id, apiPayload)
        .then(() => {
          toast.success("Salida modificada con éxito");
          r.push(`/salidas/result?tipo=${typeParam}`);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error al modificar la salida");
        });
    } else {
      apiClient
        .createSalida(user.iweb_client_id, apiPayload)
        .then(() => {
          toast.success("Salida agregada con éxito");
          r.push(`/salidas/result?tipo=${typeParam}`);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Error al agregar la salida");
        });
    }
  };

  if (loadingParams) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <Container>
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={handleBack}
        className="flex items-center my-3 justify-start gap-3">
        <h2 className="font-semibold text-secondary underline">Cancelar</h2>
      </button>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col w-full max-w-3xl mx-auto my-5 gap-5 p-4 sm:p-6 rounded-xl text-base md:text-lg text-black">
        <h2 className="text-black text-center md:text-xl font-semibold mb-3">
          {id ? "Modificar" : "Agregar"} salida
        </h2>

        {/* Destino */}
        <select
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          required>
          <option value="" disabled>
            Destino
          </option>
          {destinos.map((d: any) => (
            <option key={d.id} value={d.id}>
              {d.name || d.nombre}
            </option>
          ))}
        </select>

        {/* Empresa de Transporte con animación para el Precio */}
        <div className="w-full flex flex-col gap-3">
          <select
            className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary z-10 relative"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            required>
            <option value="" disabled>
              Empresa de Transporte
            </option>
            {transportes.map((t: any) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.type === "aereo" ? "Aéreo" : "Bus"})
              </option>
            ))}
          </select>

          {/* Precio del micro / transporte (Animación de desplazamiento de 300ms) */}
          <div
            className={`grid transition-all duration-300 ease-in-out origin-top ${
              empresa
                ? "grid-rows-[1fr] opacity-100 translate-y-0"
                : "grid-rows-[0fr] opacity-0 -translate-y-6 pointer-events-none -mb-3"
            }`}>
            <div className="overflow-hidden">
              <div className="relative w-full flex items-center bg-[#f1f1f1] border border-gray-300 rounded-md shadow-sm">
                <input
                  type="number"
                  placeholder={
                    typeParam === "aereo"
                      ? "Precio del vuelo"
                      : "Precio del micro"
                  }
                  className="w-full bg-transparent font-medium py-2.5 pl-4 pr-12 text-zinc-600 placeholder-zinc-500 focus:outline-none"
                  value={precioTransporte}
                  onChange={(e) => setPrecioTransporte(e.target.value)}
                />
                <div className="absolute right-4 flex items-center gap-1 text-zinc-500 pointer-events-none select-none">
                  <span className="font-medium text-base">$</span>
                  <svg
                    className="w-4 h-4 fill-current text-zinc-600"
                    viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fecha de salida */}
        <DateInput
          value={fecha}
          onChange={(e) => setFecha(e)}
          placeholder="Fecha de salida"
        />

        {/* Periodo */}
        <select
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}>
          <option value="">Período (Opcional)</option>
          {periodos.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.name || p.nombre || p.description}
            </option>
          ))}
        </select>

        {/* Switch Alcance: Salida Argentina / Salida Internacional */}
        <div className="w-full flex rounded-md overflow-hidden border border-gray-300 shadow-sm text-zinc-600 font-medium select-none">
          <button
            type="button"
            onClick={() => setAlcance("argentina")}
            className={`w-1/2 py-2.5 px-4 flex items-center justify-center gap-2.5 cursor-pointer border-r border-gray-300 transition-colors focus:outline-none ${
              alcance === "argentina"
                ? "bg-[#dce6f9] text-zinc-700 font-semibold"
                : "bg-[#f1f1f1] text-zinc-500 hover:bg-gray-200/60"
            }`}>
            <span>Salida Argentina</span>
            <span
              className={`w-3.5 h-3.5 rounded-full transition-colors ${
                alcance === "argentina" ? "bg-[#1d4ed8]" : "bg-[#cccccc]"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setAlcance("internacional")}
            className={`w-1/2 py-2.5 px-4 flex items-center justify-center gap-2.5 cursor-pointer transition-colors focus:outline-none ${
              alcance === "internacional"
                ? "bg-[#dce6f9] text-zinc-700 font-semibold"
                : "bg-[#f1f1f1] text-zinc-500 hover:bg-gray-200/60"
            }`}>
            <span>Salida Internacional</span>
            <span
              className={`w-3.5 h-3.5 rounded-full transition-colors ${
                alcance === "internacional" ? "bg-[#1d4ed8]" : "bg-[#cccccc]"
              }`}
            />
          </button>
        </div>

        {/* Pasajeros totales */}
        <input
          type="number"
          placeholder="Cantidad de pasajeros totales"
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={pasajerosTotales}
          onChange={(e) => setPasajerosTotales(e.target.value)}
          required
        />

        {/* Semicama */}
        <input
          type="number"
          placeholder="Semicama"
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={economy}
          onChange={(e) => setEconomy(e.target.value)}
        />

        {/* Cama */}
        <input
          type="number"
          placeholder="Cama"
          className="text-zinc-500 bg-[#f1f1f1] font-medium w-full border border-gray-300 py-2.5 px-4 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
          value={business}
          onChange={(e) => setBusiness(e.target.value)}
        />

        {/* Lugares de Carga */}
        {lugaresCarga.length === 0 ? (
          <p className="text-xs text-gray-500">
            No hay lugares de carga registrados en parámetros.
          </p>
        ) : (
          <ComponentToogleModal
            onSelect={(value) => {
              setSelectedCargas(value ? value.split(", ") : []);
            }}
            value={selectedCargas.join(", ")}
            options={lugaresCarga.map((lugar) => ({
              id: lugar.id,
              label: lugar.name,
              essential: Boolean(lugar.is_essential),
            }))}
            placeholder="Lugares de carga"
          />
        )}
        <ToggleActiveFilters checked={active} onChange={setActive} />
        <button className="w-full bg-primary hover:bg-blue-700 text-white font-semibold text-center py-3 rounded-xl shadow transition-all cursor-pointer">
          {id ? "Modificar" : "Agregar"} Salida
        </button>
      </form>
    </Container>
  );
}

// Wrapping helper for load parameter toggle inside checkbox
function handleCoggleToggle(id: string) {
  const checkbox = document.querySelector(
    `input[type=checkbox][value="${id}"]`,
  ) as HTMLInputElement;
  if (checkbox) checkbox.checked = !checkbox.checked;
}

export default function AgregarSalidaPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader />
        </div>
      }>
      <AgregarSalidaContent />
    </Suspense>
  );
}
