"""Regression tests using SQLite only; no production database connections."""
import asyncio
import unittest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from db.database import Base
from models.models import Passengers
from routers.parameters import create_passengers, update_passengers
from schemas.schemas import CreatePassengersRequest, UpdatePassengersRequest


class ReservationFixTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine, expire_on_commit=False)

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_phone_is_optional_in_passenger_create_and_update(self):
        for fields in ({}, {"phone": None}):
            p = asyncio.run(create_passengers(CreatePassengersRequest(name="Ana", **fields), "tenant", self.db))
            self.assertIsNone(p.phone)
            p = asyncio.run(update_passengers(p.id, UpdatePassengersRequest(phone="123"), "tenant", self.db))
            self.assertEqual(p.phone, "123")
            p = asyncio.run(update_passengers(p.id, UpdatePassengersRequest(name="Ana María"), "tenant", self.db))
            self.assertEqual(p.phone, "123")
            p = asyncio.run(update_passengers(p.id, UpdatePassengersRequest(phone=None), "tenant", self.db))
            self.assertIsNone(self.db.get(Passengers, p.id).phone)

    def financial_booking(self):
        from models.models import Packages, PackageHotels, Reservas, ReservationPassengers, Hotels
        self.db.add_all([
            Hotels(id="h1", iweb_client_id="tenant", name="Hotel Uno"),
            Packages(id="pkg", iweb_client_id="tenant", price=100, gastos=10),
            PackageHotels(id="ph1", package_id="pkg", hotel_id="h1", iweb_client_id="tenant", tarifa_doble=100, pricing_type="persona"),
            Reservas(id="res", iweb_client_id="tenant", package_id="pkg", hotel_id="h1", room_type='["doble_matrimonial_estandar"]', commission=10),
        ])
        for i in range(2):
            self.db.add_all([
                Passengers(id=f"p{i}", iweb_client_id="tenant"),
                ReservationPassengers(id=f"rp{i}", reserva_id="res", pasajero_id=f"p{i}", pasajero_type="ADL", hotel_id="h1", room_index=0),
            ])
        self.db.commit()
        from routers.liquidaciones import get_liquidacion_by_booking
        return get_liquidacion_by_booking("res", self.db)

    def test_deleted_admin_stays_deleted_after_reload_and_repricing(self):
        from models.models import Packages, Liquidaciones
        from routers.liquidaciones import update_liquidacion, get_liquidacion_by_booking
        from schemas.schemas import LiquidacionCreateRequest
        liq = self.financial_booking()
        self.assertEqual(liq.total_amout, 220)
        self.assertEqual(liq.commission, 20)
        updated = update_liquidacion(liq.id, LiquidacionCreateRequest(
            iweb_client_id="tenant", booking_id="res", expenses_only=True, gastos=[]), self.db)
        self.assertEqual(updated.total_amout, 200)
        self.assertEqual(updated.total_commission, 200)
        self.assertEqual(updated.commission, 20)
        self.assertEqual(updated.gastos, [])
        self.assertEqual(self.db.get(Liquidaciones, liq.id).admin_gastos_override, 0)
        self.db.get(Packages, "pkg").gastos = 999
        self.db.commit()
        for _ in range(2):
            loaded = get_liquidacion_by_booking("res", self.db)
            self.assertEqual(loaded.gastos, [])
            self.assertEqual(loaded.total_amout, 200)
        update_liquidacion(liq.id, LiquidacionCreateRequest(iweb_client_id="tenant", booking_id="res", expenses_only=True,
            gastos=[{"name": "Extra", "amount": 15}]), self.db)
        loaded = get_liquidacion_by_booking("res", self.db)
        self.assertEqual(loaded.total_amout, 215)
        self.assertEqual(loaded.commission, 20)

    def test_unchanged_admin_keeps_automatic_repricing(self):
        from models.models import Packages, Liquidaciones
        from routers.liquidaciones import update_liquidacion, get_liquidacion_by_booking
        from schemas.schemas import LiquidacionCreateRequest
        liq = self.financial_booking()
        update_liquidacion(liq.id, LiquidacionCreateRequest(iweb_client_id="tenant", booking_id="res", expenses_only=True,
            gastos=[g.model_dump() for g in liq.gastos] + [{"name": "Extra", "amount": 15}]), self.db)
        self.assertIsNone(self.db.get(Liquidaciones, liq.id).admin_gastos_override)
        self.db.get(Packages, "pkg").gastos = 30
        self.db.commit()
        loaded = get_liquidacion_by_booking("res", self.db)
        self.assertEqual(loaded.total_amout, 275)

    def test_expense_update_rejects_other_tenant_and_invalid_amount(self):
        from fastapi import HTTPException
        from routers.liquidaciones import update_liquidacion
        from schemas.schemas import LiquidacionCreateRequest
        liq = self.financial_booking()
        for payload in (
            dict(iweb_client_id="other", gastos=[]),
            dict(iweb_client_id="tenant", gastos=[dict(id="foreign", name="Extra", amount=10)]),
            dict(iweb_client_id="tenant", gastos=[dict(name="Extra", amount=-1)]),
            dict(iweb_client_id="tenant", gastos=[dict(name="Extra", amount=float("nan"))]),
        ):
            with self.assertRaises(HTTPException):
                update_liquidacion(liq.id, LiquidacionCreateRequest(booking_id="res", expenses_only=True, **payload), self.db)

    def test_admin_migration_is_additive_and_restartable(self):
        from sqlalchemy import inspect, text
        from migrations.liquidacion_admin_override import migrate
        legacy = create_engine("sqlite://")
        with legacy.begin() as connection:
            connection.execute(text("CREATE TABLE liquidaciones (id VARCHAR(36) PRIMARY KEY, total_amout NUMERIC(15,2))"))
            connection.execute(text("INSERT INTO liquidaciones VALUES ('old', 125)"))
        migrate(legacy)
        migrate(legacy)
        self.assertIn("admin_gastos_override", {c["name"] for c in inspect(legacy).get_columns("liquidaciones")})
        with legacy.connect() as connection:
            self.assertEqual(tuple(connection.execute(text("SELECT total_amout, admin_gastos_override FROM liquidaciones")).one()), (125, None))
        legacy.dispose()
