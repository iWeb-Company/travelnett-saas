"""Create historical provider-consumption tables and additive CC columns.

Read-only by default. Apply only against an authorized schema with --apply.
No existing reservations are evaluated and no backfill is performed.

Run from ``backend`` with ``python -m migrations.provider_consumptions --apply``.
The direct-file invocation is also supported for convenience.
"""
import argparse
import sys
from pathlib import Path

# ``python migrations/provider_consumptions.py`` sets ``migrations`` as the
# import root. Add ``backend`` so sibling packages such as ``models`` resolve.
if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import inspect, text

from models.models import cuentasCorrientesProviders, ccProvidersConsumptionPayments
from models.provider_consumptions import PROVIDER_CONSUMPTION_TABLES


def diagnose(bind):
    inspector = inspect(bind)
    existing = set(inspector.get_table_names())
    missing = [table.name for table in PROVIDER_CONSUMPTION_TABLES if table.name not in existing]
    columns = {
        "cuentas_corrientes_providers": {"provider_id"},
        "cc_providers_consumption_payments": {"consumption_group_id"},
    }
    incompatible = {}
    for table_name, required in columns.items():
        if table_name in existing:
            actual = {column["name"] for column in inspector.get_columns(table_name)}
            absent = required - actual
            if absent:
                incompatible[table_name] = sorted(absent)
    return {"missing_tables": missing, "incompatible_columns": incompatible}


def migrate(bind, *, apply=False):
    report = diagnose(bind)
    if apply:
        for table in PROVIDER_CONSUMPTION_TABLES:
            table.create(bind, checkfirst=True)
        inspector = inspect(bind)
        statements = []
        if inspector.has_table(cuentasCorrientesProviders.__tablename__) and "provider_id" not in {
            column["name"] for column in inspector.get_columns(cuentasCorrientesProviders.__tablename__)
        }:
            statements.append(text(
                "ALTER TABLE cuentas_corrientes_providers ADD COLUMN provider_id VARCHAR(36) NULL"
            ))
        if inspector.has_table(ccProvidersConsumptionPayments.__tablename__) and "consumption_group_id" not in {
            column["name"] for column in inspector.get_columns(ccProvidersConsumptionPayments.__tablename__)
        }:
            statements.append(text(
                "ALTER TABLE cc_providers_consumption_payments ADD COLUMN consumption_group_id VARCHAR(36) NULL"
            ))
        if statements:
            with bind.begin() as connection:
                for statement in statements:
                    connection.execute(statement)
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    from db.database import engine
    print(migrate(engine, apply=args.apply))
