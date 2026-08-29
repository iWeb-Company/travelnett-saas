"use client";

import Link from "next/link";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleActiveFilters from "@/app/components/ToggleActiveFilters";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";
import ComponentToogleModal from "@/app/components/ComponentToogleModal";
import { useMemo } from "react";
import {
  Destino,
  Excursion,
  Hotel,
  Package,
  PackageHotel,
  Period,
  Regimen,
  Salida,
} from "@/app/types";
import DateInput from "@/app/components/DateComponent";

// ─── Hotel entry type for the multi-hotel form ────────────────────────────────
interface HotelEntry {
  hotel_id: string;
  open: boolean;
  hotel_noches: string;
  hotel_fecha_in: string;
  hotel_fecha_out: string;
  hotel_fecha_salida_mas: string;
  hotel_regimen_id: string;
  tarifa_single: string;
  comisionable_single: boolean;
  tarifa_doble: string;
  tarifa_triple: string;
  tarifa_cuadruple: string;
  tarifa_quintuple: string;
  tarifa_menores: string;
  pricing_type: string;
}

const emptyHotelEntry = (): HotelEntry => ({
  hotel_id: "",
  open: false,
  hotel_noches: "",
  hotel_fecha_in: "",
  hotel_fecha_out: "",
  hotel_fecha_salida_mas: "",
  hotel_regimen_id: "",
  tarifa_single: "",
  comisionable_single: false,
  tarifa_doble: "",
  tarifa_triple: "",
  tarifa_cuadruple: "",
  tarifa_quintuple: "",
  tarifa_menores: "",
  pricing_type: "persona",
});

function pkgHotelToEntry(h: PackageHotel): HotelEntry {
  return {
    hotel_id: h.hotel_id || "",
    open: !!h.hotel_id,
    hotel_noches: String(h.hotel_noches ?? ""),
    hotel_fecha_in: h.hotel_fecha_in || "",
    hotel_fecha_out: h.hotel_fecha_out || "",
    hotel_fecha_salida_mas: h.hotel_fecha_salida_mas || "",
    hotel_regimen_id: h.hotel_regimen_id || "",
    tarifa_single: String(h.tarifa_single ?? ""),
    comisionable_single: h.comisionable_single ?? false,
    tarifa_doble: String(h.tarifa_doble ?? ""),
    tarifa_triple: String(h.tarifa_triple ?? ""),
    tarifa_cuadruple: String(h.tarifa_cuadruple ?? ""),
    tarifa_quintuple: String(h.tarifa_quintuple ?? ""),
    tarifa_menores: String(h.tarifa_menores ?? ""),
    pricing_type: h.pricing_type || "persona",
  };
}

// ─── Main component ────────────────────────────────────────────────────────────
function AgregarPaqueteContent() {
  const searchParams = useSearchParams();
  const r = useRouter();
  const { user } = useAuth();

  const id = searchParams.get("id");
  const [loadingParams, setLoadingParams] = useState(true);
  const loadedClientIdRef = useRef<string | null>(null);

  // Dynamic parameters from DB
  const [destinos, setDestinos] = useState<Destino[]>([]);
  const [hoteles, setHoteles] = useState<Hotel[]>([]);
  const [excursiones, setExcursiones] = useState<Excursion[]>([]);
  const [periodos, setPeriodos] = useState<Period[]>([]);
  const [regimenes, setRegimenes] = useState<Regimen[]>([]);
  const [salidas, setSalidas] = useState<Salida[]>([]);

  // Form State
  const [nombre, setNombre] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [destino, setDestino] = useState("");
  const [fecha, setFecha] = useState("");
  const [selectedSalidaIds, setSelectedSalidaIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [excursion, setExcursion] = useState("");
  const [periodo, setPeriodo] = useState("");
  const [precio, setPrecio] = useState("");
  const [moneda, setMoneda] = useState("ARS");
  const [gastosAdmin, setGastosAdmin] = useState("");
  const [gastosAdministrativos, setGastosAdministrativos] = useState("");
  const [monedaGastosAdmin, setMonedaGastosAdmin] = useState("ARS");
  const [adicionalBusCama, setAdicionalBusCama] = useState("");
  const [monedaAdicionalBusCama, setMonedaAdicionalBusCama] = useState("ARS");
  const [imageFile, setImageFile] = useState<File | string | null>(null);
  const [active, setActive] = useState(true);
  const [web, setWeb] = useState(true);
  const [dias, setDias] = useState("");
  const [noches, setNoches] = useState("");
  const [comisionable, setComisionable] = useState(false);
  const [selectedExcursion, setSelectedExcursion] = useState<string[]>([]);

  // Multi-hotel entries
  const [hotelEntries, setHotelEntries] = useState<HotelEntry[]>([
    emptyHotelEntry(),
  ]);

  const updateHotelEntry = (
    index: number,
    field: keyof HotelEntry,
    value: any,
  ) => {
    setHotelEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
    );
  };

  const addHotelEntry = () => {
    setHotelEntries((prev) => [...prev, emptyHotelEntry()]);
  };

  const removeHotelEntry = (index: number) => {
    setHotelEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const loadParameters = async () => {
    if (!user?.iweb_client_id) return;
    const currentKey = `${user.iweb_client_id}_${id || "new"}`;
    if (loadedClientIdRef.current === currentKey) return;
    loadedClientIdRef.current = currentKey;

    try {
      const [params, pkgsData, salidasData] = await Promise.all([
        apiClient
          .getAllParameters(user.iweb_client_id)
          .catch(() => ({
            destinos: [],
            hotels: [],
            excursions: [],
            periods: [],
            regimenes: [],
          })),
        apiClient.getPackages(user.iweb_client_id).catch(() => []),
        apiClient.getSalidas(user.iweb_client_id).catch(() => []),
      ]);

      setDestinos(params.destinos || []);
      setHoteles(params.hotels || []);
      setExcursiones(params.excursions || []);
      setPeriodos(params.periods || []);
      setRegimenes(params.regimenes || []);
      setSalidas(salidasData);

      // If we are editing, populate existing package
      if (id) {
        const pkg = pkgsData.find((p: Package) => p.id === id);
        if (pkg) {
          setNombre(pkg.name || "");
          setSubtitulo(pkg.subtitle || "");
          setDescripcion(pkg.description || "");
          setDestino(pkg.destino || "");
          if (pkg.dates && pkg.dates.length > 0) {
            setSelectedSalidaIds(pkg.dates);
            const firstDate = pkg.dates[0];
            const matchedSal = salidasData.find(
              (s: Salida) => s.id === firstDate,
            );
            if (matchedSal && matchedSal.date_of_out) {
              setFecha(matchedSal.date_of_out);
            } else {
              setFecha(firstDate);
            }
          }
          setPeriodo(pkg.periodo || "");
          setPrecio(pkg.price?.toString() || "");
          setMoneda(pkg.moneda || "pesos");
          setGastosAdmin(pkg.gastos?.toString() || "");
          setGastosAdministrativos(pkg.gastos?.toString() || "");
          setMonedaGastosAdmin(pkg.moneda_gastos || "pesos");
          setAdicionalBusCama(pkg.adicional?.toString() || "");
          setMonedaAdicionalBusCama(pkg.moneda_adicional || "pesos");
          if (pkg.image) setImageFile(pkg.image);
          setActive(pkg.active ?? true);
          setWeb(pkg.web ?? true);
          setComisionable(pkg.comisionable ?? false);
          if (pkg.excursiones) {
            setSelectedExcursion(pkg.excursiones.split(", "));
          }

          // Populate hotel entries
          if (pkg.hotels && pkg.hotels.length > 0) {
            setHotelEntries(pkg.hotels.map(pkgHotelToEntry));
          } else {
            setHotelEntries([emptyHotelEntry()]);
          }
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar parámetros del servidor");
    } finally {
      setLoadingParams(false);
    }
  };

  const imagePreviewUrl = useMemo(() => {
    if (!imageFile) return null;
    if (typeof imageFile === "string") return imageFile;
    return URL.createObjectURL(imageFile);
  }, [imageFile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const targetDestinoKeys = useMemo(() => {
    if (!destino) return [];
    const selectedDestinoObj = destinos.find(
      (d: Destino) => d.id === destino || d.name === destino,
    );
    if (!selectedDestinoObj) return [destino];

    const subNames = (selectedDestinoObj.name || "")
      .split(/\s*[/,+]\s*/)
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const matchingDestinoIds = destinos
      .filter((d) => subNames.includes((d.name || "").trim().toLowerCase()))
      .map((d) => d.id)
      .filter(Boolean) as string[];

    const allKeys = [
      destino,
      selectedDestinoObj.id,
      selectedDestinoObj.name,
      ...matchingDestinoIds,
      ...subNames,
    ].filter(Boolean) as string[];
    return Array.from(new Set(allKeys));
  }, [destino, destinos]);

  const salidasFiltered = useMemo(() => {
    if (!destino) return salidas;
    return salidas.filter(
      (s: Salida) => s.destino && targetDestinoKeys.includes(s.destino),
    );
  }, [salidas, destino, targetDestinoKeys]);

  const hotelesFiltered = useMemo(() => {
    if (!destino) return [];
    return hoteles.filter(
      (h: Hotel) => h.destino && targetDestinoKeys.includes(h.destino),
    );
  }, [hoteles, destino, targetDestinoKeys]);

  const excursionesFiltered = useMemo(() => {
    if (!destino) return [];
    return excursiones.filter(
      (e: Excursion) => e.destino && targetDestinoKeys.includes(e.destino),
    );
  }, [excursiones, destino, targetDestinoKeys]);

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadParameters();
    }
  }, [user?.iweb_client_id]);

  const handleBack = () => {
    r.back();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (selectedSalidaIds.length === 0) {
      toast.error(
        "Debes seleccionar o crear al menos una fecha de salida para el paquete.",
      );
      return;
    }

    setIsSubmitting(true);

    const processSubmit = (imageUrl: string) => {
      const validHotels = hotelEntries
        .filter((e) => e.hotel_id)
        .map((e) => ({
          hotel_id: e.hotel_id,
          hotel_noches: parseInt(e.hotel_noches) || null,
          hotel_fecha_in: e.hotel_fecha_in || null,
          hotel_fecha_out: e.hotel_fecha_out || null,
          hotel_fecha_salida_mas: e.hotel_fecha_salida_mas || null,
          hotel_regimen_id: e.hotel_regimen_id || null,
          tarifa_single: parseInt(e.tarifa_single) || null,
          comisionable_single: e.comisionable_single,
          tarifa_doble: parseInt(e.tarifa_doble) || null,
          tarifa_triple: parseInt(e.tarifa_triple) || null,
          tarifa_cuadruple: parseInt(e.tarifa_cuadruple) || null,
          tarifa_quintuple: parseInt(e.tarifa_quintuple) || null,
          tarifa_menores: parseInt(e.tarifa_menores) || null,
          pricing_type: e.pricing_type,
        }));

      const apiPayload = {
        name: nombre,
        subtitle: subtitulo,
        description: descripcion,
        price: parseInt(precio) || 0,
        gastos: parseInt(gastosAdministrativos || gastosAdmin) || 0,
        adicional: parseInt(adicionalBusCama) || 0,
        destino: destino,
        excursion: selectedExcursion.join(", ") || excursion,
        periodo: periodo,
        image: imageUrl || (typeof imageFile === "string" ? imageFile : ""),
        active: active,
        web: web,
        dates: selectedSalidaIds,
        dias: parseInt(dias) || null,
        noches: parseInt(noches) || null,
        comisionable: comisionable,
        moneda: moneda,
        moneda_gastos: monedaGastosAdmin,
        moneda_adicional: monedaAdicionalBusCama,
        excursiones: selectedExcursion.join(", "),
        hotels: validHotels,
      };

      if (!user?.iweb_client_id) {
        setIsSubmitting(false);
        return;
      }

      if (id) {
        apiClient
          .updatePackage(user.iweb_client_id, id, apiPayload)
          .then(() => {
            toast.success("Paquete modificado con éxito");
            r.push("/paquetes/result");
          })
          .catch((err) => {
            console.error(err);
            toast.error("Error al modificar el paquete");
            setIsSubmitting(false);
          });
      } else {
        apiClient
          .createPackage(user.iweb_client_id, apiPayload)
          .then(() => {
            toast.success("Paquete agregado con éxito");
            r.push("/paquetes/result");
          })
          .catch((err) => {
            console.error(err);
            toast.error("Error al agregar el paquete");
            setIsSubmitting(false);
          });
      }
    };

    if (imageFile && typeof imageFile !== "string") {
      const reader = new FileReader();
      reader.onloadend = () => {
        processSubmit(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      processSubmit(typeof imageFile === "string" ? imageFile : "");
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
        className="flex flex-col w-full max-w-3xl mx-auto my-5 gap-5 p-6 text-black">
        <h2 className="text-black text-center md:text-xl font-semibold mb-3">
          {id ? "Modificar" : "Agregar"} paquete
        </h2>

        {/* Destino */}
        <div className="flex flex-col gap-1">
          <select
            className="text-gray-500 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={destino}
            onChange={(e) => {
              const val = e.target.value;
              setDestino(val);
              setHotelEntries([emptyHotelEntry()]);
              setSelectedSalidaIds([]);
              setSelectedExcursion([]);
            }}
            required>
            <option value="" disabled>
              Destino
            </option>
            {destinos.map((d: Destino) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        {/* Nombre del paquete */}
        <div className="flex flex-col gap-1">
          <input
            type="text"
            placeholder="Nombre del paquete"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="text-gray-800 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Subtitulo */}
        <div className="flex flex-col gap-1">
          <input
            type="text"
            placeholder="Subtítulo"
            value={subtitulo}
            onChange={(e) => setSubtitulo(e.target.value)}
            className="text-gray-800 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Descripcion */}
        <div className="flex flex-col gap-1">
          <textarea
            placeholder="Descripción"
            rows={2}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="text-gray-800 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Fechas de salida */}
        <div className="flex flex-col gap-3 bg-[#f8f9fa] border border-gray-300 rounded-xl shadow-md">
          <ComponentToogleModal
            placeholder="Fechas de salida"
            value={selectedSalidaIds.join(", ")}
            onSelect={(val) => {
              const ids = val ? val.split(", ").filter(Boolean) : [];
              setSelectedSalidaIds(ids);
            }}
            options={salidasFiltered.map((s: Salida) => ({
              id: s.id,
              label: `${s.date_of_out || "Sin fecha"}`,
            }))}
          />
        </div>

        {/* Periodo */}
        <div className="flex flex-col gap-1">
          <select
            className="text-gray-500 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}>
            <option value="" disabled>
              Periodo
            </option>
            {periodos.map((p: Period) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Precio y moneda */}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Precio"
            className="text-gray-500 flex-1 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
          <select
            className="text-gray-500 bg-[#f1f1f1] font-semibold border border-gray-300 py-2.5 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            required>
            <option value="pesos">Pesos</option>
            <option value="dolares">Dólares</option>
          </select>
        </div>

        {/* Gastos administrativos */}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Gastos administrativos"
            value={gastosAdministrativos}
            onChange={(e) => setGastosAdministrativos(e.target.value)}
            className="text-gray-500 flex-1 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
          <select
            className="text-gray-500 bg-[#f1f1f1] font-semibold border border-gray-300 py-2.5 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={monedaGastosAdmin}
            onChange={(e) => setMonedaGastosAdmin(e.target.value)}
            required>
            <option value="pesos">Pesos</option>
            <option value="dolares">Dólares</option>
          </select>
        </div>

        {/* Adicional bus cama/business */}
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Adicional bus cama/business"
            value={adicionalBusCama}
            onChange={(e) => setAdicionalBusCama(e.target.value)}
            className="text-gray-500 flex-1 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            className="text-gray-500 bg-[#f1f1f1] font-semibold border border-gray-300 py-2.5 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={monedaAdicionalBusCama}
            onChange={(e) => setMonedaAdicionalBusCama(e.target.value)}
            required>
            <option value="pesos">Pesos</option>
            <option value="dolares">Dólares</option>
          </select>
        </div>

        {/* Comisionable */}
        <div className="flex items-center justify-center gap-2">
          <p className="text-xl">Comisionable</p>
          <input
            type="checkbox"
            className="w-4 h-4"
            checked={comisionable}
            onChange={(e) => setComisionable(e.target.checked)}
          />
        </div>

        {/* ── Hoteles (multi) ──────────────────────────────────────────────── */}
        {hotelEntries.map((entry, index) => (
          <div key={index} className="flex flex-col gap-1">
            {/* Cabecera: badge + botón eliminar */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {hotelEntries.length > 1 ? `Hotel ${index + 1}` : "Hotel"}
              </span>
              <button
                type="button"
                onClick={() => removeHotelEntry(index)}
                className="text-red-500 text-xs cursor-pointer hover:underline font-medium">
                Eliminar
              </button>
            </div>

            {/* Select hotel */}
            <select
              className="text-gray-500 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              value={entry.hotel_id}
              onChange={(e) => {
                const val = e.target.value;
                updateHotelEntry(index, "hotel_id", val);
                updateHotelEntry(index, "open", !!val);
              }}>
              {!destino ? (
                <option value="">Hotel</option>
              ) : hotelesFiltered.length === 0 ? (
                <option value="" disabled>
                  No hay hoteles precargados con el destino seleccionado.
                </option>
              ) : (
                <option value="" disabled>
                  Seleccionar Hotel
                </option>
              )}
              {hotelesFiltered.map((h: Hotel) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>

            {/* Sub-form expandible */}
            <div
              className={`grid transition-all duration-500 ease-in-out ${
                entry.open
                  ? "grid-rows-[1fr] opacity-100 my-2"
                  : "grid-rows-[0fr] opacity-0 my-0 pointer-events-none"
              }`}>
              <div className="overflow-hidden">
                <section className="flex flex-col gap-5 border border-gray-200 rounded-xl p-4 sm:p-6 bg-white shadow-sm w-full">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                    <input
                      className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      type="text"
                      placeholder="Cantidad de noches"
                      value={entry.hotel_noches}
                      onChange={(e) =>
                        updateHotelEntry(index, "hotel_noches", e.target.value)
                      }
                    />
                    <DateInput
                      value={entry.hotel_fecha_in}
                      onChange={(v) =>
                        updateHotelEntry(index, "hotel_fecha_in", v)
                      }
                      placeholder="Fecha IN"
                    />
                    <select
                      className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                      value={entry.hotel_regimen_id}
                      onChange={(e) =>
                        updateHotelEntry(
                          index,
                          "hotel_regimen_id",
                          e.target.value,
                        )
                      }>
                      <option value="">Régimen</option>
                      {regimenes.map((regimen: Regimen) => (
                        <option key={regimen.id} value={regimen.id}>
                          {regimen.name}
                        </option>
                      ))}
                    </select>
                    <DateInput
                      value={entry.hotel_fecha_out}
                      onChange={(v) =>
                        updateHotelEntry(index, "hotel_fecha_out", v)
                      }
                      placeholder="Fecha OUT"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-end gap-2 p-3 rounded-lg">
                    <span className="text-sm font-semibold text-gray-700">
                      Fecha de salida +
                    </span>
                    <input
                      type="text"
                      value={entry.hotel_fecha_salida_mas}
                      onChange={(e) =>
                        updateHotelEntry(
                          index,
                          "hotel_fecha_salida_mas",
                          e.target.value,
                        )
                      }
                      className="text-gray-800 bg-white font-medium border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
                    />
                  </div>

                  {/* Tabla de tarifas */}
                  <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                    <table className="w-full text-xs text-left border-collapse min-w-162.5">
                      <thead className="text-gray-700 uppercase font-semibold">
                        <tr className="border-b border-gray-200">
                          <th className="py-2 px-2 text-center border-r border-gray-200 bg-gray-200/60 font-bold min-w-[17.5]">
                            TIPO
                          </th>
                          <th className="py-2 px-2 text-center border-r border-gray-200 min-w-[22.5] align-middle">
                            <span className="block font-semibold">Single</span>
                            <div className="flex items-center justify-center gap-1 mt-0.5 font-normal lowercase text-[10px] text-gray-500">
                              <span>50% no comisionable</span>
                              <input
                                type="checkbox"
                                name="comisionable_single"
                                className="w-3 h-3"
                                checked={entry.comisionable_single}
                                onChange={(e) =>
                                  updateHotelEntry(
                                    index,
                                    "comisionable_single",
                                    e.target.checked,
                                  )
                                }
                              />
                            </div>
                          </th>
                          <th className="py-2 px-2 text-center border-r border-gray-200 min-w-18.75 align-middle">
                            Dobles
                          </th>
                          <th className="py-2 px-2 text-center border-r border-gray-200 min-w-18.75 align-middle">
                            Triples
                          </th>
                          <th className="py-2 px-2 text-center border-r border-gray-200 min-w-18.75 align-middle">
                            Cuádruples
                          </th>
                          <th className="py-2 px-2 text-center border-r border-gray-200 min-w-18.75 align-middle">
                            Quíntuples
                          </th>
                          <th className="py-2 px-2 text-center min-w-18.75 align-middle">
                            Menores
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                          <td className="py-2 px-2 text-center font-semibold text-[11px] text-gray-600 bg-gray-50 border-r border-gray-200">
                            TARIFA
                          </td>
                          {[
                            {
                              field: "tarifa_single",
                              val: entry.tarifa_single,
                            },
                            { field: "tarifa_doble", val: entry.tarifa_doble },
                            {
                              field: "tarifa_triple",
                              val: entry.tarifa_triple,
                            },
                            {
                              field: "tarifa_cuadruple",
                              val: entry.tarifa_cuadruple,
                            },
                            {
                              field: "tarifa_quintuple",
                              val: entry.tarifa_quintuple,
                            },
                            {
                              field: "tarifa_menores",
                              val: entry.tarifa_menores,
                            },
                          ].map(({ field, val }) => (
                            <td key={field} className="p-1">
                              <input
                                type="text"
                                className="w-full text-center py-1 px-1 text-xs rounded focus:bg-white focus:ring-1 focus:ring-primary focus:outline-none font-medium"
                                placeholder="$0"
                                value={val}
                                onChange={(e) =>
                                  updateHotelEntry(
                                    index,
                                    field as keyof HotelEntry,
                                    e.target.value,
                                  )
                                }
                              />
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Pricing type */}
                  <div className="flex flex-wrap justify-center gap-6 items-center pt-2">
                    <label
                      htmlFor={`persona-${index}`}
                      className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      <input
                        type="radio"
                        name={`pricing-${index}`}
                        id={`persona-${index}`}
                        className="w-4 h-4 text-primary focus:ring-primary"
                        checked={entry.pricing_type === "persona"}
                        onChange={() =>
                          updateHotelEntry(index, "pricing_type", "persona")
                        }
                      />
                      <span>Por persona</span>
                    </label>
                    <label
                      htmlFor={`habitacion-${index}`}
                      className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                      <input
                        type="radio"
                        name={`pricing-${index}`}
                        id={`habitacion-${index}`}
                        className="w-4 h-4 text-primary focus:ring-primary"
                        checked={entry.pricing_type === "habitacion"}
                        onChange={() =>
                          updateHotelEntry(index, "pricing_type", "habitacion")
                        }
                      />
                      <span>Por habitación</span>
                    </label>
                  </div>
                </section>
              </div>
            </div>
          </div>
        ))}

        {/* Botón "+" para agregar otro hotel — siempre visible si hay destino */}
        {destino && (
          <button
            type="button"
            onClick={addHotelEntry}
            className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer">
            <span className="text-xl font-bold leading-none">+</span>
            <span className="text-sm font-semibold">Agregar otro hotel</span>
          </button>
        )}

        {/* Lugares de Carga / Excursiones */}
        {!destino ? (
          <p className="text-xs text-gray-500">
            Selecciona un destino para ver las excursiones disponibles.
          </p>
        ) : excursionesFiltered.length === 0 ? (
          <p className="text-xs text-gray-500">
            No hay excursiones registradas para el destino seleccionado.
          </p>
        ) : (
          <ComponentToogleModal
            onSelect={(value) => {
              setSelectedExcursion(value ? value.split(", ") : []);
            }}
            value={selectedExcursion.join(", ")}
            options={excursionesFiltered.map((excursion) => ({
              id: excursion.id || "",
              label: excursion.name || "",
            }))}
            placeholder="Excursiones"
          />
        )}

        {/* Imagen del paquete */}
        <div className="flex flex-col gap-2 my-2">
          {imagePreviewUrl ? (
            <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-gray-300 shadow-md group">
              <img
                src={imagePreviewUrl}
                alt="Vista previa del paquete"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setImageFile(null)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-md transition-all cursor-pointer"
                title="Eliminar imagen">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-[#f1f1f1] border border-gray-300 py-2.5 px-4 rounded-lg shadow-md cursor-pointer hover:bg-gray-200 transition-all font-semibold text-gray-700 text-sm">
                <span>Cargar imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
              <p className="text-xs text-gray-500">
                No hay imagen seleccionada
              </p>
            </div>
          )}
        </div>

        {/* Active y Web */}
        <div className="flex gap-4">
          <ToggleActiveFilters checked={active} onChange={setActive} />
          <ToggleActiveFilters
            checked={web}
            onChange={setWeb}
            label="Mostrar en Web"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold text-center py-3 rounded-xl mt-4 shadow transition-all cursor-pointer">
          {isSubmitting
            ? id
              ? "Modificando paquete..."
              : "Agregando paquete..."
            : `${id ? "Modificar" : "Agregar"} Paquete`}
        </button>
      </form>
    </Container>
  );
}

export default function AgregarPaquetePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader />
        </div>
      }>
      <AgregarPaqueteContent />
    </Suspense>
  );
}
