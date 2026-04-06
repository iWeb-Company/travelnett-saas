from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    username: str
    password: str
    iweb_client_id: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserPayload(BaseModel):
    id: str
    iweb_client_id: str
    name: Optional[str]
    last_name: Optional[str]
    username: str


class UserCreatePayload(BaseModel):
    name: Optional[str] = None
    last_name: Optional[str] = None
    dni: Optional[int] = None
    birthday: Optional[str] = None
    username: str
    password: str
    phone: Optional[int] = None
    active: int = 1


class UserCreateRequest(BaseModel):
    user: UserCreatePayload

class iWebClientCreateRequest(BaseModel):
    name: str
    cuit: int
    email: str
    status: bool
    logo_xl: str
    logo_s: str

class iWebClientResponse(BaseModel):
    id: str
    name: str
    cuit: int
    email: str
    status: bool
    logo_xl: str
    logo_s: str