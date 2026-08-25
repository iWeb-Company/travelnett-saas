'use client';

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import { Loader } from "@/app/components/Loader";
import AddVioleta from "@/app/components/icons/AddVioleta";
import { getRoomCapacity } from "@/lib/formatRooms";

function Paso2Content() {
  const searchParams = useSearchParams();
  const r = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [salidaInfo, setSalidaInfo] = useState<any>(null);
  const [paqueteInfo, setPaqueteInfo] = useState<any>(null);

  // Query Parameters from step 1
  const destinoId = searchParams.get("destino") || "";
  const clienteId = searchParams.get("cliente") || "";
  const tipoReserva = searchParams.get("tipo") || "";
  const itemId = searchParams.get("item") || "";
  const itemType = searchParams.get("itemType") || "";
  const salidaId = searchParams.get("salida") || "";
  const paqueteId = searchParams.get("paquete") || "";

  // Traditional Mode Rooms state
  const [rooms, setRooms] = useState<Array<{
    hotel: string;
    tipoCama: string;
    distribucion: string;
    tipoHabitacion: string;
  }>>([
    { hotel: "", tipoCama: "", distribucion: "", tipoHabitacion: "" }
  ]);

  // Bloqueo Mode Unified State
  const [hotelId, setHotelId] = useState("");
  const [roomCounts, setRoomCounts] = useState({
    single: 0,
    doble: 0,
    triple: 0,
    cuadruple: 0,
    quintuple: 0,
  });
  const [bloqueoData, setBloqueoData] = useState({
    cantSemicama: 0,
    cantCama: 0,
    cantLiberados: 0,
    precioPaquete: 0,
    gastosReserva: 0,
  });
  const [tituloReserva, setTituloReserva] = useState("");
  const [venciment, setVenciment] = useState("");
  const [observations, setObservations] = useState("");

  const loadData = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [hotelsData, destData, clientData] = await Promise.all([
        apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_clients", user.iweb_client_id).catch(() => [])
      ]);
      setHotels(hotelsData || []);
      setDestinos(destData || []);
      setClientes(clientData || []);

      const actualSalidaId = salidaId || (itemType === "salida" ? itemId : "");
      const actualPaqueteId = paqueteId || (itemType === "paquete" ? itemId : "");

      if (actualSalidaId) {
        const sal = await apiClient.getSalida(user.iweb_client_id, actualSalidaId).catch(() => null);
        setSalidaInfo(sal);
      }
      if (actualPaqueteId) {
        const pack = await apiClient.getPackage(user.iweb_client_id, actualPaqueteId).catch(() => null);
        setPaqueteInfo(pack);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos del paso 2");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadData();
    }
  }, [user?.iweb_client_id]);

  const handleRoomChange = (index: number, field: string, value: string) => {
    const updated = [...rooms];
    updated[index] = { ...updated[index], [field]: value };
    setRooms(updated);
  };

  const handleAddRoom = () => {
    setRooms([...rooms, { hotel: "", tipoCama: "", distribucion: "", tipoHabitacion: "" }]);
  };

  const handleRemoveRoom = (index: number) => {
    if (rooms.length === 1) return;
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const handleNextTraditional = (e: React.FormEvent) => {
    e.preventDefault();
    for (let i = 0; i < rooms.length; i++) {
      const rm = rooms[i];
      if (!rm.hotel || !rm.tipoCama || !rm.tipoHabitacion) {
        toast.error(`Por favor, completa la configuración de la Habitación ${i + 1}`);
        return;
      }
    }

    const actualSalidaId = salidaId || (itemType === "salida" ? itemId : "");
    const actualPaqueteId = paqueteId || (itemType === "paquete" ? itemId : "");

    const roomsParam = encodeURIComponent(JSON.stringify(rooms));
    r.push(
      `/web/reservas/crear-reserva/paso-3?destino=${destinoId}&cliente=${clienteId}&tipo=${tipoReserva}&item=${itemId}&itemType=${itemType}&salida=${actualSalidaId}&paquete=${actualPaqueteId}&rooms=${roomsParam}`
    );
  };

  const handleBloqueoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.iweb_client_id) return;
    if (!hotelId) {
      toast.error("Por favor, selecciona un hotel para la reserva de bloqueo.");
      return;
    }

    const totalPaxInRooms = (roomCounts.single * 1) + (roomCounts.doble * 2) + (roomCounts.triple * 3) + (roomCounts.cuadruple * 4) + (roomCounts.quintuple * 5);
    const totalSeats = (bloqueoData.cantSemicama || 0) + (bloqueoData.cantCama || 0);

    if (totalPaxInRooms === 0 && totalSeats === 0) {
      toast.error("Por favor agrega al menos una habitación o la cantidad de pasajeros (Semicama / Cama).");
      return;
    }

    if (salidaInfo) {
      const availableSemicama = salidaInfo.semicama_disponibles ?? salidaInfo.semicama ?? 999;
      const availableCama = salidaInfo.cama_disponibles ?? salidaInfo.cama ?? 999;

      if ((bloqueoData.cantSemicama || 0) > availableSemicama) {
        toast.error(`No hay suficientes asientos Semicama disponibles. Disponibles: ${availableSemicama}`);
        return;
      }
      if ((bloqueoData.cantCama || 0) > availableCama) {
        toast.error(`No hay suficientes asientos Cama disponibles. Disponibles: ${availableCama}`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 1. Build room_type list
      const roomTypesList: string[] = [];
      for (let i = 0; i < roomCounts.single; i++) roomTypesList.push("single_individual_estandar");
      for (let i = 0; i < roomCounts.doble; i++) roomTypesList.push("doble_matrimonial_estandar");
      for (let i = 0; i < roomCounts.triple; i++) roomTypesList.push("triple_individual_estandar");
      for (let i = 0; i < roomCounts.cuadruple; i++) roomTypesList.push("cuadruple_individual_estandar");
      for (let i = 0; i < roomCounts.quintuple; i++) roomTypesList.push("depto_x5_individual_estandar");

      const roomTypesJoined = roomTypesList.length > 0
        ? JSON.stringify(roomTypesList)
        : JSON.stringify(["doble_matrimonial_estandar"]);

      // Helper to assign room_index to passengers matching room capacities
      let currentRoomIdx = 0;
      let currentRoomCap = roomTypesList.length > 0 ? getRoomCapacity(roomTypesList[0]) : 2;
      let countInRoom = 0;

      const getNextRoomIndex = () => {
        if (roomTypesList.length === 0) return 0;
        const assigned = currentRoomIdx;
        countInRoom++;
        if (countInRoom >= currentRoomCap && currentRoomIdx < roomTypesList.length - 1) {
          currentRoomIdx++;
          currentRoomCap = getRoomCapacity(roomTypesList[currentRoomIdx]);
          countInRoom = 0;
        }
        return assigned;
      };

      // 2. Generate placeholder passengers with assigned room_index
      const passengersPayload: any[] = [];
      for (let i = 1; i <= (bloqueoData.cantSemicama || 0); i++) {
        const newPass = await apiClient.createParameter("create_passengers", {
          name: "", last_name: "", dni: null, date_of_birth: null, sex: null, phone: null
        }, user.iweb_client_id);
        passengersPayload.push({
          pasajero_id: newPass.id,
          pasajero_type: "ADL",
          butaca_number: null,
          butaca_type: "semicama",
          lugar_carga_id: null,
          room_index: getNextRoomIndex()
        });
      }
      for (let i = 1; i <= (bloqueoData.cantCama || 0); i++) {
        const newPass = await apiClient.createParameter("create_passengers", {
          name: "", last_name: "", dni: null, date_of_birth: null, sex: null, phone: null
        }, user.iweb_client_id);
        passengersPayload.push({
          pasajero_id: newPass.id,
          pasajero_type: "ADL",
          butaca_number: null,
          butaca_type: "cama",
          lugar_carga_id: null,
          room_index: getNextRoomIndex()
        });
      }

      // 3. Client commission
      let clientCommPct = 0;
      const matchedClient = clientes.find((c: any) => c.id === clienteId);
      if (matchedClient && matchedClient.commission !== null && matchedClient.commission !== undefined) {
        clientCommPct = Number(matchedClient.commission) || 0;
      }

      const actualSalidaId = salidaId || (itemType === "salida" ? itemId : null);
      const actualPaqueteId = paqueteId || (itemType === "paquete" ? itemId : null);

      const createdReserva = await apiClient.createReserva(user.iweb_client_id, {
        salida_id: actualSalidaId,
        package_id: actualPaqueteId,
        client_id: clienteId || null,
        hotel_id: hotelId,
        room_type: roomTypesJoined,
        titulo: tituloReserva || null,
        observations: observations || null,
        venciment: venciment || null,
        passengers: passengersPayload,
        commission: clientCommPct,
        liberados: bloqueoData.cantLiberados || 0,
        type: "bloqueo_grupo",
      });

      // 4. Calculate and create Liquidación
      try {
        let precioPaquete = 0;
        let gastosReserva = 0;
        let montoComisionable = 0;
        const totalNonInfantPax = passengersPayload.length || 1;
        const totalCamaPax = (bloqueoData.cantCama || 0);

        if (paqueteInfo) {
          const unitGastos = Number(paqueteInfo.gastos) || 0;
          const unitAdicional = Number(paqueteInfo.adicional) || 0;
          gastosReserva = unitGastos * totalNonInfantPax;
          const adicionalCama = unitAdicional * totalCamaPax;
          montoComisionable = (Number(paqueteInfo.price) || 0) * totalNonInfantPax;
          precioPaquete = montoComisionable + gastosReserva + adicionalCama;
        } else {
          const unitPrice = Number(bloqueoData.precioPaquete) || 0;
          const unitGastos = Number(bloqueoData.gastosReserva) || 0;
          montoComisionable = unitPrice * totalNonInfantPax;
          gastosReserva = unitGastos * totalNonInfantPax;
          precioPaquete = montoComisionable + gastosReserva;
        }

        const calculatedComm = (montoComisionable * clientCommPct) / 100;
        const validGastosReserva = Number(gastosReserva) || 0;

        await apiClient.createLiquidacion({
          iweb_client_id: user.iweb_client_id,
          booking_id: createdReserva.id,
          total_amout: Number(precioPaquete) || 0,
          total_commission: Number(montoComisionable) || 0,
          commission: Number(calculatedComm) || 0,
          gastos: validGastosReserva > 0 ? [{ name: "Gastos de reserva", amount: validGastosReserva, iweb_client_id: user.iweb_client_id }] : []
        });
      } catch (lErr) {
        console.error("Error al crear liquidación en reserva de bloqueo:", lErr);
      }

      toast.success("Reserva de Bloqueo/Grupo creada con éxito");
      r.push(`/web/reservas/result?reserva_id=${createdReserva.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Error al crear la reserva de bloqueo");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isSubmitting) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-3">
        <Loader />
        {isSubmitting && <p className="text-gray-600 font-medium text-sm">Guardando reserva de Bloqueo/Grupo...</p>}
      </div>
    );
  }

  // Status summary labels & destination matching
  const destinoObj = destinos.find((d) => d.id === destinoId || d.name === destinoId || d.nombre === destinoId);
  const destinoNombre = destinoObj?.name || destinoObj?.nombre || (destinoId ? destinoId : "General");
  const clienteObj = clientes.find((c) => c.id === clienteId);
  const clienteNombre = clienteObj?.complete_name || clienteObj?.name_system || (clienteId === "as" ? "En Espera" : "Cliente");
  const fechaSalidaText = salidaInfo?.date_of_out || paqueteInfo?.name || "Fecha a confirmar";
  const siglaText = destinoObj?.sigla || "DEST";

  // Filter hotels:
  const filteredHotels = (() => {
    if (paqueteInfo && paqueteInfo.hotels && paqueteInfo.hotels.length > 0) {
      const packageHotelIds = new Set(
        paqueteInfo.hotels
          .flatMap((ph: any) => [ph.hotel_id, ph.hotel_name, ph.hotel_nombre, ph.id])
          .filter(Boolean)
          .map((val: any) => String(val).trim().toLowerCase())
      );
      return hotels.filter(
        (h) =>
          packageHotelIds.has(String(h.id).trim().toLowerCase()) ||
          (h.name && packageHotelIds.has(String(h.name).trim().toLowerCase())) ||
          (h.nombre && packageHotelIds.has(String(h.nombre).trim().toLowerCase()))
      );
    }
    if (!destinoId) return hotels;
    const subNames = (destinoNombre || "")
      .split(/\s*[/,+]\s*/)
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean);
    const matchingDestinoIds = destinos
      .filter((d: any) => subNames.includes((d.name || d.nombre || "").trim().toLowerCase()))
      .map((d: any) => String(d.id).trim().toLowerCase())
      .filter(Boolean);
    const allowed = new Set([
      String(destinoId).trim().toLowerCase(),
      String(destinoNombre).trim().toLowerCase(),
      ...matchingDestinoIds,
      ...subNames,
    ]);
    return hotels.filter((h) => {
      if (!h.destino) return false;
      const hDest = String(h.destino).trim().toLowerCase();
      return allowed.has(hDest);
    });
  })();

  const renderRoomCounter = (label: string, subLabel: string, key: keyof typeof roomCounts) => (
    <div className="flex items-center justify-between p-3.5 border border-gray-300 rounded-xl bg-white shadow-sm">
      <div className="flex flex-col">
        <span className="font-bold text-gray-800 text-sm">{label}</span>
        <span className="text-xs text-gray-500">{subLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRoomCounts((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }))}
          className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 font-bold text-gray-700 flex items-center justify-center transition cursor-pointer"
        >
          -
        </button>
        <span className="w-6 text-center font-bold text-base text-black">{roomCounts[key]}</span>
        <button
          type="button"
          onClick={() => setRoomCounts((prev) => ({ ...prev, [key]: prev[key] + 1 }))}
          className="w-8 h-8 rounded-full bg-primary hover:bg-blue-700 font-bold text-white flex items-center justify-center transition cursor-pointer"
        >
          +
        </button>
      </div>
    </div>
  );

  return (
    <Container>
      <ToggleSalidas />
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver al menú</h1>
      </Link>
      <Link className="flex items-center my-3 justify-start gap-2" href="/web/reservas">
        <ArrowLeft color="#6005F7" />
        <p className="text-secondary font-semibold md:text-lg">Volver a Reservas</p>
      </Link>
      <Link className="flex items-center my-3 justify-start gap-2" href="/web/reservas/crear-reserva/paso-1">
        <ArrowLeft />
        <p className="text-primary font-semibold md:text-lg">Volver a Paquete / Salida</p>
      </Link>

      <h2 className="font-semibold text-black text-center mx-auto md:text-lg mt-5">
        Crear reserva
      </h2>

      <div className="max-w-2xl mx-auto w-full mt-5 flex flex-col items-center gap-2 text-black">
        {/* Step Tabs */}
        <div className="flex w-full rounded-xl bg-[#A8B8F0] overflow-hidden shadow-md shadow-black/20">
          <div className="flex-1 text-white text-center py-3 font-semibold text-sm md:text-base">
            1. Paquete / Salida
          </div>
          <div className="flex-1 bg-primary rounded-tr-4xl rounded-bl-4xl text-white text-center py-3 font-semibold text-sm md:text-base">
            {tipoReserva === "bloqueo" ? "2. Habitaciones / Datos" : "2. Habitación"}
          </div>
          {tipoReserva === "tradicional" && (
            <div className="flex-1 bg-[#A8B8F0] text-white text-center py-3 font-semibold text-sm md:text-base">
              3. Datos
            </div>
          )}
        </div>

        {/* Current status summary */}
        <div className="flex flex-col gap-2 text-black items-start w-full font-semibold p-4 rounded-xl">
          <p className="text-base font-bold text-primary">{destinoNombre} - {clienteNombre}</p>
          <p className="text-sm font-medium text-gray-700">{fechaSalidaText} - {siglaText}</p>
        </div>

        {/* Form selection by Tipo de Reserva */}
        {tipoReserva === "bloqueo" ? (
          <form onSubmit={handleBloqueoSubmit} className="flex flex-col w-full gap-6 pb-8">
            <h3 className="font-bold text-lg text-primary border-b pb-2">Configuración de Bloqueo / Grupo</h3>

            {/* Hotel Designado */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-700">Hotel Designado</label>
              <select
                className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
                required
              >
                <option value="" disabled>Selecciona un Hotel</option>
                {filteredHotels.map((h: any) => (
                  <option key={h.id} value={h.id}>{h.name || h.nombre}</option>
                ))}
              </select>
            </div>

            {/* Cantidad de habitaciones */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-gray-700">Cantidad de Habitaciones por tipo</label>
              {renderRoomCounter("Singles (SGL)", "1 pasajero por habitación", "single")}
              {renderRoomCounter("Dobles (DBL)", "2 pasajeros por habitación", "doble")}
              {renderRoomCounter("Triples (TPL)", "3 pasajeros por habitación", "triple")}
              {renderRoomCounter("CuÁdruples (CPL)", "4 pasajeros por habitación", "cuadruple")}
              {renderRoomCounter("QuÍntuples (QTL)", "5 pasajeros por habitación", "quintuple")}
            </div>

            {/* Configuración de Asientos y Liberados (Datos del Paso 3) */}
            <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
              <h4 className="font-bold text-base text-gray-800">Pasajeros y Asientos</h4>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">
                  Cantidad de pasajeros Semicama {(salidaInfo?.semicama_disponibles ?? salidaInfo?.semicama) !== undefined && `(Disp: ${salidaInfo?.semicama_disponibles ?? salidaInfo?.semicama})`}
                </label>
                <input
                  type="number"
                  min="0"
                  max={salidaInfo?.semicama_disponibles ?? salidaInfo?.semicama ?? 999}
                  disabled={(salidaInfo?.semicama_disponibles ?? salidaInfo?.semicama) === 0}
                  placeholder={(salidaInfo?.semicama_disponibles ?? salidaInfo?.semicama) === 0 ? "Sin butacas semicama disponibles" : "Cantidad de pasajeros semicama"}
                  value={bloqueoData.cantSemicama}
                  onChange={(e) => setBloqueoData({ ...bloqueoData, cantSemicama: Number(e.target.value) })}
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">
                  Cantidad de pasajeros Cama {(salidaInfo?.cama_disponibles ?? salidaInfo?.cama) !== undefined && `(Disp: ${salidaInfo?.cama_disponibles ?? salidaInfo?.cama})`}
                </label>
                <input
                  type="number"
                  min="0"
                  max={salidaInfo?.cama_disponibles ?? salidaInfo?.cama ?? 999}
                  disabled={(salidaInfo?.cama_disponibles ?? salidaInfo?.cama) === 0}
                  placeholder={(salidaInfo?.cama_disponibles ?? salidaInfo?.cama) === 0 ? "Sin butacas cama disponibles" : "Cantidad de pasajeros cama"}
                  value={bloqueoData.cantCama}
                  onChange={(e) => setBloqueoData({ ...bloqueoData, cantCama: Number(e.target.value) })}
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Cantidad de liberados (opcional)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Cantidad de liberados"
                  value={bloqueoData.cantLiberados}
                  onChange={(e) => setBloqueoData({ ...bloqueoData, cantLiberados: Number(e.target.value) })}
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                />
              </div>

              {!paqueteInfo && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Precio paquete por persona ($)</label>
                    <input
                      type="number"
                      placeholder="Precio por persona"
                      value={bloqueoData.precioPaquete}
                      onChange={(e) => setBloqueoData({ ...bloqueoData, precioPaquete: Number(e.target.value) })}
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Gastos de reserva por persona ($) (opcional)</label>
                    <input
                      type="number"
                      placeholder="Gastos por persona"
                      value={bloqueoData.gastosReserva}
                      onChange={(e) => setBloqueoData({ ...bloqueoData, gastosReserva: Number(e.target.value) })}
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Datos adicionales */}
            <div className="flex flex-col gap-4 pt-4 border-t border-gray-200">
              <h4 className="font-bold text-base text-gray-800">Datos Adicionales</h4>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Título de la Reserva (opcional)</label>
                <input
                  type="text"
                  placeholder="Título personalizado de la reserva"
                  value={tituloReserva}
                  onChange={(e) => setTituloReserva(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Fecha de Vencimiento (opcional)</label>
                <input
                  type="date"
                  value={venciment}
                  onChange={(e) => setVenciment(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Observaciones (opcional)</label>
                <textarea
                  placeholder="Observaciones de la reserva"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary min-h-[80px]"
                />
              </div>
            </div>

            {/* Guardar Reserva / Finalizar */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white text-center font-semibold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer mt-3 disabled:opacity-50"
            >
              {isSubmitting ? "Guardando Reserva..." : "Guardar Reserva"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleNextTraditional} className="flex flex-col w-full gap-8">
            {rooms.map((rm, idx) => (
              <div key={idx} className="flex flex-col gap-4 p-5 rounded-xl relative">
                <div className="flex items-center justify-between border-b pb-2 border-gray-200">
                  <h3 className="font-bold text-lg text-primary">Habitación {idx + 1}</h3>
                  {rooms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(idx)}
                      className="text-red-500 hover:text-red-700 font-bold text-sm"
                    >
                      Eliminar habitación
                    </button>
                  )}
                </div>

                {/* Hotel */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Hotel</label>
                  <select
                    className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={rm.hotel}
                    onChange={(e) => handleRoomChange(idx, "hotel", e.target.value)}
                    required
                  >
                    <option value="" disabled>Selecciona un Hotel</option>
                    {filteredHotels.map((h: any) => (
                      <option key={h.id} value={h.id}>{h.name || h.nombre}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Cama */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Tipo de Cama</label>
                  <select
                    className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={rm.tipoCama}
                    onChange={(e) => handleRoomChange(idx, "tipoCama", e.target.value)}
                    required
                  >
                    <option value="" disabled>Tipo de cama</option>
                    <option value="individual">Single (Individual)</option>
                    <option value="doble">Doble</option>
                    <option value="triple">Triple</option>
                    <option value="cuadruple">Cuádruple</option>
                    <option value="depto_x5">Depto X5</option>
                  </select>
                </div>

                {/* Distribución */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Distribución</label>
                  <select
                    className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={rm.distribucion}
                    onChange={(e) => handleRoomChange(idx, "distribucion", e.target.value)}
                  >
                    <option value="" disabled>Distribución</option>
                    <option value="individual">Twin (Individual)</option>
                    <option value="matrimonial">Mat (Matrimonial)</option>
                  </select>
                </div>

                {/* Tipo de Habitación */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Tipo de Habitación</label>
                  <select
                    className="w-full border border-gray-300 bg-[#E8E8E8] rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    value={rm.tipoHabitacion}
                    onChange={(e) => handleRoomChange(idx, "tipoHabitacion", e.target.value)}
                    required
                  >
                    <option value="" disabled>Tipo de Habitación</option>
                    <option value="estandar">Estándar (STD)</option>
                    <option value="superior">Superior</option>
                    <option value="suite">Suite</option>
                  </select>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={handleAddRoom}
                className="flex items-center gap-2 text-primary font-semibold hover:opacity-85 cursor-pointer"
              >
                <AddVioleta color="#0546f7" />
              </button>
            </div>

            {/* Continuar */}
            <button
              type="submit"
              className="w-full bg-primary text-white text-center font-semibold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer mt-3"
            >
              Continuar
            </button>
          </form>
        )}
      </div>
    </Container>
  );
}

export default function Paso2Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader /></div>}>
      <Paso2Content />
    </Suspense>
  );
}
