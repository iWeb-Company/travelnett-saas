from fastapi import APIRouter, Depends, HTTPException, status, Response, Query
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
from typing import Any
from db.database import get_db
from models.models import User, Clients, iWebClient
from schemas.schemas import (
    LoginSystemRequest,
    LoginWebRequest,
    TokenResponse,
    UserPayload,
    UserCreateRequest,
    ClientsCreateRequest,
    iWebClientPayload,
)
import uuid
from auth.login import verify_password, create_access_token, get_current_user
from auth.login import get_password_hash

load_dotenv()

SECURE_COOKIES = os.getenv("SECURE_COOKIES", "False").lower() == "true"

router = APIRouter(prefix="/auth", tags=["Auth"])


def _build_iweb_client_payload(iweb_client: iWebClient) -> iWebClientPayload:
    return iWebClientPayload(
        id=str(iweb_client.id),
        folder_id=int(iweb_client.folder_id),
        slug=str(iweb_client.slug),
        name=str(iweb_client.name or ""),
        cuit=int(iweb_client.cuit or 0),
        email=str(iweb_client.email or ""),
        status=bool(iweb_client.status),
        logo_xl=str(iweb_client.logo_xl or ""),
        logo_s=str(iweb_client.logo_s or ""),
    )


def _verify_password_or_false(plain_password: str, hashed_password: Any) -> bool:
    return isinstance(hashed_password, str) and verify_password(plain_password, hashed_password)

@router.post("/login-system")
def login(
    body: LoginSystemRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Login for multi-tenant system. The username is resolved within the given iweb_client (by slug).
    Example: ruta86 (slug).
    The slug is required for all users except the global admin (iweb_admin) who can log in under any tenant.
    """
    # Get iWebClient by slug
    iweb_client = None
    if body.slug:
        iweb_client = db.query(iWebClient).filter(iWebClient.slug == body.slug).first()
        if not iweb_client:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid slug",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    # Multi-tenant: username is resolved within the given iweb_client.
    # Exception: the global admin can log in under any tenant.
    if body.username == "iweb_admin":
        user = db.query(User).filter(User.username == body.username).first()
    else:
        if not iweb_client:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slug is required for non-admin users",
            )
        q = db.query(User).filter(User.username == body.username)
        q = q.filter(User.iweb_client_id == iweb_client.id)
        user = q.first()

    if not user or not _verify_password_or_false(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user",
        )

    # Get the iWebClient for the token if not already loaded
    if not iweb_client and user.iweb_client_id:
        iweb_client = db.query(iWebClient).filter(iWebClient.id == user.iweb_client_id).first()

    token = create_access_token(
        {
            "sub": str(user.id),
            "iweb_client_id": user.iweb_client_id,
            "username": user.username,
        }
    )

    # HTTP-only cookie, 7-day expiry
    max_age = 7 * 24 * 60 * 60  # seconds
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        max_age=max_age,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite="lax",
        path="/",
    )

    iweb_client_payload: iWebClientPayload | None = None
    if iweb_client:
        iweb_client_payload = _build_iweb_client_payload(iweb_client)

    return TokenResponse(access_token=token, iweb_client=iweb_client_payload)

@router.post("/login-web")
def login_web(
    body: LoginWebRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    """
    Login for web clients.
    Example: Serena Viajas, Ruta86 client.
    Table: clients
    """
    if body.email == "iweb_admin":
        client = db.query(Clients).filter(Clients.email == body.email).first()
    else:
        q = db.query(Clients).filter(Clients.email == body.email)
        if body.iweb_client_id:
            q = q.filter(Clients.iweb_client_id == body.iweb_client_id)
        client = q.first()

    if not client or not _verify_password_or_false(body.password, client.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token_iweb_client_id = client.iweb_client_id
    if body.email == "iweb_admin" and body.iweb_client_id:
        token_iweb_client_id = body.iweb_client_id

    token = create_access_token(
        {
            "sub": str(client.id),
            "iweb_client_id": token_iweb_client_id,
            "username": body.email,
        }
    )

    max_age = 7 * 24 * 60 * 60 
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        max_age=max_age,
        httponly=True,
        secure=SECURE_COOKIES,
        samesite="lax",
        path="/",
    )

    return TokenResponse(access_token=token)

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return UserPayload(
        id=str(current_user.id),
        iweb_client_id=str(current_user.iweb_client_id),
        name=current_user.name,
        last_name=current_user.last_name,
        username=str(current_user.username),
    )

@router.post("/create-user/{iweb_client_id}", status_code=status.HTTP_201_CREATED)
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
            detail="User already exists",
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
    return {"detail": "User created successfully", "id": str(user.id), "iweb_client_id": iweb_client_id}

@router.get("/users/{iweb_client_id}")
def get_users_by_iweb_client_id(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    users = (
        db.query(User)
        .filter(User.iweb_client_id == iweb_client_id)
        .all()
    )
    return users

@router.put("/users/{iweb_client_id}/{user_id}", status_code=status.HTTP_200_OK)
def update_user_by_id(  
    iweb_client_id: str,
    user_id: str,
    body: UserCreateRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.iweb_client_id == iweb_client_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.name = body.user.name
    user.dni = body.user.dni
    user.birthday = body.user.birthday
    user.last_name = body.user.last_name
    user.username = body.user.username
    if body.user.password:
        user.hashed_password = get_password_hash(body.user.password)
    user.phone = body.user.phone
    user.active = body.user.active
    db.commit()
    db.refresh(user)
    return {"detail": "User updated successfully", "id": str(user.id), "iweb_client_id": str(user.iweb_client_id)}

@router.patch("/users/{iweb_client_id}/{user_id}/status", status_code=status.HTTP_200_OK)
def update_user_status(
    iweb_client_id: str,
    user_id: str,
    active: bool = Query(..., alias="status"),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.iweb_client_id == iweb_client_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    user.active = active
    db.commit()
    db.refresh(user)
    return {
        "detail": "User status updated successfully",
        "active": bool(user.active),
        "id": str(user.id),
        "iweb_client_id": str(user.iweb_client_id),
    }

@router.delete("/users/{iweb_client_id}/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_by_id(
    iweb_client_id: str,
    user_id: str,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id, User.iweb_client_id == iweb_client_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
    )
    db.delete(user)
    db.commit()
    return {"detail": "User deleted successfully", "id": user_id}

@router.post("/create-client/{iweb_client_id}", status_code=status.HTTP_201_CREATED)
def create_client_by_iweb_client_id(
    iweb_client_id: str,
    body: ClientsCreateRequest,
    db: Session = Depends(get_db),
):
    client = (
        db.query(Clients)
        .filter(Clients.email == body.client.email, Clients.iweb_client_id == iweb_client_id)
        .first()
    )
    if client:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Client already exists",
        )
    client = Clients(
        id=str(uuid.uuid4()),
        iweb_client_id=iweb_client_id,
        name_system=body.client.name_system,
        complete_name=body.client.complete_name,
        client_type=body.client.client_type,
        parent_client_id=body.client.parent_client_id,
        dni=body.client.dni,
        birthday=body.client.birthday,
        email=body.client.email,
        phone=body.client.phone,
        payment_method=body.client.payment_method,
        commission=body.client.commission,
        hashed_password=get_password_hash(body.client.hashed_password) if body.client.hashed_password else None,
        created_at=body.client.created_at,
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    return {"detail": "Client created successfully", "id": str(client.id), "iweb_client_id": iweb_client_id}

@router.get("/clients/{iweb_client_id}")
def get_clients_by_iweb_client_id(
    iweb_client_id: str,
    db: Session = Depends(get_db),
):
    clients = (
        db.query(Clients)
        .filter(Clients.iweb_client_id == iweb_client_id)
        .all()
    )
    return clients

@router.put("/clients/{iweb_client_id}/{client_id}", status_code=status.HTTP_200_OK)
def update_client_by_id(  
    iweb_client_id: str,
    client_id: str,
    body: ClientsCreateRequest,
    db: Session = Depends(get_db),
):
    client = db.query(Clients).filter(Clients.id == client_id, Clients.iweb_client_id == iweb_client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
        )
    client.name_system = body.client.name_system
    client.complete_name = body.client.complete_name
    client.client_type = body.client.client_type
    client.parent_client_id = body.client.parent_client_id
    client.dni = body.client.dni
    client.birthday = body.client.birthday
    client.email = body.client.email
    client.phone = body.client.phone
    client.payment_method = body.client.payment_method
    client.commission = body.client.commission
    if body.client.hashed_password:
        client.hashed_password = get_password_hash(body.client.hashed_password)
    client.created_at = body.client.created_at
    db.commit()
    db.refresh(client)
    return {"detail": "Client updated successfully", "id": str(client.id), "iweb_client_id": str(client.iweb_client_id)}

@router.delete("/clients/{iweb_client_id}/{client_id}", status_code=status.HTTP_200_OK)
def delete_client_by_id(
    iweb_client_id: str,
    client_id: str,
    db: Session = Depends(get_db),
):
    client = db.query(Clients).filter(Clients.id == client_id, Clients.iweb_client_id == iweb_client_id).first()
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found",
    )
    db.delete(client)
    db.commit()
    return {"detail": "Client deleted successfully", "id": client_id}
