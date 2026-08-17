from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime, date
import uuid

from db.database import get_db
from models.models import (
    Tesoro,
    Accounts,
    Pagos,
    Reservas,
    ccProvidersConsumptionPayments,
    Hotels,
    TransportCompany,
    iWebClient
)
from schemas.schemas import (
    TesoroMovimientoCreateRequest,
    TesoroPaseDineroCreateRequest,
    TesoroMovimientoResponse
)

router = APIRouter()


def _format_date_ar(dt_or_str) -> tuple[str, str]:
    """Returns (formatted_dd_mm_yyyy, iso_yyyy_mm_dd)"""
    if not dt_or_str:
        return "", ""
    if isinstance(dt_or_str, (datetime, date)):
        iso_str = dt_or_str.strftime("%Y-%m-%d")
        return dt_or_str.strftime("%d/%m/%Y"), iso_str
    
    raw = str(dt_or_str).split(" ")[0].strip()
    parts = raw.split("-")
    if len(parts) == 3:
        return f"{parts[2]}/{parts[1]}/{parts[0]}", raw
    return raw, raw


@router.get("/tesoro/get_movimientos", tags=["Tesoro"])
async def get_tesoro_movimientos(
    iweb_client_id: str = Query(...),
    account_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    page: Optional[int] = Query(None, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db)
):
    try:
        clean_iweb_id = iweb_client_id.strip()
        clean_acc_id = account_id.strip() if account_id and account_id.strip() not in ("", "undefined", "null", "none") else None

        # 1. Fetch Accounts to map IDs/titles -> Labels
        accounts_list = db.query(Accounts).filter(
            func.lower(Accounts.iweb_client_id) == func.lower(clean_iweb_id)
        ).all()
        accounts_map = {}
        target_account_title = ""

        for acc in accounts_list:
            title = acc.account_title or "Cuenta"
            num = acc.account_number or acc.alias or ""
            label = f"{title} - {num}".strip(" -")
            accounts_map[acc.id] = label

            if clean_acc_id and (acc.id == clean_acc_id or acc.account_title == clean_acc_id or label == clean_acc_id):
                clean_acc_id = acc.id
                target_account_title = acc.account_title or ""

        unified_movimientos = []

        # 2. Fetch Tesoro manual/pase movements
        q_tesoro = db.query(Tesoro).filter(
            func.lower(Tesoro.iweb_client_id) == func.lower(clean_iweb_id)
        )
        if clean_acc_id:
            q_tesoro = q_tesoro.filter(func.lower(Tesoro.account_id) == func.lower(clean_acc_id))
        tesoro_items = q_tesoro.all()

        for item in tesoro_items:
            fecha_ar, iso_date = _format_date_ar(item.created_at)
            account_label = accounts_map.get(item.account_id, "Cuenta Desconocida")
            
            monto_val = float(item.ammount or 0)
            if item.movement_type in ("egreso", "egreso_pase") and monto_val > 0:
                monto_val = -monto_val

            unified_movimientos.append({
                "id": item.id,
                "account_id": item.account_id,
                "cuenta": account_label,
                "fecha": fecha_ar,
                "iso_date": iso_date,
                "recibo": item.recibo_number or "S/D",
                "monto": monto_val,
                "tipo": item.movement_type,
                "detalle": item.detail or "Movimiento manual",
            })

        # 3. Fetch Reservation Payments (Pagos)
        q_pagos = db.query(Pagos).filter(
            func.lower(Pagos.iweb_client_id) == func.lower(clean_iweb_id)
        )
        if clean_acc_id:
            if target_account_title:
                q_pagos = q_pagos.filter(
                    or_(
                        func.lower(Pagos.account_id) == func.lower(clean_acc_id),
                        Pagos.payment_method.ilike(f"%{target_account_title}%")
                    )
                )
            else:
                q_pagos = q_pagos.filter(func.lower(Pagos.account_id) == func.lower(clean_acc_id))

        pagos_items = q_pagos.all()

        if pagos_items:
            res_ids = list(set(p.reserva_id for p in pagos_items if p.reserva_id))
            res_map = {}
            if res_ids:
                reservas = db.query(Reservas).filter(Reservas.id.in_(res_ids)).all()
                res_map = {r.id: r for r in reservas}

            for p in pagos_items:
                fecha_ar, iso_date = _format_date_ar(p.date_pay)
                account_label = accounts_map.get(p.account_id, "Cuenta General")
                if p.payment_method and "Transf." in p.payment_method:
                    account_label = p.payment_method.replace("Transf. (", "").replace(")", "").strip()

                res = res_map.get(p.reserva_id)
                res_code = res.codigo_reserva if res and res.codigo_reserva else (p.reserva_id[:8] if p.reserva_id else "S/D")

                monto_val = float(p.amount or 0)

                unified_movimientos.append({
                    "id": p.id,
                    "account_id": p.account_id or "",
                    "cuenta": account_label,
                    "fecha": fecha_ar,
                    "iso_date": iso_date,
                    "recibo": p.operation_number or p.receipt_number or "RC-PAGO",
                    "monto": monto_val,
                    "tipo": "reserva",
                    "detalle": f"Cobro Reserva {res_code} - {p.observations or p.payment_method or ''}".strip(" -"),
                })

        # 4. Fetch Provider Payments (cc_providers_consumption_payments)
        q_cc_prov = db.query(ccProvidersConsumptionPayments).filter(
            func.lower(ccProvidersConsumptionPayments.iweb_client_id) == func.lower(clean_iweb_id),
            func.lower(ccProvidersConsumptionPayments.type) == "pago"
        )
        if clean_acc_id:
            if target_account_title:
                q_cc_prov = q_cc_prov.filter(
                    or_(
                        func.lower(ccProvidersConsumptionPayments.transf_account) == func.lower(clean_acc_id),
                        ccProvidersConsumptionPayments.transf_account.ilike(f"%{target_account_title}%")
                    )
                )
            else:
                q_cc_prov = q_cc_prov.filter(func.lower(ccProvidersConsumptionPayments.transf_account) == func.lower(clean_acc_id))

        prov_items = q_cc_prov.all()

        if prov_items:
            hotel_ids = list(set(p.hotel_id for p in prov_items if p.hotel_id))
            transport_ids = list(set(p.transport_id for p in prov_items if p.transport_id))
            hotel_map = {h.id: h.name for h in db.query(Hotels).filter(Hotels.id.in_(hotel_ids)).all()} if hotel_ids else {}
            transport_map = {t.id: t.name for t in db.query(TransportCompany).filter(TransportCompany.id.in_(transport_ids)).all()} if transport_ids else {}

            for cp in prov_items:
                fecha_ar, iso_date = _format_date_ar(cp.date)
                account_label = accounts_map.get(cp.transf_account, cp.transf_account or "Cuenta General")
                
                prov_name = "Proveedor"
                if cp.provider_type == "hotel" and cp.hotel_id in hotel_map:
                    prov_name = hotel_map[cp.hotel_id]
                elif cp.provider_type == "transporte" and cp.transport_id in transport_map:
                    prov_name = transport_map[cp.transport_id]

                monto_val = -abs(float(cp.amount or 0))

                unified_movimientos.append({
                    "id": cp.id,
                    "account_id": cp.transf_account or "",
                    "cuenta": account_label,
                    "fecha": fecha_ar,
                    "iso_date": iso_date,
                    "recibo": "OP-PROV",
                    "monto": monto_val,
                    "tipo": "pago",
                    "detalle": f"PAGO A {prov_name.upper()} - {cp.detail or ''}".strip(" -"),
                })

        # 5. Apply Date Filtering
        clean_start = start_date.strip() if start_date and start_date.strip() else None
        clean_end = end_date.strip() if end_date and end_date.strip() else None

        filtered_movs = []
        for m in unified_movimientos:
            iso = m["iso_date"]
            if clean_start and iso and iso < clean_start:
                continue
            if clean_end and iso and iso > clean_end:
                continue
            filtered_movs.append(m)

        # Sort descending by date
        filtered_movs.sort(key=lambda x: x["iso_date"], reverse=True)

        # Calculate totals
        total_ingresos = sum(m["monto"] for m in filtered_movs if m["monto"] > 0)
        total_egresos = sum(m["monto"] for m in filtered_movs if m["monto"] < 0)
        saldo_total = total_ingresos + total_egresos

        total_items = len(filtered_movs)
        if page is not None:
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            movs_page = filtered_movs[start_idx:end_idx]
            total_pages = math.ceil(total_items / limit) if total_items > 0 else 1
            return {
                "movimientos": movs_page,
                "total": total_items,
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "total_ingresos": round(total_ingresos, 2),
                "total_egresos": round(total_egresos, 2),
                "saldo_total": round(saldo_total, 2)
            }

        return {
            "movimientos": filtered_movs,
            "total": total_items,
            "total_ingresos": round(total_ingresos, 2),
            "total_egresos": round(total_egresos, 2),
            "saldo_total": round(saldo_total, 2)
        }

    except Exception as e:
        db.rollback()
        print(f"Error in get_tesoro_movimientos: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tesoro/create_movimiento", tags=["Tesoro"])
async def create_tesoro_movimiento(
    payload: TesoroMovimientoCreateRequest,
    db: Session = Depends(get_db)
):
    try:
        parsed_date = datetime.utcnow()
        if payload.date:
            if isinstance(payload.date, str):
                try:
                    parsed_date = datetime.strptime(payload.date[:10], "%Y-%m-%d")
                except Exception:
                    parsed_date = datetime.utcnow()
            elif isinstance(payload.date, date):
                parsed_date = datetime.combine(payload.date, datetime.min.time())

        recibo = payload.recibo_number or f"MAN-{uuid.uuid4().hex[:6].upper()}"

        item = Tesoro(
            id=str(uuid.uuid4()),
            iweb_client_id=payload.iweb_client_id.strip(),
            account_id=payload.account_id.strip(),
            movement_type=payload.movement_type.strip(),
            recibo_number=recibo,
            ammount=payload.amount,
            detail=payload.detail.strip(),
            created_at=parsed_date
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    except Exception as e:
        db.rollback()
        print(f"Error in create_tesoro_movimiento: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/tesoro/create_pase_dinero", tags=["Tesoro"])
async def create_tesoro_pase_dinero(
    payload: TesoroPaseDineroCreateRequest,
    db: Session = Depends(get_db)
):
    try:
        if payload.account_origen_id == payload.account_destino_id:
            raise HTTPException(status_code=400, detail="La cuenta de origen y destino deben ser distintas")

        parsed_date = datetime.utcnow()
        if payload.date:
            if isinstance(payload.date, str):
                try:
                    parsed_date = datetime.strptime(payload.date[:10], "%Y-%m-%d")
                except Exception:
                    parsed_date = datetime.utcnow()
            elif isinstance(payload.date, date):
                parsed_date = datetime.combine(payload.date, datetime.min.time())

        recibo = f"TRF-{uuid.uuid4().hex[:6].upper()}"
        monto_val = abs(payload.amount)

        # Lookup account names for details
        acc_origen = db.query(Accounts).filter(Accounts.id == payload.account_origen_id).first()
        acc_destino = db.query(Accounts).filter(Accounts.id == payload.account_destino_id).first()

        name_origen = acc_origen.account_title if acc_origen else "Origen"
        name_destino = acc_destino.account_title if acc_destino else "Destino"

        # 1. Egreso from Origen
        egreso_item = Tesoro(
            id=str(uuid.uuid4()),
            iweb_client_id=payload.iweb_client_id.strip(),
            account_id=payload.account_origen_id.strip(),
            movement_type="egreso_pase",
            recibo_number=recibo,
            ammount=-monto_val,
            detail=f"PASE DE DINERO A: {name_destino.upper()} - {payload.detail}".strip(" -"),
            created_at=parsed_date
        )

        # 2. Ingreso to Destino
        ingreso_item = Tesoro(
            id=str(uuid.uuid4()),
            iweb_client_id=payload.iweb_client_id.strip(),
            account_id=payload.account_destino_id.strip(),
            movement_type="ingreso_pase",
            recibo_number=recibo,
            ammount=monto_val,
            detail=f"PASE DE DINERO DESDE: {name_origen.upper()} - {payload.detail}".strip(" -"),
            created_at=parsed_date
        )

        db.add(egreso_item)
        db.add(ingreso_item)
        db.commit()
        return {"status": "ok", "recibo": recibo}

    except Exception as e:
        db.rollback()
        print(f"Error in create_tesoro_pase_dinero: {e}")
        raise HTTPException(status_code=400, detail=str(e))
