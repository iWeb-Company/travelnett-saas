import os
import re
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
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


def _logos_dir() -> Path:
    env = (os.getenv("ENV") or os.getenv("APP_ENV") or "dev").lower()
    if env in {"prod", "production"}:
        return Path("/home/iweb/saas/travelnett-saas/data/images/logos")
    # dev: backend/images/logos
    backend_dir = Path(__file__).resolve().parents[1]
    return backend_dir / "images" / "logos"


def _save_upload(file: UploadFile, dest_path: Path) -> None:
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with dest_path.open("wb") as f:
        while True:
            chunk = file.file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)


@router.post("", response_model=iWebClientResponse)
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="iWeb Client con ese CUIT ya existe",
        )

    slug = _slugify(name)
    logos_dir = _logos_dir()
    xl_ext = _guess_extension(logo_xl.filename or "", logo_xl.content_type)
    s_ext = _guess_extension(logo_s.filename or "", logo_s.content_type)

    xl_filename = f"logo_xl_{slug}{xl_ext}"
    s_filename = f"logo_s_{slug}{s_ext}"

    _save_upload(logo_xl, logos_dir / xl_filename)
    _save_upload(logo_s, logos_dir / s_filename)

    iweb_client = iWebClient(
        id=str(uuid.uuid4()),
        name=name,
        cuit=cuit,
        email=email,
        status=status.lower() in {"true", "1", "yes", "on"},
        logo_xl=f"images/logos/{xl_filename}",
        logo_s=f"images/logos/{s_filename}",
    )
    db.add(iweb_client)
    db.commit()
    db.refresh(iweb_client)
    return iWebClientResponse(
        id=iweb_client.id,
        name=iweb_client.name,
        cuit=iweb_client.cuit,
        email=iweb_client.email,
        status=iweb_client.status,
        logo_xl=iweb_client.logo_xl,
        logo_s=iweb_client.logo_s,
    )


@router.get("")
def list_iweb_clients(db: Session = Depends(get_db)):
    iweb_clients = db.query(iWebClient).all()
    return [
        iWebClientResponse(
            id=i.id,
            name=i.name,
            cuit=i.cuit,
            email=i.email,
            status=i.status,
            logo_xl=i.logo_xl,
            logo_s=i.logo_s,
        )
        for i in iweb_clients
    ]


@router.delete("/{iweb_client_id}")
def delete_iweb_client(iweb_client_id: str, db: Session = Depends(get_db)):
    iweb_client = db.query(iWebClient).filter(iWebClient.id == iweb_client_id).first()
    if not iweb_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="iWeb Client no encontrado",
        )
    # Eliminar los logos de la carpeta de logos
    logos_dir = _logos_dir()
    xl_filename = iweb_client.logo_xl.split("/")[-1]
    s_filename = iweb_client.logo_s.split("/")[-1]
    (logos_dir / xl_filename).unlink(missing_ok=True)
    (logos_dir / s_filename).unlink(missing_ok=True)
    
    db.delete(iweb_client)
    
    db.commit()
    return {"detail": "iWeb Client eliminado correctamente"}

@router.get("/{iweb_client_id}")
def get_iweb_client_by_id(iweb_client_id: str, db: Session = Depends(get_db)):
    iweb_client = db.query(iWebClient).filter(iWebClient.id == iweb_client_id).first()
    if not iweb_client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="iWeb Client no encontrado",
        )
    return iWebClientResponse(
        id=iweb_client.id,
        name=iweb_client.name,
        cuit=iweb_client.cuit,
        email=iweb_client.email,
        status=iweb_client.status,
        logo_xl=iweb_client.logo_xl,
        logo_s=iweb_client.logo_s,
    )
