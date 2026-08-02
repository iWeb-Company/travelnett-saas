'use client'
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import { Loader } from "@/app/components/Loader";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import { TransportCompany } from "@/app/types";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function TransportePage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [transportCompanies, setTransportCompanies] = useState<TransportCompany[] | null>(null);
    useEffect(() => {
        if (!user?.iweb_client_id) return;
        loadData();
    }, [user]);

    const loadData = async () => {
        try {
            await getTranportCompanyFromSalida();
            setLoading(true);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    const getTranportCompanyFromSalida = async () => {
        try {
            setLoading(true);
            const getCompaniesTranport = await apiClient.getParameters("get_transport_companies", user?.iweb_client_id || "");
            setTransportCompanies(getCompaniesTranport);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <Container>
                <Loader />
            </Container>
        )
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
            <section className="flex justify-center gap-5 items-center mx-auto max-w-2xl flex-col">
                <select className="border border-gray-400 shadow-md text-gray-500 font-semibold shadow-gray-400 w-full rounded p-2">
                    <option disabled value="">Seleccionar micro</option>
                </select>
                <select className="border border-gray-400 shadow-md text-gray-500 font-semibold shadow-gray-400 w-full rounded p-2">
                    <option disabled value="">Seleccionar empresa</option>
                    {transportCompanies && transportCompanies.map((company) => (
                        <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                </select>
                <button className="w-full bg-primary text-white font-semibold text-lg py-2 rounded-lg">Modificar</button>
            </section>
        </Container>
    )
}
