"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import AddVioleta from "@/app/components/icons/AddVioleta";
import ArrowUpDown from "@/app/components/icons/ArrowUpDown";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { Suspense, useState, useEffect } from "react";
import ReservasCard from "../ReservasCard";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "@/app/components/Loader";

interface Passenger {
  dni: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  puntoAscenso: string;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const success = searchParams.get("success") === "true";
  const destino = searchParams.get("destino") || "";
  const cliente = searchParams.get("cliente") || "";
  const hotel = searchParams.get("hotel") || "";
  const cama = searchParams.get("cama") || "";
  const habitacion = searchParams.get("habitacion") || "";
  
  const filterNumero = searchParams.get("numero") || "";
  const filterCliente = searchParams.get("cliente") || "";

  const [pasajeros, setPasajeros] = useState<Passenger[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [reservas, setReservas] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const fetchReservas = async () => {
    if (!user?.iweb_client_id) return;
    try {
      const resList = await apiClient.getReservas(user.iweb_client_id);
      
      // Group reservations by codigo_reserva
      const groupedMap: Record<string, any> = {};
      resList.forEach((r) => {
        const code = r.codigo_reserva || `RES-${r.id.substring(0, 6).toUpperCase()}`;
        if (!groupedMap[code]) {
          groupedMap[code] = {
            id: r.id,
            numero: code,
            destino: r.lugar_carga_nombre || "General",
            cliente: r.client_nombre || "Particular",
            client_id: r.client_id || "",
            fecha: r.fecha_nacimiento || "10/06/2026",
            titulo: `${r.nombre_completo} ${resList.filter(x => x.codigo_reserva === r.codigo_reserva).length > 1 ? `x${resList.filter(x => x.codigo_reserva === r.codigo_reserva).length}` : ""}`,
            pasajeros: [],
            active: r.active
          };
        }
        groupedMap[code].pasajeros.push({
          nombre: r.nombre_completo,
          dni: r.dni ? String(r.dni) : "-",
          telefono: r.telefono || "-",
          email: "-",
        });
      });
      
      let list = Object.values(groupedMap);
      
      // Filter list
      if (filterNumero) {
        list = list.filter(r => r.numero.toLowerCase().includes(filterNumero.toLowerCase()));
      }
      if (filterCliente) {
        list = list.filter(r => r.client_id === filterCliente);
      }
      
      setReservas(list);
    } catch (error) {
      console.error(error);
      toast.error("Error al cargar listado de reservas");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      fetchReservas();
    }
  }, [user?.iweb_client_id]);

  useEffect(() => {
    if (success) {
      setShowSuccessModal(true);
      const pasajerosParam = searchParams.get("pasajeros");
      if (pasajerosParam) {
        try {
          const parsed = JSON.parse(decodeURIComponent(pasajerosParam));
          setPasajeros(parsed);
        } catch (e) {
          console.error("Error parsing pasajeros", e);
        }
      }
    }
  }, [success, searchParams]);

  if (loadingList) {
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
        className="flex items-center my-2 justify-start gap-2"
        href={"/web/reservas/crear-reserva/paso-1"}>
        <AddVioleta />
        <p className="text-secondary font-semibold md:text-lg">Crear reserva</p>
      </Link>
      <section className="flex justify-between my-5 items-center">
        <h2 className="font-semibold text-black text-center mx-auto md:text-xl">
          Reservas
        </h2>
      </section>

      <section className="flex flex-col max-w-5xl mx-auto gap-5">
        <button className="flex items-center my-2 font-semibold justify-end gap-1">
          <p className="text-black">Ordenar por fecha</p>
          <ArrowUpDown />
        </button>
        <div className="flex flex-col w-full gap-10">
          {reservas.map((reserva) => (
            <ReservasCard key={reserva.id} reserva={reserva} />
          ))}
        </div>
      </section>

      {/* Booking confirmation modal (Reserva confirmada con éxito) */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center animate-in fade-in zoom-in duration-300">
            {/* Success Icon */}
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 text-green-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Reserva Confirmada!</h3>
            <p className="text-gray-600 text-sm mb-6">
              La reserva se ha registrado de manera exitosa en el sistema.
            </p>

            {/* Booking summary card */}
            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-left mb-6 flex flex-col gap-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Destino</span>
                <span className="font-bold text-gray-700">{destino || "Mar del Plata"}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Hotel</span>
                <span className="font-bold text-gray-700">{hotel || "Hotel Garden"}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Habitación</span>
                <span className="font-bold text-gray-700">{habitacion.toUpperCase()} ({cama.toUpperCase()})</span>
              </div>
              <div className="border-t border-gray-200 my-1"></div>
              <p className="text-xs font-bold text-gray-700 mb-1">Pasajeros:</p>
              {pasajeros.map((p, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-600 pl-2">
                  <span>• {p.nombre} {p.apellido}</span>
                  <span className="text-gray-400">DNI: {p.dni}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => {
                  toast.success("Descargando Voucher Aéreo...");
                }}
                className="w-full bg-primary text-white font-bold py-2.5 rounded-lg shadow hover:bg-blue-700 transition-colors text-sm"
              >
                ✈️ Descargar Voucher Aéreo
              </button>
              <button
                onClick={() => {
                  toast.success("Descargando Voucher Bus...");
                }}
                className="w-full bg-secondary text-white font-bold py-2.5 rounded-lg shadow hover:bg-purple-800 transition-colors text-sm"
              >
                🚌 Descargar Voucher Terrestre
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  // clear parameters without page refresh
                  router.replace("/web/reservas/result");
                }}
                className="w-full border border-gray-300 text-gray-700 font-medium py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm"
              >
                Ver listado de Reservas
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}

export default function ResultPage() {
  return (
    <Suspense>
      <ResultContent />
    </Suspense>
  );
}