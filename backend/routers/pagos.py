from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
from models.models import Pagos, Reservas, iWebClient
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
    reserva = db.query(Reservas).filter(
        Reservas.id == reserva_id,
        Reservas.iweb_client_id == iweb_client_id
    ).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    return db.query(Pagos).filter(
        Pagos.reserva_id == reserva_id,
        Pagos.iweb_client_id == iweb_client_id
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
        receipt_number=receipt_url
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
