'use client';

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
import { Destino, Excursion, Hotel, Package, Period, Regimen, Salida } from "@/app/types";
import DateInput from "@/app/components/DateComponent";

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
  const [hotel, setHotel] = useState("");
  const [fecha, setFecha] = useState("");
  const [selectedSalidaIds, setSelectedSalidaIds] = useState<string[]>([]);
  const [nuevaFechaSalida, setNuevaFechaSalida] = useState("");
  // const [isCreatingSalida, setIsCreatingSalida] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [regimen, setRegimen] = useState("");
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
  const [openHotel, setOpenHotel] = useState(false);
  const [selectedExcursion, setSelectedExcursion] = useState<string[]>([]);

  // Additional Hotel sub-form state
  const [hotelNoches, setHotelNoches] = useState("");
  const [hotelFechaIn, setHotelFechaIn] = useState("");
  const [hotelFechaOut, setHotelFechaOut] = useState("");
  const [hotelFechaSalidaMas, setHotelFechaSalidaMas] = useState("");
  const [hotelRegimenId, setHotelRegimenId] = useState("");
  const [tarifaSingle, setTarifaSingle] = useState("");
  const [comisionableSingle, setComisionableSingle] = useState(false);
  const [tarifaDoble, setTarifaDoble] = useState("");
  const [tarifaTriple, setTarifaTriple] = useState("");
  const [tarifaCuadruple, setTarifaCuadruple] = useState("");
  const [tarifaQuintuple, setTarifaQuintuple] = useState("");
  const [tarifaMenores, setTarifaMenores] = useState("");
  const [pricingType, setPricingType] = useState("persona");

  const loadParameters = async () => {
    if (!user?.iweb_client_id) return;
    const currentKey = `${user.iweb_client_id}_${id || 'new'}`;
    if (loadedClientIdRef.current === currentKey) return;
    loadedClientIdRef.current = currentKey;

    try {
      const [params, pkgsData, salidasData] = await Promise.all([
        apiClient.getAllParameters(user.iweb_client_id).catch(() => ({ destinos: [], hotels: [], excursions: [], periods: [], regimenes: [] })),
        apiClient.getPackages(user.iweb_client_id).catch(() => []),
        apiClient.getSalidas(user.iweb_client_id).catch(() => []),
      ]);

      setDestinos(params.destinos || []);
      setHoteles(params.hotels || []);
      setExcursiones(params.excursions || []);
      setPeriodos(params.periods || []);
      setRegimenes(params.regimenes || []);
      setSalidas(salidasData);

      // If we are editing, populate existing package from context
      if (id) {
        const pkg = pkgsData.find((p: Package) => p.id === id);
        if (pkg) {
          setNombre(pkg.name || "");
          setSubtitulo(pkg.subtitle || "");
          setDescripcion(pkg.description || "");
          setDestino(pkg.destino || "");
          setHotel(pkg.hotel || "");
          if (pkg.hotel) setOpenHotel(true);
          if (pkg.dates && pkg.dates.length > 0) {
            setSelectedSalidaIds(pkg.dates);
            const firstDate = pkg.dates[0];
            const matchedSal = salidasData.find((s: Salida) => s.id === firstDate);
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
          setHotelNoches(pkg.hotel_noches?.toString() || "");
          setHotelFechaIn(pkg.hotel_fecha_in || "");
          setHotelFechaOut(pkg.hotel_fecha_out || "");
          setHotelFechaSalidaMas(pkg.hotel_fecha_salida_mas || "");
          setHotelRegimenId(pkg.hotel_regimen_id || "");
          setTarifaSingle(pkg.tarifa_single?.toString() || "");
          setComisionableSingle(pkg.comisionable_single ?? false);
          setTarifaDoble(pkg.tarifa_doble?.toString() || "");
          setTarifaTriple(pkg.tarifa_triple?.toString() || "");
          setTarifaCuadruple(pkg.tarifa_cuadruple?.toString() || "");
          setTarifaQuintuple(pkg.tarifa_quintuple?.toString() || "");
          setTarifaMenores(pkg.tarifa_menores?.toString() || "");
          setPricingType(pkg.pricing_type || "persona");
          if (pkg.excursiones) {
            setSelectedExcursion(pkg.excursiones.split(", "));
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

  // const handleAddNuevaSalida = async () => {
  //   if (!nuevaFechaSalida) {
  //     toast.error("Por favor selecciona una fecha");
  //     return;
  //   }
  //   if (!user?.iweb_client_id) return;
  //   try {
  //     setIsCreatingSalida(true);
  //     const payload = {
  //       date_of_out: nuevaFechaSalida,
  //       destino: destino || "",
  //       periodo: periodo || "",
  //       active: true
  //     };
  //     const newSalida = await apiClient.createSalida(user.iweb_client_id, payload);
  //     if (newSalida && newSalida.id) {
  //       setSalidas((prev) => [...prev, newSalida]);
  //       setSelectedSalidaIds((prev) => [...prev, newSalida.id]);
  //       setNuevaFechaSalida("");
  //       toast.success("Nueva fecha de salida creada y seleccionada");
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     toast.error("Error al crear la fecha de salida");
  //   } finally {
  //     setIsCreatingSalida(false);
  //   }
  // };

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

  const salidasFiltered = useMemo(() => {
    if (!destino) return salidas;
    const selectedDestinoObj = destinos.find((d: Destino) => d.id === destino || d.name === destino);
    return salidas.filter((s: Salida) =>
      s.destino === destino ||
      (selectedDestinoObj && (s.destino === selectedDestinoObj.id || s.destino === selectedDestinoObj.name))
    );
  }, [salidas, destino, destinos]);

  const hotelesFiltered = useMemo(() => {
    if (!destino) return [];
    const selectedDestinoObj = destinos.find((d: Destino) => d.id === destino || d.name === destino);
    return hoteles.filter((h: Hotel) =>
      h.destino === destino ||
      (selectedDestinoObj && (h.destino === selectedDestinoObj.id || h.destino === selectedDestinoObj.name))
    );
  }, [hoteles, destino, destinos]);

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadParameters();
    }
  }, [user?.iweb_client_id]);

  const handleBack = () => {
    r.back();
  };

  const handleChangeHotel = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setHotel(val);
    if (val) {
      setOpenHotel(true);
    } else {
      setOpenHotel(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (selectedSalidaIds.length === 0) {
      toast.error("Debes seleccionar o crear al menos una fecha de salida para el paquete.");
      return;
    }

    setIsSubmitting(true);

    const processSubmit = (imageUrl: string) => {
      const apiPayload = {
        name: nombre,
        subtitle: subtitulo,
        description: descripcion,
        price: parseInt(precio) || 0,
        gastos: parseInt(gastosAdministrativos || gastosAdmin) || 0,
        adicional: parseInt(adicionalBusCama) || 0,
        destino: destino,
        hotel: hotel,
        regimen: regimen,
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
        hotel_noches: parseInt(hotelNoches) || null,
        hotel_fecha_in: hotelFechaIn || null,
        hotel_fecha_out: hotelFechaOut || null,
        hotel_fecha_salida_mas: hotelFechaSalidaMas || null,
        hotel_regimen_id: hotelRegimenId || null,
        tarifa_single: parseInt(tarifaSingle) || null,
        comisionable_single: comisionableSingle,
        tarifa_doble: parseInt(tarifaDoble) || null,
        tarifa_triple: parseInt(tarifaTriple) || null,
        tarifa_cuadruple: parseInt(tarifaCuadruple) || null,
        tarifa_quintuple: parseInt(tarifaQuintuple) || null,
        tarifa_menores: parseInt(tarifaMenores) || null,
        pricing_type: pricingType,
        excursiones: selectedExcursion.join(", "),
      };

      if (!user?.iweb_client_id) {
        setIsSubmitting(false);
        return;
      }

      if (id) {
        apiClient.updatePackage(user.iweb_client_id, id, apiPayload)
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
        apiClient.createPackage(user.iweb_client_id, apiPayload)
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
      <button onClick={handleBack} className="flex items-center my-3 justify-start gap-3">
        <h2 className="font-semibold text-secondary underline">Cancelar</h2>
      </button>

      <form onSubmit={handleSubmit} className="flex flex-col w-full max-w-3xl mx-auto my-5 gap-5 p-6 text-black">
        <h2 className="text-black text-center md:text-xl font-semibold mb-3">
          {id ? "Modificar" : "Agregar"} paquete
        </h2>

        {/* Destino */}

        <div className="flex flex-col gap-1">
          <select
            className="text-gray-500 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={destino}
            onChange={(e) => {
              setDestino(e.target.value);
              setHotel("");
              setOpenHotel(false);
            }}
            required
          >
            <option value="" disabled selected>Destino</option>
            {destinos.map((d: Destino) => (
              <option key={d.id} value={d.id}>{d.name}</option>
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
        <div className="flex flex-col gap-3  bg-[#f8f9fa] border border-gray-300 rounded-xl shadow-md">

          {/* Modal selector de fechas precargadas */}
          <ComponentToogleModal
            placeholder="Fechas de salida"
            value={selectedSalidaIds.join(", ")}
            onSelect={(val) => {
              const ids = val ? val.split(", ").filter(Boolean) : [];
              setSelectedSalidaIds(ids);
            }}
            options={salidasFiltered.map((s: Salida) => ({
              id: s.id,
              label: `${s.date_of_out || 'Sin fecha'}`
            }))}
          />
        </div>
        {/* Periodo */}
        <div className="flex flex-col gap-1">
          <select
            className="text-gray-500 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            required
          >
            <option value="" disabled>Periodo</option>
            {periodos.map((p: Period) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        {/* Precio y moneda */}
        <div className="flex gap-2">
          <input type="number" placeholder="Precio" className="text-gray-500 flex-1 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            required
          />
          <select
            className="text-gray-500 bg-[#f1f1f1] font-semibold border border-gray-300 py-2.5 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={moneda}
            onChange={(e) => setMoneda(e.target.value)}
            required
          >
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
            required
          >
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
            required
          />
          <select
            className="text-gray-500 bg-[#f1f1f1] font-semibold border border-gray-300 py-2.5 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={monedaAdicionalBusCama}
            onChange={(e) => setMonedaAdicionalBusCama(e.target.value)}
            required
          >
            <option value="pesos">Pesos</option>
            <option value="dolares">Dólares</option>
          </select>
        </div>
        {/* Comisionable */}
        <div className="flex items-center justify-center gap-2">
          <p className="text-xl">Comisionable</p>
          <input type="checkbox" className="w-4 h-4" checked={comisionable} onChange={(e) => setComisionable(e.target.checked)} />
        </div>
        {/* Hotel */}
        <div className="flex flex-col gap-1">
          <select
            className="text-gray-500 bg-[#f1f1f1] font-semibold w-full border border-gray-300 py-2.5 px-4 rounded-lg shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
            value={hotel}
            onChange={handleChangeHotel}
          >
            {!destino ? (
              <option value="">Hotel</option>
            ) : hotelesFiltered.length === 0 ? (
              <option value="" disabled>No hay hoteles precargados con el destino seleccionado.</option>
            ) : (
              <option value="" disabled>Seleccionar Hotel</option>
            )}
            {hotelesFiltered.map((h: Hotel) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <div
            className={`grid transition-all duration-500 ease-in-out ${openHotel
              ? "grid-rows-[1fr] opacity-100 my-2"
              : "grid-rows-[0fr] opacity-0 my-0 pointer-events-none"
              }`}
          >
            <div className="overflow-hidden">
              <section className="flex flex-col gap-5 border border-gray-200 rounded-xl p-4 sm:p-6 bg-white shadow-sm w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                  <input
                    className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    type="text" placeholder="Cantidad de noches"
                    value={hotelNoches}
                    onChange={(e) => setHotelNoches(e.target.value)}
                  />
                  <DateInput value={hotelFechaIn} onChange={setHotelFechaIn} placeholder="Fecha IN" />
                  <select
                    className="text-gray-800 bg-[#f1f1f1] font-medium w-full border border-gray-300 px-4 py-2.5 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                    value={hotelRegimenId}
                    onChange={(e) => setHotelRegimenId(e.target.value)}
                  >
                    <option value="">Régimen</option>
                    {regimenes.map((regimen: Regimen) => (
                      <option key={regimen.id} value={regimen.id}>{regimen.name}</option>
                    ))}
                  </select>
                  <DateInput value={hotelFechaOut} onChange={setHotelFechaOut} placeholder="Fecha OUT" />
                </div>

                <div className="flex flex-col  sm:flex-row items-start sm:items-center justify-end gap-2  p-3 rounded-lg">
                  <span className="text-sm font-semibold text-gray-700">Fecha de salida +</span>
                  <input
                    type="text"
                    value={hotelFechaSalidaMas}
                    onChange={(e) => setHotelFechaSalidaMas(e.target.value)}
                    className="text-gray-800 bg-white font-medium border border-gray-300 px-3 py-1.5 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
                  />
                </div>

                <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                  <table className="w-full text-xs text-left border-collapse min-w-162.5">
                    <thead className=" text-gray-700 uppercase font-semibold">
                      <tr className="border-b border-gray-200">
                        <th className="py-2 px-2 text-center border-r border-gray-200 bg-gray-200/60 font-bold min-w-[17.5]">TIPO</th>
                        <th className="py-2 px-2 text-center border-r border-gray-200 min-w-[22.5] align-middle">
                          <span className="block font-semibold">Single</span>
                          <div className="flex items-center justify-center gap-1 mt-0.5 font-normal lowercase text-[10px] text-gray-500">
                            <span>50% no comisionable</span>
                            <input
                              type="checkbox"
                              name="comisionable_single"
                              className="w-3 h-3"
                              checked={comisionableSingle}
                              onChange={(e) => setComisionableSingle(e.target.checked)}
                            />
                          </div>
                        </th>
                        <th className="py-2 px-2 text-center border-r border-gray-200 min-w-18.75 align-middle">Dobles</th>
                        <th className="py-2 px-2 text-center border-r border-gray-200 min-w-18.75 align-middle">Triples</th>
                        <th className="py-2 px-2 text-center border-r border-gray-200 min-w-18.75 align-middle">Cuádruples</th>
                        <th className="py-2 px-2 text-center border-r border-gray-200 min-w-18.75 align-middle">Quíntuples</th>
                        <th className="py-2 px-2 text-center min-w-18.75 align-middle">Menores</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      <tr>
                        <td className="py-2 px-2 text-center font-semibold text-[11px] text-gray-600 bg-gray-50 border-r border-gray-200">TARIFA</td>
                        <td className="p-1">
                          <input
                            type="text"
                            className="w-full text-center py-1 px-1 text-xs rounded focus:bg-white focus:ring-1 focus:ring-primary focus:outline-none font-medium"
                            placeholder="$0"
                            value={tarifaSingle}
                            onChange={(e) => setTarifaSingle(e.target.value)}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            className="w-full text-center py-1 px-1 text-xs rounded focus:bg-white focus:ring-1 focus:ring-primary focus:outline-none font-medium"
                            placeholder="$0"
                            value={tarifaDoble}
                            onChange={(e) => setTarifaDoble(e.target.value)}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            className="w-full text-center py-1 px-1 text-xs rounded focus:bg-white focus:ring-1 focus:ring-primary focus:outline-none font-medium"
                            placeholder="$0"
                            value={tarifaTriple}
                            onChange={(e) => setTarifaTriple(e.target.value)}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            className="w-full text-center py-1 px-1 text-xs rounded focus:bg-white focus:ring-1 focus:ring-primary focus:outline-none font-medium"
                            placeholder="$0"
                            value={tarifaCuadruple}
                            onChange={(e) => setTarifaCuadruple(e.target.value)}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            className="w-full text-center py-1 px-1 text-xs rounded focus:bg-white focus:ring-1 focus:ring-primary focus:outline-none font-medium"
                            placeholder="$0"
                            value={tarifaQuintuple}
                            onChange={(e) => setTarifaQuintuple(e.target.value)}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            className="w-full text-center py-1 px-1 text-xs rounded focus:bg-white focus:ring-1 focus:ring-primary focus:outline-none font-medium"
                            placeholder="$0"
                            value={tarifaMenores}
                            onChange={(e) => setTarifaMenores(e.target.value)}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap justify-center gap-6 items-center pt-2">
                  <label htmlFor="persona" className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    <input
                      type="radio"
                      name="pricing"
                      id="persona"
                      className="w-4 h-4 text-primary focus:ring-primary"
                      checked={pricingType === "persona"}
                      onChange={() => setPricingType("persona")}
                    />
                    <span>Por persona</span>
                  </label>
                  <label htmlFor="habitacion" className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    <input
                      type="radio"
                      name="pricing"
                      id="habitacion"
                      className="w-4 h-4 text-primary focus:ring-primary"
                      checked={pricingType === "habitacion"}
                      onChange={() => setPricingType("habitacion")}
                    />
                    <span>Por habitación</span>
                  </label>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Lugares de Carga */}
        {excursiones.length === 0 ? (
          <p className="text-xs text-gray-500">No hay excursiones registradas en parámetros.</p>
        ) : (
          <ComponentToogleModal
            onSelect={(value) => {
              setSelectedExcursion(value ? value.split(", ") : []);
            }}
            value={selectedExcursion.join(", ")}
            options={excursiones.map((excursion) => ({
              id: excursion.id || '',
              label: excursion.name || '',
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
                title="Eliminar imagen"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
              <p className="text-xs text-gray-500">No hay imagen seleccionada</p>
            </div>
          )}
        </div>
        {/* Active y Web */}
        <div className="flex gap-4">
          <ToggleActiveFilters checked={active} onChange={setActive} />
          <ToggleActiveFilters checked={web} onChange={setWeb} label="Mostrar en Web" />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold text-center py-3 rounded-xl mt-4 shadow transition-all cursor-pointer"
        >
          {isSubmitting ? (id ? "Modificando paquete..." : "Agregando paquete...") : `${id ? "Modificar" : "Agregar"} Paquete`}
        </button>
      </form>
    </Container>
  );
}

export default function AgregarPaquetePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader /></div>}>
      <AgregarPaqueteContent />
    </Suspense>
  );
}
