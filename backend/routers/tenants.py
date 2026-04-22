import os
import re
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from db.database import get_db
from models.models import iWebClient
from schemas.schemas import iWebClientResponse

router = APIRouter(prefix="/iweb-clients", tags=["iWeb Clients"])

_SLUG_RE = re.compile(r"[^a-zA-Z0-9_]+")


def _slugify(value: str) -> str:
    value = value.strip().replace(" ", "_")
    value = _SLUG_RE.sub("", value)
    return value or "empresa"


def _guess_extension(filename: str, content_type: Optional[str]) -> str:
    ext = Path(filename).suffix.lower()
    if ext:
        return ext
    if content_type == "image/png":
        return ".png"
    if content_type == "image/jpeg":
        return ".jpg"
    if content_type == "image/webp":
        return ".webp"
    return ".bin"


def _data_base() -> Path:
    """Base directory for persistent data, outside the repo."""
    env = (os.getenv("ENV") or os.getenv("APP_ENV") or "dev").lower()
    if env in {"prod", "production"}:
        return Path("/home/iweb/saas/data/travelnett")
    # dev: backend/data/travelnett
    backend_dir = Path(__file__).resolve().parents[1]
    return backend_dir / "data" / "travelnett"


def tenant_dir(folder_id: int) -> Path:
    """Root directory for a tenant. Also used by other routers."""
    return _data_base() / "tenants" / str(folder_id)


def _public_data_base_url() -> str:
    configured = os.getenv("PUBLIC_DATA_URL") or os.getenv("NEXT_PUBLIC_DATA_URL")
    if configured:
        return configured.rstrip("/")

    root_path = (os.getenv("APP_ROOT_PATH") or os.getenv("FASTAPI_ROOT_PATH") or "").rstrip("/")
    if root_path.endswith("/api"):
        return f"{root_path[:-4]}/data"

    if root_path:
        return f"{root_path}/data"

    return "/data"


def public_tenant_asset_url(folder_id: int, *parts: str) -> str:
    return "/".join([_public_data_base_url(), "tenants", str(folder_id), *parts])


def _save_upload(file: UploadFile, dest_path: Path) -> None:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with dest_path.open("wb") as f:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)


def _next_folder_id(db: Session) -> int:
    max_id = db.query(func.max(iWebClient.folder_id)).scalar() or 0
    return max_id + 1


def _build_response(i: iWebClient) -> iWebClientResponse:
    return iWebClientResponse(
        id=str(i.id),
        folder_id=int(i.folder_id),
        slug=str(i.slug),
        name=str(i.name or ""),
        cuit=int(i.cuit or 0),
        email=str(i.email or ""),
        status=bool(i.status),
        logo_xl=str(i.logo_xl or ""),
        logo_s=str(i.logo_s or ""),
    )


@router.post("/create_iweb_client", response_model=iWebClientResponse)
def create_iweb_client(
    name: str = Form(...),
    cuit: int = Form(...),
    email: str = Form(...),
    status: str = Form(...),
    logo_xl: UploadFile = File(...),
    logo_s: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    existing = db.query(iWebClient).filter(iWebClient.cuit == cuit).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="An iWeb Client with that CUIT already exists",
        )

    folder_id = _next_folder_id(db)
    logos_dir = tenant_dir(folder_id) / "logos"

    xl_ext = _guess_extension(logo_xl.filename or "", logo_xl.content_type)
    s_ext = _guess_extension(logo_s.filename or "", logo_s.content_type)

    xl_filename = f"logo_xl{xl_ext}"
    s_filename = f"logo_s{s_ext}"

    _save_upload(logo_xl, logos_dir / xl_filename)
    _save_upload(logo_s, logos_dir / s_filename)

    iweb_client = iWebClient(
        id=str(uuid.uuid4()),
        folder_id=folder_id,
        slug=_slugify(name),
        name=name,
        cuit=cuit,
        email=email,
        status=status.lower() in {"true", "1", "yes", "on"},
        logo_xl=public_tenant_asset_url(folder_id, "logos", xl_filename),
        logo_s=public_tenant_asset_url(folder_id, "logos", s_filename),
    )
    db.add(iweb_client)
    db.commit()
    db.refresh(iweb_client)
    return _build_response(iweb_client)


@router.get("/get_iweb_clients")
def list_iweb_clients(db: Session = Depends(get_db)):
    return [_build_response(i) for i in db.query(iWebClient).order_by(iWebClient.folder_id).all()]


@router.delete("/delete_iweb_client/{iweb_client_id}")
def delete_iweb_client(iweb_client_id: str, db: Session = Depends(get_db)):
    iweb_client = db.query(iWebClient).filter(iWebClient.id == iweb_client_id).first()
    if not iweb_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="iWeb Client not found",
        )

    logos_dir = tenant_dir(iweb_client.folder_id) / "logos"
    xl_filename = iweb_client.logo_xl.split("/")[-1]
    s_filename = iweb_client.logo_s.split("/")[-1]
    (logos_dir / xl_filename).unlink(missing_ok=True)
    (logos_dir / s_filename).unlink(missing_ok=True)

    db.delete(iweb_client)
    db.commit()
    return {"detail": "iWeb Client deleted successfully"}


@router.get("/get_iweb_client_by_id/{iweb_client_id}")
def get_iweb_client_by_id(iweb_client_id: str, db: Session = Depends(get_db)):
    iweb_client = db.query(iWebClient).filter(iWebClient.id == iweb_client_id).first()
    if not iweb_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="iWeb Client not found",
        )
    return _build_response(iweb_client)


@router.get("/get_iweb_client")
def get_iweb_client(iweb_client_id: str, db: Session = Depends(get_db)):
    return get_iweb_client_by_id(iweb_client_id=iweb_client_id, db=db)
