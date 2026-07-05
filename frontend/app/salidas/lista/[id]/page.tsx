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
import AddVioleta from "@/app/components/icons/AddVioleta";
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
  const [lugaresCarga, setLugaresCarga] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showRelojModal, setShowRelojModal] = useState(false);
  const [showHotelModal, setShowHotelModal] = useState(false);

  // Modal States
  const [salida, setSalida] = useState<any>(null);
  const [destinos, setDestinos] = useState<any[]>([]);

  // Hotel modal states
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedRegimen, setSelectedRegimen] = useState("");
  const [isUpdatingHotel, setIsUpdatingHotel] = useState(false);

  // Horarios modal states
  const [tempCoordinadorNombre, setTempCoordinadorNombre] = useState("");
  const [tempCoordinadorTelefono, setTempCoordinadorTelefono] = useState("");
  const [tempHorarios, setTempHorarios] = useState<string[]>([]);
  const [isSavingHorarios, setIsSavingHorarios] = useState(false);

  const [clientes, setClientes] = useState<any[]>([]);

  // Nueva Reserva modal states
  const [showNuevaReservaModal, setShowNuevaReservaModal] = useState(false);
  const [reservaPaso, setReservaPaso] = useState<1 | 2>(1);
  const [searchPassengerQuery, setSearchPassengerQuery] = useState("");
  const [passengersFound, setPassengersFound] = useState<any[]>([]);
  const [selectedPassenger, setSelectedPassenger] = useState<any | null>(null);
  const [showNewPassengerForm, setShowNewPassengerForm] = useState(false);
  const [isSearchingPassenger, setIsSearchingPassenger] = useState(false);

  // New passenger fields
  const [newPassName, setNewPassName] = useState("");
  const [newPassLastName, setNewPassLastName] = useState("");
  const [newPassDNI, setNewPassDNI] = useState("");
  const [newPassPhone, setNewPassPhone] = useState("");
  const [newPassBirth, setNewPassBirth] = useState("");
  const [newPassSex, setNewPassSex] = useState("Masculino");

  // Booking fields
  const [bookingCodigo, setBookingCodigo] = useState("");
  const [bookingClienteId, setBookingClienteId] = useState("");
  const [bookingEdadCategoria, setBookingEdadCategoria] = useState("ADL");
  const [bookingLugarCargaId, setBookingLugarCargaId] = useState("");
  const [bookingTipoButaca, setBookingTipoButaca] = useState("semicama");
  const [bookingButaca, setBookingButaca] = useState("");
  const [bookingHotelId, setBookingHotelId] = useState("");
  const [bookingRegimenId, setBookingRegimenId] = useState("");
  const [isSavingReserva, setIsSavingReserva] = useState(false);

  const loadData = async () => {
    if (!user?.iweb_client_id || !id) return;
    try {
      const [resData, hotelData, regData, lcData, salidaData, destData, clientData] = await Promise.all([
        apiClient.getReservas(user.iweb_client_id, id).catch(() => []),
        apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_regimenes", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_lugares_carga", user.iweb_client_id).catch(() => []),
        apiClient.getSalida(user.iweb_client_id, id).catch(() => null),
        apiClient.getParameters("get_destinos", user.iweb_client_id).catch(() => []),
        apiClient.getParameters("get_clients", user.iweb_client_id).catch(() => []),
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

          const cl_id = clientData.length > 0 ? clientData[0].id : null;

          await apiClient.createReserva(user.iweb_client_id, {
            passenger_id: p1_id,
            salida_id: id,
            codigo_reserva: "RES-101",
            client_id: cl_id,
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
            client_id: cl_id,
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
      setLugaresCarga(lcData);
      setSalida(salidaData);
      setDestinos(destData);
      setClientes(clientData);
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

  const handleSearchPassenger = async () => {
    if (!user?.iweb_client_id || !searchPassengerQuery.trim()) return;
    setIsSearchingPassenger(true);
    try {
      const isNum = /^\d+$/.test(searchPassengerQuery.trim());
      let res: any[] = [];
      if (isNum) {
        res = await apiClient.getPassengerByDNI(user.iweb_client_id, searchPassengerQuery.trim());
      } else {
        const byLastName = await apiClient.getPassengerByLastName(user.iweb_client_id, searchPassengerQuery.trim()).catch(() => []);
        const byName = await apiClient.getPassengerByName(user.iweb_client_id, searchPassengerQuery.trim()).catch(() => []);

        const seenIds = new Set();
        res = [];
        for (const p of [...byLastName, ...byName]) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            res.push(p);
          }
        }
      }
      setPassengersFound(res);
    } catch (error) {
      console.error(error);
      toast.error("Error al buscar pasajero");
    } finally {
      setIsSearchingPassenger(false);
    }
  };

  const handleCreatePassengerAndProceed = async () => {
    if (!user?.iweb_client_id) return;
    if (!newPassName.trim() || !newPassLastName.trim()) {
      toast.error("Nombre y Apellido son requeridos");
      return;
    }
    try {
      const p = await apiClient.createParameter("create_passengers", {
        name: newPassName.trim(),
        last_name: newPassLastName.trim(),
        dni: newPassDNI ? Number(newPassDNI) : null,
        phone: newPassPhone ? Number(newPassPhone) : null,
        date_of_birth: newPassBirth || null,
        sex: newPassSex,
      }, user.iweb_client_id);

      if (p) {
        setSelectedPassenger(p);
        setShowNewPassengerForm(false);
        // Pre-fill booking fields from departure
        setBookingHotelId(salida?.hotel_id || "");
        setBookingRegimenId(salida?.regimen_id || "");
        setReservaPaso(2);
      }
    } catch (error) {
      console.error(error);
      toast.error("Error al crear pasajero");
    }
  };

  const handleSaveReserva = async () => {
    if (!user?.iweb_client_id || !id || !selectedPassenger) return;
    setIsSavingReserva(true);
    try {
      await apiClient.createReserva(user.iweb_client_id, {
        passenger_id: selectedPassenger.id,
        salida_id: id,
        codigo_reserva: bookingCodigo || null,
        client_id: bookingClienteId || null,
        edad_categoria: bookingEdadCategoria,
        lugar_carga_id: bookingLugarCargaId || null,
        tipo_butaca: bookingTipoButaca,
        butaca: bookingButaca || null,
        hotel_id: bookingHotelId || null,
        regimen_id: bookingRegimenId || null,
      });

      toast.success("Reserva creada correctamente");
      // Reset form states
      setShowNuevaReservaModal(false);
      setReservaPaso(1);
      setSelectedPassenger(null);
      setSearchPassengerQuery("");
      setPassengersFound([]);
      setBookingCodigo("");
      setBookingClienteId("");
      setBookingEdadCategoria("ADL");
      setBookingLugarCargaId("");
      setBookingTipoButaca("semicama");
      setBookingButaca("");

      // Reset passenger fields
      setNewPassName("");
      setNewPassLastName("");
      setNewPassDNI("");
      setNewPassPhone("");
      setNewPassBirth("");
      setNewPassSex("Masculino");

      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Error al guardar reserva");
    } finally {
      setIsSavingReserva(false);
    }
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

  // Open modal initializers
  const handleOpenRelojModal = () => {
    setTempCoordinadorNombre(salida?.coordinador_nombre || "");
    setTempCoordinadorTelefono(salida?.coordinador_telefono || "");
    // Siempre mostramos todos los lugaresCarga; pre-rellenamos con horarios ya guardados
    const horariosMap: Record<string, string> = {};
    (salida?.cargas || []).forEach((c: any) => {
      if (c.id) horariosMap[c.id] = c.horario || "";
    });
    setTempHorarios(lugaresCarga.map((lc: any) => horariosMap[lc.id] || ""));
    setShowRelojModal(true);
  };

  const handleOpenHotelModal = () => {
    setSelectedHotel(salida?.hotel_id || "");
    setSelectedRegimen(salida?.regimen_id || "");
    setShowHotelModal(true);
  };

  // Batch Update Hotel and Regimen on the departure AND passenger reservations
  const handleUpdateHotel = async () => {
    if (!user?.iweb_client_id || !id) return;
    setIsUpdatingHotel(true);
    try {
      // 1. Update the departure parameter
      await apiClient.updateSalida(user.iweb_client_id, id, {
        hotel_id: selectedHotel || null,
        regimen_id: selectedRegimen || null,
      });

      // 2. Update all passenger reservations to maintain consistency
      if (reservas.length > 0) {
        await Promise.all(
          reservas.map(r =>
            apiClient.updateReserva(user.iweb_client_id, r.id, {
              hotel_id: selectedHotel || null,
              regimen_id: selectedRegimen || null,
            })
          )
        );
      }

      toast.success("Hotel y Régimen actualizados con éxito");
      setShowHotelModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar hotel/régimen");
    } finally {
      setIsUpdatingHotel(false);
    }
  };

  // Save schedules and coordinator info
  const handleSaveHorarios = async () => {
    if (!user?.iweb_client_id || !id) return;
    setIsSavingHorarios(true);
    try {
      // Siempre guardamos todos los lugaresCarga con sus horarios
      const cargasIds: string[] = lugaresCarga.map((lc: any) => lc.id).filter(Boolean);

      await apiClient.updateSalida(user.iweb_client_id, id, {
        ...(tempCoordinadorNombre !== undefined ? { coordinador_nombre: tempCoordinadorNombre } : {}),
        ...(tempCoordinadorTelefono !== undefined ? { coordinador_telefono: tempCoordinadorTelefono } : {}),
        ...(cargasIds.length > 0 ? { cargas_ids: cargasIds, horarios: tempHorarios } : {}),
      });
      toast.success("Horarios y Coordinador actualizados");
      setShowRelojModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar horarios");
    } finally {
      setIsSavingHorarios(false);
    }
  };

  // Resolved departure's destination name for hotel filtering
  const departureDestObj = destinos.find(d => d.id === salida?.destino);
  const destName = departureDestObj ? (departureDestObj.name || departureDestObj.nombre) : "";
  const filteredHoteles = hoteles.filter(h => {
    if (!destName) return true;
    return h.destino?.toLowerCase() === destName.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  const mappedPasajeros = reservas.map((r, i) => ({
    id: r.id,
    numero: i + 1,
    nombre: r.nombre_completo || "Desconocido",
    reserva: r.codigo_reserva || "-",
    cliente: r.client_nombre || "-",
    client_id: r.client_id || null,
    ascenso: r.lugar_carga_nombre || "-",
    lugar_carga_id: r.lugar_carga_id || null,
    hotel: r.hotel_nombre || "-",
    hotel_id: r.hotel_id || null,
    regimen_id: r.regimen_id || null,
    edad: r.edad_categoria || "ADL",
    butaca: r.butaca || "-",
    telefono: r.telefono || "-",
  }));

  console.log('lugaresCarga', lugaresCarga);

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
      <section className="flex items-center justify-end gap-2 mx-5 mb-2 md:mt-[-20px] mt-2">
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
          className="p-1.5 flex items-center gap-2 font-semibold text-black hover:text-secondary transition-colors"
          title="Horarios y Coordinador"
          onClick={handleOpenRelojModal}
        >
          <Reloj />
          <p className="text-xs text-black md:block hidden">Horarios</p>
        </button>
        {/* Cambiar Hotel */}
        <button
          className="p-1.5 flex items-center gap-2 font-semibold text-black hover:text-secondary transition-colors"
          title="Hotel y Régimen de la Salida"
          onClick={handleOpenHotelModal}
        >
          <Hotel />
          <p className="text-xs text-black md:block hidden">Cambiar Hotel</p>
        </button>
      </section>

      {/* Lista de pasajeros */}
      <section className="md:mx-20 mx-2 flex flex-col gap-1.5 mt-4">
        {/* Header de columnas */}
        <div className="flex items-center gap-2 w-full text-xs font-bold text-black/75 mb-1 select-none">
          {/* Bus Header */}
          <div className="w-14 hidden md:flex text-center">Bus</div>

          {/* Columns Header Container */}
          <div className="flex-1 hidden md:flex items-center justify-between px-3 text-left">
            <span className="flex-1 text-center">Nombre completo</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">|</span>
            <span className="w-20 md:block hidden text-center">Reserva</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">|</span>
            <span className="w-24 md:block hidden text-center">Cliente</span>
            <span className="text-transparent font-normal px-1 select-none">|</span>
            <span className="w-32 text-center">Ascenso</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">|</span>
            <span className="w-32 md:block hidden text-center">Hotel</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">|</span>
            <span className="w-12 md:block hidden text-center">Edad</span>
            <span className="text-transparent font-normal px-1 md:inline hidden select-none">|</span>
            <span className="w-28 md:block hidden text-center">Teléfono</span>
            <span className="text-transparent font-normal px-1 select-none">|</span>
            <span className="w-24 text-center">Tipo de Bus</span>
            <span className="text-transparent font-normal px-1 select-none">|</span>
            <span className="w-20 text-center">Voucher</span>
          </div>
        </div>

        {/* Rows List */}
        <div className="flex flex-col w-full gap-2">
          {mappedPasajeros.length === 0 ? (
            <p className="text-gray-500 py-10 font-medium text-center bg-white rounded-lg border border-[#3DADFF]">
              No hay pasajeros registrados en esta salida.
            </p>
          ) : (
            mappedPasajeros.map((p, idx) => (
              <PasajeroRow
                key={idx}
                pasajero={p}
                onUpdated={loadData}
              />
            ))
          )}
        </div>
      </section>

      {/* Pasajeros Totales */}
      <section className="mt-6 md:mx-10 bg-[#D9DFF5]/40 border border-[#3DADFF] rounded-md overflow-hidden">
        <div className="w-full bg-[#D9DFF5] font-semibold text-black text-sm text-center">
          <div className="flex flex-col">
            <div className="py-2 flex justify-center items-center">
              Pasajeros Totales
            </div>
            <div className="text-xs flex justify-center items-center gap-10 md:gap-20">
              <div className="py-2 font-semibold">CHD</div>
              <div className="py-2 font-semibold">ADL</div>
              <div className="py-2 font-semibold">INF</div>
            </div>
          </div>
          <div className="flex justify-center items-center gap-14 md:gap-25">
            <div className="py-2 text-center">{chdCount}</div>
            <div className="py-2 text-center">{adlCount}</div>
            <div className="py-2 text-center">{infCount}</div>
          </div>
        </div>
      </section>

      {/* Pasajeros Totales por ascenso */}
      <section className="mt-4 md:mx-10 bg-[#D9DFF5]/40 border border-[#3DADFF] rounded-md overflow-hidden">
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

      {/* Modal Reloj (Horarios y Coordinador) */}
      {
        showRelojModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowRelojModal(false)}
          >
            <div
              className="bg-primary rounded-2xl w-[90%] max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-white"
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

              <h3 className="text-center font-bold text-sm mb-3">Horarios y Coordinación</h3>

              {/* Tabla Ascenso (scrollable) */}
              <div className="px-6 py-2 max-h-[25vh] overflow-y-auto mt-2">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="sticky top-0 bg-gray-700">
                    <tr>
                      <th className="py-1.5 px-2 font-semibold">Cantidad</th>
                      <th className="py-1.5 px-2 text-center font-semibold">Lugar de Carga</th>
                      <th className="py-1.5 px-2 font-semibold">Horario</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      // Siempre mostramos TODOS los lugaresCarga; si ya tienen horario guardado en salida.cargas lo pre-rellenamos
                      const horariosMap: Record<string, string> = {};
                      (salida?.cargas || []).forEach((c: any) => {
                        if (c.id) horariosMap[c.id] = c.horario || "";
                      });

                      if (lugaresCarga.length === 0) {
                        return (
                          <tr className="bg-gray-600">
                            <td colSpan={3} className="py-2 px-3">Sin lugares de carga configurados</td>
                          </tr>
                        );
                      }

                      return lugaresCarga.map((lc: any, i: number) => {
                        const count = reservas.filter((r) => r.lugar_carga_id === lc.id).length;
                        return (
                          <tr key={i} className="bg-gray-600 border-t border-gray-700">
                            <td className="py-1.5 px-2">{count}</td>
                            <td className="py-1.5 px-2 text-center font-semibold truncate" title={lc.name || lc.nombre}>
                              {lc.name || lc.nombre}
                            </td>
                            <td className="py-1.5 px-2 flex justify-center">
                              <input
                                type="text"
                                value={tempHorarios[i] || ""}
                                onChange={(e) => {
                                  const copy = [...tempHorarios];
                                  copy[i] = e.target.value;
                                  setTempHorarios(copy);
                                }}
                                className="bg-gray-700 text-white text-[11px] font-semibold border border-gray-600 rounded p-1 text-center focus:outline-none focus:ring-1 focus:ring-secondary"
                                placeholder="hh:mm"
                              />
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Formulario Coordinación */}
              <div className="px-6 py-2 max-h-[25vh] overflow-y-auto mt-2">
                <table className="w-full text-xs text-center border-collapse">
                  <thead className="sticky top-0 bg-gray-700">
                    <tr>
                      <th className="py-1.5 px-2 font-semibold">Coordinador/a</th>
                      <th className="py-1.5 px-2 text-center font-semibold">Teléfono</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-gray-600 border-t border-gray-700">
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={tempCoordinadorNombre}
                          onChange={(e) => setTempCoordinadorNombre(e.target.value)}
                          className="bg-gray-750 text-white text-xs border border-gray-600 rounded p-2 focus:outline-none focus:ring-1 focus:ring-secondary"
                          placeholder="Nombre de la persona encargada"
                        />
                      </td>
                      <td className="py-1.5 px-2">
                        <input
                          type="text"
                          value={tempCoordinadorTelefono}
                          onChange={(e) => setTempCoordinadorTelefono(e.target.value)}
                          className="bg-gray-750 text-white text-xs border border-gray-600 rounded p-2 focus:outline-none focus:ring-1 focus:ring-secondary"
                          placeholder="Ej: 1169694995"
                        />
                      </td>
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
                  Cancelar
                </button>
                <button
                  onClick={handleSaveHorarios}
                  disabled={isSavingHorarios}
                  className="bg-secondary text-white font-semibold text-sm px-6 py-2 rounded-lg cursor-pointer disabled:opacity-50"
                >
                  {isSavingHorarios ? "Guardando..." : "Confirmar"}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Modal Hotel y Régimen */}
      {
        showHotelModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
            onClick={() => setShowHotelModal(false)}
          >
            <div
              className="bg-primary rounded-2xl w-[90%] max-w-md max-h-[85vh] flex flex-col overflow-hidden text-white"
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

              <h3 className="text-center font-bold text-sm mb-3">Cambiar Hotel y Régimen</h3>

              {/* Formulario */}
              <table className="w-full text-xs text-center border-collapse">
                <thead className="sticky top-0 bg-gray-700">
                  <tr>
                    <th className="py-1.5 px-2 font-semibold">Destino</th>
                    <th className="py-1.5 px-2 text-center font-semibold">Hotel</th>
                    <th className="py-1.5 px-2 font-semibold">Régimen</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-600 border-t border-gray-700">
                    <td className="py-1.5 px-2">{destName || salida?.destino || ""}</td>
                    <td className="py-1.5 px-2">
                      <select
                        value={selectedHotel}
                        onChange={(e) => setSelectedHotel(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                      >
                        <option value="">Seleccione un hotel</option>
                        {filteredHoteles.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 px-2">
                      <select
                        value={selectedRegimen}
                        onChange={(e) => setSelectedRegimen(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white font-medium shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary cursor-pointer"
                      >
                        <option value="">Seleccione un régimen</option>
                        {regimenes.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name || r.nombre || r.sigla}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>

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
        )
      }
    </Container >
  );
}
