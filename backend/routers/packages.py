import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.models import Packages, PackagesDatesOfExit
from schemas.schemas import (
    PackageResponse,
    PackageCreateRequest,
    PackageUpdateRequest,
)

router = APIRouter(prefix="/packages", tags=["Packages CRUD"])


@router.get("/get_packages", response_model=list[PackageResponse])
async def get_packages(iweb_client_id: str, db: Session = Depends(get_db)):
    pkgs = db.query(Packages).filter(Packages.iweb_client_id == iweb_client_id).all()
    if not pkgs:
        return []
    
    pkg_ids = [p.id for p in pkgs]
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

    response = []
    for p in pkgs:
        dates_list = dates_by_pkg.get(p.id, [])
        response.append(
            PackageResponse(
                id=p.id,
                iweb_client_id=p.iweb_client_id,
                name=p.name,
                subtitle=p.subtitle,
                description=p.description,
                price=p.price,
                gastos=p.gastos,
                adicional=p.adicional,
                destino=p.destino,
                hotel=p.hotel,
                periodo=p.periodo,
                image=p.image,
                active=p.active,
                web=p.web,
                dates=dates_list,
                comisionable=p.comisionable,
                moneda=p.moneda,
                moneda_gastos=p.moneda_gastos,
                moneda_adicional=p.moneda_adicional,
                hotel_noches=p.hotel_noches,
                hotel_fecha_in=p.hotel_fecha_in,
                hotel_fecha_out=p.hotel_fecha_out,
                hotel_fecha_salida_mas=p.hotel_fecha_salida_mas,
                hotel_regimen_id=p.hotel_regimen_id,
                tarifa_single=p.tarifa_single,
                comisionable_single=p.comisionable_single,
                tarifa_doble=p.tarifa_doble,
                tarifa_triple=p.tarifa_triple,
                tarifa_cuadruple=p.tarifa_cuadruple,
                tarifa_quintuple=p.tarifa_quintuple,
                tarifa_menores=p.tarifa_menores,
                pricing_type=p.pricing_type,
                excursiones=p.excursiones,
            )
        )
    return response


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
        hotel=p.hotel,
        periodo=p.periodo,
        image=p.image,
        active=p.active,
        web=p.web,
        dates=dates_list,
        comisionable=p.comisionable,
        moneda=p.moneda,
        moneda_gastos=p.moneda_gastos,
        moneda_adicional=p.moneda_adicional,
        hotel_noches=p.hotel_noches,
        hotel_fecha_in=p.hotel_fecha_in,
        hotel_fecha_out=p.hotel_fecha_out,
        hotel_fecha_salida_mas=p.hotel_fecha_salida_mas,
        hotel_regimen_id=p.hotel_regimen_id,
        tarifa_single=p.tarifa_single,
        comisionable_single=p.comisionable_single,
        tarifa_doble=p.tarifa_doble,
        tarifa_triple=p.tarifa_triple,
        tarifa_cuadruple=p.tarifa_cuadruple,
        tarifa_quintuple=p.tarifa_quintuple,
        tarifa_menores=p.tarifa_menores,
        pricing_type=p.pricing_type,
        excursiones=p.excursiones,
    )


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
        hotel=body.hotel,
        periodo=body.periodo,
        image=body.image,
        active=body.active,
        web=body.web,
        comisionable=body.comisionable,
        moneda=body.moneda,
        moneda_gastos=body.moneda_gastos,
        moneda_adicional=body.moneda_adicional,
        hotel_noches=body.hotel_noches,
        hotel_fecha_in=body.hotel_fecha_in,
        hotel_fecha_out=body.hotel_fecha_out,
        hotel_fecha_salida_mas=body.hotel_fecha_salida_mas,
        hotel_regimen_id=body.hotel_regimen_id,
        tarifa_single=body.tarifa_single,
        comisionable_single=body.comisionable_single,
        tarifa_doble=body.tarifa_doble,
        tarifa_triple=body.tarifa_triple,
        tarifa_cuadruple=body.tarifa_cuadruple,
        tarifa_quintuple=body.tarifa_quintuple,
        tarifa_menores=body.tarifa_menores,
        pricing_type=body.pricing_type,
        excursiones=body.excursiones,
    )
    db.add(new_pkg)
    
    # Guardar fechas de salida individuales
    if body.dates:
        for s_id in body.dates:
            new_relation = PackagesDatesOfExit(
                id=str(uuid.uuid4()),
                iweb_client_id=iweb_client_id,
                package_id=pkg_id,
                salida_id=s_id,
                active=True
            )
            db.add(new_relation)
    
    db.commit()
    db.refresh(new_pkg)
    
    return PackageResponse(
        id=new_pkg.id,
        iweb_client_id=new_pkg.iweb_client_id,
        name=new_pkg.name,
        subtitle=new_pkg.subtitle,
        description=new_pkg.description,
        price=new_pkg.price,
        gastos=new_pkg.gastos,
        adicional=new_pkg.adicional,
        destino=new_pkg.destino,
        hotel=new_pkg.hotel,
        periodo=new_pkg.periodo,
        image=new_pkg.image,
        active=new_pkg.active,
        web=new_pkg.web,
        dates=body.dates,
        comisionable=new_pkg.comisionable,
        moneda=new_pkg.moneda,
        moneda_gastos=new_pkg.moneda_gastos,
        moneda_adicional=new_pkg.moneda_adicional,
        hotel_noches=new_pkg.hotel_noches,
        hotel_fecha_in=new_pkg.hotel_fecha_in,
        hotel_fecha_out=new_pkg.hotel_fecha_out,
        hotel_fecha_salida_mas=new_pkg.hotel_fecha_salida_mas,
        hotel_regimen_id=new_pkg.hotel_regimen_id,
        tarifa_single=new_pkg.tarifa_single,
        comisionable_single=new_pkg.comisionable_single,
        tarifa_doble=new_pkg.tarifa_doble,
        tarifa_triple=new_pkg.tarifa_triple,
        tarifa_cuadruple=new_pkg.tarifa_cuadruple,
        tarifa_quintuple=new_pkg.tarifa_quintuple,
        tarifa_menores=new_pkg.tarifa_menores,
        pricing_type=new_pkg.pricing_type,
        excursiones=new_pkg.excursiones,
    )


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
        
    # Actualizar campos
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
    if body.hotel is not None:
        p.hotel = body.hotel
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
    if body.hotel_noches is not None:
        p.hotel_noches = body.hotel_noches
    if body.hotel_fecha_in is not None:
        p.hotel_fecha_in = body.hotel_fecha_in
    if body.hotel_fecha_out is not None:
        p.hotel_fecha_out = body.hotel_fecha_out
    if body.hotel_fecha_salida_mas is not None:
        p.hotel_fecha_salida_mas = body.hotel_fecha_salida_mas
    if body.hotel_regimen_id is not None:
        p.hotel_regimen_id = body.hotel_regimen_id
    if body.tarifa_single is not None:
        p.tarifa_single = body.tarifa_single
    if body.comisionable_single is not None:
        p.comisionable_single = body.comisionable_single
    if body.tarifa_doble is not None:
        p.tarifa_doble = body.tarifa_doble
    if body.tarifa_triple is not None:
        p.tarifa_triple = body.tarifa_triple
    if body.tarifa_cuadruple is not None:
        p.tarifa_cuadruple = body.tarifa_cuadruple
    if body.tarifa_quintuple is not None:
        p.tarifa_quintuple = body.tarifa_quintuple
    if body.tarifa_menores is not None:
        p.tarifa_menores = body.tarifa_menores
    if body.pricing_type is not None:
        p.pricing_type = body.pricing_type
    if body.excursiones is not None:
        p.excursiones = body.excursiones
        
    # Actualizar fechas de salida asociadas
    if body.dates is not None:
        db.query(PackagesDatesOfExit).filter(
            PackagesDatesOfExit.iweb_client_id == iweb_client_id,
            PackagesDatesOfExit.package_id == p.id
        ).delete(synchronize_session=False)
        
        for s_id in body.dates:
            new_relation = PackagesDatesOfExit(
                id=str(uuid.uuid4()),
                iweb_client_id=iweb_client_id,
                package_id=p.id,
                salida_id=s_id,
                active=True
            )
            db.add(new_relation)
        
    db.commit()
    db.refresh(p)
    
    # Obtener lista final de fechas
    rels = db.query(PackagesDatesOfExit).filter(
        PackagesDatesOfExit.iweb_client_id == iweb_client_id,
        PackagesDatesOfExit.package_id == p.id,
        PackagesDatesOfExit.active == True
    ).all()
    dates_list = [r.salida_id for r in rels if r.salida_id]
    
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
        hotel=p.hotel,
        periodo=p.periodo,
        image=p.image,
        active=p.active,
        web=p.web,
        dates=dates_list,
        comisionable=p.comisionable,
        moneda=p.moneda,
        moneda_gastos=p.moneda_gastos,
        moneda_adicional=p.moneda_adicional,
        hotel_noches=p.hotel_noches,
        hotel_fecha_in=p.hotel_fecha_in,
        hotel_fecha_out=p.hotel_fecha_out,
        hotel_fecha_salida_mas=p.hotel_fecha_salida_mas,
        hotel_regimen_id=p.hotel_regimen_id,
        tarifa_single=p.tarifa_single,
        comisionable_single=p.comisionable_single,
        tarifa_doble=p.tarifa_doble,
        tarifa_triple=p.tarifa_triple,
        tarifa_cuadruple=p.tarifa_cuadruple,
        tarifa_quintuple=p.tarifa_quintuple,
        tarifa_menores=p.tarifa_menores,
        pricing_type=p.pricing_type,
        excursiones=p.excursiones,
    )


@router.delete("/delete_package/{id}")
async def delete_package(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    p = db.query(Packages).filter(
        Packages.id == id,
        Packages.iweb_client_id == iweb_client_id
    ).first()
    
    if not p:
        raise HTTPException(status_code=404, detail="Paquete no encontrado")
        
    # Eliminar fechas de salida asociadas
    db.query(PackagesDatesOfExit).filter(
        PackagesDatesOfExit.iweb_client_id == iweb_client_id,
        PackagesDatesOfExit.package_id == p.id
    ).delete(synchronize_session=False)
    
    # Eliminar paquete
    db.delete(p)
    db.commit()
    
    return {"message": "Paquete eliminado con éxito"}
