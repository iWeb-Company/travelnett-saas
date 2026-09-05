"use client";

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { FormSkeleton } from "@/app/components/FormSkeleton";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import AddVioleta from "@/app/components/icons/AddVioleta";
import { formatDateDDMMYY } from "@/lib/formatDate";

interface RoomPassenger {
  dni: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  puntoAscenso: string;
  tipoPax: string;
  phone: string;
  tipoButaca?: string;
  isInfoa?: boolean;
}

interface RoomConfig {
  hotel: string;
  tipoCama: string;
  distribucion: string;
  tipoHabitacion: string;
}

function Paso3Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [lugaresCarga, setLugaresCarga] = useState<any[]>([]);
  const [destinos, setDestinos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [hotels, setHotels] = useState<any[]>([]);
  const [salidaInfo, setSalidaInfo] = useState<any>(null);
  const [paqueteInfo, setPaqueteInfo] = useState<any>(null);

  // Query Parameters from previous steps
  const destinoId = searchParams.get("destino") || "";
  const clienteId = searchParams.get("cliente") || "";
  const tipoReserva = searchParams.get("tipo") || "";
  const itemId = searchParams.get("item") || "";
  const itemType = searchParams.get("itemType") || "";
  const salidaIdParam = searchParams.get("salida") || "";
  const paqueteIdParam = searchParams.get("paquete") || "";
  const roomsParam = searchParams.get("rooms") || "";
  const hotelIdParam = searchParams.get("hotel") || "";
  const camaParam = searchParams.get("cama") || "";
  const habitacionParam = searchParams.get("habitacion") || "";

  // Parse rooms array from step 2
  const [roomsConfig, setRoomsConfig] = useState<RoomConfig[]>([]);

  // State for traditional reservation: array of rooms, each containing passengers
  const [roomPassengers, setRoomPassengers] = useState<RoomPassenger[][]>([]);

  // States for general reservation details
  const [tituloReserva, setTituloReserva] = useState("");
  const [fechaVencimiento, setFechaVencimiento] = useState("");

  // States for Bloqueo / Grupo reservation
  const [bloqueoData, setBloqueoData] = useState({
    cantSemicama: 0,
    cantCama: 0,
    cantLiberados: 0,
    precioPaquete: 0,
    gastosReserva: 0,
  });

  const loadData = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const [lcData, destData, cliData, hotData] = await Promise.all([
        apiClient
          .getParameters("get_lugares_carga", user.iweb_client_id)
          .catch(() => []),
        apiClient
          .getParameters("get_destinos", user.iweb_client_id)
          .catch(() => []),
        apiClient
          .getParameters("get_clients", user.iweb_client_id)
          .catch(() => []),
        apiClient
          .getParameters("get_hotels", user.iweb_client_id)
          .catch(() => []),
      ]);
      setLugaresCarga(lcData || []);
      setDestinos(destData || []);
      setClientes(cliData || []);
      setHotels(hotData || []);

      const actualSalidaId =
        salidaIdParam || (itemType === "salida" ? itemId : "");
      let actualPaqueteId =
        paqueteIdParam || (itemType === "paquete" ? itemId : "");

      if (actualSalidaId) {
        const sal = await apiClient
          .getSalida(user.iweb_client_id, actualSalidaId)
          .catch(() => null);
        setSalidaInfo(sal);
      }

      if (!actualPaqueteId && actualSalidaId) {
        const pkgs = await apiClient
          .getPackages(user.iweb_client_id)
          .catch(() => []);
        const matches = pkgs.filter(
          (p: any) => p.dates && p.dates.includes(actualSalidaId),
        );
        if (matches.length === 1) {
          actualPaqueteId = matches[0].id;
        } else if (matches.length > 1) {
          throw new Error("Esta salida tiene varios paquetes. Volvé al paso 1 y elegí uno.");
        }
      }

      if (actualPaqueteId) {
        const pack = await apiClient
          .getPackage(user.iweb_client_id, actualPaqueteId)
          .catch(() => null);
        setPaqueteInfo(pack);
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error al cargar información necesaria");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadData();
    }
  }, [user?.iweb_client_id]);

  // Parse rooms and initialize roomPassengers
  useEffect(() => {
    let parsedRooms: RoomConfig[] = [];
    if (roomsParam) {
      try {
        parsedRooms = JSON.parse(decodeURIComponent(roomsParam));
      } catch (e) {
        console.error("Error parsing rooms param", e);
      }
    }

    if (parsedRooms.length === 0) {
      parsedRooms = [
        {
          hotel: hotelIdParam,
          tipoCama: camaParam || "doble",
          distribucion: "matrimonial",
          tipoHabitacion: habitacionParam || "estandar",
        },
      ];
    }
    setRoomsConfig(parsedRooms);

    // Initialize passengers array for each room according to bed capacity
    const initialByRoom: RoomPassenger[][] = parsedRooms.map((rm) => {
      let count = 1;
      const tc = (rm.tipoCama || "").toLowerCase();
      if (tc.includes("doble")) count = 2;
      else if (tc.includes("triple")) count = 3;
      else if (tc.includes("cuadruple")) count = 4;
      else if (tc.includes("depto_x5") || tc.includes("5")) count = 5;

      return Array.from({ length: count }, () => ({
        dni: "",
        nombre: "",
        apellido: "",
        fechaNacimiento: "",
        puntoAscenso: "",
        phone: "",
        tipoPax: "ADL",
        tipoButaca: "semicama",
        isInfoa: false,
      }));
    });

    setRoomPassengers(initialByRoom);
  }, [roomsParam, hotelIdParam, camaParam, habitacionParam]);

  const handleDniBlur = async (
    roomIdx: number,
    paxIdx: number,
    dniValue: string,
  ) => {
    if (!dniValue || dniValue.trim().length < 6 || !user?.iweb_client_id)
      return;
    const cleanDni = dniValue.trim();
    try {
      const found = await apiClient.getPassengerByDNI(
        user.iweb_client_id,
        cleanDni,
      );
      if (found && found.length > 0) {
        const pax = found[0];
        const formattedBirth = pax.date_of_birth
          ? String(pax.date_of_birth).split("T")[0]
          : "";
        setRoomPassengers((current) => {
          const copy = [...current];
          copy[roomIdx] = [...copy[roomIdx]];
          copy[roomIdx][paxIdx] = {
            ...copy[roomIdx][paxIdx],
            dni: cleanDni,
            nombre: pax.name || pax.nombre || copy[roomIdx][paxIdx].nombre,
            apellido:
              pax.last_name || pax.apellido || copy[roomIdx][paxIdx].apellido,
            fechaNacimiento:
              formattedBirth || copy[roomIdx][paxIdx].fechaNacimiento,
            phone:
              (pax.phone !== undefined && pax.phone !== null && String(pax.phone).trim() !== "")
                ? String(pax.phone).trim()
                : copy[roomIdx][paxIdx].phone,
          };
          return copy;
        });
        toast.success(
          `Pasajero ${pax.name || ""} ${pax.last_name || ""} encontrado`,
        );
      }
    } catch (err) {
      // Silent catch
      toast.error("Error al buscar el pasajero");
    }
  };

  const handlePassengerChange = (
    roomIdx: number,
    paxIdx: number,
    field: keyof RoomPassenger,
    value: string,
  ) => {
    const updated = [...roomPassengers];
    updated[roomIdx] = [...updated[roomIdx]];
    updated[roomIdx][paxIdx] = {
      ...updated[roomIdx][paxIdx],
      [field]: value,
    };
    setRoomPassengers(updated);
  };

  // Add INFOA passenger specifically to a room
  const handleAddInfoa = (roomIdx: number) => {
    const updated = [...roomPassengers];
    updated[roomIdx] = [
      ...updated[roomIdx],
      {
        dni: "",
        nombre: "",
        apellido: "",
        fechaNacimiento: "",
        puntoAscenso: "",
        phone: "",
        tipoPax: "INF",
        tipoButaca: "semicama",
        isInfoa: true,
      },
    ];
    setRoomPassengers(updated);
  };

  const handleRemovePassenger = (roomIdx: number, paxIdx: number) => {
    const updated = [...roomPassengers];
    if (updated[roomIdx].length <= 1 && !updated[roomIdx][paxIdx].isInfoa) {
      toast.error("Cada habitación debe mantener al menos un pasajero.");
      return;
    }
    updated[roomIdx] = updated[roomIdx].filter((_, i) => i !== paxIdx);
    setRoomPassengers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.iweb_client_id) return;

    const actualSalidaId =
      salidaIdParam || (itemType === "salida" ? itemId : null);
    let actualPaqueteId =
      paqueteIdParam || (itemType === "paquete" ? itemId : null);
    if (!actualPaqueteId && paqueteInfo && paqueteInfo.id) {
      actualPaqueteId = paqueteInfo.id;
    }

    // Validation for Bloqueo mode
    if (tipoReserva === "bloqueo") {
      if (
        (bloqueoData.cantSemicama || 0) === 0 &&
        (bloqueoData.cantCama || 0) === 0
      ) {
        toast.error(
          "Por favor ingresa la cantidad de pasajeros (Semicama o Cama) para la reserva de bloqueo.",
        );
        return;
      }
      if (salidaInfo) {
        const availableSemicama =
          salidaInfo.semicama_disponibles ?? salidaInfo.semicama ?? 999;
        const availableCama =
          salidaInfo.cama_disponibles ?? salidaInfo.cama ?? 999;

        if (bloqueoData.cantSemicama > availableSemicama) {
          toast.error(
            `No hay suficientes asientos Semicama. Disponibles: ${availableSemicama}`,
          );
          return;
        }
        if (bloqueoData.cantCama > availableCama) {
          toast.error(
            `No hay suficientes asientos Cama. Disponibles: ${availableCama}`,
          );
          return;
        }
      }
    } else {
      // Validation for Tradicional mode
      if (salidaInfo) {
        let reqCama = 0;
        let reqSemicama = 0;
        for (let rIdx = 0; rIdx < roomPassengers.length; rIdx++) {
          for (let pIdx = 0; pIdx < roomPassengers[rIdx].length; pIdx++) {
            const p = roomPassengers[rIdx][pIdx];
            if (!p.isInfoa) {
              const bType = (p.tipoButaca || "").toLowerCase();
              if (bType === "cama") {
                reqCama++;
              } else {
                reqSemicama++;
              }
            }
          }
        }

        const availableSemicama =
          salidaInfo.semicama_disponibles ?? salidaInfo.semicama ?? 999;
        const availableCama =
          salidaInfo.cama_disponibles ?? salidaInfo.cama ?? 999;

        if (reqSemicama > availableSemicama) {
          toast.error(
            `No hay suficientes asientos Semicama disponibles en la salida. Disponibles: ${availableSemicama}`,
          );
          return;
        }
        if (reqCama > availableCama) {
          toast.error(
            `No hay suficientes asientos Cama disponibles en la salida. Disponibles: ${availableCama}`,
          );
          return;
        }
      }

      for (let rIdx = 0; rIdx < roomPassengers.length; rIdx++) {
        for (let pIdx = 0; pIdx < roomPassengers[rIdx].length; pIdx++) {
          const p = roomPassengers[rIdx][pIdx];
          if (p.isInfoa) {
            if (!p.nombre || !p.apellido || !p.fechaNacimiento) {
              toast.error(
                `Por favor completa Nombre, Apellido y Fecha de Nacimiento del INFOA en Habitación ${rIdx + 1}`,
              );
              return;
            }
          } else {
            if (!p.dni || !p.nombre || !p.apellido || !p.fechaNacimiento) {
              toast.error(
                `Por favor completa todos los datos del Pasajero ${pIdx + 1} en Habitación ${rIdx + 1}`,
              );
              return;
            }
          }
        }
      }
    }

    setLoading(true);
    try {
      if (!actualPaqueteId || !actualSalidaId) throw new Error("Seleccioná un paquete y una salida para reservar");
      const capacities = await apiClient.getHotelAvailability(user.iweb_client_id, actualPaqueteId);
      const requested: Record<string, number> = {};
      if (tipoReserva === "bloqueo") {
        requested[hotelIdParam] = (bloqueoData.cantSemicama || 0) + (bloqueoData.cantCama || 0);
      } else {
        roomPassengers.forEach((passengers, index) => {
          const hotel = roomsConfig[index]?.hotel || hotelIdParam;
          requested[hotel] = (requested[hotel] || 0) + passengers.length;
        });
      }
      for (const [hotel, count] of Object.entries(requested)) {
        const cap = capacities.find(c => c.hotel_id === hotel && c.salida_id === actualSalidaId);
        if (cap?.capacidad == null) throw new Error("Cupo hotelero sin configurar para esta salida");
        if (count > cap.disponible) throw new Error(`Cupo hotelero insuficiente. Disponibles: ${cap.disponible}`);
      }
      const passengersPayload: any[] = [];
      const allPassengersList: any[] = [];

      if (tipoReserva === "bloqueo") {
        // Generar pasajeros sin datos (placeholders) para la cantidad de Semicama
        for (let i = 1; i <= (bloqueoData.cantSemicama || 0); i++) {
          const newPass = await apiClient.createParameter(
            "create_passengers",
            {
              name: "",
              last_name: "",
              dni: null,
              date_of_birth: null,
              sex: null,
              phone: null,
            },
            user.iweb_client_id,
          );

          passengersPayload.push({
            pasajero_id: newPass.id,
            pasajero_type: "ADL",
            butaca_number: null,
            butaca_type: "semicama",
            lugar_carga_id: null,
          });

          allPassengersList.push({
            nombre: "Pasajero Semicama",
            apellido: `${i}`,
            dni: "-",
            fechaNacimiento: "",
            puntoAscenso: "",
          });
        }

        // Generar pasajeros sin datos (placeholders) para la cantidad de Cama
        for (let i = 1; i <= (bloqueoData.cantCama || 0); i++) {
          const newPass = await apiClient.createParameter(
            "create_passengers",
            {
              name: "",
              last_name: "",
              dni: null,
              date_of_birth: null,
              sex: null,
              phone: null,
            },
            user.iweb_client_id,
          );

          passengersPayload.push({
            pasajero_id: newPass.id,
            pasajero_type: "ADL",
            butaca_number: null,
            butaca_type: "cama",
            lugar_carga_id: null,
          });

          allPassengersList.push({
            nombre: "Pasajero Cama",
            apellido: `${i}`,
            dni: "-",
            fechaNacimiento: "",
            puntoAscenso: "",
          });
        }
      } else {
        // Modo Tradicional
        for (let rIdx = 0; rIdx < roomPassengers.length; rIdx++) {
          for (const p of roomPassengers[rIdx]) {
            let passengerId = "";

            if (p.dni) {
              const existing = await apiClient
                .getPassengerByDNI(user.iweb_client_id, p.dni)
                .catch(() => []);
              if (existing && existing.length > 0) {
                passengerId = existing[0].id;
                const cleanPhone = (p.phone && String(p.phone).trim() !== "")
                  ? String(p.phone).trim()
                  : (existing[0].phone || null);
                await apiClient
                  .updateParameter(
                    "update_passengers",
                    passengerId,
                    {
                      name: p.nombre || existing[0].name,
                      last_name: p.apellido || existing[0].last_name,
                      dni: p.dni ? Number(p.dni) : existing[0].dni,
                      date_of_birth: p.fechaNacimiento || existing[0].date_of_birth || null,
                      phone: cleanPhone,
                    },
                    user.iweb_client_id,
                  )
                  .catch((err) => console.error("Error updating existing pax:", err));
              }
            }

            if (!passengerId) {
              const cleanPhone = (p.phone && String(p.phone).trim() !== "")
                ? String(p.phone).trim()
                : null;
              const newPass = await apiClient.createParameter(
                "create_passengers",
                {
                  name: p.nombre,
                  last_name: p.apellido,
                  dni: p.dni ? Number(p.dni) : null,
                  date_of_birth: p.fechaNacimiento || null,
                  sex: null,
                  phone: cleanPhone,
                },
                user.iweb_client_id,
              );
              passengerId = newPass.id;
            }

            passengersPayload.push({
              pasajero_id: passengerId,
              pasajero_type: p.tipoPax || (p.isInfoa ? "INF" : "ADL"),
              butaca_number: null,
              butaca_type: p.tipoButaca || "semicama",
              lugar_carga_id: p.puntoAscenso || null,
              room_index: rIdx,
              hotel_id: roomsConfig[rIdx]?.hotel || hotelIdParam || null,
              phone: p.phone || null,
            });

            allPassengersList.push({
              nombre: p.nombre,
              apellido: p.apellido,
              dni: p.dni || "-",
              fechaNacimiento: p.fechaNacimiento || "",
              puntoAscenso: p.puntoAscenso || "",
              phone: p.phone || "",
            });
          }
        }
      }

      // Room type representation JSON string array e.g. ["doble_matrimonial_estandar","simple_individual_estandar"]
      const roomTypesJoined = JSON.stringify(
        roomsConfig.map(
          (rm) => `${rm.tipoCama}_${rm.distribucion}_${rm.tipoHabitacion}`,
        ),
      );

      const primaryHotelId = roomsConfig[0]?.hotel || hotelIdParam || null;
      const primaryLugarCargaId = passengersPayload[0]?.lugar_carga_id || null;

      // Fetch client commission if client_id is present
      let clientCommPct = 0;
      const matchedClient =
        clientes.find((c: any) => c.id === clienteId) ||
        (Array.isArray(clientes)
          ? clientes.find((c: any) => c.id === clienteId)
          : null);
      if (
        matchedClient &&
        matchedClient.commission !== null &&
        matchedClient.commission !== undefined
      ) {
        clientCommPct = Number(matchedClient.commission) || 0;
      } else if (clienteId && user?.iweb_client_id) {
        const freshClients = await apiClient
          .getParameters("get_clients", user.iweb_client_id)
          .catch(() => []);
        const fc = Array.isArray(freshClients)
          ? freshClients.find((c: any) => c.id === clienteId)
          : null;
        if (fc && fc.commission !== null && fc.commission !== undefined) {
          clientCommPct = Number(fc.commission) || 0;
        }
      }

      const createdReserva = await apiClient.createReserva(
        user.iweb_client_id,
        {
          salida_id: actualSalidaId,
          package_id: actualPaqueteId,
          client_id: clienteId || null,
          lugar_carga_id: primaryLugarCargaId,
          hotel_id: primaryHotelId,
          room_type: roomTypesJoined,
          observations: tituloReserva || null,
          venciment: fechaVencimiento || null,
          passengers: passengersPayload,
          commission: clientCommPct,
          liberados: bloqueoData.cantLiberados || 0,
          type: tipoReserva === "bloqueo" ? "bloqueo_grupo" : "tradicional",
        },
      );

      // Calculate and save Liquidacion with total_amount, total_commission, and gastos
      try {
        let precioPaquete = 0;
        let gastosReserva = 0;
        let montoComisionable = 0;

        const totalNonInfantPax =
          passengersPayload.filter(
            (p: any) => (p.pasajero_type || "ADL").toUpperCase() !== "INF",
          ).length || 1;
        const totalCamaPax = passengersPayload.filter(
          (p: any) => (p.butaca_type || "").toLowerCase() === "cama",
        ).length;

        if (paqueteInfo) {
          const unitGastos = Number(paqueteInfo.gastos) || 0;
          const unitAdicional = Number(paqueteInfo.adicional) || 0;
          gastosReserva = unitGastos * totalNonInfantPax;
          const adicionalCama = unitAdicional * totalCamaPax;
          const isPorHabitacion = (paqueteInfo.pricing_type || "")
            .toLowerCase()
            .includes("habitacion");
          const defaultPrice = Number(paqueteInfo.price) || 0;

          if (roomsConfig && roomsConfig.length > 0) {
            for (const rm of roomsConfig) {
              const tc = (rm.tipoCama || "").toLowerCase();
              let capacity = 1;
              let tariff = defaultPrice;

              if (tc.includes("doble") || tc.includes("2")) {
                capacity = 2;
                tariff = Number(paqueteInfo.tarifa_doble) || defaultPrice;
              } else if (tc.includes("triple") || tc.includes("3")) {
                capacity = 3;
                tariff = Number(paqueteInfo.tarifa_triple) || defaultPrice;
              } else if (tc.includes("cuadruple") || tc.includes("4")) {
                capacity = 4;
                tariff = Number(paqueteInfo.tarifa_cuadruple) || defaultPrice;
              } else if (tc.includes("quintuple") || tc.includes("5")) {
                capacity = 5;
                tariff = Number(paqueteInfo.tarifa_quintuple) || defaultPrice;
              } else if (
                tc.includes("single") ||
                tc.includes("individual") ||
                tc.includes("1")
              ) {
                capacity = 1;
                tariff = Number(paqueteInfo.tarifa_single) || defaultPrice;
              }

              if (paqueteInfo.hotels && Array.isArray(paqueteInfo.hotels)) {
                const matchedHotel = paqueteInfo.hotels.find(
                  (h: any) => h.hotel_id === rm.hotel || h.id === rm.hotel,
                );
                if (matchedHotel) {
                  if (
                    (tc.includes("doble") || tc.includes("2")) &&
                    matchedHotel.tarifa_doble
                  ) {
                    tariff = Number(matchedHotel.tarifa_doble);
                  } else if (
                    (tc.includes("triple") || tc.includes("3")) &&
                    matchedHotel.tarifa_triple
                  ) {
                    tariff = Number(matchedHotel.tarifa_triple);
                  } else if (
                    (tc.includes("cuadruple") || tc.includes("4")) &&
                    matchedHotel.tarifa_cuadruple
                  ) {
                    tariff = Number(matchedHotel.tarifa_cuadruple);
                  } else if (
                    (tc.includes("quintuple") || tc.includes("5")) &&
                    matchedHotel.tarifa_quintuple
                  ) {
                    tariff = Number(matchedHotel.tarifa_quintuple);
                  } else if (
                    (tc.includes("single") ||
                      tc.includes("individual") ||
                      tc.includes("1")) &&
                    matchedHotel.tarifa_single
                  ) {
                    tariff = Number(matchedHotel.tarifa_single);
                  }
                }
              }

              if (tariff === 0) {
                tariff = defaultPrice;
              }

              if (isPorHabitacion) {
                montoComisionable += tariff;
              } else {
                montoComisionable += tariff * capacity;
              }
            }
          } else {
            montoComisionable = defaultPrice * totalNonInfantPax;
          }

          if (paqueteInfo.comisionable) {
            montoComisionable += adicionalCama;
          }
        } else {
          precioPaquete = Number(bloqueoData.precioPaquete) || 0;
          gastosReserva =
            (Number(bloqueoData.gastosReserva) || 0) * totalNonInfantPax;
          let totalPax = 0;
          if (tipoReserva === "bloqueo") {
            const rawSeats =
              (Number(bloqueoData.cantSemicama) || 0) +
              (Number(bloqueoData.cantCama) || 0);
            totalPax = Math.max(
              0,
              rawSeats - (Number(bloqueoData.cantLiberados) || 0),
            );
          }
          if (totalPax === 0 && tipoReserva !== "bloqueo") {
            totalPax = totalNonInfantPax;
          }
          if (
            totalPax === 0 &&
            passengersPayload.length > 0 &&
            tipoReserva !== "bloqueo"
          ) {
            totalPax = passengersPayload.length;
          }
          montoComisionable = precioPaquete * totalPax;
        }

        const totalBruto =
          montoComisionable +
          gastosReserva +
          (paqueteInfo?.comisionable
            ? 0
            : (Number(paqueteInfo?.adicional) || 0) * totalCamaPax);

        const commAmount = (montoComisionable * clientCommPct) / 100;

        const liqPayload: any = {
          iweb_client_id: user.iweb_client_id,
          booking_id: createdReserva.id,
          total_amout: totalBruto,
          total_commission: montoComisionable,
          commission: commAmount,
          gastos:
            gastosReserva > 0
              ? [
                  {
                    name: "Gastos administrativos",
                    amount: gastosReserva,
                    iweb_client_id: user.iweb_client_id,
                  },
                ]
              : [],
        };

        if (createdReserva?.id) {
          await apiClient.createLiquidacion(liqPayload).catch(() => {
            return apiClient
              .getLiquidacionByBooking(createdReserva.id)
              .then((existingLiq) => {
                if (existingLiq?.id) {
                  return apiClient.updateLiquidacion(
                    existingLiq.id,
                    liqPayload,
                  );
                }
              });
          });
        }
        console.log("Reserva creada", createdReserva);
        console.log("Liquidacion creada", liqPayload);
      } catch (liqErr) {
        console.error("Error creating liquidacion for reservation:", liqErr);
      }

      toast.success("¡Reserva creada con éxito!");
      router.push(`/web/reservas`);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Error al registrar la reserva");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <FormSkeleton />
        <p className="mt-4 font-semibold md:text-xl">
          Registrando reserva, pasajeros, liquidacion...
        </p>
      </div>
    );
  }

  // Dynamic header data
  const destinoObj = destinos.find((d) => d.id === destinoId);
  const clienteObj = clientes.find((c) => c.id === clienteId);
  const destinoNombre = destinoObj?.name || destinoObj?.nombre || "General";
  const clienteNombre =
    clienteObj?.complete_name ||
    clienteObj?.name_system ||
    (clienteId === "as" ? "En Espera" : "Cliente sin asignar");
  const fechaSalidaText =
    salidaInfo?.date_of_out ? formatDateDDMMYY(salidaInfo.date_of_out) : paqueteInfo?.name || "Fecha a confirmar";
  const siglaText = destinoObj?.sigla || "DEST";

  return (
    <Container>
      <ToggleSalidas />
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver al menú</h1>
      </Link>
      <Link
        className="flex items-center my-3 justify-start gap-2"
        href="/web/reservas">
        <ArrowLeft color="#6005F7" />
        <p className="text-secondary font-semibold md:text-lg">
          Volver a Reservas
        </p>
      </Link>
      <Link
        className="flex items-center my-3 justify-start gap-2"
        href={`/web/reservas/crear-reserva/paso-2?destino=${destinoId}&cliente=${clienteId}&tipo=${tipoReserva}&item=${itemId}&itemType=${itemType}`}>
        <ArrowLeft />
        <p className="text-primary font-semibold md:text-lg">
          Volver a Habitación
        </p>
      </Link>

      <h2 className="font-semibold text-black text-center mx-auto md:text-lg mt-5">
        Crear reserva
      </h2>

      <div className="max-w-2xl mx-auto w-full mt-5 flex flex-col items-center gap-5 text-black">
        {/* Step Tabs */}
        <div className="flex w-full rounded-xl bg-[#5782F7] overflow-hidden shadow-md shadow-black/20">
          <div className="flex-1 text-white text-center py-3 font-semibold text-sm md:text-base">
            1. Paquete / Salida
          </div>
          <div className="flex-1 text-white text-center py-3 font-semibold text-sm md:text-base">
            2. Habitación
          </div>
          <div className="flex-1 bg-primary rounded-tl-4xl text-white text-center py-3 font-semibold text-sm md:text-base">
            3. Datos
          </div>
        </div>

        {/* Dynamic Header Summary */}
        <div className="flex flex-col gap-2 text-black items-start w-full font-medium p-4 rounded-xl ">
          <p className="text-base font-medium">
            {destinoNombre} - {clienteNombre}
          </p>
          {tipoReserva === "tradicional" && (
            <p className="text-sm font-medium">
              {fechaSalidaText} ({siglaText})
            </p>
          )}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full gap-6 px-2">
          {/* Datos Generales (Título de Reserva & Fecha de Vencimiento) */}

          {tipoReserva === "bloqueo" ? (
            <div className="flex flex-col gap-4 p-5 rounded-xl ">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">
                  Cantidad de pasajeros Semicama{" "}
                  {(salidaInfo?.semicama_disponibles ??
                    salidaInfo?.semicama) !== undefined &&
                    `(Disp: ${salidaInfo?.semicama_disponibles ?? salidaInfo?.semicama})`}
                </label>
                <input
                  type="number"
                  min="0"
                  max={
                    salidaInfo?.semicama_disponibles ??
                    salidaInfo?.semicama ??
                    999
                  }
                  disabled={
                    (salidaInfo?.semicama_disponibles ??
                      salidaInfo?.semicama) === 0
                  }
                  placeholder={
                    (salidaInfo?.semicama_disponibles ??
                      salidaInfo?.semicama) === 0
                      ? "Sin butacas semicama disponibles"
                      : "Cantidad de pasajeros semicama"
                  }
                  value={bloqueoData.cantSemicama}
                  onChange={(e) =>
                    setBloqueoData({
                      ...bloqueoData,
                      cantSemicama: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">
                  Cantidad de pasajeros Cama{" "}
                  {(salidaInfo?.cama_disponibles ?? salidaInfo?.cama) !==
                    undefined &&
                    `(Disp: ${salidaInfo?.cama_disponibles ?? salidaInfo?.cama})`}
                </label>
                <input
                  type="number"
                  min="0"
                  max={salidaInfo?.cama_disponibles ?? salidaInfo?.cama ?? 999}
                  disabled={
                    (salidaInfo?.cama_disponibles ?? salidaInfo?.cama) === 0
                  }
                  placeholder={
                    (salidaInfo?.cama_disponibles ?? salidaInfo?.cama) === 0
                      ? "Sin butacas cama disponibles"
                      : "Cantidad de pasajeros cama"
                  }
                  value={bloqueoData.cantCama}
                  onChange={(e) =>
                    setBloqueoData({
                      ...bloqueoData,
                      cantCama: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">
                  Cantidad de liberados (opcional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Cantidad de liberados"
                  value={bloqueoData.cantLiberados}
                  onChange={(e) =>
                    setBloqueoData({
                      ...bloqueoData,
                      cantLiberados: Number(e.target.value),
                    })
                  }
                  className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                />
              </div>

              {/* Package price and reservation fees are hidden if a package was selected */}
              {!paqueteInfo && (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">
                      Precio paquete
                    </label>
                    <input
                      type="number"
                      placeholder="Precio paquete"
                      value={bloqueoData.precioPaquete}
                      onChange={(e) =>
                        setBloqueoData({
                          ...bloqueoData,
                          precioPaquete: Number(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">
                      Gastos de reserva (opcional)
                    </label>
                    <input
                      type="number"
                      placeholder="Gastos de reserva"
                      value={bloqueoData.gastosReserva}
                      onChange={(e) =>
                        setBloqueoData({
                          ...bloqueoData,
                          gastosReserva: Number(e.target.value),
                        })
                      }
                      className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4  p-5 rounded-xl ">
                <div className="flex flex-col gap-1">
                  Fecha de vencimiento (opcional)
                </div>

                <div className="flex flex-col gap-1">
                  <input
                    type="date"
                    value={fechaVencimiento}
                    onChange={(e) => setFechaVencimiento(e.target.value)}
                    className="w-full border border-gray-300 bg-white rounded-lg py-2.5 px-4 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              {roomsConfig.map((rm, rIdx) => {
                const hotelObj = hotels.find((h) => h.id === rm.hotel);
                const hotelName = hotelObj?.name || hotelObj?.nombre || "Hotel";
                const camaLabel = (rm.tipoCama || "doble")
                  .toUpperCase()
                  .slice(0, 3);
                const distLabel =
                  rm.distribucion === "matrimonial" ? "MAT" : "TWIN";
                const habLabel = (rm.tipoHabitacion || "estandar")
                  .toUpperCase()
                  .slice(0, 3);
                const roomTitle = `${hotelName} - ${camaLabel} ${distLabel} - ${habLabel}`;

                return (
                  <div
                    key={rIdx}
                    className="flex flex-col gap-4  p-5 rounded-xl ">
                    <h3 className="font-medium text-base pb-2">{roomTitle}</h3>
                    {roomPassengers[rIdx]?.map((passenger, pIdx) => (
                      <div
                        key={pIdx}
                        className="flex flex-col gap-3 py-4  rounded-lg  relative">
                        <div className="flex justify-between items-center">
                          <p className="font-medium text-sm">
                            {passenger.isInfoa
                              ? `Pasajero INFOA (Bebé)`
                              : `Pasajero ${pIdx + 1}`}
                          </p>
                        </div>

                        {/* DNI */}
                        <div className="flex flex-col gap-1">
                          <input
                            placeholder="DNI"
                            className="w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                            value={passenger.dni}
                            onChange={(e) =>
                              handlePassengerChange(
                                rIdx,
                                pIdx,
                                "dni",
                                e.target.value,
                              )
                            }
                            onBlur={(e) =>
                              handleDniBlur(rIdx, pIdx, e.target.value)
                            }
                            type="text"
                          />
                        </div>

                        {/* Nombre */}
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            required
                            className="w-full border border-gray-300 uppercase bg-white rounded-lg py-2 px-3 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                            placeholder="Nombre"
                            value={passenger.nombre}
                            onChange={(e) =>
                              handlePassengerChange(
                                rIdx,
                                pIdx,
                                "nombre",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        {/* Apellido */}
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            required
                            className="w-full border border-gray-300 uppercase bg-white rounded-lg py-2 px-3 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                            placeholder="apellido"
                            value={passenger.apellido}
                            onChange={(e) =>
                              handlePassengerChange(
                                rIdx,
                                pIdx,
                                "apellido",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        {/* Fecha de Nacimiento */}
                        <div className="flex flex-col gap-1">
                          <input
                            type="date"
                            required
                            className="w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                            value={passenger.fechaNacimiento}
                            onChange={(e) =>
                              handlePassengerChange(
                                rIdx,
                                pIdx,
                                "fechaNacimiento",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <input
                            type="text"
                            required
                            className="w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                            placeholder="Teléfono"
                            value={passenger.phone}
                            onChange={(e) =>
                              handlePassengerChange(
                                rIdx,
                                pIdx,
                                "phone",
                                e.target.value,
                              )
                            }
                          />
                        </div>

                        {/* Punto de Ascenso (Solo para no-INFOA) */}
                        {!passenger.isInfoa && (
                          <div className="flex flex-col gap-1">
                            <select
                              className="w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                              value={passenger.puntoAscenso}
                              onChange={(e) =>
                                handlePassengerChange(
                                  rIdx,
                                  pIdx,
                                  "puntoAscenso",
                                  e.target.value,
                                )
                              }>
                              <option value="">Punto de ascenso</option>
                              {lugaresCarga.map((l: any) => (
                                <option key={l.id} value={l.id}>
                                  {l.name || l.nombre || l.lugar}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Tipo de Butaca (Solo para no-INFOA) */}
                        {!passenger.isInfoa && (
                          <div className="flex flex-col gap-1">
                            <select
                              className="w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-gray-800 font-medium focus:ring-2 focus:ring-primary"
                              value={passenger.tipoButaca || "semicama"}
                              onChange={(e) =>
                                handlePassengerChange(
                                  rIdx,
                                  pIdx,
                                  "tipoButaca",
                                  e.target.value,
                                )
                              }>
                              <option value="semicama">Semicama</option>
                              <option value="cama">Cama</option>
                            </select>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Botón Agregar INFOA por Habitación */}
                    <button
                      type="button"
                      onClick={() => handleAddInfoa(rIdx)}
                      className="py-2 px-4 flex items-center gap-2 font-semibold justify-end rounded-lg text-sm text-primary  transition-all cursor-pointer  border-primary">
                      <span>Agregar INFOA</span>
                      <AddVioleta color="#0546f7" />
                    </button>
                  </div>
                );
              })}
            </>
          )}

          {/* Confirmar */}
          <button
            type="submit"
            className="w-full bg-primary text-white text-center font-semibold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer mt-3">
            Confirmar Reserva
          </button>
        </form>
      </div>
    </Container>
  );
}

export default function Paso3Page() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <FormSkeleton />
        </div>
      }>
      <Paso3Content />
    </Suspense>
  );
}
