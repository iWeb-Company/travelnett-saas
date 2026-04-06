from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from db.database import get_db
from models.models import User
from schemas.schemas import (
    LoginRequest,
    TokenResponse,
    UserPayload,
    UserCreateRequest,
)
import uuid
from auth.login import verify_password, create_access_token, get_current_user
from auth.login import get_password_hash

load_dotenv()

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login")
def login(
    body: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    # Multi-tenant: normalmente el username debe resolverse dentro del iweb_client_id.
    # Excepción: el admin global puede loguear con cualquier tenant seleccionado.
    if body.username == "iweb_admin":
        user = db.query(User).filter(User.username == body.username).first()
    else:
        q = db.query(User).filter(User.username == body.username)
        if body.iweb_client_id:
            q = q.filter(User.iweb_client_id == body.iweb_client_id)
        user = q.first()

    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo",
        )

    token_iweb_client_id = user.iweb_client_id
    if user.username == "iweb_admin" and body.iweb_client_id:
        token_iweb_client_id = body.iweb_client_id

    token = create_access_token(
        {
            "sub": str(user.id),
            "iweb_client_id": token_iweb_client_id,
            "username": user.username,
        }
    )

    # Cookie HTTP-only con duración de 7 días
    max_age = 7 * 24 * 60 * 60  # segundos
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        max_age=max_age,
        httponly=True,
        secure=False,  # ponlo en True en producción con HTTPS
        samesite="lax",
        path="/",
    )

    return TokenResponse(access_token=token)

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return UserPayload(
        id=current_user.id,
        iweb_client_id=current_user.iweb_client_id,
        name=current_user.name,
        last_name=current_user.last_name,
        username=current_user.username,
    )

@router.post("/create-user/{iweb_client_id}")
def create_user_by_iweb_client_id(
    iweb_client_id: str,
    body: UserCreateRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.username == body.user.username, User.iweb_client_id == iweb_client_id)
        .first()
    )
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario ya existe",
        )
    user = User(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name=body.user.name,
        dni=body.user.dni,
        birthday=body.user.birthday,
        last_name=body.user.last_name,
        username=body.user.username,
        hashed_password=get_password_hash(body.user.password),
        phone=body.user.phone,
        active=body.user.active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return status.HTTP_201_CREATED, {"detail": "Usuario creado correctamente", "id": user.id, "Empresa": iweb_client_id}