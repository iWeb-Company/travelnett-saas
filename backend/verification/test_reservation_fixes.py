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

    def add_second_hotel_room(self, room_type="doble_matrimonial_estandar", pax_types=("ADL", "ADL")):
        from models.models import Hotels, PackageHotels, Reservas, ReservationPassengers
        self.db.add_all([
            Hotels(id="h2", iweb_client_id="tenant", name="Hotel Dos"),
            PackageHotels(id="ph2", iweb_client_id="tenant", package_id="pkg", hotel_id="h2",
                          pricing_type="persona", tarifa_doble=200, tarifa_single=300, tarifa_menores=50),
        ])
        self.db.get(Reservas, "res").room_type = '["doble_matrimonial_estandar", "' + room_type + '"]'
        for i, kind in enumerate(pax_types):
            self.db.add_all([
                Passengers(id=f"second{i}", iweb_client_id="tenant"),
                ReservationPassengers(id=f"second-rp{i}", reserva_id="res", pasajero_id=f"second{i}",
                                      pasajero_type=kind, hotel_id="h2", room_index=1),
            ])
        self.db.commit()

    def test_each_room_uses_its_hotel_tariff(self):
        from routers.liquidaciones import get_liquidacion_by_booking
        self.financial_booking()
        self.add_second_hotel_room()
        liq = get_liquidacion_by_booking("res", self.db)
        self.assertEqual(liq.total_amout, 640)  # 2*100 + 2*200 + 4*10
        self.assertEqual(liq.total_commission, 600)
        self.assertEqual(liq.commission, 60)

    def test_each_hotel_keeps_its_pricing_mode(self):
        from models.models import PackageHotels
        from routers.liquidaciones import get_liquidacion_by_booking
        self.financial_booking()
        self.add_second_hotel_room()
        ph = self.db.get(PackageHotels, "ph2")
        ph.pricing_type = "habitacion"
        ph.tarifa_doble = 500
        self.db.commit()
        liq = get_liquidacion_by_booking("res", self.db)
        self.assertEqual(liq.total_amout, 740)  # 2*100 + 500 per room + 40
        self.assertEqual(liq.commission, 70)

    def test_child_and_single_rules_come_from_assigned_hotel(self):
        from models.models import PackageHotels
        from routers.liquidaciones import get_liquidacion_by_booking
        self.financial_booking()
        self.add_second_hotel_room(pax_types=("ADL", "CHD"))
        self.assertEqual(get_liquidacion_by_booking("res", self.db).total_amout, 490)  # 200+200+50+40
        # Reconfigure the second room to single; only its hotel's single rule applies.
        from models.models import Reservas, ReservationPassengers
        self.db.delete(self.db.get(ReservationPassengers, "second-rp1"))
        self.db.get(Reservas, "res").room_type = '["doble_matrimonial_estandar", "single_individual_estandar"]'
        self.db.get(PackageHotels, "ph2").comisionable_single = True
        self.db.commit()
        liq = get_liquidacion_by_booking("res", self.db)
        self.assertEqual(liq.total_amout, 530)
        self.assertEqual(liq.total_commission, 350)  # 200 + half of 300
        self.assertEqual(liq.commission, 35)
        self.assertEqual(next(g.amount for g in liq.gastos if "Single" in g.name), 150)

    def test_legacy_passengers_use_reservation_hotel(self):
        from models.models import ReservationPassengers
        from routers.liquidaciones import get_liquidacion_by_booking
        self.financial_booking()
        for p in self.db.query(ReservationPassengers).all():
            p.hotel_id = None
        self.db.commit()
        liq = get_liquidacion_by_booking("res", self.db)
        self.assertEqual(liq.total_amout, 220)
        self.assertEqual(liq.commission, 20)

    def test_multihotel_recalculation_respects_deleted_admin(self):
        from routers.liquidaciones import get_liquidacion_by_booking, update_liquidacion
        from schemas.schemas import LiquidacionCreateRequest
        liq = self.financial_booking()
        update_liquidacion(liq.id, LiquidacionCreateRequest(iweb_client_id="tenant", booking_id="res", expenses_only=True, gastos=[]), self.db)
        self.add_second_hotel_room()
        liq = get_liquidacion_by_booking("res", self.db)
        self.assertEqual(liq.total_amout, 600)
        self.assertEqual(liq.commission, 60)
        self.assertEqual(liq.gastos, [])
