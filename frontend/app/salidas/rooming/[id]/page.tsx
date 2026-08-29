"use client";
import Container from "@/app/components/Container";
import ArrowLeft from "@/app/components/icons/ArrowLeft";
import ToggleSalidas from "@/app/components/ToggleSalidas";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api";

import { parseRoomItem, parseRoomTypes, getRoomCapacity } from "@/lib/formatRooms";
import { formatPassengerName, formatFullName } from "@/lib/formatPassengerName";

export default function RoomingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [reservas, setReservas] = useState<any[]>([]);
  const [packageHotels, setPackageHotels] = useState<any[]>([]);
  const [hotelNames, setHotelNames] = useState<{ [id: string]: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReservas = async () => {
      if (!user?.iweb_client_id || !id) return;
      try {
        const data = await apiClient.getReservas(user.iweb_client_id, id);
        setReservas(data);

        // Si hay reservas asociadas a un paquete, traemos la información del paquete y sus hoteles
        const firstWithPkg = data.find((r: any) => r.package_id);
        if (firstWithPkg?.package_id) {
          const [pkgData, hotelsParams] = await Promise.all([
            apiClient.getPackage(user.iweb_client_id, firstWithPkg.package_id).catch(() => null),
            apiClient.getParameters("get_hotels", user.iweb_client_id).catch(() => []),
          ]);

          if (pkgData && pkgData.hotels) {
            setPackageHotels(pkgData.hotels);
          }
          if (Array.isArray(hotelsParams)) {
            const namesMap: { [key: string]: string } = {};
            hotelsParams.forEach((h: any) => {
              if (h.id && h.name) {
                namesMap[h.id] = h.name;
              }
            });
            setHotelNames(namesMap);
          }
        }
      } catch (err) {
        console.error("Error fetching rooming reservas:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReservas();
  }, [user?.iweb_client_id, id]);

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <Container>
        <ToggleSalidas />
        <div className="flex flex-col gap-6 py-8">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-full h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="w-full h-48 bg-gray-100 rounded-2xl animate-pulse" />
        </div>
      </Container>
    );
  }

  const GRID_TITLES: Record<string, string> = {
    doble_matrimonial: "Habitaciones Dobles Matrimoniales",
    doble_individual: "Habitaciones Dobles Individuales",
    single_individual: "Habitaciones Singles / Individuales",
    triple_individual: "Habitaciones Triples",
    cuadruple_individual: "Habitaciones CuÁdruples",
    otras_habitaciones: "Otras Habitaciones",
  };

  const renderRoomGrid = (rooms: any[], label: string) => {
    if (rooms.length === 0) return null;
    return (
      <div className="mb-6" key={label}>
        <h2 className="md:text-center text-black font-semibold text-lg my-4">
          {GRID_TITLES[label] || `Habitaciones ${label.replace(/_/g, " ")}`}
        </h2>
        <section className="flex flex-wrap items-center justify-center gap-4">
          {rooms.map((room) => (
            <section key={room.id} className="flex flex-col text-xs md:text-sm font-medium border-border border rounded-xl w-max shadow-sm">
              <div className="flex flex-wrap bg-[#F1F3F9] text-black py-3 divide-gray-300 divide-x items-center justify-center rounded-t-xl gap-2">
                {room.pasajeros.map((p: string, idx: number) => (
                  <span key={idx} className={`px-2 text-nowrap font-semibold`}>
                    {p}
                  </span>
                ))}
              </div>
              <div className="bg-primary text-white text-center py-1.5 rounded-b-xl px-4">
                <p className="text-xs font-semibold capitalize">{parseRoomItem(room.type).label} ({room.id.startsWith("sin-asignar-") ? "S/A" : room.id})</p>
              </div>
            </section>
          ))}
        </section>
        <hr className="border-black/10 md:mx-20 my-6" />
      </div>
    );
  };

  const renderHotelRoomingSection = (resList: any[], hotelTitle?: string) => {
    if (resList.length === 0) return null;

    const roomsList: Array<{ id: string; type: string; pasajeros: string[] }> = [];
    let totalPaxSum = 0;
    let roomCounter = 1;

    resList.forEach((r) => {
      const paxs = r.reservation_passengers && r.reservation_passengers.length > 0
        ? r.reservation_passengers
        : [r];

      const paxNames: string[] = paxs.map((pax: any) => {
        if (pax.name || pax.last_name) {
          return formatPassengerName(pax.name, pax.last_name);
        }
        const full = pax.nombre_completo || r.nombre_completo || "";
        return full ? formatFullName(full) : "DESCONOCIDO";
      });
      totalPaxSum += paxNames.length;

      const roomDetailsList = parseRoomTypes(r.room_type);
      const roomsToCreate = roomDetailsList.length > 0 ? roomDetailsList : [parseRoomItem("doble_matrimonial_estandar")];

      let paxIndex = 0;
      roomsToCreate.forEach((roomDetail, idx) => {
        const isLastRoom = idx === roomsToCreate.length - 1;
        const capacity = getRoomCapacity(roomDetail);

        const assignedPax = isLastRoom
          ? paxNames.slice(paxIndex)
          : paxNames.slice(paxIndex, paxIndex + capacity);

        paxIndex += assignedPax.length;

        const roomIdLabel = r.rooming_id
          ? (roomsToCreate.length > 1 ? `${r.rooming_id} (${idx + 1})` : r.rooming_id)
          : `${r.codigo_reserva || "Res"}-H${roomCounter++}`;

        if (assignedPax.length > 0) {
          roomsList.push({
            id: roomIdLabel,
            type: roomDetail.raw || "doble_matrimonial_estandar",
            pasajeros: assignedPax,
          });
        }
      });

      if (paxIndex < paxNames.length) {
        roomsList.push({
          id: `${r.codigo_reserva || "Res"}-H${roomCounter++}`,
          type: "doble_matrimonial_estandar",
          pasajeros: paxNames.slice(paxIndex),
        });
      }
    });

    const matrimonialRooms = roomsList.filter(r => {
      const parsed = parseRoomItem(r.type);
      return parsed.camaCode === "DBL" && parsed.distribucionCode === "MAT";
    });
    const dobleIndividualRooms = roomsList.filter(r => {
      const parsed = parseRoomItem(r.type);
      return parsed.camaCode === "DBL" && (parsed.distribucionCode === "IND" || parsed.distribucionCode === "TWN");
    });
    const singleRooms = roomsList.filter(r => {
      const parsed = parseRoomItem(r.type);
      return parsed.camaCode === "SGL";
    });
    const tripleRooms = roomsList.filter(r => {
      const parsed = parseRoomItem(r.type);
      return parsed.camaCode === "TPL";
    });
    const cuadrupleRooms = roomsList.filter(r => {
      const parsed = parseRoomItem(r.type);
      return parsed.camaCode === "CPL";
    });
    const otherRooms = roomsList.filter(r => {
      const parsed = parseRoomItem(r.type);
      const isMatched = (parsed.camaCode === "DBL" && parsed.distribucionCode === "MAT") ||
        (parsed.camaCode === "DBL" && (parsed.distribucionCode === "IND" || parsed.distribucionCode === "TWN")) ||
        parsed.camaCode === "SGL" ||
        parsed.camaCode === "TPL" ||
        parsed.camaCode === "CPL";
      return !isMatched;
    });

    const getStatsForList = (list: any[]) => ({
      rooms: list.length,
      pax: list.reduce((sum, r) => sum + r.pasajeros.length, 0),
    });

    const matrimonialStats = getStatsForList(matrimonialRooms);
    const dobleIndividualStats = getStatsForList(dobleIndividualRooms);
    const singleStats = getStatsForList(singleRooms);
    const tripleStats = getStatsForList(tripleRooms);
    const cuadrupleStats = getStatsForList(cuadrupleRooms);
    const hasOthers = otherRooms.length > 0;
    const otherStats = getStatsForList(otherRooms);

    const totalHabs = roomsList.length;

    return (
      <div key={hotelTitle || "global"} className="mb-12 border border-gray-200 p-4 md:p-6 rounded-2xl bg-white shadow-sm">
        {hotelTitle && (
          <h2 className="text-xl md:text-2xl font-bold text-primary mb-6 border-b border-primary/20 pb-3">
            🏨 {hotelTitle}
          </h2>
        )}

        {renderRoomGrid(matrimonialRooms, "doble_matrimonial")}
        {renderRoomGrid(dobleIndividualRooms, "doble_individual")}
        {renderRoomGrid(singleRooms, "single_individual")}
        {renderRoomGrid(tripleRooms, "triple_individual")}
        {renderRoomGrid(cuadrupleRooms, "cuadruple_individual")}
        {renderRoomGrid(otherRooms, "otras_habitaciones")}

        <h3 className="md:text-center text-black font-bold text-xl mt-8 mb-4">
          Resumen de Ocupación {hotelTitle ? `— ${hotelTitle}` : ""}
        </h3>
        <section className="flex items-center justify-center gap-2 md:gap-10 pb-6">
          <div className="flex justify-center items-center text-xs bg-gray-100 w-full max-w-2xl">
            <div className="border border-border rounded-t-2xl overflow-hidden w-full shadow-md">
              <div className="grid grid-cols-3 bg-gray-300 text-center font-bold text-gray-800">
                <div className="py-4 border-r border-border">TIPO</div>
                <div className="py-4 border-r border-border">TOTAL HABS</div>
                <div className="py-4">TOTAL PAX</div>
              </div>

              <div className="divide-y divide-blue-400 text-center text-gray-800 font-medium">
                {matrimonialStats.rooms > 0 && (
                  <div className="grid grid-cols-3 bg-white">
                    <div className="py-4 border-r border-border">DOBLES MATRIMONIALES</div>
                    <div className="py-4 border-r border-border">{matrimonialStats.rooms}</div>
                    <div className="py-4">{matrimonialStats.pax}</div>
                  </div>
                )}

                {dobleIndividualStats.rooms > 0 && (
                  <div className="grid grid-cols-3 bg-white">
                    <div className="py-4 border-r border-border">DOBLES INDIVIDUALES</div>
                    <div className="py-4 border-r border-border">{dobleIndividualStats.rooms}</div>
                    <div className="py-4">{dobleIndividualStats.pax}</div>
                  </div>
                )}

                {singleStats.rooms > 0 && (
                  <div className="grid grid-cols-3 bg-white">
                    <div className="py-4 border-r border-border">SINGLES / INDIVIDUALES</div>
                    <div className="py-4 border-r border-border">{singleStats.rooms}</div>
                    <div className="py-4">{singleStats.pax}</div>
                  </div>
                )}

                {tripleStats.rooms > 0 && (
                  <div className="grid grid-cols-3 bg-white">
                    <div className="py-4 border-r border-border">TRIPLES</div>
                    <div className="py-4 border-r border-border">{tripleStats.rooms}</div>
                    <div className="py-4">{tripleStats.pax}</div>
                  </div>
                )}

                {cuadrupleStats.rooms > 0 && (
                  <div className="grid grid-cols-3 bg-white">
                    <div className="py-4 border-r border-border">CUÁDRUPLES</div>
                    <div className="py-4 border-r border-border">{cuadrupleStats.rooms}</div>
                    <div className="py-4">{cuadrupleStats.pax}</div>
                  </div>
                )}

                {hasOthers && (
                  <div className="grid grid-cols-3 bg-white">
                    <div className="py-4 border-r border-border">OTRAS HABITACIONES</div>
                    <div className="py-4 border-r border-border">{otherStats.rooms}</div>
                    <div className="py-4">{otherStats.pax}</div>
                  </div>
                )}

                <div className="grid grid-cols-3 font-bold bg-gray-300">
                  <div className="py-4 border-r border-border">TOTALES</div>
                  <div className="py-4 border-r border-border">{totalHabs}</div>
                  <div className="py-4">{totalPaxSum}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  };

  return (
    <Container>
      <ToggleSalidas />
      <section className="flex flex-col gap-3 mb-6">
        <Link
          href={"/dashboard"}
          className="flex items-center justify-start gap-3"
        >
          <ArrowLeft />
          <h1 className="font-bold text-primary text-sm md:text-base">Volver al menú</h1>
        </Link>
        <button
          onClick={handleBack}
          className="flex items-center cursor-pointer justify-start gap-3"
        >
          <ArrowLeft color="#6005F7" />
          <h1 className="font-semibold text-secondary text-sm md:text-base">Volver a Salidas</h1>
        </button>
      </section>

      {/* Grids y resúmenes de habitaciones */}
      {reservas.length === 0 ? (
        <p className="text-center text-gray-500 py-10 font-medium">No hay pasajeros ni habitaciones asignadas para esta salida.</p>
      ) : packageHotels.length > 1 ? (
        packageHotels.map((ph) => {
          const resListForHotel = reservas.filter((r) => r.hotel_id === ph.hotel_id);
          const hName = hotelNames[ph.hotel_id] || "Hotel";
          const title = ph.hotel_noches ? `${hName} (${ph.hotel_noches} Noches)` : hName;
          return renderHotelRoomingSection(resListForHotel, title);
        })
      ) : (
        renderHotelRoomingSection(reservas)
      )}
    </Container>
  );
}
