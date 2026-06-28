import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.database import get_db
from models.models import Salidas, SalidasLugaresCarga, LugaresCarga
from schemas.schemas import (
    SalidaResponse,
    SalidaCreateRequest,
    SalidaUpdateRequest,
    LugarCargaPayload,
)

router = APIRouter(prefix="/salidas", tags=["Salidas CRUD"])


@router.get("/get_salidas", response_model=list[SalidaResponse])
async def get_salidas(iweb_client_id: str, db: Session = Depends(get_db)):
    salidas = db.query(Salidas).filter(Salidas.iweb_client_id == iweb_client_id).all()
    
    response = []
    for s in salidas:
        # Obtener la relación de lugares de carga
        rel = db.query(SalidasLugaresCarga).filter(
            SalidasLugaresCarga.iweb_client_id == iweb_client_id,
            SalidasLugaresCarga.salida_id == s.id
        ).first()
        
        cargas_resolved = []
        if rel and rel.cargas:
            # Separar y limpiar IDs de lugares de carga
            carga_ids = [cid.strip() for cid in rel.cargas.split(",") if cid.strip()]
            if carga_ids:
                # Recuperar los objetos completos de lugares de carga
                places = db.query(LugaresCarga).filter(
                    LugaresCarga.iweb_client_id == iweb_client_id,
                    LugaresCarga.id.in_(carga_ids)
                ).all()
                cargas_resolved = places
                
        response.append(
            SalidaResponse(
                id=s.id,
                iweb_client_id=s.iweb_client_id,
                date_of_out=s.date_of_out,
                type=s.type,
                active=s.active,
                periodo=s.periodo,
                transport_company=s.transport_company,
                destino=s.destino,
                passengers=s.passengers,
                semicama=s.semicama,
                cama=s.cama,
                cargas=cargas_resolved
            )
        )
    return response


@router.get("/get_salida/{id}", response_model=SalidaResponse)
async def get_salida(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    s = db.query(Salidas).filter(
        Salidas.id == id,
        Salidas.iweb_client_id == iweb_client_id
    ).first()
    
    if not s:
        raise HTTPException(status_code=404, detail="Salida no encontrada")
        
    rel = db.query(SalidasLugaresCarga).filter(
        SalidasLugaresCarga.iweb_client_id == iweb_client_id,
        SalidasLugaresCarga.salida_id == s.id
    ).first()
    
    cargas_resolved = []
    if rel and rel.cargas:
        carga_ids = [cid.strip() for cid in rel.cargas.split(",") if cid.strip()]
        if carga_ids:
            places = db.query(LugaresCarga).filter(
                LugaresCarga.iweb_client_id == iweb_client_id,
                LugaresCarga.id.in_(carga_ids)
            ).all()
            cargas_resolved = places
            
    return SalidaResponse(
        id=s.id,
        iweb_client_id=s.iweb_client_id,
        date_of_out=s.date_of_out,
        type=s.type,
        active=s.active,
        periodo=s.periodo,
        transport_company=s.transport_company,
        destino=s.destino,
        passengers=s.passengers,
        semicama=s.semicama,
        cama=s.cama,
        cargas=cargas_resolved
    )


@router.post("/create_salida", response_model=SalidaResponse)
async def create_salida(
    body: SalidaCreateRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    salida_id = str(uuid.uuid4())
    new_salida = Salidas(
        id=salida_id,
        iweb_client_id=iweb_client_id,
        date_of_out=body.date_of_out,
        type=body.type,
        active=body.active,
        periodo=body.periodo,
        transport_company=body.transport_company,
        destino=body.destino,
        passengers=body.passengers,
        semicama=body.semicama,
        cama=body.cama
    )
    db.add(new_salida)
    
    # Crear relación de lugares de carga
    cargas_str = ", ".join(body.cargas_ids) if body.cargas_ids else None
    new_relation = SalidasLugaresCarga(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        salida_id=salida_id,
        cargas=cargas_str
    )
    db.add(new_relation)
    
    db.commit()
    db.refresh(new_salida)
    
    # Resolver los objetos completos de carga para la respuesta
    cargas_resolved = []
    if body.cargas_ids:
        cargas_resolved = db.query(LugaresCarga).filter(
            LugaresCarga.iweb_client_id == iweb_client_id,
            LugaresCarga.id.in_(body.cargas_ids)
        ).all()
        
    return SalidaResponse(
        id=new_salida.id,
        iweb_client_id=new_salida.iweb_client_id,
        date_of_out=new_salida.date_of_out,
        type=new_salida.type,
        active=new_salida.active,
        periodo=new_salida.periodo,
        transport_company=new_salida.transport_company,
        destino=new_salida.destino,
        passengers=new_salida.passengers,
        semicama=new_salida.semicama,
        cama=new_salida.cama,
        cargas=cargas_resolved
    )


@router.put("/update_salida/{id}", response_model=SalidaResponse)
async def update_salida(
    id: str,
    body: SalidaUpdateRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    s = db.query(Salidas).filter(
        Salidas.id == id,
        Salidas.iweb_client_id == iweb_client_id
    ).first()
    
    if not s:
        raise HTTPException(status_code=404, detail="Salida no encontrada")
        
    # Actualizar los campos que se envíen
    if body.date_of_out is not None:
        s.date_of_out = body.date_of_out
    if body.type is not None:
        s.type = body.type
    if body.active is not None:
        s.active = body.active
    if body.periodo is not None:
        s.periodo = body.periodo
    if body.transport_company is not None:
        s.transport_company = body.transport_company
    if body.destino is not None:
        s.destino = body.destino
    if body.passengers is not None:
        s.passengers = body.passengers
    if body.semicama is not None:
        s.semicama = body.semicama
    if body.cama is not None:
        s.cama = body.cama
        
    # Actualizar o crear la relación de lugares de carga
    rel = db.query(SalidasLugaresCarga).filter(
        SalidasLugaresCarga.iweb_client_id == iweb_client_id,
        SalidasLugaresCarga.salida_id == s.id
    ).first()
    
    cargas_str = ", ".join(body.cargas_ids) if body.cargas_ids else None
    
    if rel:
        rel.cargas = cargas_str
    else:
        new_relation = SalidasLugaresCarga(
            id=str(uuid.uuid4()),
            iweb_client_id=iweb_client_id,
            salida_id=s.id,
            cargas=cargas_str
        )
        db.add(new_relation)
        
    db.commit()
    db.refresh(s)
    
    # Resolver los objetos de carga actuales para la respuesta
    cargas_resolved = []
    if body.cargas_ids:
        cargas_resolved = db.query(LugaresCarga).filter(
            LugaresCarga.iweb_client_id == iweb_client_id,
            LugaresCarga.id.in_(body.cargas_ids)
        ).all()
        
    return SalidaResponse(
        id=s.id,
        iweb_client_id=s.iweb_client_id,
        date_of_out=s.date_of_out,
        type=s.type,
        active=s.active,
        periodo=s.periodo,
        transport_company=s.transport_company,
        destino=s.destino,
        passengers=s.passengers,
        semicama=s.semicama,
        cama=s.cama,
        cargas=cargas_resolved
    )


@router.delete("/delete_salida/{id}")
async def delete_salida(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    s = db.query(Salidas).filter(
        Salidas.id == id,
        Salidas.iweb_client_id == iweb_client_id
    ).first()
    
    if not s:
        raise HTTPException(status_code=404, detail="Salida no encontrada")
        
    # Eliminar relaciones en salidas_lugares_carga
    db.query(SalidasLugaresCarga).filter(
        SalidasLugaresCarga.iweb_client_id == iweb_client_id,
        SalidasLugaresCarga.salida_id == s.id
    ).delete(synchronize_session=False)
    
    # Eliminar salida
    db.delete(s)
    db.commit()
    
    return {"message": "Salida eliminada con éxito"}
