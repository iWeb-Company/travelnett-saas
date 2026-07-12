import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.database import get_db
from models.models import Liquidaciones, GastosNoCommission, Reservas
from schemas.schemas import (
    LiquidacionCreateRequest,
    LiquidacionResponse,
    GastoNoCommissionCreate,
    GastoNoCommissionResponse
)

router = APIRouter(prefix="/liquidaciones", tags=["Liquidaciones"])

@router.post("/create_liquidacion", response_model=LiquidacionResponse)
async def create_liquidacion(payload: LiquidacionCreateRequest, db: Session = Depends(get_db)):
    try:
        liq_id = str(uuid.uuid4())
        liquidacion = Liquidaciones(
            id=liq_id,
            booking_id=payload.booking_id,
            total_amout=payload.total_amout,
            total_commission=payload.total_commission,
            commission=payload.commission
        )
        db.add(liquidacion)
        
        # Create nested gastos if any
        gastos_list = []
        if payload.gastos:
            for g in payload.gastos:
                g_id = str(uuid.uuid4())
                gasto = GastosNoCommission(
                    id=g_id,
                    liquidacion_id=liq_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                )
                db.add(gasto)
                gastos_list.append(gasto)
        
        db.commit()
        db.refresh(liquidacion)
        
        return LiquidacionResponse(
            id=liquidacion.id,
            booking_id=liquidacion.booking_id,
            total_amout=liquidacion.total_amout,
            total_commission=liquidacion.total_commission,
            commission=liquidacion.commission,
            gastos=[
                GastoNoCommissionResponse(
                    id=g.id,
                    liquidacion_id=g.liquidacion_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                ) for g in gastos_list
            ]
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/get_liquidaciones", response_model=list[LiquidacionResponse])
def get_liquidaciones(iweb_client_id: str, db: Session = Depends(get_db)):
    try:
        # Join Reservas to filter by iweb_client_id
        results = db.query(Liquidaciones).join(
            Reservas, Liquidaciones.booking_id == Reservas.id
        ).filter(Reservas.iweb_client_id == iweb_client_id).all()
        
        response = []
        for liq in results:
            gastos = db.query(GastosNoCommission).filter(
                GastosNoCommission.liquidacion_id == liq.id,
                GastosNoCommission.iweb_client_id == iweb_client_id
            ).all()
            
            response.append(
                LiquidacionResponse(
                    id=liq.id,
                    booking_id=liq.booking_id,
                    total_amout=liq.total_amout,
                    total_commission=liq.total_commission,
                    commission=liq.commission,
                    gastos=[
                        GastoNoCommissionResponse(
                            id=g.id,
                            liquidacion_id=g.liquidacion_id,
                            name=g.name,
                            amount=g.amount,
                            iweb_client_id=g.iweb_client_id
                        ) for g in gastos
                    ]
                )
            )
        return response
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/get_liquidacion/{id}", response_model=LiquidacionResponse)
def get_liquidacion(id: str, db: Session = Depends(get_db)):
    try:
        liq = db.query(Liquidaciones).filter(Liquidaciones.id == id).first()
        if not liq:
            raise HTTPException(status_code=404, detail="Liquidacion not found")
        
        gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == liq.id).all()
        
        return LiquidacionResponse(
            id=liq.id,
            booking_id=liq.booking_id,
            total_amout=liq.total_amout,
            total_commission=liq.total_commission,
            commission=liq.commission,
            gastos=[
                GastoNoCommissionResponse(
                    id=g.id,
                    liquidacion_id=g.liquidacion_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                ) for g in gastos
            ]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/get_liquidacion_by_booking/{booking_id}", response_model=LiquidacionResponse)
def get_liquidacion_by_booking(booking_id: str, db: Session = Depends(get_db)):
    try:
        liq = db.query(Liquidaciones).filter(Liquidaciones.booking_id == booking_id).first()
        if not liq:
            raise HTTPException(status_code=404, detail="Liquidacion not found for the given booking")
        
        gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == liq.id).all()
        
        return LiquidacionResponse(
            id=liq.id,
            booking_id=liq.booking_id,
            total_amout=liq.total_amout,
            total_commission=liq.total_commission,
            commission=liq.commission,
            gastos=[
                GastoNoCommissionResponse(
                    id=g.id,
                    liquidacion_id=g.liquidacion_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                ) for g in gastos
            ]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/update_liquidacion/{id}", response_model=LiquidacionResponse)
def update_liquidacion(id: str, payload: LiquidacionCreateRequest, db: Session = Depends(get_db)):
    try:
        liq = db.query(Liquidaciones).filter(Liquidaciones.id == id).first()
        if not liq:
            raise HTTPException(status_code=404, detail="Liquidacion not found")
        
        liq.booking_id = payload.booking_id
        liq.total_amout = payload.total_amout
        liq.total_commission = payload.total_commission
        liq.commission = payload.commission
        
        # Sincronizar gastos
        existing_gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == id).all()
        existing_gastos_dict = {g.id: g for g in existing_gastos}
        
        incoming_gastos_ids = set()
        updated_gastos = []
        
        if payload.gastos:
            for g_payload in payload.gastos:
                if g_payload.id and g_payload.id in existing_gastos_dict:
                    # Actualizar existente
                    gasto = existing_gastos_dict[g_payload.id]
                    gasto.name = g_payload.name
                    gasto.amount = g_payload.amount
                    gasto.iweb_client_id = g_payload.iweb_client_id or gasto.iweb_client_id
                    incoming_gastos_ids.add(gasto.id)
                    updated_gastos.append(gasto)
                else:
                    # Crear nuevo
                    new_gasto_id = g_payload.id if g_payload.id else str(uuid.uuid4())
                    gasto = GastosNoCommission(
                        id=new_gasto_id,
                        liquidacion_id=id,
                        name=g_payload.name,
                        amount=g_payload.amount,
                        iweb_client_id=g_payload.iweb_client_id
                    )
                    db.add(gasto)
                    incoming_gastos_ids.add(gasto.id)
                    updated_gastos.append(gasto)
                    
        # Eliminar los gastos que no vinieron en la petición
        for old_gasto in existing_gastos:
            if old_gasto.id not in incoming_gastos_ids:
                db.delete(old_gasto)
                
        db.commit()
        db.refresh(liq)
        
        return LiquidacionResponse(
            id=liq.id,
            booking_id=liq.booking_id,
            total_amout=liq.total_amout,
            total_commission=liq.total_commission,
            commission=liq.commission,
            gastos=[
                GastoNoCommissionResponse(
                    id=g.id,
                    liquidacion_id=g.liquidacion_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                ) for g in updated_gastos
            ]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/delete_liquidacion/{id}", response_model=LiquidacionResponse)
def delete_liquidacion(id: str, db: Session = Depends(get_db)):
    try:
        liq = db.query(Liquidaciones).filter(Liquidaciones.id == id).first()
        if not liq:
            raise HTTPException(status_code=404, detail="Liquidacion not found")
            
        gastos = db.query(GastosNoCommission).filter(GastosNoCommission.liquidacion_id == id).all()
        for g in gastos:
            db.delete(g)
            
        db.delete(liq)
        db.commit()
        
        return LiquidacionResponse(
            id=liq.id,
            booking_id=liq.booking_id,
            total_amout=liq.total_amout,
            total_commission=liq.total_commission,
            commission=liq.commission,
            gastos=[
                GastoNoCommissionResponse(
                    id=g.id,
                    liquidacion_id=g.liquidacion_id,
                    name=g.name,
                    amount=g.amount,
                    iweb_client_id=g.iweb_client_id
                ) for g in gastos
            ]
        )
    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
