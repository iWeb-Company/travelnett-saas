"""Isolated legacy fixtures. Never connects to the configured database."""
import unittest

from sqlalchemy import create_engine, text

from migrations.transport_units import diagnose, migrate


class TransportMigrationTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        with self.engine.begin() as db:
            for statement in (
                "CREATE TABLE salidas (id TEXT PRIMARY KEY, iweb_client_id TEXT, type TEXT, transport_company TEXT, precio_transporte NUMERIC, type_bus TEXT, semicama INTEGER, cama INTEGER, coordinador_nombre TEXT, coordinador_telefono TEXT, active BOOLEAN)",
                "CREATE TABLE transport_companies (id TEXT PRIMARY KEY, iweb_client_id TEXT)",
                "CREATE TABLE bus_types (id TEXT PRIMARY KEY, iweb_client_id TEXT, name TEXT, semicama_quantity INTEGER, cama_quantity INTEGER, panoramicos_quantity INTEGER)",
                "CREATE TABLE reservas (id TEXT PRIMARY KEY, iweb_client_id TEXT, salida_id TEXT, active BOOLEAN)",
                "CREATE TABLE reservation_passengers (id TEXT PRIMARY KEY, reserva_id TEXT, pasajero_id TEXT, butaca_type TEXT, butaca_number INTEGER, bus_number TEXT, room_index INTEGER, hotel_id TEXT)",
                "CREATE TABLE cc_providers_consumption_payments (id TEXT PRIMARY KEY, salida_id TEXT, iweb_client_id TEXT, transport_id TEXT, type TEXT, amount NUMERIC, detail TEXT)",
                "CREATE UNIQUE INDEX uq_cc_provider_consumption_salida ON cc_providers_consumption_payments(salida_id)",
                "INSERT INTO transport_companies VALUES ('company', 'tenant')",
                "INSERT INTO bus_types VALUES ('template', 'tenant', 'Mix', 50, 10, 4)",
                "INSERT INTO salidas VALUES ('departure', 'tenant', 'bus', 'company', 100, 'template', 30, 8, 'Ana', '123', 1)",
                "INSERT INTO reservas VALUES ('booking', 'tenant', 'departure', 1)",
                "INSERT INTO reservation_passengers VALUES ('association', 'booking', 'person', 'cama', 2, '1', 3, 'hotel')",
                "INSERT INTO cc_providers_consumption_payments VALUES ('expense', 'departure', 'tenant', 'company', 'consumo', 100, 'history')",
            ):
                db.execute(text(statement))

    def tearDown(self):
        self.engine.dispose()

    def test_backfill_preserves_capacity_passenger_and_expense_and_is_repeatable(self):
        self.assertEqual(diagnose(self.engine)[0]["conflicts"], [])
        migrate(self.engine)
        migrate(self.engine)
        with self.engine.connect() as db:
            unit = db.execute(text("SELECT * FROM salida_transport_units")).mappings().one()
            self.assertEqual((unit["semicama"], unit["cama"]), (30, 8))
            passenger = db.execute(text("SELECT * FROM reservation_passengers")).mappings().one()
            self.assertEqual((passenger["id"], passenger["butaca_number"], passenger["room_index"], passenger["hotel_id"]), ("association", 2, 3, "hotel"))
            self.assertEqual(passenger["salida_transport_unit_id"], unit["id"])
            expense = db.execute(text("SELECT * FROM cc_providers_consumption_payments")).mappings().one()
            self.assertEqual((expense["id"], expense["amount"], expense["detail"]), ("expense", 100, "history"))
            self.assertEqual(expense["salida_transport_unit_id"], unit["id"])

    def test_conflicting_legacy_is_reported_and_not_backfilled(self):
        with self.engine.begin() as db:
            db.execute(text("INSERT INTO reservation_passengers VALUES ('duplicate', 'booking', 'other', 'cama', 2, '1', 0, 'hotel')"))
        report = diagnose(self.engine)
        self.assertIn("duplicate_seat", report[0]["conflicts"])
        migrate(self.engine)
        with self.engine.connect() as db:
            self.assertEqual(db.execute(text("SELECT COUNT(*) FROM salida_transport_units")).scalar(), 0)
            self.assertEqual(db.execute(text("SELECT COUNT(*) FROM reservation_passengers")).scalar(), 2)


if __name__ == "__main__":
    unittest.main()


class TransportServiceTests(unittest.TestCase):
    def setUp(self):
        from db.database import Base
        from sqlalchemy.orm import Session
        from models.models import Salidas, TransportCompany, BusTypes
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        self.salida = Salidas(id="s", iweb_client_id="t", type="bus", semicama=0, cama=0, active=True)
        self.db.add_all([self.salida,
            TransportCompany(id="a", iweb_client_id="t"), TransportCompany(id="b", iweb_client_id="t"),
            BusTypes(id="mix", iweb_client_id="t", name="Mix", semicama_quantity=3, cama_quantity=2, panoramicos_quantity=4)])
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def create(self, company="a"):
        from services.transport_units import create_unit
        from schemas.transport_units import TransportUnitCreate
        return create_unit(self.db, self.salida, TransportUnitCreate(transport_company=company, price=100, type_bus="mix"), "operator")

    def test_three_units_have_independent_consumptions_and_snapshots(self):
        from models.models import BusTypes, ccProvidersConsumptionPayments
        units = [self.create(), self.create(), self.create("b")]
        self.db.commit()
        self.assertEqual([u.number for u in units], [1, 2, 3])
        self.assertEqual((self.salida.semicama, self.salida.cama), (9, 6))
        expenses = self.db.query(ccProvidersConsumptionPayments).all()
        self.assertEqual(sorted(e.transport_id for e in expenses), ["a", "a", "b"])
        self.db.get(BusTypes, "mix").semicama_quantity = 20
        self.db.commit()
        self.assertEqual(units[0].layout_snapshot["semicama_quantity"], 3)

    def test_cancel_preserves_number_and_expense_history(self):
        from services.transport_units import cancel_unit
        from models.models import ccProvidersConsumptionPayments
        first, second = self.create(), self.create()
        cancel_unit(self.db, self.salida, first, "operator")
        third = self.create()
        self.db.commit()
        self.assertEqual((first.active, second.number, third.number), (False, 2, 3))
        expense = self.db.query(ccProvidersConsumptionPayments).filter_by(salida_transport_unit_id=first.id).one()
        self.assertEqual(expense.amount, 0)
        self.assertIn("operator", expense.detail)

    def test_seat_save_preserves_rooms_rejects_stale_and_cross_unit_moves(self):
        from fastapi import HTTPException
        from models.models import Reservas, ReservationPassengers
        from services.transport_units import save_assignments
        from schemas.transport_units import SeatAssignments
        first, second = self.create(), self.create()
        self.db.add(Reservas(id="r", iweb_client_id="t", salida_id="s", active=True))
        passenger = ReservationPassengers(id="p", reserva_id="r", pasajero_id="person", pasajero_type="ADL", butaca_type="cama", room_index=3, hotel_id="hotel")
        self.db.add(passenger)
        self.db.commit()
        def payload(revision):
            return SeatAssignments(revision=revision, assignments=[{"reservation_passenger_id": "p", "butaca_number": 1}])
        save_assignments(self.db, self.salida, first, payload(first.revision))
        self.db.commit()
        self.assertEqual((passenger.room_index, passenger.hotel_id, passenger.butaca_type), (3, "hotel", "cama"))
        with self.assertRaises(HTTPException):
            save_assignments(self.db, self.salida, first, payload(0))
        with self.assertRaises(HTTPException):
            save_assignments(self.db, self.salida, second, payload(second.revision))

    def test_duplicate_seat_rolls_back_entire_assignment(self):
        from fastapi import HTTPException
        from models.models import Reservas, ReservationPassengers
        from services.transport_units import save_assignments
        from schemas.transport_units import SeatAssignments
        from routers.transport_units import finish
        unit = self.create()
        self.db.add(Reservas(id="r", iweb_client_id="t", salida_id="s", active=True))
        for key in ("p1", "p2"):
            self.db.add(ReservationPassengers(id=key, reserva_id="r", pasajero_id=key, pasajero_type="ADL", butaca_type="cama", room_index=2))
        self.db.commit()
        payload = SeatAssignments(revision=0, assignments=[{"reservation_passenger_id": key, "butaca_number": 1} for key in ("p1", "p2")])
        with self.assertRaises(HTTPException):
            finish(self.db, lambda: save_assignments(self.db, self.salida, unit, payload))
        self.assertTrue(all(p.salida_transport_unit_id is None for p in self.db.query(ReservationPassengers)))
        self.assertEqual(unit.revision, 0)

    def test_reduction_respects_unassigned_demand(self):
        from fastapi import HTTPException
        from models.models import Reservas, ReservationPassengers
        from services.transport_units import cancel_unit
        from routers.transport_units import finish
        unit = self.create()
        self.db.add(Reservas(id="r", iweb_client_id="t", salida_id="s", active=True))
        self.db.add(ReservationPassengers(id="p", reserva_id="r", pasajero_id="p", pasajero_type="ADL", butaca_type="cama"))
        self.db.commit()
        with self.assertRaises(HTTPException):
            finish(self.db, lambda: cancel_unit(self.db, self.salida, unit, "operator"))
        self.assertTrue(unit.active)

    def test_foreign_company_and_legacy_multibus_write_are_rejected(self):
        from fastapi import HTTPException
        from models.models import TransportCompany
        from services.transport_units import apply_legacy_update
        from schemas.schemas import SalidaUpdateRequest
        self.db.add(TransportCompany(id="foreign", iweb_client_id="other"))
        self.db.commit()
        with self.assertRaises(HTTPException):
            self.create("foreign")
        self.create()
        self.create()
        with self.assertRaises(HTTPException):
            apply_legacy_update(self.db, self.salida, SalidaUpdateRequest(semicama=100), "operator")
        self.assertTrue(apply_legacy_update(self.db, self.salida, SalidaUpdateRequest(date_of_out="2026-10-01"), "operator"))

    def test_booking_update_preserves_association_and_transport(self):
        import asyncio
        from unittest.mock import patch
        from models.models import Reservas, ReservationPassengers, Passengers
        from routers.reservas import update_reserva, ReservaUpdatePayload
        unit = self.create()
        self.db.add_all([Reservas(id="r", iweb_client_id="t", salida_id="s", active=True),
                         Passengers(id="person", iweb_client_id="t", name="Ana")])
        self.db.add(ReservationPassengers(id="p", reserva_id="r", pasajero_id="person", pasajero_type="ADL", butaca_type="cama", butaca_number=1, bus_number="1", salida_transport_unit_id=unit.id))
        self.db.commit()
        payload = ReservaUpdatePayload(passengers=[{"pasajero_id": "person", "pasajero_type": "ADL", "butaca_type": "semicama", "butaca_number": None}])
        with patch("routers.liquidaciones.create_or_update_booking_liquidacion"):
            asyncio.run(update_reserva("r", payload, "t", self.db))
        p = self.db.query(ReservationPassengers).one()
        self.assertEqual((p.id, p.salida_transport_unit_id, p.butaca_number, p.butaca_type), ("p", unit.id, 1, "cama"))
