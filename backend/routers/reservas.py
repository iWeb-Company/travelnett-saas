import uuid
import math
from datetime import datetime
from typing import Optional, List, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from models.models import Reservas, Passengers, Salidas, LugaresCarga, Hotels, Regimenes, Clients, ReservationPassengers, Destinos, Liquidaciones, GastosNoCommission, Pagos, Vouchers, cuentasCorrientsClients
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/reservas", tags=["Reservas"])

class ReservationPassengerDetail(BaseModel):
    id: str
    reserva_id: str
    pasajero_id: str
    pasajero_type: str
    butaca_number: Optional[int] = None
    butaca_type: Optional[str] = None
    bus_number: Optional[str] = None
    lugar_carga_id: Optional[str] = None
    lugar_carga_nombre: Optional[str] = None
    room_index: Optional[int] = 0
    
    # Cruzados desde la tabla passengers
    nombre_completo: Optional[str] = None
    dni: Optional[int] = None
    fecha_nacimiento: Optional[str] = None
    sex: Optional[str] = None
    telefono: Optional[str] = None

    class Config:
        from_attributes = True


class ReservaPassengerCreateInput(BaseModel):
    pasajero_id: str
    pasajero_type: str
    butaca_number: Optional[int] = None
    butaca_type: Optional[str] = None
    bus_number: Optional[str] = None
    lugar_carga_id: Optional[str] = None
    room_index: Optional[int] = 0


class ReservaCreatePayload(BaseModel):
    salida_id: Optional[str] = None
    package_id: Optional[str] = None
    codigo_reserva: Optional[str] = None
    client_id: Optional[str] = None
    lugar_carga_id: Optional[str] = None
    hotel_id: Optional[str] = None
    regimen_id: Optional[str] = None
    rooming_id: Optional[str] = None
    room_type: Optional[str] = None
    venciment: Optional[str] = None
    observations: Optional[str] = None
    commission: Optional[float] = None
    liberados: Optional[int] = 0
    type: Optional[str] = "tradicional"
    titulo: Optional[str] = None
    
    # Nuevo campo
    passengers: Optional[List[ReservaPassengerCreateInput]] = None
    
    # Retrocompatibilidad
    passenger_id: Optional[str] = None
    edad_categoria: Optional[str] = None
    butaca: Optional[str] = None
    tipo_butaca: Optional[str] = None


class ReservaUpdatePayload(BaseModel):
    codigo_reserva: Optional[str] = None
    client_id: Optional[str] = None
    lugar_carga_id: Optional[str] = None
    hotel_id: Optional[str] = None
    regimen_id: Optional[str] = None
    rooming_id: Optional[str] = None
    room_type: Optional[str] = None
    active: Optional[bool] = None
    venciment: Optional[str] = None
    observations: Optional[str] = None
    package_id: Optional[str] = None
    commission: Optional[float] = None
    liberados: Optional[int] = None
    type: Optional[str] = None
    titulo: Optional[str] = None
    
    # Nuevo campo para actualizar pasajeros
    passengers: Optional[List[ReservaPassengerCreateInput]] = None
    
    # Retrocompatibilidad
    edad_categoria: Optional[str] = None
    butaca: Optional[str] = None
    tipo_butaca: Optional[str] = None


class ReservaDetailedResponse(BaseModel):
    id: str
    iweb_client_id: str
    salida_id: Optional[str] = None
    package_id: Optional[str] = None
    codigo_reserva: Optional[str] = None
    client_id: Optional[str] = None
    client_nombre: Optional[str] = None
    lugar_carga_id: Optional[str] = None
    lugar_carga_nombre: Optional[str] = None
    lugar_carga_direccion: Optional[str] = None
    hotel_id: Optional[str] = None
    hotel_nombre: Optional[str] = None
    regimen_id: Optional[str] = None
    regimen_nombre: Optional[str] = None
    rooming_id: Optional[str] = None
    room_type: Optional[str] = None
    active: bool
    venciment: Optional[str] = None
    observations: Optional[str] = None
    commission: Optional[float] = None
    liberados: Optional[int] = 0
    type: Optional[str] = "tradicional"
    titulo: Optional[str] = None
    created_at: Optional[str] = None
    
    # Compatibilidad virtual para frontend tradicional
    passenger_id: Optional[str] = None
    nombre_completo: Optional[str] = None
    telefono: Optional[str] = None
    dni: Optional[int] = None
    fecha_nacimiento: Optional[str] = None
    edad_categoria: Optional[str] = None
    butaca: Optional[str] = None
    tipo_butaca: Optional[str] = None
    
    # Tabla intermedia
    reservation_passengers: List[ReservationPassengerDetail] = []
    
    # Datos de salida para el listado de reservas
    destino: Optional[str] = None
    fecha: Optional[str] = None

    # Importes de liquidación y saldo
    total_amount: Optional[float] = None
    total_commission: Optional[float] = None
    total_payments: Optional[float] = None
    balance: Optional[float] = None

    class Config:
        from_attributes = True


@router.get("/get_reservas", response_model=Any)
async def get_reservas(
    iweb_client_id: str,
    salida_id: Optional[str] = None,
    page: Optional[int] = Query(None, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db)
):
    norm_client = iweb_client_id.strip().lower()
    is_paged = isinstance(page, int) and page >= 1

    # ── 1. Reservas ─────────────────────────────────────────────────────────
    query = db.query(Reservas).filter(
        func.lower(Reservas.iweb_client_id) == norm_client
    )
    if salida_id and salida_id.strip() not in ("", "undefined", "null", "none", "None"):
        query = query.filter(func.lower(Reservas.salida_id) == salida_id.strip().lower())
    
    total = query.count() if is_paged else 0

    order_criteria = [Reservas.created_at.desc(), Reservas.id.desc()]
    if is_paged:
        res_list = query.order_by(*order_criteria).offset((page - 1) * limit).limit(limit).all()
    else:
        res_list = query.order_by(*order_criteria).all()

    if not res_list:
        if is_paged:
            return {"items": [], "total": 0, "page": page, "limit": limit, "total_pages": 1}
        return []

    res_ids     = [r.id for r in res_list]
    salida_ids  = list({r.salida_id for r in res_list if r.salida_id})
    hotel_ids   = list({r.hotel_id  for r in res_list if r.hotel_id})
    regimen_ids = list({r.regimen_id for r in res_list if r.regimen_id})
    client_ids  = list({r.client_id  for r in res_list if r.client_id})
    lc_root_ids = list({r.lugar_carga_id for r in res_list if r.lugar_carga_id})

    # ── 2. ReservationPassengers (batch) ────────────────────────────────────
    all_rps = db.query(ReservationPassengers).filter(
        ReservationPassengers.reserva_id.in_(res_ids)
    ).order_by(ReservationPassengers.room_index.asc()).all()
    rp_by_reserva: dict = {}
    for rp in all_rps:
        rp_by_reserva.setdefault(rp.reserva_id, []).append(rp)

    pax_ids = list({rp.pasajero_id for rp in all_rps if rp.pasajero_id})
    lc_pax_ids = list({rp.lugar_carga_id for rp in all_rps if rp.lugar_carga_id})
    all_lc_ids = list(set(lc_root_ids + lc_pax_ids))

    # ── 3. Passengers (batch) ────────────────────────────────────────────────
    passengers_map: dict = {}
    if pax_ids:
        paxs = db.query(Passengers).filter(
            Passengers.id.in_(pax_ids),
            Passengers.iweb_client_id == norm_client
        ).all()
        passengers_map = {p.id: p for p in paxs}

    # ── 4. Clients (batch) – como pasajeros Y como dueños de reserva ─────────
    clients_map: dict = {}
    all_client_ids = list(set(pax_ids + client_ids))
    if all_client_ids:
        cls = db.query(Clients).filter(
            Clients.id.in_(all_client_ids),
            Clients.iweb_client_id == norm_client
        ).all()
        clients_map = {c.id: c for c in cls}

    # ── 5. LugaresCarga (batch) ──────────────────────────────────────────────
    lc_map: dict = {}
    if all_lc_ids:
        lcs = db.query(LugaresCarga).filter(LugaresCarga.id.in_(all_lc_ids)).all()
        lc_map = {lc.id: lc for lc in lcs}

    # ── 6. Hotels (batch) ────────────────────────────────────────────────────
    hotels_map: dict = {}
    if hotel_ids:
        hs = db.query(Hotels).filter(Hotels.id.in_(hotel_ids)).all()
        hotels_map = {h.id: h for h in hs}

    # ── 7. Regimenes (batch) ─────────────────────────────────────────────────
    regimenes_map: dict = {}
    if regimen_ids:
        rgs = db.query(Regimenes).filter(Regimenes.id.in_(regimen_ids)).all()
        regimenes_map = {rg.id: rg for rg in rgs}

    # ── 8. Salidas + Destinos (batch) ────────────────────────────────────────
    salidas_map: dict = {}
    destinos_map: dict = {}
    if salida_ids:
        sals = db.query(Salidas).filter(
            Salidas.id.in_(salida_ids),
            Salidas.iweb_client_id == norm_client
        ).all()
        salidas_map = {s.id: s for s in sals}
        dest_ids = list({s.destino for s in sals if s.destino})
        if dest_ids:
            dests = db.query(Destinos).filter(
                Destinos.id.in_(dest_ids),
                Destinos.iweb_client_id == norm_client
            ).all()
            destinos_map = {d.id: d for d in dests}

    # ── 8.5. Liquidaciones + Pagos (batch) ──────────────────────────────────
    all_liqs = db.query(Liquidaciones).filter(
        Liquidaciones.booking_id.in_(res_ids)
    ).all()
    liqs_map: dict = {}
    for l in all_liqs:
        if l.booking_id:
            liqs_map[l.booking_id.strip().lower()] = l

    all_pagos = db.query(Pagos).filter(
        Pagos.reserva_id.in_(res_ids),
        Pagos.iweb_client_id == norm_client
    ).all()
    pagos_by_reserva: dict = {}
    for p in all_pagos:
        pagos_by_reserva.setdefault(p.reserva_id, 0.0)
        pagos_by_reserva[p.reserva_id] += float(p.amount or 0.0)

    # ── 9. Construir respuesta en memoria ────────────────────────────────────

    result = []
    for r in res_list:
        rp_list = rp_by_reserva.get(r.id, [])

        passengers_details = []
        for rp in rp_list:
            p      = passengers_map.get(rp.pasajero_id)
            cl_pax = clients_map.get(rp.pasajero_id) if not p else None

            if p:
                p_name  = p.name or ""
                p_last  = p.last_name or ""
                p_dni   = p.dni
                p_birth = str(p.date_of_birth) if p.date_of_birth else None
                p_sex   = p.sex
                p_phone = str(p.phone) if p.phone else ""
            elif cl_pax:
                p_name  = cl_pax.complete_name or cl_pax.name_system or ""
                p_last  = ""
                p_dni   = cl_pax.dni
                p_birth = str(cl_pax.birthday) if cl_pax.birthday else None
                p_sex   = None
                p_phone = str(cl_pax.phone) if cl_pax.phone else ""
            else:
                p_name = p_last = ""
                p_dni = p_birth = p_sex = None
                p_phone = ""

            nombre_completo_pax = f"{p_name} {p_last}".strip() or "Desconocido"

            pax_lc_id     = rp.lugar_carga_id or r.lugar_carga_id
            pax_lc        = lc_map.get(pax_lc_id) if pax_lc_id else None
            pax_lc_nombre = pax_lc.name if pax_lc else ""

            passengers_details.append(
                ReservationPassengerDetail(
                    id=rp.id,
                    reserva_id=rp.reserva_id,
                    pasajero_id=rp.pasajero_id,
                    pasajero_type=rp.pasajero_type,
                    butaca_number=rp.butaca_number,
                    butaca_type=rp.butaca_type,
                    bus_number=rp.bus_number,
                    lugar_carga_id=pax_lc_id,
                    lugar_carga_nombre=pax_lc_nombre,
                    room_index=getattr(rp, 'room_index', 0) or 0,
                    nombre_completo=nombre_completo_pax,
                    name=p_name or None,
                    last_name=p_last or None,
                    dni=p_dni,
                    fecha_nacimiento=p_birth,
                    sex=p_sex,
                    telefono=p_phone
                )
            )

        # Compat fields (primer pasajero)
        comp_passenger_id    = None
        comp_nombre_completo = "Desconocido"
        comp_telefono        = ""
        comp_dni             = None
        comp_fecha_nacimiento = None
        comp_edad_categoria  = "ADL"
        comp_butaca          = None
        comp_tipo_butaca     = None
        if passengers_details:
            fp = passengers_details[0]
            comp_passenger_id     = fp.pasajero_id
            comp_nombre_completo  = fp.nombre_completo
            comp_telefono         = fp.telefono
            comp_dni              = fp.dni
            comp_fecha_nacimiento = fp.fecha_nacimiento
            comp_edad_categoria   = fp.pasajero_type
            comp_butaca           = str(fp.butaca_number) if fp.butaca_number is not None else None
            comp_tipo_butaca      = fp.butaca_type

        lc_obj  = lc_map.get(r.lugar_carga_id)
        lc_name = lc_obj.name    if lc_obj else ""
        lc_dir  = lc_obj.address if lc_obj else ""

        h_obj   = hotels_map.get(r.hotel_id)
        h_name  = h_obj.name if h_obj else ""

        rg_obj  = regimenes_map.get(r.regimen_id)
        r_name  = rg_obj.name if rg_obj else ""

        cl_obj  = clients_map.get(r.client_id)
        cl_nombre = cl_obj.complete_name or cl_obj.name_system or "" if cl_obj else ""

        if not comp_nombre_completo or comp_nombre_completo == "Desconocido":
            comp_nombre_completo = cl_nombre or "Desconocido"

        sal         = salidas_map.get(r.salida_id)
        salida_date = str(sal.date_of_out).split(" ")[0] if (sal and sal.date_of_out) else ""
        dest_obj    = destinos_map.get(sal.destino) if sal else None
        salida_dest_name = dest_obj.name if dest_obj else ""

        # Importes de liquidación y saldo
        clean_res_id = r.id.strip().lower()
        clean_res_code = (r.codigo_reserva or "").strip().lower()
        liq_obj = liqs_map.get(clean_res_id) or (liqs_map.get(clean_res_code) if clean_res_code else None)

        tot_amount = float(liq_obj.total_amout) if (liq_obj and liq_obj.total_amout is not None) else None
        tot_commission = float(liq_obj.total_commission) if (liq_obj and liq_obj.total_commission is not None) else None
        tot_payments = pagos_by_reserva.get(r.id, 0.0)
        tot_balance = (tot_amount - tot_payments) if tot_amount is not None else None

        result.append(
            ReservaDetailedResponse(
                id=r.id,
                iweb_client_id=r.iweb_client_id,
                salida_id=r.salida_id,
                package_id=r.package_id,
                codigo_reserva=r.codigo_reserva,
                client_id=r.client_id,
                client_nombre=cl_nombre,
                lugar_carga_id=r.lugar_carga_id,
                lugar_carga_nombre=lc_name,
                lugar_carga_direccion=lc_dir,
                hotel_id=r.hotel_id,
                hotel_nombre=h_name,
                regimen_id=r.regimen_id,
                regimen_nombre=r_name,
                rooming_id=r.rooming_id,
                room_type=r.room_type,
                active=bool(r.active if r.active is not None else True),
                venciment=r.venciment,
                observations=r.observations,
                commission=float(r.commission) if r.commission is not None else None,
                liberados=r.liberados or 0,
                type=r.type or "tradicional",
                titulo=r.titulo,
                passenger_id=comp_passenger_id,
                nombre_completo=comp_nombre_completo,
                telefono=comp_telefono,
                dni=comp_dni,
                fecha_nacimiento=comp_fecha_nacimiento,
                edad_categoria=comp_edad_categoria,
                butaca=comp_butaca,
                tipo_butaca=comp_tipo_butaca,
                reservation_passengers=passengers_details,
                destino=salida_dest_name,
                fecha=salida_date,
                total_amount=tot_amount,
                total_commission=tot_commission,
                total_payments=tot_payments,
                balance=tot_balance,
            )
        )
    if is_paged:
        total_pages = math.ceil(total / limit) if total > 0 else 1
        return {
            "items": [item.model_dump() if hasattr(item, "model_dump") else item.dict() for item in result],
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    return result


@router.post("/create_reserva", response_model=ReservaDetailedResponse)
async def create_reserva(
    body: ReservaCreatePayload,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    resolved_salida_id = body.salida_id
    # Si salida_id no está provisto pero sí package_id, resolvemos la salida desde packages_dates_of_exit
    if (not resolved_salida_id or resolved_salida_id.strip() in ("", "undefined", "null", "none", "None")) and body.package_id:
        from models.models import PackagesDatesOfExit
        rel = db.query(PackagesDatesOfExit).filter(
            PackagesDatesOfExit.package_id == body.package_id,
            PackagesDatesOfExit.iweb_client_id == iweb_client_id,
            PackagesDatesOfExit.active == True
        ).first()
        if rel:
            resolved_salida_id = rel.salida_id

    # Verificar si existe la salida y validar disponibilidad de butacas
    s = None
    if resolved_salida_id and resolved_salida_id.strip() not in ("", "undefined", "null", "none", "None"):
        s = db.query(Salidas).filter(
            func.lower(Salidas.id) == resolved_salida_id.strip().lower(),
            func.lower(Salidas.iweb_client_id) == iweb_client_id.strip().lower()
        ).first()

    if s:
        # Validar disponibilidad de butacas en la salida seleccionada
        all_res_salida = db.query(Reservas).filter(
            func.lower(Reservas.iweb_client_id) == iweb_client_id.strip().lower(),
            func.lower(Reservas.salida_id) == s.id.strip().lower(),
            (Reservas.active == True) | (Reservas.active.is_(None))
        ).all()
        res_ids_salida = [r.id for r in all_res_salida]
        
        semicama_occupied = 0
        cama_occupied = 0
        if res_ids_salida:
            rps_salida = db.query(ReservationPassengers).filter(
                ReservationPassengers.reserva_id.in_(res_ids_salida)
            ).all()
            for rp in rps_salida:
                b_type = (rp.butaca_type or "").strip().lower()
                if b_type == "cama":
                    cama_occupied += 1
                else:
                    semicama_occupied += 1
                    
        total_s_semicama = s.semicama or 0
        total_s_cama = s.cama or 0
        avail_semicama = max(0, total_s_semicama - semicama_occupied)
        avail_cama = max(0, total_s_cama - cama_occupied)
        
        req_cama = 0
        req_semicama = 0
        if body.passengers:
            for p in body.passengers:
                b_type = (p.butaca_type or "").strip().lower()
                if b_type == "cama":
                    req_cama += 1
                else:
                    req_semicama += 1
        elif body.butaca_type:
            if (body.butaca_type or "").strip().lower() == "cama":
                req_cama += 1
            else:
                req_semicama += 1
                
        if req_cama > avail_cama:
            raise HTTPException(
                status_code=400,
                detail=f"No hay suficiente disponibilidad de butacas CAMA en la salida. Requeridos: {req_cama}, Disponibles: {avail_cama}"
            )
        if req_semicama > avail_semicama:
            raise HTTPException(
                status_code=400,
                detail=f"No hay suficiente disponibilidad de butacas SEMICAMA en la salida. Requeridos: {req_semicama}, Disponibles: {avail_semicama}"
            )
        
    # Generar de forma automática el código de reserva en el formato: {sigla_destino}#{numero_orden}
    dest_sigla = "XXX"
    if s and s.destino:
        dest_obj = db.query(Destinos).filter(
            Destinos.id == s.destino,
            Destinos.iweb_client_id == iweb_client_id
        ).first()
        if dest_obj and dest_obj.sigla:
            dest_sigla = dest_obj.sigla
            
    query_count = db.query(Reservas).filter(Reservas.iweb_client_id == iweb_client_id)
    if resolved_salida_id:
        query_count = query_count.filter(Reservas.salida_id == resolved_salida_id)
    res_count = query_count.count()
    
    generated_code = f"{dest_sigla.upper()}#{str(res_count + 1).zfill(2)}"
        
    comm_val = body.commission
    if comm_val is None and body.client_id:
        cli_obj = db.query(Clients).filter(Clients.id == body.client_id).first()
        if cli_obj and cli_obj.commission is not None:
            comm_val = float(cli_obj.commission)

    res_id = str(uuid.uuid4())
    new_res = Reservas(
        id=res_id,
        iweb_client_id=iweb_client_id,
        salida_id=resolved_salida_id,
        package_id=body.package_id,
        codigo_reserva=generated_code,
        client_id=body.client_id,
        lugar_carga_id=body.lugar_carga_id,
        hotel_id=body.hotel_id,
        regimen_id=body.regimen_id,
        rooming_id=body.rooming_id,
        room_type=body.room_type,
        active=True,
        venciment=body.venciment,
        observations=body.observations,
        commission=comm_val,
        liberados=body.liberados or 0,
        type=body.type or "tradicional",
        titulo=body.titulo,
        created_at=datetime.utcnow(),
    )
    db.add(new_res)
    
    # Procesar pasajeros de la intermedia
    rp_to_create = []
    
    if body.passengers:
        for p_in in body.passengers:
            # Verificar si existe el pasajero
            p_chk = db.query(Passengers).filter(
                Passengers.id == p_in.pasajero_id,
                Passengers.iweb_client_id == iweb_client_id
            ).first()
            if not p_chk:
                raise HTTPException(status_code=404, detail=f"Pasajero {p_in.pasajero_id} no encontrado")
                
            new_rp = ReservationPassengers(
                id=str(uuid.uuid4()),
                reserva_id=res_id,
                pasajero_id=p_in.pasajero_id,
                pasajero_type=p_in.pasajero_type or "ADL",
                butaca_number=p_in.butaca_number,
                butaca_type=p_in.butaca_type,
                bus_number=p_in.bus_number,
                lugar_carga_id=p_in.lugar_carga_id or body.lugar_carga_id,
                room_index=p_in.room_index if p_in.room_index is not None else 0
            )
            db.add(new_rp)
            rp_to_create.append(new_rp)
    elif body.passenger_id:
        # Fallback para retrocompatibilidad
        p_chk = db.query(Passengers).filter(
            Passengers.id == body.passenger_id,
            Passengers.iweb_client_id == iweb_client_id
        ).first()
        if not p_chk:
            raise HTTPException(status_code=404, detail="Pasajero no encontrado")
            
        b_num = None
        if body.butaca:
            try:
                b_num = int(body.butaca)
            except ValueError:
                pass
                
        new_rp = ReservationPassengers(
            id=str(uuid.uuid4()),
            reserva_id=res_id,
            pasajero_id=body.passenger_id,
            pasajero_type=body.edad_categoria or "ADL",
            butaca_number=b_num,
            butaca_type=body.tipo_butaca
        )
        db.add(new_rp)
        rp_to_create.append(new_rp)
    # Si no vienen pasajeros (ej. reserva tipo bloqueo/grupo), permitimos crear la reserva sin arrojar error 400
        
    db.commit()
    db.refresh(new_res)

    # Auto-crear y sincronizar Liquidacion inicial con gastos no comisionables para la nueva reserva
    try:
        from routers.liquidaciones import create_or_update_booking_liquidacion
        create_or_update_booking_liquidacion(db, new_res.id, iweb_client_id)
    except Exception as err:
        print(f"Warning: could not auto-create liquidacion for new res {new_res.id}: {err}")
    
    # Recuperar datos completos para la respuesta
    passengers_details = []
    for rp in rp_to_create:
        p_chk = db.query(Passengers).filter(
            Passengers.id == rp.pasajero_id,
            Passengers.iweb_client_id == iweb_client_id
        ).first()
        
        p_name = p_chk.name if p_chk else ""
        p_last = p_chk.last_name if p_chk else ""
        nombre_completo_pax = f"{p_name} {p_last}".strip() or "Desconocido"
        
        passengers_details.append(
            ReservationPassengerDetail(
                id=rp.id,
                reserva_id=rp.reserva_id,
                pasajero_id=rp.pasajero_id,
                pasajero_type=rp.pasajero_type,
                butaca_number=rp.butaca_number,
                butaca_type=rp.butaca_type,
                bus_number=rp.bus_number,
                room_index=getattr(rp, 'room_index', 0) or 0,
                nombre_completo=nombre_completo_pax,
                name=p_chk.name if p_chk else None,
                last_name=p_chk.last_name if p_chk else None,
                dni=p_chk.dni if p_chk else None,
                fecha_nacimiento=str(p_chk.date_of_birth) if (p_chk and p_chk.date_of_birth) else None,
                sex=p_chk.sex if p_chk else None,
                telefono=str(p_chk.phone) if (p_chk and p_chk.phone) else ""
            )
        )
        
    comp_passenger_id = None
    comp_nombre_completo = "Desconocido"
    comp_telefono = ""
    comp_dni = None
    comp_fecha_nacimiento = None
    comp_edad_categoria = "ADL"
    comp_butaca = None
    comp_tipo_butaca = None
    
    if passengers_details:
        first_pax = passengers_details[0]
        comp_passenger_id = first_pax.pasajero_id
        comp_nombre_completo = first_pax.nombre_completo
        comp_telefono = first_pax.telefono
        comp_dni = first_pax.dni
        comp_fecha_nacimiento = first_pax.fecha_nacimiento
        comp_edad_categoria = first_pax.pasajero_type
        comp_butaca = str(first_pax.butaca_number) if first_pax.butaca_number is not None else None
        comp_tipo_butaca = first_pax.butaca_type

    lc_name = ""
    lc_dir = ""
    if new_res.lugar_carga_id:
        lc = db.query(LugaresCarga).filter(LugaresCarga.id == new_res.lugar_carga_id).first()
        if lc:
            lc_name = lc.name
            lc_dir = lc.address or ""
            
    h_name = ""
    if new_res.hotel_id:
        h = db.query(Hotels).filter(Hotels.id == new_res.hotel_id).first()
        if h:
            h_name = h.name
            
    r_name = ""
    if new_res.regimen_id:
        rg = db.query(Regimenes).filter(Regimenes.id == new_res.regimen_id).first()
        if rg:
            r_name = rg.name
            
    cl_nombre = ""
    if new_res.client_id:
        cl = db.query(Clients).filter(Clients.id == new_res.client_id).first()
        if cl:
            cl_nombre = cl.complete_name or cl.name_system or ""
            
    return ReservaDetailedResponse(
        id=new_res.id,
        iweb_client_id=new_res.iweb_client_id,
        salida_id=new_res.salida_id,
        package_id=new_res.package_id,
        codigo_reserva=new_res.codigo_reserva,
        client_id=new_res.client_id,
        client_nombre=cl_nombre,
        lugar_carga_id=new_res.lugar_carga_id,
        lugar_carga_nombre=lc_name,
        lugar_carga_direccion=lc_dir,
        hotel_id=new_res.hotel_id,
        hotel_nombre=h_name,
        regimen_id=new_res.regimen_id,
        regimen_nombre=r_name,
        rooming_id=new_res.rooming_id,
        room_type=new_res.room_type,
        active=True,
        venciment=new_res.venciment,
        observations=new_res.observations,
        passenger_id=comp_passenger_id,
        nombre_completo=comp_nombre_completo,
        telefono=comp_telefono,
        dni=comp_dni,
        fecha_nacimiento=comp_fecha_nacimiento,
        edad_categoria=comp_edad_categoria,
        butaca=comp_butaca,
        tipo_butaca=comp_tipo_butaca,
        reservation_passengers=passengers_details
    )


@router.put("/update_reserva/{id}", response_model=ReservaDetailedResponse)
async def update_reserva(
    id: str,
    body: ReservaUpdatePayload,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    r = db.query(Reservas).filter(
        Reservas.id == id,
        Reservas.iweb_client_id == iweb_client_id
    ).first()
    
    if not r:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
    if body.codigo_reserva is not None:
        r.codigo_reserva = body.codigo_reserva
    if body.client_id is not None:
        r.client_id = body.client_id
    if body.lugar_carga_id is not None:
        r.lugar_carga_id = body.lugar_carga_id
    if body.hotel_id is not None:
        r.hotel_id = body.hotel_id
    if body.regimen_id is not None:
        r.regimen_id = body.regimen_id
    if body.rooming_id is not None:
        r.rooming_id = body.rooming_id
    if body.room_type is not None:
        r.room_type = body.room_type
    if body.active is not None:
        r.active = body.active
    if body.venciment is not None:
        r.venciment = body.venciment
    if body.observations is not None:
        r.observations = body.observations
    if body.commission is not None:
        r.commission = body.commission
    if body.liberados is not None:
        r.liberados = body.liberados
    if body.type is not None:
        r.type = body.type
    if body.titulo is not None:
        r.titulo = body.titulo
        
    # Si viene passengers, actualizamos la intermedia
    if body.passengers is not None:
        # Borrar antiguos
        db.query(ReservationPassengers).filter(ReservationPassengers.reserva_id == id).delete()
        # Agregar nuevos
        for p_in in body.passengers:
            new_rp = ReservationPassengers(
                id=str(uuid.uuid4()),
                reserva_id=id,
                pasajero_id=p_in.pasajero_id,
                pasajero_type=p_in.pasajero_type or "ADL",
                butaca_number=p_in.butaca_number,
                butaca_type=p_in.butaca_type,
                bus_number=p_in.bus_number,
                lugar_carga_id=p_in.lugar_carga_id or body.lugar_carga_id,
                room_index=p_in.room_index if p_in.room_index is not None else 0
            )
            db.add(new_rp)
            
    db.commit()
    db.refresh(r)

    # Auto-actualizar Liquidacion para la reserva modificada
    try:
        from routers.liquidaciones import create_or_update_booking_liquidacion
        create_or_update_booking_liquidacion(db, r.id, iweb_client_id)
    except Exception as err:
        print(f"Warning: could not auto-update liquidacion for updated res {r.id}: {err}")
    
    # Recuperar datos completos para la respuesta
    rp_list = db.query(ReservationPassengers).filter(
        ReservationPassengers.reserva_id == id
    ).all()
    
    passengers_details = []
    for rp in rp_list:
        p = db.query(Passengers).filter(
            Passengers.id == rp.pasajero_id,
            Passengers.iweb_client_id == iweb_client_id
        ).first()
        
        p_name = p.name if p else ""
        p_last = p.last_name if p else ""
        nombre_completo_pax = f"{p_name} {p_last}".strip() or "Desconocido"

        # Resolver lugar_carga por pasajero (con fallback a la reserva raíz)
        pax_lc_id = rp.lugar_carga_id or r.lugar_carga_id
        pax_lc_nombre = ""
        if pax_lc_id:
            pax_lc = db.query(LugaresCarga).filter(LugaresCarga.id == pax_lc_id).first()
            if pax_lc:
                pax_lc_nombre = pax_lc.name or ""

        passengers_details.append(
            ReservationPassengerDetail(
                id=rp.id,
                reserva_id=rp.reserva_id,
                pasajero_id=rp.pasajero_id,
                pasajero_type=rp.pasajero_type,
                butaca_number=rp.butaca_number,
                butaca_type=rp.butaca_type,
                bus_number=rp.bus_number,
                lugar_carga_id=pax_lc_id,
                lugar_carga_nombre=pax_lc_nombre,
                room_index=getattr(rp, 'room_index', 0) or 0,
                nombre_completo=nombre_completo_pax,
                name=p.name if p else None,
                last_name=p.last_name if p else None,
                dni=p.dni if p else None,
                fecha_nacimiento=str(p.date_of_birth) if (p and p.date_of_birth) else None,
                sex=p.sex if p else None,
                telefono=str(p.phone) if (p and p.phone) else ""
            )
        )
        

        
    comp_passenger_id = None
    comp_nombre_completo = "Desconocido"
    comp_telefono = ""
    comp_dni = None
    comp_fecha_nacimiento = None
    comp_edad_categoria = "ADL"
    comp_butaca = None
    comp_tipo_butaca = None
    
    if passengers_details:
        first_pax = passengers_details[0]
        comp_passenger_id = first_pax.pasajero_id
        comp_nombre_completo = first_pax.nombre_completo
        comp_telefono = first_pax.telefono
        comp_dni = first_pax.dni
        comp_fecha_nacimiento = first_pax.fecha_nacimiento
        comp_edad_categoria = first_pax.pasajero_type
        comp_butaca = str(first_pax.butaca_number) if first_pax.butaca_number is not None else None
        comp_tipo_butaca = first_pax.butaca_type

    lc_name = ""
    lc_dir = ""
    if r.lugar_carga_id:
        lc = db.query(LugaresCarga).filter(LugaresCarga.id == r.lugar_carga_id).first()
        if lc:
            lc_name = lc.name
            lc_dir = lc.address or ""
            
    h_name = ""
    if r.hotel_id:
        h = db.query(Hotels).filter(Hotels.id == r.hotel_id).first()
        if h:
            h_name = h.name
            
    r_name = ""
    if r.regimen_id:
        rg = db.query(Regimenes).filter(Regimenes.id == r.regimen_id).first()
        if rg:
            r_name = rg.name
            
    cl_nombre = ""
    if r.client_id:
        cl = db.query(Clients).filter(Clients.id == r.client_id).first()
        if cl:
            cl_nombre = cl.complete_name or cl.name_system or ""

    # Buscar datos de salida (destino y fecha)
    salida_dest_name = ""
    salida_date = ""
    if r.salida_id:
        sal = db.query(Salidas).filter(
            Salidas.id == r.salida_id,
            Salidas.iweb_client_id == iweb_client_id
        ).first()
        if sal:
            salida_date = str(sal.date_of_out).split(" ")[0] if sal.date_of_out else ""
            if sal.destino:
                d_obj = db.query(Destinos).filter(
                    Destinos.id == sal.destino,
                    Destinos.iweb_client_id == iweb_client_id
                ).first()
                if d_obj:
                    salida_dest_name = d_obj.name or ""
            
    return ReservaDetailedResponse(
        id=r.id,
        iweb_client_id=r.iweb_client_id,
        salida_id=r.salida_id,
        package_id=r.package_id,
        codigo_reserva=r.codigo_reserva,
        client_id=r.client_id,
        client_nombre=cl_nombre,
        lugar_carga_id=r.lugar_carga_id,
        lugar_carga_nombre=lc_name,
        lugar_carga_direccion=lc_dir,
        hotel_id=r.hotel_id,
        hotel_nombre=h_name,
        regimen_id=r.regimen_id,
        regimen_nombre=r_name,
        rooming_id=r.rooming_id,
        room_type=r.room_type,
        active=bool(r.active if r.active is not None else True),
        venciment=r.venciment,
        observations=r.observations,
        passenger_id=comp_passenger_id,
        nombre_completo=comp_nombre_completo,
        telefono=comp_telefono,
        dni=comp_dni,
        fecha_nacimiento=comp_fecha_nacimiento,
        edad_categoria=comp_edad_categoria,
        butaca=comp_butaca,
        tipo_butaca=comp_tipo_butaca,
        reservation_passengers=passengers_details,
        destino=salida_dest_name,
        fecha=salida_date
    )
    response.append(res_detail)

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


@router.get("/get_reserva/{id}", response_model=ReservaDetailedResponse)
async def get_reserva(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    clean_id = id.strip().lower()
    norm_client = iweb_client_id.strip().lower()
    r = db.query(Reservas).filter(
        (func.lower(Reservas.id) == clean_id) | (func.lower(Reservas.codigo_reserva) == clean_id),
        func.lower(Reservas.iweb_client_id) == norm_client
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    # Recuperar datos de la intermedia en batch
    rp_list = db.query(ReservationPassengers).filter(
        ReservationPassengers.reserva_id == r.id
    ).order_by(ReservationPassengers.room_index.asc()).all()
    
    pax_ids = list({rp.pasajero_id for rp in rp_list if rp.pasajero_id})
    lc_pax_ids = list({rp.lugar_carga_id for rp in rp_list if rp.lugar_carga_id})
    if r.lugar_carga_id:
        lc_pax_ids.append(r.lugar_carga_id)
    
    passengers_map = {}
    if pax_ids:
        paxs = db.query(Passengers).filter(
            Passengers.id.in_(pax_ids),
            func.lower(Passengers.iweb_client_id) == norm_client
        ).all()
        passengers_map = {p.id: p for p in paxs}
        
    lc_map = {}
    if lc_pax_ids:
        lcs = db.query(LugaresCarga).filter(LugaresCarga.id.in_(lc_pax_ids)).all()
        lc_map = {lc.id: lc for lc in lcs}

    passengers_details = []
    for rp in rp_list:
        p = passengers_map.get(rp.pasajero_id)
        
        p_name = p.name if p else ""
        p_last = p.last_name if p else ""
        nombre_completo_pax = f"{p_name} {p_last}".strip() or "Desconocido"
        
        # Resolver lugar_carga por pasajero (con fallback a la reserva raíz)
        pax_lc_id = rp.lugar_carga_id or r.lugar_carga_id
        pax_lc = lc_map.get(pax_lc_id) if pax_lc_id else None
        pax_lc_nombre = pax_lc.name if pax_lc else ""

        passengers_details.append(
            ReservationPassengerDetail(
                id=rp.id,
                reserva_id=rp.reserva_id,
                pasajero_id=rp.pasajero_id,
                pasajero_type=rp.pasajero_type,
                butaca_number=rp.butaca_number,
                butaca_type=rp.butaca_type,
                bus_number=rp.bus_number if hasattr(rp, 'bus_number') else None,
                lugar_carga_id=pax_lc_id,
                lugar_carga_nombre=pax_lc_nombre,
                room_index=getattr(rp, 'room_index', 0) or 0,
                nombre_completo=nombre_completo_pax,
                name=p.name if p else None,
                last_name=p.last_name if p else None,
                dni=p.dni if p else None,
                fecha_nacimiento=str(p.date_of_birth) if (p and p.date_of_birth) else None,
                sex=p.sex if p else None,
                telefono=str(p.phone) if (p and p.phone) else ""
            )
        )
        
    comp_passenger_id = None
    comp_nombre_completo = "Desconocido"
    comp_telefono = ""
    comp_dni = None
    comp_fecha_nacimiento = None
    comp_edad_categoria = "ADL"
    comp_butaca = None
    comp_tipo_butaca = None
    
    if passengers_details:
        first_pax = passengers_details[0]
        comp_passenger_id = first_pax.pasajero_id
        comp_nombre_completo = first_pax.nombre_completo
        comp_telefono = first_pax.telefono
        comp_dni = first_pax.dni
        comp_fecha_nacimiento = first_pax.fecha_nacimiento
        comp_edad_categoria = first_pax.pasajero_type
        comp_butaca = str(first_pax.butaca_number) if first_pax.butaca_number is not None else None
        comp_tipo_butaca = first_pax.butaca_type

    lc_name = ""
    lc_dir = ""
    if r.lugar_carga_id:
        lc = db.query(LugaresCarga).filter(LugaresCarga.id == r.lugar_carga_id).first()
        if lc:
            lc_name = lc.name
            lc_dir = lc.address or ""
            
    h_name = ""
    if r.hotel_id:
        h = db.query(Hotels).filter(Hotels.id == r.hotel_id).first()
        if h:
            h_name = h.name
            
    r_name = ""
    if r.regimen_id:
        rg = db.query(Regimenes).filter(Regimenes.id == r.regimen_id).first()
        if rg:
            r_name = rg.name
            
    cl_nombre = ""
    if r.client_id:
        cl = db.query(Clients).filter(Clients.id == r.client_id).first()
        if cl:
            cl_nombre = cl.complete_name or cl.name_system or ""
            
    # Buscar datos de salida (destino y fecha)
    salida_dest_name = ""
    salida_date = ""
    if r.salida_id:
        sal = db.query(Salidas).filter(
            Salidas.id == r.salida_id,
            Salidas.iweb_client_id == iweb_client_id
        ).first()
        if sal:
            salida_date = str(sal.date_of_out).split(" ")[0] if sal.date_of_out else ""
            if sal.destino:
                d_obj = db.query(Destinos).filter(
                    Destinos.id == sal.destino,
                    Destinos.iweb_client_id == iweb_client_id
                ).first()
                if d_obj:
                    salida_dest_name = d_obj.name or ""

    return ReservaDetailedResponse(
        id=r.id,
        iweb_client_id=r.iweb_client_id,
        salida_id=r.salida_id,
        package_id=r.package_id,
        codigo_reserva=r.codigo_reserva,
        client_id=r.client_id,
        client_nombre=cl_nombre,
        lugar_carga_id=r.lugar_carga_id,
        lugar_carga_nombre=lc_name,
        lugar_carga_direccion=lc_dir,
        hotel_id=r.hotel_id,
        hotel_nombre=h_name,
        regimen_id=r.regimen_id,
        regimen_nombre=r_name,
        rooming_id=r.rooming_id,
        room_type=r.room_type,
        active=bool(r.active if r.active is not None else True),
        venciment=r.venciment,
        observations=r.observations,
        passenger_id=comp_passenger_id,
        nombre_completo=comp_nombre_completo,
        telefono=comp_telefono,
        dni=comp_dni,
        fecha_nacimiento=comp_fecha_nacimiento,
        edad_categoria=comp_edad_categoria,
        butaca=comp_butaca,
        tipo_butaca=comp_tipo_butaca,
        reservation_passengers=passengers_details,
        destino=salida_dest_name,
        fecha=salida_date
    )


@router.delete("/delete_reserva/{id}")
async def delete_reserva(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    r = db.query(Reservas).filter(
        Reservas.id == id,
        func.lower(Reservas.iweb_client_id) == func.lower(iweb_client_id.strip())
    ).first()
    
    if not r:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    res_id = r.id

    # 1. Obtener pasajeros asociados a la reserva
    rps = db.query(ReservationPassengers).filter(ReservationPassengers.reserva_id == res_id).all()
    pax_ids = list({rp.pasajero_id for rp in rps if rp.pasajero_id})

    # 2. Eliminar de reservation_passengers
    db.query(ReservationPassengers).filter(ReservationPassengers.reserva_id == res_id).delete(synchronize_session=False)

    # 3. Eliminar los pasajeros de `passengers` que ya no estén vinculados a ninguna otra reserva
    if pax_ids:
        for p_id in pax_ids:
            other_rps_count = db.query(ReservationPassengers).filter(
                ReservationPassengers.pasajero_id == p_id
            ).count()
            if other_rps_count == 0:
                db.query(Passengers).filter(Passengers.id == p_id).delete(synchronize_session=False)

    # 4. Eliminar liquidaciones y sus gastos no comisionables
    liqs = db.query(Liquidaciones).filter(Liquidaciones.booking_id == res_id).all()
    if liqs:
        liq_ids = [l.id for l in liqs]
        db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id.in_(liq_ids)).delete(synchronize_session=False)
        db.query(Liquidaciones).filter(Liquidaciones.booking_id == res_id).delete(synchronize_session=False)

    # 5. Eliminar pagos
    db.query(Pagos).filter(Pagos.reserva_id == res_id).delete(synchronize_session=False)

    # 6. Eliminar vouchers
    db.query(Vouchers).filter(Vouchers.reserva_id == res_id).delete(synchronize_session=False)

    # 7. Eliminar cuentas corrientes clientes
    db.query(cuentasCorrientsClients).filter(cuentasCorrientsClients.booking_id == res_id).delete(synchronize_session=False)

    # 8. Eliminar la reserva principal
    db.delete(r)
    db.commit()

    return {"message": "Reserva y toda su información vinculada fueron eliminadas con éxito"}


@router.post("/duplicate_reserva/{id}", response_model=ReservaDetailedResponse)
async def duplicate_reserva(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    original = db.query(Reservas).filter(
        Reservas.id == id,
        Reservas.iweb_client_id == iweb_client_id
    ).first()
    
    if not original:
        raise HTTPException(status_code=404, detail="Reserva original no encontrada")
        
    # Generate new reservation code
    dest_sigla = "RES"
    if original.salida_id:
        sal = db.query(Salidas).filter(Salidas.id == original.salida_id).first()
        if sal and sal.destino:
            d_obj = db.query(Destinos).filter(Destinos.id == sal.destino).first()
            if d_obj and d_obj.sigla:
                dest_sigla = d_obj.sigla
                
    count = db.query(Reservas).filter(
        Reservas.salida_id == original.salida_id,
        Reservas.iweb_client_id == iweb_client_id
    ).count() if original.salida_id else 0
    
    new_codigo = f"{dest_sigla}#{count + 1:02d}"
    new_reserva_id = str(uuid.uuid4())
    
    new_reserva = Reservas(
        id=new_reserva_id,
        iweb_client_id=iweb_client_id,
        salida_id=original.salida_id,
        package_id=original.package_id,
        codigo_reserva=new_codigo,
        client_id=original.client_id,
        lugar_carga_id=original.lugar_carga_id,
        hotel_id=original.hotel_id,
        regimen_id=original.regimen_id,
        rooming_id=original.rooming_id,
        room_type=original.room_type,
        active=True,
        venciment=original.venciment,
        observations=original.observations
    )
    db.add(new_reserva)
    
    # Duplicate passengers
    orig_passengers = db.query(ReservationPassengers).filter(ReservationPassengers.reserva_id == id).all()
    for op in orig_passengers:
        new_rp = ReservationPassengers(
            id=str(uuid.uuid4()),
            reserva_id=new_reserva_id,
            pasajero_id=op.pasajero_id,
            pasajero_type=op.pasajero_type,
            butaca_number=op.butaca_number,
            butaca_type=op.butaca_type,
            bus_number=op.bus_number,
            lugar_carga_id=op.lugar_carga_id
        )
        db.add(new_rp)
        
    db.commit()
    
    # Auto-crear y sincronizar Liquidacion inicial para la reserva duplicada
    try:
        from routers.liquidaciones import create_or_update_booking_liquidacion
        create_or_update_booking_liquidacion(db, new_reserva_id, iweb_client_id)
    except Exception as err:
        print(f"Warning: could not auto-create liquidacion for duplicated res {new_reserva_id}: {err}")

    return await get_reserva(new_reserva_id, iweb_client_id, db)


class ReservationPassengerUpdateInput(BaseModel):
    bus_number: Optional[str] = None
    butaca_number: Optional[int] = None
    butaca_type: Optional[str] = None
    lugar_carga_id: Optional[str] = None
    room_index: Optional[int] = None


@router.patch("/update_reservation_passenger/{rp_id}")
async def update_reservation_passenger(
    rp_id: str,
    body: ReservationPassengerUpdateInput,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    norm_client = iweb_client_id.strip().lower()
    rp = db.query(ReservationPassengers).filter(ReservationPassengers.id == rp_id).first()
    if not rp:
        # Check if rp_id is actually a Reservas ID
        res_obj = db.query(Reservas).filter(
            Reservas.id == rp_id,
            func.lower(Reservas.iweb_client_id) == norm_client
        ).first()
        if res_obj:
            if body.bus_number is not None:
                pass
            if body.lugar_carga_id is not None:
                res_obj.lugar_carga_id = body.lugar_carga_id
            db.commit()
            return {"message": "Reserva actualizada con éxito"}
        raise HTTPException(status_code=404, detail="Pasajero de reserva no encontrado")
        
    res_obj = db.query(Reservas).filter(
        Reservas.id == rp.reserva_id,
        func.lower(Reservas.iweb_client_id) == norm_client
    ).first()
    if not res_obj:
        raise HTTPException(status_code=403, detail="No tiene permisos para modificar este pasajero")
    
    if body.bus_number is not None:
        rp.bus_number = body.bus_number
    if body.butaca_number is not None:
        rp.butaca_number = body.butaca_number
    if body.butaca_type is not None:
        rp.butaca_type = body.butaca_type
    if body.lugar_carga_id is not None:
        rp.lugar_carga_id = body.lugar_carga_id
        if not res_obj.lugar_carga_id:
            res_obj.lugar_carga_id = body.lugar_carga_id
    if body.room_index is not None:
        rp.room_index = body.room_index
        
    db.commit()
    db.refresh(rp)
    return {"message": "Pasajero de reserva actualizado con éxito", "bus_number": rp.bus_number, "lugar_carga_id": rp.lugar_carga_id}
