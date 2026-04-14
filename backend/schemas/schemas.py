import email
from http import client

from fastapi import File, UploadFile
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from datetime import date

# Schemas for authentication and user management

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
    folder_id: int
    name: str
    cuit: int
    email: str
    status: bool
    logo_xl: str
    logo_s: str
    
# Schemas for parameters management #

# Create

class CreateTransportCompanyRequest(BaseModel):
    id : Optional[str] = None
    airplane: Optional[bool] = None
    bus: Optional[bool] = None
    name : Optional[str] = None
    cuit : Optional[int] = None
    web: Optional[str] = None
    phone: Optional[int] = None
    
class CreateHotelsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    phone: Optional[int] = None
    address: Optional[str] = None
    web: Optional[str] = None
    
class CreateExcursionsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    description: Optional[str] = None
    
class CreatePeriodsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    
class CreateDestinosRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    sigla: Optional[str] = None
    
class CreateLugaresCargaRequest(BaseModel):
    id: Optional[str] = None
    airplane: Optional[bool] = None
    bus: Optional[bool] = None
    name: Optional[str] = None
    address: Optional[str] = None
    
class CreateClientsTypeRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    adminForSellers: Optional[bool] = None
    
class CreateClientsRequest(BaseModel):
    id: Optional[str] = None
    name_system: Optional[str] = None
    complete_name: Optional[str] = None
    client_type_id: Optional[str] = None
    parent_client_id: Optional[str] = None
    dni: Optional[int] = None
    birthday: Optional[date] = None
    email: Optional[str] = None
    phone: Optional[int] = None
    payment_method: Optional[str] = None
    commission: Optional[int] = None
    hashed_password: Optional[str] = None
    created_at: Optional[datetime] = None
    
class CreateRegimenesRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    sigla: Optional[str] = None
    description: Optional[str] = None
    
class CreatePassengersRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    last_name: Optional[str] = None
    dni: Optional[int] = None
    date_of_birth: Optional[date] = None
    sex: Optional[str] = None
    phone: Optional[int] = None
    
class CreateBusTypesRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    semicama_quantity: Optional[int] = None
    cama_quantity: Optional[int] = None
    panoramicos_quantity: Optional[int] = None
    description: Optional[str] = None

# Update

class UpdateTransportCompanyRequest(BaseModel):
    id : Optional[str] = None
    airplane: Optional[bool] = None
    bus: Optional[bool] = None
    name : Optional[str] = None
    cuit : Optional[int] = None
    web: Optional[str] = None
    phone: Optional[int] = None
    
class UpdateHotelsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    phone: Optional[int] = None
    address: Optional[str] = None
    web: Optional[str] = None
    
class UpdateExcursionsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    description: Optional[str] = None
    
class UpdatePeriodsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    
class UpdateDestinosRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    sigla: Optional[str] = None
    
class UpdateLugaresCargaRequest(BaseModel):
    id: Optional[str] = None
    airplane: Optional[bool] = None
    bus: Optional[bool] = None
    name: Optional[str] = None
    address: Optional[str] = None
    
class UpdateClientsTypeRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    adminForSellers: Optional[bool] = None
    
class UpdateClientsRequest(BaseModel):
    id: Optional[str] = None
    name_system: Optional[str] = None
    complete_name: Optional[str] = None
    client_type_id: Optional[str] = None
    parent_client_id: Optional[str] = None
    dni: Optional[int] = None
    birthday: Optional[date] = None
    email: Optional[str] = None
    phone: Optional[int] = None
    payment_method: Optional[str] = None
    commission: Optional[int] = None
    hashed_password: Optional[str] = None
    
class UpdateRegimenesRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    sigla: Optional[str] = None
    description: Optional[str] = None
    
class UpdatePassengersRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    last_name: Optional[str] = None
    dni: Optional[int] = None
    date_of_birth: Optional[date] = None
    sex: Optional[str] = None
    phone: Optional[int] = None
    
class UpdateBusTypesRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    semicama_quantity: Optional[int] = None
    cama_quantity: Optional[int] = None
    panoramicos_quantity: Optional[int] = None
    description: Optional[str] = None
