"""Additive, restartable migration for manually edited automatic expenses.

Run before deploying the updated backend:

    python -m migrations.liquidacion_expense_overrides

Existing rows keep NULL so package-derived expenses continue to update
automatically until a user edits or removes the corresponding item.
"""
from sqlalchemy import inspect, text

from db.database import engine


OVERRIDE_COLUMNS = (
    "adicional_cama_override",
    "single_gastos_override",
    "total_amout_override",
    "total_commission_override",
)


def migrate(bind):
    existing_columns = {column["name"] for column in inspect(bind).get_columns("liquidaciones")}
    for column_name in OVERRIDE_COLUMNS:
        if column_name not in existing_columns:
            with bind.begin() as connection:
                connection.execute(text(
                    f"ALTER TABLE liquidaciones ADD COLUMN {column_name} NUMERIC(15, 2) NULL"
                ))


if __name__ == "__main__":
    migrate(engine)
    print("Migración de overrides de gastos no comisionables completada")
