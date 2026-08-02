from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
from models.models import Pagos, Reservas, iWebClient, Packages, Clients, ReservationPassengers, Passengers, Salidas
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


@router.get("/get_saldos_clientes", tags=["Pagos"])
async def get_saldos_clientes(
    iweb_client_id: str = Query(...),
    client_id: Optional[str] = Query(None),
    fecha_crea_desde: Optional[str] = Query(None),
    fecha_crea_hasta: Optional[str] = Query(None),
    fecha_in_desde: Optional[str] = Query(None),
    fecha_in_hasta: Optional[str] = Query(None),
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

    # 7. Batch: salidas for dates
    sal_ids = list(set(r.salida_id for r in reservas if r.salida_id))
    sal_map: dict = {}
    if sal_ids:
        sal_list = db.query(Salidas).filter(Salidas.id.in_(sal_ids)).all()
        sal_map = {s.id: s for s in sal_list}

    # 8. Build result
    result = []
    for r in reservas:
        # Calculate neto from package
        neto = 400000  # fallback
        if r.package_id and r.package_id in pkg_map:
            pkg = pkg_map[r.package_id]
            neto = (pkg.price or 0) + (pkg.gastos or 0) + (pkg.adicional or 0)

        # Calculate cobros from pagos
        res_pagos = pagos_by_reserva.get(r.id, [])
        cobros = sum(float(p.amount or 0) for p in res_pagos)

        saldo = neto - cobros

        # Client name
        cl = clients_map.get(r.client_id) if r.client_id else None
        cliente_nombre = (cl.complete_name or cl.name_system or "") if cl else "Sin cliente"

        # Passenger detail string
        rps = rp_by_reserva.get(r.id, [])
        pax_count = len(rps)
        first_pax_name = "Sin pasajero"
        if rps:
            first_rp = rps[0]
            p = pax_map.get(first_rp.pasajero_id)
            if p:
                first_pax_name = f"{(p.name or '').upper()} {(p.last_name or '').upper()}".strip()
            elif cl:
                first_pax_name = (cl.complete_name or cl.name_system or "").upper()

        room = r.room_type or ""
        detalle = f"{first_pax_name} x{pax_count} {room}".strip()

        # Date from salida or venciment
        iso_fecha = ""
        fecha = ""
        if r.salida_id and r.salida_id in sal_map:
            sal = sal_map[r.salida_id]
            if sal.date_of_out:
                iso_fecha = str(sal.date_of_out).split(" ")[0]
                parts = iso_fecha.split("-")
                if len(parts) == 3:
                    fecha = f"{parts[2]}/{parts[1]}/{parts[0]}"
                else:
                    fecha = iso_fecha
        elif r.venciment:
            iso_fecha = str(r.venciment).split(" ")[0]
            parts = iso_fecha.split("-")
            if len(parts) == 3:
                fecha = f"{parts[2]}/{parts[1]}/{parts[0]}"
            else:
                fecha = iso_fecha

        # Filter by min date (fecha_in_desde or fecha_crea_desde)
        min_fecha = fecha_in_desde or fecha_crea_desde
        if min_fecha and min_fecha.strip() and iso_fecha:
            if iso_fecha < min_fecha.strip():
                continue

        # Filter by max date (fecha_in_hasta or fecha_crea_hasta)
        max_fecha = fecha_in_hasta or fecha_crea_hasta
        if max_fecha and max_fecha.strip() and iso_fecha:
            if iso_fecha > max_fecha.strip():
                continue

        result.append({
            "id": r.id,
            "reserva_id": r.id,
            "salida_id": r.salida_id or "",
            "fecha": fecha,
            "reserva": r.codigo_reserva or r.id[:8],
            "cliente": cliente_nombre,
            "client_id": r.client_id or "",
            "detalle": detalle,
            "neto": round(neto),
            "cobros": round(cobros),
            "saldo": round(saldo),
        })

    return result
