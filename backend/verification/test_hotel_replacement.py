import asyncio
import unittest

from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from db.database import Base
from models.models import (
    Hotels,
    Passengers,
    ReservationPassengers,
    ReservationRooms,
    Reservas,
    Salidas,
    User,
    iWebClient,
)
from routers.salidas import (
    ReservationPassengerHotelReplaceRequest,
    replace_reservation_passenger_hotel,
    router,
)
from routers.vouchers import generate_voucher_snapshot


class ReservationPassengerHotelReplacementTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.db = sessionmaker(bind=self.engine, expire_on_commit=False)()
        self.tenant = "tenant"
        self.other_tenant = "other-tenant"
        self.salida_id = "salida"
        self.db.add_all([
            iWebClient(id=self.tenant, folder_id=1, slug="tenant"),
            iWebClient(id=self.other_tenant, folder_id=2, slug="other-tenant"),
            Hotels(id="hotel-x", iweb_client_id=self.tenant, name="Hotel X", address="Calle X", phone="111"),
            Hotels(id="hotel-y", iweb_client_id=self.tenant, name="Hotel Y", address="Calle Y", phone="222"),
            Hotels(id="hotel-z", iweb_client_id=self.tenant, name="Hotel Z"),
            Hotels(id="foreign-hotel", iweb_client_id=self.other_tenant, name="Ajeno"),
            Salidas(id=self.salida_id, iweb_client_id=self.tenant),
            Salidas(id="other-salida", iweb_client_id=self.tenant),
            Reservas(id="active", iweb_client_id=self.tenant, salida_id=self.salida_id,
                     hotel_id="hotel-x", active=True),
            Reservas(id="inactive", iweb_client_id=self.tenant, salida_id=self.salida_id,
                     hotel_id="hotel-x", active=False),
            Reservas(id="other-departure", iweb_client_id=self.tenant, salida_id="other-salida",
                     hotel_id="hotel-x", active=True),
            ReservationRooms(id="room", iweb_client_id=self.tenant, reserva_id="active",
                             position=0, room_type="doble", hotel_id="hotel-x"),
            Passengers(id="p1", iweb_client_id=self.tenant, name="Ana", last_name="P\u00e9rez"),
            ReservationPassengers(id="replace", reserva_id="active", pasajero_id="p1",
                                  pasajero_type="ADL", hotel_id="hotel-x"),
            ReservationPassengers(id="keep", reserva_id="active", pasajero_id="p2",
                                  pasajero_type="ADL", hotel_id="hotel-z"),
            ReservationPassengers(id="inactive-passenger", reserva_id="inactive", pasajero_id="p3",
                                  pasajero_type="ADL", hotel_id="hotel-x"),
            ReservationPassengers(id="other-departure-passenger", reserva_id="other-departure",
                                  pasajero_id="p4", pasajero_type="ADL", hotel_id="hotel-x"),
        ])
        self.db.commit()
        self.actor = User(id="user", iweb_client_id=self.tenant)

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def replace(self, target_hotel_id="hotel-y"):
        return asyncio.run(replace_reservation_passenger_hotel(
            self.salida_id,
            ReservationPassengerHotelReplaceRequest(
                source_hotel_id="hotel-x",
                target_hotel_id=target_hotel_id,
            ),
            self.tenant,
            self.db,
            self.actor,
        ))

    def test_patch_route_is_registered(self):
        route = next(
            route for route in router.routes
            if route.path == "/salidas/{salida_id}/reservation-passengers/hotel"
        )
        self.assertIn("PATCH", route.methods)

    def test_replaces_only_active_passenger_assignments_in_the_departure(self):
        result = self.replace()

        self.assertEqual(result.updated_passengers, 1)
        self.assertEqual(self.db.get(ReservationPassengers, "replace").hotel_id, "hotel-y")
        self.assertEqual(self.db.get(ReservationPassengers, "keep").hotel_id, "hotel-z")
        self.assertEqual(self.db.get(ReservationPassengers, "inactive-passenger").hotel_id, "hotel-x")
        self.assertEqual(self.db.get(ReservationPassengers, "other-departure-passenger").hotel_id, "hotel-x")
        self.assertEqual(self.db.get(Reservas, "active").hotel_id, "hotel-x")
        self.assertEqual(self.db.get(ReservationRooms, "room").hotel_id, "hotel-x")

    def test_rejects_a_target_hotel_from_another_tenant(self):
        with self.assertRaisesRegex(HTTPException, "Hotel destino no encontrado"):
            self.replace("foreign-hotel")

    def test_passenger_voucher_uses_the_passenger_hotel_after_replacement(self):
        self.replace()

        voucher = asyncio.run(generate_voucher_snapshot(
            "active", self.tenant, self.db, passenger_id="replace",
        ))

        self.assertEqual(voucher.hotel_id, "hotel-y")
        self.assertEqual(voucher.hotel_name, "Hotel Y")
        self.assertEqual(voucher.hotel_address, "Calle Y")
        self.assertEqual(voucher.hotel_phone, "222")

    def test_general_voucher_keeps_the_reservation_hotel_as_its_fallback(self):
        self.replace()

        voucher = asyncio.run(generate_voucher_snapshot("active", self.tenant, self.db))

        self.assertEqual(voucher.hotel_id, "hotel-x")


if __name__ == "__main__":
    unittest.main()
