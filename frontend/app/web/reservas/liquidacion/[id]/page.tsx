"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import { Loader } from "@/app/components/Loader";
import toast from "react-hot-toast";
import Link from "next/link";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Salidas from "@/app/components/icons/home/Salidas";
import Hotel from "@/app/components/icons/salidas/Hotel";
import { Package, Reserva, Salida } from "@/app/types";
import { formatRoomType, formatRoomTypeDetails } from "@/lib/formatRooms";

export default function VoucherPage() {
    const params = useParams();
    const router = useRouter();
    const { user, iwebClient } = useAuth();

    const id = params.id as string;
    const [reservaData, setReservaData] = useState<Reserva | null>(null);
    const [packageData, setPackageData] = useState<Package | null>(null);
    const [salidaData, setSalidaData] = useState<Salida | null>(null);
    const [liquidacionData, setLiquidacionData] = useState<any | null>(null);
    const [pagosData, setPagosData] = useState<any[]>([]);
    const [clientEmail, setClientEmail] = useState<string | null>(null);
    const [allHotels, setAllHotels] = useState<any[]>([]);
    const [allRegimenes, setAllRegimenes] = useState<any[]>([]);
    const [lugaresCarga, setLugaresCarga] = useState<any[]>([]);
    const [transportCompanies, setTransportCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const roomDetails = useMemo(() => {
        return formatRoomTypeDetails(reservaData?.room_type);
    }, [reservaData?.room_type]);

    const loadReserva = async () => {
        if (!user?.iweb_client_id || !id) return;
        try {
            const data = await apiClient.getReservaById(user.iweb_client_id, id);
            setReservaData(data);

            const [liq, pagos, allParams, lcList, tcList] = await Promise.all([
                apiClient.getLiquidacionByBooking(id).catch(() => null),
                apiClient.getPagosReserva(user.iweb_client_id, id).catch(() => []),
                apiClient.getAllParameters(user.iweb_client_id).catch(() => ({ hotels: [], regimenes: [], destinos: [] })),
                apiClient.getParameters("get_lugares_carga", user.iweb_client_id).catch(() => []),
                apiClient.getTransportCompanies(user.iweb_client_id).catch(() => [])
            ]);
            setLiquidacionData(liq);
            setPagosData(pagos || []);
            if (allParams?.hotels) setAllHotels(allParams.hotels);
            if (allParams?.regimenes) setAllRegimenes(allParams.regimenes);
            if (Array.isArray(lcList)) setLugaresCarga(lcList);
            if (Array.isArray(tcList)) setTransportCompanies(tcList);

            if (data?.client_id) {
                apiClient.getParameters("get_clients", user.iweb_client_id)
                    .then((clients: any[]) => {
                        const cli = Array.isArray(clients) ? clients.find((c: any) => c.id === data.client_id) : null;
                        if (cli?.email) setClientEmail(cli.email);
                    })
                    .catch(() => setClientEmail(null));
            }
        } catch (error) {
            console.error(error);
            toast.error("Error al cargar la reserva");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user?.iweb_client_id) {
            loadReserva();
        }
    }, [user?.iweb_client_id, id]);

    useEffect(() => {
        const loadPackage = async () => {
            if (reservaData?.package_id && user?.iweb_client_id) {
                const [pack, salida] = await Promise.all([
                    apiClient.getPackage(user.iweb_client_id, reservaData.package_id),
                    apiClient.getSalida(user.iweb_client_id, reservaData.salida_id as string).catch(() => null)
                ]);
                setPackageData(pack);
                setSalidaData(salida);
            }
        };
        if (reservaData) {
            loadPackage();
        }
    }, [reservaData, id, user?.iweb_client_id]);

    const formatMonto = (num?: number | null) => `$${Math.round(num || 0).toLocaleString("es-AR")}`;

    const formatRoomType = (raw: any) => {
        if (!raw) return "-";
        try {
            const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
            if (Array.isArray(parsed)) {
                const mapNames: Record<string, string> = {
                    DBL_MAT: "Doble Matrimonial",
                    SGL: "Single",
                    triple_individual: "Triple Individual",
                    doble_individual: "Doble Individual",
                    cuadruple_individual: "Cuádruple Individual"
                };
                return parsed.map((item: string) => mapNames[item] || item).join(" + ");
            }
        } catch (e) { }
        return String(raw);
    };

    const handleSendEmail = () => {
        if (clientEmail) {
            toast.success(`Liquidación enviada con éxito a ${clientEmail}`);
        } else if (reservaData?.client_nombre) {
            toast.error(`El cliente (${reservaData.client_nombre}) no posee email registrado.`);
        } else {
            toast.error("El cliente no posee email registrado.");
        }
    };

    // Resolve hotel from reserva → first package_hotel → salida
    const packageHotelMatch = packageData?.hotels?.find((ph: any) => ph.hotel_id === reservaData?.hotel_id)
        || packageData?.hotels?.[0];
    const resolvedHotelId = reservaData?.hotel_id || packageHotelMatch?.hotel_id || salidaData?.hotel_id;
    const hotelObj = allHotels.find((h: any) => h.id === resolvedHotelId);
    const resolvedHotelName = hotelObj?.name || reservaData?.hotel_nombre || "A confirmar";

    const resolvedRegimenId = reservaData?.regimen_id || packageHotelMatch?.hotel_regimen_id || salidaData?.regimen_id;
    const regimenObj = allRegimenes.find((r: any) => r.id === resolvedRegimenId);
    const resolvedRegimenName = regimenObj?.name || reservaData?.regimen_nombre || "A confirmar";

    const transportObj = transportCompanies.find((tc: any) => tc.id === salidaData?.transport_company || tc.name === salidaData?.transport_company);
    const resolvedTransportCompany = transportObj?.name || salidaData?.transport_company || "A confirmar";

    const getAscensoNombre = (pax: any) => {
        if (pax.lugar_carga_nombre) return pax.lugar_carga_nombre;
        const foundLc = lugaresCarga.find((lc: any) => lc.id === (pax.lugar_carga_id || reservaData?.lugar_carga_id));
        return foundLc?.name || reservaData?.lugar_carga_nombre || "-";
    };

    const totalBruto = liquidacionData?.total_amout ?? 0;
    const comision = liquidacionData?.commission ?? 0;
    const totalAPagar = totalBruto - comision;
    const cobrosRealizados = pagosData.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const saldoRestante = totalAPagar - cobrosRealizados;

    if (loading) {
        return (
            <Container>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader />
                </div>
            </Container>
        );
    }

    if (!reservaData) {
        return (
            <Container>
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <p className="font-bold text-lg text-white">
                        No se pudo cargar la información de la reservas.
                    </p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 bg-primary text-secondary font-semibold px-4 py-2 rounded-lg cursor-pointer hover:bg-blue-700"
                    >
                        Volver a la Reserva
                    </button>
                </div>
            </Container>
        );
    }


    return (
        <Container>
            <ToggleSalidas />

            <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          header, footer, .no-print, .no-print * {
            display: none !important;
          }
          .print-voucher, .print-voucher * {
            visibility: visible !important;
          }
          .print-voucher {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

            <section className="flex flex-col gap-3 my-10">
                <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 no-print">
                    <div className="flex flex-col gap-2">
                        <Link
                            href={"/dashboard"}
                            className="flex items-center justify-start gap-2 text-primary hover:opacity-85 transition-opacity"
                        >
                            <ArrowLeft />
                            <span className="font-bold md:text-lg">Volver al menú</span>
                        </Link>
                        {reservaData.salida_id && (
                            <Link
                                href={`/web/reservas/modificar-reserva/${reservaData.id}`}
                                className="flex items-center justify-start gap-2 text-secondary hover:opacity-85 transition-opacity"
                            >
                                <ArrowLeft color="#6005F7" />
                                <span className="font-bold md:text-lg">Volver a la Reserva</span>
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center mr-20 text-xs font-bold text-white">
                        <button
                            onClick={handleSendEmail}
                            className="flex items-center gap-1.5 hover:opacity-80 cursor-pointer text-secondary  px-3 py-2 rounded-lg"
                        >
                            <svg
                                width="25"
                                height="25"
                                viewBox="0 0 33 33"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M5.5 27.5C4.74375 27.5 4.09658 27.231 3.5585 26.6929C3.02042 26.1548 2.75092 25.5072 2.75 24.75V8.25C2.75 7.49375 3.0195 6.84658 3.5585 6.3085C4.0975 5.77042 4.74467 5.50092 5.5 5.5H27.5C28.2563 5.5 28.9039 5.7695 29.4429 6.3085C29.9819 6.8475 30.2509 7.49467 30.25 8.25V24.75C30.25 25.5063 29.981 26.1539 29.4429 26.6929C28.9048 27.2319 28.2572 27.5009 27.5 27.5H5.5ZM16.5 17.6344C16.6146 17.6344 16.7351 17.617 16.8616 17.5821C16.9881 17.5473 17.1082 17.496 17.2219 17.4281L26.95 11.3438C27.1333 11.2292 27.2708 11.0862 27.3625 10.9148C27.4542 10.7433 27.5 10.554 27.5 10.3469C27.5 9.88854 27.3052 9.54479 26.9156 9.31563C26.526 9.08646 26.125 9.09792 25.7125 9.35L16.5 15.125L7.2875 9.35C6.875 9.09792 6.47396 9.09242 6.08438 9.3335C5.69479 9.57458 5.5 9.91237 5.5 10.3469C5.5 10.576 5.54583 10.7768 5.6375 10.9491C5.72917 11.1215 5.86667 11.253 6.05 11.3438L15.7781 17.4281C15.8927 17.4969 16.0133 17.5487 16.1398 17.5835C16.2663 17.6183 16.3863 17.6353 16.5 17.6344Z"
                                    fill="black"
                                />
                            </svg>
                            <span>Enviar por email</span>
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 hover:opacity-80 text-secondary cursor-pointer px-3 py-2 rounded-lg"
                        >
                            <svg
                                width="25"
                                height="25"
                                viewBox="0 0 33 33"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M24.75 9.625H8.25V4.125H24.75V9.625ZM24.75 17.1875C25.1396 17.1875 25.4664 17.0555 25.7304 16.7915C25.9944 16.5275 26.1259 16.2012 26.125 15.8125C26.1241 15.4238 25.9921 15.0975 25.729 14.8335C25.4659 14.5695 25.1396 14.4375 24.75 14.4375C24.3604 14.4375 24.0341 14.5695 23.771 14.8335C23.5079 15.0975 23.3759 15.4238 23.375 15.8125C23.3741 16.2012 23.5061 16.528 23.771 16.7929C24.0359 17.0578 24.3622 17.1893 24.75 17.1875ZM22 26.125V20.625H11V26.125H22ZM24.75 28.875H8.25V23.375H2.75V15.125C2.75 13.9563 3.15104 12.9768 3.95312 12.1866C4.75521 11.3965 5.72917 11.0009 6.875 11H26.125C27.2938 11 28.2737 11.3955 29.0648 12.1866C29.8558 12.9777 30.2509 13.9572 30.25 15.125V23.375H24.75V28.875Z"
                                    fill="black"
                                />
                            </svg>
                            <span>Imprimir</span>
                        </button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto bg-white shadow-lg border border-black overflow-hidden print-voucher w-full text-black">
                    <section className="bg-border/50 text-black p-5 flex items-center justify-around">
                        <div className="flex items-center justify-around w-full">
                            <img src={iwebClient?.logo_s || iwebClient?.logo_xl || "/logo-empresa.png"} alt="Logo" className="max-h-20 object-contain" />
                            <div className="flex flex-col gap-5">
                                <div className="flex flex-col">
                                    <p className="text-[10px] uppercase font-bold text-center tracking-wider text-blue-900">
                                        Liquidación Reserva{" "}
                                        {reservaData.codigo_reserva}
                                    </p>
                                    <h2 className="text-xl md:text-xl font-bold text-black">
                                        {reservaData.nombre_completo?.toUpperCase()}
                                    </h2>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold mt-1">
                                        <span className="font-bold">{reservaData.destino}</span>
                                    </p>
                                    <p className="text-xs font-semibold mt-1">
                                        Total pax:{" "}
                                        <span className="font-bold">
                                            {reservaData.reservation_passengers?.length}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="py-5 px-10 border-t gap-4 border-black flex flex-col">
                        <h2 className="text-start text-primary font-semibold text-2xl">Datos de la reserva</h2>
                        <div className="grid grid-cols-2 gap-2 text-xl place-items-center place-content-center py-5 border border-gray-500 rounded-md">
                            <div className="flex flex-col">
                                <p className="font-bold">Cliente</p>
                                <p>{reservaData.client_nombre || 'Reserva Particular'}</p>
                            </div>
                            <div className="flex flex-col">
                                <p className="font-bold">Fecha de vencimiento</p>
                                <p>{reservaData.venciment ?? 'Sin fecha indicada'}</p>
                            </div>
                            <div className="flex flex-col">
                                <p className="font-bold">Vendedor</p>
                                <p>{reservaData.vendedor || reservaData.client_nombre || 'Reserva Particular'}</p>
                            </div>
                            <div className="flex flex-col items-start justify-start">
                                <p className="font-bold text-start">Fecha de alta</p>
                                <p>{reservaData.fecha}</p>
                            </div>
                        </div>
                        <div className="flex flex-col border rounded-lg border-gray-500 text-lg">
                            <h3 className="text-start text-primary bg-bg rounded-t-lg font-semibold py-2 px-5 text-2xl">Pasajeros</h3>
                            <table>
                                <thead className="border-t py-2 divide-x divide-gray-500 border-b border-gray-500">
                                    <th className="">Tipo</th>
                                    <th className="">Nombre completo</th>
                                    <th className="">DNI</th>
                                    <th className="">F/N</th>
                                    <th className="">Ascenso</th>
                                </thead>
                                <tbody className="divide-y divide-gray-500 rounded-md">
                                    {reservaData.reservation_passengers?.map((passenger: any) => (
                                        <tr key={passenger.id} className="divide-x divide-gray-500">
                                            <td className="text-center text-sm py-1 font-medium">{passenger.pasajero_type}</td>
                                            <td className="text-center text-sm py-1 font-medium">{passenger.nombre_completo}</td>
                                            <td className="text-center text-sm py-1 font-medium">{passenger.dni}</td>
                                            <td className="text-center text-sm py-1 font-medium">{passenger.fecha_nacimiento}</td>
                                            <td className="text-center text-sm py-1 font-medium">{getAscensoNombre(passenger)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex flex-col border rounded-lg border-gray-500 text-lg">
                            <h3 className="text-start text-primary bg-bg rounded-t-lg font-semibold py-2 px-5 text-2xl">Servicios</h3>
                            <div className="flex items-center border-t px-5 py-3 border-gray-500">
                                <Salidas width={30} height={30} color="#0546F7" />
                                <h3 className="text-start font-semibold text-primary py-2 px-5 text-2xl">Bus</h3>
                            </div>
                            <div className="flex flex-col">
                                <div className="flex w-full justify-around p-5">
                                    <div className="flex flex-col text-xl gap-2">
                                        <p className="font-semibold">Empresa de transporte</p>
                                        <p className="">{resolvedTransportCompany}</p>
                                    </div>
                                    <div className="flex flex-col text-xl gap-2">
                                        <p className="font-semibold">Servicio</p>
                                        <p className="">{reservaData.tipo_butaca === 'semicama' ? 'Semicama' : 'Cama'}</p>
                                    </div>
                                </div>
                                <div className="flex w-full border-t border-gray-500 justify-around p-5">
                                    <div className="flex flex-col text-xl gap-2">
                                        <p className="font-semibold">Fecha de salida</p>
                                        <p className="">{salidaData?.date_of_out || 'A confirmar'}</p>
                                    </div>
                                    <div className="flex flex-col text-xl gap-2">
                                        <p className="font-semibold">Fecha de regreso</p>
                                        <p className="">{packageHotelMatch?.hotel_fecha_out ?? 'A confirmar'}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center border-t px-5 py-3 border-gray-500">
                                <Hotel />
                                <h3 className="text-start font-semibold text-primary py-2 px-5 text-2xl">Hotel</h3>
                            </div>
                            <div className="flex w-full justify-around p-5">
                                <div className="flex flex-col text-xl gap-2">
                                    <p className="font-semibold">Nombre del Hotel</p>
                                    <p className="">{resolvedHotelName}</p>
                                </div>
                                <div className="flex flex-col text-xl gap-2">
                                    <p className="font-semibold">Regimen</p>
                                    <p className="">{resolvedRegimenName}</p>
                                </div>
                            </div><div className="flex w-full border-t border-gray-500 justify-around p-5">
                                <div className="flex flex-col text-xl gap-2">
                                    <p className="font-semibold">Fecha de ingreso</p>
                                    <p className="">{packageHotelMatch?.hotel_fecha_in ?? 'A confirmar'}</p>
                                </div>
                                <div className="flex flex-col text-xl gap-2">
                                    <p className="font-semibold">Fecha de salida</p>
                                    <p className="">{packageHotelMatch?.hotel_fecha_out ?? 'A confirmar'}</p>
                                </div>
                            </div><div className="flex w-full border-t border-gray-500 justify-around p-5">
                                <div className="flex flex-col text-xl gap-2 max-w-md">
                                    <p className="font-semibold">Tipo de habitación</p>
                                    <p className="font-medium text-black">{roomDetails.labelCompleto || "-"}</p>

                                </div>
                                <div className="flex flex-col text-xl gap-2">
                                    <p className="font-semibold">Cantidad de noches</p>
                                    <p className="">{packageHotelMatch?.hotel_noches ?? 'A confirmar'}</p>
                                </div>
                            </div>
                        </div>
                    </section>
                    {liquidacionData?.gastos && liquidacionData.gastos.length > 0 && (
                        <section className="flex flex-col mt-8 w-full max-w-2/3 mx-auto border rounded-lg border-gray-500 text-lg">
                            <h4 className="text-center w-full text-primary font-semibold bg-bg rounded-t-lg py-2 px-5 text-xl">Desglose de Gastos No Comisionables</h4>
                            <table className="w-full">
                                <thead className="border-b border-gray-500 bg-gray-100/70">
                                    <tr className="divide-x divide-gray-500 text-base">
                                        <th className="py-2 px-4 text-left font-bold">Concepto</th>
                                        <th className="py-2 px-4 text-center font-bold">Monto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-500 text-base">
                                    {liquidacionData.gastos.map((gasto: any, idx: number) => (
                                        <tr key={gasto.id || idx} className="divide-x divide-gray-500">
                                            <td className="py-1.5 px-4 text-left font-medium">{gasto.name}</td>
                                            <td className="py-1.5 px-4 text-center font-semibold">{formatMonto(gasto.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </section>
                    )}

                    <section className="flex flex-col my-8 w-full max-w-2/3 mx-auto border rounded-lg border-gray-500">
                        <h4 className="text-center w-full text-primary font-semibold bg-bg rounded-t-lg py-2 px-5 text-2xl">Liquidacion monetaria</h4>
                        <table className="w-full">
                            <thead className="divide-x divide-gray-500">
                                <tr className="divide-gray-500 divide-x">
                                    <th className="font-semibold">Total Bruto</th>
                                    <th className="font-semibold">{formatMonto(totalBruto)}</th>
                                </tr>
                            </thead>
                            <tbody className="w-full border-t divide-y divide-gray-500 border-gray-500">
                                <tr className="divide-gray-500 divide-x">
                                    <td className="text-center font-semibold">Comision</td>
                                    <td className="text-center font-semibold">{formatMonto(comision)}</td>
                                </tr>
                                <tr className="divide-gray-500 divide-x">
                                    <th className="font-semibold">TOTAL A PAGAR</th>
                                    <th className="font-semibold text-red-500">{formatMonto(totalAPagar)}</th>
                                </tr>
                                <tr className="divide-gray-500 divide-x">
                                    <td className="text-center font-semibold">Cobros realizados</td>
                                    <td className="text-center font-semibold">{formatMonto(cobrosRealizados)}</td>
                                </tr>
                                <tr className="divide-gray-500 divide-x">
                                    <td className="text-center font-semibold">SALDO</td>
                                    <td className="text-center font-semibold text-red-500">{formatMonto(saldoRestante)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </section>
                </div>
            </section>
        </Container>
    );
}
