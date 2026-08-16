import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.models import Cards
from schemas.schemas import CardResponse, CardCreateRequest, CardUpdateRequest

router = APIRouter(prefix="/cards", tags=["Cards CRUD"])


@router.get("/get_cards", response_model=list[CardResponse])
async def get_cards(iweb_client_id: str, db: Session = Depends(get_db)):
    cards = db.query(Cards).filter(Cards.iweb_client_id == iweb_client_id).all()
    return cards


@router.post("/create_card", response_model=CardResponse)
async def create_card(body: CardCreateRequest, iweb_client_id: str, db: Session = Depends(get_db)):
    card_id = str(uuid.uuid4())
    new_card = Cards(
        id=card_id,
        iweb_client_id=iweb_client_id,
        name=body.name,
        status=body.status if body.status is not None else True,
    )
    db.add(new_card)
    db.commit()
    db.refresh(new_card)
    return new_card


@router.put("/update_card/{id}", response_model=CardResponse)
async def update_card(id: str, body: CardUpdateRequest, iweb_client_id: str, db: Session = Depends(get_db)):
    card = db.query(Cards).filter(Cards.id == id, Cards.iweb_client_id == iweb_client_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    if body.name is not None:
        card.name = body.name
    if body.status is not None:
        card.status = body.status

    db.commit()
    db.refresh(card)
    return card


@router.delete("/delete_card/{id}")
async def delete_card(id: str, iweb_client_id: str, db: Session = Depends(get_db)):
    card = db.query(Cards).filter(Cards.id == id, Cards.iweb_client_id == iweb_client_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    db.delete(card)
    db.commit()
    return {"message": "Tarjeta eliminada con éxito"}
