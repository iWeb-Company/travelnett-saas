"""HTTP regressions for the package web-capacity flag and reservation balance."""

import asyncio
import json
import unittest
from urllib.parse import urlencode

from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from db.database import Base, get_db
from auth.login import get_current_user
from models.models import (
    Liquidaciones,
    LugaresCarga,
    Pagos,
    Passengers,
    ReservationPassengers,
    Reservas,
    Salidas,
    SalidaTransportUnit,
    SalidasLugaresCarga,
    User,
    iWebClient,
)
from routers import packages, reservas, salidas


async def request(app, method, path, *, params=None, payload=None):
    body = json.dumps(payload).encode() if payload is not None else b""
    messages = []
    request_sent = False

    async def receive():
        nonlocal request_sent
        if request_sent:
            return {"type": "http.disconnect"}
        request_sent = True
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message):
        messages.append(message)

    headers = [(b"content-type", b"application/json")] if payload is not None else []
    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode(),
        "query_string": urlencode(params or {}).encode(),
        "headers": headers,
        "client": ("test", 50000),
        "server": ("test", 80),
        "root_path": "",
    }
    await app(scope, receive, send)
    start = next(message for message in messages if message["type"] == "http.response.start")
    response_body = b"".join(
        message.get("body", b"")
        for message in messages
        if message["type"] == "http.response.body"
    )
    return start["status"], json.loads(response_body or b"null")


class NewTasksHttpTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.sessions = sessionmaker(self.engine, expire_on_commit=False)
        with self.sessions.begin() as db:
            db.add(iWebClient(id="tenant", folder_id=1, slug="tenant"))

        self.user = User(
            id="operator",
            iweb_client_id="tenant",
            username="operator",
            name="Operator",
            active=1,
        )

        app = FastAPI()

        def isolated_db():
            with self.sessions() as db:
                yield db

        app.dependency_overrides[get_db] = isolated_db
        app.dependency_overrides[get_current_user] = lambda: self.user
        app.include_router(packages.router)
        app.include_router(reservas.router)
        app.include_router(salidas.router)
        self.app = app

    def tearDown(self):
        self.engine.dispose()

    def test_package_cupo_web_round_trip(self):
        status, created = asyncio.run(request(
            self.app,
            "POST",
            "/packages/create_package",
            params={"iweb_client_id": "tenant"},
            payload={"name": "Paquete HTTP", "cupo_web": False},
        ))
        self.assertEqual(status, 200, created)
        package_id = created["id"]
        self.assertFalse(created["cupo_web"])

        status, updated = asyncio.run(request(
            self.app,
            "PUT",
            f"/packages/update_package/{package_id}",
            params={"iweb_client_id": "tenant"},
            payload={"cupo_web": True},
        ))
        self.assertEqual(status, 200, updated)
        self.assertTrue(updated["cupo_web"])

    def test_reservation_list_returns_net_pending_balance(self):
        with self.sessions.begin() as db:
            db.add_all(
                [
                    Salidas(
                        id="departure",
                        iweb_client_id="tenant",
                        date_of_out="2026-10-20",
                    ),
                    Reservas(
                        id="booking",
                        iweb_client_id="tenant",
                        salida_id="departure",
                        codigo_reserva="R86-1",
                        active=True,
                    ),
                    Liquidaciones(
                        id="liquidation",
                        iweb_client_id="tenant",
                        booking_id="booking",
                        total_amout=1000,
                        total_commission=900,
                        commission=100,
                    ),
                    Pagos(
                        id="payment",
                        iweb_client_id="tenant",
                        reserva_id="booking",
                        amount=300,
                    ),
                ]
            )

        status, response = asyncio.run(request(
            self.app,
            "GET",
            "/reservas/get_reservas",
            params={"iweb_client_id": "tenant", "salida_id": "departure"},
        ))
        self.assertEqual(status, 200, response)
        self.assertEqual(response[0]["balance"], 600)
        self.assertEqual(response[0]["fecha"], "2026-10-20")

    def test_bulk_boarding_assignment_updates_selected_passengers_only(self):
        with self.sessions.begin() as db:
            db.add_all(
                [
                    self.user,
                    Salidas(
                        id="departure-boarding",
                        iweb_client_id="tenant",
                        date_of_out="2026-10-20",
                        destino="destination",
                    ),
                    LugaresCarga(
                        id="boarding-a",
                        iweb_client_id="tenant",
                        name="Lugar A",
                    ),
                    LugaresCarga(
                        id="boarding-b",
                        iweb_client_id="tenant",
                        name="Lugar B",
                    ),
                    SalidasLugaresCarga(
                        id="departure-boarding-places",
                        iweb_client_id="tenant",
                        salida_id="departure-boarding",
                        cargas="boarding-a, boarding-b",
                        horarios="08:00, 08:30",
                    ),
                    Reservas(
                        id="boarding-booking",
                        iweb_client_id="tenant",
                        salida_id="departure-boarding",
                        lugar_carga_id="boarding-a",
                        active=True,
                    ),
                    Passengers(
                        id="boarding-person-1",
                        iweb_client_id="tenant",
                        name="Ana",
                        last_name="Uno",
                    ),
                    Passengers(
                        id="boarding-person-2",
                        iweb_client_id="tenant",
                        name="Beto",
                        last_name="Dos",
                    ),
                    Passengers(
                        id="boarding-person-3",
                        iweb_client_id="tenant",
                        name="Cata",
                        last_name="Tres",
                    ),
                    ReservationPassengers(
                        id="boarding-rp-1",
                        reserva_id="boarding-booking",
                        pasajero_id="boarding-person-1",
                        pasajero_type="ADL",
                        lugar_carga_id="boarding-a",
                    ),
                    ReservationPassengers(
                        id="boarding-rp-2",
                        reserva_id="boarding-booking",
                        pasajero_id="boarding-person-2",
                        pasajero_type="ADL",
                        lugar_carga_id="boarding-a",
                    ),
                    ReservationPassengers(
                        id="boarding-rp-3",
                        reserva_id="boarding-booking",
                        pasajero_id="boarding-person-3",
                        pasajero_type="ADL",
                        lugar_carga_id="boarding-a",
                    ),
                ]
            )

        status, response = asyncio.run(
            request(
                self.app,
                "PATCH",
                "/salidas/departure-boarding/reservation-passengers/lugar-carga",
                params={"iweb_client_id": "tenant"},
                payload={
                    "reservation_passenger_ids": [
                        "boarding-rp-1",
                        "boarding-rp-3",
                    ],
                    "lugar_carga_id": "boarding-b",
                },
            )
        )

        self.assertEqual(status, 200, response)
        self.assertEqual(response["updated_passengers"], 2)
        with self.sessions() as db:
            self.assertEqual(
                db.get(ReservationPassengers, "boarding-rp-1").lugar_carga_id,
                "boarding-b",
            )
            self.assertEqual(
                db.get(ReservationPassengers, "boarding-rp-2").lugar_carga_id,
                "boarding-a",
            )
            self.assertEqual(
                db.get(ReservationPassengers, "boarding-rp-3").lugar_carga_id,
                "boarding-b",
            )
            self.assertEqual(
                db.get(Reservas, "boarding-booking").lugar_carga_id,
                "boarding-a",
            )

    def test_bulk_boarding_assignment_updates_place_and_bus_for_selected_passengers(self):
        with self.sessions.begin() as db:
            db.add_all(
                [
                    self.user,
                    Salidas(
                        id="departure-boarding-bus",
                        iweb_client_id="tenant",
                        date_of_out="2026-10-20",
                        destino="destination",
                    ),
                    SalidaTransportUnit(
                        id="boarding-bus-1",
                        iweb_client_id="tenant",
                        salida_id="departure-boarding-bus",
                        number=1,
                        transport_company="transport-company",
                        price=0,
                        semicama=20,
                        cama=0,
                        layout_snapshot={},
                        active=True,
                    ),
                    LugaresCarga(
                        id="boarding-bus-place",
                        iweb_client_id="tenant",
                        name="Lugar Bus",
                    ),
                    SalidasLugaresCarga(
                        id="departure-boarding-bus-places",
                        iweb_client_id="tenant",
                        salida_id="departure-boarding-bus",
                        cargas="boarding-bus-place",
                        horarios="08:00",
                    ),
                    Reservas(
                        id="boarding-bus-booking",
                        iweb_client_id="tenant",
                        salida_id="departure-boarding-bus",
                        lugar_carga_id="reservation-root-place",
                        active=True,
                    ),
                    Passengers(
                        id="boarding-bus-person-1",
                        iweb_client_id="tenant",
                        name="Dina",
                        last_name="Cuatro",
                    ),
                    Passengers(
                        id="boarding-bus-person-2",
                        iweb_client_id="tenant",
                        name="Ernesto",
                        last_name="Cinco",
                    ),
                    ReservationPassengers(
                        id="boarding-bus-rp-1",
                        reserva_id="boarding-bus-booking",
                        pasajero_id="boarding-bus-person-1",
                        pasajero_type="ADL",
                        lugar_carga_id=None,
                    ),
                    ReservationPassengers(
                        id="boarding-bus-rp-2",
                        reserva_id="boarding-bus-booking",
                        pasajero_id="boarding-bus-person-2",
                        pasajero_type="ADL",
                        lugar_carga_id=None,
                    ),
                ]
            )

        status, response = asyncio.run(
            request(
                self.app,
                "PATCH",
                "/salidas/departure-boarding-bus/reservation-passengers/lugar-carga",
                params={"iweb_client_id": "tenant"},
                payload={
                    "reservation_passenger_ids": ["boarding-bus-rp-1"],
                    "lugar_carga_id": "boarding-bus-place",
                    "bus_number": "1",
                },
            )
        )

        self.assertEqual(status, 200, response)
        self.assertEqual(response["updated_passengers"], 1)
        self.assertEqual(response["lugar_carga_id"], "boarding-bus-place")
        self.assertEqual(response["bus_number"], "1")

        status, response = asyncio.run(
            request(
                self.app,
                "PATCH",
                "/salidas/departure-boarding-bus/reservation-passengers/lugar-carga",
                params={"iweb_client_id": "tenant"},
                payload={
                    "reservation_passenger_ids": ["boarding-bus-rp-2"],
                    "lugar_carga_id": None,
                    "bus_number": "1",
                },
            )
        )

        self.assertEqual(status, 200, response)
        self.assertIsNone(response["lugar_carga_id"])
        self.assertEqual(response["bus_number"], "1")
        with self.sessions() as db:
            selected = db.get(ReservationPassengers, "boarding-bus-rp-1")
            untouched = db.get(ReservationPassengers, "boarding-bus-rp-2")
            self.assertEqual(selected.lugar_carga_id, "boarding-bus-place")
            self.assertEqual(selected.bus_number, "1")
            self.assertEqual(selected.salida_transport_unit_id, "boarding-bus-1")
            self.assertIsNone(untouched.lugar_carga_id)
            self.assertEqual(untouched.bus_number, "1")
            self.assertEqual(
                untouched.salida_transport_unit_id,
                "boarding-bus-1",
            )
            self.assertEqual(
                db.get(Reservas, "boarding-bus-booking").lugar_carga_id,
                "reservation-root-place",
            )

    def test_bulk_boarding_assignment_rejects_request_without_changes(self):
        with self.sessions.begin() as db:
            db.add_all(
                [
                    self.user,
                    Salidas(
                        id="departure-no-bulk-change",
                        iweb_client_id="tenant",
                        date_of_out="2026-10-20",
                    ),
                ]
            )

        status, response = asyncio.run(
            request(
                self.app,
                "PATCH",
                "/salidas/departure-no-bulk-change/reservation-passengers/lugar-carga",
                params={"iweb_client_id": "tenant"},
                payload={
                    "reservation_passenger_ids": ["missing-passenger"],
                    "lugar_carga_id": None,
                    "bus_number": None,
                },
            )
        )

        self.assertEqual(status, 400, response)
        self.assertIn("ascenso", response["detail"])

    def test_bulk_boarding_assignment_rejects_invalid_selection_atomically(self):
        with self.sessions.begin() as db:
            db.add_all(
                [
                    self.user,
                    Salidas(
                        id="departure-atomic",
                        iweb_client_id="tenant",
                        date_of_out="2026-10-20",
                    ),
                    LugaresCarga(
                        id="atomic-place",
                        iweb_client_id="tenant",
                        name="Lugar válido",
                    ),
                    SalidasLugaresCarga(
                        id="departure-atomic-places",
                        iweb_client_id="tenant",
                        salida_id="departure-atomic",
                        cargas="atomic-place",
                        horarios="08:00",
                    ),
                    Reservas(
                        id="atomic-booking",
                        iweb_client_id="tenant",
                        salida_id="departure-atomic",
                        active=True,
                    ),
                    ReservationPassengers(
                        id="atomic-rp",
                        reserva_id="atomic-booking",
                        pasajero_id="atomic-person",
                        pasajero_type="ADL",
                        lugar_carga_id="atomic-place",
                    ),
                ]
            )

        status, response = asyncio.run(
            request(
                self.app,
                "PATCH",
                "/salidas/departure-atomic/reservation-passengers/lugar-carga",
                params={"iweb_client_id": "tenant"},
                payload={
                    "reservation_passenger_ids": ["atomic-rp", "missing-rp"],
                    "lugar_carga_id": "atomic-place",
                },
            )
        )

        self.assertEqual(status, 404, response)
        with self.sessions() as db:
            self.assertEqual(
                db.get(ReservationPassengers, "atomic-rp").lugar_carga_id,
                "atomic-place",
            )


if __name__ == "__main__":
    unittest.main()
