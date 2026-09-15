"use client";
import Link from "next/link";
import Container from "@/app/components/Container";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import Pagination from "@/app/components/Pagination";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";
import DateInput from "@/app/components/DateComponent";
import ModalLayout from "@/app/components/ModalLayout";
import Administracion from "@/app/components/icons/home/Administracion";
import { Account, Hotel, TransportCompany } from "@/app/types";
import { formatDateDDMMYY } from "@/lib/formatDate";
import Rooming from "@/app/components/icons/salidas/Rooming";
import type { Provider } from "@/lib/providerCatalog";
import {
  buildRoomingHotels,
  getRoomingPackageHotelDate,
} from "@/lib/roomingData";
import { parseRoomItem } from "@/lib/formatRooms";

interface FormDataType {
  type: "consumo" | "pago";
  provider: "hotel" | "transporte" | "proveedor";
  providerId: string;
  date: string;
  regimen: string;
  detail: string;
  ammount: string;
  paymentMethod: "transferencia" | "efectivo" | "tarjeta";
  account: string;
}

interface MovimientoRow {
  id: string;
  date: string | null;
  departure_date?: string | null;
  regimen_id?: string | null;
  type: string | null;
  detail: string | null;
  regimen: string | null;
  provider_name?: string | null;
  provider_id?: string | null;
  excursion_id?: string | null;
  hotel_fecha_in?: string | null;
  salida_id?: string | null;
  amount: number | null;
  provider_type: string | null;
  hotel_id: string | null;
  transport_id: string | null;
  transf_account: string | null;
  cc_provider_id?: string | null;
  consumption_group_id?: string | null;
}

const ROOMING_TITLES: Record<string, string> = {
  doble_matrimonial: "Habitaciones Dobles Matrimoniales",
  doble_individual: "Habitaciones Dobles Individuales",
  single_individual: "Habitaciones Singles / Individuales",
  triple_individual: "Habitaciones Triples",
  cuadruple_individual: "Habitaciones Cuádruples",
  otras_habitaciones: "Otras Habitaciones",
};

export default function CuentasCorrientesProveedoresPage() {
  const r = useRouter();
  const { user } = useAuth();

  const [modal, setModal] = useState(false);
  const [roomingModal, setRoomingModal] = useState(false);
  const [roomingOpening, setRoomingOpening] = useState(false);
  const [roomingClosing, setRoomingClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hoteles, setHoteles] = useState<Hotel[]>([]);
  const [transportes, setTransportes] = useState<TransportCompany[]>([]);
  const [cuentas, setCuentas] = useState<Account[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [roomingMovement, setRoomingMovement] = useState<MovimientoRow | null>(
    null,
  );
  const [roomingHotels, setRoomingHotels] = useState<
    ReturnType<typeof buildRoomingHotels>
  >([]);
  const [roomingLoading, setRoomingLoading] = useState(false);

  // Filtros mutuamente excluyentes
  const [selectedHotel, setSelectedHotel] = useState("");
  const [selectedTransporte, setSelectedTransporte] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");

  // Date filters
  const [fechaCreaDesde, setFechaCreaDesde] = useState("");
  const [fechaCreaHasta, setFechaCreaHasta] = useState("");

  // 1. Tipamos el useRef con el elemento HTML correspondiente (HTMLDivElement)
  const divRef = useRef<HTMLDivElement>(null);
  const roomingCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeRoomingModal = () => {
    if (!roomingModal || roomingClosing) return;
    setRoomingClosing(true);
    roomingCloseTimer.current = setTimeout(() => {
      setRoomingModal(false);
      setRoomingClosing(false);
      roomingCloseTimer.current = null;
    }, 300);
  };

  useEffect(() => {
    // 2. Tipamos el evento como un MouseEvent global
    function handleClickOutside(event: MouseEvent) {
      // 3. Usamos as Node para que TypeScript entienda la comparación con event.target
      if (divRef.current && !divRef.current.contains(event.target as Node)) {
        closeRoomingModal();
      }
    }

    // Escuchamos el evento mousedown en el documento
    document.addEventListener("mousedown", handleClickOutside);

    // Limpieza del evento al desmontar el componente
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [roomingModal, roomingClosing]);
  const [formData, setFormData] = useState<FormDataType>({
    type: "pago",
    provider: "hotel",
    providerId: "",
    date: "",
    regimen: "",
    detail: "",
    ammount: "",
    paymentMethod: "transferencia",
    account: "",
  });

  const paymentMethods: ("transferencia" | "efectivo" | "tarjeta")[] = [
    "transferencia",
    "efectivo",
    "tarjeta",
  ];
  const paymentMethodLabels: Record<string, string> = {
    transferencia: "Transferencia",
    efectivo: "Efectivo",
    tarjeta: "Tarjeta",
  };

  const cyclePaymentMethod = () => {
    const currentIndex = paymentMethods.indexOf(formData.paymentMethod);
    const nextIndex = (currentIndex + 1) % paymentMethods.length;
    const nextMethod = paymentMethods[nextIndex];
    setFormData({
      ...formData,
      paymentMethod: nextMethod,
      account: nextMethod !== "transferencia" ? "" : formData.account,
    });
  };

  const openRoomingModal = async (movement: MovimientoRow) => {
    if (!movement.salida_id || !user?.iweb_client_id) {
      toast.error("El consumo no tiene una salida asociada");
      return;
    }

    setRoomingMovement(movement);
    if (roomingCloseTimer.current) clearTimeout(roomingCloseTimer.current);
    setRoomingClosing(false);
    setRoomingModal(true);
    setRoomingOpening(true);
    requestAnimationFrame(() => setRoomingOpening(false));
    setRoomingHotels([]);
    setRoomingLoading(true);
    try {
      const [reservations, hotelsData] = await Promise.all([
        apiClient.getReservas(user.iweb_client_id, movement.salida_id),
        apiClient
          .getParameters("get_hotels", user.iweb_client_id)
          .catch(() => []),
      ]);
      const packageIds = [
        ...new Set(
          reservations
            .map((reservation: any) => reservation.package_id)
            .filter(Boolean),
        ),
      ];
      const packages = await Promise.all(
        packageIds.map((packageId) =>
          apiClient
            .getPackage(user.iweb_client_id, packageId)
            .catch(() => null),
        ),
      );
      const packageById = new Map(
        packages.filter(Boolean).map((pkg: any) => [pkg.id, pkg]),
      );
      const hotelNames = Object.fromEntries(
        hotelsData
          .filter((hotel: any) => hotel.id)
          .map((hotel: any) => [
            hotel.id,
            hotel.name || hotel.nombre || "Hotel",
          ]),
      );
      const matchingReservations = reservations.filter((reservation: any) => {
        if (reservation.active === false) return false;
        const packageInfo = packageById.get(reservation.package_id);
        const passengers = reservation.reservation_passengers?.length
          ? reservation.reservation_passengers
          : [reservation];
        const hasHotel = movement.hotel_id
          ? passengers.some(
              (passenger: any) =>
                (passenger.hotel_id || reservation.hotel_id) ===
                movement.hotel_id,
            )
          : true;
        if (!hasHotel) return false;
        if (movement.regimen_id) {
          const hasRegimen =
            passengers.some(
              (passenger: any) => passenger.regimen_id === movement.regimen_id,
            ) ||
            reservation.regimen_id === movement.regimen_id ||
            packageInfo?.hotels?.some(
              (hotel: any) =>
                hotel.hotel_id === movement.hotel_id &&
                hotel.hotel_regimen_id === movement.regimen_id,
            );
          if (!hasRegimen) return false;
        }
        if (movement.hotel_fecha_in && movement.hotel_id) {
          const packageHotelDate = getRoomingPackageHotelDate(
            packageInfo,
            [reservation],
            movement.hotel_id,
          );
          if (packageHotelDate !== movement.hotel_fecha_in) return false;
        }
        if (movement.excursion_id) {
          const excursionIds = String(packageInfo?.excursiones || "")
            .split(",")
            .map((id) => id.trim());
          if (!excursionIds.includes(movement.excursion_id)) return false;
        }
        return true;
      });
      setRoomingHotels(
        buildRoomingHotels(
          matchingReservations.map((reservation: any) => ({
            ...reservation,
            rooming_provider_name: movement.provider_name || "Proveedor",
          })),
          hotelNames,
        ),
      );
    } catch {
      toast.error("No se pudo cargar el rooming del consumo");
    } finally {
      setRoomingLoading(false);
    }
  };

  const loadProviders = async () => {
    if (!user?.iweb_client_id) return;
    setLoading(true);
    try {
      const [hotelData, transportData, cuentasData, providersData] =
        await Promise.all([
          apiClient
            .getParameters("get_hotels", user.iweb_client_id)
            .catch(() => []),
          apiClient
            .getParameters("get_transport_companies", user.iweb_client_id)
            .catch(() => []),
          apiClient.getAccounts(user.iweb_client_id).catch(() => []),
          apiClient
            .getProviders(user.iweb_client_id, 1, "", 100)
            .catch(() => ({ items: [] })),
        ]);
      setHoteles(hotelData);
      setTransportes(transportData);
      setCuentas(cuentasData);
      setProviders(providersData.items);
    } catch {
      toast.error("Error al cargar proveedores");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.iweb_client_id) {
      loadProviders();
    }
  }, [user?.iweb_client_id]);

  const formatMonto = (monto: number) => {
    const prefix = monto < 0 ? "-" : "";
    return `${prefix}$${Math.abs(monto).toLocaleString("es-AR")}`;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.iweb_client_id) return;
    setSearching(true);
    try {
      const data: MovimientoRow[] =
        await apiClient.getCCProvidersConsumptionPayments(user.iweb_client_id);
      setMovimientos(data);
      setSearched(true);
    } catch {
      toast.error("Error al consultar movimientos");
    } finally {
      setSearching(false);
    }
  };

  const handleClear = () => {
    setSelectedHotel("");
    setSelectedTransporte("");
    setSelectedProvider("");
    setFechaCreaDesde("");
    setFechaCreaHasta("");
    setSearched(false);
    setMovimientos([]);
  };

  const handleSubmitModal = async () => {
    if (!user?.iweb_client_id) return;
    if (!formData.providerId) {
      toast.error("Seleccioná un proveedor");
      return;
    }
    if (!formData.ammount || isNaN(Number(formData.ammount))) {
      toast.error("Ingresá un monto válido");
      return;
    }

    setSubmitting(true);
    try {
      const payload: Record<string, any> = {
        iweb_client_id: user.iweb_client_id,
        provider_type: formData.provider,
        hotel_id: formData.provider === "hotel" ? formData.providerId : null,
        transport_id:
          formData.provider === "transporte" ? formData.providerId : null,
        date: formData.date || null,
        detail: formData.detail || null,
        type: formData.type,
        amount: Number(formData.ammount),
        transf_account:
          formData.type === "pago" && formData.paymentMethod === "transferencia"
            ? formData.account
            : null,
      };

      await apiClient.createCCProviderConsumptionPayment(payload);
      toast.success(
        `${formData.type === "pago" ? "Pago" : "Consumo"} registrado correctamente`,
      );

      // Reset form
      setFormData({
        type: "pago",
        provider: "hotel",
        providerId: "",
        date: "",
        regimen: "",
        detail: "",
        ammount: "",
        paymentMethod: "transferencia",
        account: "",
      });
      setModal(false);

      // Reload data if we already searched
      if (searched && user?.iweb_client_id) {
        const data = await apiClient.getCCProvidersConsumptionPayments(
          user.iweb_client_id,
        );
        setMovimientos(data);
      }
    } catch {
      toast.error("Error al registrar movimiento");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportExcel = async () => {
    if (filteredMovimientos.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("Cuenta Corriente Proveedor");

      const headerRow = ws.addRow(["Fecha", "Tipo", "Detalle", "Monto"]);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF000000" },
        };
        cell.alignment = { horizontal: "center" };
      });

      filteredMovimientos.forEach((mov) => {
        const tipoLabel = mov.type === "consumo" ? "Consumo" : "Pago";
        ws.addRow([
          formatDateDDMMYY(mov.date),
          tipoLabel,
          mov.detail || "",
          mov.amount || 0,
        ]);
      });

      const totRow = ws.addRow(["", "", "TOTAL CONSUMOS:", totalConsumos]);
      totRow.eachCell((cell) => {
        cell.font = { bold: true };
      });
      const totRow2 = ws.addRow(["", "", "TOTAL PAGOS:", totalPagos]);
      totRow2.eachCell((cell) => {
        cell.font = { bold: true };
      });
      const totRow3 = ws.addRow(["", "", "SALDO:", saldoFinal]);
      totRow3.eachCell((cell) => {
        cell.font = { bold: true };
      });

      ws.columns = [{ width: 14 }, { width: 14 }, { width: 36 }, { width: 18 }];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Cuenta_Corriente_Proveedor.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Archivo exportado correctamente");
    } catch {
      toast.error("Error al exportar a Excel");
    }
  };

  // Filtrado por proveedor y fechas
  const filteredMovimientos = movimientos.filter((mov) => {
    if (
      selectedProvider &&
      (mov.provider_type !== "proveedor" ||
        (mov.provider_id !== selectedProvider &&
          mov.cc_provider_id !== selectedProvider))
    )
      return false;
    // Filtrar por hotel seleccionado
    if (selectedHotel) {
      if (mov.provider_type !== "hotel" || mov.hotel_id !== selectedHotel)
        return false;
    }
    // Filtrar por transporte seleccionado
    if (selectedTransporte) {
      if (
        mov.provider_type !== "transporte" ||
        mov.transport_id !== selectedTransporte
      )
        return false;
    }
    // Filtrar por rango de fechas
    const filterDate = mov.departure_date || mov.date;
    if (fechaCreaDesde && filterDate) {
      if (filterDate < fechaCreaDesde) return false;
    }
    if (fechaCreaHasta && filterDate) {
      if (filterDate > fechaCreaHasta) return false;
    }
    return true;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(filteredMovimientos.length / pageSize);
  const paginatedMovimientos = filteredMovimientos.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const totalConsumos = filteredMovimientos
    .filter((m) => m.type === "consumo")
    .reduce((acc, m) => acc + (m.amount || 0), 0);
  const totalPagos = filteredMovimientos
    .filter((m) => m.type === "pago")
    .reduce((acc, m) => acc + (m.amount || 0), 0);
  const saldoFinal = totalConsumos - totalPagos;

  console.log(roomingHotels);

  return (
    <Container>
      <ToggleSalidas />
      <Link
        href={"/dashboard"}
        className="flex items-center justify-start gap-3">
        <ArrowLeft />
        <h1 className="font-bold">Volver al menú</h1>
      </Link>
      <button
        onClick={() => r.push("/administracion")}
        className="flex items-center my-3 justify-start gap-3">
        <ArrowLeft color="#6005F7" />
        <h2 className="font-semibold text-secondary hover:underline">
          Volver al Panel
        </h2>
      </button>

      <h3 className="text-center font-semibold text-lg text-black mb-4">
        Cuentas corrientes de Proveedores
      </h3>
      <section className="flex flex-col max-w-4xl mx-auto text-black">
        <button
          onClick={() => setModal(true)}
          className="text-primary font-bold py-2 px-4">
          {" "}
          Agregar Consumo/Pago
        </button>
        {/* Filters Form */}
        <form
          onSubmit={handleSearch}
          className="flex flex-col w-full gap-5 p-6">
          {/* Provider type toggle */}
          <label className="font-semibold text-center text-black">
            Fecha de consumo/pago
          </label>

          {/* Fecha de creación */}
          <div className="flex items-center w-full gap-3">
            <DateInput
              placeholder="Desde"
              value={fechaCreaDesde}
              onChange={setFechaCreaDesde}
            />
            <DateInput
              placeholder="Hasta"
              value={fechaCreaHasta}
              onChange={setFechaCreaHasta}
            />
          </div>

          <div className="flex flex-col gap-3">
            <select
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                if (e.target.value) {
                  setSelectedHotel("");
                  setSelectedTransporte("");
                }
              }}
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Proveedor</option>
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
            <select
              value={selectedTransporte}
              onChange={(e) => {
                setSelectedTransporte(e.target.value);
                if (e.target.value) {
                  setSelectedHotel("");
                  setSelectedProvider("");
                }
              }}
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Empresa de transporte</option>
              {transportes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={selectedHotel}
              onChange={(e) => {
                setSelectedHotel(e.target.value);
                if (e.target.value) {
                  setSelectedTransporte("");
                  setSelectedProvider("");
                }
              }}
              className="w-full border border-gray-300 py-2.5 px-4 bg-white text-gray-800 font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">Hotel</option>
              {hoteles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={loading || searching}
            className="bg-primary text-white rounded-lg px-4 py-2.5 font-bold shadow hover:bg-blue-700 transition-colors disabled:opacity-50"
            type="submit">
            {searching ? "Buscando..." : "Buscar"}
          </button>
        </form>

        {/* Resultados */}
        {searched && (
          <div className="flex flex-col text-black mt-6">
            {/* Header controls */}
            <div className="flex justify-end mb-3">
              <button
                onClick={handleClear}
                className="text-xs md:text-sm text-black font-semibold hover:underline">
                Limpiar búsqueda
              </button>
            </div>

            {/* Tabla de movimientos */}
            <div className="overflow-x-auto border shadow-sm bg-white mb-6">
              <table className="w-full text-xs md:text-sm text-left">
                <thead className="text-white bg-black">
                  <tr className="divide-x divide-white">
                    <th className="py-3 px-4 font-bold text-nowrap">
                      Fecha de salida
                    </th>
                    <th className="py-3 px-4 font-bold">Tipo</th>
                    <th className="py-3 px-4 font-bold">Régimen</th>
                    <th className="py-3 px-4 font-bold">Detalle</th>
                    <th className="py-3 px-4 font-bold text-right">Saldo</th>
                    <th className="py-3 px-4 font-bold text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {false && (
                    <tr className="divide-x divide-black">
                      <td className="py-3 text-center px-4">01/06/26</td>
                      <td className="py-3 text-center px-4 text-black font-bold">
                        Consumo
                      </td>
                      <td className="py-3 text-center px-4">MAP</td>
                      <td className="py-3 text-start px-4">
                        IN Hotel Garden 20/06/25
                      </td>
                      <td className={`py-3 px-4 text-center font-medium`}>
                        $100.000
                      </td>

                      <td className="py-3 flex items-center justify-center gap-2">
                        <button onClick={closeRoomingModal}>
                          <svg
                            className="cursor-pointer"
                            width="19"
                            height="19"
                            viewBox="0 0 19 19"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M13.4583 2.375C13.8783 2.375 14.281 2.54181 14.5779 2.83875C14.8749 3.13568 15.0417 3.53841 15.0417 3.95833V4.75H15.8333C16.0433 4.75 16.2447 4.83341 16.3931 4.98187C16.5416 5.13034 16.625 5.3317 16.625 5.54167C16.625 5.75163 16.5416 5.95299 16.3931 6.10146C16.2447 6.24993 16.0433 6.33333 15.8333 6.33333V15.0417C16.0433 15.0417 16.2447 15.1251 16.3931 15.2735C16.5416 15.422 16.625 15.6234 16.625 15.8333C16.625 16.0433 16.5416 16.2447 16.3931 16.3931C16.2447 16.5416 16.0433 16.625 15.8333 16.625H10.6875V13.0625C10.6875 12.7476 10.5624 12.4455 10.3397 12.2228C10.117 12.0001 9.81494 11.875 9.5 11.875C9.18506 11.875 8.88301 12.0001 8.66031 12.2228C8.43761 12.4455 8.3125 12.7476 8.3125 13.0625V16.625H3.16667C2.9567 16.625 2.75534 16.5416 2.60687 16.3931C2.45841 16.2447 2.375 16.0433 2.375 15.8333C2.375 15.6234 2.45841 15.422 2.60687 15.2735C2.75534 15.1251 2.9567 15.0417 3.16667 15.0417V6.33333C2.9567 6.33333 2.75534 6.24993 2.60687 6.10146C2.45841 5.95299 2.375 5.75163 2.375 5.54167C2.375 5.3317 2.45841 5.13034 2.60687 4.98187C2.75534 4.83341 2.9567 4.75 3.16667 4.75H3.95833V3.95833C3.95833 3.53841 4.12515 3.13568 4.42208 2.83875C4.71901 2.54181 5.12174 2.375 5.54167 2.375H13.4583ZM6.33333 10.2917C6.12337 10.2917 5.92201 10.3751 5.77354 10.5235C5.62507 10.672 5.54167 10.8734 5.54167 11.0833V11.875C5.54167 12.085 5.62507 12.2863 5.77354 12.4348C5.92201 12.5833 6.12337 12.6667 6.33333 12.6667C6.5433 12.6667 6.74466 12.5833 6.89313 12.4348C7.04159 12.2863 7.125 12.085 7.125 11.875V11.0833C7.125 10.8734 7.04159 10.672 6.89313 10.5235C6.74466 10.3751 6.5433 10.2917 6.33333 10.2917ZM12.6667 10.2917C12.4728 10.2917 12.2856 10.3629 12.1407 10.4917C11.9958 10.6206 11.9032 10.7981 11.8805 10.9907L11.875 11.0833V11.875C11.8752 12.0768 11.9525 12.2709 12.091 12.4176C12.2295 12.5643 12.4188 12.6526 12.6203 12.6644C12.8217 12.6763 13.0201 12.6107 13.1748 12.4812C13.3295 12.3517 13.429 12.168 13.4528 11.9676L13.4583 11.875V11.0833C13.4583 10.8734 13.3749 10.672 13.2265 10.5235C13.078 10.3751 12.8766 10.2917 12.6667 10.2917ZM6.33333 7.125C6.13943 7.12503 5.95228 7.19622 5.80737 7.32507C5.66247 7.45392 5.5699 7.63147 5.54721 7.82404L5.54167 7.91667V8.70833C5.54189 8.91011 5.61915 9.10419 5.75767 9.25092C5.89619 9.39764 6.0855 9.48594 6.28694 9.49776C6.48837 9.50959 6.68672 9.44405 6.84145 9.31454C6.99618 9.18503 7.09563 9.00133 7.11946 8.80096L7.125 8.70833V7.91667C7.125 7.7067 7.04159 7.50534 6.89313 7.35687C6.74466 7.20841 6.5433 7.125 6.33333 7.125ZM9.5 7.125C9.30609 7.12503 9.11894 7.19622 8.97404 7.32507C8.82914 7.45392 8.73656 7.63147 8.71388 7.82404L8.70833 7.91667V8.70833C8.70856 8.91011 8.78582 9.10419 8.92434 9.25092C9.06286 9.39764 9.25217 9.48594 9.4536 9.49776C9.65504 9.50959 9.85338 9.44405 10.0081 9.31454C10.1629 9.18503 10.2623 9.00133 10.2861 8.80096L10.2917 8.70833V7.91667C10.2917 7.7067 10.2083 7.50534 10.0598 7.35687C9.91133 7.20841 9.70996 7.125 9.5 7.125ZM12.6667 7.125C12.4567 7.125 12.2553 7.20841 12.1069 7.35687C11.9584 7.50534 11.875 7.7067 11.875 7.91667V8.70833C11.875 8.9183 11.9584 9.11966 12.1069 9.26813C12.2553 9.41659 12.4567 9.5 12.6667 9.5C12.8766 9.5 13.078 9.41659 13.2265 9.26813C13.3749 9.11966 13.4583 8.9183 13.4583 8.70833V7.91667C13.4583 7.7067 13.3749 7.50534 13.2265 7.35687C13.078 7.20841 12.8766 7.125 12.6667 7.125ZM13.4583 3.95833H5.54167V4.75H13.4583V3.95833Z"
                              fill="black"
                            />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  )}
                  {filteredMovimientos.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-8 text-center text-gray-500">
                        No hay movimientos registrados para el proveedor y rango
                        seleccionado.
                      </td>
                    </tr>
                  ) : (
                    paginatedMovimientos.map((mov, i) => (
                      <tr key={mov.id || i} className="divide-x divide-black">
                        <td className="py-3 px-4 font-semibold">
                          {formatDateDDMMYY(mov.departure_date || mov.date)}
                        </td>
                        <td className="py-3 px-4 text-black font-bold">
                          {mov.type === "consumo" ? "Consumo" : "Pago"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {mov.regimen ?? "-"}
                        </td>
                        <td className="py-3 px-4">
                          {mov.provider_type === "transporte"
                            ? mov.detail?.slice(0, 50) + " ..."
                            : mov.detail}
                        </td>
                        <td
                          className={`py-3 px-4 text-start font-bold ${mov.provider_type === "proveedor" ? "text-black" : mov.type === "consumo" ? "text-red-600" : "text-green-600"}`}>
                          {mov.provider_type === "proveedor"
                            ? ""
                            : mov.type === "consumo"
                              ? "-"
                              : "+"}
                          {formatMonto(mov.amount || 0) + ".00"}
                        </td>

                        {mov.provider_type === "proveedor" &&
                        mov.hotel_id &&
                        !mov.excursion_id ? (
                          <td className="py-3 flex items-center justify-center gap-2">
                            <button
                              onClick={() => void openRoomingModal(mov)}
                              aria-label="Ver rooming del consumo">
                              <svg
                                className="cursor-pointer"
                                width="19"
                                height="19"
                                viewBox="0 0 19 19"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                  fillRule="evenodd"
                                  clipRule="evenodd"
                                  d="M13.4583 2.375C13.8783 2.375 14.281 2.54181 14.5779 2.83875C14.8749 3.13568 15.0417 3.53841 15.0417 3.95833V4.75H15.8333C16.0433 4.75 16.2447 4.83341 16.3931 4.98187C16.5416 5.13034 16.625 5.3317 16.625 5.54167C16.625 5.75163 16.5416 5.95299 16.3931 6.10146C16.2447 6.24993 16.0433 6.33333 15.8333 6.33333V15.0417C16.0433 15.0417 16.2447 15.1251 16.3931 15.2735C16.5416 15.422 16.625 15.6234 16.625 15.8333C16.625 16.0433 16.5416 16.2447 16.3931 16.3931C16.2447 16.5416 16.0433 16.625 15.8333 16.625H10.6875V13.0625C10.6875 12.7476 10.5624 12.4455 10.3397 12.2228C10.117 12.0001 9.81494 11.875 9.5 11.875C9.18506 11.875 8.88301 12.0001 8.66031 12.2228C8.43761 12.4455 8.3125 12.7476 8.3125 13.0625V16.625H3.16667C2.9567 16.625 2.75534 16.5416 2.60687 16.3931C2.45841 16.2447 2.375 16.0433 2.375 15.8333C2.375 15.6234 2.45841 15.422 2.60687 15.2735C2.75534 15.1251 2.9567 15.0417 3.16667 15.0417V6.33333C2.9567 6.33333 2.75534 6.24993 2.60687 6.10146C2.45841 5.95299 2.375 5.75163 2.375 5.54167C2.375 5.3317 2.45841 5.13034 2.60687 4.98187C2.75534 4.83341 2.9567 4.75 3.16667 4.75H3.95833V3.95833C3.95833 3.53841 4.12515 3.13568 4.42208 2.83875C4.71901 2.54181 5.12174 2.375 5.54167 2.375H13.4583ZM6.33333 10.2917C6.12337 10.2917 5.92201 10.3751 5.77354 10.5235C5.62507 10.672 5.54167 10.8734 5.54167 11.0833V11.875C5.54167 12.085 5.62507 12.2863 5.77354 12.4348C5.92201 12.5833 6.12337 12.6667 6.33333 12.6667C6.5433 12.6667 6.74466 12.5833 6.89313 12.4348C7.04159 12.2863 7.125 12.085 7.125 11.875V11.0833C7.125 10.8734 7.04159 10.672 6.89313 10.5235C6.74466 10.3751 6.5433 10.2917 6.33333 10.2917ZM12.6667 10.2917C12.4728 10.2917 12.2856 10.3629 12.1407 10.4917C11.9958 10.6206 11.9032 10.7981 11.8805 10.9907L11.875 11.0833V11.875C11.8752 12.0768 11.9525 12.2709 12.091 12.4176C12.2295 12.5643 12.4188 12.6526 12.6203 12.6644C12.8217 12.6763 13.0201 12.6107 13.1748 12.4812C13.3295 12.3517 13.429 12.168 13.4528 11.9676L13.4583 11.875V11.0833C13.4583 10.8734 13.3749 10.672 13.2265 10.5235C13.078 10.3751 12.8766 10.2917 12.6667 10.2917ZM6.33333 7.125C6.13943 7.12503 5.95228 7.19622 5.80737 7.32507C5.66247 7.45392 5.5699 7.63147 5.54721 7.82404L5.54167 7.91667V8.70833C5.54189 8.91011 5.61915 9.10419 5.75767 9.25092C5.89619 9.39764 6.0855 9.48594 6.28694 9.49776C6.48837 9.50959 6.68672 9.44405 6.84145 9.31454C6.99618 9.18503 7.09563 9.00133 7.11946 8.80096L7.125 8.70833V7.91667C7.125 7.7067 7.04159 7.50534 6.89313 7.35687C6.74466 7.20841 6.5433 7.125 6.33333 7.125ZM9.5 7.125C9.30609 7.12503 9.11894 7.19622 8.97404 7.32507C8.82914 7.45392 8.73656 7.63147 8.71388 7.82404L8.70833 7.91667V8.70833C8.70856 8.91011 8.78582 9.10419 8.92434 9.25092C9.06286 9.39764 9.25217 9.48594 9.4536 9.49776C9.65504 9.50959 9.85338 9.44405 10.0081 9.31454C10.1629 9.18503 10.2623 9.00133 10.2861 8.80096L10.2917 8.70833V7.91667C10.2917 7.7067 10.2083 7.50534 10.0598 7.35687C9.91133 7.20841 9.70996 7.125 9.5 7.125ZM12.6667 7.125C12.4567 7.125 12.2553 7.20841 12.1069 7.35687C11.9584 7.50534 11.875 7.7067 11.875 7.91667V8.70833C11.875 8.9183 11.9584 9.11966 12.1069 9.26813C12.2553 9.41659 12.4567 9.5 12.6667 9.5C12.8766 9.5 13.078 9.41659 13.2265 9.26813C13.3749 9.11966 13.4583 8.9183 13.4583 8.70833V7.91667C13.4583 7.7067 13.3749 7.50534 13.2265 7.35687C13.078 7.20841 12.8766 7.125 12.6667 7.125ZM13.4583 3.95833H5.54167V4.75H13.4583V3.95833Z"
                                  fill="black"
                                />
                              </svg>
                            </button>
                          </td>
                        ) : (
                          <td className="text-center">-</td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredMovimientos.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />

            <button
              onClick={handleExportExcel}
              className="py-2 px-4 rounded-lg font-medium w-full flex items-center justify-center gap-2">
              Exportar <Excel />
            </button>
            {/* Resumen de la Cuenta Corriente */}
            <div className="p-5 w-full">
              <h4 className="font-bold text-primary text-center text-sm md:text-base pb-2 mb-3">
                Resumen de la Cuenta Corriente
              </h4>
              <div className="text-xs md:text-sm flex flex-col gap-2 font-medium">
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total de consumos</span>
                  <span className="font-bold text-gray-900">
                    {formatMonto(totalConsumos)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                  <span>Total de pagos</span>
                  <span className="font-bold text-green-600">
                    {formatMonto(totalPagos)}
                  </span>
                </div>
                <div className="my-1"></div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-gray-900">Saldo</span>
                  <span
                    className={`text-sm ${saldoFinal > 0 ? "text-red-600" : "text-gray-900"}`}>
                    {formatMonto(saldoFinal)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
      {modal && (
        <ModalLayout
          setModalOpen={() => setModal(false)}
          title="Agregar Consumo/Pago"
          svg={<Administracion />}
          onSubmit={handleSubmitModal}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => e.preventDefault()}>
            {/* Tipo: Pago / Consumo */}
            <button
              type="button"
              className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
              onClick={() => {
                setFormData({
                  ...formData,
                  type: formData.type === "pago" ? "consumo" : "pago",
                });
              }}>
              {formData.type === "pago" ? "Pago" : "Consumo"}
            </button>
            {/* Tipo de proveedor: Hotel / Transporte */}
            <button
              type="button"
              className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
              onClick={() => {
                const next =
                  formData.provider === "hotel" ? "transporte" : "hotel";
                setFormData({ ...formData, provider: next, providerId: "" });
              }}>
              {formData.provider === "hotel"
                ? "Hotel"
                : "Empresa de Transporte"}
            </button>
            {/* Selector de proveedor específico */}
            <select
              className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
              value={formData.providerId}
              onChange={(e) =>
                setFormData({ ...formData, providerId: e.target.value })
              }>
              {formData.provider === "hotel" ? (
                <>
                  <option value="">Seleccionar hotel</option>
                  {hoteles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </>
              ) : (
                <>
                  <option value="">Seleccionar empresa de transporte</option>
                  {transportes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            {/* Fecha */}
            <DateInput
              value={formData.date}
              onChange={(val) => setFormData({ ...formData, date: val })}
            />
            {/* Detalle */}
            <input
              placeholder="Detalle"
              className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
              type="text"
              value={formData.detail}
              onChange={(e) =>
                setFormData({ ...formData, detail: e.target.value })
              }
            />
            {/* Campos condicionales: solo si type === 'pago' */}
            {formData.type === "pago" && (
              <>
                {/* Switch rotativo de método de pago */}
                <button
                  type="button"
                  className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
                  onClick={cyclePaymentMethod}>
                  {paymentMethodLabels[formData.paymentMethod]}
                </button>
                {/* Cuenta: solo si el método es transferencia */}
                {formData.paymentMethod === "transferencia" && (
                  <select
                    className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
                    value={formData.account}
                    onChange={(e) =>
                      setFormData({ ...formData, account: e.target.value })
                    }>
                    <option value="">Seleccionar una cuenta</option>
                    {cuentas.map((cuenta) => (
                      <option
                        className="text-black"
                        key={cuenta.id}
                        value={cuenta.id}>
                        {cuenta.account_title}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}
            {/* Monto */}
            <input
              placeholder="Monto"
              className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none"
              type="text"
              value={formData.ammount}
              onChange={(e) =>
                setFormData({ ...formData, ammount: e.target.value })
              }
            />
          </form>
        </ModalLayout>
      )}
      {(roomingModal || roomingClosing) && roomingMovement && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4 transition-opacity duration-300 ${roomingClosing ? "opacity-0" : "opacity-100"}`}>
          <div
            ref={divRef}
            className={`flex min-w-0 flex-col w-full max-w-5xl max-h-[90dvh] transform transition-transform duration-300 ease-in-out ${roomingOpening || roomingClosing ? "translate-x-full" : "translate-x-0"}`}>
            <div className="bg-[#eaefff] border-[#0546F7]/70 border min-w-0 rounded-2xl py-5 px-3 sm:py-8 sm:px-6 shadow-lg overflow-y-auto">
              <div className="flex items-center justify-between gap-4 mb-4 sm:mb-6">
                <h4 className="text-black font-bold flex-1 text-center text-base sm:text-xl">
                  {roomingMovement.hotel_id
                    ? `${roomingMovement.detail || "Rooming"}`
                    : "Rooming del consumo"}
                </h4>
              </div>
              {roomingLoading ? (
                <div
                  className="flex flex-col gap-4"
                  aria-busy="true"
                  aria-label="Cargando rooming">
                  <div className="h-8 bg-white/70 rounded animate-pulse" />
                  <div className="h-32 bg-white/70 rounded-2xl animate-pulse" />
                  <div className="h-24 bg-white/70 rounded-2xl animate-pulse" />
                </div>
              ) : roomingHotels.length === 0 ? (
                <p className="py-10 text-center text-gray-600">
                  No hay habitaciones para este consumo.
                </p>
              ) : (
                roomingHotels.map((hotel) => (
                  <div key={hotel.id} className="mb-6">
                    {Object.entries(hotel.roomTypes).map(
                      ([category, rooms]) =>
                        rooms.length > 0 && (
                          <div className="mb-6" key={category}>
                            <h6 className="md:text-center text-black font-semibold text-md my-4">
                              {ROOMING_TITLES[category] ||
                                category.replace(/_/g, " ")}
                            </h6>
                            <section className="flex flex-wrap items-center justify-center gap-4">
                              {rooms.map((room) => (
                                <section
                                  key={room.id}
                                  className="flex flex-col text-xs md:text-sm font-medium border-border border rounded-xl w-max shadow-sm">
                                  <div className="flex flex-wrap bg-[#F1F3F9] text-black py-3 divide-gray-300 divide-x items-center justify-center rounded-t-xl gap-2">
                                    {room.passengers.map((passenger, index) => (
                                      <span
                                        key={`${room.id}-${index}`}
                                        className="px-2 text-nowrap font-semibold">
                                        {passenger.name}[
                                        {passenger.passengerType}]
                                      </span>
                                    ))}
                                  </div>
                                  {room.providerName && (
                                    <p className="text-white bg-primary/50 w-full text-center py-1">
                                      Proveedor: {room.providerName}
                                    </p>
                                  )}
                                  <div className="bg-primary text-white text-center py-1.5 rounded-b-xl px-4">
                                    <p className="text-xs font-semibold capitalize">
                                      {parseRoomItem(room.type).label} (
                                      {room.id.includes("-H") ? "S/A" : room.id}
                                      )
                                    </p>
                                  </div>
                                </section>
                              ))}
                            </section>
                          </div>
                        ),
                    )}
                    <div className="flex items-center justify-center bg-transparent gap-2 md:gap-10 pb-2">
                      <div className="flex justify-start md:justify-center items-center text-xs w-full max-w-2xl overflow-x-auto">
                        <div className="border border-border rounded-t-2xl bg-white overflow-hidden w-full min-w-[500px] md:min-w-0 shadow-md">
                          <div className="grid grid-cols-3 border-border text-center font-bold text-black">
                            <div className="py-4 border-r border-b border-border">
                              TIPO
                            </div>
                            <div className="py-4 border-r border-b border-border">
                              TOTAL HABS
                            </div>
                            <div className="py-4 border-b border-border">
                              TOTAL PAX
                            </div>
                          </div>
                          <div className="divide-y divide-blue-400 text-center text-black font-medium">
                            {Object.entries(hotel.roomTypes)
                              .filter(([, rooms]) => rooms.length > 0)
                              .map(([category, rooms]) => (
                                <div
                                  className="grid grid-cols-3 font-semibold"
                                  key={`summary-${category}`}>
                                  <div className="py-4 border-r border-border">
                                    {ROOMING_TITLES[category] ||
                                      category.replace(/_/g, " ")}
                                  </div>
                                  <div className="py-4 border-r border-border">
                                    {rooms.length}
                                  </div>
                                  <div className="py-4">
                                    {rooms.reduce(
                                      (total, room) =>
                                        total + room.passengers.length,
                                      0,
                                    )}
                                  </div>
                                </div>
                              ))}
                            <div className="grid grid-cols-3 font-bold">
                              <div className="py-4 border-r border-border">
                                TOTALES
                              </div>
                              <div className="py-4 border-r border-border">
                                {hotel.summary.rooms}
                              </div>
                              <div className="py-4">
                                {hotel.summary.passengers}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
