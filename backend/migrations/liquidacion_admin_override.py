"""Additive, restartable migration. Run before deploying the updated backend:

    python -m migrations.liquidacion_admin_override

Existing rows keep NULL (automatic fees); no historical totals are rewritten.
"""
from sqlalchemy import inspect, text
from db.database import engine


def migrate(bind):
    if "admin_gastos_override" not in {c["name"] for c in inspect(bind).get_columns("liquidaciones")}:
        with bind.begin() as connection:
            connection.execute(text(
                "ALTER TABLE liquidaciones ADD COLUMN admin_gastos_override NUMERIC(15, 2) NULL"
            ))


if __name__ == "__main__":
    migrate(engine)
    print("Migración de gastos administrativos completada")
