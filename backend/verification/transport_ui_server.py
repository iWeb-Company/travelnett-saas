"""Local browser fixture server: python -m verification.transport_ui_server.

Uses only SQLite in memory and binds only to loopback. No production startup hooks.
"""
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from auth.login import get_current_user
from db.database import Base, get_db
from models.models import (iWebClient, User, TransportCompany, BusTypes, Salidas,
                           Passengers, Reservas, ReservationPassengers, Destinos)
from routers import salidas, reservas, transport_units, parameters
from schemas.transport_units import TransportUnitCreate
from services.transport_units import create_unit

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Base.metadata.create_all(engine)
sessions = sessionmaker(engine, expire_on_commit=False)
user = User(id="qa", iweb_client_id="tenant", username="qa", rol="admin", active=1)
with sessions.begin() as db:
    db.add_all([iWebClient(id="tenant", slug="qa", folder_id=1), user,
        TransportCompany(id="company-a", iweb_client_id="tenant", name="Empresa A", type="bus"),
        TransportCompany(id="company-b", iweb_client_id="tenant", name="Empresa B", type="bus"),
        BusTypes(id="mix", iweb_client_id="tenant", name="Mix", semicama_quantity=6, cama_quantity=3, panoramicos_quantity=4),
        Destinos(id="destination", iweb_client_id="tenant", name="Destino QA")])
    for key in ("multi", "legacy"):
        salida = Salidas(id=key, iweb_client_id="tenant", type="bus", active=True, date_of_out="2026-10-01", destino="destination", semicama=0, cama=0)
        db.add(salida)
        db.flush()
        unit = create_unit(db, salida, TransportUnitCreate(transport_company="company-a", price=100, type_bus="mix", coordinador_nombre="Ana", coordinador_telefono="111"), "QA")
        db.add(Reservas(id=f"r-{key}", salida_id=key, iweb_client_id="tenant", active=True, codigo_reserva=f"QA-{key}"))
        for index in range(3):
            passenger_id = f"person-{key}-{index}"
            db.add(Passengers(id=passenger_id, iweb_client_id="tenant", name=f"Nombre{index}", last_name="Prueba"))
            db.add(ReservationPassengers(id=f"rp-{key}-{index}", reserva_id=f"r-{key}", pasajero_id=passenger_id,
                pasajero_type="ADL", butaca_type="semicama", room_index=index,
                salida_transport_unit_id=unit.id if index == 0 else None,
                butaca_number=1 if index == 0 else None, bus_number="1" if index == 0 else None))


def isolated_db():
    with sessions() as db:
        yield db


app = FastAPI()
app.dependency_overrides[get_db] = isolated_db
app.dependency_overrides[get_current_user] = lambda: user
for router in (salidas.router, reservas.router, transport_units.router, parameters.router):
    app.include_router(router)


@app.get("/auth/me")
def me():
    return {"id": user.id, "iweb_client_id": "tenant", "rol": "admin", "username": "qa", "name": "QA"}


@app.get("/iweb-clients/get_iweb_client/{tenant}")
def tenant_details(tenant: str):
    return {"id": "tenant", "slug": "qa", "name": "Agencia QA"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8019)
