"""Run: python -m unittest discover -s verification -v.

Set INVENTORY_TEST_MYSQL=1 for isolated prefixed MySQL tables, including races.
Without it, tests use SQLite in memory, including the legacy-schema migration.
"""
import asyncio
import os
import unittest
import uuid
from concurrent.futures import ThreadPoolExecutor
from threading import Barrier
from unittest.mock import patch

from fastapi import HTTPException
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker

from db.database import Base, engine as configured_engine
from migrations.hotel_capacity import migrate
from models.models import (
    iWebClient, Packages, PackageHotels, PackagesDatesOfExit, PackageHotelCapacity,
    Hotels, Salidas, Reservas, ReservationPassengers, Passengers,
)
from schemas.schemas import PackageCreateRequest, PackageUpdateRequest, PackageHotelPayload
from services.availability import (
    get_inventory_db, snapshot, validate_reservation, save_package_capacity,
    hotel_availability, resolve_selection,
)
from routers.packages import create_package, update_package, get_package
from routers.reservas import (
    create_reserva, update_reserva, duplicate_reserva, delete_reserva,
    update_reservation_passenger, ReservaCreatePayload, ReservaUpdatePayload,
    ReservationPassengerUpdateInput,
)


class AvailabilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.schema = None
        cls.mysql = os.getenv("INVENTORY_TEST_MYSQL") == "1"
        cls.original_names = {}
        if cls.mysql:
            cls.prefix = "test_cupo_" + uuid.uuid4().hex[:12] + "_"
            for table in Base.metadata.tables.values():
                cls.original_names[table] = table.name
                table.name = cls.prefix + table.name
            cls.engine = create_engine(configured_engine.url, pool_size=5)
        else:
            cls.engine = create_engine("sqlite://")
        Base.metadata.create_all(cls.engine)
        cls.sessions = sessionmaker(bind=cls.engine, autoflush=False, expire_on_commit=False)

    @classmethod
    def tearDownClass(cls):
        if cls.mysql:
            # Drop only the exact prefixed tables created by this test process.
            assert all(t.name == cls.prefix + name for t, name in cls.original_names.items())
            Base.metadata.drop_all(cls.engine)
            for table, name in cls.original_names.items():
                table.name = name
        cls.engine.dispose()

    def setUp(self):
        self.db = self.sessions()
        self.tenant = uuid.uuid4().hex
        self.pkg = uuid.uuid4().hex
        self.hotel = uuid.uuid4().hex
        self.salida = uuid.uuid4().hex
        self.db.add_all([
            iWebClient(id=self.tenant, folder_id=int(uuid.uuid4().hex[:7], 16), slug=self.tenant),
            Packages(id=self.pkg, iweb_client_id=self.tenant, name="Comercial"),
            Hotels(id=self.hotel, iweb_client_id=self.tenant, name="Hotel"),
            PackageHotels(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=self.pkg, hotel_id=self.hotel),
            Salidas(id=self.salida, iweb_client_id=self.tenant, semicama=10, cama=1),
            PackagesDatesOfExit(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=self.pkg, salida_id=self.salida, active=True),
            PackageHotelCapacity(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=self.pkg, hotel_id=self.hotel, salida_id=self.salida, capacidad=2),
        ])
        self.db.commit()
        self.liquidation = patch("routers.liquidaciones.create_or_update_booking_liquidacion")
        self.liquidation.start()

    def tearDown(self):
        self.db.close()
        self.liquidation.stop()

    def capacity(self, value):
        cap = self.db.query(PackageHotelCapacity).filter_by(package_id=self.pkg).one()
        if value is None:
            self.db.delete(cap)
        else:
            cap.capacidad = value
        self.db.commit()

    def booking(self, n=1, kind="semicama", validate=True, **kwargs):
        get_inventory_db(self.tenant, self.db)
        reservation = Reservas(id=uuid.uuid4().hex, iweb_client_id=self.tenant,
            package_id=self.pkg, salida_id=self.salida, hotel_id=self.hotel, active=True, **kwargs)
        self.db.add(reservation)
        for _ in range(n):
            self.add_passenger(reservation, kind)
        if validate:
            validate_reservation(self.db, reservation)
        self.db.commit()
        return reservation

    def add_passenger(self, reservation, kind="semicama", hotel=None):
        p = Passengers(id=uuid.uuid4().hex, iweb_client_id=self.tenant)
        self.db.add(p)
        rp = ReservationPassengers(id=uuid.uuid4().hex, reserva_id=reservation.id,
            pasajero_id=p.id, pasajero_type="ADL", butaca_type=kind, hotel_id=hotel)
        self.db.add(rp)
        return rp

    def test_exact_capacity_then_reject_without_consuming(self):
        self.booking(2)
        with self.assertRaisesRegex(HTTPException, "Cupo hotelero insuficiente"):
            self.booking()
        self.db.rollback()
        self.assertEqual(hotel_availability(self.db, self.tenant, self.pkg)[0]["ocupacion"], 2)
        self.assertEqual(self.db.query(Reservas).filter_by(package_id=self.pkg).count(), 1)

    def test_seat_shortage_rolls_back_hotel_occupancy(self):
        self.booking(kind="cama")
        with self.assertRaisesRegex(HTTPException, "Butacas CAMA"):
            self.booking(kind="cama")
        self.db.rollback()
        self.assertEqual(hotel_availability(self.db, self.tenant, self.pkg)[0]["disponible"], 1)

    def test_missing_and_zero_capacity(self):
        self.capacity(0)
        with self.assertRaisesRegex(HTTPException, "Cupo hotelero insuficiente"):
            self.booking()
        self.db.rollback()
        self.capacity(None)
        with self.assertRaisesRegex(HTTPException, "sin configurar"):
            self.booking()
        self.db.rollback()

    def test_legacy_correction_reduction_and_increase(self):
        r = self.booking(2)
        self.capacity(None)
        before = snapshot(self.db, r)
        r.observations = "Corrección"
        validate_reservation(self.db, r, before)
        self.db.commit()
        before = snapshot(self.db, r)
        self.db.delete(self.db.query(ReservationPassengers).filter_by(reserva_id=r.id).first())
        validate_reservation(self.db, r, before)
        self.db.commit()
        before = snapshot(self.db, r)
        self.add_passenger(r)
        with self.assertRaisesRegex(HTTPException, "sin configurar"):
            validate_reservation(self.db, r, before)
        self.db.rollback()

    def test_cancellation_reactivation(self):
        r = self.booking(2)
        asyncio.run(update_reserva(r.id, ReservaUpdatePayload(active=False), self.tenant, self.db))
        self.booking(2)
        with self.assertRaisesRegex(HTTPException, "Cupo hotelero insuficiente"):
            asyncio.run(update_reserva(r.id, ReservaUpdatePayload(active=True), self.tenant, self.db))
        self.db.rollback()
        self.assertFalse(self.db.get(Reservas, r.id).active)

    def test_duplicate_and_passenger_patch_cannot_bypass_seats(self):
        r = self.booking(kind="cama")
        with self.assertRaisesRegex(HTTPException, "Butacas CAMA"):
            asyncio.run(duplicate_reserva(r.id, self.tenant, self.db))
        self.db.rollback()
        second = self.booking()
        rp = self.db.query(ReservationPassengers).filter_by(reserva_id=second.id).one()
        with self.assertRaisesRegex(HTTPException, "Butacas CAMA"):
            asyncio.run(update_reservation_passenger(rp.id, ReservationPassengerUpdateInput(butaca_type="cama"), self.tenant, self.db))
        self.db.rollback()
        self.assertEqual(self.db.get(ReservationPassengers, rp.id).butaca_type, "semicama")

    def test_package_partial_edit_preserves_dates_capacity(self):
        result = asyncio.run(update_package(self.pkg, PackageUpdateRequest(name_system="Interno"), self.tenant, self.db))
        self.assertEqual(result.name_system, "Interno")
        self.assertEqual(result.name, "Comercial")
        self.assertEqual(result.dates, [self.salida])
        self.assertEqual(result.hotels[0].cupos[0].capacidad, 2)

    def test_capacity_cannot_shrink_below_occupancy_or_remove_date(self):
        self.booking(2)
        h = PackageHotelPayload(hotel_id=self.hotel, cupos=[{"salida_id": self.salida, "capacidad": 1}])
        with self.assertRaisesRegex(HTTPException, "menor"):
            save_package_capacity(self.db, self.tenant, self.pkg, [self.salida], [h])
        self.db.rollback()
        with self.assertRaisesRegex(HTTPException, "quitar"):
            save_package_capacity(self.db, self.tenant, self.pkg, [], [h])

    def test_multiple_hotels_charge_each_passenger(self):
        h2 = uuid.uuid4().hex
        self.db.add_all([
            Hotels(id=h2, iweb_client_id=self.tenant),
            PackageHotels(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=self.pkg, hotel_id=h2),
            PackageHotelCapacity(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=self.pkg, hotel_id=h2, salida_id=self.salida, capacidad=1),
        ])
        self.db.commit()
        r = self.booking()
        before = snapshot(self.db, r)
        self.add_passenger(r, hotel=h2)
        validate_reservation(self.db, r, before)
        self.db.commit()
        availability = {h["hotel_id"]: h for h in hotel_availability(self.db, self.tenant, self.pkg)}
        self.assertEqual(availability[self.hotel]["ocupacion"], 1)
        self.assertEqual(availability[h2]["ocupacion"], 1)

    def test_selection_rejects_foreign_tenant(self):
        with self.assertRaises(HTTPException):
            resolve_selection(self.db, "other", self.pkg, self.salida, self.hotel)

    def test_migration_idempotent(self):
        if self.mysql:
            self.skipTest("Migration uses literal table names; tested only on isolated SQLite")
        migrate(self.engine)
        migrate(self.engine)
        self.assertEqual(self.db.query(PackageHotelCapacity).filter_by(package_id=self.pkg).count(), 1)

    def test_migrate_old_schema_preserves_rows(self):
        if self.mysql:
            self.skipTest("Legacy schema tested in isolated SQLite")
        legacy = create_engine("sqlite://")
        with legacy.begin() as conn:
            conn.execute(text("CREATE TABLE packages (id VARCHAR(36) PRIMARY KEY, name VARCHAR(255))"))
            conn.execute(text("CREATE TABLE package_hotels (id VARCHAR(36) PRIMARY KEY)"))
            conn.execute(text("CREATE TABLE reservation_passengers (id VARCHAR(36) PRIMARY KEY)"))
            conn.execute(text("INSERT INTO packages (id, name) VALUES ('legacy', 'Original')"))
            conn.execute(text("INSERT INTO package_hotels (id) VALUES ('legacy_hotel')"))
        migrate(legacy)
        migrate(legacy)
        with legacy.connect() as conn:
            self.assertEqual(conn.execute(text("SELECT name, name_system FROM packages")).one(), ("Original", None))
            self.assertEqual(conn.execute(text("SELECT estandar, superior, suite FROM package_hotels")).one(), (0, 0, 0))
            self.assertEqual(conn.execute(text("SELECT COUNT(*) FROM package_hotel_capacity")).scalar(), 0)
        legacy.dispose()

    def test_package_create_and_edit_roundtrip(self):
        body = PackageCreateRequest(name="Comercial nuevo", name_system="Interno nuevo", image="/data/test.png",
            dates=[self.salida], hotels=[PackageHotelPayload(hotel_id=self.hotel, estandar=True, suite=True,
                cupos=[{"salida_id": self.salida, "capacidad": 4}])])
        result = asyncio.run(create_package(body, self.tenant, self.db))
        self.assertEqual(result.hotels[0].cupos[0].capacidad, 4)
        self.assertTrue(result.hotels[0].suite)
        self.assertFalse(result.hotels[0].superior)
        self.assertEqual(result.image, "/data/test.png")
        result = asyncio.run(update_package(result.id, PackageUpdateRequest(hotels=[PackageHotelPayload(
            hotel_id=self.hotel, superior=True, cupos=[{"salida_id": self.salida, "capacidad": 5}])]), self.tenant, self.db))
        self.assertTrue(result.hotels[0].superior)
        self.assertFalse(result.hotels[0].suite)
        self.assertEqual(result.hotels[0].cupos[0].capacidad, 5)

    def test_independent_package_and_date_inventory(self):
        self.booking(2)
        new = asyncio.run(create_package(PackageCreateRequest(name="Otro", dates=[self.salida], hotels=[
            PackageHotelPayload(hotel_id=self.hotel, cupos=[{"salida_id": self.salida, "capacidad": 3}])
        ]), self.tenant, self.db))
        self.assertEqual(hotel_availability(self.db, self.tenant, new.id)[0]["disponible"], 3)
        other_salida = uuid.uuid4().hex
        self.db.add(Salidas(id=other_salida, iweb_client_id=self.tenant, semicama=10, cama=1))
        self.db.commit()
        asyncio.run(update_package(self.pkg, PackageUpdateRequest(dates=[self.salida, other_salida], hotels=[
            PackageHotelPayload(hotel_id=self.hotel, cupos=[{"salida_id": self.salida, "capacidad": 2}, {"salida_id": other_salida, "capacidad": 7}])
        ]), self.tenant, self.db))
        available = {a["salida_id"]: a["disponible"] for a in hotel_availability(self.db, self.tenant, self.pkg)}
        self.assertEqual(available, {self.salida: 0, other_salida: 7})

    def test_create_endpoint_and_delete_release_capacity(self):
        p = Passengers(id=uuid.uuid4().hex, iweb_client_id=self.tenant)
        self.db.add(p)
        self.db.commit()
        result = asyncio.run(create_reserva(ReservaCreatePayload(package_id=self.pkg, salida_id=self.salida,
            hotel_id=self.hotel, passengers=[dict(pasajero_id=p.id, pasajero_type="INF", hotel_id=self.hotel)]), self.tenant, self.db))
        self.assertEqual(result.reservation_passengers[0].hotel_id, self.hotel)
        self.assertEqual(hotel_availability(self.db, self.tenant, self.pkg)[0]["ocupacion"], 1)
        asyncio.run(delete_reserva(result.id, self.tenant, self.db))
        self.assertEqual(hotel_availability(self.db, self.tenant, self.pkg)[0]["ocupacion"], 0)

    def test_move_departure_rejected_without_releasing_original(self):
        r = self.booking(2)
        other = uuid.uuid4().hex
        self.db.add_all([Salidas(id=other, iweb_client_id=self.tenant, semicama=10),
            PackagesDatesOfExit(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=self.pkg, salida_id=other, active=True),
            PackageHotelCapacity(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=self.pkg, hotel_id=self.hotel, salida_id=other, capacidad=1)])
        self.db.commit()
        with self.assertRaisesRegex(HTTPException, "Cupo hotelero insuficiente"):
            asyncio.run(update_reserva(r.id, ReservaUpdatePayload(salida_id=other), self.tenant, self.db))
        self.db.rollback()
        self.assertEqual(self.db.get(Reservas, r.id).salida_id, self.salida)
        self.assertEqual(next(a for a in hotel_availability(self.db, self.tenant, self.pkg) if a["salida_id"] == self.salida)["ocupacion"], 2)

    def test_concurrent_last_place(self):
        if not self.mysql:
            self.skipTest("Requires MySQL: INVENTORY_TEST_MYSQL=1")
        self.capacity(1)
        barrier = Barrier(2)
        def reserve():
            with self.sessions() as db:
                barrier.wait(timeout=10)
                get_inventory_db(self.tenant, db)
                p = Passengers(id=uuid.uuid4().hex, iweb_client_id=self.tenant)
                r = Reservas(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=self.pkg,
                             salida_id=self.salida, hotel_id=self.hotel, active=True)
                db.add_all([p, r, ReservationPassengers(id=uuid.uuid4().hex, reserva_id=r.id,
                    pasajero_id=p.id, pasajero_type="ADL", butaca_type="semicama")])
                try:
                    validate_reservation(db, r)
                    db.commit()
                    return "ok"
                except HTTPException:
                    db.rollback()
                    return "full"
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: reserve(), range(2)))
        self.assertCountEqual(results, ["ok", "full"])
        self.db.rollback()
        self.assertEqual(hotel_availability(self.db, self.tenant, self.pkg)[0]["ocupacion"], 1)


if __name__ == "__main__":
    unittest.main()
