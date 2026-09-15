import uuid
import math
from datetime import datetime
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from services.availability import get_inventory_db
from services.transport_units import (
    units_for,
    units_for_departures,
    apply_legacy_update,
    project_legacy,
    cancel_unit,
    create_unit,
    assign_passenger_to_unit_number,
)
from auth.login import get_current_user
from models.models import (
    Salidas, SalidasLugaresCarga, LugaresCarga, Reservas, ReservationPassengers, Hotels,
    TransportCompany, ccProvidersConsumptionPayments, User,
)
from schemas.schemas import (
    SalidaResponse,
    SalidaCreateRequest,
    SalidaUpdateRequest,
    LugarCargaPayload,
)

router = APIRouter(prefix="/salidas", tags=["Salidas CRUD"])


class ReservationPassengerHotelReplaceRequest(BaseModel):
    source_hotel_id: str
    target_hotel_id: str


class ReservationPassengerHotelReplaceResponse(BaseModel):
    updated_passengers: int


class ReservationPassengerBoardingBulkRequest(BaseModel):
    reservation_passenger_ids: List[str]
    lugar_carga_id: Optional[str] = None
    bus_number: Optional[str] = None


class ReservationPassengerBoardingBulkResponse(BaseModel):
    updated_passengers: int
    lugar_carga_id: Optional[str] = None
    bus_number: Optional[str] = None


def _audit_actor_name(user: User) -> str:
    full_name = f"{user.name or ''} {user.last_name or ''}".strip()
    return full_name or user.username or "Usuario del sistema"


def register_transport_consumption(
    db: Session,
    salida: Salidas,
    *,
    price_changed: bool = False,
    updated_by: Optional[User] = None,
):
    """Create or synchronize the single operational transport expense for a departure."""
    if units_for(db, salida):
        from services.transport_units import sync_consumption
        for unit in units_for(db, salida):
            sync_consumption(db, salida, unit, _audit_actor_name(updated_by) if updated_by else "Sistema")
        return
    existing = db.query(ccProvidersConsumptionPayments).filter(
        ccProvidersConsumptionPayments.salida_id == salida.id,
        ccProvidersConsumptionPayments.iweb_client_id == salida.iweb_client_id,
    ).first()

    if existing:
        if price_changed:
            existing.amount = float(salida.precio_transporte or 0)
            detail = existing.detail or f"Consumo transporte - salida {salida.date_of_out or salida.id}"
            audit = f"Última actualización {datetime.now().strftime('%d/%m/%Y')} hecha por {_audit_actor_name(updated_by) if updated_by else 'Usuario del sistema'}"
            existing.detail = f"{detail} | {audit}"
        return existing

    if (salida.type or "").strip().lower() not in {"bus", "micro"}:
        return None
    try:
        amount = float(salida.precio_transporte or 0)
    except (TypeError, ValueError):
        return None
    transport_id = (salida.transport_company or "").strip()
    if amount <= 0 or not transport_id:
        return None

    transport = db.query(TransportCompany).filter(
        TransportCompany.id == transport_id,
        TransportCompany.iweb_client_id == salida.iweb_client_id,
    ).first()
    if not transport:
        return None

    departure_date = None
    if salida.date_of_out:
        try:
            departure_date = datetime.strptime(str(salida.date_of_out)[:10], "%Y-%m-%d").date()
        except ValueError:
            pass

    movement = ccProvidersConsumptionPayments(
        id=str(uuid.uuid4()),
        provider_type="transporte",
        transport_id=transport.id,
        salida_id=salida.id,
        date=departure_date,
        detail=f"Consumo transporte - salida {salida.date_of_out or salida.id}",
        type="consumo",
        amount=amount,
        iweb_client_id=salida.iweb_client_id,
    )
    db.add(movement)
    return movement


@router.get("/get_salidas", response_model=Any)
async def get_salidas(
    iweb_client_id: str,
    page: Optional[int] = Query(None, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db)
):
    norm_client = iweb_client_id.strip().lower()
    salidas_query = db.query(Salidas).filter(func.lower(Salidas.iweb_client_id) == norm_client)

    is_paged = isinstance(page, int) and page >= 1

    if is_paged:
        total = salidas_query.count()
        salidas = salidas_query.offset((page - 1) * limit).limit(limit).all()
    else:
        salidas = salidas_query.all()
        total = len(salidas)

    if not salidas:
        if is_paged:
            return {"items": [], "total": 0, "page": page, "limit": limit, "total_pages": 1}
        return []

    salida_ids_lower = [s.id.strip().lower() for s in salidas if s.id]
    transport_units_map = units_for_departures(db, iweb_client_id, [s.id for s in salidas])

    # Batch 1: All SalidasLugaresCarga
    all_slc = db.query(SalidasLugaresCarga).filter(
        func.lower(SalidasLugaresCarga.iweb_client_id) == norm_client,
        func.lower(SalidasLugaresCarga.salida_id).in_(salida_ids_lower)
    ).all()
    slc_map = {rel.salida_id.strip().lower(): rel for rel in all_slc if rel.salida_id}

    # Batch 2: All LugaresCarga
    all_carga_ids = set()
    for rel in all_slc:
        if rel.cargas:
            for cid in rel.cargas.split(","):
                if cid.strip():
                    all_carga_ids.add(cid.strip())

    places_map = {}
    if all_carga_ids:
        places = db.query(LugaresCarga).filter(
            func.lower(LugaresCarga.iweb_client_id) == norm_client,
            LugaresCarga.id.in_(list(all_carga_ids))
        ).all()
        places_map = {p.id: p for p in places}

    # Batch 3: All active Reservas
    all_reservas = db.query(Reservas).filter(
        func.lower(Reservas.iweb_client_id) == norm_client,
        func.lower(Reservas.salida_id).in_(salida_ids_lower),
        (Reservas.active == True) | (Reservas.active.is_(None))
    ).all()

    res_by_salida: dict = {}
    reserva_ids = []
    for r in all_reservas:
        if r.salida_id:
            s_key = r.salida_id.strip().lower()
            res_by_salida.setdefault(s_key, []).append(r.id)
            reserva_ids.append(r.id)

    # Batch 4: All ReservationPassengers
    rp_by_reserva: dict = {}
    if reserva_ids:
        all_rps = db.query(ReservationPassengers).filter(
            ReservationPassengers.reserva_id.in_(reserva_ids)
        ).all()
        for rp in all_rps:
            rp_by_reserva.setdefault(rp.reserva_id, []).append(rp)

    response = []
    for s in salidas:
        s_key = s.id.strip().lower()
        rel = slc_map.get(s_key)
        cargas_resolved = []
        if rel and rel.cargas:
            carga_ids = [cid.strip() for cid in rel.cargas.split(",") if cid.strip()]
            horarios_list = [h.strip() for h in rel.horarios.split(",")] if rel.horarios else []
            while len(horarios_list) < len(carga_ids):
                horarios_list.append("")
            for idx, cid in enumerate(carga_ids):
                if cid in places_map:
                    p = places_map[cid]
                    cargas_resolved.append({
                        "id": p.id,
                        "name": p.name,
                        "type": p.type,
                        "address": p.address,
                        "horario": horarios_list[idx]
                    })

        semicama_res_qty = 0
        cama_res_qty = 0
        total_passengers = 0

        active_res_ids = res_by_salida.get(s_key, [])
        for r_id in active_res_ids:
            rp_list = rp_by_reserva.get(r_id, [])
            for rp in rp_list:
                total_passengers += 1
                b_type = (rp.butaca_type or "").strip().lower()
                if b_type == "cama":
                    cama_res_qty += 1
                else:
                    semicama_res_qty += 1

        total_semicama = s.semicama or 0
        dispo_semicama = max(0, total_semicama - semicama_res_qty)
        total_cama = s.cama or 0
        dispo_cama = max(0, total_cama - cama_res_qty)

        response.append(
            SalidaResponse(
                transport_units=transport_units_map.get(s.id, []),
                id=s.id,
                iweb_client_id=s.iweb_client_id,
                date_of_out=s.date_of_out,
                type=s.type,
                active=s.active,
                periodo=s.periodo,
                transport_company=s.transport_company,
                precio_transporte=s.precio_transporte,
                type_bus=s.type_bus,
                destino=s.destino,
                coordinador_nombre=s.coordinador_nombre,
                coordinador_telefono=s.coordinador_telefono,
                hotel_id=s.hotel_id,
                regimen_id=s.regimen_id,
                alcance=s.alcance or "argentina",
                vouchers_online=bool(s.vouchers_online),
                passengers=s.passengers,
                semicama=s.semicama or 0,
                cama=s.cama or 0,
                semicama_disponibles=dispo_semicama,
                cama_disponibles=dispo_cama,
                semicama_reservadas=semicama_res_qty,
                cama_reservadas=cama_res_qty,
                passengers_reservados=total_passengers,
            )
        )

    if is_paged:
        total_pages = math.ceil(total / limit) if total > 0 else 1
        return {
            "items": [item.model_dump() if hasattr(item, "model_dump") else item.dict() for item in response],
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    return response


@router.get("/get_salida/{id}", response_model=SalidaResponse)
async def get_salida(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    s = db.query(Salidas).filter(
        Salidas.id == id,
        Salidas.iweb_client_id == iweb_client_id
    ).first()
    
    if not s:
        raise HTTPException(status_code=404, detail="Salida no encontrada")

    rel = db.query(SalidasLugaresCarga).filter(
        SalidasLugaresCarga.iweb_client_id == iweb_client_id,
        SalidasLugaresCarga.salida_id == s.id
    ).first()
    
    cargas_resolved = []
    if rel and rel.cargas:
        carga_ids = [cid.strip() for cid in rel.cargas.split(",") if cid.strip()]
        horarios_list = [h.strip() for h in rel.horarios.split(",")] if rel.horarios else []
        while len(horarios_list) < len(carga_ids):
            horarios_list.append("")
            
        if carga_ids:
            places = db.query(LugaresCarga).filter(
                LugaresCarga.iweb_client_id == iweb_client_id,
                LugaresCarga.id.in_(carga_ids)
            ).all()
            places_map = {p.id: p for p in places}
            for idx, cid in enumerate(carga_ids):
                if cid in places_map:
                    p = places_map[cid]
                    cargas_resolved.append({
                        "id": p.id,
                        "name": p.name,
                        "type": p.type,
                        "address": p.address,
                        "horario": horarios_list[idx]
                    })
            
    # Count reservations by tipo_butaca for this salida_id
    semicama_res_qty = 0
    cama_res_qty = 0
    total_passengers = 0

    reservas_activas = db.query(Reservas).filter(
        func.lower(Reservas.salida_id) == func.lower(s.id.strip()),
        func.lower(Reservas.iweb_client_id) == func.lower(iweb_client_id.strip()),
        Reservas.active == True
    ).all()

    for r in reservas_activas:
        rp_list = db.query(ReservationPassengers).filter(ReservationPassengers.reserva_id == r.id).all()
        for rp in rp_list:
            total_passengers += 1
            b_type = rp.butaca_type
            if not b_type:
                semicama_res_qty += 1
            elif b_type.lower() == "semicama":
                semicama_res_qty += 1
            elif b_type.lower() == "cama":
                cama_res_qty += 1

    total_semicama = s.semicama or 0
    dispo_semicama = max(0, total_semicama - semicama_res_qty)
    
    total_cama = s.cama or 0
    dispo_cama = max(0, total_cama - cama_res_qty)
            
    return SalidaResponse(
        transport_units=units_for(db, s),
        id=s.id,
        iweb_client_id=s.iweb_client_id,
        date_of_out=s.date_of_out,
        type=s.type,
        active=s.active,
        periodo=s.periodo,
        transport_company=s.transport_company,
        precio_transporte=s.precio_transporte,
        type_bus=s.type_bus,
        destino=s.destino,
        coordinador_nombre=s.coordinador_nombre,
        coordinador_telefono=s.coordinador_telefono,
        hotel_id=s.hotel_id,
        regimen_id=s.regimen_id,
        alcance=s.alcance or "argentina",
        vouchers_online=bool(s.vouchers_online),
        passengers=s.passengers,
        semicama=s.semicama,
        cama=s.cama,
        cargas=cargas_resolved,
        semicama_disponibles=dispo_semicama,
        cama_disponibles=dispo_cama,
        semicama_reservadas=semicama_res_qty,
        cama_reservadas=cama_res_qty,
        passengers_reservados=total_passengers,
    )


@router.post("/create_salida", response_model=SalidaResponse)
async def create_salida(
    body: SalidaCreateRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    salida_id = str(uuid.uuid4())
    new_salida = Salidas(
        id=salida_id,
        iweb_client_id=iweb_client_id,
        date_of_out=body.date_of_out,
        type=body.type,
        active=body.active,
        periodo=body.periodo,
        transport_company=body.transport_company,
        precio_transporte=body.precio_transporte,
        type_bus=body.type_bus,
        destino=body.destino,
        passengers=body.passengers,
        semicama=body.semicama,
        cama=body.cama,
        coordinador_nombre=body.coordinador_nombre,
        coordinador_telefono=body.coordinador_telefono,
        hotel_id=body.hotel_id,
        regimen_id=body.regimen_id,
        alcance=body.alcance or "argentina",
        vouchers_online=body.vouchers_online if body.vouchers_online is not None else False
    )
    db.add(new_salida)
    db.flush()
    
    # Crear relación de lugares de carga
    cargas_str = ", ".join(body.cargas_ids) if body.cargas_ids else None
    horarios_str = ", ".join(body.horarios) if body.horarios else None
    new_relation = SalidasLugaresCarga(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        salida_id=salida_id,
        cargas=cargas_str,
        horarios=horarios_str
    )
    db.add(new_relation)
    if (body.type or "").strip().lower() in {"bus", "micro"} and body.transport_company and body.precio_transporte is not None and body.precio_transporte > 0:
        from schemas.transport_units import TransportUnitCreate
        create_unit(db, new_salida, TransportUnitCreate(
            transport_company=body.transport_company,
            price=body.precio_transporte,
            type_bus=body.type_bus,
            coordinador_nombre=body.coordinador_nombre,
            coordinador_telefono=body.coordinador_telefono,
        ), "Sistema")
    else:
        register_transport_consumption(db, new_salida)
    
    db.commit()
    db.refresh(new_salida)
    
    # Resolver los objetos completos de carga para la respuesta
    cargas_resolved = []
    if body.cargas_ids:
        places = db.query(LugaresCarga).filter(
            LugaresCarga.iweb_client_id == iweb_client_id,
            LugaresCarga.id.in_(body.cargas_ids)
        ).all()
        places_map = {p.id: p for p in places}
        for idx, cid in enumerate(body.cargas_ids):
            if cid in places_map:
                p = places_map[cid]
                cargas_resolved.append({
                    "id": p.id,
                    "name": p.name,
                    "type": p.type,
                    "address": p.address,
                    "horario": body.horarios[idx] if idx < len(body.horarios) else ""
                })
        
    return SalidaResponse(
        id=new_salida.id,
        transport_units=units_for(db, new_salida),
        iweb_client_id=new_salida.iweb_client_id,
        date_of_out=new_salida.date_of_out,
        type=new_salida.type,
        active=new_salida.active,
        periodo=new_salida.periodo,
        transport_company=new_salida.transport_company,
        precio_transporte=new_salida.precio_transporte,
        type_bus=new_salida.type_bus,
        destino=new_salida.destino,
        coordinador_nombre=new_salida.coordinador_nombre,
        coordinador_telefono=new_salida.coordinador_telefono,
        hotel_id=new_salida.hotel_id,
        regimen_id=new_salida.regimen_id,
        alcance=new_salida.alcance or "argentina",
        vouchers_online=bool(new_salida.vouchers_online),
        passengers=new_salida.passengers,
        semicama=new_salida.semicama,
        cama=new_salida.cama,
        cargas=cargas_resolved
    )


@router.patch(
    "/{salida_id}/reservation-passengers/hotel",
    response_model=ReservationPassengerHotelReplaceResponse,
)
async def replace_reservation_passenger_hotel(
    salida_id: str,
    body: ReservationPassengerHotelReplaceRequest,
    iweb_client_id: str,
    db: Session = Depends(get_inventory_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.iweb_client_id not in {iweb_client_id, "GLOBAL"}:
        raise HTTPException(status_code=403, detail="No tenés permisos para modificar reservas de otra agencia")

    source_hotel_id = body.source_hotel_id.strip()
    target_hotel_id = body.target_hotel_id.strip()
    if not source_hotel_id or not target_hotel_id:
        raise HTTPException(status_code=400, detail="Seleccioná el hotel actual y el hotel nuevo")
    if source_hotel_id == target_hotel_id:
        raise HTTPException(status_code=400, detail="El hotel nuevo debe ser diferente al hotel actual")

    salida = db.query(Salidas).filter(
        Salidas.id == salida_id,
        Salidas.iweb_client_id == iweb_client_id,
    ).first()
    if not salida:
        raise HTTPException(status_code=404, detail="Salida no encontrada")

    hotel_ids = {source_hotel_id, target_hotel_id}
    existing_hotel_ids = {
        hotel_id for (hotel_id,) in db.query(Hotels.id).filter(
            Hotels.id.in_(hotel_ids),
            Hotels.iweb_client_id == iweb_client_id,
        ).all()
    }
    if source_hotel_id not in existing_hotel_ids:
        raise HTTPException(status_code=404, detail="Hotel actual no encontrado")
    if target_hotel_id not in existing_hotel_ids:
        raise HTTPException(status_code=404, detail="Hotel destino no encontrado")

    passengers = db.query(ReservationPassengers).join(
        Reservas,
        Reservas.id == ReservationPassengers.reserva_id,
    ).filter(
        Reservas.iweb_client_id == iweb_client_id,
        Reservas.salida_id == salida_id,
        Reservas.active.is_not(False),
        ReservationPassengers.hotel_id == source_hotel_id,
    ).all()
    for passenger in passengers:
        passenger.hotel_id = target_hotel_id

    db.commit()
    return ReservationPassengerHotelReplaceResponse(updated_passengers=len(passengers))


@router.patch(
    "/{salida_id}/reservation-passengers/lugar-carga",
    response_model=ReservationPassengerBoardingBulkResponse,
)
async def assign_reservation_passengers_boarding_place(
    salida_id: str,
    body: ReservationPassengerBoardingBulkRequest,
    iweb_client_id: str,
    db: Session = Depends(get_inventory_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.iweb_client_id not in {iweb_client_id, "GLOBAL"}:
        raise HTTPException(
            status_code=403,
            detail="No tenés permisos para modificar reservas de otra agencia",
        )

    passenger_ids = list(dict.fromkeys(
        passenger_id.strip()
        for passenger_id in body.reservation_passenger_ids
        if isinstance(passenger_id, str) and passenger_id.strip()
    ))
    lugar_carga_id = body.lugar_carga_id.strip() if body.lugar_carga_id is not None else None
    bus_number_requested = body.bus_number is not None
    bus_number = body.bus_number.strip() if body.bus_number is not None else None
    if not passenger_ids:
        raise HTTPException(
            status_code=400,
            detail="Seleccioná al menos un pasajero",
        )
    if not lugar_carga_id and not bus_number_requested:
        raise HTTPException(
            status_code=400,
            detail="Seleccioná al menos un lugar de ascenso o N° de bus",
        )

    salida = db.query(Salidas).filter(
        Salidas.id == salida_id,
        Salidas.iweb_client_id == iweb_client_id,
    ).first()
    if not salida:
        raise HTTPException(status_code=404, detail="Salida no encontrada")

    relation = (
        db.query(SalidasLugaresCarga).filter(
            SalidasLugaresCarga.salida_id == salida_id,
            SalidasLugaresCarga.iweb_client_id == iweb_client_id,
        ).first()
        if lugar_carga_id
        else None
    )
    if lugar_carga_id and not relation:
        raise HTTPException(
            status_code=400,
            detail="La salida no tiene lugares de ascenso configurados",
        )
    salida_place_ids = {
        place_id.strip()
        for place_id in ((relation.cargas if relation else "") or "").split(",")
        if place_id.strip()
    }
    if lugar_carga_id and lugar_carga_id not in salida_place_ids:
        raise HTTPException(
            status_code=400,
            detail="El lugar de ascenso no pertenece a la salida",
        )

    place = (
        db.query(LugaresCarga).filter(
            LugaresCarga.id == lugar_carga_id,
            LugaresCarga.iweb_client_id == iweb_client_id,
        ).first()
        if lugar_carga_id
        else None
    )
    if lugar_carga_id and not place:
        raise HTTPException(status_code=404, detail="Lugar de ascenso no encontrado")

    selected_unit = None
    departure_units = None
    if bus_number_requested and bus_number:
        if not bus_number.isdecimal() or int(bus_number) < 1:
            raise HTTPException(
                status_code=422,
                detail="El numero de bus debe ser un entero positivo",
            )
        departure_units = units_for(db, salida)
        selected_unit = next(
            (
                unit
                for unit in departure_units
                if unit.active and unit.number == int(bus_number)
            ),
            None,
        )
        if not selected_unit:
            raise HTTPException(
                status_code=422,
                detail=f"El Bus {int(bus_number)} no esta activo en esta salida",
            )

    passengers = db.query(ReservationPassengers).join(
        Reservas,
        Reservas.id == ReservationPassengers.reserva_id,
    ).filter(
        ReservationPassengers.id.in_(passenger_ids),
        Reservas.salida_id == salida_id,
        Reservas.iweb_client_id == iweb_client_id,
        Reservas.active.is_not(False),
    ).all()
    passenger_map = {passenger.id: passenger for passenger in passengers}
    missing_ids = [
        passenger_id
        for passenger_id in passenger_ids
        if passenger_id not in passenger_map
    ]
    if missing_ids:
        raise HTTPException(
            status_code=404,
            detail="Uno o más pasajeros no pertenecen a la salida activa",
        )

    for passenger in passengers:
        if lugar_carga_id:
            passenger.lugar_carga_id = lugar_carga_id
        if bus_number_requested:
            assign_passenger_to_unit_number(
                db,
                salida,
                passenger,
                bus_number or "",
                units=departure_units,
            )

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return ReservationPassengerBoardingBulkResponse(
        updated_passengers=len(passengers),
        lugar_carga_id=lugar_carga_id,
        bus_number=str(selected_unit.number) if selected_unit else None,
    )


@router.put("/update_salida/{id}", response_model=SalidaResponse)
async def update_salida(
    id: str,
    body: SalidaUpdateRequest,
    iweb_client_id: str,
    db: Session = Depends(get_inventory_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.iweb_client_id not in {iweb_client_id, "GLOBAL"}:
        raise HTTPException(status_code=403, detail="No tenés permisos para modificar salidas de otra agencia")

    s = db.query(Salidas).filter(
        Salidas.id == id,
        Salidas.iweb_client_id == iweb_client_id
    ).first()
    
    if not s:
        raise HTTPException(status_code=404, detail="Salida no encontrada")

    previous_transport_price = float(s.precio_transporte or 0)
    has_units = apply_legacy_update(db, s, body, _audit_actor_name(current_user))
    # Actualizar los campos que se envíen
    if body.date_of_out is not None:
        s.date_of_out = body.date_of_out
    if body.type is not None:
        s.type = body.type
    if body.active is not None:
        s.active = body.active
    if body.periodo is not None:
        s.periodo = body.periodo
    if body.transport_company is not None:
        s.transport_company = body.transport_company
    if body.precio_transporte is not None:
        s.precio_transporte = body.precio_transporte
    if body.type_bus is not None:
        s.type_bus = body.type_bus
    if body.destino is not None:
        s.destino = body.destino
    if body.passengers is not None:
        s.passengers = body.passengers
    if body.semicama is not None:
        s.semicama = body.semicama
    if body.cama is not None:
        s.cama = body.cama
    if body.coordinador_nombre is not None:
        s.coordinador_nombre = body.coordinador_nombre
    if body.coordinador_telefono is not None:
        s.coordinador_telefono = body.coordinador_telefono
    if body.hotel_id is not None:
        s.hotel_id = body.hotel_id
    if body.regimen_id is not None:
        s.regimen_id = body.regimen_id
    if body.alcance is not None:
        s.alcance = body.alcance
    if body.vouchers_online is not None:
        s.vouchers_online = body.vouchers_online

    if has_units:
        project_legacy(db, s)
    if not has_units and body.precio_transporte is not None and float(s.precio_transporte or 0) != previous_transport_price:
        register_transport_consumption(
            db,
            s,
            price_changed=True,
            updated_by=current_user,
        )
        
    # Actualizar o crear la relación de lugares de carga
    rel = db.query(SalidasLugaresCarga).filter(
        SalidasLugaresCarga.iweb_client_id == iweb_client_id,
        SalidasLugaresCarga.salida_id == s.id
    ).first()
    
    cargas_str = ", ".join(body.cargas_ids) if body.cargas_ids is not None else None
    horarios_str = ", ".join(body.horarios) if body.horarios is not None else None
    
    if rel:
        if body.cargas_ids is not None:
            rel.cargas = cargas_str
        if body.horarios is not None:
            rel.horarios = horarios_str
    else:
        new_relation = SalidasLugaresCarga(
            id=str(uuid.uuid4()),
            iweb_client_id=iweb_client_id,
            salida_id=s.id,
            cargas=cargas_str,
            horarios=horarios_str
        )
        db.add(new_relation)
        
    db.commit()
    db.refresh(s)
    
    # Resolver los objetos de carga actuales para la respuesta
    cargas_resolved = []
    cargas_to_use = body.cargas_ids if body.cargas_ids is not None else (rel.cargas.split(",") if rel and rel.cargas else [])
    cargas_to_use = [c.strip() for c in cargas_to_use if c.strip()]
    horarios_to_use = body.horarios if body.horarios is not None else (rel.horarios.split(",") if rel and rel.horarios else [])
    horarios_to_use = [h.strip() for h in horarios_to_use]
    while len(horarios_to_use) < len(cargas_to_use):
        horarios_to_use.append("")
        
    if cargas_to_use:
        places = db.query(LugaresCarga).filter(
            LugaresCarga.iweb_client_id == iweb_client_id,
            LugaresCarga.id.in_(cargas_to_use)
        ).all()
        places_map = {p.id: p for p in places}
        for idx, cid in enumerate(cargas_to_use):
            if cid in places_map:
                p = places_map[cid]
                cargas_resolved.append({
                    "id": p.id,
                    "name": p.name,
                    "type": p.type,
                    "address": p.address,
                    "horario": horarios_to_use[idx]
                })
        
    return SalidaResponse(
        id=s.id,
        transport_units=units_for(db, s),
        iweb_client_id=s.iweb_client_id,
        date_of_out=s.date_of_out,
        type=s.type,
        active=s.active,
        periodo=s.periodo,
        transport_company=s.transport_company,
        precio_transporte=s.precio_transporte,
        type_bus=s.type_bus,
        destino=s.destino,
        coordinador_nombre=s.coordinador_nombre,
        coordinador_telefono=s.coordinador_telefono,
        hotel_id=s.hotel_id,
        regimen_id=s.regimen_id,
        alcance=s.alcance or "argentina",
        vouchers_online=bool(s.vouchers_online),
        passengers=s.passengers,
        semicama=s.semicama,
        cama=s.cama,
        cargas=cargas_resolved
    )


@router.delete("/delete_salida/{id}")
async def delete_salida(id: str, iweb_client_id: str, db: Session = Depends(get_inventory_db)):
    s = db.query(Salidas).filter(
        Salidas.id == id,
        Salidas.iweb_client_id == iweb_client_id
    ).first()
    
    if not s:
        raise HTTPException(status_code=404, detail="Salida no encontrada")
        
    if db.query(Reservas).filter_by(iweb_client_id=iweb_client_id, salida_id=id).filter(Reservas.active.is_not(False)).first():
        raise HTTPException(400, "No se puede eliminar una salida con reservas vigentes")
    if units_for(db, s):
        for unit in units_for(db, s):
            cancel_unit(db, s, unit, "Baja de salida")
        s.active = False
        db.commit()
        return {"message": "Salida anulada conservando el historial de micros"}
    from models.models import PackagesDatesOfExit, PackageHotelCapacity
    db.query(PackageHotelCapacity).filter_by(iweb_client_id=iweb_client_id, salida_id=id).delete(synchronize_session=False)
    db.query(PackagesDatesOfExit).filter_by(iweb_client_id=iweb_client_id, salida_id=id).delete(synchronize_session=False)
    # Eliminar relaciones en salidas_lugares_carga
    db.query(SalidasLugaresCarga).filter(
        SalidasLugaresCarga.iweb_client_id == iweb_client_id,
        SalidasLugaresCarga.salida_id == s.id
    ).delete(synchronize_session=False)
    
    # Eliminar salida
    db.delete(s)
    db.commit()
    
    return {"message": "Salida eliminada con éxito"}
