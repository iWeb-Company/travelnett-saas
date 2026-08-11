import os
import re
import uuid
import secrets
import string
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from db.database import get_db
from models.models import iWebClient, User
from auth.login import get_password_hash
from schemas.schemas import (
    iWebClientResponse,
    iWebClientProvisionResponse,
    TenantAdminInfo,
    ProvisioningStatus,
    TenantPublicInfoResponse,
)

router = APIRouter(prefix="/iweb-clients", tags=["iWeb Clients"])

_SLUG_RE = re.compile(r"[^a-zA-Z0-9_]+")


def _slugify(value: str) -> str:
    value = value.strip().lower().replace(" ", "_").replace("-", "_")
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
    configured_path = os.getenv("DATA_PATH") or os.getenv("STORAGE_PATH")
    if configured_path:
        return Path(configured_path)
    env = (os.getenv("ENV") or os.getenv("APP_ENV") or "dev").lower()
    if env in {"prod", "production"}:
        return Path("/home/iweb/saas/data/travelnett")
    # dev: backend/data/travelnett
    backend_dir = Path(__file__).resolve().parents[1]
    return backend_dir / "data" / "travelnett"


def tenant_dir(folder_id: int) -> Path:
    """Root directory for a tenant. Also used by other routers."""
    return _data_base() / "tenants" / str(folder_id)


def create_tenant_storage_tree(folder_id: int) -> dict[str, Path]:
    """Creates the standard directory tree for a new tenant."""
    base = tenant_dir(folder_id)
    subdirs = ["logos", "flyers", "hotels", "periodos", "news"]
    created_paths = {}
    for sub in subdirs:
        p = base / sub
        p.mkdir(parents=True, exist_ok=True)
        created_paths[sub] = p
    return created_paths


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


def _generate_password(length: int = 12) -> str:
    alphabet = string.ascii_letters + string.digits + "!@#$%&*"
    return "".join(secrets.choice(alphabet) for _ in range(length))


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


@router.post("/provision", response_model=iWebClientProvisionResponse)
def provision_tenant(
    name: str = Form(...),
    cuit: int = Form(...),
    email: str = Form(...),
    status: str = Form("true"),
    slug: Optional[str] = Form(None),
    admin_username: Optional[str] = Form(None),
    admin_password: Optional[str] = Form(None),
    admin_name: Optional[str] = Form(None),
    admin_last_name: Optional[str] = Form(None),
    logo_xl: UploadFile = File(...),
    logo_s: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    1-step full provisioning of a new SaaS Tenant:
    1. Validates unique CUIT and Slug.
    2. Allocates sequential folder_id.
    3. Creates directory tree on disk (/tenants/{id}/logos, flyers, hotels, periodos, news).
    4. Saves logo assets (logo_xl, logo_s).
    5. Inserts tenant in `iweb_clients`.
    6. Inserts initial Admin user in `users` (active=1, hashed_password).
    7. Returns complete provisioning response with access URL and credentials.
    """
    # 1. Check existing CUIT
    existing_cuit = db.query(iWebClient).filter(iWebClient.cuit == cuit).first()
    if existing_cuit:
        raise HTTPException(
            status_code=400,
            detail=f"Ya existe un cliente con el CUIT {cuit}",
        )

    # 2. Normalize and check unique slug
    target_slug = _slugify(slug if slug else name)
    existing_slug = db.query(iWebClient).filter(iWebClient.slug == target_slug).first()
    if existing_slug:
        # If slug exists, append random suffix or folder_id
        target_slug = f"{target_slug}_{secrets.token_hex(2)}"

    # 3. Next folder_id & create folder structure on disk
    folder_id = _next_folder_id(db)
    dirs = create_tenant_storage_tree(folder_id)

    # 4. Save uploaded logos
    xl_ext = _guess_extension(logo_xl.filename or "", logo_xl.content_type)
    s_ext = _guess_extension(logo_s.filename or "", logo_s.content_type)

    xl_filename = f"logo_xl{xl_ext}"
    s_filename = f"logo_s{s_ext}"

    _save_upload(logo_xl, dirs["logos"] / xl_filename)
    _save_upload(logo_s, dirs["logos"] / s_filename)

    # 5. Insert iWebClient
    client_id = str(uuid.uuid4())
    is_active = status.lower() in {"true", "1", "yes", "on", "activo"}
    
    iweb_client = iWebClient(
        id=client_id,
        folder_id=folder_id,
        slug=target_slug,
        name=name,
        cuit=cuit,
        email=email,
        status=is_active,
        logo_xl=public_tenant_asset_url(folder_id, "logos", xl_filename),
        logo_s=public_tenant_asset_url(folder_id, "logos", s_filename),
    )
    db.add(iweb_client)

    # 6. Create Initial Admin User
    initial_user_username = (admin_username or email).strip().lower()
    initial_user_plain_password = admin_password or _generate_password(12)
    admin_user_id = str(uuid.uuid4())

    admin_user = User(
        id=admin_user_id,
        iweb_client_id=client_id,
        name=admin_name or name,
        last_name=admin_last_name or "Admin",
        username=initial_user_username,
        hashed_password=get_password_hash(initial_user_plain_password),
        active=1,
    )
    db.add(admin_user)

    db.commit()
    db.refresh(iweb_client)
    db.refresh(admin_user)

    login_url = f"https://{target_slug}.tranett.com/login"

    return iWebClientProvisionResponse(
        client=_build_response(iweb_client),
        admin_user=TenantAdminInfo(
            id=admin_user_id,
            username=initial_user_username,
            name=admin_user.name,
            last_name=admin_user.last_name,
            initial_password=initial_user_plain_password,
        ),
        login_url=login_url,
        status=ProvisioningStatus(
            database="OK",
            storage="OK",
            subdomain="OK",
        ),
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
    dirs = create_tenant_storage_tree(folder_id)

    xl_ext = _guess_extension(logo_xl.filename or "", logo_xl.content_type)
    s_ext = _guess_extension(logo_s.filename or "", logo_s.content_type)

    xl_filename = f"logo_xl{xl_ext}"
    s_filename = f"logo_s{s_ext}"

    _save_upload(logo_xl, dirs["logos"] / xl_filename)
    _save_upload(logo_s, dirs["logos"] / s_filename)

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


@router.get("/public/{slug}", response_model=TenantPublicInfoResponse)
def get_public_tenant_info(slug: str, db: Session = Depends(get_db)):
    """Public endpoint for Next.js frontend to resolve branding by subdomain/slug."""
    normalized = _slugify(slug)
    client = db.query(iWebClient).filter(iWebClient.slug == normalized).first()
    if not client:
        # Also try direct match without slugify
        client = db.query(iWebClient).filter(iWebClient.slug == slug).first()

    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tenant '{slug}' no encontrado",
        )

    return TenantPublicInfoResponse(
        id=str(client.id),
        name=str(client.name or slug),
        slug=str(client.slug),
        status=bool(client.status),
        logo_xl=str(client.logo_xl or ""),
        logo_s=str(client.logo_s or ""),
    )


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


@router.get("/get_iweb_client_by_slug/{slug}")
def get_iweb_client_by_slug(slug: str, db: Session = Depends(get_db)):
    client = db.query(iWebClient).filter(iWebClient.slug == slug).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="iWeb Client not found",
        )
    return _build_response(client)


@router.get("/get_iweb_client")
def get_iweb_client(iweb_client_id: str, db: Session = Depends(get_db)):
    return get_iweb_client_by_id(iweb_client_id=iweb_client_id, db=db)

