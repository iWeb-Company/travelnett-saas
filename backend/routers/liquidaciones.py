import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from db.database import get_db
from models.models import Liquidaciones, GastosNoCommission, Reservas, Packages, PackageHotels, Clients, ReservationPassengers
from schemas.schemas import (
    LiquidacionCreateRequest,
    LiquidacionResponse,
    GastoNoCommissionCreate,
    GastoNoCommissionResponse
)

router = APIRouter(prefix="/liquidaciones", tags=["Liquidaciones"])


def calculate_booking_liquidacion_totals(db: Session, booking_id: str):
    clean_b_id = booking_id.strip().lower()
    res_obj = db.query(Reservas).filter(
        (func.lower(Reservas.id) == clean_b_id) | (func.lower(Reservas.codigo_reserva) == clean_b_id)
    ).first()
    if not res_obj:
        return None

    # Pasajeros de la reserva
    rps = db.query(ReservationPassengers).filter(ReservationPassengers.reserva_id == res_obj.id).all()

    # Paquete si existe
    pkg = None
    if res_obj.package_id:
        pkg = db.query(Packages).filter(Packages.id == res_obj.package_id).first()

    pkg_price = float(pkg.price or 0) if pkg else 0.0
    pkg_gastos = float(pkg.gastos or 0) if pkg else 0.0
    pkg_adicional = float(pkg.adicional or 0) if pkg else 0.0
    is_comisionable = bool(pkg.comisionable) if pkg else False

    rooms_list = []
    if res_obj.room_type:
        import json
        try:
            rooms_list = json.loads(res_obj.room_type) if isinstance(res_obj.room_type, str) and res_obj.room_type.startswith("[") else ([res_obj.room_type] if isinstance(res_obj.room_type, str) else res_obj.room_type)
        except Exception:
            rooms_list = [str(res_obj.room_type)]

    # 1. Total Base Comisionable de Paquete según pricing_type y tipo de habitación
    pax_total = 0.0
    single_no_comisionable = 0.0   # monto 50% no comisionable por comisionable_single
    if pkg and res_obj.room_type:
        # Resolver el PackageHotel que corresponde al hotel de la reserva
        matching_ph = None
        if res_obj.hotel_id:
            matching_ph = db.query(PackageHotels).filter(
                PackageHotels.package_id == pkg.id,
                PackageHotels.hotel_id == res_obj.hotel_id
            ).first()
        if not matching_ph:
            matching_ph = db.query(PackageHotels).filter(
                PackageHotels.package_id == pkg.id
            ).first()

        pricing_type = matching_ph.pricing_type if matching_ph else "persona"
        is_por_habitacion = "habitacion" in (pricing_type or "").lower()
        comisionable_single = bool(matching_ph.comisionable_single) if matching_ph else False

        if isinstance(rooms_list, list) and len(rooms_list) > 0:
            for room_idx, rm_str in enumerate(rooms_list):
                rm_lower = str(rm_str).lower()
                capacity = 1
                tariff = pkg_price
                is_single_room = False

                if rm_lower.startswith("dbl") or "doble" in rm_lower:
                    capacity = 2
                    tariff = float(matching_ph.tarifa_doble) if (matching_ph and matching_ph.tarifa_doble is not None) else pkg_price
                elif rm_lower.startswith("tpl") or "triple" in rm_lower:
                    capacity = 3
                    tariff = float(matching_ph.tarifa_triple) if (matching_ph and matching_ph.tarifa_triple is not None) else pkg_price
                elif rm_lower.startswith("cpl") or "cuadruple" in rm_lower:
                    capacity = 4
                    tariff = float(matching_ph.tarifa_cuadruple) if (matching_ph and matching_ph.tarifa_cuadruple is not None) else pkg_price
                elif rm_lower.startswith("qtl") or rm_lower.startswith("dep") or "quintuple" in rm_lower or "depto" in rm_lower:
                    capacity = 5
                    tariff = float(matching_ph.tarifa_quintuple) if (matching_ph and matching_ph.tarifa_quintuple is not None) else pkg_price
                elif rm_lower.startswith("sgl") or "single" in rm_lower or "individual" in rm_lower:
                    capacity = 1
                    tariff = float(matching_ph.tarifa_single) if (matching_ph and matching_ph.tarifa_single is not None) else pkg_price
                    is_single_room = True

                if is_por_habitacion:
                    room_subtotal = tariff
                else:
                    room_paxs = [r for r in rps if (r.room_index if r.room_index is not None else 0) == room_idx]
                    if not room_paxs and len(rps) > 0:
                        start_i = sum(2 if ("doble" in str(rooms_list[k]).lower() or str(rooms_list[k]).lower().startswith("dbl")) else (3 if "triple" in str(rooms_list[k]).lower() else (4 if "cuadruple" in str(rooms_list[k]).lower() else (5 if ("quintuple" in str(rooms_list[k]).lower() or "depto" in str(rooms_list[k]).lower()) else 1))) for k in range(room_idx))
                        room_paxs = rps[start_i : start_i + capacity]

                    room_subtotal = 0.0
                    for slot_i in range(capacity):
                        pax = room_paxs[slot_i] if slot_i < len(room_paxs) else None
                        ptype = (pax.pasajero_type if pax and pax.pasajero_type else "ADL").upper()

                        if ptype == "CHD":
                            if matching_ph and matching_ph.tarifa_menores is not None and float(matching_ph.tarifa_menores) > 0:
                                room_subtotal += float(matching_ph.tarifa_menores)
                            else:
                                room_subtotal += tariff * 0.8  # Fallback 20% desc si no hay tarifa_menores explícita
                        elif ptype == "INF":
                            room_subtotal += 0.0  # Infantes no pagan tarifa de habitación
                        else:
                            room_subtotal += tariff

                pax_total += room_subtotal

                # Si comisionable_single=True y es habitación single,
                # el 50% de esa tarifa no es comisionable
                if is_single_room and comisionable_single:
                    single_no_comisionable += room_subtotal * 0.5

    if pax_total == 0.0:
        if rps:
            for rp in rps:
                ptype = (rp.pasajero_type or "ADL").upper()
                if ptype == "ADL":
                    pax_total += pkg_price * 1.0
                elif ptype == "CHD":
                    pax_total += pkg_price * 0.8  # 20% de descuento
                elif ptype == "INF":
                    pax_total += 0.0  # Infante no paga
        else:
            pax_total = pkg_price

    # 2. Conteo de pasajeros para gastos y adicional cama
    total_room_capacity = 0
    if rooms_list and isinstance(rooms_list, list):
        for rm in rooms_list:
            rm_lower = str(rm).lower()
            if rm_lower.startswith("dbl") or "doble" in rm_lower:
                total_room_capacity += 2
            elif rm_lower.startswith("tpl") or "triple" in rm_lower:
                total_room_capacity += 3
            elif rm_lower.startswith("cpl") or "cuadruple" in rm_lower:
                total_room_capacity += 4
            elif rm_lower.startswith("qtl") or rm_lower.startswith("dep") or "quintuple" in rm_lower or "depto" in rm_lower:
                total_room_capacity += 5
            elif rm_lower.startswith("sgl") or "single" in rm_lower or "individual" in rm_lower:
                total_room_capacity += 1
            else:
                total_room_capacity += 2

    real_pax_count = len([r for r in rps if (r.pasajero_type or "ADL").upper() != "INF"]) if rps else 0
    num_pax = real_pax_count if real_pax_count > 0 else (total_room_capacity or 1)
    num_cama = len([r for r in rps if (r.butaca_type or "").lower() == "cama"]) if rps else 0

    total_gastos = pkg_gastos * num_pax
    total_adicional_cama = pkg_adicional * num_cama

    # Base Comisionable: pax_total + (total_adicional_cama si es_comisionable) − parte no comisionable del single
    monto_comisionable = pax_total - single_no_comisionable
    if is_comisionable:
        monto_comisionable += total_adicional_cama

    # 3. Comisión de la reserva. El porcentaje personalizado de la reserva
    # prevalece sobre el valor por defecto del cliente, incluso cuando es 0.
    client_comm_pct = None
    if res_obj.commission is not None:
        client_comm_pct = float(res_obj.commission)
    elif res_obj.client_id:
        client = db.query(Clients).filter(Clients.id == res_obj.client_id).first()
        if client and client.commission is not None:
            client_comm_pct = float(client.commission)

    if client_comm_pct is None:
        client_comm_pct = 0.0

    comm_amount = (monto_comisionable * client_comm_pct) / 100.0

    # 4. Total Bruto (pax_total + total_gastos + total_adicional_cama)
    total_bruto = pax_total + total_gastos + total_adicional_cama

    return {
        "res_obj": res_obj,
        "pkg_price": pkg_price,
        "pax_total": pax_total,
        "pkg_gastos": total_gastos,
        "pkg_adicional": total_adicional_cama,
        "is_comisionable": is_comisionable,
        "monto_comisionable": monto_comisionable,
        "single_no_comisionable": single_no_comisionable,
        "client_comm_pct": client_comm_pct,
        "comm_amount": comm_amount,
        "total_bruto": total_bruto
    }


@router.post("/create_liquidacion", response_model=LiquidacionResponse)
async def create_liquidacion(payload: LiquidacionCreateRequest, db: Session = Depends(get_db)):
    try:
        norm_client = payload.iweb_client_id.strip().lower()
        raw_b_id = payload.booking_id.strip() if payload.booking_id else ""

        # Try matching booking by id first, then by codigo_reserva
        res_obj = db.query(Reservas).filter(
            func.lower(Reservas.iweb_client_id) == norm_client,
            or_(
                func.lower(Reservas.id) == raw_b_id.lower(),
                func.lower(Reservas.codigo_reserva) == raw_b_id.lower()
            )
        ).first() if raw_b_id else None

        resolved_booking_id = res_obj.id if res_obj else raw_b_id

        if not res_obj:
            raise HTTPException(status_code=404, detail=f"No se encontró la reserva con ID o código '{raw_b_id}'")

        existing = db.query(Liquidaciones).filter(
            func.lower(Liquidaciones.booking_id) == resolved_booking_id.lower()
        ).first()

        if existing:
            liquidacion = existing
            liquidacion.total_amout = payload.total_amout
            liquidacion.total_commission = payload.total_commission
            liquidacion.commission = payload.commission
            liq_id = existing.id
            db.flush()
        else:
            liq_id = str(uuid.uuid4())
            liquidacion = Liquidaciones(
                id=liq_id,
                iweb_client_id=payload.iweb_client_id,
                booking_id=resolved_booking_id,
                total_amout=payload.total_amout,
                total_commission=payload.total_commission,
                commission=payload.commission
            )
            db.add(liquidacion)
            db.flush()

        if payload.gastos:
            for g in payload.gastos:
                ex_g = db.query(GastosNoCommission).filter(
                    GastosNoCommission.liquidacion_id == liq_id,
                    GastosNoCommission.name == g.name
                ).first()
                if ex_g:
                    ex_g.amount = g.amount
                else:
                    gasto = GastosNoCommission(
                        id=str(uuid.uuid4()),
                        liquidacion_id=liq_id,
                        name=g.name,
                        amount=g.amount,
                        iweb_client_id=payload.iweb_client_id
                    )
                    db.add(gasto)
        
        db.commit()

        # Execute full itemized breakdown calculation and sync
        synced_liq = create_or_update_booking_liquidacion(db, resolved_booking_id, payload.iweb_client_id)
        if synced_liq:
            liquidacion = synced_liq

        gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == liquidacion.id).all()
        
        return LiquidacionResponse(
            id=liquidacion.id,
            iweb_client_id=liquidacion.iweb_client_id,
            booking_id=liquidacion.booking_id,
            total_amout=liquidacion.total_amout,
            total_commission=liquidacion.total_commission,
            commission=liquidacion.commission,
            gastos=[
                GastoNoCommissionResponse(
                    id=g.id,
                    liquidacion_id=g.liquidacion_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                ) for g in gastos
            ]
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/get_liquidaciones", response_model=list[LiquidacionResponse])
def get_liquidaciones(iweb_client_id: str, db: Session = Depends(get_db)):
    try:
        norm_client = iweb_client_id.strip().lower()
        results = db.query(Liquidaciones).filter(
            func.lower(Liquidaciones.iweb_client_id) == norm_client
        ).all()
        if not results:
            return []
        
        liq_ids = [liq.id for liq in results]
        all_gastos = db.query(GastosNoCommission).filter(
            GastosNoCommission.liquidacion_id.in_(liq_ids)
        ).all()
        
        gastos_by_liq: dict = {}
        for g in all_gastos:
            gastos_by_liq.setdefault(g.liquidacion_id, []).append(g)

        response = []
        for liq in results:
            gastos = gastos_by_liq.get(liq.id, [])
            response.append(
                LiquidacionResponse(
                    id=liq.id,
                    iweb_client_id=liq.iweb_client_id,
                    booking_id=liq.booking_id,
                    total_amout=liq.total_amout,
                    total_commission=liq.total_commission,
                    commission=liq.commission,
                    gastos=[
                        GastoNoCommissionResponse(
                            id=g.id,
                            liquidacion_id=g.liquidacion_id,
                            name=g.name,
                            amount=g.amount,
                            iweb_client_id=g.iweb_client_id
                        ) for g in gastos
                    ]
                )
            )
        return response
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/get_liquidacion/{id}", response_model=LiquidacionResponse)
def get_liquidacion(id: str, db: Session = Depends(get_db)):
    try:
        clean_id = id.strip().lower()
        liq = db.query(Liquidaciones).filter(func.lower(Liquidaciones.id) == clean_id).first()
        if not liq:
            raise HTTPException(status_code=404, detail="Liquidacion not found")
        
        gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == liq.id).all()
        
        return LiquidacionResponse(
            id=liq.id,
            iweb_client_id=liq.iweb_client_id,
            booking_id=liq.booking_id,
            total_amout=liq.total_amout,
            total_commission=liq.total_commission,
            commission=liq.commission,
            gastos=[
                GastoNoCommissionResponse(
                    id=g.id,
                    liquidacion_id=g.liquidacion_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                ) for g in gastos
            ]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


def create_or_update_booking_liquidacion(db: Session, booking_id: str, iweb_client_id: Optional[str] = None):
    clean_b_id = booking_id.strip().lower()
    
    liq = db.query(Liquidaciones).filter(func.lower(Liquidaciones.booking_id) == clean_b_id).first()
    res_obj = db.query(Reservas).filter(
        (func.lower(Reservas.id) == clean_b_id) | (func.lower(Reservas.codigo_reserva) == clean_b_id)
    ).first()

    if not res_obj and not liq:
        return None

    res_id = res_obj.id if res_obj else liq.booking_id
    client_id = iweb_client_id or (res_obj.iweb_client_id if res_obj else (liq.iweb_client_id if liq else ""))

    calc = calculate_booking_liquidacion_totals(db, res_id)
    if not calc:
        return liq

    if not liq:
        liq = Liquidaciones(
            id=str(uuid.uuid4()),
            iweb_client_id=client_id,
            booking_id=res_id,
            total_amout=calc["total_bruto"],
            total_commission=calc.get("monto_comisionable", calc["total_bruto"]),
            commission=calc["comm_amount"]
        )
        db.add(liq)
        db.commit()
        db.refresh(liq)

    # Registrar o sincronizar GastosNoCommission derivados del paquete
    existing_gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == liq.id).all()
    added_gasto = False

    # Gastos de reserva / administrativos del paquete: eliminar duplicados si existieren
    admin_gastos_list = [g for g in existing_gastos if g.name in ["Gastos administrativos", "Gastos de Reserva", "Gastos de reserva"]]
    if len(admin_gastos_list) > 1:
        for extra_g in admin_gastos_list[1:]:
            db.delete(extra_g)
            if extra_g in existing_gastos:
                existing_gastos.remove(extra_g)
        added_gasto = True

    if res_obj and res_obj.package_id:
        admin_gasto = admin_gastos_list[0] if admin_gastos_list else None
        if admin_gasto:
            if admin_gasto.amount != calc["pkg_gastos"]:
                admin_gasto.amount = calc["pkg_gastos"]
                added_gasto = True
        elif calc["pkg_gastos"] > 0:
            g_adm = GastosNoCommission(
                id=str(uuid.uuid4()),
                liquidacion_id=liq.id,
                name="Gastos administrativos",
                amount=calc["pkg_gastos"],
                iweb_client_id=liq.iweb_client_id
            )
            db.add(g_adm)
            added_gasto = True

        # Adicional no comisionable del paquete si no es comisionable
        add_gasto = next((g for g in existing_gastos if g.name == "Adicional cama (no comisionable)"), None)
        if add_gasto:
            if not calc["is_comisionable"] and calc["pkg_adicional"] > 0:
                if add_gasto.amount != calc["pkg_adicional"]:
                    add_gasto.amount = calc["pkg_adicional"]
                    added_gasto = True
            else:
                db.delete(add_gasto)
                added_gasto = True
        elif not calc["is_comisionable"] and calc["pkg_adicional"] > 0:
            g_add = GastosNoCommission(
                id=str(uuid.uuid4()),
                liquidacion_id=liq.id,
                name="Adicional cama (no comisionable)",
                amount=calc["pkg_adicional"],
                iweb_client_id=liq.iweb_client_id
            )
            db.add(g_add)
            added_gasto = True

        # 50% no comisionable por comisionable_single en habitación single
        single_gasto = next((g for g in existing_gastos if "50% No Comisionable" in g.name), None)
        if single_gasto:
            if calc.get("single_no_comisionable", 0) > 0:
                if single_gasto.amount != calc["single_no_comisionable"] or single_gasto.name != "50% No Comisionable Habitación Single":
                    single_gasto.amount = calc["single_no_comisionable"]
                    single_gasto.name = "50% No Comisionable Habitación Single"
                    added_gasto = True
            else:
                db.delete(single_gasto)
                added_gasto = True
        elif calc.get("single_no_comisionable", 0) > 0:
            g_single = GastosNoCommission(
                id=str(uuid.uuid4()),
                liquidacion_id=liq.id,
                name="50% No Comisionable Habitación Single",
                amount=calc["single_no_comisionable"],
                iweb_client_id=liq.iweb_client_id
            )
            db.add(g_single)
            added_gasto = True

    if added_gasto:
        db.commit()

    # Recalcular total acumulado incluyendo gastos no comisionables extra
    all_gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == liq.id).all()
    sum_extra_gastos = sum(
        g.amount or 0 for g in all_gastos 
        if g.name not in ["Gastos administrativos", "Gastos de Reserva", "Gastos de reserva", "Adicional cama (no comisionable)", "50% No Comisionable Habitación Single"]
    )

    # Solo sincronizar automáticamente desde el paquete si la reserva TIENE un paquete con precio/tarifa > 0
    has_package_price = bool(calc and res_obj and res_obj.package_id and (calc.get("pkg_price", 0) > 0 or calc.get("pax_total", 0) > 0))
    if has_package_price:
        calc_total = calc["total_bruto"] + sum_extra_gastos
        calc_comm = calc["comm_amount"]
        calc_monto_comm = calc.get("monto_comisionable", calc_total)

        if liq.total_amout != calc_total or liq.commission != calc_comm or liq.total_commission != calc_monto_comm:
            liq.total_amout = calc_total
            liq.commission = calc_comm
            liq.total_commission = calc_monto_comm
            db.commit()
            db.refresh(liq)
    elif liq.total_amout is None or float(liq.total_amout) == 0.0:
        if sum_extra_gastos > 0:
            liq.total_amout = sum_extra_gastos
            db.commit()
            db.refresh(liq)

    return liq


@router.get("/get_liquidacion_by_booking/{booking_id}", response_model=LiquidacionResponse)
def get_liquidacion_by_booking(booking_id: str, db: Session = Depends(get_db)):
    try:
        liq = create_or_update_booking_liquidacion(db, booking_id)
        if not liq:
            raise HTTPException(status_code=404, detail="Liquidacion not found for the given booking")
        
        gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == liq.id).all()
        
        return LiquidacionResponse(
            id=liq.id,
            iweb_client_id=liq.iweb_client_id,
            booking_id=liq.booking_id,
            total_amout=liq.total_amout,
            total_commission=liq.total_commission,
            commission=liq.commission,
            gastos=[
                GastoNoCommissionResponse(
                    id=g.id,
                    liquidacion_id=g.liquidacion_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                ) for g in gastos
            ]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/update_liquidacion/{id}", response_model=LiquidacionResponse)
def update_liquidacion(id: str, payload: LiquidacionCreateRequest, db: Session = Depends(get_db)):
    try:
        liq = db.query(Liquidaciones).filter(Liquidaciones.id == id).first()
        if not liq:
            raise HTTPException(status_code=404, detail="Liquidacion not found")
        
        liq.booking_id = payload.booking_id
        liq.total_amout = payload.total_amout
        liq.total_commission = payload.total_commission
        liq.commission = payload.commission
        
        # Sincronizar gastos
        existing_gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == id).all()
        existing_gastos_dict = {g.id: g for g in existing_gastos}
        
        incoming_gastos_ids = set()
        updated_gastos = []
        
        if payload.gastos:
            for g_payload in payload.gastos:
                if g_payload.id and g_payload.id in existing_gastos_dict:
                    # Actualizar existente
                    gasto = existing_gastos_dict[g_payload.id]
                    gasto.name = g_payload.name
                    gasto.amount = g_payload.amount
                    gasto.iweb_client_id = g_payload.iweb_client_id or gasto.iweb_client_id
                    incoming_gastos_ids.add(gasto.id)
                    updated_gastos.append(gasto)
                else:
                    # Crear nuevo
                    new_gasto_id = g_payload.id if g_payload.id else str(uuid.uuid4())
                    gasto = GastosNoCommission(
                        id=new_gasto_id,
                        liquidacion_id=id,
                        name=g_payload.name,
                        amount=g_payload.amount,
                        iweb_client_id=g_payload.iweb_client_id
                    )
                    db.add(gasto)
                    incoming_gastos_ids.add(gasto.id)
                    updated_gastos.append(gasto)
                    
        # Eliminar los gastos que no vinieron en la petición
        for old_gasto in existing_gastos:
            if old_gasto.id not in incoming_gastos_ids:
                db.delete(old_gasto)
                
        db.commit()
        db.refresh(liq)
        
        return LiquidacionResponse(
            id=liq.id,
            iweb_client_id=liq.iweb_client_id,
            booking_id=liq.booking_id,
            total_amout=liq.total_amout,
            total_commission=liq.total_commission,
            commission=liq.commission,
            gastos=[
                GastoNoCommissionResponse(
                    id=g.id,
                    liquidacion_id=g.liquidacion_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                ) for g in updated_gastos
            ]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete_liquidacion/{id}", response_model=LiquidacionResponse)
def delete_liquidacion(id: str, db: Session = Depends(get_db)):
    try:
        liq = db.query(Liquidaciones).filter(Liquidaciones.id == id).first()
        if not liq:
            raise HTTPException(status_code=404, detail="Liquidacion not found")
            
        gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == id).all()
        for g in gastos:
            db.delete(g)
            
        db.delete(liq)
        db.commit()
        
        return LiquidacionResponse(
            id=liq.id,
            iweb_client_id=liq.iweb_client_id,
            booking_id=liq.booking_id,
            total_amout=liq.total_amout,
            total_commission=liq.total_commission,
            commission=liq.commission,
            gastos=[
                GastoNoCommissionResponse(
                    id=g.id,
                    liquidacion_id=g.liquidacion_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                ) for g in gastos
            ]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
