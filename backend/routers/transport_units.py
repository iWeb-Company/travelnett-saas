import unicodedata

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.login import get_current_user
from db.database import get_db
from models.models import Salidas, User, Permission
from schemas.transport_units import TransportUnitCreate, TransportUnitUpdate, TransportUnitResponse, SeatAssignments
from services.availability import get_inventory_db
from services.transport_units import (units_for, create_unit, update_unit, cancel_unit,
                                      save_assignments, require_transport_units_schema)

router = APIRouter(prefix="/salidas/{salida_id}/transport-units", tags=["Micros de salida"])


def authorize(iweb_client_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not user.active or user.iweb_client_id not in {iweb_client_id, "GLOBAL"}:
        raise HTTPException(403, "No tenés acceso a esta agencia")
    def normalize(value):
        return "".join(c for c in unicodedata.normalize("NFD", value or "") if not unicodedata.combining(c)).strip().lower()
    role = normalize(user.rol)
    if role != "admin" and user.username != "iweb_admin":
        permissions = db.query(Permission).filter_by(iweb_client_id=iweb_client_id).all()
        if not any(p.salidas and role in {normalize(p.id), normalize(p.name)} for p in permissions):
            raise HTTPException(403, "No tenés permiso para gestionar salidas")
    return user


def departure(db, salida_id, tenant):
    salida = db.query(Salidas).filter_by(id=salida_id, iweb_client_id=tenant).first()
    if not salida:
        raise HTTPException(404, "Salida no encontrada")
    return salida


def unit_by_id(db, salida, unit_id):
    unit = next((u for u in units_for(db, salida) if u.id == unit_id), None)
    if not unit:
        raise HTTPException(404, "Micro no encontrado en la salida")
    return unit


def finish(db, operation):
    try:
        result = operation()
        db.commit()
        db.refresh(result)
        return result
    except Exception:
        db.rollback()
        raise


@router.get("", response_model=list[TransportUnitResponse])
def list_units(salida_id: str, iweb_client_id: str, user: User = Depends(authorize), db: Session = Depends(get_db)):
    return units_for(db, departure(db, salida_id, iweb_client_id))


@router.post("", response_model=TransportUnitResponse, status_code=201)
def add_unit(salida_id: str, iweb_client_id: str, body: TransportUnitCreate,
             db: Session = Depends(get_inventory_db), user: User = Depends(authorize)):
    require_transport_units_schema(db)
    salida = departure(db, salida_id, iweb_client_id)
    return finish(db, lambda: create_unit(db, salida, body, user.username or user.id))


@router.patch("/{unit_id}", response_model=TransportUnitResponse)
def edit_unit(salida_id: str, unit_id: str, iweb_client_id: str, body: TransportUnitUpdate,
              db: Session = Depends(get_inventory_db), user: User = Depends(authorize)):
    require_transport_units_schema(db)
    salida = departure(db, salida_id, iweb_client_id)
    unit = unit_by_id(db, salida, unit_id)
    return finish(db, lambda: update_unit(db, salida, unit, body, user.username or user.id))


@router.delete("/{unit_id}", response_model=TransportUnitResponse)
def remove_unit(salida_id: str, unit_id: str, iweb_client_id: str,
                db: Session = Depends(get_inventory_db), user: User = Depends(authorize)):
    require_transport_units_schema(db)
    salida = departure(db, salida_id, iweb_client_id)
    unit = unit_by_id(db, salida, unit_id)
    return finish(db, lambda: cancel_unit(db, salida, unit, user.username or user.id))


@router.put("/{unit_id}/seat-assignments", response_model=TransportUnitResponse)
def assign_seats(salida_id: str, unit_id: str, iweb_client_id: str, body: SeatAssignments,
                 db: Session = Depends(get_inventory_db), user: User = Depends(authorize)):
    require_transport_units_schema(db)
    salida = departure(db, salida_id, iweb_client_id)
    unit = unit_by_id(db, salida, unit_id)
    return finish(db, lambda: save_assignments(db, salida, unit, body))
