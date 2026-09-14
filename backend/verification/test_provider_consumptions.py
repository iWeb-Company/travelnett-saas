"""Regression coverage for provider consumption during reservation creation."""

import unittest
from datetime import date
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from db.database import Base
from models.models import (
    Hotels, PackageHotels, Packages, Passengers, Regimenes,
    ReservationPassengers, Reservas, Salidas,
)
from models.providers import Provider, ProviderDestination, ProviderRegimenCost, ProviderService
from models.provider_consumptions import ProviderConsumptionGroup
from services.provider_consumptions import create_provider_consumptions


class ProviderConsumptionTests(unittest.TestCase):
    def test_new_reservation_passengers_are_included_with_autoflush_disabled(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        try:
            with Session(engine, autoflush=False) as db:
                tenant = "tenant"
                db.add_all([
                    Packages(id="package", iweb_client_id=tenant, periodo="periodo"),
                    Salidas(id="salida", iweb_client_id=tenant, date_of_out="2026-09-11"),
                    Hotels(id="hotel", iweb_client_id=tenant, name="Continental"),
                    PackageHotels(
                        id="package-hotel", iweb_client_id=tenant, package_id="package",
                        hotel_id="hotel", hotel_fecha_in="2026-09-12", hotel_regimen_id="regimen",
                    ),
                    Regimenes(id="regimen", iweb_client_id=tenant, name="Pensión completa"),
                    Provider(id="provider", iweb_client_id=tenant, name="Diego", type="hotel"),
                    ProviderDestination(id="provider-destination", provider_id="provider", destino_id="salta", position=0),
                    ProviderService(
                        id="provider-service", provider_id="provider", destination_id="provider-destination",
                        hotel_id="hotel", position=0, validity_type="dates",
                        start_date=date(2026, 9, 1), end_date=date(2026, 9, 30),
                    ),
                    Reservas(
                        id="reservation", iweb_client_id=tenant, package_id="package", salida_id="salida",
                        hotel_id="hotel", regimen_id=None, active=True, type="tradicional",
                    ),
                    Passengers(id="passenger", iweb_client_id=tenant),
                    ReservationPassengers(
                        id="reservation-passenger", reserva_id="reservation", pasajero_id="passenger",
                        pasajero_type="ADL", hotel_id="hotel",
                    ),
                ])
                db.add(ProviderRegimenCost(id="provider-cost", service_id="provider-service", regimen_id="regimen", cost=Decimal("300")))
                reservation = next(item for item in db.new if isinstance(item, Reservas))
                create_provider_consumptions(db, reservation)

                group = db.query(ProviderConsumptionGroup).one()
                self.assertEqual(group.amount, Decimal("300.00"))
        finally:
            engine.dispose()


if __name__ == "__main__":
    unittest.main()
