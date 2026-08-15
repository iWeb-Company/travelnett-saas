import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from models.models import Liquidaciones, GastosNoCommission, Reservas, Packages, Clients, ReservationPassengers
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

    # 1. Total Base Comisionable de Paquete según pricing_type y tipo de habitación
    pax_total = 0.0
    if pkg and res_obj.room_type:
        import json
        is_por_habitacion = "habitacion" in (pkg.pricing_type or "").lower()
        rooms_list = []
        try:
            rooms_list = json.loads(res_obj.room_type) if isinstance(res_obj.room_type, str) else res_obj.room_type
        except Exception:
            rooms_list = [str(res_obj.room_type)]

        if isinstance(rooms_list, list) and len(rooms_list) > 0:
            for rm_str in rooms_list:
                rm_lower = str(rm_str).lower()
                capacity = 1
                tariff = pkg_price

                if "doble" in rm_lower or "2" in rm_lower:
                    capacity = 2
                    tariff = float(pkg.tarifa_doble) if pkg.tarifa_doble is not None else pkg_price
                elif "triple" in rm_lower or "3" in rm_lower:
                    capacity = 3
                    tariff = float(pkg.tarifa_triple) if pkg.tarifa_triple is not None else pkg_price
                elif "cuadruple" in rm_lower or "4" in rm_lower:
                    capacity = 4
                    tariff = float(pkg.tarifa_cuadruple) if pkg.tarifa_cuadruple is not None else pkg_price
                elif "quintuple" in rm_lower or "5" in rm_lower:
                    capacity = 5
                    tariff = float(pkg.tarifa_quintuple) if pkg.tarifa_quintuple is not None else pkg_price
                elif "single" in rm_lower or "individual" in rm_lower or "1" in rm_lower:
                    capacity = 1
                    tariff = float(pkg.tarifa_single) if pkg.tarifa_single is not None else pkg_price

                if is_por_habitacion:
                    pax_total += tariff
                else:
                    pax_total += tariff * capacity

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

    # 2. Base Comisionable: Únicamente pax_total + (pkg_adicional si es_comisionable)
    monto_comisionable = pax_total
    if is_comisionable:
        monto_comisionable += pkg_adicional

    # 3. Comisión del Cliente
    client_comm_pct = 0.0
    if res_obj.client_id:
        client = db.query(Clients).filter(Clients.id == res_obj.client_id).first()
        if client and client.commission:
            client_comm_pct = float(client.commission)

    comm_amount = (monto_comisionable * client_comm_pct) / 100.0

    # 4. Total Bruto (pax_total + pkg_gastos + pkg_adicional)
    total_bruto = pax_total + pkg_gastos + pkg_adicional

    return {
        "res_obj": res_obj,
        "pax_total": pax_total,
        "pkg_gastos": pkg_gastos,
        "pkg_adicional": pkg_adicional,
        "is_comisionable": is_comisionable,
        "monto_comisionable": monto_comisionable,
        "client_comm_pct": client_comm_pct,
        "comm_amount": comm_amount,
        "total_bruto": total_bruto
    }


@router.post("/create_liquidacion", response_model=LiquidacionResponse)
async def create_liquidacion(payload: LiquidacionCreateRequest, db: Session = Depends(get_db)):
    try:
        clean_b_id = payload.booking_id.strip().lower()
        existing = db.query(Liquidaciones).filter(func.lower(Liquidaciones.booking_id) == clean_b_id).first()

        if existing:
            liquidacion = existing
            liquidacion.total_amout = payload.total_amout
            liquidacion.total_commission = payload.total_commission
            liquidacion.commission = payload.commission
            liq_id = existing.id
        else:
            liq_id = str(uuid.uuid4())
            liquidacion = Liquidaciones(
                id=liq_id,
                iweb_client_id=payload.iweb_client_id,
                booking_id=payload.booking_id,
                total_amout=payload.total_amout,
                total_commission=payload.total_commission,
                commission=payload.commission
            )
            db.add(liquidacion)

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
        db.refresh(liquidacion)
        
        gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == liq_id).all()
        
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
            total_commission=calc["comm_amount"],
            commission=calc["comm_amount"]
        )
        db.add(liq)
        db.commit()
        db.refresh(liq)

    # Registrar o sincronizar GastosNoCommission derivados del paquete
    existing_gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == liq.id).all()
    existing_names = [g.name for g in existing_gastos]
    has_admin_gasto = any(n in ["Gastos administrativos", "Gastos de Reserva"] for n in existing_names)
    added_gasto = False

    # Gastos administrativos del paquete si no existen
    if calc["pkg_gastos"] > 0 and not has_admin_gasto:
        g_adm = GastosNoCommission(
            id=str(uuid.uuid4()),
            liquidacion_id=liq.id,
            name="Gastos administrativos",
            amount=calc["pkg_gastos"],
            iweb_client_id=liq.iweb_client_id
        )
        db.add(g_adm)
        added_gasto = True

    # Adicional no comisionable del paquete si no es comisionable y no existe
    if not calc["is_comisionable"] and calc["pkg_adicional"] > 0 and "Adicional paquete (no comisionable)" not in existing_names:
        g_add = GastosNoCommission(
            id=str(uuid.uuid4()),
            liquidacion_id=liq.id,
            name="Adicional paquete (no comisionable)",
            amount=calc["pkg_adicional"],
            iweb_client_id=liq.iweb_client_id
        )
        db.add(g_add)
        added_gasto = True

    if added_gasto:
        db.commit()

    # Recalcular total acumulado incluyendo gastos no comisionables extra
    all_gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == liq.id).all()
    sum_extra_gastos = sum(g.amount or 0 for g in all_gastos if g.name not in ["Gastos administrativos", "Adicional paquete (no comisionable)"])

    # Solo sincronizar automáticamente desde el paquete si la reserva TIENE un paquete con precio > 0
    has_package_price = bool(calc and res_obj and res_obj.package_id and calc.get("pkg_price", 0) > 0)
    if has_package_price:
        calc_total = calc["total_bruto"] + sum_extra_gastos
        calc_comm = calc["comm_amount"]

        if liq.total_amout != calc_total or liq.commission != calc_comm:
            liq.total_amout = calc_total
            liq.commission = calc_comm
            liq.total_commission = calc.get("monto_comisionable", calc_total)
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
