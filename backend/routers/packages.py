import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.models import Packages, PackagesDatesOfExit, PackageHotels
from schemas.schemas import (
    PackageResponse,
    PackageHotelResponse,
    PackageCreateRequest,
    PackageUpdateRequest,
)

router = APIRouter(prefix="/packages", tags=["Packages CRUD"])


def _build_hotel_response(ph: PackageHotels) -> PackageHotelResponse:
    return PackageHotelResponse(
        id=ph.id,
        iweb_client_id=ph.iweb_client_id,
        package_id=ph.package_id,
        hotel_id=ph.hotel_id,
        hotel_noches=ph.hotel_noches,
        hotel_fecha_in=ph.hotel_fecha_in,
        hotel_fecha_out=ph.hotel_fecha_out,
        hotel_fecha_salida_mas=ph.hotel_fecha_salida_mas,
        hotel_regimen_id=ph.hotel_regimen_id,
        tarifa_single=ph.tarifa_single,
        comisionable_single=ph.comisionable_single,
        tarifa_doble=ph.tarifa_doble,
        tarifa_triple=ph.tarifa_triple,
        tarifa_cuadruple=ph.tarifa_cuadruple,
        tarifa_quintuple=ph.tarifa_quintuple,
        tarifa_menores=ph.tarifa_menores,
        pricing_type=ph.pricing_type,
    )


def _build_package_response(
    p: Packages,
    dates_list: list[str],
    hotels_list: list[PackageHotelResponse],
) -> PackageResponse:
    return PackageResponse(
        id=p.id,
        iweb_client_id=p.iweb_client_id,
        name=p.name,
        subtitle=p.subtitle,
        description=p.description,
        price=p.price,
        gastos=p.gastos,
        adicional=p.adicional,
        destino=p.destino,
        periodo=p.periodo,
        image=p.image,
        active=p.active,
        web=p.web,
        dates=dates_list,
        comisionable=p.comisionable,
        moneda=p.moneda,
        moneda_gastos=p.moneda_gastos,
        moneda_adicional=p.moneda_adicional,
        excursiones=p.excursiones,
        hotels=hotels_list,
    )


import math
from typing import Optional, Any
from fastapi import Query

@router.get("/get_packages", response_model=Any)
async def get_packages(
    iweb_client_id: str,
    page: Optional[int] = Query(None, ge=1),
    limit: int = Query(5, ge=1),
    db: Session = Depends(get_db)
):
    q = db.query(Packages).filter(Packages.iweb_client_id == iweb_client_id)
    total = q.count() if page is not None else 0

    if page is not None:
        pkgs = q.offset((page - 1) * limit).limit(limit).all()
    else:
        pkgs = q.all()

    if not pkgs:
        if page is not None:
            return {"items": [], "total": 0, "page": page, "limit": limit, "total_pages": 1}
        return []

    pkg_ids = [p.id for p in pkgs]

    # Batch-load dates
    all_rels = db.query(PackagesDatesOfExit).filter(
        PackagesDatesOfExit.iweb_client_id == iweb_client_id,
        PackagesDatesOfExit.package_id.in_(pkg_ids),
        PackagesDatesOfExit.active == True
    ).all()
    dates_by_pkg: dict[str, list[str]] = {}
    for r in all_rels:
        if r.package_id not in dates_by_pkg:
            dates_by_pkg[r.package_id] = []
        if r.salida_id:
            dates_by_pkg[r.package_id].append(r.salida_id)

    # Batch-load package hotels
    all_ph = db.query(PackageHotels).filter(
        PackageHotels.iweb_client_id == iweb_client_id,
        PackageHotels.package_id.in_(pkg_ids),
    ).all()
    hotels_by_pkg: dict[str, list[PackageHotelResponse]] = {}
    for ph in all_ph:
        if ph.package_id not in hotels_by_pkg:
            hotels_by_pkg[ph.package_id] = []
        hotels_by_pkg[ph.package_id].append(_build_hotel_response(ph))

    res_list = [
        _build_package_response(
            p,
            dates_by_pkg.get(p.id, []),
            hotels_by_pkg.get(p.id, []),
        )
        for p in pkgs
    ]

    if page is not None:
        total_pages = math.ceil(total / limit) if total > 0 else 1
        return {
            "items": res_list,
            "total": total,
            "page": page,
            "limit": limit,
            "total_pages": total_pages
        }
    return res_list


@router.get("/get_package/{id}", response_model=PackageResponse)
async def get_package(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    p = db.query(Packages).filter(
        Packages.id == id,
        Packages.iweb_client_id == iweb_client_id
    ).first()

    if not p:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    rels = db.query(PackagesDatesOfExit).filter(
        PackagesDatesOfExit.iweb_client_id == iweb_client_id,
        PackagesDatesOfExit.package_id == p.id,
        PackagesDatesOfExit.active == True
    ).all()
    dates_list = [r.salida_id for r in rels if r.salida_id]

    ph_rows = db.query(PackageHotels).filter(
        PackageHotels.iweb_client_id == iweb_client_id,
        PackageHotels.package_id == p.id,
    ).all()
    hotels_list = [_build_hotel_response(ph) for ph in ph_rows]

    return _build_package_response(p, dates_list, hotels_list)


@router.post("/create_package", response_model=PackageResponse)
async def create_package(
    body: PackageCreateRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    pkg_id = str(uuid.uuid4())
    new_pkg = Packages(
        id=pkg_id,
        iweb_client_id=iweb_client_id,
        name=body.name,
        subtitle=body.subtitle,
        description=body.description,
        price=body.price,
        gastos=body.gastos,
        adicional=body.adicional,
        destino=body.destino,
        periodo=body.periodo,
        image=body.image,
        active=body.active,
        web=body.web,
        comisionable=body.comisionable,
        moneda=body.moneda,
        moneda_gastos=body.moneda_gastos,
        moneda_adicional=body.moneda_adicional,
        excursiones=body.excursiones,
    )
    db.add(new_pkg)

    # Guardar fechas de salida
    if body.dates:
        for s_id in body.dates:
            db.add(PackagesDatesOfExit(
                id=str(uuid.uuid4()),
                iweb_client_id=iweb_client_id,
                package_id=pkg_id,
                salida_id=s_id,
                active=True,
            ))

    # Guardar hoteles
    hotels_created: list[PackageHotelResponse] = []
    for h in body.hotels:
        ph_id = str(uuid.uuid4())
        ph = PackageHotels(
            id=ph_id,
            iweb_client_id=iweb_client_id,
            package_id=pkg_id,
            hotel_id=h.hotel_id,
            hotel_noches=h.hotel_noches,
            hotel_fecha_in=h.hotel_fecha_in,
            hotel_fecha_out=h.hotel_fecha_out,
            hotel_fecha_salida_mas=h.hotel_fecha_salida_mas,
            hotel_regimen_id=h.hotel_regimen_id,
            tarifa_single=h.tarifa_single,
            comisionable_single=h.comisionable_single,
            tarifa_doble=h.tarifa_doble,
            tarifa_triple=h.tarifa_triple,
            tarifa_cuadruple=h.tarifa_cuadruple,
            tarifa_quintuple=h.tarifa_quintuple,
            tarifa_menores=h.tarifa_menores,
            pricing_type=h.pricing_type,
        )
        db.add(ph)
        hotels_created.append(PackageHotelResponse(
            id=ph_id,
            iweb_client_id=iweb_client_id,
            package_id=pkg_id,
            hotel_id=h.hotel_id,
            hotel_noches=h.hotel_noches,
            hotel_fecha_in=h.hotel_fecha_in,
            hotel_fecha_out=h.hotel_fecha_out,
            hotel_fecha_salida_mas=h.hotel_fecha_salida_mas,
            hotel_regimen_id=h.hotel_regimen_id,
            tarifa_single=h.tarifa_single,
            comisionable_single=h.comisionable_single,
            tarifa_doble=h.tarifa_doble,
            tarifa_triple=h.tarifa_triple,
            tarifa_cuadruple=h.tarifa_cuadruple,
            tarifa_quintuple=h.tarifa_quintuple,
            tarifa_menores=h.tarifa_menores,
            pricing_type=h.pricing_type,
        ))

    db.commit()
    db.refresh(new_pkg)

    return _build_package_response(new_pkg, body.dates, hotels_created)


@router.put("/update_package/{id}", response_model=PackageResponse)
async def update_package(
    id: str,
    body: PackageUpdateRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    p = db.query(Packages).filter(
        Packages.id == id,
        Packages.iweb_client_id == iweb_client_id
    ).first()

    if not p:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    # Actualizar campos del paquete
    if body.name is not None:
        p.name = body.name
    if body.subtitle is not None:
        p.subtitle = body.subtitle
    if body.description is not None:
        p.description = body.description
    if body.price is not None:
        p.price = body.price
    if body.gastos is not None:
        p.gastos = body.gastos
    if body.adicional is not None:
        p.adicional = body.adicional
    if body.destino is not None:
        p.destino = body.destino
    if body.periodo is not None:
        p.periodo = body.periodo
    if body.image is not None:
        p.image = body.image
    if body.active is not None:
        p.active = body.active
    if body.web is not None:
        p.web = body.web
    if body.comisionable is not None:
        p.comisionable = body.comisionable
    if body.moneda is not None:
        p.moneda = body.moneda
    if body.moneda_gastos is not None:
        p.moneda_gastos = body.moneda_gastos
    if body.moneda_adicional is not None:
        p.moneda_adicional = body.moneda_adicional
    if body.excursiones is not None:
        p.excursiones = body.excursiones

    # Actualizar fechas de salida
    if body.dates is not None:
        db.query(PackagesDatesOfExit).filter(
            PackagesDatesOfExit.iweb_client_id == iweb_client_id,
            PackagesDatesOfExit.package_id == p.id
        ).delete(synchronize_session=False)
        for s_id in body.dates:
            db.add(PackagesDatesOfExit(
                id=str(uuid.uuid4()),
                iweb_client_id=iweb_client_id,
                package_id=p.id,
                salida_id=s_id,
                active=True,
            ))

    # Actualizar hoteles: delete + re-insert
    if body.hotels is not None:
        db.query(PackageHotels).filter(
            PackageHotels.iweb_client_id == iweb_client_id,
            PackageHotels.package_id == p.id,
        ).delete(synchronize_session=False)
        for h in body.hotels:
            db.add(PackageHotels(
                id=str(uuid.uuid4()),
                iweb_client_id=iweb_client_id,
                package_id=p.id,
                hotel_id=h.hotel_id,
                hotel_noches=h.hotel_noches,
                hotel_fecha_in=h.hotel_fecha_in,
                hotel_fecha_out=h.hotel_fecha_out,
                hotel_fecha_salida_mas=h.hotel_fecha_salida_mas,
                hotel_regimen_id=h.hotel_regimen_id,
                tarifa_single=h.tarifa_single,
                comisionable_single=h.comisionable_single,
                tarifa_doble=h.tarifa_doble,
                tarifa_triple=h.tarifa_triple,
                tarifa_cuadruple=h.tarifa_cuadruple,
                tarifa_quintuple=h.tarifa_quintuple,
                tarifa_menores=h.tarifa_menores,
                pricing_type=h.pricing_type,
            ))

    db.commit()
    db.refresh(p)

    # Reload final state
    rels = db.query(PackagesDatesOfExit).filter(
        PackagesDatesOfExit.iweb_client_id == iweb_client_id,
        PackagesDatesOfExit.package_id == p.id,
        PackagesDatesOfExit.active == True
    ).all()
    dates_list = [r.salida_id for r in rels if r.salida_id]

    ph_rows = db.query(PackageHotels).filter(
        PackageHotels.iweb_client_id == iweb_client_id,
        PackageHotels.package_id == p.id,
    ).all()
    hotels_list = [_build_hotel_response(ph) for ph in ph_rows]

    return _build_package_response(p, dates_list, hotels_list)


@router.delete("/delete_package/{id}")
async def delete_package(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    p = db.query(Packages).filter(
        Packages.id == id,
        Packages.iweb_client_id == iweb_client_id
    ).first()

    if not p:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")

    # Eliminar fechas de salida y hoteles asociados
    db.query(PackagesDatesOfExit).filter(
        PackagesDatesOfExit.iweb_client_id == iweb_client_id,
        PackagesDatesOfExit.package_id == p.id
    ).delete(synchronize_session=False)

    db.query(PackageHotels).filter(
        PackageHotels.iweb_client_id == iweb_client_id,
        PackageHotels.package_id == p.id,
    ).delete(synchronize_session=False)

    db.delete(p)
    db.commit()

    return {"message": "Paquete eliminado con éxito"}
