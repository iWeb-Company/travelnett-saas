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
    
    response = []
    for p in pkgs:
        # Resolver fechas de salida desde packages_dates_of_exit
        rels = db.query(PackagesDatesOfExit).filter(
            PackagesDatesOfExit.iweb_client_id == iweb_client_id,
            PackagesDatesOfExit.package_id == p.id,
            PackagesDatesOfExit.active == True
        ).all()
        
        dates_list = [r.salida_id for r in rels if r.salida_id]
            
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
                regimen=p.regimen,
                excursion=p.excursion,
                periodo=p.periodo,
                image=p.image,
                active=p.active,
                web=p.web,
                dates=dates_list
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
        regimen=p.regimen,
        excursion=p.excursion,
        periodo=p.periodo,
        image=p.image,
        active=p.active,
        web=p.web,
        dates=dates_list
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
        regimen=body.regimen,
        excursion=body.excursion,
        periodo=body.periodo,
        image=body.image,
        active=body.active,
        web=body.web
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
        regimen=new_pkg.regimen,
        excursion=new_pkg.excursion,
        periodo=new_pkg.periodo,
        image=new_pkg.image,
        active=new_pkg.active,
        web=new_pkg.web,
        dates=body.dates
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
    if body.regimen is not None:
        p.regimen = body.regimen
    if body.excursion is not None:
        p.excursion = body.excursion
    if body.periodo is not None:
        p.periodo = body.periodo
    if body.image is not None:
        p.image = body.image
    if body.active is not None:
        p.active = body.active
    if body.web is not None:
        p.web = body.web
        
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
        regimen=p.regimen,
        excursion=p.excursion,
        periodo=p.periodo,
        image=p.image,
        active=p.active,
        web=p.web,
        dates=dates_list
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
