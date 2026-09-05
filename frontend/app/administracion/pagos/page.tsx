"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import Excel from "@/app/components/icons/salidas/Excel";
import ModalLayout from "@/app/components/ModalLayout";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Pagination from "@/app/components/Pagination";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import {
  filterAndSortClients,
  getClientDisplayName,
} from "@/app/utils/clientSearch";

type PaymentMethod = "efectivo" | "tarjeta" | "transferencia" | "devolucion";

interface Pago {
  id: string;
  iweb_client_id: string;
  reserva_id: string;
  payment_method: string;
  date_pay: string;
  amount: number;
  currency: string;
  observations: string;
  card_number?: string | null;
  titular: string;
  operation_number?: string | null;
  quotes_number?: string | null;
  receipt_number: string;
}

export default function PagosPage() {
  const r = useRouter();
  const { user, iwebClient } = useAuth();

  const [reservaBusqueda, setReservaBusqueda] = useState("");
  const [clienteSelect, setClienteSelect] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [searched, setSearched] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tarjeta");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic lists from backend
  const [dbReservas, setDbReservas] = useState<any[]>([]);
  const [filteredReservas, setFilteredReservas] = useState<any[]>([]);
  const [realClients, setRealClients] = useState<any[]>([]);
  const [realAccounts, setRealAccounts] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedReserva, setSelectedReserva] = useState<any | null>(null);

  // Modals
  const [modalOpenPago, setModalOpenPago] = useState(false);
  const [modalOpenRecibo, setModalOpenRecibo] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalPaseDinero, setModalPaseDinero] = useState(false);

  const [loadingClients, setLoadingClients] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(filteredReservas.length / pageSize);
  const paginatedReservas = filteredReservas.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const filteredClients = useMemo(
    () => filterAndSortClients(realClients, clientSearch),
    [realClients, clientSearch],
  );

  // Selected receipt for electronic receipt popup
  const [selectedPago, setSelectedPago] = useState<Pago | null>(null);

  // Form states
  const [inputFecha, setInputFecha] = useState("");
  const [inputMonto, setInputMonto] = useState("");
  const [inputMoneda, setInputMoneda] = useState("$");
  const [inputTitular, setInputTitular] = useState("");
  const [inputTarjetaNum, setInputTarjetaNum] = useState("");
  const [inputTarjetaTipo, setInputTarjetaTipo] = useState("");
  const [inputOperacion, setInputOperacion] = useState("");
  const [inputCuotas, setInputCuotas] = useState("1");
  const [inputCuentaBanco, setInputCuentaBanco] = useState("");
  const [inputObservaciones, setInputObservaciones] = useState("");
  const [inputMetodoDevolucion, setInputMetodoDevolucion] = useState("");
  const [inputCuentaBancoDevolucion, setInputCuentaBancoDevolucion] =
    useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Form states for Pase de Dinero
  const [paseMonto, setPaseMonto] = useState("");
  const [paseMoneda] = useState("$");
  const [targetReservaId, setTargetReservaId] = useState("");
  const [isSubmittingPase, setIsSubmittingPase] = useState(false);

  const tarjetas = [
    { id: 1, label: "Visa Crédito" },
    { id: 2, label: "Visa Débito" },
    { id: 3, label: "Mastercard" },
    { id: 4, label: "American Express" },
  ];

  // Dynamic Payments list
  const [pagos, setPagos] = useState<Pago[]>([]);

  const loadedRef = useRef<string | null>(null);

  // Load initial data
  const loadInitialData = async () => {
    if (!user?.iweb_client_id) return;
    if (loadedRef.current === user.iweb_client_id) return;
    loadedRef.current = user.iweb_client_id;
    try {
      setLoadingClients(true);
      const [resList, clientsList, accountsList, packagesList] =
        await Promise.all([
          apiClient.getReservas(user.iweb_client_id),
          apiClient.getParameters("get_clients", user.iweb_client_id),
          apiClient.getAccounts(user.iweb_client_id),
          apiClient.getPackages(user.iweb_client_id),
        ]);
      setDbReservas(resList);
      setRealClients(clientsList);
      setRealAccounts(accountsList.filter((a: any) => a.active));
      setPackages(packagesList);
    } catch (err) {
      console.error("Error loading initial data in payments page:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [user?.iweb_client_id]);

  // Set default date on mount
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setInputFecha(today);
  }, []);

  const handleUploadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Helper to find real reservation total net price (Monto Neto = Total Bruto - Comisión)
  const getReservationPrice = (res: any): number => {
    if (!res) return 0;
    if (res.neto !== undefined && res.neto !== null) {
      return Number(res.neto);
    }
    if (
      res.total_amount !== undefined &&
      res.total_amount !== null &&
      res.total_amount > 0
    ) {
      const comm = Number(res.commission) || 0;
      return Math.max(0, Number(res.total_amount) - comm);
    }
    if (
      res.total_amout !== undefined &&
      res.total_amout !== null &&
      res.total_amout > 0
    ) {
      const comm = Number(res.commission) || 0;
      return Math.max(0, Number(res.total_amout) - comm);
    }
    const pkg = packages.find(
      (p) => p.id === res.package_id || p.dates?.includes(res.salida_id),
    );
    if (pkg) {
      const paxCount = Array.isArray(res.reservation_passengers)
        ? res.reservation_passengers.length
        : 1;
      const unitPrice =
        (pkg.price || 0) + (pkg.gastos || 0) + (pkg.adicional || 0);
      const totalBruto = unitPrice * Math.max(paxCount, 1);
      const client = realClients.find((c) => c.id === res.client_id);
      const commPct = Number(client?.commission || res.commission || 0);
      const comm = Math.round((totalBruto * commPct) / 100);
      return Math.max(0, totalBruto - comm);
    }
    return 0;
  };

  const totalDeLaReserva = selectedReserva
    ? Number(getReservationPrice(selectedReserva)) || 0
    : 0;

  // Keep original currency multiplication logic (if USD, multiply by 1000 for total comparison)
  const totalPagos = pagos.reduce((acc, p) => {
    const amt = p.amount || 0;
    const isUSD = p.currency === "U$D" || p.payment_method?.includes("U$D");
    return acc + (isUSD ? amt * 1000 : amt);
  }, 0);

  const saldoRestante = totalDeLaReserva - totalPagos;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reservaBusqueda && !clienteSelect) {
      toast.error(
        "Por favor, ingrese un término de búsqueda o seleccione un cliente.",
      );
      return;
    }

    const term = reservaBusqueda.toLowerCase().trim();

    // Find the name of the selected client if there is one
    const selectedClientObj = realClients.find((c) => c.id === clienteSelect);
    const selectedClientName = selectedClientObj
      ? (
          selectedClientObj.complete_name ||
          selectedClientObj.name_system ||
          ""
        ).toLowerCase()
      : "";

    const results = dbReservas.filter((res) => {
      const matchCode = term
        ? (res.codigo_reserva || "").toLowerCase().includes(term)
        : false;
      const matchPassenger = term
        ? (res.nombre_completo || "").toLowerCase().includes(term)
        : false;
      const matchText = term ? matchCode || matchPassenger : true;

      const matchClient = clienteSelect
        ? (res.client_id || "").toLowerCase() === clienteSelect.toLowerCase() ||
          (res.client_id || "").toLowerCase() === selectedClientName ||
          (res.client_nombre || "").toLowerCase() === selectedClientName
        : true;

      return matchText && matchClient;
    });

    setFilteredReservas(results);
    setSearched(true);
  };

  const handleClear = () => {
    setReservaBusqueda("");
    setClienteSelect("");
    setClientSearch("");
    setSearched(false);
    setFilteredReservas([]);
  };

  const formatMonto = (monto: number, moneda: string = "$") => {
    const num = Math.round(Number(monto) || 0);
    return `${moneda}${num.toLocaleString("es-AR")}`;
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "-";
    if (dateStr.includes("/")) return dateStr;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const getMoneda = (pago: Pago) => {
    return (
      pago.currency || (pago.payment_method?.includes("U$D") ? "U$D" : "$")
    );
  };

  const getMonedaNombre = (pago: Pago) => {
    return getMoneda(pago) === "$" ? "Pesos" : "Dólares";
  };

  const getReciboNumero = (pago: Pago) => {
    return pago.receipt_number || `RC-${pago.id.slice(0, 8).toUpperCase()}`;
  };

  const getDia = (dateStr: string) => {
    const d = formatDateDisplay(dateStr);
    return d.split("/")[0] || "";
  };
  const getMes = (dateStr: string) => {
    const d = formatDateDisplay(dateStr);
    return d.split("/")[1] || "";
  };
  const getAnio = (dateStr: string) => {
    const d = formatDateDisplay(dateStr);
    return d.split("/")[2] || "";
  };

  // Pre-submit validation
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMonto || parseFloat(inputMonto) <= 0) {
      toast.error("Por favor ingrese un monto válido mayor a 0");
      return;
    }
    if (!inputFecha) {
      toast.error("Por favor ingrese una fecha válida");
      return;
    }
    if (paymentMethod === "devolucion") {
      if (!inputMetodoDevolucion) {
        toast.error("Por favor seleccione un método de devolución");
        return;
      }
      if (
        inputMetodoDevolucion === "transferencia" &&
        !inputCuentaBancoDevolucion
      ) {
        toast.error(
          "Por favor seleccione una cuenta bancaria para la devolución",
        );
        return;
      }
    } else if (paymentMethod === "tarjeta") {
      if (!inputTarjetaTipo || !inputTarjetaNum || !inputTitular) {
        toast.error(
          "Por favor complete todos los datos obligatorios de la tarjeta",
        );
        return;
      }
    } else if (paymentMethod === "transferencia") {
      if (!inputCuentaBanco) {
        toast.error("Por favor seleccione una cuenta bancaria");
        return;
      }
    }

    setShowConfirmModal(true);
  };

  // Confirm and save payment
  const handleConfirmPago = async () => {
    if (!selectedReserva || !user?.iweb_client_id) return;

    if (paymentMethod === "devolucion") {
      await handleExecuteDevolucion();
      setShowConfirmModal(false);
      return;
    }

    const amountNum = parseFloat(inputMonto);

    let tipoStr = "";
    if (paymentMethod === "efectivo") {
      tipoStr = `Efectivo (${inputMoneda})`;
    } else if (paymentMethod === "transferencia") {
      const selectedAcc = realAccounts.find((a) => a.id === inputCuentaBanco);
      const accTitle = selectedAcc?.account_title || inputCuentaBanco;
      tipoStr = `Transf. (${accTitle})`;
    } else {
      tipoStr = `Tarjeta (${inputTarjetaTipo} terminada en ${inputTarjetaNum.slice(-4)})`;
    }

    const formData = new FormData();
    formData.append("reserva_id", selectedReserva.id);
    formData.append("payment_method", tipoStr);
    formData.append("date_pay", inputFecha);
    formData.append("amount", String(Math.round(amountNum)));
    formData.append("currency", inputMoneda);
    formData.append(
      "observations",
      inputObservaciones || "Pago imputado a la reserva",
    );
    if (paymentMethod === "transferencia" && inputCuentaBanco)
      formData.append("account_id", inputCuentaBanco);
    if (paymentMethod === "tarjeta" && inputTarjetaNum)
      formData.append("card_number", inputTarjetaNum);
    formData.append(
      "titular",
      inputTitular || selectedReserva.nombre_completo || "Cliente",
    );
    if (paymentMethod === "tarjeta" && inputOperacion)
      formData.append("operation_number", inputOperacion);
    if (paymentMethod === "tarjeta" && inputCuotas)
      formData.append("quotes_number", inputCuotas);

    if (selectedFile) {
      formData.append("receipt_file", selectedFile);
    }

    try {
      await apiClient.createPago(user.iweb_client_id, formData);
      toast.success("Pago agregado y comprobante emitido");
      setShowConfirmModal(false);

      // Reset fields
      setInputMonto("");
      setInputTarjetaNum("");
      setInputTitular("");
      setInputOperacion("");
      setInputCuotas("1");
      setInputObservaciones("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Reload payments list
      const pagosList = await apiClient.getPagosReserva(
        user.iweb_client_id,
        selectedReserva.id,
      );
      setPagos(pagosList);
    } catch (err) {
      console.error(err);
      toast.error("Error al registrar el pago");
    }
  };

  const handleExecuteDevolucion = async () => {
    if (!selectedReserva || !user?.iweb_client_id) return;
    const amountNum = parseFloat(inputMonto);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Por favor, ingrese un monto válido mayor a 0.");
      return;
    }
    if (!inputFecha) {
      toast.error("Por favor, ingrese una fecha válida.");
      return;
    }
    if (!inputMetodoDevolucion) {
      toast.error("Por favor, seleccione un método de devolución.");
      return;
    }
    if (
      inputMetodoDevolucion === "transferencia" &&
      !inputCuentaBancoDevolucion
    ) {
      toast.error("Por favor, seleccione una cuenta bancaria.");
      return;
    }

    let tipoStr = `Devolución de Dinero (${inputMetodoDevolucion})`;
    if (inputMetodoDevolucion === "transferencia") {
      const selectedAcc = realAccounts.find(
        (a) => a.id === inputCuentaBancoDevolucion,
      );
      const accTitle = selectedAcc?.account_title || inputCuentaBancoDevolucion;
      tipoStr = `Devolución de Dinero (Transf. ${accTitle})`;
    } else if (inputMetodoDevolucion === "efectivo") {
      tipoStr = `Devolución de Dinero (Efectivo ${inputMoneda})`;
    }

    try {
      const formData = new FormData();
      formData.append("reserva_id", selectedReserva.id);
      formData.append("payment_method", tipoStr);
      formData.append("date_pay", inputFecha);
      formData.append("amount", String(-Math.abs(Math.round(amountNum))));
      formData.append("currency", inputMoneda);
      formData.append(
        "observations",
        inputObservaciones || "Devolución de Dinero",
      );
      if (
        inputMetodoDevolucion === "transferencia" &&
        inputCuentaBancoDevolucion
      )
        formData.append("account_id", inputCuentaBancoDevolucion);
      formData.append(
        "titular",
        inputTitular || selectedReserva.nombre_completo || "Cliente",
      );
      await apiClient.createPago(user.iweb_client_id, formData);
      toast.success("Devolución registrada correctamente");
      setInputMonto("");
      setInputFecha("");
      setInputMetodoDevolucion("");
      setInputCuentaBancoDevolucion("");
      setInputObservaciones("");
      const pagosList = await apiClient.getPagosReserva(
        user.iweb_client_id,
        selectedReserva.id,
      );
      setPagos(pagosList);
    } catch (error) {
      console.error(error);
      toast.error("Error al registrar la devolución");
    }
  };

  const handleExecutePaseDinero = async (e?: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!selectedReserva || !user?.iweb_client_id) return;
    if (!targetReservaId) {
      toast.error("Por favor, seleccione la reserva de destino.");
      return;
    }
    const amountNum = parseFloat(paseMonto);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Por favor, ingrese un monto válido mayor a 0.");
      return;
    }

    const targetReserva = dbReservas.find((r) => r.id === targetReservaId);
    if (!targetReserva) {
      toast.error("Reserva de destino no encontrada.");
      return;
    }

    try {
      setIsSubmittingPase(true);
      const today = new Date().toISOString().split("T")[0];

      const payloadSalida = {
        reserva_id: selectedReserva.id,
        payment_method: `Pase de dinero (Salida a ${targetReserva.codigo_reserva || targetReserva.id})`,
        date_pay: today,
        amount: -Math.abs(Math.round(amountNum)),
        currency: paseMoneda,
        observations: `Pase de dinero derivado a la reserva ${targetReserva.codigo_reserva || targetReserva.id}`,
        titular: selectedReserva.nombre_completo || "Cliente Origen",
      };

      const payloadEntrada = {
        reserva_id: targetReserva.id,
        payment_method: `Pase de dinero (Entrada desde ${selectedReserva.codigo_reserva || selectedReserva.id})`,
        date_pay: today,
        amount: Math.abs(Math.round(amountNum)),
        currency: paseMoneda,
        observations: `Pase de dinero recibido desde la reserva ${selectedReserva.codigo_reserva || selectedReserva.id}`,
        titular: targetReserva.nombre_completo || "Cliente Destino",
      };

      await Promise.all([
        apiClient.createPago(user.iweb_client_id, payloadSalida),
        apiClient.createPago(user.iweb_client_id, payloadEntrada),
      ]);

      toast.success("Pase de dinero realizado con éxito");
      setModalPaseDinero(false);
      setPaseMonto("");
      setTargetReservaId("");

      const updatedPagos = await apiClient.getPagosReserva(
        user.iweb_client_id,
        selectedReserva.id,
      );
      setPagos(updatedPagos);
    } catch (err) {
      console.error("Error al realizar el pase de dinero:", err);
      toast.error("Error al realizar el pase de dinero");
    } finally {
      setIsSubmittingPase(false);
    }
  };

  const handleOpenPagoModal = async (res: any) => {
    setSelectedReserva(res);
    setModalOpenPago(true);
    setModalLoading(true);
    if (user?.iweb_client_id) {
      try {
        const [pagosList, liq] = await Promise.all([
          apiClient.getPagosReserva(user.iweb_client_id, res.id),
          apiClient.getLiquidacionByBooking(res.id).catch(() => null),
        ]);
        setPagos(pagosList);
        if (liq) {
          const bruto = Number(liq.total_amout) || 0;
          const comm = Number(liq.commission) || 0;
          const neto = Math.max(0, bruto - comm);
          setSelectedReserva((prev: any) =>
            prev
              ? {
                  ...prev,
                  total_bruto: bruto,
                  commission: comm,
                  neto: neto,
                  total_amount: neto,
                  total_amout: neto,
                }
              : prev,
          );
        }
      } catch (err) {
        console.error("Error loading pagos for reservation:", err);
      } finally {
        setModalLoading(false);
      }
    } else {
      setModalLoading(false);
    }
  };

  const handleDeletePago = async (pagoId: string) => {
    if (!user?.iweb_client_id || !selectedReserva) return;
    if (!window.confirm("¿Está seguro de eliminar este pago?")) return;
    try {
      await apiClient.deletePago(user.iweb_client_id, pagoId);
      toast.success("Pago eliminado con éxito");
      const pagosList = await apiClient.getPagosReserva(
        user.iweb_client_id,
        selectedReserva.id,
      );
      setPagos(pagosList);
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el pago");
    }
  };

  const handleOpenRecibo = (pago: Pago) => {
    setSelectedPago(pago);
    setModalOpenRecibo(true);
  };

  const handleExportExcel = async () => {
    if (!selectedReserva) return;
    if (pagos.length === 0) {
      toast.error("No hay pagos registrados para exportar en esta reserva.");
      return;
    }

    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet("Historial de Pagos");

      // Title & Reservation Info Block
      ws.addRow(["HISTORIAL DE PAGOS DE LA RESERVA"]);
      ws.mergeCells("A1:G1");
      const titleCell = ws.getCell("A1");
      titleCell.font = { size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF0546F7" },
      };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };

      ws.addRow([]);
      ws.addRow([
        "Reserva:",
        selectedReserva.codigo_reserva || selectedReserva.id,
      ]);
      ws.addRow([
        "Titular / Cliente:",
        selectedReserva.nombre_completo ||
          selectedReserva.client_nombre ||
          "Cliente",
      ]);
      ws.addRow(["Total Reserva:", totalDeLaReserva]);
      ws.addRow(["Total Pagos:", totalPagos]);
      ws.addRow(["Saldo Restante:", saldoRestante]);
      ws.addRow([]);

      // Style info block label cells
      [3, 4, 5, 6, 7].forEach((rowNum) => {
        const cell = ws.getCell(`A${rowNum}`);
        cell.font = { bold: true };
      });

      // Table Headers
      const headerRow = ws.addRow([
        "Fecha",
        "Método de Pago",
        "Titular",
        "Monto",
        "Moneda",
        "N° Operación",
        "Observaciones",
      ]);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF1F2937" },
        };
        cell.alignment = { horizontal: "center", vertical: "middle" };
      });

      // Data Rows
      pagos.forEach((pago) => {
        const row = ws.addRow([
          formatDateDisplay(pago.date_pay),
          pago.payment_method || "-",
          pago.titular || "-",
          pago.amount,
          getMoneda(pago),
          pago.operation_number || "-",
          pago.observations || "-",
        ]);

        row.getCell(4).numFmt = "#,##0";
      });

      // Total Row
      const totalRow = ws.addRow([
        "TOTAL ACUMULADO",
        "",
        "",
        totalPagos,
        "$",
        "",
        "",
      ]);
      totalRow.eachCell((cell) => {
        cell.font = { bold: true };
      });
      totalRow.getCell(4).numFmt = "#,##0";

      // Column widths
      ws.columns = [
        { width: 14 },
        { width: 32 },
        { width: 26 },
        { width: 16 },
        { width: 10 },
        { width: 22 },
        { width: 35 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const resCode = (selectedReserva.codigo_reserva || "Reserva").replace(
        /[\s#/]+/g,
        "_",
      );
      a.download = `Pagos_${resCode}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Historial de pagos exportado a Excel correctamente");
    } catch (error) {
      console.error("Error al exportar pagos a Excel:", error);
      toast.error("Error al generar el archivo Excel");
    }
  };

  return (
    <Container>
      <ToggleSalidas />
      <Link href="/dashboard" className="flex items-center justify-start gap-3">
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

      <div className="max-w-xl my-10 mx-auto w-full">
        {/* Limpiar búsqueda */}
        {searched && (
          <div className="flex justify-end mb-2">
            <button
              onClick={handleClear}
              className="text-sm text-black font-medium hover:underline">
              Limpiar búsqueda
            </button>
          </div>
        )}

        <h3 className="text-center md:text-lg font-semibold text-black py-4">
          Buscar reserva
        </h3>
        {/* Formulario de búsqueda */}
        <form onSubmit={handleSearch} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Número de reserva (ej. MDQ #1)"
            value={reservaBusqueda}
            onChange={(e) => setReservaBusqueda(e.target.value)}
            className="w-full border border-black shadow-md shadow-black/40 rounded-sm py-2.5 px-3 text-black/80 font-medium  focus:outline-none focus:ring-2 focus:ring-primary bg-white"
          />
          {loadingClients ? (
            <div className="flex flex-col gap-4">
              <div className="w-full h-11 bg-gray-200 animate-pulse rounded-sm border border-black shadow-md"></div>
              <div className="w-full h-11 bg-gray-200 animate-pulse rounded-sm border border-black shadow-md"></div>
            </div>
          ) : (
            <>
              <input
                type="text"
                placeholder="Filtrar clientes"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full border border-black shadow-md shadow-black/40 rounded-sm py-2.5 px-3 text-black/80 font-medium focus:outline-none focus:ring-2 focus:ring-primary bg-white"
              />
              <select
                value={clienteSelect}
                onChange={(e) => setClienteSelect(e.target.value)}
                className="w-full border border-black shadow-md text-black/80 shadow-black/40 rounded-sm py-2.5 px-3 font-medium focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                <option value="">Filtrar por Cliente</option>
                {filteredClients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {getClientDisplayName(c)}
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            type="submit"
            className="w-full bg-primary md:text-lg text-white shadow-lg shadow-black/60 font-medium py-2.5 rounded-md hover:bg-blue-700 transition-colors">
            Buscar Reserva
          </button>
        </form>

        {/* Resultados */}
        {searched && (
          <>
            <h4 className="text-center md:text-lg font-semibold my-2 text-black py-4">
              Cargar pago a una reserva
            </h4>
            {filteredReservas.length === 0 ? (
              <p className="text-center text-gray-500 font-medium my-2">
                No se encontraron reservas.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {paginatedReservas.map((res) => (
                  <div
                    key={res.id}
                    className="w-full font-semibold flex border gap-5 divide-x divide-black border-black shadow-md shadow-black/40 rounded-sm px-3 text-black/80 bg-white items-center">
                    <p className="py-2.5 pr-5 w-25 pl-2 text-primary">
                      {res.codigo_reserva || "S/D"}
                    </p>
                    <div className="flex-1 flex justify-between items-center py-2.5 pl-4 text-start">
                      <p className="font-bold text-gray-800">
                        {res.titulo?.trim() ||
                          res.client_nombre ||
                          getClientDisplayName(
                            realClients.find((client) => client.id === res.client_id),
                          ) ||
                          "Cliente desconocido"}
                      </p>
                      <button
                        onClick={() => handleOpenPagoModal(res)}
                        className="bg-primary hover:bg-blue-700 text-white rounded-full p-1 shadow transition-colors">
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredReservas.length}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Modal pase de dinero */}
      {modalPaseDinero && (
        <ModalLayout
          bg="bg-[#F1F1F1]"
          titleColor="text-primary"
          maxWidth="max-w-5xl"
          setModalOpen={() => setModalPaseDinero(false)}
          onSubmit={handleExecutePaseDinero}
          title="Datos de la reserva"
          svg={
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12.3747 13.75H5.49967C3.77084 13.75 2.90734 13.75 2.37017 13.2128C1.83301 12.6757 1.83301 11.8122 1.83301 10.0833V6.41667C1.83301 4.68783 1.83301 3.82433 2.37017 3.28717C2.90734 2.75 3.77084 2.75 5.49967 2.75H16.4997C18.2285 2.75 19.092 2.75 19.6292 3.28717C20.1663 3.82433 20.1663 4.68783 20.1663 6.41667V11C20.1663 11.8543 20.1663 12.2815 20.027 12.6179C19.9349 12.8405 19.7998 13.0427 19.6294 13.2131C19.4591 13.3834 19.2568 13.5185 19.0343 13.6107C18.6978 13.75 18.2707 13.75 17.4163 13.75"
                stroke="#0546F7"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.9167 15.5832C11.9167 14.8538 12.2064 14.1544 12.7221 13.6386C13.2378 13.1229 13.9373 12.8332 14.6667 12.8332V10.9998C14.6667 10.2705 14.9564 9.57102 15.4721 9.05529C15.9878 8.53957 16.6873 8.24984 17.4167 8.24984V13.2915C17.4167 15.4319 17.4167 16.5017 16.984 17.312C16.6422 17.9515 16.1184 18.4753 15.4788 18.8172C14.6685 19.2498 13.5988 19.2498 11.4583 19.2498H11C9.29133 19.2498 8.437 19.2498 7.76417 18.9703C7.31917 18.7862 6.91478 18.5163 6.57411 18.1759C6.23343 17.8356 5.96314 17.4314 5.77867 16.9866C5.5 16.3128 5.5 15.4585 5.5 13.7498M12.8333 8.24984C12.8333 8.73607 12.6402 9.20238 12.2964 9.5462C11.9525 9.89002 11.4862 10.0832 11 10.0832C10.5138 10.0832 10.0475 9.89002 9.70364 9.5462C9.35982 9.20238 9.16667 8.73607 9.16667 8.24984C9.16667 7.76361 9.35982 7.29729 9.70364 6.95347C10.0475 6.60966 10.5138 6.4165 11 6.4165C11.4862 6.4165 11.9525 6.60966 12.2964 6.95347C12.6402 7.29729 12.8333 7.76361 12.8333 8.24984Z"
                stroke="#0546F7"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }>
          <div className="text-black flex-1 text-sm md:text-base">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-gray-700">
                Total de la reserva
              </span>
              <span className="font-bold text-gray-900">
                {formatMonto(totalDeLaReserva)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-gray-700">Total de pagos</span>
              <span className="font-bold text-black">
                {formatMonto(totalPagos)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-700">Saldo</span>
              <span className="font-bold text-secondary">
                {formatMonto(saldoRestante)}
              </span>
            </div>
          </div>
          <hr className="border-gray-300 my-4" />
          <div>
            <div className="flex items-center justify-center gap-2 mb-3">
              <h6 className="font-semibold text-primary">Pase de dinero</h6>
              <svg
                width="22"
                height="22"
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12.3747 13.75H5.49967C3.77084 13.75 2.90734 13.75 2.37017 13.2128C1.83301 12.6757 1.83301 11.8122 1.83301 10.0833V6.41667C1.83301 4.68783 1.83301 3.82433 2.37017 3.28717C2.90734 2.75 3.77084 2.75 5.49967 2.75H16.4997C18.2285 2.75 19.092 2.75 19.6292 3.28717C20.1663 3.82433 20.1663 4.68783 20.1663 6.41667V11C20.1663 11.8543 20.1663 12.2815 20.027 12.6179C19.9349 12.8405 19.7998 13.0427 19.6294 13.2131C19.4591 13.3834 19.2568 13.5185 19.0343 13.6107C18.6978 13.75 18.2707 13.75 17.4163 13.75"
                  stroke="#0546F7"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11.9167 15.5832C11.9167 14.8538 12.2064 14.1544 12.7221 13.6386C13.2378 13.1229 13.9373 12.8332 14.6667 12.8332V10.9998C14.6667 10.2705 14.9564 9.57102 15.4721 9.05529C15.9878 8.53957 16.6873 8.24984 17.4167 8.24984V13.2915C17.4167 15.4319 17.4167 16.5017 16.984 17.312C16.6422 17.9515 16.1184 18.4753 15.4788 18.8172C14.6685 19.2498 13.5988 19.2498 11.4583 19.2498H11C9.29133 19.2498 8.437 19.2498 7.76417 18.9703C7.31917 18.7862 6.91478 18.5163 6.57411 18.1759C6.23343 17.8356 5.96314 17.4314 5.77867 16.9866C5.5 16.3128 5.5 15.4585 5.5 13.7498M12.8333 8.24984C12.8333 8.73607 12.6402 9.20238 12.2964 9.5462C11.9525 9.89002 11.4862 10.0832 11 10.0832C10.5138 10.0832 10.0475 9.89002 9.70364 9.5462C9.35982 9.20238 9.16667 8.73607 9.16667 8.24984C9.16667 7.76361 9.35982 7.29729 9.70364 6.95347C10.0475 6.60966 10.5138 6.4165 11 6.4165C11.4862 6.4165 11.9525 6.60966 12.2964 6.95347C12.6402 7.29729 12.8333 7.76361 12.8333 8.24984Z"
                  stroke="#0546F7"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <section className="mx-1 sm:mx-10 md:mx-40 flex flex-col sm:flex-row justify-between gap-4 sm:gap-6">
              <div className="flex flex-col gap-2 flex-1">
                <p className="font-semibold text-lg text-black">
                  Disponible para pasar
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Monto"
                    value={paseMonto}
                    onChange={(e) => setPaseMonto(e.target.value)}
                    className="shadow-xl border border-gray-200 text-black py-2 rounded-md w-full text-xl p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <p className="font-semibold text-lg text-secondary text-end">
                  {formatMonto(totalPagos)}
                </p>
                <select
                  required
                  value={targetReservaId}
                  onChange={(e) => setTargetReservaId(e.target.value)}
                  className="bg-primary text-gray-100 font-semibold py-2 rounded-md w-full text-lg p-2 focus:outline-none cursor-pointer">
                  <option value="" disabled className="text-gray-400">
                    Reserva
                  </option>
                  {dbReservas
                    .filter(
                      (r) => !selectedReserva || r.id !== selectedReserva.id,
                    )
                    .map((r) => (
                      <option
                        key={r.id}
                        value={r.id}
                        className="bg-white text-black text-sm">
                        {r.codigo_reserva || r.id} —{" "}
                        {r.nombre_completo || r.client_nombre || "Pasajero"}
                      </option>
                    ))}
                </select>
              </div>
            </section>
          </div>
        </ModalLayout>
      )}

      {/* Modal Datos de la reserva */}
      {modalOpenPago && (
        <ModalLayout
          bg="bg-[#F1F1F1]"
          titleColor="text-primary"
          maxWidth="max-w-5xl"
          onSubmit={handleConfirmPago}
          setModalOpen={() => setModalOpenPago(false)}
          title="Datos de la reserva"
          svg={
            <svg
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12.3747 13.75H5.49967C3.77084 13.75 2.90734 13.75 2.37017 13.2128C1.83301 12.6757 1.83301 11.8122 1.83301 10.0833V6.41667C1.83301 4.68783 1.83301 3.82433 2.37017 3.28717C2.90734 2.75 3.77084 2.75 5.49967 2.75H16.4997C18.2285 2.75 19.092 2.75 19.6292 3.28717C20.1663 3.82433 20.1663 4.68783 20.1663 6.41667V11C20.1663 11.8543 20.1663 12.2815 20.027 12.6179C19.9349 12.8405 19.7998 13.0427 19.6294 13.2131C19.4591 13.3834 19.2568 13.5185 19.0343 13.6107C18.6978 13.75 18.2707 13.75 17.4163 13.75"
                stroke="#0546F7"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M11.9167 15.5832C11.9167 14.8538 12.2064 14.1544 12.7221 13.6386C13.2378 13.1229 13.9373 12.8332 14.6667 12.8332V10.9998C14.6667 10.2705 14.9564 9.57102 15.4721 9.05529C15.9878 8.53957 16.6873 8.24984 17.4167 8.24984V13.2915C17.4167 15.4319 17.4167 16.5017 16.984 17.312C16.6422 17.9515 16.1184 18.4753 15.4788 18.8172C14.6685 19.2498 13.5988 19.2498 11.4583 19.2498H11C9.29133 19.2498 8.437 19.2498 7.76417 18.9703C7.31917 18.7862 6.91478 18.5163 6.57411 18.1759C6.23343 17.8356 5.96314 17.4314 5.77867 16.9866C5.5 16.3128 5.5 15.4585 5.5 13.7498M12.8333 8.24984C12.8333 8.73607 12.6402 9.20238 12.2964 9.5462C11.9525 9.89002 11.4862 10.0832 11 10.0832C10.5138 10.0832 10.0475 9.89002 9.70364 9.5462C9.35982 9.20238 9.16667 8.73607 9.16667 8.24984C9.16667 7.76361 9.35982 7.29729 9.70364 6.95347C10.0475 6.60966 10.5138 6.4165 11 6.4165C11.4862 6.4165 11.9525 6.60966 12.2964 6.95347C12.6402 7.29729 12.8333 7.76361 12.8333 8.24984Z"
                stroke="#0546F7"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          }>
          {modalLoading ? (
            <div className="flex flex-col gap-6 py-4 px-2 animate-pulse">
              <div className="flex justify-between items-center bg-gray-200 h-16 rounded-xl p-4">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-6 bg-gray-300 rounded w-1/4"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-28 bg-gray-200 rounded-xl p-4 flex flex-col justify-between">
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                </div>
                <div className="h-28 bg-gray-200 rounded-xl p-4 flex flex-col justify-between">
                  <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                </div>
              </div>
              <div className="h-40 bg-gray-200 rounded-xl"></div>
            </div>
          ) : (
            <div>
              {/* Resumen de la reserva */}
              <section className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-2">
                <div className="text-black flex-1 text-sm md:text-base">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-700">
                      Total de la reserva
                    </span>
                    <span className="font-bold text-gray-900">
                      {formatMonto(totalDeLaReserva)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-gray-700">
                      Total de pagos
                    </span>
                    <span className="font-bold text-black">
                      {formatMonto(totalPagos)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-700">Saldo</span>
                    <span className="font-bold text-secondary">
                      {formatMonto(saldoRestante)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setModalOpenPago(false);
                    setModalPaseDinero(true);
                  }}
                  type="button">
                  <svg
                    width="22"
                    height="16"
                    viewBox="0 0 22 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M21.3505 4.65193L17.0172 0.318599C16.9162 0.217591 16.7963 0.137467 16.6643 0.0828016C16.5323 0.0281362 16.3909 0 16.248 0C15.9595 0 15.6829 0.114604 15.4789 0.318599C15.2749 0.522595 15.1603 0.799273 15.1603 1.08777C15.1603 1.37626 15.2749 1.65294 15.4789 1.85693L17.9705 4.33777H5.4147C5.12738 4.33777 4.85183 4.4519 4.64867 4.65507C4.44551 4.85823 4.33137 5.13378 4.33137 5.4211C4.33137 5.70842 4.44551 5.98397 4.64867 6.18713C4.85183 6.3903 5.12738 6.50443 5.4147 6.50443H20.5814C20.7952 6.50337 21.004 6.43901 21.1814 6.31949C21.3587 6.19996 21.4968 6.0306 21.578 5.83277C21.661 5.63548 21.6837 5.41804 21.6432 5.20788C21.6027 4.99773 21.5009 4.80428 21.3505 4.65193ZM16.248 8.6711H1.08137C0.867491 8.67217 0.658715 8.73652 0.481352 8.85605C0.303988 8.97557 0.165974 9.14493 0.0847018 9.34277C0.0017408 9.54005 -0.0209254 9.75749 0.0195632 9.96765C0.0600518 10.1778 0.161881 10.3713 0.312202 10.5236L4.64553 14.8569C4.74624 14.9585 4.86606 15.0391 4.99808 15.0941C5.13009 15.1491 5.27169 15.1774 5.4147 15.1774C5.55771 15.1774 5.69931 15.1491 5.83133 15.0941C5.96334 15.0391 6.08316 14.9585 6.18387 14.8569C6.28541 14.7562 6.366 14.6364 6.421 14.5044C6.476 14.3724 6.50432 14.2308 6.50432 14.0878C6.50432 13.9448 6.476 13.8032 6.421 13.6711C6.366 13.5391 6.28541 13.4193 6.18387 13.3186L3.6922 10.8378H16.248C16.5354 10.8378 16.8109 10.7236 17.0141 10.5205C17.2172 10.3173 17.3314 10.0418 17.3314 9.75443C17.3314 9.46711 17.2172 9.19157 17.0141 8.9884C16.8109 8.78524 16.5354 8.6711 16.248 8.6711Z"
                      fill="#0546F7"
                    />
                  </svg>
                </button>
              </section>
              <hr className="border-gray-300 my-4" />

              {/* Formulario Agregar Pago */}
              <form onSubmit={handlePreSubmit}>
                <div className="flex justify-center gap-2">
                  <h4 className="text-center font-semibold text-primary text-base md:text-lg flex items-center justify-center gap-2 mb-3">
                    Agregar Pago
                  </h4>
                  <svg
                    width="25"
                    height="25"
                    viewBox="0 0 29 29"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10.15 25.375C8.31736 25.375 6.7715 24.7459 5.51242 23.4876C4.25333 22.2293 3.6242 20.6834 3.625 18.85C3.625 18.0847 3.7559 17.3396 4.01771 16.6146C4.27951 15.8896 4.65208 15.2351 5.13542 14.651L9.425 9.48542L7.37083 5.37708C7.16945 4.97431 7.18475 4.5816 7.41675 4.19896C7.64875 3.81632 7.99594 3.625 8.45833 3.625H20.5417C21.0049 3.625 21.3525 3.81632 21.5845 4.19896C21.8165 4.5816 21.8314 4.97431 21.6292 5.37708L19.575 9.48542L23.8646 14.651C24.3479 15.2351 24.7205 15.8896 24.9823 16.6146C25.2441 17.3396 25.375 18.0847 25.375 18.85C25.375 20.6826 24.7406 22.2285 23.4719 23.4876C22.2031 24.7467 20.6625 25.3758 18.85 25.375H10.15ZM14.5 19.3333C13.8354 19.3333 13.2667 19.0969 12.7938 18.624C12.321 18.1512 12.0841 17.5821 12.0833 16.9167C12.0825 16.2513 12.3194 15.6826 12.7938 15.2105C13.2683 14.7384 13.837 14.5016 14.5 14.5C15.163 14.4984 15.7321 14.7352 16.2074 15.2105C16.6827 15.6858 16.9191 16.2545 16.9167 16.9167C16.9143 17.5788 16.6778 18.148 16.2074 18.624C15.7369 19.1001 15.1678 19.3366 14.5 19.3333ZM11.6302 8.45833H17.3698L18.5781 6.04167H10.4219L11.6302 8.45833ZM10.15 22.9583H18.85C19.9979 22.9583 20.9698 22.5608 21.7657 21.7657C22.5616 20.9706 22.9591 19.9987 22.9583 18.85C22.9583 18.3667 22.8725 17.8986 22.701 17.4459C22.5294 16.9932 22.2929 16.5852 21.9917 16.2219L17.551 10.875H11.4792L7.00833 16.1917C6.70625 16.5542 6.46982 16.967 6.29904 17.4302C6.12826 17.8934 6.04247 18.3667 6.04167 18.85C6.04167 19.9979 6.43961 20.9698 7.2355 21.7657C8.03139 22.5616 9.00289 22.9591 10.15 22.9583Z"
                      fill="#0546F7"
                    />
                  </svg>
                </div>
                {/* Método selector */}
                <p className="text-center font-semibold text-primary mb-2">
                  Método de pago
                </p>
                <div className="flex justify-center gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("tarjeta")}
                    className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all ${
                      paymentMethod === "tarjeta"
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}>
                    💳 Tarjeta
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("efectivo")}
                    className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all ${
                      paymentMethod === "efectivo"
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}>
                    💵 Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("transferencia")}
                    className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all ${
                      paymentMethod === "transferencia"
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}>
                    🏦 Transferencia
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("devolucion")}
                    className={`py-1.5 px-4 rounded-full text-xs font-bold transition-all ${
                      paymentMethod === "devolucion"
                        ? "bg-primary text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}>
                    ⏪ Devolución
                  </button>
                </div>

                {/* Form Fields according to selected method */}
                {paymentMethod === "tarjeta" && (
                  <div className="flex flex-col gap-3 mt-2 text-black">
                    <select
                      required
                      value={inputTarjetaTipo}
                      onChange={(e) => setInputTarjetaTipo(e.target.value)}
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">Seleccionar Tarjeta *</option>
                      {tarjetas.map((t) => (
                        <option key={t.id} value={t.label}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="date"
                      required
                      value={inputFecha}
                      onChange={(e) => setInputFecha(e.target.value)}
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Número de Tarjeta (Últimos 4 dígitos) *"
                      maxLength={4}
                      value={inputTarjetaNum}
                      onChange={(e) =>
                        setInputTarjetaNum(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Titular de la tarjeta *"
                      value={inputTitular}
                      onChange={(e) => setInputTitular(e.target.value)}
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Número de operación / Cupón *"
                      value={inputOperacion}
                      onChange={(e) => setInputOperacion(e.target.value)}
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <select
                      value={inputCuotas}
                      onChange={(e) => setInputCuotas(e.target.value)}
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="1">1 Cuota</option>
                      <option value="3">3 Cuotas sin interés</option>
                      <option value="6">6 Cuotas</option>
                      <option value="12">12 Cuotas</option>
                    </select>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Monto *"
                        value={inputMonto}
                        onChange={(e) => setInputMonto(e.target.value)}
                        className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <select
                        value={inputMoneda}
                        onChange={(e) => setInputMoneda(e.target.value)}
                        className="border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none">
                        <option value="$">ARS ($)</option>
                        <option value="U$D">USD (U$D)</option>
                      </select>
                    </div>
                  </div>
                )}

                {paymentMethod === "efectivo" && (
                  <div className="flex flex-col gap-3 mt-2 text-black">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-500">
                        Fecha de pago *
                      </label>
                      <input
                        type="date"
                        required
                        value={inputFecha}
                        onChange={(e) => setInputFecha(e.target.value)}
                        className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Monto *"
                        value={inputMonto}
                        onChange={(e) => setInputMonto(e.target.value)}
                        className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <select
                        value={inputMoneda}
                        onChange={(e) => setInputMoneda(e.target.value)}
                        className="border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none">
                        <option value="$">ARS ($)</option>
                        <option value="U$D">USD (U$D)</option>
                      </select>
                    </div>
                  </div>
                )}

                {paymentMethod === "transferencia" && (
                  <div className="flex flex-col gap-3 mt-2 text-black">
                    <select
                      required
                      value={inputCuentaBanco}
                      onChange={(e) => setInputCuentaBanco(e.target.value)}
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">
                        Seleccionar Cuenta Bancaria de Destino *
                      </option>
                      {realAccounts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.account_title}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-500">
                        Fecha de transferencia *
                      </label>
                      <input
                        type="date"
                        required
                        value={inputFecha}
                        onChange={(e) => setInputFecha(e.target.value)}
                        className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Monto *"
                        value={inputMonto}
                        onChange={(e) => setInputMonto(e.target.value)}
                        className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <select
                        value={inputMoneda}
                        onChange={(e) => setInputMoneda(e.target.value)}
                        className="border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none">
                        <option value="$">ARS ($)</option>
                        <option value="U$D">USD (U$D)</option>
                      </select>
                    </div>
                  </div>
                )}

                {paymentMethod === "devolucion" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500">
                      Metodo de devolucion *
                    </label>
                    <select
                      name=""
                      id=""
                      value={inputMetodoDevolucion}
                      onChange={(e) => setInputMetodoDevolucion(e.target.value)}
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                      <option value="">
                        Seleccionar Metodo de Devolucion *
                      </option>
                      <option value="efectivo">Efectivo</option>
                      <option value="transferencia">Transferencia</option>
                      <option value="tarjeta">Tarjeta</option>
                    </select>
                    {inputMetodoDevolucion === "transferencia" && (
                      <>
                        <label className="text-xs font-bold text-gray-500">
                          Cuenta a devolver *
                        </label>
                        <select
                          name=""
                          id=""
                          value={inputCuentaBancoDevolucion}
                          onChange={(e) =>
                            setInputCuentaBancoDevolucion(e.target.value)
                          }
                          className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary">
                          <option value="">
                            Seleccionar cuenta a devolver *
                          </option>
                          {realAccounts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.account_title}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                    <label className="text-xs font-bold text-gray-500">
                      Fecha de devolución *
                    </label>
                    <input
                      type="date"
                      required
                      value={inputFecha}
                      onChange={(e) => setInputFecha(e.target.value)}
                      className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <label className="text-xs font-bold text-gray-500">
                      Monto a devolver *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Monto *"
                        value={inputMonto}
                        onChange={(e) => setInputMonto(e.target.value)}
                        className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <select
                        value={inputMoneda}
                        onChange={(e) => setInputMoneda(e.target.value)}
                        className="border border-gray-300 bg-white rounded-lg p-2.5 text-sm focus:outline-none">
                        <option value="$">ARS ($)</option>
                        <option value="U$D">USD (U$D)</option>
                      </select>
                    </div>
                  </div>
                )}

                <textarea
                  placeholder="Observaciones (opcional)"
                  rows={3}
                  value={inputObservaciones}
                  onChange={(e) => setInputObservaciones(e.target.value)}
                  className="w-full border border-gray-300 bg-white rounded-lg p-2.5 text-sm mt-3 focus:outline-none focus:ring-1 focus:ring-primary resize-none text-black"
                />
                <input
                  type="file"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-primary font-semibold text-xs hover:underline cursor-pointer flex items-center gap-1">
                    {selectedFile
                      ? `📎 Adjunto: ${selectedFile.name}`
                      : "+ Agregar comprobante"}
                  </button>
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current)
                          fileInputRef.current.value = "";
                      }}
                      className="text-red-500 text-xs font-bold hover:underline cursor-pointer">
                      ✕ Quitar
                    </button>
                  )}
                </div>
              </form>

              <hr className="border-gray-300 my-4" />

              {/* Historial de pagos */}
              <div className="flex items-center justify-between mb-2">
                <div className="gap-2 flex-1 justify-center text-sm md:text-base flex items-center">
                  <h4 className="font-bold text-primary  gap-1">
                    Historial de pagos
                  </h4>
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 22 22"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10.875 21.75C8.3375 21.75 6.09201 20.9799 4.13854 19.4397C2.18507 17.8994 0.916319 15.9307 0.332292 13.5333C0.251736 13.2312 0.312153 12.9545 0.513542 12.7032C0.71493 12.4519 0.986805 12.3057 1.32917 12.2646C1.65139 12.2243 1.9434 12.2847 2.20521 12.4458C2.46701 12.6069 2.64826 12.8486 2.74896 13.1708C3.23229 14.9833 4.22917 16.4635 5.73958 17.6115C7.25 18.7594 8.96181 19.3333 10.875 19.3333C13.2312 19.3333 15.2302 18.5129 16.872 16.872C18.5137 15.231 19.3341 13.2321 19.3333 10.875C19.3325 8.51794 18.5121 6.51936 16.872 4.87925C15.2318 3.23914 13.2329 2.41828 10.875 2.41667C9.48542 2.41667 8.18646 2.73889 6.97812 3.38333C5.76979 4.02778 4.75278 4.91389 3.92708 6.04167H6.04167C6.38403 6.04167 6.67121 6.15767 6.90321 6.38967C7.13521 6.62167 7.2508 6.90844 7.25 7.25C7.24919 7.59156 7.13319 7.87874 6.902 8.11154C6.6708 8.34435 6.38403 8.45994 6.04167 8.45833H1.20833C0.865972 8.45833 0.579195 8.34233 0.348 8.11033C0.116806 7.87833 0.000805555 7.59156 0 7.25V2.41667C0 2.07431 0.116 1.78753 0.348 1.55633C0.58 1.32514 0.866778 1.20914 1.20833 1.20833C1.54989 1.20753 1.83707 1.32353 2.06987 1.55633C2.30268 1.78914 2.41828 2.07592 2.41667 2.41667V4.04792C3.44375 2.75903 4.6976 1.76215 6.17821 1.05729C7.65882 0.352431 9.22442 0 10.875 0C12.3854 0 13.8004 0.287181 15.1199 0.861542C16.4394 1.4359 17.5873 2.21085 18.5636 3.18638C19.54 4.1619 20.3153 5.30982 20.8897 6.63013C21.464 7.95043 21.7508 9.36539 21.75 10.875C21.7492 12.3846 21.4624 13.7996 20.8897 15.1199C20.3169 16.4402 19.5416 17.5881 18.5636 18.5636C17.5857 19.5392 16.4378 20.3145 15.1199 20.8897C13.802 21.4648 12.387 21.7516 10.875 21.75ZM12.0833 10.3917L15.1042 13.4125C15.3257 13.634 15.4365 13.916 15.4365 14.2583C15.4365 14.6007 15.3257 14.8826 15.1042 15.1042C14.8826 15.3257 14.6007 15.4365 14.2583 15.4365C13.916 15.4365 13.634 15.3257 13.4125 15.1042L10.0292 11.7208C9.90833 11.6 9.81771 11.4643 9.75729 11.3136C9.69687 11.163 9.66667 11.0067 9.66667 10.8448V6.04167C9.66667 5.69931 9.78267 5.41253 10.0147 5.18133C10.2467 4.95014 10.5334 4.83414 10.875 4.83333C11.2166 4.83253 11.5037 4.94853 11.7365 5.18133C11.9693 5.41414 12.0849 5.70092 12.0833 6.04167V10.3917Z"
                      fill="#0546F7"
                    />
                  </svg>
                </div>
                <button
                  onClick={handleExportExcel}
                  className="text-xs text-black font-medium flex items-center gap-2 hover:underline">
                  <Excel />
                  Exportar a Excel
                </button>
              </div>

              <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[520px] text-xs md:text-sm text-black">
                <thead>
                  <tr className="font-bold border-b border-gray-200">
                    <th className="py-2 text-left">Fecha</th>
                    <th className="py-2 text-left">Tipo</th>
                    <th className="py-2 text-left">Monto</th>
                    <th className="py-2 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagos.map((pago) => {
                    const isDevolucion =
                      (pago.amount || 0) < 0 ||
                      (pago.payment_method || "")
                        .toLowerCase()
                        .includes("devoluc");
                    return (
                      <tr
                        key={pago.id}
                        className="font-medium border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-2">
                          {formatDateDisplay(pago.date_pay)}
                        </td>
                        <td className="py-2">
                          <span
                            className={
                              isDevolucion ? "text-red-600 font-semibold" : ""
                            }>
                            {pago.payment_method}
                          </span>
                        </td>
                        <td
                          className={`py-2 font-medium ${isDevolucion ? "text-red-600 font-bold" : "text-black"}`}>
                          {pago.amount < 0
                            ? `-${formatMonto(Math.abs(pago.amount), getMoneda(pago))}`
                            : formatMonto(pago.amount, getMoneda(pago))}
                        </td>
                        <td className="py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {pago.receipt_number &&
                              (pago.receipt_number.startsWith("http") ||
                                pago.receipt_number.startsWith("/")) && (
                                <a
                                  href={pago.receipt_number}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Ver archivo adjunto"
                                  className="text-blue-600 hover:text-blue-800 text-xs font-bold">
                                  📎
                                </a>
                              )}
                            <button
                              type="button"
                              onClick={() => handleOpenRecibo(pago)}
                              title="Ver recibo electrónico"
                              className="text-primary hover:text-blue-800 text-xs font-bold hover:underline">
                              <svg
                                width="15"
                                height="15"
                                viewBox="0 0 19 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M3.42117 23.66H15.1405C17.4251 23.66 18.5617 22.5012 18.5617 20.2059V10.1858C18.5617 8.76197 18.4072 8.14422 17.5244 7.23925L11.4326 1.04857C10.5945 0.187397 9.90989 0 8.66309 0H3.42117C1.14792 0 0 1.16958 0 3.46542V20.2059C0 22.5121 1.14792 23.66 3.42117 23.66ZM3.50921 21.8835C2.37259 21.8835 1.7765 21.2761 1.7765 20.1729V3.49838C1.7765 2.40602 2.37259 1.7765 3.52051 1.7765H8.42014V8.18848C8.42014 9.57889 9.1264 10.263 10.4947 10.263H16.7852V20.1729C16.7852 21.2761 16.1999 21.8835 15.0525 21.8835H3.50921ZM10.6934 8.59623C10.263 8.59623 10.086 8.42013 10.086 7.97848V2.11881L16.4424 8.5967L10.6934 8.59623Z"
                                  fill="#0546F7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeletePago(pago.id)}
                              title="Eliminar pago"
                              className="text-red-500 hover:text-red-700 text-xs font-bold hover:underline">
                              <svg
                                width="12"
                                height="15"
                                viewBox="0 0 21 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg">
                                <path
                                  d="M1.5 23.655V2.655H0V1.155H6V0H15V1.155H21V2.655H19.5V23.655H1.5ZM3 22.155H18V2.655H3V22.155ZM7.212 19.155H8.712V5.655H7.212V19.155ZM12.288 19.155H13.788V5.655H12.288V19.155Z"
                                  fill="#0546F7"
                                />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
            </div>
          )}
        </ModalLayout>
      )}

      {/* Modal: Confirmación de Pago */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 text-blue-600">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-1">
              {paymentMethod === "devolucion"
                ? "¿Confirmar Devolución?"
                : "¿Confirmar Operación?"}
            </h4>
            <p className="text-gray-600 text-sm mb-4">
              {paymentMethod === "devolucion" ? (
                <>
                  Se registrará una devolución de dinero de{" "}
                  <span className="font-bold text-red-600">
                    {formatMonto(parseFloat(inputMonto || "0"), inputMoneda)}
                  </span>{" "}
                  a la reserva{" "}
                  <span className="font-bold text-gray-800">
                    {selectedReserva?.codigo_reserva || "Sin código"}
                  </span>
                  .
                </>
              ) : (
                <>
                  Se registrará un cobro de{" "}
                  <span className="font-bold text-primary">
                    {formatMonto(parseFloat(inputMonto || "0"), inputMoneda)}
                  </span>{" "}
                  asignado a la reserva{" "}
                  <span className="font-bold text-gray-800">
                    {selectedReserva?.codigo_reserva || "Sin código"}
                  </span>
                  .
                </>
              )}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleConfirmPago}
                className="flex-1 bg-primary text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Confirmar
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 border border-gray-300 text-gray-700 font-semibold py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Recibo Electrónico */}
      {modalOpenRecibo && selectedPago && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="rounded-xl max-w-lg w-full overflow-hidden p-4">
            {/* Imprimir */}
            <div className="flex justify-end pt-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="text-white font-medium tracking-wider text-sm flex items-center gap-1 hover:underline mb-2">
                Imprimir / PDF
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"
                    fill="white"
                  />
                </svg>
              </button>
            </div>

            {/* Recibo */}
            <div className="bg-white rounded-xl">
              <div className="border-2 border-black p-6 rounded-xl">
                {/* Header del recibo */}
                <div className="flex items-start justify-between mb-4">
                  <img
                    src={
                      iwebClient?.logo_xl ||
                      iwebClient?.logo_s ||
                      "/logo-empresa.png"
                    }
                    alt="Logo"
                    className="h-20 object-contain"
                  />
                  <div className="flex flex-col items-center">
                    <p>N 0000001</p>
                    <h3 className="text-center font-medium text-black text-lg mb-6 tracking-wide  pb-2">
                      Recibo electrónico
                    </h3>
                  </div>
                  <div className="border border-black flex items-center divide-x rounded-lg divide-black text-xs bg-gray-50">
                    <div className="flex flex-col items-center">
                      <small className="font-bold text-white px-2 rounded-tl-lg bg-primary w-full">
                        DÍA
                      </small>
                      <p className="font-extrabold py-0.5 text-black">
                        {getDia(selectedPago.date_pay)}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <small className="font-bold text-white px-2 bg-primary w-full">
                        MES
                      </small>
                      <p className="font-extrabold py-0.5 text-black">
                        {getMes(selectedPago.date_pay)}
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <small className="font-bold text-white px-2 rounded-tr-lg bg-primary w-full">
                        AÑO
                      </small>
                      <p className="font-extrabold py-0.5 text-black">
                        {getAnio(selectedPago.date_pay)}
                      </p>
                    </div>
                  </div>
                </div>
                {/* Campos del recibo */}
                <div className="flex flex-col gap-4 text-black text-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-600 whitespace-nowrap">
                      Recibimos de:
                    </span>
                    <span className="flex-1 border-b border-dashed border-gray-400 pb-0.5 font-bold italic text-primary">
                      {selectedPago.titular}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-600 whitespace-nowrap">
                      La suma de:
                    </span>
                    <span className="flex-1 border-b border-dashed border-gray-400 pb-0.5 italic text-gray-800">
                      {selectedPago.amount.toLocaleString("es-AR")}
                    </span>
                    <span className="font-bold text-gray-700">
                      {getMonedaNombre(selectedPago)}.
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-bold text-gray-600 whitespace-nowrap">
                      En concepto de:
                    </span>
                    <span className="flex-1 border-b border-dashed border-gray-400 pb-0.5 italic text-gray-800">
                      {selectedPago.observations} ({selectedPago.payment_method}
                      )
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center mt-8 pt-4 border-t border-gray-200">
                  <div className="text-[10px] text-gray-400 flex flex-col">
                    <span>Tranett SaaS Travel Agency Solutions</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-extrabold text-primary text-xl">
                      TOTAL:
                    </span>
                    <span className="font-extrabold text-primary text-2xl">
                      {formatMonto(
                        selectedPago.amount,
                        getMoneda(selectedPago),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Botón Volver */}
            <div className="flex justify-center pb-4 pt-4">
              <button
                type="button"
                onClick={() => setModalOpenRecibo(false)}
                className="bg-white border border-gray-300 text-gray-800 rounded-full px-12 py-2.5 font-semibold hover:bg-gray-100 transition-colors shadow-sm text-sm">
                Cerrar Recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </Container>
  );
}
