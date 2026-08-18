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
import { parseRoomItem, getRoomCapacity } from "@/lib/formatRooms";
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
  const [totalComisionable, setTotalComisionable] = useState<number>(0);
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
  const [modalCommissionOpen, setModalCommissionOpen] = useState(false);
  const [newRoomCama, setNewRoomCama] = useState<string>("doble");
  const [newRoomDistribucion, setNewRoomDistribucion] = useState<string>("matrimonial");
  const [newRoomTipo, setNewRoomTipo] = useState<string>("estandar");


  const [clientesList, setClientesList] = useState<any[]>([]);
  const [modalCamaValue, setModalCamaValue] = useState<string>("doble");
  const [modalDistribucionValue, setModalDistribucionValue] = useState<string>("matrimonial");

  useEffect(() => {
    if (!id || !user?.iweb_client_id) return;

    // Load Clients
    apiClient.getParameters('get_clients', user.iweb_client_id).then((cls) => {
      setClientesList(Array.isArray(cls) ? cls : []);
    }).catch(() => []);

    // Load Reserva and Clients
    apiClient.getReservaById(user.iweb_client_id, id).then((data) => {
      setReserva(data);
      if (data.commission !== null && data.commission !== undefined) {
        setClientCommissionPct(Number(data.commission));
      }
      let parsedRooms: string[] = [];
      if (data.room_type) {
        try {
          parsedRooms = typeof data.room_type === "string" && data.room_type.startsWith("[")
            ? JSON.parse(data.room_type)
            : (data.room_type.includes(",") ? data.room_type.split(",").map((s: string) => s.trim()) : [data.room_type]);
          setRooms(parsedRooms);
        } catch {
          parsedRooms = [data.room_type];
          setRooms(parsedRooms);
        }
      }

      if (data.reservation_passengers && Array.isArray(data.reservation_passengers)) {
        const allIndexesZero = data.reservation_passengers.every((rp: any) => !rp.room_index || rp.room_index === 0);

        let rIdx = 0;
        let rCap = getRoomCapacity(parsedRooms[0] || "");
        let inRoomCount = 0;

        const mapped = data.reservation_passengers.map((rp: any, i: number) => {
          const rawName = rp.nombre_completo || "";
          const parts = rawName.trim().split(" ");
          const first = rp.nombre || (parts.length > 1 ? parts[0] : rawName);
          const last = rp.apellido || (parts.length > 1 ? parts.slice(1).join(" ") : "");

          let assignedRoom = rp.room_index;
          if (assignedRoom === undefined || assignedRoom === null || (allIndexesZero && parsedRooms.length > 1)) {
            if (inRoomCount >= rCap && rIdx < parsedRooms.length - 1) {
              rIdx++;
              rCap = getRoomCapacity(parsedRooms[rIdx] || "");
              inRoomCount = 0;
            }
            assignedRoom = rIdx;
            inRoomCount++;
          }

          return {
            ...rp,
            nombre: first,
            apellido: last,
            dni: rp.dni ? String(rp.dni) : "",
            fecha_nacimiento: rp.fecha_nacimiento || rp.date_of_birth || "",
            telefono: rp.telefono || rp.phone || "",
            butaca: rp.butaca_type || 'Semicama',
            butaca_type: rp.butaca_type || 'semicama',
            sexo: rp.sex || rp.sexo || "M",
            pasajero_type: rp.pasajero_type || "ADL",
            lugar_carga_id: rp.lugar_carga_id || "",
            room_index: assignedRoom !== undefined && assignedRoom !== null ? assignedRoom : 0
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
        const tc = liq.total_commission !== undefined && liq.total_commission !== null ? liq.total_commission : (liq.total_comisionable ?? liq.total_commissionable);
        if (tc !== null && tc !== undefined) setTotalComisionable(Number(tc));
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
  // const totalComisionable = Math.max(0, totalReserva - totalNoComisionable);
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
    setNewRoomCama("DBL");
    setNewRoomDistribucion("matrimonial");
    setNewRoomTipo("estandar");
    setOpenAddRoomModal(true);
  };

  const handleAddRoomSubmit = () => {
    const camaMap: Record<string, string> = {
      SGL: "single", single: "single",
      DBL: "doble", doble: "doble",
      TPL: "triple", triple: "triple",
      CPL: "cuadruple", cuadruple: "cuadruple",
      QTL: "quintuple", quintuple: "quintuple",
      DEP: "depto_x5", depto_x5: "depto_x5",
    };
    const distMap: Record<string, string> = {
      matrimonial: "matrimonial", MAT: "matrimonial",
      twin: "individual", individual: "individual", IND: "individual", TWN: "individual",
    };
    const tipoMap: Record<string, string> = {
      estandar: "estandar", STD: "estandar",
      superior: "superior", SUP: "superior",
      suite: "suite", SUI: "suite",
    };

    const camaKey = camaMap[newRoomCama] || "doble";
    const distKey = camaKey === "single" ? "individual" : (distMap[newRoomDistribucion] || "matrimonial");
    const tipoKey = tipoMap[newRoomTipo] || "estandar";

    const newRoomCode = `${camaKey}_${distKey}_${tipoKey}`;
    const newRoomIndex = rooms.length;
    const capacity = getRoomCapacity(newRoomCode);

    const currentSource = passengersList.length > 0 ? passengersList : (reserva?.reservation_passengers || []);
    const emptyPassengers = Array.from({ length: capacity }, () => ({
      id: null,
      pasajero_id: null,
      room_index: newRoomIndex,
      dni: "",
      nombre: "",
      apellido: "",
      fecha_nacimiento: "",
      telefono: "",
      lugar_carga_id: reserva?.lugar_carga_id || "",
      butaca_type: "semicama",
      butaca: "semicama",
      sexo: "M",
      pasajero_type: "ADL"
    }));

    setPassengersList([...currentSource, ...emptyPassengers]);
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
      const paxSource = passengersList.length > 0 ? passengersList : (reserva.reservation_passengers || []);

      // Validate seating capacity if salida exists
      if (reserva.salida_id) {
        try {
          const salidaInfo = await apiClient.getSalida(reserva.salida_id, user.iweb_client_id);
          if (salidaInfo) {
            const camaReq = paxSource.filter((p: any) => (p.butaca_type || "").toLowerCase() === "cama").length;
            const semicamaReq = paxSource.filter((p: any) => (p.butaca_type || "").toLowerCase() === "semicama").length;

            const prevCama = (reserva.reservation_passengers || []).filter((p: any) => (p.butaca_type || "").toLowerCase() === "cama").length;
            const prevSemicama = (reserva.reservation_passengers || []).filter((p: any) => (p.butaca_type || "").toLowerCase() === "semicama").length;

            const availableCama = (salidaInfo.cama_disponibles || 0) + prevCama;
            const availableSemicama = (salidaInfo.semicama_disponibles || 0) + prevSemicama;

            if (salidaInfo.cama_disponibles !== undefined && camaReq > availableCama) {
              toast.error(`No hay disponibilidad suficiente de butacas CAMA en la salida. Disponibles: ${availableCama}`);
              setSaving(false);
              return;
            }
            if (salidaInfo.semicama_disponibles !== undefined && semicamaReq > availableSemicama) {
              toast.error(`No hay disponibilidad suficiente de butacas SEMICAMA en la salida. Disponibles: ${availableSemicama}`);
              setSaving(false);
              return;
            }
          }
        } catch (e) {
          console.warn("Could not check salida seat availability:", e);
        }
      }

      // 1. Update/Create Passengers in backend
      for (const pax of paxSource) {
        if (!pax.pasajero_id) {
          const createdPax = await apiClient.createParameter("create_passengers", {
            name: pax.nombre || "Pasajero",
            last_name: pax.apellido || "",
            dni: pax.dni ? Number(pax.dni) : null,
            date_of_birth: pax.fecha_nacimiento || null,
            sex: pax.sexo || null,
            phone: pax.telefono || null
          }, user.iweb_client_id);
          if (createdPax?.id) {
            pax.pasajero_id = createdPax.id;
          }
        } else if (pax.pasajero_id) {
          await apiClient.updateParameter("update_passengers", pax.pasajero_id, {
            name: pax.nombre || "",
            last_name: pax.apellido || "",
            dni: pax.dni ? Number(pax.dni) : null,
            date_of_birth: pax.fecha_nacimiento || null,
            butaca_type: pax.butaca_type || null,
            sex: pax.sexo || null,
            phone: pax.telefono || null
          }, user.iweb_client_id).catch(() => null);
        }
      }

      // 2. Update Reserva with updated passengers list including room_index
      const roomTypePayload = JSON.stringify(rooms);
      const passengersPayload = paxSource
        .filter((rp: any) => rp.pasajero_id)
        .map((rp: any) => ({
          pasajero_id: rp.pasajero_id,
          pasajero_type: rp.pasajero_type || "ADL",
          butaca_number: rp.butaca_number,
          butaca_type: rp.butaca_type || "semicama",
          bus_number: rp.bus_number,
          lugar_carga_id: rp.lugar_carga_id || reserva.lugar_carga_id,
          room_index: rp.room_index !== undefined && rp.room_index !== null ? rp.room_index : 0
        }));

      await apiClient.updateReserva(user.iweb_client_id, id, {
        active: reserva.active,
        venciment: reserva.venciment,
        observations: reserva.observations,
        client_id: reserva.client_id,
        commission: clientCommissionPct,
        room_type: roomTypePayload,
        passengers: passengersPayload,
        titulo: reserva.titulo !== undefined ? reserva.titulo : null,
      });

      // 3. Reload updated Liquidacion calculated from backend
      try {
        const updatedLiq = await apiClient.getLiquidacionByBooking(id);
        if (updatedLiq) {
          if (updatedLiq.id) setLiquidacionId(updatedLiq.id);
          if (updatedLiq.total_amout !== null && updatedLiq.total_amout !== undefined) setTotalReserva(Number(updatedLiq.total_amout));
          const tc = updatedLiq.total_commission !== undefined && updatedLiq.total_commission !== null ? updatedLiq.total_commission : (updatedLiq.total_comisionable ?? updatedLiq.total_commissionable);
          if (tc !== null && tc !== undefined) setTotalComisionable(Number(tc));
          if (updatedLiq.commission !== null && updatedLiq.commission !== undefined) setCommission(Number(updatedLiq.commission));
          if (updatedLiq.gastos && Array.isArray(updatedLiq.gastos)) {
            setGastos(updatedLiq.gastos.map((g: any) => ({ id: g.id, name: g.name, amount: Number(g.amount) })));
          }
        }
      } catch (e) {
        console.warn("Could not reload liquidacion:", e);
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
    const roomStr = rooms[idx] || "doble_matrimonial_estandar";
    const detail = parseRoomItem(roomStr);

    if (detail.camaCode === "SGL") setModalCamaValue("single");
    else if (detail.camaCode === "DBL") setModalCamaValue("doble");
    else if (detail.camaCode === "TPL") setModalCamaValue("triple");
    else if (detail.camaCode === "CPL") setModalCamaValue("cuadruple");
    else if (detail.camaCode === "QTL") setModalCamaValue("quintuple");
    else if (detail.camaCode === "DEP") setModalCamaValue("depto_x5");
    else setModalCamaValue("doble");

    setModalDistribucionValue(detail.distribucionCode === "MAT" ? "matrimonial" : "twin");
    setOpenSetRoomType(true);
  };

  const handleSubmitRoomType = () => {
    if (targetRoomIdx !== null) {
      const currentRoom = rooms[targetRoomIdx] || "doble_matrimonial_estandar";
      const detail = parseRoomItem(currentRoom);

      const camaMap: Record<string, string> = {
        single: "single", doble: "doble", triple: "triple",
        cuadruple: "cuadruple", quintuple: "quintuple", depto_x5: "depto_x5",
      };
      const distMap: Record<string, string> = {
        matrimonial: "matrimonial", twin: "individual", individual: "individual",
      };

      const camaKey = camaMap[modalCamaValue] || "doble";
      const distKey = camaKey === "single" ? "individual" : (distMap[modalDistribucionValue] || "matrimonial");
      const tipoKey = getTipoHabitacionKey(detail);

      const newFullCode = `${camaKey}_${distKey}_${tipoKey}`;
      setRooms((prev) => {
        const copy = [...prev];
        copy[targetRoomIdx] = newFullCode;
        return copy;
      });
    }
    setOpenSetRoomType(false);
  };

  const getCamaDistribucionKey = (detail: any): string => {
    const c = detail.camaCode;
    const d = detail.distribucionCode;
    const distText = d === "MAT" ? "Matrimonial" : "Individual";

    if (c === "SGL") return "Single";
    if (c === "DBL") return `Doble ${distText}`;
    if (c === "TPL") return `Triple ${distText}`;
    if (c === "CPL") return `Cuádruple ${distText}`;
    if (c === "QTL") return `Quíntuple ${distText}`;
    if (c === "DEP") return `Depto x5 ${distText}`;
    return `${detail.cama || "Doble"} ${detail.distribucion || "Matrimonial"}`;
  };

  const getTipoHabitacionKey = (detail: any): string => {
    const code = detail.tipoHabitacionCode;
    const label = (detail.tipoHabitacion || "").toLowerCase();
    if (code === "SUP" || label.includes("superior")) return "superior";
    if (code === "SUI" || label.includes("suite")) return "suite";
    return "estandar";
  };

  const handleCamaDistribucionChange = (idx: number, newCamaDist: string) => {
    const currentRoom = rooms[idx] || "doble_matrimonial_estandar";
    const detail = parseRoomItem(currentRoom);

    const camaMap: Record<string, string> = {
      SGL: "single", DBL: "doble", TPL: "triple", CPL: "cuadruple", QTL: "quintuple", DEP: "depto_x5",
    };
    const camaKey = camaMap[detail.camaCode] || "doble";
    const distKey = detail.distribucionCode === "MAT" ? "matrimonial" : "individual";
    const tipoKey = getTipoHabitacionKey(detail);

    const newFullCode = `${camaKey}_${distKey}_${tipoKey}`;
    setRooms((prev) => {
      const copy = [...prev];
      copy[idx] = newFullCode;
      return copy;
    });
  };

  const handleTipoHabitacionChange = (idx: number, newTipoHab: string) => {
    const currentRoom = rooms[idx] || "doble_matrimonial_estandar";
    const detail = parseRoomItem(currentRoom);

    const camaMap: Record<string, string> = {
      SGL: "single", DBL: "doble", TPL: "triple", CPL: "cuadruple", QTL: "quintuple", DEP: "depto_x5",
    };
    const camaKey = camaMap[detail.camaCode] || "doble";
    const distKey = detail.distribucionCode === "MAT" ? "matrimonial" : "individual";
    const tipoKey = newTipoHab.toLowerCase().includes("superior") || newTipoHab === "SUP" ? "superior" : (newTipoHab.toLowerCase().includes("suite") || newTipoHab === "SUI" ? "suite" : "estandar");

    const newFullCode = `${camaKey}_${distKey}_${tipoKey}`;
    setRooms((prev) => {
      const copy = [...prev];
      copy[idx] = newFullCode;
      return copy;
    });
  };

  const handlePassengerFieldChange = (targetPax: any, field: string, value: any) => {
    setPassengersList((prev) => {
      const copy = [...prev];
      const gIdx = targetPax.globalIndex;
      if (gIdx >= 0 && copy[gIdx]) {
        const updated = { ...copy[gIdx], [field]: value };
        if (field === "nombre" || field === "apellido") {
          const n = field === "nombre" ? value : (copy[gIdx].nombre || "");
          const a = field === "apellido" ? value : (copy[gIdx].apellido || "");
          updated.nombre_completo = `${n} ${a}`.trim();
        }
        copy[gIdx] = updated;
        return copy;
      }
      
      const updatedPax = { ...targetPax, [field]: value };
      if (field === "nombre" || field === "apellido") {
        const n = field === "nombre" ? value : (targetPax.nombre || "");
        const a = field === "apellido" ? value : (targetPax.apellido || "");
        updatedPax.nombre_completo = `${n} ${a}`.trim();
      }
      return [...copy, updatedPax];
    });
  };

  const getPassengersForRoom = (roomIdx: number) => {
    const source = passengersList.length > 0 ? passengersList : (reserva?.reservation_passengers || []);
    const roomStr = rooms[roomIdx] || "";
    const cap = getRoomCapacity(roomStr);

    const distinctIndexes = new Set(source.map((p: any) => p.room_index).filter((idx) => idx !== undefined && idx !== null));
    const isUnpartitioned = rooms.length > 1 && distinctIndexes.size <= 1;

    let roomPaxs: any[] = [];
    if (isUnpartitioned) {
      let startIndex = 0;
      for (let i = 0; i < roomIdx; i++) {
        startIndex += getRoomCapacity(rooms[i] || "");
      }
      roomPaxs = source.slice(startIndex, startIndex + cap).map((p: any, offset: number) => ({
        ...p,
        globalIndex: startIndex + offset,
        room_index: roomIdx
      }));
    } else {
      roomPaxs = source
        .map((p: any, idx: number) => ({ ...p, globalIndex: idx }))
        .filter((p: any) => p.room_index === roomIdx);
    }

    if (roomPaxs.length < cap) {
      const missingCount = cap - roomPaxs.length;
      for (let k = 0; k < missingCount; k++) {
        roomPaxs.push({
          id: null,
          pasajero_id: null,
          room_index: roomIdx,
          dni: "",
          nombre: "",
          apellido: "",
          fecha_nacimiento: "",
          telefono: "",
          lugar_carga_id: reserva?.lugar_carga_id || "",
          butaca_type: "semicama",
          butaca: "semicama",
          sexo: "M",
          pasajero_type: "ADL",
          globalIndex: -1
        });
      }
    }

    return roomPaxs;
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
              placeholder={getNombreCompletoReserva() ?? ''}
              value={reserva?.titulo !== undefined && reserva?.titulo !== null ? reserva.titulo : (getNombreCompletoReserva() ?? '')}
              onChange={(e) => setReserva({ ...reserva, titulo: e.target.value })}
              className="border border-gray-200 text-gray-800 px-5 font-semibold shadow-md shadow-gray-400 flex-1 rounded-xl p-2 bg-white focus:outline-none focus:ring-2 focus:ring-primary"
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
            <select
              value={reserva?.client_id || ""}
              onChange={(e) => {
                const newClientId = e.target.value;
                const matched = clientesList.find((c: any) => c.id === newClientId);
                const newComm = matched && matched.commission !== null && matched.commission !== undefined ? Number(matched.commission) : clientCommissionPct;
                setReserva({
                  ...reserva!,
                  client_id: newClientId,
                  client_nombre: matched ? (matched.complete_name || matched.name_system) : ""
                });
                if (newComm !== null && newComm !== undefined) {
                  setClientCommissionPct(newComm);
                }
              }}
              className="border border-gray-200 px-5 font-semibold shadow-md shadow-gray-400 flex-1 rounded-xl p-2 bg-white cursor-pointer"
            >
              <option value="">Seleccionar Cliente</option>
              {clientesList.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.complete_name || c.name_system}
                </option>
              ))}
            </select>
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
                              <th className="p-3 text-center font-medium w-40 text-black">Butaca</th>
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
                                      onChange={(e) => handlePassengerFieldChange(p, "dni", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                                      placeholder="DNI"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="text"
                                      value={p.nombre || ""}
                                      onChange={(e) => handlePassengerFieldChange(p, "nombre", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                                      placeholder="Nombre"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="text"
                                      value={p.apellido || ""}
                                      onChange={(e) => handlePassengerFieldChange(p, "apellido", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                                      placeholder="Apellido"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="date"
                                      value={p.fecha_nacimiento || p.birthday || ""}
                                      onChange={(e) => handlePassengerFieldChange(p, "fecha_nacimiento", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <input
                                      type="text"
                                      value={p.telefono || p.phone || ""}
                                      onChange={(e) => handlePassengerFieldChange(p, "telefono", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary"
                                      placeholder="Teléfono"
                                    />
                                  </td>
                                  <td className="px-2 py-2">
                                    <select
                                      value={p.lugar_carga_id || ""}
                                      onChange={(e) => handlePassengerFieldChange(p, "lugar_carga_id", e.target.value)}
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
                                      value={p.butaca_type || ""}
                                      onChange={(e) => handlePassengerFieldChange(p, "butaca_type", e.target.value)}
                                      className="w-full border border-gray-300 bg-white rounded-lg py-1 px-2 text-center text-xs font-medium text-gray-800 focus:ring-2 focus:ring-primary"
                                    >
                                      <option value="">Seleccionar tipo de Butaca</option>
                                      <option value="semicama">Semicama</option>
                                      <option value="cama">Cama</option>
                                    </select>
                                  </td>
                                  <td className="px-2 py-2">
                                    <select
                                      value={p.sexo || p.sex || "M"}
                                      onChange={(e) => handlePassengerFieldChange(p, "sexo", e.target.value)}
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
                                      onChange={(e) => handlePassengerFieldChange(p, "pasajero_type", e.target.value)}
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
            <input
              type="number"
              value={totalComisionable}
              onChange={(e) => setTotalComisionable(parseFloat(e.target.value) || 0)}
              className="font-semibold text-right border border-gray-300 rounded-lg p-1.5 text-lg w-44 bg-white"
            />
          </div>
          <div className="flex items-center text-xl justify-between w-full">
            <p className="font-medium">
              Comisión <button onClick={() => setModalCommissionOpen(true)} className="hover:underline cursor-pointer">{clientCommissionPct !== null && clientCommissionPct !== undefined ? `(${clientCommissionPct}%)` : ""}</button>
            </p>
            <p className="font-semibold text-right">{formatMonto(commission)}</p>
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
                  <th className="py-1.5 px-2 text-center font-semibold">Tipo de Cama</th>
                  <th className="py-1.5 px-2 text-center font-semibold">Distribución</th>
                </tr>
              </thead>
              <tbody className="bg-gray-600 py-2">
                <tr className="py-2 h-10">
                  <th className="px-2 font-semibold">{reserva?.hotel_nombre || "Garden"}</th>
                  <th>
                    <select
                      value={modalCamaValue}
                      onChange={(e) => setModalCamaValue(e.target.value)}
                      className="bg-gray-600 border border-gray-500 rounded-lg p-1.5 w-full text-center cursor-pointer text-white font-medium"
                    >
                      <option value="single">Single</option>
                      <option value="doble">Doble</option>
                      <option value="triple">Triple</option>
                      <option value="cuadruple">Cuádruble</option>
                      <option value="quintuple">Quíntuple</option>
                      <option value="depto_x5">Depto x5</option>
                    </select>
                  </th>
                  <th>
                    <select
                      value={modalDistribucionValue}
                      onChange={(e) => setModalDistribucionValue(e.target.value)}
                      className="bg-gray-600 border border-gray-500 rounded-lg p-1.5 w-full text-center cursor-pointer text-white font-medium"
                    >
                      <option value="matrimonial">Matrimonial</option>
                      <option value="twin">Individual / Twin</option>
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
                      {/* if (c === "DEP") return "Depto x5 Individual";
    if (c === "QTL") return "Quintuple Individual";
    if (c === "SGL") return "Single";
    if (c === "TPL") return "Triple Individual";
    if (c === "CPL") return "Cuádruple Individual";
    if (c === "DBL") {
      if (d === "MAT") return "Doble Matrimonial";
      return "Doble Individual";
    }
    return "Doble Matrimonial"; */}
                      <option value="SGL">Single</option>
                      <option value="DBL">Doble</option>
                      <option value="TPL">Triple</option>
                      <option value="CPL">Cuádruple</option>
                      <option value="QTL">Quíntuple</option>
                      <option value="DEP">Depto x5</option>
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

      {modalCommissionOpen && (
        <ModalLayout
          setModalOpen={setModalCommissionOpen}
          onSubmit={() => setModalCommissionOpen(false)}
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
              Modificar Comisión de Reserva
            </p>
            <table className="w-full text-xs text-center text-white border-collapse">
              <thead className="sticky top-0 bg-gray-700">
                <tr>
                  <th className="py-1.5 px-2 font-semibold">Comisión (%)</th>
                  <th className="py-1.5 px-2 text-center font-semibold">Valor comisión</th>
                  <th className="py-1.5 px-2 text-center font-semibold">Valor Neto</th>
                </tr>
              </thead>
              <tbody className="bg-gray-600 py-2">
                <tr className="py-2 h-10">
                  <th>
                    <input
                      className="bg-gray-700 border border-gray-400 rounded-lg p-1.5 w-full text-center cursor-pointer text-white font-bold"
                      type="number"
                      value={clientCommissionPct ?? 0}
                      onChange={(e) => setClientCommissionPct(parseFloat(e.target.value) || 0)}
                    />
                  </th>
                  <th className="font-semibold">{formatMonto(commission)}</th>
                  <th className="font-semibold text-green-400">{formatMonto(totalReserva - commission)}</th>
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
