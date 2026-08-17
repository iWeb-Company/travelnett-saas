import uuid
import math
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from models.models import Salidas, SalidasLugaresCarga, LugaresCarga, Reservas, ReservationPassengers
from schemas.schemas import (
    SalidaResponse,
    SalidaCreateRequest,
    SalidaUpdateRequest,
    LugarCargaPayload,
)

router = APIRouter(prefix="/salidas", tags=["Salidas CRUD"])


@router.get("/get_salidas", response_model=Any)
async def get_salidas(
    iweb_client_id: str,
    page: Optional[int] = Query(None, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db)
):
    salidas_query = db.query(Salidas).filter(Salidas.iweb_client_id == iweb_client_id)
    
    if page is not None:
        total = salidas_query.count()
        salidas = salidas_query.offset((page - 1) * limit).limit(limit).all()
    else:
        salidas = salidas_query.all()
        
    if not salidas:
        if page is not None:
            return {"items": [], "total": 0, "page": page, "limit": limit, "total_pages": 1}
        return []

    salida_ids = [s.id for s in salidas]

    # Batch 1: All SalidasLugaresCarga
    all_slc = db.query(SalidasLugaresCarga).filter(
        SalidasLugaresCarga.iweb_client_id == iweb_client_id,
        SalidasLugaresCarga.salida_id.in_(salida_ids)
    ).all()
    slc_map = {rel.salida_id: rel for rel in all_slc}

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
            LugaresCarga.iweb_client_id == iweb_client_id,
            LugaresCarga.id.in_(list(all_carga_ids))
        ).all()
        places_map = {p.id: p for p in places}

    # Batch 3: All active Reservas
    all_reservas = db.query(Reservas).filter(
        Reservas.iweb_client_id == iweb_client_id,
        Reservas.salida_id.in_(salida_ids),
        Reservas.active == True
    ).all()

    res_by_salida: dict[str, list[str]] = {}
    reserva_ids = []
    for r in all_reservas:
        if r.salida_id:
            s_key = r.salida_id.strip().lower()
            if s_key not in res_by_salida:
                res_by_salida[s_key] = []
            res_by_salida[s_key].append(r.id)
            reserva_ids.append(r.id)

    # Batch 4: All ReservationPassengers
    rp_by_reserva: dict[str, list[ReservationPassengers]] = {}
    if reserva_ids:
        all_rps = db.query(ReservationPassengers).filter(
            ReservationPassengers.reserva_id.in_(reserva_ids)
        ).all()
        for rp in all_rps:
            if rp.reserva_id not in rp_by_reserva:
                rp_by_reserva[rp.reserva_id] = []
            rp_by_reserva[rp.reserva_id].append(rp)

    response = []
    for s in salidas:
        rel = slc_map.get(s.id)
        cargas_resolved = []
        if rel and rel.cargas:
            carga_ids = [cid.strip() for cid in rel.cargas.split(",") if cid.strip()]
            horarios_list = [h.strip() for h in rel.horarios.split(",") if h.strip()] if rel.horarios else []
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

        s_key = s.id.strip().lower()
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
                id=s.id,
                iweb_client_id=s.iweb_client_id,
                date_of_out=s.date_of_out,
                type=s.type,
                active=s.active,
                periodo=s.periodo,
                transport_company=s.transport_company,
                type_bus=s.type_bus,
                destino=s.destino,
                coordinador_nombre=s.coordinador_nombre,
                coordinador_telefono=s.coordinador_telefono,
                hotel_id=s.hotel_id,
                regimen_id=s.regimen_id,
                passengers=s.passengers or 0,
                semicama=s.semicama or 0,
                cama=s.cama or 0,
                semicama_disponibles=dispo_semicama,
                cama_disponibles=dispo_cama,
                semicama_reservadas=semicama_res_qty,
                cama_reservadas=cama_res_qty
            )
        )

    if page is not None:
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
        horarios_list = [h.strip() for h in rel.horarios.split(",") if h.strip()] if rel.horarios else []
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
        id=s.id,
        iweb_client_id=s.iweb_client_id,
        date_of_out=s.date_of_out,
        type=s.type,
        active=s.active,
        periodo=s.periodo,
        transport_company=s.transport_company,
        type_bus=s.type_bus,
        destino=s.destino,
        coordinador_nombre=s.coordinador_nombre,
        coordinador_telefono=s.coordinador_telefono,
        hotel_id=s.hotel_id,
        regimen_id=s.regimen_id,
        passengers=total_passengers,
        semicama=s.semicama,
        cama=s.cama,
        cargas=cargas_resolved,
        semicama_disponibles=dispo_semicama,
        cama_disponibles=dispo_cama,
        semicama_reservadas=semicama_res_qty,
        cama_reservadas=cama_res_qty
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
        type_bus=body.type_bus,
        destino=body.destino,
        passengers=body.passengers,
        semicama=body.semicama,
        cama=body.cama,
        coordinador_nombre=body.coordinador_nombre,
        coordinador_telefono=body.coordinador_telefono,
        hotel_id=body.hotel_id,
        regimen_id=body.regimen_id
    )
    db.add(new_salida)
    
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
        iweb_client_id=new_salida.iweb_client_id,
        date_of_out=new_salida.date_of_out,
        type=new_salida.type,
        active=new_salida.active,
        periodo=new_salida.periodo,
        transport_company=new_salida.transport_company,
        type_bus=new_salida.type_bus,
        destino=new_salida.destino,
        coordinador_nombre=new_salida.coordinador_nombre,
        coordinador_telefono=new_salida.coordinador_telefono,
        hotel_id=new_salida.hotel_id,
        regimen_id=new_salida.regimen_id,
        passengers=new_salida.passengers,
        semicama=new_salida.semicama,
        cama=new_salida.cama,
        cargas=cargas_resolved
    )


@router.put("/update_salida/{id}", response_model=SalidaResponse)
async def update_salida(
    id: str,
    body: SalidaUpdateRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    s = db.query(Salidas).filter(
        Salidas.id == id,
        Salidas.iweb_client_id == iweb_client_id
    ).first()
    
    if not s:
        raise HTTPException(status_code=404, detail="Salida no encontrada")
        
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
    horarios_to_use = [h.strip() for h in horarios_to_use if h.strip()]
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
        iweb_client_id=s.iweb_client_id,
        date_of_out=s.date_of_out,
        type=s.type,
        active=s.active,
        periodo=s.periodo,
        transport_company=s.transport_company,
        type_bus=s.type_bus,
        destino=s.destino,
        coordinador_nombre=s.coordinador_nombre,
        coordinador_telefono=s.coordinador_telefono,
        hotel_id=s.hotel_id,
        regimen_id=s.regimen_id,
        passengers=s.passengers,
        semicama=s.semicama,
        cama=s.cama,
        cargas=cargas_resolved
    )


@router.delete("/delete_salida/{id}")
async def delete_salida(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    s = db.query(Salidas).filter(
        Salidas.id == id,
        Salidas.iweb_client_id == iweb_client_id
    ).first()
    
    if not s:
        raise HTTPException(status_code=404, detail="Salida no encontrada")
        
    # Eliminar relaciones en salidas_lugares_carga
    db.query(SalidasLugaresCarga).filter(
        SalidasLugaresCarga.iweb_client_id == iweb_client_id,
        SalidasLugaresCarga.salida_id == s.id
    ).delete(synchronize_session=False)
    
    # Eliminar salida
    db.delete(s)
    db.commit()
    
    return {"message": "Salida eliminada con éxito"}
