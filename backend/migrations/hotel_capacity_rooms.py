"""Materialize legacy reservation rooms before counting hotel capacity by room.

Run from backend:
    .venv/Scripts/python.exe -m migrations.hotel_capacity_rooms
    .venv/Scripts/python.exe -m migrations.hotel_capacity_rooms --apply

The default mode is read-only. ``--apply`` creates missing persisted room
records and links passengers using the existing additive room migration. It
never guesses a new numeric ``package_hotel_capacity.capacidad``: agencies
must review those values if they were originally entered as passengers rather
than rooms.
"""
import argparse

from sqlalchemy import inspect

from db.database import engine
from models.models import PackageHotelCapacity, ReservationPassengers, ReservationRooms
from services.availability import occupied_hotels


def diagnose(bind):
    inspector = inspect(bind)
    tables = set(inspector.get_table_names())
    missing_rooms_table = ReservationRooms.__tablename__ not in tables
    missing_room_link = (
        ReservationPassengers.__tablename__ not in tables
        or "reservation_room_id" not in {
            column["name"] for column in inspector.get_columns(ReservationPassengers.__tablename__)
        }
    )
    capacities = []
    if PackageHotelCapacity.__tablename__ in tables:
        from sqlalchemy.orm import Session
        with Session(bind) as session:
            can_count_rooms = not missing_rooms_table and not missing_room_link
            occupancy_by_tenant_package = {}
            for capacity in session.query(PackageHotelCapacity).all():
                key = (capacity.iweb_client_id, capacity.package_id)
                if can_count_rooms and key not in occupancy_by_tenant_package:
                    occupancy_by_tenant_package[key] = occupied_hotels(session, *key)
                capacities.append({
                    "package_id": capacity.package_id,
                    "salida_id": capacity.salida_id,
                    "hotel_id": capacity.hotel_id,
                    "capacidad": capacity.capacidad,
                    "habitaciones_ocupadas": (
                        occupancy_by_tenant_package[key].get(
                            (capacity.package_id, capacity.salida_id, capacity.hotel_id), 0
                        ) if can_count_rooms else None
                    ),
                })
    return {
        "missing_reservation_rooms_table": missing_rooms_table,
        "missing_reservation_room_link": missing_room_link,
        "capacities": capacities,
    }


def migrate(bind, *, apply=False):
    report = diagnose(bind)
    if apply:
        from migrations.reservation_rooms import migrate as migrate_reservation_rooms
        migrate_reservation_rooms(bind)
        report = diagnose(bind)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    print(migrate(engine, apply=args.apply))
