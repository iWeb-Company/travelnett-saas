import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from models.models import Reservas, Passengers, Salidas, LugaresCarga, Hotels, Regimenes, Clients
from pydantic import BaseModel

router = APIRouter(prefix="/reservas", tags=["Reservas / Pasajeros de Salidas"])

class ReservaDetailedResponse(BaseModel):
    id: str
    iweb_client_id: str
    passenger_id: str
    salida_id: str
    
    # Datos de Pasajero
    nombre_completo: str
    telefono: str
    dni: Optional[int] = None
    fecha_nacimiento: Optional[str] = None
    edad_categoria: Optional[str] = None
    
    # Reserva
    codigo_reserva: Optional[str] = None
    client_id: Optional[str] = None
    client_nombre: Optional[str] = None
    
    # Asignaciones
    lugar_carga_id: Optional[str] = None
    lugar_carga_nombre: Optional[str] = None
    lugar_carga_direccion: Optional[str] = None
    butaca: Optional[str] = None
    tipo_butaca: Optional[str] = None
    
    hotel_id: Optional[str] = None
    hotel_nombre: Optional[str] = None
    regimen_id: Optional[str] = None
    regimen_nombre: Optional[str] = None
    rooming_id: Optional[str] = None
    room_type: Optional[str] = None
    active: bool

    class Config:
        from_attributes = True


class ReservaCreatePayload(BaseModel):
    passenger_id: str
    salida_id: str
    codigo_reserva: Optional[str] = None
    client_id: Optional[str] = None
    edad_categoria: Optional[str] = "ADL"
    lugar_carga_id: Optional[str] = None
    butaca: Optional[str] = None
    tipo_butaca: Optional[str] = None
    hotel_id: Optional[str] = None
    regimen_id: Optional[str] = None
    rooming_id: Optional[str] = None
    room_type: Optional[str] = None


class ReservaUpdatePayload(BaseModel):
    codigo_reserva: Optional[str] = None
    client_id: Optional[str] = None
    edad_categoria: Optional[str] = None
    lugar_carga_id: Optional[str] = None
    butaca: Optional[str] = None
    tipo_butaca: Optional[str] = None
    hotel_id: Optional[str] = None
    regimen_id: Optional[str] = None
    rooming_id: Optional[str] = None
    room_type: Optional[str] = None
    active: Optional[bool] = None


@router.get("/get_reservas", response_model=list[ReservaDetailedResponse])
async def get_reservas(iweb_client_id: str, salida_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Reservas).filter(
        func.lower(Reservas.iweb_client_id) == func.lower(iweb_client_id.strip())
    )
    if salida_id and salida_id.strip() not in ("", "undefined", "null", "none", "None"):
        query = query.filter(func.lower(Reservas.salida_id) == func.lower(salida_id.strip()))
    res_list = query.all()
    
    result = []
    for r in res_list:
        # Buscar el pasajero
        p = db.query(Passengers).filter(
            Passengers.id == r.passenger_id,
            Passengers.iweb_client_id == iweb_client_id
        ).first()
        
        nombre_completo = "Desconocido"
        telefono = ""
        dni = None
        fecha_nac = None
        
        if p:
            nombre = p.name or ""
            apellido = p.last_name or ""
            nombre_completo = f"{nombre} {apellido}".strip() or "Desconocido"
            telefono = str(p.phone) if p.phone else ""
            dni = p.dni
            fecha_nac = str(p.date_of_birth) if p.date_of_birth else None
            
        # Buscar lugar de carga
        lc_name = ""
        lc_dir = ""
        if r.lugar_carga_id:
            lc = db.query(LugaresCarga).filter(LugaresCarga.id == r.lugar_carga_id).first()
            if lc:
                lc_name = lc.name
                lc_dir = lc.address or ""
                
        # Buscar Hotel
        h_name = ""
        if r.hotel_id:
            h = db.query(Hotels).filter(Hotels.id == r.hotel_id).first()
            if h:
                h_name = h.name
                
        # Buscar Régimen
        r_name = ""
        if r.regimen_id:
            rg = db.query(Regimenes).filter(Regimenes.id == r.regimen_id).first()
            if rg:
                r_name = rg.name

        # Buscar Cliente
        cl_nombre = ""
        if r.client_id:
            cl = db.query(Clients).filter(Clients.id == r.client_id).first()
            if cl:
                cl_nombre = cl.complete_name or cl.name_system or ""
                
        result.append(
            ReservaDetailedResponse(
                id=r.id,
                iweb_client_id=r.iweb_client_id,
                passenger_id=r.passenger_id,
                salida_id=r.salida_id,
                nombre_completo=nombre_completo,
                telefono=telefono,
                dni=dni,
                fecha_nacimiento=fecha_nac,
                edad_categoria=r.edad_categoria or "ADL",
                codigo_reserva=r.codigo_reserva,
                client_id=r.client_id,
                client_nombre=cl_nombre,
                lugar_carga_id=r.lugar_carga_id,
                lugar_carga_nombre=lc_name,
                lugar_carga_direccion=lc_dir,
                butaca=r.butaca,
                tipo_butaca=r.tipo_butaca,
                hotel_id=r.hotel_id,
                hotel_nombre=h_name,
                regimen_id=r.regimen_id,
                regimen_nombre=r_name,
                rooming_id=r.rooming_id,
                room_type=r.room_type,
                active=bool(r.active if r.active is not None else True)
            )
        )
    return result


@router.post("/create_reserva", response_model=ReservaDetailedResponse)
async def create_reserva(
    body: ReservaCreatePayload,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    # Verificar si ya existe la salida
    s = db.query(Salidas).filter(
        Salidas.id == body.salida_id,
        Salidas.iweb_client_id == iweb_client_id
    ).first()
    if not s:
        raise HTTPException(status_code=404, detail="Salida no encontrada")
        
    # Verificar si existe el pasajero
    p = db.query(Passengers).filter(
        Passengers.id == body.passenger_id,
        Passengers.iweb_client_id == iweb_client_id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Pasajero no encontrado")
        
    res_id = str(uuid.uuid4())
    new_res = Reservas(
        id=res_id,
        iweb_client_id=iweb_client_id,
        passenger_id=body.passenger_id,
        salida_id=body.salida_id,
        codigo_reserva=body.codigo_reserva,
        client_id=body.client_id,
        edad_categoria=body.edad_categoria or "ADL",
        lugar_carga_id=body.lugar_carga_id,
        butaca=body.butaca,
        tipo_butaca=body.tipo_butaca,
        hotel_id=body.hotel_id,
        regimen_id=body.regimen_id,
        rooming_id=body.rooming_id,
        room_type=body.room_type,
        active=True
    )
    db.add(new_res)
    db.commit()
    db.refresh(new_res)
    
    # Devolver con detalles
    # Buscar lugar de carga
    lc_name = ""
    lc_dir = ""
    if new_res.lugar_carga_id:
        lc = db.query(LugaresCarga).filter(LugaresCarga.id == new_res.lugar_carga_id).first()
        if lc:
            lc_name = lc.name
            lc_dir = lc.address or ""
            
    # Buscar Hotel
    h_name = ""
    if new_res.hotel_id:
        h = db.query(Hotels).filter(Hotels.id == new_res.hotel_id).first()
        if h:
            h_name = h.name
            
    # Buscar Régimen
    r_name = ""
    if new_res.regimen_id:
        rg = db.query(Regimenes).filter(Regimenes.id == new_res.regimen_id).first()
        if rg:
            r_name = rg.name
            
    # Buscar Cliente
    cl_nombre = ""
    if new_res.client_id:
        cl = db.query(Clients).filter(Clients.id == new_res.client_id).first()
        if cl:
            cl_nombre = cl.complete_name or cl.name_system or ""

    nombre_completo = f"{p.name or ''} {p.last_name or ''}".strip() or "Desconocido"
            
    return ReservaDetailedResponse(
        id=new_res.id,
        iweb_client_id=new_res.iweb_client_id,
        passenger_id=new_res.passenger_id,
        salida_id=new_res.salida_id,
        nombre_completo=nombre_completo,
        telefono=str(p.phone) if p.phone else "",
        dni=p.dni,
        fecha_nacimiento=str(p.date_of_birth) if p.date_of_birth else None,
        edad_categoria=new_res.edad_categoria,
        codigo_reserva=new_res.codigo_reserva,
        client_id=new_res.client_id,
        client_nombre=cl_nombre,
        lugar_carga_id=new_res.lugar_carga_id,
        lugar_carga_nombre=lc_name,
        lugar_carga_direccion=lc_dir,
        butaca=new_res.butaca,
        tipo_butaca=new_res.tipo_butaca,
        hotel_id=new_res.hotel_id,
        hotel_nombre=h_name,
        regimen_id=new_res.regimen_id,
        regimen_nombre=r_name,
        rooming_id=new_res.rooming_id,
        room_type=new_res.room_type,
        active=True
    )


@router.put("/update_reserva/{id}", response_model=ReservaDetailedResponse)
async def update_reserva(
    id: str,
    body: ReservaUpdatePayload,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    r = db.query(Reservas).filter(
        Reservas.id == id,
        Reservas.iweb_client_id == iweb_client_id
    ).first()
    
    if not r:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
    if body.codigo_reserva is not None:
        r.codigo_reserva = body.codigo_reserva
    if body.client_id is not None:
        r.client_id = body.client_id
    if body.edad_categoria is not None:
        r.edad_categoria = body.edad_categoria
    if body.lugar_carga_id is not None:
        r.lugar_carga_id = body.lugar_carga_id
    if body.butaca is not None:
        r.butaca = body.butaca
    if body.tipo_butaca is not None:
        r.tipo_butaca = body.tipo_butaca
    if body.hotel_id is not None:
        r.hotel_id = body.hotel_id
    if body.regimen_id is not None:
        r.regimen_id = body.regimen_id
    if body.rooming_id is not None:
        r.rooming_id = body.rooming_id
    if body.room_type is not None:
        r.room_type = body.room_type
    if body.active is not None:
        r.active = body.active
        
    db.commit()
    db.refresh(r)
    
    # Buscar detalles
    p = db.query(Passengers).filter(Passengers.id == r.passenger_id).first()
    nombre_completo = "Desconocido"
    telefono = ""
    dni = None
    fecha_nac = None
    if p:
        nombre_completo = f"{p.name or ''} {p.last_name or ''}".strip() or "Desconocido"
        telefono = str(p.phone) if p.phone else ""
        dni = p.dni
        fecha_nac = str(p.date_of_birth) if p.date_of_birth else None
        
    lc_name = ""
    lc_dir = ""
    if r.lugar_carga_id:
        lc = db.query(LugaresCarga).filter(LugaresCarga.id == r.lugar_carga_id).first()
        if lc:
            lc_name = lc.name
            lc_dir = lc.address or ""
            
    h_name = ""
    if r.hotel_id:
        h = db.query(Hotels).filter(Hotels.id == r.hotel_id).first()
        if h:
            h_name = h.name
            
    r_name = ""
    if r.regimen_id:
        rg = db.query(Regimenes).filter(Regimenes.id == r.regimen_id).first()
        if rg:
            r_name = rg.name
            
    # Buscar Cliente
    cl_nombre = ""
    if r.client_id:
        cl = db.query(Clients).filter(Clients.id == r.client_id).first()
        if cl:
            cl_nombre = cl.complete_name or cl.name_system or ""
            
    return ReservaDetailedResponse(
        id=r.id,
        iweb_client_id=r.iweb_client_id,
        passenger_id=r.passenger_id,
        salida_id=r.salida_id,
        nombre_completo=nombre_completo,
        telefono=telefono,
        dni=dni,
        fecha_nacimiento=fecha_nac,
        edad_categoria=r.edad_categoria or "ADL",
        codigo_reserva=r.codigo_reserva,
        client_id=r.client_id,
        client_nombre=cl_nombre,
        lugar_carga_id=r.lugar_carga_id,
        lugar_carga_nombre=lc_name,
        lugar_carga_direccion=lc_dir,
        butaca=r.butaca,
        tipo_butaca=r.tipo_butaca,
        hotel_id=r.hotel_id,
        hotel_nombre=h_name,
        regimen_id=r.regimen_id,
        regimen_nombre=r_name,
        rooming_id=r.rooming_id,
        room_type=r.room_type,
        active=bool(r.active if r.active is not None else True)
    )


@router.get("/get_reserva/{id}", response_model=ReservaDetailedResponse)
async def get_reserva(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    r = db.query(Reservas).filter(
        Reservas.id == id,
        Reservas.iweb_client_id == iweb_client_id
    ).first()
    if not r:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    
    p = db.query(Passengers).filter(
        Passengers.id == r.passenger_id,
        Passengers.iweb_client_id == iweb_client_id
    ).first()
    
    nombre_completo = "Desconocido"
    telefono = ""
    dni = None
    fecha_nac = None
    if p:
        nombre_completo = f"{p.name or ''} {p.last_name or ''}".strip() or "Desconocido"
        telefono = str(p.phone) if p.phone else ""
        dni = p.dni
        fecha_nac = str(p.date_of_birth) if p.date_of_birth else None
        
    lc_name = ""
    lc_dir = ""
    if r.lugar_carga_id:
        lc = db.query(LugaresCarga).filter(LugaresCarga.id == r.lugar_carga_id).first()
        if lc:
            lc_name = lc.name
            lc_dir = lc.address or ""
            
    h_name = ""
    if r.hotel_id:
        h = db.query(Hotels).filter(Hotels.id == r.hotel_id).first()
        if h:
            h_name = h.name
            
    r_name = ""
    if r.regimen_id:
        rg = db.query(Regimenes).filter(Regimenes.id == r.regimen_id).first()
        if rg:
            r_name = rg.name
            
    cl_nombre = ""
    if r.client_id:
        cl = db.query(Clients).filter(Clients.id == r.client_id).first()
        if cl:
            cl_nombre = cl.complete_name or cl.name_system or ""
            
    return ReservaDetailedResponse(
        id=r.id,
        iweb_client_id=r.iweb_client_id,
        passenger_id=r.passenger_id,
        salida_id=r.salida_id,
        nombre_completo=nombre_completo,
        telefono=telefono,
        dni=dni,
        fecha_nacimiento=fecha_nac,
        edad_categoria=r.edad_categoria or "ADL",
        codigo_reserva=r.codigo_reserva,
        client_id=r.client_id,
        client_nombre=cl_nombre,
        lugar_carga_id=r.lugar_carga_id,
        lugar_carga_nombre=lc_name,
        lugar_carga_direccion=lc_dir,
        butaca=r.butaca,
        tipo_butaca=r.tipo_butaca,
        hotel_id=r.hotel_id,
        hotel_nombre=h_name,
        regimen_id=r.regimen_id,
        regimen_nombre=r_name,
        rooming_id=r.rooming_id,
        room_type=r.room_type,
        active=bool(r.active if r.active is not None else True)
    )


@router.delete("/delete_reserva/{id}")
async def delete_reserva(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    r = db.query(Reservas).filter(
        Reservas.id == id,
        Reservas.iweb_client_id == iweb_client_id
    ).first()
    
    if not r:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
    db.delete(r)
    db.commit()
    return {"message": "Reserva eliminada con éxito"}
