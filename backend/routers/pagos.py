from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional, Any
import uuid
import os
from models.models import Pagos, Reservas, iWebClient, Packages, Clients, ReservationPassengers, Passengers, Salidas, Liquidaciones, PackageHotels
from schemas.schemas import PagoResponse
from db.database import get_db
from routers.tenants import tenant_dir, public_tenant_asset_url, _guess_extension, _save_upload

router = APIRouter()

def _get_tenant_or_404(db: Session, iweb_client_id: str):
    from sqlalchemy import func
    tenant = db.query(iWebClient).filter(func.lower(iWebClient.id) == func.lower(iweb_client_id.strip())).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant

@router.get("/get_pagos_reserva/{reserva_id}", tags=["Pagos"], response_model=List[PagoResponse])
async def get_pagos_reserva(reserva_id: str, iweb_client_id: str = Query(...), db: Session = Depends(get_db)):
    from sqlalchemy import func
    clean_r_id = reserva_id.strip().lower()
    norm_client = iweb_client_id.strip().lower()

    res_obj = db.query(Reservas).filter(
        (func.lower(Reservas.id) == clean_r_id) | (func.lower(Reservas.codigo_reserva) == clean_r_id),
        func.lower(Reservas.iweb_client_id) == norm_client
    ).first()
    actual_res_id = res_obj.id if res_obj else clean_r_id

    return db.query(Pagos).filter(
        func.lower(Pagos.reserva_id) == actual_res_id.lower(),
        func.lower(Pagos.iweb_client_id) == norm_client
    ).all()

@router.post("/create_pago", tags=["Pagos"], response_model=PagoResponse)
async def create_pago(
    reserva_id: str = Form(...),
    payment_method: Optional[str] = Form(None),
    date_pay: Optional[str] = Form(None),
    amount: Optional[float] = Form(None),
    currency: Optional[str] = Form(None),
    observations: Optional[str] = Form(None),
    card_number: Optional[str] = Form(None),
    titular: Optional[str] = Form(None),
    operation_number: Optional[str] = Form(None),
    quotes_number: Optional[str] = Form(None),
    account_id: Optional[str] = Form(None),
    receipt_file: Optional[UploadFile] = File(None),
    iweb_client_id: str = Query(...),
    db: Session = Depends(get_db)
):
    reserva = db.query(Reservas).filter(
        Reservas.id == reserva_id,
        Reservas.iweb_client_id == iweb_client_id
    ).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    tenant = _get_tenant_or_404(db, iweb_client_id)
    folder_id = tenant.folder_id
    
    receipt_url = None
    if receipt_file:
        file_id = str(uuid.uuid4())
        ext = _guess_extension(receipt_file.filename or "", receipt_file.content_type)
        if not ext and receipt_file.filename:
            _, file_ext = os.path.splitext(receipt_file.filename)
            ext = file_ext
        filename = f"{file_id}{ext}"
        dest_dir = tenant_dir(folder_id) / "receipts" / reserva_id
        _save_upload(receipt_file, dest_dir / filename)
        receipt_url = public_tenant_asset_url(folder_id, "receipts", reserva_id, filename)

    clean_account_id = account_id.strip() if account_id and account_id.strip() not in ("", "null", "undefined") else None

    new_pago = Pagos(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        reserva_id=reserva_id,
        payment_method=payment_method,
        date_pay=date_pay,
        amount=amount,
        currency=currency,
        observations=observations,
        card_number=card_number,
        titular=titular,
        operation_number=operation_number,
        quotes_number=quotes_number,
        receipt_number=receipt_url,
        account_id=clean_account_id
    )
    db.add(new_pago)
    db.commit()
    db.refresh(new_pago)
    return new_pago

@router.delete("/delete_pago/{pago_id}", tags=["Pagos"])
async def delete_pago(pago_id: str, iweb_client_id: str = Query(...), db: Session = Depends(get_db)):
    existing_pago = db.query(Pagos).filter(
        Pagos.id == pago_id,
        Pagos.iweb_client_id == iweb_client_id
    ).first()
    if not existing_pago:
        raise HTTPException(status_code=404, detail="Payment not found")
        
    db.delete(existing_pago)
    db.commit()
    return {"detail": "Payment deleted successfully"}


import math

def _normalize_date_pair(val: Any) -> tuple[str, str]:
    """
    Returns (iso_str 'YYYY-MM-DD', display_str 'DD/MM/YYYY')
    """
    if not val:
        return ("", "")
    s = str(val).strip()
    if not s:
        return ("", "")
    
    # Split time component if present
    s = s.split(" ")[0].split("T")[0]
    
    if "-" in s:
        parts = s.split("-")
        if len(parts) == 3:
            if len(parts[0]) == 4:  # YYYY-MM-DD
                iso = f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                display = f"{parts[2].zfill(2)}/{parts[1].zfill(2)}/{parts[0]}"
                return (iso, display)
            elif len(parts[2]) == 4:  # DD-MM-YYYY
                iso = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
                display = f"{parts[0].zfill(2)}/{parts[1].zfill(2)}/{parts[2]}"
                return (iso, display)
    elif "/" in s:
        parts = s.split("/")
        if len(parts) == 3:
            if len(parts[2]) == 4:  # DD/MM/YYYY
                iso = f"{parts[2]}-{parts[1].zfill(2)}-{parts[0].zfill(2)}"
                display = f"{parts[0].zfill(2)}/{parts[1].zfill(2)}/{parts[2]}"
                return (iso, display)
            elif len(parts[0]) == 4:  # YYYY/MM/DD
                iso = f"{parts[0]}-{parts[1].zfill(2)}-{parts[2].zfill(2)}"
                display = f"{parts[2].zfill(2)}/{parts[1].zfill(2)}/{parts[0]}"
                return (iso, display)
                
    return (s, s)

@router.get("/get_saldos_clientes", tags=["Pagos"])
async def get_saldos_clientes(
    iweb_client_id: str = Query(...),
    client_id: Optional[str] = Query(None),
    fecha_crea_desde: Optional[str] = Query(None),
    fecha_crea_hasta: Optional[str] = Query(None),
    fecha_in_desde: Optional[str] = Query(None),
    fecha_in_hasta: Optional[str] = Query(None),
    page: Optional[int] = Query(None, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db)
):
    from sqlalchemy import func

    # 1. Get all reservations (optionally filtered by client)
    q = db.query(Reservas).filter(
        func.lower(Reservas.iweb_client_id) == func.lower(iweb_client_id.strip())
    )
    if client_id and client_id.strip() not in ("", "undefined", "null", "none"):
        q = q.filter(func.lower(Reservas.client_id) == func.lower(client_id.strip()))
    reservas = q.all()

    if not reservas:
        if page is not None:
            return {"items": [], "total": 0, "page": page, "limit": limit, "total_pages": 1}
        return []

    res_ids = [r.id for r in reservas]

    # 2. Batch: all pagos for these reservations
    all_pagos = db.query(Pagos).filter(Pagos.reserva_id.in_(res_ids)).all()
    pagos_by_reserva: dict = {}
    for p in all_pagos:
        pagos_by_reserva.setdefault(p.reserva_id, []).append(p)

    # 3. Batch: all clients referenced
    client_ids = list(set(r.client_id for r in reservas if r.client_id))
    clients_map: dict = {}
    if client_ids:
        clients_list = db.query(Clients).filter(Clients.id.in_(client_ids)).all()
        clients_map = {c.id: c for c in clients_list}

    # 4. Batch: all reservation_passengers
    all_rp = db.query(ReservationPassengers).filter(ReservationPassengers.reserva_id.in_(res_ids)).all()
    rp_by_reserva: dict = {}
    for rp in all_rp:
        rp_by_reserva.setdefault(rp.reserva_id, []).append(rp)

    # 5. Batch: all passengers referenced
    pax_ids = list(set(rp.pasajero_id for rp in all_rp))
    pax_map: dict = {}
    if pax_ids:
        pax_list = db.query(Passengers).filter(Passengers.id.in_(pax_ids)).all()
        pax_map = {p.id: p for p in pax_list}

    # 6. Batch: all packages referenced
    pkg_ids = list(set(r.package_id for r in reservas if r.package_id))
    pkg_map: dict = {}
    if pkg_ids:
        pkg_list = db.query(Packages).filter(Packages.id.in_(pkg_ids)).all()
        pkg_map = {p.id: p for p in pkg_list}

    # 7. Batch: salidas for fallback dates
    sal_ids = list(set(r.salida_id for r in reservas if r.salida_id))
    sal_map: dict = {}
    if sal_ids:
        sal_list = db.query(Salidas).filter(Salidas.id.in_(sal_ids)).all()
        sal_map = {s.id: s for s in sal_list}

    # 8. Batch: PackageHotels for hotel_fecha_in (Fecha de entrada al hotel del paquete)
    all_ph = []
    if pkg_ids:
        all_ph = db.query(PackageHotels).filter(PackageHotels.package_id.in_(pkg_ids)).all()
    
    ph_map: dict = {}
    ph_fallback_map: dict = {}
    for ph in all_ph:
        if ph.hotel_id:
            ph_map[(ph.package_id, ph.hotel_id)] = ph
        if ph.package_id not in ph_fallback_map:
            ph_fallback_map[ph.package_id] = ph

    # 9. Batch: liquidaciones for real total amount (neto)
    all_liquidaciones = db.query(Liquidaciones).filter(Liquidaciones.booking_id.in_(res_ids)).all()
    liq_map: dict = {}
    for l in all_liquidaciones:
        if l.booking_id:
            liq_map[l.booking_id] = l

    # Normalize filter parameters once
    iso_crea_desde, _ = _normalize_date_pair(fecha_crea_desde)
    iso_crea_hasta, _ = _normalize_date_pair(fecha_crea_hasta)
    iso_in_desde, _ = _normalize_date_pair(fecha_in_desde)
    iso_in_hasta, _ = _normalize_date_pair(fecha_in_hasta)

    # 10. Build result
    result = []
    for r in reservas:
        # Calculate neto (Total Bruto - Comisión) from liquidacion or package
        neto = 0.0
        liq = liq_map.get(r.id)
        if liq and liq.total_amout is not None:
            bruto = float(liq.total_amout)
            comision = float(liq.commission or 0)
            neto = max(0.0, bruto - comision)
        elif r.package_id and r.package_id in pkg_map:
            pkg = pkg_map[r.package_id]
            unit_price = float((pkg.price or 0) + (pkg.gastos or 0) + (pkg.adicional or 0))
            pax_count_for_calc = len(rp_by_reserva.get(r.id, []))
            bruto = unit_price * max(pax_count_for_calc, 1)
            cl = clients_map.get(r.client_id) if r.client_id else None
            comm_pct = float(cl.commission or r.commission or 0) if cl else float(r.commission or 0)
            comision = round((bruto * comm_pct) / 100)
            neto = max(0.0, bruto - comision)

        # Calculate cobros from pagos
        res_pagos = pagos_by_reserva.get(r.id, [])
        cobros = sum(float(p.amount or 0) for p in res_pagos)

        saldo = neto - cobros

        # Client name
        cl = clients_map.get(r.client_id) if r.client_id else None
        cliente_nombre = (cl.complete_name or cl.name_system or "") if cl else "Sin cliente"

        # Passenger / Title detail string (no raw JSON array)
        rps = rp_by_reserva.get(r.id, [])
        pax_count = len(rps)
        if r.titulo and r.titulo.strip():
            detalle = r.titulo.strip()
        else:
            first_pax_name = "Sin pasajero"
            if rps:
                first_rp = rps[0]
                p = pax_map.get(first_rp.pasajero_id)
                if p:
                    first_pax_name = f"{(p.name or '').upper()} {(p.last_name or '').upper()}".strip()
                elif cl:
                    first_pax_name = (cl.complete_name or cl.name_system or "").upper()
            detalle = f"{first_pax_name} x{pax_count}".strip()

        # Resolve Fecha de Entrada (IN) al Hotel del paquete de esa reserva
        hotel_fecha_in_raw = ""
        if r.package_id:
            ph = None
            if r.hotel_id:
                ph = ph_map.get((r.package_id, r.hotel_id))
            if not ph:
                ph = ph_fallback_map.get(r.package_id)
            if ph and ph.hotel_fecha_in:
                hotel_fecha_in_raw = ph.hotel_fecha_in

        # Fallback date if not configured in PackageHotels
        if not hotel_fecha_in_raw:
            if r.salida_id and r.salida_id in sal_map and sal_map[r.salida_id].date_of_out:
                hotel_fecha_in_raw = str(sal_map[r.salida_id].date_of_out)
            elif r.venciment:
                hotel_fecha_in_raw = str(r.venciment)

        iso_in, display_in = _normalize_date_pair(hotel_fecha_in_raw)

        # Resolve Fecha de Creación de la Reserva (created_at)
        iso_crea, _ = _normalize_date_pair(r.created_at)

        # Filter by Fecha de Creación (created_at de la reserva)
        if iso_crea_desde:
            if not iso_crea or iso_crea < iso_crea_desde:
                continue
        if iso_crea_hasta:
            if not iso_crea or iso_crea > iso_crea_hasta:
                continue

        # Filter by Fecha de Entrada (IN al hotel del paquete)
        if iso_in_desde:
            if not iso_in or iso_in < iso_in_desde:
                continue
        if iso_in_hasta:
            if not iso_in or iso_in > iso_in_hasta:
                continue

        result.append({
            "id": r.id,
            "reserva_id": r.id,
            "salida_id": r.salida_id or "",
            "fecha": display_in or "-",
            "reserva": r.codigo_reserva or r.id[:8],
            "cliente": cliente_nombre,
            "client_id": r.client_id or "",
            "detalle": detalle,
            "neto": int(round(neto)),
            "cobros": int(round(cobros)),
            "saldo": int(round(saldo)),
        })

    total_items = len(result)
    if page is not None:
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_result = result[start_idx:end_idx]
        total_pages = math.ceil(total_items / limit) if total_items > 0 else 1
        return {
            "items": paginated_result,
            "total": total_items,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }

    return result
