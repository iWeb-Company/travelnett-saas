from datetime import date, datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any

from db.database import get_db
from models.models import Salidas, Reservas, Packages, Liquidaciones, Destinos, Clients

router = APIRouter(prefix="/dashboard")


@router.get("/summary", tags=["Dashboard"])
async def get_dashboard_summary(iweb_client_id: str = Query(...), db: Session = Depends(get_db)) -> Dict[str, Any]:
    today = date.today()

    # 1. Próxima Salida
    salidas = db.query(Salidas).filter(Salidas.iweb_client_id == iweb_client_id).all()
    upcoming = []
    for s in salidas:
        if s.date_of_out:
            try:
                dt_str = s.date_of_out.split()[0]
                dt = datetime.strptime(dt_str, "%Y-%m-%d").date()
                upcoming.append((dt, s))
            except Exception:
                pass

    upcoming.sort(key=lambda x: x[0])
    future = [x for x in upcoming if x[0] >= today]
    target = future[0] if future else (upcoming[-1] if upcoming else None)

    proxima_salida_str = "Sin salidas próximas"
    if target:
        dt, s = target
        dest_name = ""
        if s.destino:
            dest = db.query(Destinos).filter(Destinos.id == s.destino).first()
            if dest:
                dest_name = dest.sigla or dest.name or ""
        salida_code = dest_name or s.periodo or "SALIDA"
        proxima_salida_str = f"{salida_code} {dt.strftime('%d/%m/%Y')}"

    # 2. Reservas del día / total
    reservas_count = db.query(Reservas).filter(Reservas.iweb_client_id == iweb_client_id, Reservas.active == True).count()

    # 3. Saldo general
    total_liq = db.query(func.sum(Liquidaciones.total_amout)).filter(Liquidaciones.iweb_client_id == iweb_client_id).scalar() or 0.0
    saldo_mes_str = f"${total_liq:,.0f}".replace(",", ".")

    # 4. Paquetes activos
    paquetes_count = db.query(Packages).filter(Packages.iweb_client_id == iweb_client_id, Packages.active == True).count()

    # 5. Cliente del mes
    top_client_row = (
        db.query(Clients.complete_name, func.count(Reservas.id))
        .join(Reservas, Reservas.client_id == Clients.id)
        .filter(Reservas.iweb_client_id == iweb_client_id)
        .group_by(Clients.complete_name)
        .order_by(func.count(Reservas.id).desc())
        .first()
    )
    if not top_client_row or not top_client_row[0]:
        top_client_row = (
            db.query(Clients.name_system, func.count(Reservas.id))
            .join(Reservas, Reservas.client_id == Clients.id)
            .filter(Reservas.iweb_client_id == iweb_client_id)
            .group_by(Clients.name_system)
            .order_by(func.count(Reservas.id).desc())
            .first()
        )

    cliente_mes = top_client_row[0] if top_client_row and top_client_row[0] else "Sin datos"

    return {
        "proxima_salida": proxima_salida_str,
        "reservas_hoy": reservas_count,
        "saldo_mes": saldo_mes_str,
        "reservas_mes": reservas_count,
        "paquetes_activos": paquetes_count,
        "cliente_del_mes": cliente_mes,
    }
