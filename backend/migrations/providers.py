"""Add only provider catalog tables. Default is read-only; --apply is explicit.

Run from backend: python -m migrations.providers [--apply]
Rollback is to disable the provider router; preserve these tables and identities.
No backfill, reservation, consumption or account changes are performed.
"""
import argparse

from sqlalchemy import inspect

from models.providers import PROVIDER_TABLES


def diagnose(bind):
    inspector = inspect(bind)
    existing = set(inspector.get_table_names())
    missing = [t.name for t in PROVIDER_TABLES if t.name not in existing]
    incompatible = {}
    for table in PROVIDER_TABLES:
        if table.name in existing:
            columns = {c['name'] for c in inspector.get_columns(table.name)}
            absent = set(table.columns.keys()) - columns
            if absent:
                incompatible[table.name] = sorted(absent)
    return {'missing_tables': missing, 'incompatible_tables': incompatible}


def migrate(bind, *, apply=False):
    report = diagnose(bind)
    if report['incompatible_tables']:
        raise RuntimeError('Esquema de proveedores incompatible; revisar antes de aplicar')
    if apply:
        for table in PROVIDER_TABLES:
            table.create(bind, checkfirst=True)
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    from db.database import engine
    print(migrate(engine, apply=args.apply))
