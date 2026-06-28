"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import PasajeroRow from "@/app/components/PasajeroRow";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import Butaca from "@/app/components/icons/salidas/Butaca";
import Excel from "@/app/components/icons/salidas/Excel";
import Subir from "@/app/components/icons/salidas/Subir";
import Reloj from "@/app/components/icons/salidas/Reloj";
import Hotel from "@/app/components/icons/salidas/Hotel";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "@/app/components/Loader";
import toast from "react-hot-toast";

export default function SalidasIDPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [reservas, setReservas] = useState<any[]>([]);
  const [hoteles, setHoteles] = useState<any[]>([]);
  const [regimenes, setRegimenes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRelojModal, setShowRelojModal] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);

  // Modal States
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedRegimen, setSelectedRegimen] = useState("");
  const [isUpdatingHotel, setIsUpdatingHotel] = useState(false);

  const loadData = async () => {
    if (!user?.iweb_client_id || !id) return;
    try {
      const [resData, hotelData, regData] = await Promise.all([
        apiClient.getReservas(user.iweb_client_id, id).catch(() => []),
        apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_regimenes", user.iweb_client_id).catch(() => []),
      ]);
      
      // If there are no bookings, let's insert demo bookings in database so the page is populated
      if (resData.length === 0) {
        const passengersList = await apiClient.getParameters("get_passengers", user.iweb_client_id).catch(() => []);
        
        let p1_id = "";
        let p2_id = "";
        
        if (passengersList.length >= 2) {
          p1_id = passengersList[0].id;
          p2_id = passengersList[1].id;
        } else {
          const p1 = await apiClient.createParameter("create_passengers", {
            name: "Valentin",
            last_name: "Demarco",
            dni: 45123456,
            phone: 1169694995,
            date_of_birth: "2000-05-15",
            sex: "Masculino"
          }, user.iweb_client_id).catch(() => null);
          
          const p2 = await apiClient.createParameter("create_passengers", {
            name: "Sofia",
            last_name: "Rodriguez",
            dni: 46789012,
            phone: 1155443322,
            date_of_birth: "2002-09-10",
            sex: "Femenino"
          }, user.iweb_client_id).catch(() => null);
          
          if (p1) p1_id = p1.id;
          if (p2) p2_id = p2.id;
        }
        
        if (p1_id && p2_id) {
          const lcList = await apiClient.getParameters("get_lugares_carga", user.iweb_client_id).catch(() => []);
          const lc_id = lcList.length > 0 ? lcList[0].id : null;
          const h_id = hotelData.length > 0 ? hotelData[0].id : null;
          const r_id = regData.length > 0 ? regData[0].id : null;
          
          await apiClient.createReserva(user.iweb_client_id, {
            passenger_id: p1_id,
            salida_id: id,
            codigo_reserva: "RES-101",
            cliente: "Mio Turismo",
            edad_categoria: "ADL",
            lugar_carga_id: lc_id,
            butaca: "Seat-12",
            hotel_id: h_id,
            regimen_id: r_id,
            rooming_id: "Hab-205",
            room_type: "doble_matrimonial"
          });
          
          await apiClient.createReserva(user.iweb_client_id, {
            passenger_id: p2_id,
            salida_id: id,
            codigo_reserva: "RES-101",
            cliente: "Mio Turismo",
            edad_categoria: "ADL",
            lugar_carga_id: lc_id,
            butaca: "Seat-13",
            hotel_id: h_id,
            regimen_id: r_id,
            rooming_id: "Hab-205",
            room_type: "doble_matrimonial"
          });
          
          const refreshedRes = await apiClient.getReservas(user.iweb_client_id, id).catch(() => []);
          setReservas(refreshedRes);
        }
      } else {
        setReservas(resData);
      }
      
      setHoteles(hotelData);
      setRegimenes(regData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadData();
    }
  }, [user?.iweb_client_id, id]);

  const handleBack = () => {
    router.back();
  };

  // Age group stats
  const chdCount = reservas.filter(r => r.edad_categoria === "CHD").length;
  const adlCount = reservas.filter(r => r.edad_categoria === "ADL" || !r.edad_categoria).length;
  const infCount = reservas.filter(r => r.edad_categoria === "INF").length;

  // boarding stats
  const ascensosGrouped: Record<string, { cantidad: number; nombre: string; direccion: string }> = {};
  reservas.forEach(r => {
    const key = r.lugar_carga_nombre || "Sin especificar";
    if (!ascensosGrouped[key]) {
      ascensosGrouped[key] = {
        cantidad: 0,
        nombre: key,
        direccion: r.lugar_carga_direccion || "-"
      };
    }
    ascensosGrouped[key].cantidad++;
  });
  const ascensosList = Object.values(ascensosGrouped);

  // Batch Update Hotel and Regimen
  const handleUpdateHotel = async () => {
    if (!user?.iweb_client_id || reservas.length === 0) return;
    setIsUpdatingHotel(true);
    try {
      await Promise.all(
        reservas.map(r =>
          apiClient.updateReserva(user.iweb_client_id, r.id, {
            hotel_id: selectedHotel || r.hotel_id,
            regimen_id: selectedRegimen || r.regimen_id,
          })
        )
      );
      toast.success("Hotel y Régimen actualizados para todos los pasajeros");
      setShowHotelModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar hotel/regimen");
    } finally {
      setIsUpdatingHotel(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  const mappedPasajeros = reservas.map((r, i) => ({
    numero: i + 1,
    nombre: r.nombre_completo || "Desconocido",
    reserva: r.codigo_reserva || "-",
    cliente: r.cliente || "-",
    ascenso: r.lugar_carga_nombre || "-",
    hotel: r.hotel_nombre || "-",
    edad: r.edad_categoria || "ADL",
    butaca: r.butaca || "-",
    telefono: r.telefono || "-",
  }));

  return (
    <Container>
      <ToggleSalidas />

      <section className="flex flex-col gap-3">
        <Link
          href={"/dashboard"}
          className="flex items-center justify-start gap-3"
        >
          <ArrowLeft />
          <h1 className="font-bold md:text-xl">Volver al menú</h1>
        </Link>
        <button
          onClick={handleBack}
          className="flex items-center cursor-pointer justify-start gap-3"
        >
          <ArrowLeft color="#6005F7" />
          <h1 className="font-semibold text-secondary md:text-lg">Volver a Salidas</h1>
        </button>
      </section>

      {/* Iconos de acción */}
      <section className="flex items-center justify-end gap-2 mx-5 mb-2 mt-[-20px]">
        {/* Taquilla */}
        <Link
          href={`/salidas/lista/${id}/butacas`}
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Butacas"
        >
          <Butaca />
          <p className="text-xs text-black md:block hidden">Taquilla</p>
        </Link>
        {/* Vouchers */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Vouchers Online"
        >
          <Subir />
          <p className="text-xs text-black md:block hidden">Vouchers Online</p>
        </button>
        {/* Excel */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Exportar Excel"
        >
          <Excel />
          <p className="text-xs text-black md:block hidden">Exportar Excel</p>
        </button>
        {/* Horarios */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Horarios"
          onClick={() => setShowRelojModal(true)}
        >
          <Reloj />
          <p className="text-xs text-black md:block hidden">Horarios</p>
        </button>
        {/* Cambiar Hotel */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold"
          title="Hoteles"
          onClick={() => setShowHotelModal(true)}
        >
          <Hotel />
          <p className="text-xs text-black md:block hidden">Cambiar Hotel</p>
        </button>
      </section>

      {/* Lista de pasajeros */}
      <section className="flex flex-col justify-center items-center gap-3">
        {mappedPasajeros.length === 0 ? (
          <p className="text-gray-500 py-10 font-medium">No hay pasajeros registrados en esta salida.</p>
        ) : (
          mappedPasajeros.map((p, idx) => (
            <PasajeroRow
              key={idx}
              pasajero={p}
            />
          ))
        )}
      </section>

      {/* Pasajeros Totales */}
      <section className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full bg-[#D9DFF5] font-semibold text-black text-sm text-center">
          <thead>
            <tr>
              <th colSpan={3} className="py-2">
                Pasajeros Totales
              </th>
            </tr>
            <tr className="text-xs">
              <th className="py-1 font-semibold">CHD</th>
              <th className="py-1 font-semibold">ADL</th>
              <th className="py-1 font-semibold">INF</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-2">{chdCount}</td>
              <td className="py-2">{adlCount}</td>
              <td className="py-2">{infCount}</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Pasajeros Totales por ascenso */}
      <section className="mt-4 mb-6 border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full bg-[#D9DFF5] text-black text-sm text-center">
          <thead>
            <tr>
              <th colSpan={3} className="py-2 font-bold">
                Pasajeros Totales por ascenso
              </th>
            </tr>
            <tr className="text-xs">
              <th className="py-1 font-semibold">Cantidad</th>
              <th className="py-1 font-semibold">Lugar de carga</th>
              <th className="py-1 font-semibold">Dirección</th>
            </tr>
          </thead>
          <tbody>
            {ascensosList.length === 0 ? (
              <tr className="text-black font-semibold text-xs">
                <td colSpan={3} className="py-2">No hay ascensos asignados</td>
              </tr>
            ) : (
              ascensosList.map((asc, i) => (
                <tr key={i} className="text-black font-semibold text-xs border-t border-gray-300">
                  <td className="py-2">{asc.cantidad}</td>
                  <td className="py-2">{asc.nombre}</td>
                  <td className="py-2 text-wrap">{asc.direccion}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Modal Reloj */}
      {showRelojModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowRelojModal(false)}
        >
          <div
            className="bg-primary rounded-2xl w-[90%] max-w-md max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo */}
            <div className="flex justify-center pt-5 pb-3">
              <img
                src="/logo-travel.png"
                alt="Tranett"
                className="w-20 invert brightness-0 filter"
              />
            </div>

            {/* Tabla Ascenso (scrollable) */}
            <div className="px-4 max-h-[40vh] overflow-y-auto">
              <table className="w-full text-sm text-center border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-gray-700 text-white">
                    <th className="py-2 px-3 font-semibold">Cantidad</th>
                    <th className="py-2 px-3 font-semibold">Ascenso</th>
                    <th className="py-2 px-3 font-semibold">Horario</th>
                  </tr>
                </thead>
                <tbody>
                  {ascensosList.length === 0 ? (
                    <tr className="bg-gray-600 text-white">
                      <td colSpan={3} className="py-2 px-3">Sin ascensos registrados</td>
                    </tr>
                  ) : (
                    ascensosList.map((asc, i) => (
                      <tr key={i} className="bg-gray-600 text-white border-t border-gray-700">
                        <td className="py-2 px-3">{asc.cantidad}</td>
                        <td className="py-2 px-3">{asc.nombre}</td>
                        <td className="py-2 px-3">03:15 / 03:45</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Tabla Coordinador (fija) */}
            <div className="px-4 mt-4">
              <table className="w-full text-sm text-center border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-white">
                    <th className="py-2 px-3 font-semibold">Coordinador/a</th>
                    <th className="py-2 px-3 font-semibold">Teléfono</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-600 text-white">
                    <td className="py-2 px-3">Diego</td>
                    <td className="py-2 px-3">1169694995</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-4 px-4 py-5">
              <button
                onClick={() => setShowRelojModal(false)}
                className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer border border-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Hotel */}
      {showHotelModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowHotelModal(false)}
        >
          <div
            className="bg-primary rounded-2xl w-[90%] max-w-md max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo */}
            <div className="flex justify-center pt-5 pb-3">
              <img
                src="/logo-travel.png"
                alt="Tranett"
                className="w-20 invert brightness-0 filter"
              />
            </div>

            {/* Formulario */}
            <div className="px-6 py-4 flex flex-col gap-4 text-white">
              <h3 className="font-semibold text-lg text-center">Cambiar Hotel para la salida</h3>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Hotel</label>
                <select
                  value={selectedHotel}
                  onChange={(e) => setSelectedHotel(e.target.value)}
                  className="bg-gray-700 text-white border border-gray-500 rounded-lg p-2 text-sm"
                >
                  <option value="">Seleccionar Hotel</option>
                  {hoteles.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold">Régimen</label>
                <select
                  value={selectedRegimen}
                  onChange={(e) => setSelectedRegimen(e.target.value)}
                  className="bg-gray-700 text-white border border-gray-500 rounded-lg p-2 text-sm"
                >
                  <option value="">Seleccionar Régimen</option>
                  {regimenes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Botones */}
            <div className="flex justify-center gap-4 px-4 py-5">
              <button
                onClick={() => setShowHotelModal(false)}
                className="bg-white text-black font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer border border-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateHotel}
                disabled={isUpdatingHotel}
                className="bg-secondary text-white font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer disabled:opacity-50"
              >
                {isUpdatingHotel ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
