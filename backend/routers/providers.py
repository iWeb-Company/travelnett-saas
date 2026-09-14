"""Authenticated Parameters > Providers catalog (no accounting endpoints)."""
import unicodedata
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.orm import Session

from auth.login import get_current_user
from db.database import get_db
from models.models import Permission, User
from schemas.providers import ProviderCreate, ProviderUpdate, ProviderResponse, ProviderPage
from services import providers

router = APIRouter(prefix='/parameters/providers', tags=['Proveedores'])


def normalize(value):
    return ''.join(c for c in unicodedata.normalize('NFD', value or '')
                   if not unicodedata.combining(c)).strip().lower()


def authorize(iweb_client_id: str = Query(min_length=1, max_length=36),
              user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = normalize(user.rol)
    global_admin = user.iweb_client_id == 'GLOBAL' and (role == 'admin' or user.username == 'iweb_admin')
    if not user.active or (user.iweb_client_id != iweb_client_id and not global_admin):
        raise HTTPException(403, 'No tenés acceso a esta agencia')
    if role != 'admin' and not global_admin:
        permissions = db.query(Permission).filter_by(iweb_client_id=iweb_client_id).all()
        if not any(p.parametros and role in {normalize(p.id), normalize(p.name)} for p in permissions):
            raise HTTPException(403, 'No tenés permiso para gestionar parámetros')
    providers.require_schema(db)
    return user


def finish(db, operation):
    try:
        result = operation()
        db.commit()
        return result
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, 'Conflicto al guardar el proveedor; recargá los datos') from None
    except OperationalError as exc:
        db.rollback()
        code = exc.orig.args[0] if exc.orig.args else None
        if code in (1205, 1213) or 'locked' in str(exc.orig).lower():
            raise HTTPException(409, 'Otra operación está modificando proveedores; reintentá') from None
        raise
    except Exception:
        db.rollback()
        raise


@router.get('', response_model=ProviderPage)
def list_providers(iweb_client_id: str, page: int = Query(1, ge=1),
                   page_size: int = Query(20, ge=1, le=100), search: str = Query('', max_length=255),
                   user: User = Depends(authorize), db: Session = Depends(get_db)):
    return providers.list_providers(db, iweb_client_id, page, page_size, search.strip())


@router.post('', response_model=ProviderResponse, status_code=201)
def create_provider(iweb_client_id: str, body: ProviderCreate,
                    user: User = Depends(authorize), db: Session = Depends(get_db)):
    return finish(db, lambda: providers.save_provider(db, iweb_client_id, body))


@router.get('/{provider_id}', response_model=ProviderResponse)
def get_provider(provider_id: UUID, iweb_client_id: str,
                 user: User = Depends(authorize), db: Session = Depends(get_db)):
    return providers.serialize(providers.get_provider(db, iweb_client_id, str(provider_id)))


@router.put('/{provider_id}', response_model=ProviderResponse)
def update_provider(provider_id: UUID, iweb_client_id: str, body: ProviderUpdate,
                    user: User = Depends(authorize), db: Session = Depends(get_db)):
    return finish(db, lambda: providers.save_provider(db, iweb_client_id, body, str(provider_id)))


@router.delete('/{provider_id}', response_model=ProviderResponse)
def delete_provider(provider_id: UUID, iweb_client_id: str, revision: int = Query(ge=1),
                    user: User = Depends(authorize), db: Session = Depends(get_db)):
    return finish(db, lambda: providers.delete_provider(db, iweb_client_id, str(provider_id), revision))
