"""Regression coverage for provider consumption during reservation creation."""

import unittest
from datetime import date
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from db.database import Base
from models.models import (
    Hotels, PackageHotels, Packages, Passengers, Regimenes,
    ReservationPassengers, Reservas, Salidas, ccProvidersConsumptionPayments,
)
from models.providers import Provider, ProviderDestination, ProviderRegimenCost, ProviderService
from models.provider_consumptions import ProviderConsumptionGroup
from services.provider_consumptions import (
    create_provider_consumptions,
    reconcile_provider_consumptions,
    reverse_provider_consumptions,
)


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

    def test_multiple_providers_create_independent_consumptions(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        try:
            with Session(engine, autoflush=False) as db:
                tenant = "tenant"
                db.add_all([
                    Packages(id="package", iweb_client_id=tenant),
                    Salidas(id="salida", iweb_client_id=tenant, date_of_out="2026-09-11"),
                    Hotels(id="hotel", iweb_client_id=tenant),
                    PackageHotels(id="package-hotel", iweb_client_id=tenant, package_id="package", hotel_id="hotel", hotel_regimen_id="regimen"),
                    Regimenes(id="regimen", iweb_client_id=tenant),
                    Reservas(id="reservation", iweb_client_id=tenant, package_id="package", salida_id="salida", hotel_id="hotel", active=True),
                    Passengers(id="passenger", iweb_client_id=tenant),
                    ReservationPassengers(id="reservation-passenger", reserva_id="reservation", pasajero_id="passenger", pasajero_type="ADL", hotel_id="hotel"),
                ])
                for number, cost in (("one", "100"), ("two", "200")):
                    provider_id, destination_id, service_id = f"provider-{number}", f"destination-{number}", f"service-{number}"
                    db.add_all([
                        Provider(id=provider_id, iweb_client_id=tenant, name=number, type="hotel"),
                        ProviderDestination(id=destination_id, provider_id=provider_id, destino_id="destination", position=0),
                        ProviderService(id=service_id, provider_id=provider_id, destination_id=destination_id, hotel_id="hotel", position=0, validity_type="dates", start_date=date(2026, 9, 1), end_date=date(2026, 9, 30)),
                        ProviderRegimenCost(id=f"cost-{number}", service_id=service_id, regimen_id="regimen", cost=Decimal(cost)),
                    ])
                reservation = next(item for item in db.new if isinstance(item, Reservas))
                create_provider_consumptions(db, reservation)
                self.assertEqual(sorted(group.amount for group in db.query(ProviderConsumptionGroup).all()), [Decimal("100.00"), Decimal("200.00")])
        finally:
            engine.dispose()

    def test_reversal_removes_zero_amount_group_and_movement(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        try:
            with Session(engine, autoflush=False) as db:
                tenant = "tenant"
                db.add_all([
                    Packages(id="package", iweb_client_id=tenant), Salidas(id="salida", iweb_client_id=tenant, date_of_out="2026-09-11"),
                    Hotels(id="hotel", iweb_client_id=tenant), PackageHotels(id="package-hotel", iweb_client_id=tenant, package_id="package", hotel_id="hotel", hotel_regimen_id="regimen"),
                    Regimenes(id="regimen", iweb_client_id=tenant), Provider(id="provider", iweb_client_id=tenant, name="Proveedor", type="hotel"),
                    ProviderDestination(id="destination", provider_id="provider", destino_id="destination", position=0),
                    ProviderService(id="service", provider_id="provider", destination_id="destination", hotel_id="hotel", position=0, validity_type="dates", start_date=date(2026, 9, 1), end_date=date(2026, 9, 30)),
                    ProviderRegimenCost(id="cost", service_id="service", regimen_id="regimen", cost=Decimal("100")),
                    Reservas(id="reservation", iweb_client_id=tenant, package_id="package", salida_id="salida", hotel_id="hotel", active=True),
                    Passengers(id="passenger", iweb_client_id=tenant), ReservationPassengers(id="reservation-passenger", reserva_id="reservation", pasajero_id="passenger", pasajero_type="ADL", hotel_id="hotel"),
                ])
                reservation = next(item for item in db.new if isinstance(item, Reservas))
                create_provider_consumptions(db, reservation)
                db.flush()
                reverse_provider_consumptions(db, reservation)
                group = db.query(ProviderConsumptionGroup).one()
                self.assertFalse(group.active)
                self.assertEqual(group.amount, Decimal("0.00"))
                self.assertEqual(db.query(ccProvidersConsumptionPayments).filter_by(provider_type="proveedor").count(), 0)
        finally:
            engine.dispose()

    def test_hotel_change_moves_consumption_to_new_hotel_price(self):
        engine = create_engine("sqlite://")
        Base.metadata.create_all(engine)
        try:
            with Session(engine, autoflush=False) as db:
                tenant = "tenant"
                db.add_all([
                    Packages(id="package", iweb_client_id=tenant, periodo="periodo"),
                    Salidas(id="salida", iweb_client_id=tenant, date_of_out="2026-09-11"),
                    Hotels(id="hotel-old", iweb_client_id=tenant), Hotels(id="hotel-new", iweb_client_id=tenant),
                    PackageHotels(id="package-old", iweb_client_id=tenant, package_id="package", hotel_id="hotel-old", hotel_fecha_in="2026-09-12", hotel_regimen_id="regimen-old"),
                    PackageHotels(id="package-new", iweb_client_id=tenant, package_id="package", hotel_id="hotel-new", hotel_fecha_in="2026-09-13", hotel_regimen_id="regimen-new"),
                    Regimenes(id="regimen-old", iweb_client_id=tenant), Regimenes(id="regimen-new", iweb_client_id=tenant),
                    Reservas(id="reservation", iweb_client_id=tenant, package_id="package", salida_id="salida", hotel_id="hotel-old", active=True),
                    Passengers(id="passenger", iweb_client_id=tenant),
                    ReservationPassengers(id="reservation-passenger", reserva_id="reservation", pasajero_id="passenger", pasajero_type="ADL", hotel_id="hotel-old"),
                ])
                for suffix, hotel, regimen, cost in (("old", "hotel-old", "regimen-old", "2"), ("new", "hotel-new", "regimen-new", "7")):
                    provider_id, destination_id, service_id = f"provider-{suffix}", f"destination-{suffix}", f"service-{suffix}"
                    db.add_all([
                        Provider(id=provider_id, iweb_client_id=tenant, name=suffix, type="hotel"),
                        ProviderDestination(id=destination_id, provider_id=provider_id, destino_id="destination", position=0),
                        ProviderService(id=service_id, provider_id=provider_id, destination_id=destination_id, hotel_id=hotel, position=0, validity_type="dates", start_date=date(2026, 9, 1), end_date=date(2026, 9, 30)),
                        ProviderRegimenCost(id=f"cost-{suffix}", service_id=service_id, regimen_id=regimen, cost=Decimal(cost)),
                    ])
                db.flush()
                reservation = db.get(Reservas, "reservation")
                create_provider_consumptions(db, reservation)
                old_group = db.query(ProviderConsumptionGroup).one()
                db.get(ReservationPassengers, "reservation-passenger").hotel_id = "hotel-new"
                reconcile_provider_consumptions(db, reservation)
                groups = {g.provider_id: g for g in db.query(ProviderConsumptionGroup).all()}
                self.assertEqual(groups["provider-old"].amount, Decimal("0.00"))
                self.assertEqual(groups["provider-new"].amount, Decimal("7.00"))
                self.assertFalse(old_group.active)
                self.assertEqual(db.query(ccProvidersConsumptionPayments).filter_by(type="consumo").count(), 1)
                self.assertEqual(db.query(ccProvidersConsumptionPayments).filter_by(type="consumo").one().amount, Decimal("7.00"))
        finally:
            engine.dispose()


if __name__ == "__main__":
    unittest.main()
