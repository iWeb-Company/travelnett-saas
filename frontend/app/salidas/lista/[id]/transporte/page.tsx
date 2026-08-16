'use client'
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { BusType, Salida, TransportCompany } from "@/app/types";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function TransportePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();

    const [salida, setSalida] = useState<Salida | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [transportCompanies, setTransportCompanies] = useState<TransportCompany[]>([]);
    const [micros, setMicros] = useState<BusType[]>([]);
    const [selectedCompany, setSelectedCompany] = useState("");
    const [selectedBus, setSelectedBus] = useState("");

    useEffect(() => {
        if (!user?.iweb_client_id || !id) return;
        loadData();
    }, [user?.iweb_client_id, id]);

    const loadData = async () => {
        if (!user?.iweb_client_id || !id) return;
        setLoading(true);
        try {
            const [salidaData, companiesData, busTypesData] = await Promise.all([
                apiClient.getSalida(user.iweb_client_id, id).catch(() => null),
                apiClient.getParameters("get_transport_companies", user.iweb_client_id).catch(() => []),
                apiClient.getParameters("get_bus_types", user.iweb_client_id).catch(() => []),
            ]);

            setSalida(salidaData);
            setTransportCompanies(companiesData || []);
            setMicros(busTypesData || []);
            setSelectedCompany(salidaData?.transport_company || "");
            setSelectedBus(salidaData?.type_bus || "");
        } catch (error) {
            console.error('Error loading transport data:', error);
            toast.error("Error al cargar datos de la salida");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user?.iweb_client_id || !id) return;
        setIsSaving(true);
        try {
            await apiClient.updateSalida(user.iweb_client_id, id, {
                transport_company: selectedCompany || null,
                type_bus: selectedBus || null,
            });
            toast.success("Empresa y tipo de micro actualizados correctamente");
            router.push(`/salidas/lista/${id}`);
        } catch (error) {
            console.error('Error updating salida transport:', error);
            toast.error("Error al actualizar la empresa de transporte");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <Container>
                <ToggleSalidas />
                <section className="flex flex-col gap-3 my-4">
                    <div className="w-36 h-6 bg-gray-200 rounded animate-pulse" />
                    <div className="w-36 h-6 bg-gray-200 rounded animate-pulse" />
                </section>
                <div className="w-64 h-8 bg-gray-200 rounded mx-auto my-6 animate-pulse" />
                <section className="flex justify-center gap-5 items-center mx-auto max-w-2xl flex-col w-full">
                    <div className="w-full h-11 bg-gray-200 rounded animate-pulse" />
                    <div className="w-full h-11 bg-gray-200 rounded animate-pulse" />
                    <div className="w-full h-11 bg-gray-300 rounded-lg animate-pulse" />
                </section>
            </Container>
        );
    }

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
                <Link
                    href={`/salidas/lista/${id}`}
                    className="flex items-center cursor-pointer justify-start gap-3"
                >
                    <ArrowLeft color="#6005F7" />
                    <h1 className="font-semibold text-secondary md:text-lg">Volver a la Lista</h1>
                </Link>
            </section>
            <h1 className="text-center text-xl my-3 text-black font-semibold">Modificar empresa de transporte</h1>
            <section className="flex justify-center gap-5 items-center mx-auto max-w-2xl flex-col w-full">
                <select
                    value={selectedBus}
                    onChange={(e) => setSelectedBus(e.target.value)}
                    className="border border-gray-400 shadow-md text-gray-700 font-semibold shadow-gray-400 w-full rounded p-2 bg-white cursor-pointer"
                >
                    <option value="">Seleccionar micro</option>
                    {micros && micros.map((micro) => (
                        <option key={micro.id || micro.name} value={micro.id || micro.name}>
                            {micro.name}
                        </option>
                    ))}
                </select>
                <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="border border-gray-400 shadow-md text-gray-700 font-semibold shadow-gray-400 w-full rounded p-2 bg-white cursor-pointer"
                >
                    <option value="">Seleccionar empresa</option>
                    {transportCompanies && transportCompanies.map((company) => (
                        <option key={company.id || company.name} value={company.id || company.name}>
                            {company.name}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-primary hover:opacity-90 disabled:opacity-50 text-white font-semibold text-lg py-2 rounded-lg cursor-pointer transition"
                >
                    {isSaving ? "Modificando..." : "Modificar"}
                </button>
            </section>
        </Container>
    );
}
