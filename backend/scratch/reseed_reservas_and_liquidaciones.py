import uuid
import random
from db.database import SessionLocal
from models.models import (
    Reservas,
    ReservationPassengers,
    Vouchers,
    Liquidaciones,
    GastosNoCommission,
    Salidas,
    Clients,
    Passengers,
    LugaresCarga,
    Hotels,
    Regimenes,
    Destinos,
    Pagos,
    Packages,
    Accounts
)

MIN_RESERVAS_PER_SALIDA  = 10
MIN_PASAJEROS_PER_SALIDA = 20

ROOM_OPTIONS = [
    '["DBL_MAT"]',
    '["SGL"]',
    '["DBL_MAT", "SGL"]',
    '["triple_individual"]',
    '["doble_individual", "SGL"]',
    '["cuadruple_individual"]',
    '["DBL_MAT", "DBL_MAT"]',
]

GASTO_NOMBRES = [
    "Gastos de Gestion",
    "Asistencia al Viajero",
    "Impuesto Tasa Turistica",
    "Gastos de Reserva",
    "Gastos Administrativos",
    "Seguro de Viaje",
    "Tasas Aereas",
    "Combustible Turistico",
]

OBSERVACIONES = [
    "Pasajero frecuente",
    "Solicita asiento ventana",
    "Alergico al gluten",
    "Primera vez en el destino",
    "Viaja con menor",
    "", "", "", "", "",
]

PAYMENT_METHODS = ["Transferencia", "Efectivo", "Tarjeta de Crédito", "Mercado Pago"]

def reseed():
    db = SessionLocal()
    try:
        tenant_id = "fdd2a8bf-4c81-4743-99e0-5d0443b5465b"
        random.seed(42)

        print("Clearing old reservation data...")
        db.query(Pagos).delete()
        db.query(ReservationPassengers).delete()
        db.query(Vouchers).delete()
        db.query(GastosNoCommission).delete()
        db.query(Liquidaciones).delete()
        db.query(Reservas).delete()
        db.commit()

        salidas       = db.query(Salidas).filter(Salidas.iweb_client_id == tenant_id).all()
        clients       = db.query(Clients).filter(Clients.iweb_client_id == tenant_id).all()
        passengers    = db.query(Passengers).filter(Passengers.iweb_client_id == tenant_id).all()
        lugares_carga = db.query(LugaresCarga).filter(LugaresCarga.iweb_client_id == tenant_id).all()
        hotels        = db.query(Hotels).all()
        regimenes     = db.query(Regimenes).all()
        destinos      = db.query(Destinos).all()
        packages      = db.query(Packages).filter(Packages.iweb_client_id == tenant_id).all()
        accounts      = db.query(Accounts).filter(Accounts.iweb_client_id == tenant_id).all()

        dest_map = {d.id: d.sigla for d in destinos if d.sigla}
        pkg_id   = packages[0].id if packages else str(uuid.uuid4())
        acc_id   = accounts[0].id if accounts else None

        if not salidas or not passengers:
            print("Insufficient base data for seeding")
            return

        print(f"Found {len(salidas)} salidas, {len(clients)} clients, {len(passengers)} passengers")

        total_res_created = 0
        total_pax_created = 0
        total_pagos_created = 0
        pax_global_idx    = 0

        for sal in salidas:
            sigla = dest_map.get(sal.destino, "RES").upper()

            pax_dist  = [random.randint(1, 3) for _ in range(MIN_RESERVAS_PER_SALIDA)]
            pax_total = sum(pax_dist)
            while pax_total < MIN_PASAJEROS_PER_SALIDA:
                pax_dist[random.randint(0, len(pax_dist) - 1)] += 1
                pax_total += 1

            print(f"  Salida {sal.id[:8]} ({sigla}): {len(pax_dist)} reservas, {pax_total} pasajeros")

            for res_num, pax_count in enumerate(pax_dist, start=1):
                res_id = str(uuid.uuid4())
                codigo = f"{sigla}#{str(res_num).zfill(2)}"

                cli     = random.choice(clients) if clients else None
                lc_root = random.choice(lugares_carga).id if lugares_carga else None
                h_id    = random.choice(hotels).id if hotels else None
                r_id    = random.choice(regimenes).id if regimenes else None

                total_res  = round(random.uniform(150000, 900000), 2)
                gasto_amt  = round(random.uniform(10000, 60000), 2)
                total_comm = total_res - gasto_amt
                client_comm_pct = cli.commission if (cli and cli.commission is not None) else 10
                commission = round(total_comm * (client_comm_pct / 100.0), 2)

                res = Reservas(
                    id=res_id,
                    iweb_client_id=tenant_id,
                    salida_id=sal.id,
                    package_id=pkg_id,
                    codigo_reserva=codigo,
                    client_id=cli.id if cli else None,
                    lugar_carga_id=lc_root,
                    hotel_id=h_id,
                    regimen_id=r_id,
                    rooming_id=None,
                    room_type=random.choice(ROOM_OPTIONS),
                    active=True,
                    venciment="2026-08-31",
                    observations=random.choice(OBSERVACIONES)
                )
                db.add(res)
                db.flush()

                for p_sub in range(pax_count):
                    pax_obj  = passengers[pax_global_idx % len(passengers)]
                    pax_global_idx += 1
                    pax_lc   = random.choice(lugares_carga).id if lugares_carga else lc_root
                    bt       = "semicama" if random.random() < 0.7 else "cama"
                    edad_cat = "ADL" if p_sub == 0 else random.choice(["ADL", "CHD", "INF"])

                    rp = ReservationPassengers(
                        id=str(uuid.uuid4()),
                        reserva_id=res_id,
                        pasajero_id=pax_obj.id,
                        pasajero_type=edad_cat,
                        butaca_number=None,
                        butaca_type=bt,
                        bus_number="1",
                        lugar_carga_id=pax_lc
                    )
                    db.add(rp)
                    total_pax_created += 1

                liq_id = str(uuid.uuid4())
                liq = Liquidaciones(
                    id=liq_id,
                    iweb_client_id=tenant_id,
                    booking_id=res_id,
                    total_amout=total_res,
                    total_commission=total_comm,
                    commission=commission
                )
                db.add(liq)
                db.flush()

                gasto = GastosNoCommission(
                    id=str(uuid.uuid4()),
                    liquidacion_id=liq_id,
                    name=random.choice(GASTO_NOMBRES),
                    amount=gasto_amt,
                    iweb_client_id=tenant_id
                )
                db.add(gasto)

                # Generar por lo menos 4 pagos por cada reserva
                pago_dates = ["2026-05-10", "2026-05-25", "2026-06-05", "2026-06-20"]
                pago_portion = round(total_res * random.uniform(0.10, 0.18), 2)
                for p_idx in range(4):
                    pago_obj = Pagos(
                        id=str(uuid.uuid4()),
                        iweb_client_id=tenant_id,
                        reserva_id=res_id,
                        payment_method=random.choice(PAYMENT_METHODS),
                        date_pay=pago_dates[p_idx],
                        amount=round(pago_portion * random.uniform(0.9, 1.1), 2),
                        currency="ARS",
                        observations=f"Pago parcial #{p_idx + 1}",
                        receipt_number=f"REC-{total_pagos_created + 1:04d}",
                        account_id=acc_id
                    )
                    db.add(pago_obj)
                    total_pagos_created += 1

                total_res_created += 1

        db.commit()
        print(f"\nReseed completado:")
        print(f"  {len(salidas)} salidas procesadas")
        print(f"  {total_res_created} reservas creadas")
        print(f"  {total_pax_created} pasajeros en reservation_passengers")
        print(f"  {total_pagos_created} pagos registrados (4 por reserva)")

    except Exception as e:
        db.rollback()
        print("Error re-seeding:", e)
        import traceback; traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    reseed()
