"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Link from "next/link";
import { Reserva } from "@/app/types";
import { Loader } from "@/app/components/Loader";
import { Trash } from "lucide-react";
import DateInput from "@/app/components/DateComponent";
import toast from "react-hot-toast";
import { parseRoomItem, formatRoomType } from "@/lib/formatRooms";
import { table } from "console";
import ComponentToogleModal from "@/app/components/ComponentToogleModal";
import ModalLayout from "@/app/components/ModalLayout";

interface GastoNoComm {
  id?: string;
  name: string;
  amount: number;
}

export default function ReservaIdPage() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;

  const [reserva, setReserva] = useState<Reserva | null>(null);
  const [lugaresCarga, setLugaresCarga] = useState<{ id: string; name: string }[]>([]);
  const [rooms, setRooms] = useState<string[]>(["DBL_MAT"]);

  // Liquidacion state
  const [liquidacionId, setLiquidacionId] = useState<string | null>(null);
  const [totalReserva, setTotalReserva] = useState<number>(0);
  const [commission, setCommission] = useState<number>(0);
  const [clientCommissionPct, setClientCommissionPct] = useState<number | null>(null);
  const [gastos, setGastos] = useState<GastoNoComm[]>([]);
  const [pagosRealizados, setPagosRealizados] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [openRoomIdx, setOpenRoomIdx] = useState<number | null>(null);
  const [targetRoomIdx, setTargetRoomIdx] = useState<number | null>(null);
  const [openSetRoomType, setOpenSetRoomType] = useState(false);
  const [modalRoomValue, setModalRoomValue] = useState<string>("DBL_MAT_STD");

  // State for Passengers details editing
  const [passengersList, setPassengersList] = useState<any[]>([]);

  // State for Add Room Modal
  const [openAddRoomModal, setOpenAddRoomModal] = useState(false);
  const [newRoomCama, setNewRoomCama] = useState<string>("doble");
  const [newRoomDistribucion, setNewRoomDistribucion] = useState<string>("matrimonial");
  const [newRoomTipo, setNewRoomTipo] = useState<string>("estandar");


  useEffect(() => {
    if (!id || !user?.iweb_client_id) return;

    // Load Reserva and Clients
    apiClient.getReservaById(user.iweb_client_id, id).then((data) => {
      setReserva(data);
      if (data.room_type) {
        try {
          if (data.room_type.startsWith("[")) {
            setRooms(JSON.parse(data.room_type));
          } else if (data.room_type.includes(",")) {
            setRooms(data.room_type.split(",").map((s: string) => s.trim()));
          } else {
            setRooms([data.room_type]);
          }
        } catch {
          setRooms([data.room_type]);
        }
      }

      if (data.reservation_passengers && Array.isArray(data.reservation_passengers)) {
        const mapped = data.reservation_passengers.map((rp: any) => {
          const rawName = rp.nombre_completo || "";
          const parts = rawName.trim().split(" ");
          const first = rp.nombre || (parts.length > 1 ? parts[0] : rawName);
          const last = rp.apellido || (parts.length > 1 ? parts.slice(1).join(" ") : "");
          return {
            ...rp,
            nombre: first,
            apellido: last,
            dni: rp.dni ? String(rp.dni) : "",
            fecha_nacimiento: rp.fecha_nacimiento || rp.date_of_birth || "",
            telefono: rp.telefono || rp.phone || "",
            sexo: rp.sex || rp.sexo || "M",
            pasajero_type: rp.pasajero_type || "ADL",
            lugar_carga_id: rp.lugar_carga_id || ""
          };
        });
        setPassengersList(mapped);
      }

      // Fetch client to get commission %
      if (data.client_id) {
        apiClient.getParameters('get_clients', user.iweb_client_id).then((clients) => {
          if (Array.isArray(clients)) {
            const cl = clients.find((c: any) => c.id === data.client_id);
            if (cl && cl.commission !== null && cl.commission !== undefined) {
              setClientCommissionPct(Number(cl.commission));
            }
          }
        }).catch(() => []);
      }
    }).catch(() => toast.error("Error al cargar la reserva"));

    // Load Lugares de Carga
    apiClient.getParameters('get_lugares_carga', user.iweb_client_id).then((lcs) => {
      setLugaresCarga(lcs.map((l: any) => ({ id: l.id, name: l.name })));
    }).catch(() => []);

    // Load Liquidacion
    apiClient.getLiquidacionByBooking(id).then((liq) => {
      if (liq) {
        setLiquidacionId(liq.id);
        if (liq.total_amout !== null && liq.total_amout !== undefined) setTotalReserva(Number(liq.total_amout));
        if (liq.commission !== null && liq.commission !== undefined) setCommission(Number(liq.commission));
        if (liq.gastos && Array.isArray(liq.gastos)) {
          setGastos(liq.gastos.map((g: any) => ({ id: g.id, name: g.name, amount: Number(g.amount) })));
        }
      }
    }).catch(() => []);

    // Load Pagos for Reserva
    apiClient.getPagosReserva(user.iweb_client_id, id).then((pagos) => {
      if (Array.isArray(pagos)) {
        const total = pagos.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
        setPagosRealizados(total);
      }
    }).catch(() => []);
  }, [id, user?.iweb_client_id]);

  // Dynamic calculations
  const totalNoComisionable = gastos.reduce((acc, g) => acc + (g.amount || 0), 0);
  const totalComisionable = Math.max(0, totalReserva - totalNoComisionable);
  const saldoTotalNeto = totalReserva - pagosRealizados;

  useEffect(() => {
    if (clientCommissionPct !== null && clientCommissionPct !== undefined) {
      const calc = Math.round((totalComisionable * clientCommissionPct) / 100);
      setCommission(calc);
    }
  }, [totalComisionable, clientCommissionPct]);

  if (!reserva) return <Loader />;

  const handleBack = () => {
    router.back();
  };

  const getNombreCompletoReserva = () => {
    const pasajeros = reserva.reservation_passengers?.length;
    if (pasajeros) {
      return pasajeros > 2 ? reserva.nombre_completo + " X" + pasajeros : reserva.nombre_completo;
    }
    return reserva.nombre_completo || reserva.client_nombre || "Reserva";
  };

  // Rooms helpers
  const handleAddRoom = () => {
    setNewRoomCama("doble");
    setNewRoomDistribucion("matrimonial");
    setNewRoomTipo("estandar");
    setOpenAddRoomModal(true);
  };

  const handleAddRoomSubmit = () => {
    let camaDistCode = "DBL_MAT";
    if (newRoomCama === "single") camaDistCode = "SGL";
    else if (newRoomCama === "triple") camaDistCode = "triple_individual";
    else if (newRoomCama === "cuadruple") camaDistCode = "cuadruple_individual";
    else if (newRoomCama === "doble") {
      camaDistCode = newRoomDistribucion === "matrimonial" ? "DBL_MAT" : "doble_individual";
    }
    const tipoCodeMap: Record<string, string> = { estandar: "STD", superior: "SUP", suite: "SUI" };
    const newRoomCode = `${camaDistCode}_${tipoCodeMap[newRoomTipo] || "STD"}`;
    setRooms((prev) => [...prev, newRoomCode]);
    setOpenAddRoomModal(false);
  };

  const handleRemoveRoom = (index: number) => {
    if (rooms.length <= 1) {
      toast.error("La reserva debe conservar al menos una habitación");
      return;
    }
    setRooms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRoomChange = (index: number, val: string) => {
    setRooms((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };


  // Gastos No Comisionables helpers
  const handleAddGasto = () => {
    setGastos((prev) => [...prev, { name: "Nuevo Gasto No Comisionable", amount: 0 }]);
  };

  const handleRemoveGasto = (index: number) => {
    setGastos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGastoChange = (index: number, field: "name" | "amount", value: any) => {
    setGastos((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: field === "amount" ? parseFloat(value) || 0 : value };
      return copy;
    });
  };



  const formatMonto = (num: number) => `$${Math.round(num).toLocaleString("es-AR")}`;

  // Save handler
  const handleSave = async () => {
    if (!user?.iweb_client_id) return;
    setSaving(true);
    try {
      // 1. Update Passengers in backend if passenger details were edited
      const paxSource = passengersList.length > 0 ? passengersList : (reserva.reservation_passengers || []);
      for (const pax of paxSource) {
        if (pax.pasajero_id) {
          await apiClient.updateParameter("update_passengers", pax.pasajero_id, {
            name: pax.nombre || "",
            last_name: pax.apellido || "",
            dni: pax.dni ? Number(pax.dni) : null,
            date_of_birth: pax.fecha_nacimiento || null,
            sex: pax.sexo || null,
            phone: pax.telefono || null
          }, user.iweb_client_id).catch(() => null);
        }
      }

      // 2. Update Reserva with updated passengers list
      const roomTypePayload = JSON.stringify(rooms);
      const passengersPayload = paxSource.map((rp: any) => ({
        pasajero_id: rp.pasajero_id,
        pasajero_type: rp.pasajero_type || "ADL",
        butaca_number: rp.butaca_number,
        butaca_type: rp.butaca_type,
        bus_number: rp.bus_number,
        lugar_carga_id: rp.lugar_carga_id || reserva.lugar_carga_id,
      }));

      await apiClient.updateReserva(user.iweb_client_id, id, {
        active: reserva.active,
        venciment: reserva.venciment,
        observations: reserva.observations,
        room_type: roomTypePayload,
        passengers: passengersPayload,
      });

      // 2. Create or Update Liquidacion
      const liqData = {
        iweb_client_id: user.iweb_client_id,
        booking_id: id,
        total_amout: totalReserva,
        total_commission: totalComisionable,
        commission: commission,
        gastos: gastos.map((g) => ({
          id: g.id,
          name: g.name,
          amount: g.amount,
          iweb_client_id: user.iweb_client_id,
        })),
      };

      if (liquidacionId) {
        await apiClient.updateLiquidacion(liquidacionId, liqData);
      } else {
        const created = await apiClient.createLiquidacion(liqData);
        if (created?.id) setLiquidacionId(created.id);
      }

      toast.success("Reserva y liquidación guardadas correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar los cambios de la reserva");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRoomAccordion = (idx: number) => {
    setOpenRoomIdx((prev) => (prev === idx ? null : idx));
  };

  const handleOpenSetRoomTypeModal = (idx: number) => {
    setTargetRoomIdx(idx);
    const roomStr = rooms[idx] || "DBL_MAT_STD";
    const detail = parseRoomItem(roomStr);
    const camaDistKey = getCamaDistribucionKey(detail);
    const tipoHabKey = getTipoHabitacionKey(detail);
    const tipoCodeMap: Record<string, string> = { estandar: "STD", superior: "SUP", suite: "SUI" };
    setModalRoomValue(`${camaDistKey}_${tipoCodeMap[tipoHabKey] || "STD"}`);
    setOpenSetRoomType(true);
  };

  const handleSubmitRoomType = () => {
    if (targetRoomIdx !== null && modalRoomValue) {
      setRooms((prev) => {
        const copy = [...prev];
        copy[targetRoomIdx] = modalRoomValue;
        return copy;
      });
    }
    setOpenSetRoomType(false);
  };

  const getCamaDistribucionKey = (detail: any): string => {
    const c = detail.camaCode;
    const d = detail.distribucionCode;
    if (c === "DEP") return "depto_x5_individual";
    if (c === "QTL") return "quintuple_individual";
    if (c === "SGL") return "SGL";
    if (c === "TPL") return "triple_individual";
    if (c === "CPL") return "cuadruple_individual";
    if (c === "DBL") {
      if (d === "MAT") return "DBL_MAT";
      return "doble_individual";
    }
    return "DBL_MAT";
  };

  const getTipoHabitacionKey = (detail: any): string => {
    const code = detail.tipoHabitacionCode;
    const label = (detail.tipoHabitacion || "").toLowerCase();
    if (code === "SUP" || label.includes("superior")) return "superior";
    if (code === "SUI" || label.includes("suite")) return "suite";
    return "estandar";
  };

  const handleCamaDistribucionChange = (idx: number, newCamaDist: string) => {
    const currentRoom = rooms[idx] || "DBL_MAT_STD";
    const detail = parseRoomItem(currentRoom);
    const tipoHabKey = getTipoHabitacionKey(detail);
    const tipoCodeMap: Record<string, string> = { estandar: "STD", superior: "SUP", suite: "SUI" };
    const newFullCode = `${newCamaDist}_${tipoCodeMap[tipoHabKey] || "STD"}`;
    setRooms((prev) => {
      const copy = [...prev];
      copy[idx] = newFullCode;
      return copy;
    });
  };

  const handleTipoHabitacionChange = (idx: number, newTipoHab: string) => {
    const currentRoom = rooms[idx] || "DBL_MAT_STD";
    const detail = parseRoomItem(currentRoom);
    const camaDistKey = getCamaDistribucionKey(detail);
    const tipoCodeMap: Record<string, string> = { estandar: "STD", superior: "SUP", suite: "SUI" };
    const newFullCode = `${camaDistKey}_${tipoCodeMap[newTipoHab] || "STD"}`;
    setRooms((prev) => {
      const copy = [...prev];
      copy[idx] = newFullCode;
      return copy;
    });
  };

  const handlePassengerFieldChange = (globalIndex: number, field: string, value: any) => {
    setPassengersList((prev) => {
      const copy = [...prev];
      if (!copy[globalIndex]) return prev;
      const updated = { ...copy[globalIndex], [field]: value };
      if (field === "nombre" || field === "apellido") {
        const n = field === "nombre" ? value : (copy[globalIndex].nombre || "");
        const a = field === "apellido" ? value : (copy[globalIndex].apellido || "");
        updated.nombre_completo = `${n} ${a}`.trim();
      }
      copy[globalIndex] = updated;
      return copy;
    });
  };

  const getPassengersForRoom = (roomIdx: number) => {
    const source = passengersList.length > 0 ? passengersList : (reserva?.reservation_passengers || []);
    if (!source || source.length === 0) return [];

    let startIndex = 0;
    for (let i = 0; i < roomIdx; i++) {
      const roomStr = rooms[i] || "";
      const detail = parseRoomItem(roomStr);
      let cap = 2;
      if (detail.camaCode === "SGL") cap = 1;
      else if (detail.camaCode === "DBL") cap = 2;
      else if (detail.camaCode === "TPL") cap = 3;
      else if (detail.camaCode === "CPL") cap = 4;
      else if (detail.camaCode === "QTL" || detail.camaCode === "DEP") cap = 5;
      startIndex += cap;
    }

    const currentRoomStr = rooms[roomIdx] || "";
    const currentDetail = parseRoomItem(currentRoomStr);
    let currentCap = 2;
    if (currentDetail.camaCode === "SGL") currentCap = 1;
    else if (currentDetail.camaCode === "DBL") currentCap = 2;
    else if (currentDetail.camaCode === "TPL") currentCap = 3;
    else if (currentDetail.camaCode === "CPL") currentCap = 4;
    else if (currentDetail.camaCode === "QTL" || currentDetail.camaCode === "DEP") currentCap = 5;

    return source.slice(startIndex, startIndex + currentCap).map((p: any, offset: number) => ({
      ...p,
      globalIndex: startIndex + offset
    }));
  };

  return (
    <Container>
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <Link href="/web/reservas/result?numero=&cliente=&rango=&periodo=&paquete=&activo=true" className="flex items-center my-3 justify-start gap-3">
        <h2 className="font-semibold text-secondary underline">Cancelar</h2>
      </Link>

      <div className="flex flex-col w-full max-w-6xl mt-10 mx-auto text-black text-lg items-center gap-3">
        <p className="font-semibold text-center">Modificar reserva</p>
        <div className="relative flex w-full items-center justify-center">
          <p className="font-bold text-center text-xl">Datos de la reserva</p>
          <Link
            href={`/web/reservas/liquidacion/${id}`}
            className="absolute right-0 underline font-bold italic text-end"
          >
            Ver liquidación
          </Link>
        </div>
      </div>

      <section className="max-w-6xl flex flex-col justify-center gap-10 mx-auto my-7 items-center w-full text-black">
        {/* SECCIÓN 1: DATOS GENERALES */}
        <section className="w-full bg-white px-10 border-gray-900 rounded-xl shadow-md py-10 shadow-gray-500 p-4 flex flex-col gap-5">
          <div className="flex items-center w-full">
            <p className="font-medium w-1/3 text-lg">Número de reserva</p>
            <input
              type="text"
              value={reserva?.codigo_reserva || ""}
              disabled
              className="border border-gray-200 px-5 font-semibold shadow-gray-400 shadow-md flex-1 rounded-xl p-2 bg-gray-50"
            />
          </div>
          <div className="flex items-center w-full">
            <p className="font-medium w-1/3 text-lg">Título de reserva</p>
            <input
              type="text"
              value={getNombreCompletoReserva() ?? ''}
              disabled
              className="border border-gray-200 text-gray-500 px-5 font-semibold shadow-md shadow-gray-400 flex-1 rounded-xl p-2 bg-gray-50"
            />
          </div>
          <div className="flex items-center w-full">
            <p className="font-medium w-1/3 text-lg">Estado</p>
            <select
              value={reserva?.active ? 1 : 0}
              onChange={(e) => setReserva({ ...reserva, active: e.target.value === "1" })}
              className="border border-gray-200 px-5 font-semibold shadow-md shadow-gray-400 flex-1 rounded-xl p-2 bg-white"
            >
              <option value={1}>OK</option>
              <option value={0}>CXL</option>
            </select>
          </div>
          <div className="flex items-center w-full">
            <p className="font-medium w-1/3 text-lg">Cliente</p>
            <input
              type="text"
              value={reserva?.client_nombre || "Cliente General"}
              disabled
              className="border border-gray-200 px-5 font-semibold shadow-md shadow-gray-400 flex-1 rounded-xl p-2 bg-gray-50"
            />
          </div>
          <div className="flex items-center w-full">
            <p className="font-medium w-1/2 text-lg">Vencimiento</p>
            <DateInput
              placeholder=""
              value={reserva?.venciment || ""}
              onChange={(date) => {
                setReserva({
                  ...reserva,
                  venciment: date,
                });
              }}
            />
          </div>
          <div className="flex flex-col gap-3 w-full">
            <p className="font-medium text-lg">Observaciones</p>
            <textarea
              value={reserva?.observations || ""}
              onChange={(e) => setReserva({ ...reserva, observations: e.target.value })}
              className="border border-gray-200 px-5 font-semibold shadow-md shadow-gray-400 flex-1 rounded-xl p-2 bg-white"
              rows={3}
            />
          </div>
        </section>


        {/* SECCIÓN 3: HABITACIONES */}
        <hr className="bg-gray-400 border-gray-400 h-0.5 w-full max-w-2xl mx-auto" />
        <p className="font-bold flex-1 text-lg text-center">Habitaciones</p>
        <section className="w-full bg-white px-10 border-gray-200 rounded-xl shadow-md py-10 shadow-gray-400 p-4 flex flex-col gap-5">
          <div className="flex flex-col gap-4 w-full">
            {rooms.map((roomType, idx) => {
              const detail = parseRoomItem(roomType);
              const roomPassengers = getPassengersForRoom(idx);

              return (
                <div key={idx} className="flex relative flex-col md:flex-row items-start md:items-center font-medium gap-4 p-4 ">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
                    <div className="flex items-center gap-2">
                      <p
                        className="text-black font-semibold py-2.5 px-4 rounded-lg"
                      >
                        {getCamaDistribucionKey(detail)}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleToggleRoomAccordion(idx)}
                        className={`transform transition-transform cursor-pointer ${openRoomIdx === idx ? 'rotate-90' : '-rotate-90'}`}
                      >
                        <ArrowLeft color="#000" />
                      </button>
                    </div>
                    <select
                      value={getTipoHabitacionKey(detail)}
                      onChange={(e) => handleTipoHabitacionChange(idx, e.target.value)}
                      className="flex flex-wrap gap-2 rounded-lg p-2 font-semibold cursor-pointer"
                    >
                      <option value="estandar">Estándar</option>
                      <option value="superior">Superior</option>
                      <option value="suite">Suite</option>
                    </select>
                    {openRoomIdx === idx && (
                      <div className="border border-gray-200 z-20 absolute top-16 left-0 right-0 w-full divide-gray-300 rounded-xl shadow-md shadow-gray-400 p-4 bg-white">
                        <table className="w-full">
                          <thead className="border-b">
                            <tr className="">
                              <th className="p-3 text-center font-medium w-30 text-black">DNI</th>
                              <th className="p-3 text-center font-medium w-40 text-black">Nombre</th>
                              <th className="p-3 text-center font-medium w-40 text-black">Apellido</th>
                              <th className="p-3 text-center font-medium w-40 text-black">Fecha nac.</th>
                              <th className="p-3 text-center font-medium w-40 text-black">Telefono</th>
                              <th className="p-3 text-center font-medium w-40 text-black">Ascenso</th>
                              <th className="p-3 text-center font-medium w-40 text-black">Sexo</th>
                              <th className="p-3 text-center font-medium w-40 text-black">Tipo</th>
                            </tr>
                          </thead>
                          <tbody className="">
                            {roomPassengers.map((p: any) => {
                              const gIdx = p.globalIndex;
                              return (
                                <tr key={gIdx} className="hover:bg-gray-50/50">
                                  <td className="px-2 py-2">
                                    <input
                                      type="text"
                                      value={p.dni || ""}
                                      onChange={(e) => handlePassengerFieldChange(gIdx, "dni", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                                      placeholder="DNI"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="text"
                                      value={p.nombre || ""}
                                      onChange={(e) => handlePassengerFieldChange(gIdx, "nombre", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                                      placeholder="Nombre"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="text"
                                      value={p.apellido || ""}
                                      onChange={(e) => handlePassengerFieldChange(gIdx, "apellido", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                                      placeholder="Apellido"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="date"
                                      value={p.fecha_nacimiento || p.birthday || ""}
                                      onChange={(e) => handlePassengerFieldChange(gIdx, "fecha_nacimiento", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="text"
                                      value={p.telefono || p.phone || ""}
                                      onChange={(e) => handlePassengerFieldChange(gIdx, "telefono", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                                      placeholder="Teléfono"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <select
                                      value={p.lugar_carga_id || ""}
                                      onChange={(e) => handlePassengerFieldChange(gIdx, "lugar_carga_id", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary"
                                    >
                                      <option value="">Seleccionar Ascenso</option>
                                      {lugaresCarga.map((lc: any) => (
                                        <option key={lc.id} value={lc.id}>
                                          {lc.name || lc.nombre || lc.locality}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-2 py-2">
                                    <select
                                      value={p.sexo || p.sex || "M"}
                                      onChange={(e) => handlePassengerFieldChange(gIdx, "sexo", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary"
                                    >
                                      <option value="M">M</option>
                                      <option value="F">F</option>
                                      <option value="X">X</option>
                                    </select>
                                  </td>
                                  <td className="px-2 py-2">
                                    <select
                                      value={p.pasajero_type || p.tipoPax || "ADL"}
                                      onChange={(e) => handlePassengerFieldChange(gIdx, "pasajero_type", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary"
                                    >
                                      <option value="ADL">ADL</option>
                                      <option value="CHD">CHD</option>
                                      <option value="INF">INF</option>
                                    </select>
                                  </td>
                                </tr>
                              );
                            })}
                            {roomPassengers.length === 0 && (
                              <tr>
                                <td colSpan={8} className="px-6 text-center py-4 text-gray-500 font-medium">
                                  No hay pasajeros registrados para esta habitación.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                        <div className="flex justify-end py-2 px-5 items-end w-full">
                          <button
                            type="button"
                            onClick={() => handleOpenSetRoomTypeModal(idx)}
                            className="w-full text-nowrap font-semibold cursor-pointer hover:underline text-primary text-right"
                          >
                            Modificar Tipo de habitación
                          </button>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveRoom(idx)}
                      className="text-black hover:text-red-700 p-2 rounded-lg transition-colors self-end md:self-auto cursor-pointer"
                      title="Eliminar habitación"
                    >
                      <Trash size={20} />
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddRoom}
              className=" font-bold text-base hover:underline self-start mt-2 flex items-center gap-1 cursor-pointer"
            >
              + Agregar habitación
            </button>
          </div>
        </section>

        {/* SECCIÓN 4: LIQUIDACIÓN */}
        <hr className="bg-gray-400 border-gray-400 h-0.5 w-full max-w-2xl mx-auto" />
        <p className="font-bold flex-1 text-lg text-center">Liquidación</p>
        <section className="w-full bg-white px-10 border-gray-200 rounded-xl shadow-md py-10 shadow-gray-500 p-4 flex flex-col gap-5">
          <div className="flex items-center text-xl justify-between w-full">
            <p className="font-medium">Total de reserva</p>
            <input
              type="number"
              value={totalReserva}
              onChange={(e) => setTotalReserva(parseFloat(e.target.value) || 0)}
              className="font-semibold text-right border border-gray-300 rounded-lg p-1.5 text-lg w-44 bg-white"
            />
          </div>
          <div className="flex items-center text-xl justify-between w-full">
            <p className="font-medium">Total comisionable</p>
            <p className="font-semibold">{formatMonto(totalComisionable)}</p>
          </div>
          <div className="flex items-center text-xl justify-between w-full">
            <p className="font-medium">
              Comisión {clientCommissionPct !== null && clientCommissionPct !== undefined ? `(${clientCommissionPct}%)` : ""}
            </p>
            <input
              type="number"
              value={commission}
              onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
              className="font-semibold text-right border border-gray-300 rounded-lg p-1.5 text-lg w-44 bg-white"
            />
          </div>
          <div className="flex items-center text-xl justify-between w-full mt-4">
            <p className="font-medium">Pagos realizados</p>
            <p className="font-semibold text-green-600">{formatMonto(pagosRealizados)}</p>
          </div>
          <hr className="bg-gray-400 border-gray-400 h-0.5 w-full mx-auto" />

          <div className="flex items-center text-xl justify-between w-full">
            <p className="font-bold">Saldo total neto</p>
            <p className="font-bold text-primary text-2xl">{formatMonto(saldoTotalNeto)}</p>
          </div>
        </section>

        {/* SECCIÓN 5: GASTOS NO COMISIONABLES */}
        <hr className="bg-gray-400 border-gray-500 h-0.5 w-full max-w-2xl mx-auto" />
        <p className="font-bold flex-1 text-lg text-center">Gastos no comisionables</p>
        <section className="w-full bg-white px-10 border-gray-900 rounded-xl shadow-md py-10 shadow-gray-500 p-4 flex flex-col gap-5">
          {gastos.map((gasto, index) => (
            <div key={index} className="flex items-center text-xl justify-between w-full gap-4">
              <input
                type="text"
                value={gasto.name}
                onChange={(e) => handleGastoChange(index, "name", e.target.value)}
                className="font-medium border border-gray-300 rounded-lg p-2 text-base flex-1 bg-white"
                placeholder="Nombre del gasto"
              />
              <div className="flex gap-4 items-center">
                <input
                  type="number"
                  value={gasto.amount}
                  onChange={(e) => handleGastoChange(index, "amount", e.target.value)}
                  className="font-semibold border border-gray-300 rounded-lg p-2 text-base w-36 text-right bg-white"
                  placeholder="Monto"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveGasto(index)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash size={20} />
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddGasto}
            className="flex items-center text-lg justify-start font-bold text-primary hover:underline mt-2"
          >
            + Agregar gasto no comisionable
          </button>
          <hr className="bg-gray-400 border-gray-400 h-0.5 w-full max-w-2xl mx-auto" />
          <div className="flex items-center text-xl justify-between w-full">
            <p className="font-medium">Total no comisionable</p>
            <p className="font-semibold">{formatMonto(totalNoComisionable)}</p>
          </div>
        </section>
      </section>

      {openSetRoomType && (
        <ModalLayout
          onSubmit={handleSubmitRoomType}
          setModalOpen={setOpenSetRoomType}
        ><section className="flex flex-col gap-5">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="Tranett"
                className="w-20"
              />
            </div>
            <p className="text-white text-center font-bold text-base">
              Modificar Habitación #{targetRoomIdx !== null ? targetRoomIdx + 1 : ""}
            </p>
            <table className="w-full text-xs text-center text-white border-collapse">
              <thead className="sticky top-0 bg-gray-700">
                <tr>
                  <th className="py-1.5 px-2 font-semibold">Hotel</th>
                  <th className="py-1.5 px-2 text-center font-semibold">Tipo de Habitación</th>
                </tr>
              </thead>
              <tbody className="bg-gray-600 py-2">
                <tr className="py-2 h-10">
                  <th className="px-2 font-semibold">{reserva?.hotel_nombre || "Garden"}</th>
                  <th>
                    <select
                      value={modalRoomValue}
                      onChange={(e) => setModalRoomValue(e.target.value)}
                      className="bg-gray-600 border border-gray-500 rounded-lg p-1.5 w-44 text-right cursor-pointer text-white font-medium"
                    >
                      <option value="DBL_MAT_STD">DBL MAT (Estándar)</option>
                      <option value="DBL_MAT_SUP">DBL MAT (Superior)</option>
                      <option value="DBL_MAT_SUI">DBL MAT (Suite)</option>
                      <option value="doble_individual_STD">Doble Individual (Estándar)</option>
                      <option value="doble_individual_SUP">Doble Individual (Superior)</option>
                      <option value="SGL_STD">SGL (Estándar)</option>
                      <option value="SGL_SUI">SGL (Suite)</option>
                      <option value="triple_individual_STD">Triple Individual (Estándar)</option>
                      <option value="cuadruple_individual_STD">Cuádruple Individual (Estándar)</option>
                      <option value="quintuple_individual_STD">Quíntuple Individual (Estándar)</option>
                      <option value="depto_x5_individual_STD">Depto x5 Individual (Estándar)</option>
                      <option value="depto_x5_individual_SUP">Depto x5 Individual (Superior)</option>
                      <option value="depto_x5_individual_SUI">Depto x5 Individual (Suite)</option>
                      <option value="depto_x5_individual_estandar">depto_x5_individual_estandar</option>
                      <option value="depto_x5_individual_suite">depto_x5_individual_suite</option>
                      <option value="doble_matrimonial_estandar">doble_matrimonial_estandar</option>
                      <option value="doble_individual_estandar">doble_individual_estandar</option>
                      <option value="simple_individual_estandar">simple_individual_estandar</option>
                    </select>
                  </th>
                </tr>
              </tbody>
            </table>
          </section>
        </ModalLayout>
      )}

      {openAddRoomModal && (
        <ModalLayout
          onSubmit={handleAddRoomSubmit}
          setModalOpen={setOpenAddRoomModal}
        >
          <section className="flex flex-col gap-5">
            <div className="flex justify-center">
              <img
                src="/logo.png"
                alt="Tranett"
                className="w-20"
              />
            </div>
            <p className="text-white text-center font-bold text-base">
              Agregar Nueva Habitación
            </p>
            <table className="w-full text-xs text-center text-white border-collapse">
              <thead className="sticky top-0 bg-gray-700">
                <tr>
                  <th className="py-1.5 px-2 font-semibold">Hotel</th>
                  <th className="py-1.5 px-2 font-semibold">Tipo de Cama</th>
                  <th className="py-1.5 px-2 font-semibold">Distribución</th>
                  <th className="py-1.5 px-2 font-semibold">Categoría</th>
                </tr>
              </thead>
              <tbody className="bg-gray-600 py-2">
                <tr className="py-2 h-12">
                  <th className="px-2 font-semibold">{reserva?.hotel_nombre || "Garden"}</th>
                  <th className="px-1">
                    <select
                      value={newRoomCama}
                      onChange={(e) => setNewRoomCama(e.target.value)}
                      className="bg-gray-600 border border-gray-500 rounded-lg p-1.5 w-full text-center cursor-pointer text-white font-medium"
                    >
                      <option value="single">Single</option>
                      <option value="doble">Doble</option>
                      <option value="triple">Triple</option>
                      <option value="cuadruple">Cuádruple</option>
                      <option value="quintuple">Quíntuple</option>
                      <option value="depto_x5">Depto x5</option>
                    </select>
                  </th>
                  <th className="px-1">
                    <select
                      value={newRoomDistribucion}
                      onChange={(e) => setNewRoomDistribucion(e.target.value)}
                      className="bg-gray-600 border border-gray-500 rounded-lg p-1.5 w-full text-center cursor-pointer text-white font-medium"
                    >
                      <option value="matrimonial">Matrimonial</option>
                      <option value="twin">Twin / Individual</option>
                    </select>
                  </th>
                  <th className="px-1">
                    <select
                      value={newRoomTipo}
                      onChange={(e) => setNewRoomTipo(e.target.value)}
                      className="bg-gray-600 border border-gray-500 rounded-lg p-1.5 w-full text-center cursor-pointer text-white font-medium"
                    >
                      <option value="estandar">Estándar</option>
                      <option value="superior">Superior</option>
                      <option value="suite">Suite</option>
                    </select>
                  </th>
                </tr>
              </tbody>
            </table>
          </section>
        </ModalLayout>
      )}

      {/* BOTÓN CONTINUAR / GUARDAR */}
      <div className="flex items-center justify-center mx-auto max-w-3xl mb-10">
        <button
          disabled={saving}
          onClick={handleSave}
          className="bg-primary text-white text-xl mx-auto rounded-lg py-3 w-full px-10 hover:bg-blue-700 transition-colors disabled:opacity-50 font-bold shadow-lg"
        >
          {saving ? "Guardando cambios..." : "Continuar / Guardar Reserva"}
        </button>
      </div>
    </Container>
  );
}
