from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import inspect
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


def _require_provider_consumption_schema(db: Session) -> None:
    inspector = inspect(db.bind)
    required_tables = {
        "provider_consumption_groups",
        "provider_consumption_contributions",
        "reservation_provider_evaluations",
        "reservation_provider_service_snapshots",
    }
    missing_tables = sorted(table for table in required_tables if not inspector.has_table(table))
    missing_columns = []
    for table, column in (
        (cuentasCorrientesProviders.__tablename__, "provider_id"),
        (ccProvidersConsumptionPayments.__tablename__, "consumption_group_id"),
    ):
        if inspector.has_table(table):
            columns = {item["name"] for item in inspector.get_columns(table)}
            if column not in columns:
                missing_columns.append(f"{table}.{column}")
    if missing_tables or missing_columns:
        details = []
        if missing_tables:
            details.append(f"tablas faltantes: {', '.join(missing_tables)}")
        if missing_columns:
            details.append(f"columnas faltantes: {', '.join(missing_columns)}")
        raise HTTPException(
            status_code=503,
            detail=(
                "Cuentas Corrientes de Proveedores requiere la migración de consumos "
                f"({'; '.join(details)}). Ejecutá backend/migrations/provider_consumptions.py --apply."
            ),
        )


def _parse_movement_date(value):
    if value is None or isinstance(value, date):
        return value
    try:
        return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="date debe tener formato YYYY-MM-DD")


def _is_automatic_provider_consumption(item) -> bool:
    return item.provider_type == "proveedor" or bool(item.consumption_group_id)


def _serialize_provider_movements(db: Session, movements):
    """Enrich one movement per provider group without recalculating its amount."""
    from models.models import Regimenes, Salidas
    from models.providers import Provider
    from models.provider_consumptions import ProviderConsumptionGroup

    group_ids = {row.consumption_group_id for row in movements if row.consumption_group_id}
    groups = db.query(ProviderConsumptionGroup).filter(
        ProviderConsumptionGroup.id.in_(group_ids)
    ).all() if group_ids else []
    groups_by_id = {group.id: group for group in groups}
    salida_ids = {group.salida_id for group in groups if group.salida_id}
    regimen_ids = {group.regimen_id for group in groups if group.regimen_id}
    provider_ids = {group.provider_id for group in groups if group.provider_id}
    salidas = db.query(Salidas).filter(Salidas.id.in_(salida_ids)).all() if salida_ids else []
    regimenes = db.query(Regimenes).filter(Regimenes.id.in_(regimen_ids)).all() if regimen_ids else []
    providers = db.query(Provider).filter(Provider.id.in_(provider_ids)).all() if provider_ids else []
    salidas_by_id = {salida.id: salida for salida in salidas}
    regimenes_by_id = {regimen.id: regimen for regimen in regimenes}
    providers_by_id = {provider.id: provider for provider in providers}

    serialized = []
    for movement in movements:
        group = groups_by_id.get(movement.consumption_group_id)
        provider = providers_by_id.get(group.provider_id) if group else None
        salida = salidas_by_id.get(group.salida_id) if group else None
        regimen = regimenes_by_id.get(group.regimen_id) if group else None
        departure_value = salida.date_of_out if salida else movement.date
        departure_date = str(departure_value)[:10] if departure_value else None
        serialized.append({
            "id": movement.id,
            "cc_provider_id": movement.cc_provider_id,
            "consumption_group_id": movement.consumption_group_id,
            "provider_id": group.provider_id if group else None,
            "provider_name": provider.name if provider else None,
            "provider_type": movement.provider_type,
            "hotel_id": group.hotel_id if group else movement.hotel_id,
            "excursion_id": group.excursion_id if group else None,
            "transport_id": movement.transport_id,
            "salida_id": group.salida_id if group else movement.salida_id,
            "date": movement.date,
            "departure_date": departure_date,
            "regimen": (regimen.sigla or regimen.name) if regimen else None,
            "regimen_id": group.regimen_id if group else None,
            "hotel_fecha_in": group.hotel_fecha_in if group else None,
            "detail": movement.detail,
            "type": movement.type,
            "transf_account": movement.transf_account,
            "amount": movement.amount,
            "iweb_client_id": movement.iweb_client_id,
        })
    return serialized

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
            provider_id=cuentas_corrientes.provider_id,
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
        cuenta_corriente.provider_id = cuentas_corrientes.provider_id
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
    _require_provider_consumption_schema(db)
    if payload.provider_type == "proveedor":
        raise HTTPException(409, "Los consumos de Proveedores se generan automáticamente al crear la reserva")
    if payload.salida_id:
        from models.models import SalidaTransportUnit
        if db.query(SalidaTransportUnit).filter_by(salida_id=payload.salida_id, iweb_client_id=payload.iweb_client_id).first():
            raise HTTPException(409, "El consumo de transporte se gestiona desde el micro")
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
            consumption_group_id=clean_id(payload.consumption_group_id),
            provider_type=clean_id(payload.provider_type),
            hotel_id=clean_id(payload.hotel_id),
            transport_id=clean_id(payload.transport_id),
            salida_id=clean_id(payload.salida_id),
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
        _require_provider_consumption_schema(db)
        clean_id = iweb_client_id.strip() if iweb_client_id else ""
        movements = db.query(ccProvidersConsumptionPayments).filter(
            func.lower(ccProvidersConsumptionPayments.iweb_client_id) == func.lower(clean_id)
        ).order_by(ccProvidersConsumptionPayments.date.asc(), ccProvidersConsumptionPayments.id.asc()).all()
        return _serialize_provider_movements(db, movements)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/get_cc_providers_consumption_payments_by_cc_id/{cc_provider_id}", response_model=list[ccProvidersConsumptionPaymentsResponse], tags=["CC Providers Consumption Payments"])
def get_cc_providers_consumption_payments_by_cc_id(cc_provider_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    try:
        _require_provider_consumption_schema(db)
        movements = db.query(ccProvidersConsumptionPayments).filter(
            ccProvidersConsumptionPayments.cc_provider_id == cc_provider_id,
            ccProvidersConsumptionPayments.iweb_client_id == iweb_client_id
        ).order_by(ccProvidersConsumptionPayments.date.asc(), ccProvidersConsumptionPayments.id.asc()).all()
        return _serialize_provider_movements(db, movements)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/put_cc_providers_consumption_payments/{id}", response_model=ccProvidersConsumptionPaymentsResponse, tags=["CC Providers Consumption Payments"])
def put_cc_provider_consumption_payment(id: str, payload: ccProvidersConsumptionPaymentsCreateRequest, db: Session = Depends(get_db)):
    try:
        _require_provider_consumption_schema(db)
        item = db.query(ccProvidersConsumptionPayments).filter(
            ccProvidersConsumptionPayments.id == id,
            ccProvidersConsumptionPayments.iweb_client_id == payload.iweb_client_id
        ).first()
        if not item:
            raise HTTPException(status_code=404, detail="Consumption or payment record not found")
        if _is_automatic_provider_consumption(item):
            raise HTTPException(409, "Los consumos de Proveedores no se editan manualmente")
        
        if item.salida_transport_unit_id:
            raise HTTPException(409, "Modificá el consumo desde el micro de la salida")
        item.cc_provider_id = payload.cc_provider_id
        item.provider_type = payload.provider_type
        item.hotel_id = payload.hotel_id
        item.transport_id = payload.transport_id
        item.salida_id = payload.salida_id
        item.date = _parse_movement_date(payload.date)
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
        _require_provider_consumption_schema(db)
        item = db.query(ccProvidersConsumptionPayments).filter(
            ccProvidersConsumptionPayments.id == id,
            ccProvidersConsumptionPayments.iweb_client_id == iweb_client_id
        ).first()
        if not item:
            raise HTTPException(status_code=404, detail="Consumption or payment record not found")
        if _is_automatic_provider_consumption(item):
            raise HTTPException(409, "Los consumos de Proveedores se revierten al cancelar la reserva")
        if item.salida_transport_unit_id:
            raise HTTPException(409, "Anulá el micro para conservar el historial del consumo")
        db.delete(item)
        db.commit()
        return item
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
