import uuid

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from routers import login, tenants
from db.database import SessionLocal
from models.models import User, iWebClient
from auth.login import get_password_hash

app = FastAPI()

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

# dev-only: servir archivos locales para ver logos rápidamente
images_dir = Path("images")
images_dir.mkdir(parents=True, exist_ok=True)
app.mount("/images", StaticFiles(directory=str(images_dir)), name="images")


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
