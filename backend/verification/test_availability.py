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
from migrations.salida_transport_consumption import migrate as migrate_transport_consumption
from models.models import (
    iWebClient, Packages, PackageHotels, PackagesDatesOfExit, PackageHotelCapacity,
    Hotels, Salidas, Reservas, ReservationPassengers, ReservationRooms, Passengers, Destinos,
    LugaresCarga, SalidasLugaresCarga, Clients, Liquidaciones, Pagos, Vouchers,
    TransportCompany, ccProvidersConsumptionPayments,
)
from schemas.schemas import (
    PackageCreateRequest, PackageUpdateRequest, PackageHotelPayload,
    SalidaCreateRequest, SalidaUpdateRequest,
)
from services.availability import (
    get_inventory_db, snapshot, validate_reservation, save_package_capacity,
    hotel_availability, resolve_selection,
)
from routers.packages import create_package, update_package, get_package
from routers.reservas import (
    create_reserva, update_reserva, duplicate_reserva, delete_reserva, get_reservas,
    update_reservation_passenger, ReservaCreatePayload, ReservaUpdatePayload,
    ReservationPassengerUpdateInput,
)
from routers.vouchers import generate_voucher_snapshot
from routers.liquidaciones import calculate_booking_liquidacion_totals
from routers.salidas import create_salida, register_transport_consumption, update_salida, get_salida


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
        self.liquidation_mock = self.liquidation.start()

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

    def test_manual_booking_keeps_package_null_and_controls_seats(self):
        self.capacity(0)
        for mode in ("tradicional", "bloqueo_grupo"):
            pax = Passengers(id=uuid.uuid4().hex, iweb_client_id=self.tenant)
            self.db.add(pax)
            self.db.commit()
            created = asyncio.run(create_reserva(ReservaCreatePayload(
                salida_id=self.salida, hotel_id=self.hotel, type=mode,
                passengers=[dict(pasajero_id=pax.id, pasajero_type="ADL", butaca_type="semicama", hotel_id=self.hotel)],
            ), self.tenant, self.db))
            self.assertIsNone(created.package_id)
        self.db.get(Salidas, self.salida).semicama = 2
        self.db.commit()
        reservation = Reservas(id=uuid.uuid4().hex, iweb_client_id=self.tenant, salida_id=self.salida, active=True)
        self.db.add(reservation)
        self.add_passenger(reservation, hotel=self.hotel)
        with self.assertRaisesRegex(HTTPException, "Butacas SEMICAMA insuficientes"):
            validate_reservation(self.db, reservation)
        self.db.rollback()

    def test_manual_booking_requires_departure_and_tenant_hotels(self):
        for salida in (None, "unknown"):
            with self.assertRaises(HTTPException):
                resolve_selection(self.db, self.tenant, None, salida, self.hotel)
        other_hotel = Hotels(id=uuid.uuid4().hex, iweb_client_id="other", name="Ajeno")
        self.db.add(other_hotel)
        self.db.commit()
        with self.assertRaises(HTTPException):
            resolve_selection(self.db, self.tenant, None, self.salida, other_hotel.id)
        reservation = Reservas(id=uuid.uuid4().hex, iweb_client_id=self.tenant, salida_id=self.salida, active=True)
        self.db.add(reservation)
        self.add_passenger(reservation, hotel=other_hotel.id)
        with self.assertRaisesRegex(HTTPException, "hoteles que no pertenecen"):
            validate_reservation(self.db, reservation)
        self.db.rollback()

    def test_exact_capacity_then_reject_without_consuming(self):
        self.booking(2)
        with self.assertRaisesRegex(HTTPException, "Cupo hotelero insuficiente"):
            self.booking()
        self.db.rollback()
        self.assertEqual(hotel_availability(self.db, self.tenant, self.pkg)[0]["ocupacion"], 2)
        self.assertEqual(self.db.query(Reservas).filter_by(package_id=self.pkg).count(), 1)

    def test_reservation_commission_overrides_client_default_in_liquidation(self):
        client_id = uuid.uuid4().hex
        self.db.add(Clients(
            id=client_id,
            iweb_client_id=self.tenant,
            complete_name="Agencia",
            commission=10,
        ))
        package = self.db.get(Packages, self.pkg)
        package.price = 1000
        self.db.commit()

        reservation = self.booking(
            client_id=client_id,
            commission=25,
            room_type="single_individual_estandar",
        )
        totals = calculate_booking_liquidacion_totals(self.db, reservation.id)
        self.assertEqual(totals["client_comm_pct"], 25)
        self.assertEqual(totals["comm_amount"], 250)

        reservation.commission = 0
        self.db.commit()
        totals = calculate_booking_liquidacion_totals(self.db, reservation.id)
        self.assertEqual(totals["client_comm_pct"], 0)
        self.assertEqual(totals["comm_amount"], 0)

        reservation.commission = None
        self.db.commit()
        totals = calculate_booking_liquidacion_totals(self.db, reservation.id)
        self.assertEqual(totals["client_comm_pct"], 10)
        self.assertEqual(totals["comm_amount"], 100)

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

    def test_empty_duplicate_does_not_consume_seats_and_passenger_patch_cannot_bypass_them(self):
        r = self.booking(kind="cama")
        duplicated = asyncio.run(duplicate_reserva(r.id, self.tenant, self.db))
        self.assertEqual(
            self.db.query(ReservationPassengers).filter_by(reserva_id=duplicated.id).count(),
            0,
        )
        second = self.booking()
        rp = self.db.query(ReservationPassengers).filter_by(reserva_id=second.id).one()
        with self.assertRaisesRegex(HTTPException, "Butacas CAMA"):
            asyncio.run(update_reservation_passenger(rp.id, ReservationPassengerUpdateInput(butaca_type="cama"), self.tenant, self.db))
        self.db.rollback()
        self.assertEqual(self.db.get(ReservationPassengers, rp.id).butaca_type, "semicama")

    def test_liquidation_failure_rolls_back_reservation_update(self):
        reservation = self.booking(observations="Original")
        self.liquidation_mock.side_effect = RuntimeError("No se pudo recalcular")

        with self.assertRaisesRegex(RuntimeError, "No se pudo recalcular"):
            asyncio.run(update_reserva(
                reservation.id,
                ReservaUpdatePayload(observations="Modificada"),
                self.tenant,
                self.db,
            ))

        self.db.expire_all()
        self.assertEqual(self.db.get(Reservas, reservation.id).observations, "Original")

    def test_duplicate_copies_rooms_without_passengers_payments_or_vouchers(self):
        reservation = self.booking(
            commission=17.5,
            liberados=2,
            type="bloqueo_grupo",
            titulo="Grupo Primavera",
            rooming_id="RM-11",
            room_type='["doble_matrimonial_estandar"]',
            venciment="2026-10-01",
            observations="Mantener asignaciones",
            client_id="cliente",
            lugar_carga_id="carga",
            regimen_id="regimen",
            created_by_user_id="vendedor",
        )
        passenger = self.db.query(ReservationPassengers).filter_by(reserva_id=reservation.id).one()
        passenger.butaca_number = 13
        passenger.bus_number = "1"
        passenger.room_index = 0
        self.db.add_all([
            Pagos(id=uuid.uuid4().hex, iweb_client_id=self.tenant, reserva_id=reservation.id, amount=100),
            Vouchers(id=uuid.uuid4().hex, iweb_client_id=self.tenant, reserva_id=reservation.id),
        ])
        self.db.commit()

        duplicated = asyncio.run(duplicate_reserva(reservation.id, self.tenant, self.db))
        cloned = self.db.get(Reservas, duplicated.id)
        self.assertNotEqual(cloned.codigo_reserva, reservation.codigo_reserva)
        for field in (
            "salida_id", "package_id", "client_id", "lugar_carga_id", "hotel_id", "regimen_id",
            "rooming_id", "room_type", "venciment", "observations", "commission", "liberados",
            "type", "titulo", "created_by_user_id",
        ):
            self.assertEqual(getattr(cloned, field), getattr(reservation, field), field)
        self.assertEqual(
            self.db.query(ReservationPassengers).filter_by(reserva_id=cloned.id).count(),
            0,
        )
        source_rooms = self.db.query(ReservationRooms).filter_by(reserva_id=reservation.id).all()
        cloned_rooms = self.db.query(ReservationRooms).filter_by(reserva_id=cloned.id).all()
        self.assertEqual([room.room_type for room in cloned_rooms], [room.room_type for room in source_rooms])
        self.assertEqual([room.hotel_id for room in cloned_rooms], [room.hotel_id for room in source_rooms])
        self.assertTrue(set(room.id for room in source_rooms).isdisjoint(room.id for room in cloned_rooms))
        self.assertEqual(self.db.query(Pagos).filter_by(reserva_id=cloned.id).count(), 0)
        self.assertEqual(self.db.query(Vouchers).filter_by(reserva_id=cloned.id).count(), 0)
        liquidation = self.db.query(Liquidaciones).filter_by(booking_id=cloned.id).one()
        self.assertEqual(float(liquidation.total_amout), 0)
        self.assertEqual(float(liquidation.total_commission), 0)

    def test_bus_departure_persists_price_and_creates_one_transport_consumption(self):
        transport_id = uuid.uuid4().hex
        self.db.add(TransportCompany(id=transport_id, iweb_client_id=self.tenant, name="Empresa Micro", type="bus"))
        self.db.commit()

        created = asyncio.run(create_salida(
            SalidaCreateRequest(
                type="bus", date_of_out="2026-10-10", destino="Destino", transport_company=transport_id,
                precio_transporte=125000,
            ),
            self.tenant,
            self.db,
        ))
        self.assertEqual(float(created.precio_transporte), 125000)
        salida = self.db.get(Salidas, created.id)
        self.assertEqual(float(salida.precio_transporte), 125000)
        register_transport_consumption(self.db, salida)
        movements = self.db.query(ccProvidersConsumptionPayments).filter_by(salida_id=salida.id).all()
        self.assertEqual(len(movements), 1)
        self.assertEqual(movements[0].provider_type, "transporte")
        self.assertEqual(movements[0].transport_id, transport_id)
        self.assertEqual(movements[0].type, "consumo")
        self.assertEqual(float(movements[0].amount), 125000)
        self.assertEqual(str(movements[0].date), "2026-10-10")

    def test_non_bus_or_free_departures_do_not_create_transport_consumption(self):
        transport_id = uuid.uuid4().hex
        self.db.add(TransportCompany(id=transport_id, iweb_client_id=self.tenant, name="Empresa", type="bus"))
        self.db.commit()
        for departure_type, price in (("aereo", 1000), ("bus", 0)):
            created = asyncio.run(create_salida(
                SalidaCreateRequest(type=departure_type, transport_company=transport_id, precio_transporte=price),
                self.tenant,
                self.db,
            ))
            self.assertEqual(
                self.db.query(ccProvidersConsumptionPayments).filter_by(salida_id=created.id).count(),
                0,
            )

    def test_reducing_room_capacity_removes_last_passengers_from_that_room(self):
        reservation = self.booking(2, room_type='["doble_matrimonial_estandar"]')
        passengers = self.db.query(ReservationPassengers).filter_by(
            reserva_id=reservation.id
        ).order_by(ReservationPassengers.id).all()

        result = asyncio.run(update_reserva(
            reservation.id,
            ReservaUpdatePayload(
                room_type='["single_individual_estandar"]',
                passengers=[
                    dict(pasajero_id=passengers[0].pasajero_id, pasajero_type="ADL", butaca_type="semicama", hotel_id=self.hotel, room_index=0),
                    dict(pasajero_id=passengers[1].pasajero_id, pasajero_type="ADL", butaca_type="semicama", hotel_id=self.hotel, room_index=0),
                ],
            ),
            self.tenant,
            self.db,
        ))

        self.assertEqual(
            [p.pasajero_id for p in result.reservation_passengers],
            [passengers[0].pasajero_id],
        )
        self.assertEqual(self.db.get(Passengers, passengers[1].pasajero_id).id, passengers[1].pasajero_id)

    def test_transport_price_update_reuses_existing_consumption_and_appends_audit(self):
        from models.models import User

        transport_id = uuid.uuid4().hex
        salida = Salidas(
            id=uuid.uuid4().hex,
            iweb_client_id=self.tenant,
            type="micro",
            date_of_out="2026-10-10",
            transport_company=transport_id,
            precio_transporte=100,
        )
        movement = ccProvidersConsumptionPayments(
            id=uuid.uuid4().hex,
            iweb_client_id=self.tenant,
            salida_id=salida.id,
            provider_type="transporte",
            transport_id=transport_id,
            type="consumo",
            amount=100,
            detail="Consumo transporte - salida 2026-10-10",
        )
        actor = User(id=uuid.uuid4().hex, iweb_client_id=self.tenant, name="Ana", last_name="Pérez", username="ana")
        self.db.add_all([
            TransportCompany(id=transport_id, iweb_client_id=self.tenant, name="Empresa", type="bus"),
            salida,
            movement,
            actor,
        ])
        self.db.commit()

        asyncio.run(update_salida(
            salida.id,
            SalidaUpdateRequest(precio_transporte=150),
            self.tenant,
            self.db,
            actor,
        ))

        movements = self.db.query(ccProvidersConsumptionPayments).filter_by(salida_id=salida.id).all()
        self.assertEqual(len(movements), 1)
        self.assertEqual(float(movements[0].amount), 150)
        self.assertIn("Última actualización", movements[0].detail)
        self.assertIn("Ana Pérez", movements[0].detail)

    def test_departure_capacity_can_be_edited(self):
        from models.models import User

        actor = User(id=uuid.uuid4().hex, iweb_client_id=self.tenant, username="qa", active=True)
        asyncio.run(update_salida(self.salida, SalidaUpdateRequest(passengers=12, semicama=11, cama=2), self.tenant, self.db, actor))
        updated = self.db.get(Salidas, self.salida)
        self.assertEqual((updated.passengers, updated.semicama, updated.cama), (12, 11, 2))

    def test_departure_response_reports_capacity_when_no_reservations_exist(self):
        from models.models import Salidas
        salida = Salidas(id=uuid.uuid4().hex, iweb_client_id=self.tenant, type="bus", passengers=24, semicama=16, cama=8)
        self.db.add(salida)
        self.db.commit()
        response = asyncio.run(get_salida(salida.id, self.tenant, self.db))
        self.assertEqual((response.passengers, response.semicama, response.cama), (24, 16, 8))
        self.assertEqual((response.semicama_reservadas, response.cama_reservadas), (0, 0))

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

    def test_transport_consumption_migration_is_additive_and_restartable(self):
        if self.mysql:
            self.skipTest("Legacy schema migration is covered on isolated SQLite")
        legacy = create_engine("sqlite://")
        with legacy.begin() as connection:
            connection.execute(text("CREATE TABLE salidas (id VARCHAR(36) PRIMARY KEY)"))
            connection.execute(text(
                "CREATE TABLE cc_providers_consumption_payments (id VARCHAR(36) PRIMARY KEY)"
            ))
        migrate_transport_consumption(legacy)
        migrate_transport_consumption(legacy)
        self.assertIn("precio_transporte", {column["name"] for column in inspect(legacy).get_columns("salidas")})
        self.assertIn("salida_id", {
            column["name"] for column in inspect(legacy).get_columns("cc_providers_consumption_payments")
        })
        self.assertIn("uq_cc_provider_consumption_salida", {
            index["name"] for index in inspect(legacy).get_indexes("cc_providers_consumption_payments")
        })
        legacy.dispose()

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

    def test_shared_departure_uses_global_seats_and_independent_commercial_data(self):
        operative_destination = uuid.uuid4().hex
        first_destination = uuid.uuid4().hex
        second_destination = uuid.uuid4().hex
        second_package = uuid.uuid4().hex
        self.db.add_all([
            Destinos(id=operative_destination, iweb_client_id=self.tenant, name="Mar de Ajo / San Bernardo", sigla="COMB"),
            Destinos(id=first_destination, iweb_client_id=self.tenant, name="Mar de Ajo", sigla="MA"),
            Destinos(id=second_destination, iweb_client_id=self.tenant, name="San Bernardo", sigla="SB"),
            Packages(id=second_package, iweb_client_id=self.tenant, name="Paquete San Bernardo", destino=second_destination),
            PackageHotels(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=second_package, hotel_id=self.hotel),
            PackagesDatesOfExit(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=second_package, salida_id=self.salida, active=True),
            PackageHotelCapacity(id=uuid.uuid4().hex, iweb_client_id=self.tenant, package_id=second_package, hotel_id=self.hotel, salida_id=self.salida, capacidad=3),
        ])
        self.db.get(Packages, self.pkg).destino = first_destination
        self.db.get(Salidas, self.salida).destino = operative_destination
        self.db.get(Salidas, self.salida).semicama = 2
        self.db.get(PackageHotelCapacity, self.db.query(PackageHotelCapacity).filter_by(package_id=self.pkg).one().id).capacidad = 3
        passengers = [Passengers(id=uuid.uuid4().hex, iweb_client_id=self.tenant) for _ in range(3)]
        self.db.add_all(passengers)
        self.db.commit()

        self.assertEqual(resolve_selection(self.db, self.tenant, None, self.salida, self.hotel),
                         (None, self.salida, self.hotel))

        first = asyncio.run(create_reserva(ReservaCreatePayload(
            package_id=self.pkg, salida_id=self.salida, hotel_id=self.hotel,
            passengers=[dict(pasajero_id=passengers[0].id, pasajero_type="ADL", butaca_type="semicama")],
        ), self.tenant, self.db))
        second = asyncio.run(create_reserva(ReservaCreatePayload(
            package_id=second_package, salida_id=self.salida, hotel_id=self.hotel,
            passengers=[dict(pasajero_id=passengers[1].id, pasajero_type="ADL", butaca_type="semicama")],
        ), self.tenant, self.db))

        self.assertTrue(first.codigo_reserva.startswith("MA#"))
        self.assertTrue(second.codigo_reserva.startswith("SB#"))
        self.assertEqual(first.destino, "Mar de Ajo")
        self.assertEqual(second.destino, "San Bernardo")
        voucher = asyncio.run(generate_voucher_snapshot(second.id, self.tenant, self.db))
        self.assertEqual(voucher.package_id, second_package)
        self.assertEqual(voucher.destino_name, "San Bernardo")
        self.assertEqual(hotel_availability(self.db, self.tenant, self.pkg)[0]["ocupacion"], 1)
        self.assertEqual(hotel_availability(self.db, self.tenant, second_package)[0]["ocupacion"], 1)
        listed = asyncio.run(get_reservas(self.tenant, self.salida, None, 5, self.db))
        self.assertEqual({reservation.destino for reservation in listed}, {"Mar de Ajo", "San Bernardo"})

        with self.assertRaisesRegex(HTTPException, "Butacas SEMICAMA"):
            asyncio.run(create_reserva(ReservaCreatePayload(
                package_id=second_package, salida_id=self.salida, hotel_id=self.hotel,
                passengers=[dict(pasajero_id=passengers[2].id, pasajero_type="ADL", butaca_type="semicama")],
            ), self.tenant, self.db))
        self.db.rollback()

    def test_operational_hotel_edit_keeps_legacy_package_less_reservation(self):
        self.db.add_all([Hotels(id="legacy-hotel", iweb_client_id=self.tenant),
                         Hotels(id="operational-hotel", iweb_client_id=self.tenant)])
        legacy = Reservas(
            id=uuid.uuid4().hex,
            iweb_client_id=self.tenant,
            salida_id=self.salida,
            hotel_id="legacy-hotel",
            room_type='["doble_matrimonial_estandar"]',
            active=True,
        )
        self.db.add(legacy)
        self.db.commit()
        result = asyncio.run(update_reserva(
            legacy.id,
            ReservaUpdatePayload(hotel_id="operational-hotel"),
            self.tenant,
            self.db,
        ))
        self.assertEqual(result.hotel_id, "operational-hotel")
        self.assertIsNone(result.package_id)
        self.assertEqual(result.rooms[0].hotel_id, "operational-hotel")

    def test_voucher_uses_departure_date_and_matching_boarding_time(self):
        load_ids = [uuid.uuid4().hex for _ in range(3)]
        self.db.add_all([
            LugaresCarga(id=load_ids[0], iweb_client_id=self.tenant, name="Liniers"),
            LugaresCarga(id=load_ids[1], iweb_client_id=self.tenant, name="Moron"),
            LugaresCarga(id=load_ids[2], iweb_client_id=self.tenant, name="San Justo"),
            SalidasLugaresCarga(
                id=uuid.uuid4().hex,
                iweb_client_id=self.tenant,
                salida_id=self.salida,
                cargas=", ".join(load_ids),
                horarios="06:30, , 08:45",
            ),
        ])
        self.db.get(Salidas, self.salida).date_of_out = "2026-10-15T00:00:00"
        self.db.query(PackageHotels).filter_by(package_id=self.pkg).one().hotel_fecha_in = "2026-10-20"
        passenger = Passengers(id=uuid.uuid4().hex, iweb_client_id=self.tenant, name="Ana")
        self.db.add(passenger)
        self.db.commit()

        reservation = asyncio.run(create_reserva(ReservaCreatePayload(
            package_id=self.pkg,
            salida_id=self.salida,
            hotel_id=self.hotel,
            lugar_carga_id=load_ids[2],
            passengers=[dict(
                pasajero_id=passenger.id,
                pasajero_type="ADL",
                butaca_type="semicama",
                lugar_carga_id=load_ids[2],
            )],
        ), self.tenant, self.db))
        voucher = asyncio.run(generate_voucher_snapshot(reservation.id, self.tenant, self.db))

        self.assertEqual(voucher.fecha_salida, "15/10/2026")
        self.assertEqual(voucher.horario_carga, "08:45")
        self.assertIn("San Justo", voucher.lugar_carga)

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
