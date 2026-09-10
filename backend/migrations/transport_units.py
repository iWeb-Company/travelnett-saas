"""Offline expansion/backfill. Default CLI is read-only; --apply requires stopped writers.

Reflection deliberately avoids querying new ORM columns against a legacy schema.
"""
import argparse
import json
import uuid
from collections import Counter
from decimal import Decimal

from sqlalchemy import MetaData, Table, inspect, select, text


def _tables(bind):
    meta = MetaData()
    return {name: Table(name, meta, autoload_with=bind) for name in (
        "salidas", "reservas", "reservation_passengers", "transport_companies",
        "bus_types", "cc_providers_consumption_payments",
    )}


def diagnose(bind):
    tables = _tables(bind)
    with bind.connect() as db:
        rows = {name: list(db.execute(select(table)).mappings()) for name, table in tables.items()}
        migrated = set()
        if inspect(bind).has_table("salida_transport_units"):
            migrated = set(db.execute(text("SELECT salida_id FROM salida_transport_units")).scalars())
    reports = []
    for salida in rows["salidas"]:
        if (salida["type"] or "").lower().strip() not in {"bus", "micro"} or salida["id"] in migrated:
            continue
        conflicts = []
        tenant = salida["iweb_client_id"]
        bookings = {r["id"]: r for r in rows["reservas"] if r["salida_id"] == salida["id"]}
        passengers = [p for p in rows["reservation_passengers"] if p["reserva_id"] in bookings]
        expenses = [e for e in rows["cc_providers_consumption_payments"] if e["salida_id"] == salida["id"]]
        company = next((c for c in rows["transport_companies"] if c["id"] == salida["transport_company"] and c["iweb_client_id"] == tenant), None)
        template = next((b for b in rows["bus_types"] if b["id"] == salida["type_bus"] and b["iweb_client_id"] == tenant), None)
        if not company:
            conflicts.append("invalid_company")
        if salida["type_bus"] and not template:
            conflicts.append("invalid_bus_type")
        if any((salida[k] or 0) < 0 for k in ("semicama", "cama")) or salida["precio_transporte"] is None or Decimal(str(salida["precio_transporte"] or 0)) < 0:
            conflicts.append("invalid_capacity_or_price")
        if any(r["iweb_client_id"] != tenant for r in bookings.values()):
            conflicts.append("invalid_booking_tenant")
        if any(str(p["bus_number"] or "").strip() not in {"", "1"} for p in passengers):
            conflicts.append("ambiguous_bus_number")
        if any((p["butaca_type"] or "").strip().lower() not in {"cama", "semicama"} for p in passengers):
            conflicts.append("invalid_seat_category")
        occupied = [p for p in passengers if bookings[p["reserva_id"]]["active"] is not False and bookings[p["reserva_id"]]["active"] != 0]
        seats = Counter((p["butaca_type"], p["butaca_number"]) for p in occupied if p["butaca_number"] is not None)
        if any(n > 1 for n in seats.values()):
            conflicts.append("duplicate_seat")
        for kind in ("semicama", "cama"):
            if sum(p["butaca_type"] == kind for p in occupied) > (salida[kind] or 0):
                conflicts.append("over_capacity")
        if any(p["butaca_number"] is not None and (p["butaca_number"] < 1 or p["butaca_number"] > (salida.get(p["butaca_type"], 0) or 0)) for p in passengers):
            conflicts.append("invalid_seat_number")
        if len(expenses) > 1 or any(e["iweb_client_id"] != tenant or e["transport_id"] != salida["transport_company"] or e["type"] != "consumo" or Decimal(str(e["amount"] or 0)) != Decimal(str(salida["precio_transporte"] or 0)) for e in expenses):
            conflicts.append("ambiguous_consumption")
        if not expenses and (salida["precio_transporte"] or 0) > 0:
            conflicts.append("missing_consumption")
        reports.append(dict(salida_id=salida["id"], conflicts=sorted(set(conflicts)),
                            passengers=len(passengers), expenses=len(expenses)))
    return reports


def migrate(bind):
    from models.models import SalidaTransportUnit

    report = diagnose(bind)
    SalidaTransportUnit.__table__.create(bind, checkfirst=True)
    for name in ("reservation_passengers", "cc_providers_consumption_payments"):
        if "salida_transport_unit_id" not in {c["name"] for c in inspect(bind).get_columns(name)}:
            with bind.begin() as db:
                db.execute(text(f"ALTER TABLE {name} ADD COLUMN salida_transport_unit_id VARCHAR(36) NULL"))
    tables = _tables(bind)
    for item in report:
        if item["conflicts"]:
            continue
        with bind.begin() as db:
            s = db.execute(select(tables["salidas"]).where(tables["salidas"].c.id == item["salida_id"])).mappings().one()
            unit_id = str(uuid.uuid4())
            template = db.execute(select(tables["bus_types"]).where(tables["bus_types"].c.id == s["type_bus"])).mappings().first()
            db.execute(SalidaTransportUnit.__table__.insert().values(
                id=unit_id, iweb_client_id=s["iweb_client_id"], salida_id=s["id"], number=1,
                transport_company=s["transport_company"], price=s["precio_transporte"], type_bus=s["type_bus"],
                semicama=s["semicama"] or 0, cama=s["cama"] or 0,
                layout_snapshot={"semicama_quantity": s["semicama"] or 0, "cama_quantity": s["cama"] or 0,
                                 "panoramicos_quantity": (template["panoramicos_quantity"] or 0) if template else 0,
                                 "name": template["name"] if template else None},
                coordinador_nombre=s["coordinador_nombre"], coordinador_telefono=s["coordinador_telefono"],
                active=True, revision=0,
            ))
            db.execute(text("UPDATE reservation_passengers SET salida_transport_unit_id=:unit WHERE reserva_id IN (SELECT id FROM reservas WHERE salida_id=:salida)"), {"unit": unit_id, "salida": s["id"]})
            db.execute(text("UPDATE cc_providers_consumption_payments SET salida_transport_unit_id=:unit WHERE salida_id=:salida"), {"unit": unit_id, "salida": s["id"]})
    # Writers must remain stopped through index cutover and application deployment.
    name = "cc_providers_consumption_payments"
    indexes = {i["name"] for i in inspect(bind).get_indexes(name)}
    with bind.begin() as db:
        if "uq_cc_provider_consumption_unit" not in indexes:
            db.execute(text(f"CREATE UNIQUE INDEX uq_cc_provider_consumption_unit ON {name}(salida_transport_unit_id)"))
        if "uq_cc_provider_consumption_salida" in indexes:
            suffix = f" ON {name}" if bind.dialect.name in {"mysql", "mariadb"} else ""
            db.execute(text(f"DROP INDEX uq_cc_provider_consumption_salida{suffix}"))
    return report


if __name__ == "__main__":
    from db.database import engine
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    print(json.dumps(migrate(engine) if args.apply else diagnose(engine), indent=2))
