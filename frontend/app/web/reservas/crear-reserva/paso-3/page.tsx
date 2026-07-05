"use client";

import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Loader } from "@/app/components/Loader";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";

interface Passenger {
  dni: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  puntoAscenso: string;
}

function Paso3Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [lugaresCarga, setLugaresCarga] = useState<any[]>([]);

  // Query Parameters from step 2
  const destinoId = searchParams.get("destino") || "";
  const clienteId = searchParams.get("cliente") || "";
  const tipoReserva = searchParams.get("tipo") || "";
  const itemId = searchParams.get("item") || "";
  const itemType = searchParams.get("itemType") || "";
  const hotelId = searchParams.get("hotel") || "";
  const cama = searchParams.get("cama") || "";
  const habitacion = searchParams.get("habitacion") || "";

  // Passengers state
  const [passengers, setPassengers] = useState<Passenger[]>([]);

  const loadLugaresCarga = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const data = await apiClient.getParameters("get_lugares_carga", user.iweb_client_id).catch(() => []);
      setLugaresCarga(data);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar puntos de ascenso");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadLugaresCarga();
    }
  }, [user?.iweb_client_id]);

  // Determine initial passenger count based on room type
  useEffect(() => {
    let count = 1;
    if (habitacion === "doble") count = 2;
    else if (habitacion === "triple") count = 3;
    else if (habitacion === "cuadruple") count = 4;

    const initialPassengers = Array.from({ length: count }, () => ({
      dni: "",
      nombre: "",
      apellido: "",
      fechaNacimiento: "",
      puntoAscenso: "",
    }));
    setPassengers(initialPassengers);
  }, [habitacion]);

  const handlePassengerChange = (index: number, field: keyof Passenger, value: string) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const handleAddPassenger = () => {
    setPassengers([
      ...passengers,
      { dni: "", nombre: "", apellido: "", fechaNacimiento: "", puntoAscenso: "" },
    ]);
  };

  const handleRemovePassenger = (index: number) => {
    if (passengers.length <= 1) {
      toast.error("La reserva debe tener al menos un pasajero.");
      return;
    }
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passengers
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.dni || !p.nombre || !p.apellido || !p.fechaNacimiento) {
        toast.error(`Por favor complete todos los datos obligatorios para el Pasajero ${i + 1}`);
        return;
      }
    }

    if (!user?.iweb_client_id) return;
    setLoading(true);
    try {
      const codigoReserva = `RES-${Math.floor(100000 + Math.random() * 900000)}`;

      for (const p of passengers) {
        // Find or create passenger
        const existing = await apiClient.getPassengerByDNI(user.iweb_client_id, p.dni).catch(() => []);
        let passengerId = "";
        if (existing && existing.length > 0) {
          passengerId = existing[0].id;
        } else {
          const newPass = await apiClient.createParameter("create_passengers", {
            name: p.nombre,
            last_name: p.apellido,
            dni: Number(p.dni),
            date_of_birth: p.fechaNacimiento || null,
            sex: "Masculino",
            phone: null
          }, user.iweb_client_id);
          passengerId = newPass.id;
        }

        // Create reservation
        // If tipoReserva is "bloqueo", salida_id is not set. Otherwise use itemId
        const isBloqueo = tipoReserva === "bloqueo";
        const salidaId = isBloqueo ? null : (itemType === "salida" ? itemId : null);

        await apiClient.createReserva(user.iweb_client_id, {
          passenger_id: passengerId,
          salida_id: salidaId,
          codigo_reserva: codigoReserva,
          client_id: clienteId || null,
          edad_categoria: "ADL",
          lugar_carga_id: p.puntoAscenso || null,
          hotel_id: hotelId || null,
          room_type: habitacion || null,
        });
      }

      toast.success("¡Reserva confirmada con éxito!");
      router.push(
        `/web/reservas/result?success=true&destino=${destinoId}&cliente=${clienteId}&tipo=${tipoReserva}&hotel=${hotelId}&cama=${cama}&habitacion=${habitacion}&pasajeros=${encodeURIComponent(JSON.stringify(passengers))}`
      );
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar la reserva");
    } finally {
      setLoading(false);
    }
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
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold md:text-xl">Volver al menú</h1>
      </Link>
      <Link
        className="flex items-center my-3 justify-start gap-2"
        href={"/web/reservas"}>
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

        {/* Current summary */}
        <div className="flex flex-col gap-2 text-black items-start w-full font-semibold bg-gray-50 border border-gray-200 p-4 rounded-xl">
          <p className="text-sm"><span className="text-primary font-bold">{destinoId ? "Mar del Plata" : "General"} - Mio Turismo</span></p>
          <p className="text-sm"><span className="text-primary font-bold">25/06/2026 - MDQ</span></p>
          <p className="text-sm">Tipo: <span className="text-primary font-bold">{tipoReserva === "bloqueo" ? "Bloqueo Grupal" : "Reserva Tradicional"}</span></p>
          <p className="text-sm">Hotel Garden - DBL MAT</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col w-full gap-5 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <input type="text" placeholder="Titulo de la reserva" className="w-full border border-gray-300 bg-gray-100 rounded-lg py-2.5 px-4 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          {passengers.map((passenger, index) => (
            <div key={index} className="flex flex-col gap-4 p-4 border border-gray-200 rounded-lg bg-gray-50/50 relative">
              <div className="flex justify-between items-center">
                <p className="font-bold text-gray-800">Pasajero {index + 1}</p>
                {passengers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemovePassenger(index)}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold"
                  >
                    Eliminar
                  </button>
                )}
              </div>

              {/* DNI */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">DNI *</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ingrese DNI"
                  value={passenger.dni}
                  onChange={(e) => handlePassengerChange(index, "dni", e.target.value)}
                />
              </div>

              {/* Nombre */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Nombre *</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ingrese Nombre"
                  value={passenger.nombre}
                  onChange={(e) => handlePassengerChange(index, "nombre", e.target.value)}
                />
              </div>

              {/* Apellido */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Apellido *</label>
                <input
                  type="text"
                  required
                  className="w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ingrese Apellido"
                  value={passenger.apellido}
                  onChange={(e) => handlePassengerChange(index, "apellido", e.target.value)}
                />
              </div>

              {/* Fecha de Nacimiento */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  required
                  className="w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={passenger.fechaNacimiento}
                  onChange={(e) => handlePassengerChange(index, "fechaNacimiento", e.target.value)}
                />
              </div>

              {/* Punto de ascenso */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Punto de ascenso / Embarque</label>
                <select
                  className="w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  value={passenger.puntoAscenso}
                  onChange={(e) => handlePassengerChange(index, "puntoAscenso", e.target.value)}
                >
                  <option value="">Seleccione lugar de carga</option>
                  {lugaresCarga.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.name || l.nombre || l.lugar}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}

          {/* Add passenger button */}
          <button
            type="button"
            onClick={handleAddPassenger}
            className="w-full py-2 px-4 border border-dashed border-primary text-primary hover:bg-blue-50 font-bold rounded-lg text-sm transition-all"
          >
            + Agregar Pasajero Adicional
          </button>

          {/* Continuar / Confirmar */}
          <button
            type="submit"
            className="w-full bg-primary text-white text-center font-semibold py-3 rounded-lg shadow-md hover:bg-blue-700 transition-all cursor-pointer mt-3"
          >
            Confirmar Reserva
          </button>
        </form>
      </div>
    </Container>
  );
}

export default function Paso3Page() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Loader /></div>}>
      <Paso3Content />
    </Suspense>
  );
}

