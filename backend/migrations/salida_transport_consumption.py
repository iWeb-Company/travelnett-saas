"""Add departure transport prices and idempotent provider-consumption links.

Run before deploying the backend that records transport consumption:

    python -m migrations.salida_transport_consumption
"""
from sqlalchemy import inspect, text

from db.database import engine


def _add_column(bind, table_name, column_name, definition):
    existing_columns = {column["name"] for column in inspect(bind).get_columns(table_name)}
    if column_name not in existing_columns:
        with bind.begin() as connection:
            connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {definition}"))


def migrate(bind):
    _add_column(bind, "salidas", "precio_transporte", "NUMERIC(15, 2) NULL")
    _add_column(bind, "cc_providers_consumption_payments", "salida_id", "VARCHAR(36) NULL")
    existing_indexes = {index["name"] for index in inspect(bind).get_indexes("cc_providers_consumption_payments")}
    if "uq_cc_provider_consumption_salida" not in existing_indexes:
        with bind.begin() as connection:
            connection.execute(text(
                "CREATE UNIQUE INDEX uq_cc_provider_consumption_salida "
                "ON cc_providers_consumption_payments (salida_id)"
            ))


if __name__ == "__main__":
    migrate(engine)
    print("Migracion de consumos de transporte por salida completada")
