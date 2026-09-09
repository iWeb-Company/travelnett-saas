"""Allow accumulated transport-price audit entries in supplier-consumption detail.

Run from backend before deploying the audit-enabled backend:

    .venv\\Scripts\\python.exe -m migrations.transport_consumption_detail_text
"""
from sqlalchemy import inspect, text

from db.database import engine


def migrate(bind):
    column = next(
        (item for item in inspect(bind).get_columns("cc_providers_consumption_payments") if item["name"] == "detail"),
        None,
    )
    if column is None:
        return
    if bind.dialect.name == "mysql" and "TEXT" not in str(column["type"]).upper():
        with bind.begin() as connection:
            connection.execute(text(
                "ALTER TABLE cc_providers_consumption_payments MODIFY COLUMN detail TEXT NULL"
            ))


if __name__ == "__main__":
    migrate(engine)
    print("Migración de detalle de consumos de transporte completada")
