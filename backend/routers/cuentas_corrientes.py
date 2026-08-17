from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
from typing import Any, Optional, Union, List
from datetime import datetime, date
from db.database import get_db
from models.models import cuentasCorrientsClients, cuentasCorrientesProviders, ccProvidersConsumptionPayments
from schemas.schemas import (
    cuentasCorrientsClientsCreateRequest,
    cuentasCorrientsClientsResponse,
    cuentasCorrientsProvidersCreateRequest,
    cuentasCorrientsProvidersResponse,
    ccProvidersConsumptionPaymentsCreateRequest,
    ccProvidersConsumptionPaymentsResponse
)
import uuid

router = APIRouter()

# CREATE

@router.post("/createCuentaCorrienteClients", response_model=cuentasCorrientsClientsResponse, tags=["Cuentas Corrientes Clients"])
async def create_cuenta_corrientes_client(cuentas_corrientes: cuentasCorrientsClientsCreateRequest, db: Session = Depends(get_db)):
    try:
        id = str(uuid.uuid4())
        cuenta_corriente = cuentasCorrientsClients(
            id=id,
            iweb_client_id=cuentas_corrientes.iweb_client_id,
            client_id=cuentas_corrientes.client_id,
            booking_id=cuentas_corrientes.booking_id,
            description=cuentas_corrientes.description,
            balance=cuentas_corrientes.balance,
            total_bookings=cuentas_corrientes.total_bookings,
            total_payments=cuentas_corrientes.total_payments,
            created_at=cuentas_corrientes.created_at
        )
        db.add(cuenta_corriente)
        db.commit()
        db.refresh(cuenta_corriente)
        return cuenta_corriente
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/createCuentaCorrienteProviders", response_model=cuentasCorrientsProvidersResponse, tags=["Cuentas Corrientes Providers"])
async def create_cuenta_corrientes_provider(cuentas_corrientes: cuentasCorrientsProvidersCreateRequest, db: Session = Depends(get_db)):
    try:
        id = str(uuid.uuid4())
        cuenta_corriente = cuentasCorrientesProviders(
            id=id,
            iweb_client_id=cuentas_corrientes.iweb_client_id,
            type=cuentas_corrientes.type,
            transport_id=cuentas_corrientes.transport_id,
            hotel_id=cuentas_corrientes.hotel_id,
            detail=cuentas_corrientes.detail,
            balance=cuentas_corrientes.balance,
            total_consumption=cuentas_corrientes.total_consumption,
            total_payments=cuentas_corrientes.total_payments,
            created_at=cuentas_corrientes.created_at
        )
        db.add(cuenta_corriente)
        db.commit()
        db.refresh(cuenta_corriente)
        return cuenta_corriente
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# UPDATE

@router.put("/updateCuentaCorrienteClients/{id}", response_model=cuentasCorrientsClientsResponse, tags=["Cuentas Corrientes Clients"])
def update_cuenta_corriente_client(id: str, cuentas_corrientes: cuentasCorrientsClientsCreateRequest, db: Session = Depends(get_db)):
    try:
        cuenta_corriente = db.query(cuentasCorrientsClients).filter(cuentasCorrientsClients.id == id).first()
        if not cuenta_corriente:
            raise HTTPException(status_code=404, detail="Cuenta corriente not found")
        cuenta_corriente.iweb_client_id = cuentas_corrientes.iweb_client_id
        cuenta_corriente.client_id = cuentas_corrientes.client_id
        cuenta_corriente.booking_id = cuentas_corrientes.booking_id
        cuenta_corriente.description = cuentas_corrientes.description
        cuenta_corriente.balance = cuentas_corrientes.balance
        cuenta_corriente.total_bookings = cuentas_corrientes.total_bookings
        cuenta_corriente.total_payments = cuentas_corrientes.total_payments
        cuenta_corriente.created_at = cuentas_corrientes.created_at
        db.commit()
        db.refresh(cuenta_corriente)
        return cuenta_corriente
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/updateCuentaCorrienteProviders/{id}", response_model=cuentasCorrientsProvidersResponse, tags=["Cuentas Corrientes Providers"])
def update_cuenta_corriente_provider(id: str, cuentas_corrientes: cuentasCorrientsProvidersCreateRequest, db: Session = Depends(get_db)):
    try:
        cuenta_corriente = db.query(cuentasCorrientesProviders).filter(cuentasCorrientesProviders.id == id).first()
        if not cuenta_corriente:
            raise HTTPException(status_code=404, detail="Cuenta corriente not found")
        cuenta_corriente.iweb_client_id = cuentas_corrientes.iweb_client_id
        cuenta_corriente.type = cuentas_corrientes.type
        cuenta_corriente.transport_id = cuentas_corrientes.transport_id
        cuenta_corriente.hotel_id = cuentas_corrientes.hotel_id
        cuenta_corriente.detail = cuentas_corrientes.detail
        cuenta_corriente.balance = cuentas_corrientes.balance
        cuenta_corriente.total_consumption = cuentas_corrientes.total_consumption
        cuenta_corriente.total_payments = cuentas_corrientes.total_payments
        cuenta_corriente.created_at = cuentas_corrientes.created_at
        db.commit()
        db.refresh(cuenta_corriente)
        return cuenta_corriente
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# DELETE

@router.delete("/deleteCuentaCorrienteClients/{id}", response_model=cuentasCorrientsClientsResponse, tags=["Cuentas Corrientes Clients"])
def delete_cuenta_corriente_client(id: str, db: Session = Depends(get_db)):
    try:
        cuenta_corriente = db.query(cuentasCorrientsClients).filter(cuentasCorrientsClients.id == id).first()
        if not cuenta_corriente:
            raise HTTPException(status_code=404, detail="Cuenta corriente not found")
        db.delete(cuenta_corriente)
        db.commit()
        return cuenta_corriente
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/deleteCuentaCorrienteProviders/{id}", response_model=cuentasCorrientsProvidersResponse, tags=["Cuentas Corrientes Providers"])
def delete_cuenta_corriente_provider(id: str, db: Session = Depends(get_db)):
    try:
        cuenta_corriente = db.query(cuentasCorrientesProviders).filter(cuentasCorrientesProviders.id == id).first()
        if not cuenta_corriente:
            raise HTTPException(status_code=404, detail="Cuenta corriente not found")
        db.delete(cuenta_corriente)
        db.commit()
        return cuenta_corriente
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# GET ALL

@router.get("/getCuentasCorrientesClients", response_model=Any, tags=["Cuentas Corrientes Clients"])
def get_all_cuentas_corrientes_clients(iweb_client_id: str, page: Optional[int] = Query(None, ge=1), limit: int = Query(5, ge=1), db: Session = Depends(get_db)):
    try:
        q = db.query(cuentasCorrientsClients).filter(cuentasCorrientsClients.iweb_client_id == iweb_client_id)
        if page is not None:
            total = q.count()
            items = q.offset((page - 1) * limit).limit(limit).all()
            total_pages = math.ceil(total / limit) if total > 0 else 1
            return {
                "items": items,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages
            }
        return q.all()
    except Exception as e: 
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/getCuentasCorrientesProviders", response_model=Any, tags=["Cuentas Corrientes Providers"])
def get_all_cuentas_corrientes_providers(iweb_client_id: str, page: Optional[int] = Query(None, ge=1), limit: int = Query(5, ge=1), db: Session = Depends(get_db)):
    try:
        q = db.query(cuentasCorrientesProviders).filter(cuentasCorrientesProviders.iweb_client_id == iweb_client_id)
        if page is not None:
            total = q.count()
            items = q.offset((page - 1) * limit).limit(limit).all()
            total_pages = math.ceil(total / limit) if total > 0 else 1
            return {
                "items": items,
                "total": total,
                "page": page,
                "limit": limit,
                "total_pages": total_pages
            }
        return q.all()
    except Exception as e: 
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

# GET BY ID

@router.get("/getCuentasCorrienteClientsById/{id}", response_model=cuentasCorrientsClientsResponse, tags=["Cuentas Corrientes Clients"])
def get_cuenta_corriente_client_by_id(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    try:
        return db.query(cuentasCorrientsClients).filter(cuentasCorrientsClients.id == id, cuentasCorrientsClients.iweb_client_id == iweb_client_id).first()
    except Exception as e: 
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/getCuentasCorrienteProvidersById/{id}", response_model=cuentasCorrientsProvidersResponse, tags=["Cuentas Corrientes Providers"])
def get_cuenta_corriente_provider_by_id(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    try:
        return db.query(cuentasCorrientesProviders).filter(cuentasCorrientesProviders.id == id, cuentasCorrientesProviders.iweb_client_id == iweb_client_id).first()
    except Exception as e: 
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


# =========================================================================
# CRUD ENDPOINTS: CC PROVIDERS CONSUMPTION PAYMENTS
# =========================================================================

@router.post("/create_cc_providers_consumption_payments", response_model=ccProvidersConsumptionPaymentsResponse, tags=["CC Providers Consumption Payments"])
async def create_cc_provider_consumption_payment(payload: ccProvidersConsumptionPaymentsCreateRequest, db: Session = Depends(get_db)):
    from sqlalchemy import func
    from models.models import iWebClient
    try:
        new_id = str(uuid.uuid4())
        
        parsed_date = None
        if payload.date:
            if isinstance(payload.date, str):
                try:
                    parsed_date = datetime.strptime(payload.date[:10], "%Y-%m-%d").date()
                except Exception:
                    parsed_date = None
            elif isinstance(payload.date, date):
                parsed_date = payload.date

        def clean_id(val: Optional[str]) -> Optional[str]:
            if not val or not str(val).strip():
                return None
            return str(val).strip()

        clean_iweb_id = clean_id(payload.iweb_client_id)
        if clean_iweb_id:
            db_client = db.query(iWebClient).filter(
                func.lower(iWebClient.id) == func.lower(clean_iweb_id)
            ).first()
            if db_client:
                clean_iweb_id = db_client.id

        item = ccProvidersConsumptionPayments(
            id=new_id,
            cc_provider_id=clean_id(payload.cc_provider_id),
            provider_type=clean_id(payload.provider_type),
            hotel_id=clean_id(payload.hotel_id),
            transport_id=clean_id(payload.transport_id),
            date=parsed_date,
            detail=payload.detail,
            type=clean_id(payload.type),
            transf_account=clean_id(payload.transf_account),
            amount=payload.amount,
            iweb_client_id=clean_iweb_id
        )
        db.add(item)
        db.commit()
        db.refresh(item)
        return item
    except Exception as e:
        db.rollback()
        print(f"Error in create_cc_provider_consumption_payment: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/get_cc_providers_consumption_payments", response_model=list[ccProvidersConsumptionPaymentsResponse], tags=["CC Providers Consumption Payments"])
def get_cc_providers_consumption_payments(iweb_client_id: str, db: Session = Depends(get_db)):
    from sqlalchemy import func
    try:
        clean_id = iweb_client_id.strip() if iweb_client_id else ""
        return db.query(ccProvidersConsumptionPayments).filter(
            func.lower(ccProvidersConsumptionPayments.iweb_client_id) == func.lower(clean_id)
        ).all()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/get_cc_providers_consumption_payments_by_cc_id/{cc_provider_id}", response_model=list[ccProvidersConsumptionPaymentsResponse], tags=["CC Providers Consumption Payments"])
def get_cc_providers_consumption_payments_by_cc_id(cc_provider_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    try:
        return db.query(ccProvidersConsumptionPayments).filter(
            ccProvidersConsumptionPayments.cc_provider_id == cc_provider_id,
            ccProvidersConsumptionPayments.iweb_client_id == iweb_client_id
        ).all()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/put_cc_providers_consumption_payments/{id}", response_model=ccProvidersConsumptionPaymentsResponse, tags=["CC Providers Consumption Payments"])
def put_cc_provider_consumption_payment(id: str, payload: ccProvidersConsumptionPaymentsCreateRequest, db: Session = Depends(get_db)):
    try:
        item = db.query(ccProvidersConsumptionPayments).filter(
            ccProvidersConsumptionPayments.id == id,
            ccProvidersConsumptionPayments.iweb_client_id == payload.iweb_client_id
        ).first()
        if not item:
            raise HTTPException(status_code=404, detail="Consumption or payment record not found")
        
        item.cc_provider_id = payload.cc_provider_id
        item.provider_type = payload.provider_type
        item.hotel_id = payload.hotel_id
        item.transport_id = payload.transport_id
        item.date = payload.date
        item.detail = payload.detail
        item.type = payload.type
        item.transf_account = payload.transf_account
        item.amount = payload.amount
        
        db.commit()
        db.refresh(item)
        return item
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete_cc_providers_consumption_payments/{id}", response_model=ccProvidersConsumptionPaymentsResponse, tags=["CC Providers Consumption Payments"])
def delete_cc_provider_consumption_payment(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    try:
        item = db.query(ccProvidersConsumptionPayments).filter(
            ccProvidersConsumptionPayments.id == id,
            ccProvidersConsumptionPayments.iweb_client_id == iweb_client_id
        ).first()
        if not item:
            raise HTTPException(status_code=404, detail="Consumption or payment record not found")
        db.delete(item)
        db.commit()
        return item
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))