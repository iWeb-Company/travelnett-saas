import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.models import (
    Vouchers, Reservas, Passengers, Salidas, Packages,
    PackagesDatesOfExit, Destinos, LugaresCarga, SalidasLugaresCarga,
    Hotels, Regimenes, ReservationPassengers
)
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter(prefix="/vouchers", tags=["Vouchers CRUD"])

class VoucherGenerateRequest(BaseModel):
    reserva_id: str

class VoucherResponseSchema(BaseModel):
    id: str
    iweb_client_id: str
    reserva_id: str
    salida_id: Optional[str] = None
    package_id: Optional[str] = None
    destino_name: Optional[str] = None
    titular_name: Optional[str] = None
    titular_dni: Optional[str] = None
    total_passengers: Optional[int] = None
    fecha_salida: Optional[str] = None
    tipo_transporte: Optional[str] = None
    tipo_butaca: Optional[str] = None
    lugar_carga: Optional[str] = None
    horario_carga: Optional[str] = None
    empresa_transporte: Optional[str] = None
    coordinador_nombre: Optional[str] = None
    coordinador_telefono: Optional[str] = None
    hotel_name: Optional[str] = None
    room_type: Optional[str] = None
    passengers_names: Optional[str] = None
    regimen_name: Optional[str] = None
    dias: Optional[int] = None
    noches: Optional[int] = None
    observations: Optional[str] = None

    class Config:
        from_attributes = True

@router.get("/get_voucher/{reserva_id}", response_model=VoucherResponseSchema)
async def get_voucher(reserva_id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    # Siempre forzar la regeneración para que tenga los datos más actualizados (horarios, hotel, coordinador, etc.)
    db.query(Vouchers).filter(
        Vouchers.reserva_id == reserva_id,
        Vouchers.iweb_client_id == iweb_client_id
    ).delete(synchronize_session=False)
    
    voucher = await generate_voucher_snapshot(reserva_id, iweb_client_id, db)
    return voucher

@router.post("/generate_voucher", response_model=VoucherResponseSchema)
async def generate_voucher_endpoint(
    body: VoucherGenerateRequest,
    iweb_client_id: str,
    db: Session = Depends(get_db)
):
    # Forzar la regeneración / generación del voucher
    # Borrar voucher anterior si existe
    db.query(Vouchers).filter(
        Vouchers.reserva_id == body.reserva_id,
        Vouchers.iweb_client_id == iweb_client_id
    ).delete(synchronize_session=False)
    
    voucher = await generate_voucher_snapshot(body.reserva_id, iweb_client_id, db)
    return voucher

async def generate_voucher_snapshot(reserva_id: str, iweb_client_id: str, db: Session) -> Vouchers:
    # 1. Fetch Reserva
    reserva = db.query(Reservas).filter(
        Reservas.id == reserva_id,
        Reservas.iweb_client_id == iweb_client_id
    ).first()
    if not reserva:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
        
    # 2. Fetch Passengers de la reserva
    rp_list = db.query(ReservationPassengers).filter(
        ReservationPassengers.reserva_id == reserva.id
    ).all()
        
    # Resolver pasajeros
    pax_objs = []
    pax_names = []
    titular_name = "Sin pasajeros"
    titular_dni = ""
    if rp_list:
        for rp in rp_list:
            p = db.query(Passengers).filter(
                Passengers.id == rp.pasajero_id,
                Passengers.iweb_client_id == iweb_client_id
            ).first()
            if p:
                pax_objs.append(p)
                p_fullname = f"{p.name or ''} {p.last_name or ''}".strip() or "Pasajero"
                pax_names.append(p_fullname)
                
    if pax_objs:
        titular_p = pax_objs[0]
        titular_name = f"{titular_p.name or ''} {titular_p.last_name or ''}".strip() or "Pasajero"
        titular_dni = str(titular_p.dni) if titular_p.dni else ""
        
    passengers_names_str = ", ".join(pax_names) if pax_names else "Sin pasajeros asignados"
    
    # 3. Resolve Salida
    salida_id = reserva.salida_id
    # Fallback: resolver salida_id desde el package si salida_id es nulo
    if (not salida_id or salida_id.strip() in ("", "undefined", "null", "none")) and reserva.package_id:
        rel = db.query(PackagesDatesOfExit).filter(
            PackagesDatesOfExit.package_id == reserva.package_id,
            PackagesDatesOfExit.iweb_client_id == iweb_client_id,
            PackagesDatesOfExit.active == True
        ).first()
        if rel:
            salida_id = rel.salida_id
            
    salida = None
    if salida_id:
        salida = db.query(Salidas).filter(
            Salidas.id == salida_id,
            Salidas.iweb_client_id == iweb_client_id
        ).first()
        
    # 4. Resolve Package
    package_id = reserva.package_id
    # Fallback: resolver package_id desde la salida
    if (not package_id or package_id.strip() in ("", "undefined", "null", "none")) and salida_id:
        rel = db.query(PackagesDatesOfExit).filter(
            PackagesDatesOfExit.salida_id == salida_id,
            PackagesDatesOfExit.iweb_client_id == iweb_client_id,
            PackagesDatesOfExit.active == True
        ).first()
        if rel:
            package_id = rel.package_id
            
    package = None
    if package_id:
        package = db.query(Packages).filter(
            Packages.id == package_id,
            Packages.iweb_client_id == iweb_client_id
        ).first()
        
    # 5. Resolve Destino Name
    destino_name = ""
    dest_id = (salida.destino if salida else None) or (package.destino if package else None)
    if dest_id:
        # dest_id puede ser un UUID o el nombre
        dest_obj = db.query(Destinos).filter(
            Destinos.id == dest_id,
            Destinos.iweb_client_id == iweb_client_id
        ).first()
        if dest_obj:
            destino_name = dest_obj.name
        else:
            destino_name = dest_id  # fallback si es string directo

    # 6. Resolve Lugar y Horario de carga
    lugar_carga_name = ""
    horario_carga_val = ""
    if reserva.lugar_carga_id:
        lc = db.query(LugaresCarga).filter(
            LugaresCarga.id == reserva.lugar_carga_id,
            LugaresCarga.iweb_client_id == iweb_client_id
        ).first()
        if lc:
            lugar_carga_name = f"{lc.name} - {lc.address}" if lc.address else lc.name
            
        # Horario desde salidas_lugares_carga
        if salida_id:
            rel_lc = db.query(SalidasLugaresCarga).filter(
                SalidasLugaresCarga.salida_id == salida_id,
                SalidasLugaresCarga.iweb_client_id == iweb_client_id
            ).first()
            if rel_lc and rel_lc.cargas:
                c_ids = [c.strip() for c in rel_lc.cargas.split(",") if c.strip()]
                h_vals = [h.strip() for h in rel_lc.horarios.split(",") if h.strip()] if rel_lc.horarios else []
                if reserva.lugar_carga_id in c_ids:
                    idx = c_ids.index(reserva.lugar_carga_id)
                    if idx < len(h_vals):
                        horario_carga_val = h_vals[idx]

    # 7. Resolve Hotel
    hotel_name = ""
    hotel_id = reserva.hotel_id or (salida.hotel_id if salida else None) or (package.hotel if package else None)
    if hotel_id:
        hotel_obj = db.query(Hotels).filter(
            Hotels.id == hotel_id,
            Hotels.iweb_client_id == iweb_client_id
        ).first()
        if hotel_obj:
            hotel_name = hotel_obj.name
        else:
            # Fallback si hotel_id es el nombre del hotel directamente
            hotel_name = hotel_id

    # 8. Resolve Régimen
    regimen_name = ""
    reg_id = reserva.regimen_id or (salida.regimen_id if salida else None) or (package.hotel_regimen_id if package else None)
    if reg_id:
        reg_obj = db.query(Regimenes).filter(
            Regimenes.id == reg_id,
            Regimenes.iweb_client_id == iweb_client_id
        ).first()
        if reg_obj:
            regimen_name = reg_obj.name or reg_obj.sigla
        else:
            regimen_name = reg_id

    # 9. Transporte y Butacas
    tipo_transporte = (salida.type if salida else "bus") or "bus"
    tipo_butaca = "Semicama"
    if rp_list:
        first_rp = rp_list[0]
        tipo_butaca = first_rp.butaca_type or "Semicama"
    
    # 10. Días y Noches
    noches_val = package.hotel_noches if (package and hasattr(package, 'hotel_noches')) else None
    dias_val = (noches_val + 1) if (noches_val is not None) else None

    # Formatear Fecha de Salida
    fecha_salida_str = ""
    if salida and salida.date_of_out:
        try:
            raw_d = str(salida.date_of_out).split(" ")[0]
            dt = datetime.strptime(raw_d, "%Y-%m-%d")
            fecha_salida_str = dt.strftime("%d/%m/%Y")
        except Exception:
            fecha_salida_str = str(salida.date_of_out)

    # Crear Snapshot
    voucher = Vouchers(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        reserva_id=reserva_id,
        salida_id=salida_id,
        package_id=package_id,
        destino_name=destino_name,
        titular_name=titular_name,
        titular_dni=titular_dni,
        total_passengers=len(rp_list),
        fecha_salida=fecha_salida_str,
        tipo_transporte=tipo_transporte,
        tipo_butaca=tipo_butaca,
        lugar_carga=lugar_carga_name,
        horario_carga=horario_carga_val,
        empresa_transporte=salida.transport_company if salida else "",
        coordinador_nombre=salida.coordinador_nombre if salida else "",
        coordinador_telefono=salida.coordinador_telefono if salida else "",
        hotel_name=hotel_name,
        room_type=reserva.room_type,
        passengers_names=passengers_names_str,
        regimen_name=regimen_name,
        dias=dias_val,
        noches=noches_val,
        observations=reserva.observations
    )
    
    db.add(voucher)
    db.commit()
    db.refresh(voucher)
    return voucher
