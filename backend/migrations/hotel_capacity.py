"""Run from backend: .venv/Scripts/python.exe -m migrations.hotel_capacity.

Additive and restartable. Never assigns guessed capacity to existing departures.
MySQL DDL commits implicitly; deploy before the application version using it.
"""
from sqlalchemy import inspect, text
from db.database import engine
from models.models import PackageHotelCapacity


def migrate(bind):
    additions = {
        "packages": {"name_system": "VARCHAR(255) NULL"},
        "package_hotels": {field: "BOOLEAN NOT NULL DEFAULT 0" for field in ("estandar", "superior", "suite")},
        "reservation_passengers": {"hotel_id": "VARCHAR(36) NULL"},
    }
    for table, columns in additions.items():
        existing = {c["name"] for c in inspect(bind).get_columns(table)}
        for name, ddl in columns.items():
            if name not in existing:
                with bind.begin() as connection:
                    connection.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
    PackageHotelCapacity.__table__.create(bind, checkfirst=True)


if __name__ == "__main__":
    migrate(engine)
    print("Migración de cupo hotelero completada")
