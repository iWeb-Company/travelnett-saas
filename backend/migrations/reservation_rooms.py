"""Run from backend: .venv/Scripts/python.exe -m migrations.reservation_rooms.

Additive, idempotent migration that materializes reservation rooms and links
existing passenger assignments without deleting legacy data.
"""
from sqlalchemy import inspect, text

from db.database import engine
from models.models import Reservas, ReservationPassengers, ReservationRooms
from services.reservation_rooms import sync_reservation_rooms


def migrate(bind):
    ReservationRooms.__table__.create(bind, checkfirst=True)
    columns = {column["name"] for column in inspect(bind).get_columns("reservation_passengers")}
    if "reservation_room_id" not in columns:
        with bind.begin() as connection:
            connection.execute(text(
                "ALTER TABLE reservation_passengers ADD COLUMN reservation_room_id VARCHAR(36) NULL"
            ))

    from sqlalchemy.orm import Session
    with Session(bind) as session:
        for reservation in session.query(Reservas).all():
            sync_reservation_rooms(session, reservation)
        session.commit()


if __name__ == "__main__":
    migrate(engine)
    print("Migración de habitaciones de reserva completada")
