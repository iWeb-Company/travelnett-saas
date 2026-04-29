import uuid

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from routers import login, tenants, parameters, permissions, web
from db.database import SessionLocal
from models.models import User, iWebClient
from auth.login import get_password_hash

app = FastAPI(
    root_path="/MdpuF8KsXiRArNIHtI6pXO2XyLSJMTQ8_Tranett/api",
    docs_url="/docs",
    openapi_url="/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Tranett SaaS API is running correctly"}

app.include_router(login.router)
app.include_router(tenants.router)
app.include_router(parameters.router)
app.include_router(permissions.router)
app.include_router(web.router)

# En dev: FastAPI sirve los archivos estáticos directamente.
# En prod: nginx los sirve desde /home/iweb/data/travelnett/ sin pasar por FastAPI.
import os as _os
if (_os.getenv("ENV") or _os.getenv("APP_ENV") or "dev").lower() not in {"prod", "production"}:
    _data_dir = Path(__file__).resolve().parent / "data" / "travelnett"  # dev only
    _data_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/data", StaticFiles(directory=str(_data_dir)), name="data")


@app.on_event("startup")
def seed_default_admin():
    """
    Crea un usuario admin global por defecto si no existe.
    Nota: requiere que la tabla `users` ya exista en la base.
    """
    # Esto corre en cada arranque del proceso de servidor (incluye reload de uvicorn)
    db = SessionLocal()
    try:
        username = "iweb_admin"
        password = "Iweb.2026!"
        global_tenant_id = "GLOBAL"

        global_tenant = db.query(iWebClient).filter(iWebClient.id == global_tenant_id).first()
        if not global_tenant:
            global_tenant = iWebClient(
                id=global_tenant_id,
                folder_id=0,  # reservado para el tenant global de plataforma
                name="GLOBAL",
                cuit=0,
                email="admin@iweb.local",
                status=True,
                logo_xl="",
                logo_s="",
            )
            db.add(global_tenant)
            db.commit()

        existing = db.query(User).filter(User.username == username).first()
        if existing:
            return

        admin = User(
            id=str(uuid.uuid4()),
            # "tenant" global para este usuario (modelo actual requiere no-null)
            iweb_client_id=global_tenant_id,
            name="iWeb",
            last_name="Admin",
            username=username,
            hashed_password=get_password_hash(password),
            active=1,
        )
        db.add(admin)
        db.commit()
    except Exception:
        # Si la DB/tablas no están listas aún, no rompemos el arranque.
        db.rollback()
    finally:
        db.close()
