import email
from http import client
from fastapi import File, UploadFile
from pydantic import BaseModel
from typing import Optional, Union, Any, List
from datetime import datetime, date
PyDate = date

# Schemas for authentication and user management

class LoginWebRequest(BaseModel):
    email: str
    password: str
    iweb_client_id: Optional[str] = None

class LoginSystemRequest(BaseModel):
    username: str
    password: str
    slug: Optional[str] = None

class iWebClientPayload(BaseModel):
    id: str
    folder_id: int
    slug: str
    name: str
    cuit: int
    email: str
    status: bool
    logo_xl: str
    logo_s: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    iweb_client: Optional[iWebClientPayload] = None

class UserPayload(BaseModel):
    id: str
    iweb_client_id: str
    name: Optional[str]
    last_name: Optional[str]
    username: str
    rol: Optional[str] = "admin"

class UserCreatePayload(BaseModel):
    name: Optional[str] = None
    last_name: Optional[str] = None
    dni: Optional[int] = None
    birthday: Optional[str] = None
    username: str
    password: Optional[str] = None
    phone: Optional[int] = None
    active: int = 1
    rol: Optional[str] = "admin"

class ClientsCreatePayload(BaseModel):
    name_system: Optional[str] = None
    complete_name: Optional[str] = None
    client_type: Optional[str] = None
    parent_client_id: Optional[str] = None
    dni: Optional[int] = None
    birthday: Optional[date] = None
    email: Optional[str] = None
    phone: Optional[int] = None
    payment_method: Optional[str] = None
    commission: Optional[int] = None
    hashed_password: Optional[str] = None
    created_at: Optional[datetime] = None
    active: Optional[bool] = True
    allow_reservas: Optional[bool] = True

class UserCreateRequest(BaseModel):
    user: UserCreatePayload

class ClientsCreateRequest(BaseModel):
    client: ClientsCreatePayload

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
    slug: str
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
    type : Optional[str] = None
    name : Optional[str] = None
    cuit : Optional[int] = None
    web: Optional[str] = None
    phone: Optional[int] = None
    
class CreateHotelsRequest(BaseModel):
    id : Optional[str] = None
    destino : Optional[str] = None
    name : Optional[str] = None
    phone: Optional[int] = None
    address: Optional[str] = None
    web: Optional[str] = None
    
class CreateExcursionsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    destino : Optional[str] = None
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
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    is_essential: Optional[bool] = False
    
class CreateClientsTypeRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    adminForSellers: Optional[bool] = None
    admin_clients: Optional[str] = None
    
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
    active: Optional[bool] = True
    allow_reservas: Optional[bool] = True
    
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
    phone: Optional[Union[str, int]] = None
    
class CreateBusTypesRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    semicama_quantity: Optional[int] = None
    cama_quantity: Optional[int] = None
    panoramicos_quantity: Optional[int] = None
    description: Optional[str] = None
    # Compatibility with frontend:
    cant_semi: Optional[Union[int, str]] = None
    cant_cama: Optional[Union[int, str]] = None
    cant_pano: Optional[Union[int, str]] = None
    observaciones: Optional[str] = None

# Update

class UpdateTransportCompanyRequest(BaseModel):
    id : Optional[str] = None
    type : Optional[str] = None
    name : Optional[str] = None
    cuit : Optional[int] = None
    web: Optional[str] = None
    phone: Optional[int] = None
    
class UpdateHotelsRequest(BaseModel):
    id : Optional[str] = None
    destino : Optional[str] = None
    name : Optional[str] = None
    phone: Optional[int] = None
    address: Optional[str] = None
    web: Optional[str] = None
    
class UpdateExcursionsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    destino : Optional[str] = None
    description: Optional[str] = None
    
class UpdatePeriodsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    web_enabled: Optional[bool] = None
    
class UpdateDestinosRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    sigla: Optional[str] = None
    
class UpdateLugaresCargaRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    is_essential: Optional[bool] = None
    
class UpdateClientsTypeRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    adminForSellers: Optional[bool] = None
    admin_clients: Optional[str] = None
    
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
    active: Optional[bool] = None
    allow_reservas: Optional[bool] = None
    
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
    phone: Optional[Union[str, int]] = None
    
class UpdateBusTypesRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    semicama_quantity: Optional[int] = None
    cama_quantity: Optional[int] = None
    panoramicos_quantity: Optional[int] = None
    description: Optional[str] = None
    # Compatibility with frontend:
    cant_semi: Optional[Union[int, str]] = None
    cant_cama: Optional[Union[int, str]] = None
    cant_pano: Optional[Union[int, str]] = None
    observaciones: Optional[str] = None

# Schemas for permissions management

class PermissionPayload(BaseModel):
    id: str
    iweb_client_id: str
    name: Optional[str] = None
    salidas: Optional[bool] = None
    paquetes: Optional[bool] = None
    administracion: Optional[bool] = None
    parametros: Optional[bool] = None
    web: Optional[bool] = None
    permisos_users: Optional[bool] = None

class CreatePermissionRequest(BaseModel):
    name: Optional[str] = None
    salidas: Optional[bool] = None
    paquetes: Optional[bool] = None
    administracion: Optional[bool] = None
    parametros: Optional[bool] = None
    web: Optional[bool] = None
    permisos_users: Optional[bool] = None

class UpdatePermissionRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    salidas: Optional[bool] = None
    paquetes: Optional[bool] = None
    administracion: Optional[bool] = None
    parametros: Optional[bool] = None
    web: Optional[bool] = None
    permisos_users: Optional[bool] = None

# Schemas for web management

class FlyerPayload(BaseModel):
    id: str
    iweb_client_id: str
    name: Optional[str] = None
    url: Optional[str] = None
    periodo: Optional[str] = None

class CreateFlyerRequest(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    periodo: Optional[str] = None
    
class UpdateFlyerRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    url: Optional[str] = None
    periodo: Optional[str] = None

class NewsPayload(BaseModel):
    id: str
    iweb_client_id: str
    url: Optional[str] = None

class CreateNewsRequest(BaseModel):
    url: Optional[str] = None
    
class UpdateNewsRequest(BaseModel):
    id: Optional[str] = None
    url: Optional[str] = None

class DocumentationPayload(BaseModel):
    id: str
    iweb_client_id: str
    title: Optional[str] = None
    body: Optional[str] = None

class CreateDocumentationRequest(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None

class UpdateDocumentationRequest(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    body: Optional[str] = None

class AccountCreateRequest(BaseModel):
    account_title: Optional[str] = None
    titular: Optional[str] = None
    account_number: Optional[str] = None
    cuit_cuil: Optional[str] = None
    cbu_cvu: Optional[str] = None
    alias: Optional[str] = None
    active: Optional[bool] = None

class AccountPayload(BaseModel):
    id: str
    iweb_client_id: str
    account_title: Optional[str] = None
    titular: Optional[str] = None
    account_number: Optional[str] = None
    cuit_cuil: Optional[str] = None
    cbu_cvu: Optional[str] = None
    alias: Optional[str] = None
    active: Optional[bool] = None

class AccountUpdateRequest(BaseModel):
    id: Optional[str] = None
    account_title: Optional[str] = None
    titular: Optional[str] = None
    account_number: Optional[str] = None
    cuit_cuil: Optional[str] = None
    cbu_cvu: Optional[str] = None
    alias: Optional[str] = None
    active: Optional[bool] = None 


class LugarCargaPayload(BaseModel):
    id: str
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    horario: Optional[str] = None

    class Config:
        from_attributes = True


class SalidaResponse(BaseModel):
    id: str
    iweb_client_id: str
    date_of_out: Optional[str] = None
    type: Optional[str] = None
    active: Optional[bool] = None
    periodo: Optional[str] = None
    transport_company: Optional[str] = None
    type_bus: Optional[str] = None
    destino: Optional[str] = None
    coordinador_nombre: Optional[str] = None
    coordinador_telefono: Optional[str] = None
    hotel_id: Optional[str] = None
    regimen_id: Optional[str] = None
    alcance: Optional[str] = "argentina"
    vouchers_online: Optional[bool] = False
    passengers: Optional[int] = None
    semicama: Optional[int] = None
    cama: Optional[int] = None
    cargas: list[LugarCargaPayload] = []
    semicama_disponibles: Optional[int] = None
    cama_disponibles: Optional[int] = None
    semicama_reservadas: Optional[int] = None
    cama_reservadas: Optional[int] = None

    class Config:
        from_attributes = True


class SalidaCreateRequest(BaseModel):
    date_of_out: Optional[str] = None
    type: Optional[str] = None
    active: Optional[bool] = True
    periodo: Optional[str] = None
    transport_company: Optional[str] = None
    type_bus: Optional[str] = None
    destino: Optional[str] = None
    alcance: Optional[str] = "argentina"
    vouchers_online: Optional[bool] = False
    passengers: Optional[int] = None
    semicama: Optional[int] = None
    cama: Optional[int] = None
    cargas_ids: list[str] = []
    horarios: list[str] = []
    coordinador_nombre: Optional[str] = None
    coordinador_telefono: Optional[str] = None
    hotel_id: Optional[str] = None
    regimen_id: Optional[str] = None


class SalidaUpdateRequest(BaseModel):
    date_of_out: Optional[str] = None
    type: Optional[str] = None
    active: Optional[bool] = None
    periodo: Optional[str] = None
    transport_company: Optional[str] = None
    type_bus: Optional[str] = None
    destino: Optional[str] = None
    alcance: Optional[str] = None
    vouchers_online: Optional[bool] = None
    passengers: Optional[int] = None
    semicama: Optional[int] = None
    cama: Optional[int] = None
    cargas_ids: Optional[list[str]] = None
    horarios: Optional[list[str]] = None
    coordinador_nombre: Optional[str] = None
    coordinador_telefono: Optional[str] = None
    hotel_id: Optional[str] = None
    regimen_id: Optional[str] = None


class PackageHotelPayload(BaseModel):
    hotel_id: Optional[str] = None
    hotel_noches: Optional[int] = None
    hotel_fecha_in: Optional[str] = None
    hotel_fecha_out: Optional[str] = None
    hotel_fecha_salida_mas: Optional[str] = None
    hotel_regimen_id: Optional[str] = None
    tarifa_single: Optional[int] = None
    comisionable_single: Optional[bool] = False
    tarifa_doble: Optional[int] = None
    tarifa_triple: Optional[int] = None
    tarifa_cuadruple: Optional[int] = None
    tarifa_quintuple: Optional[int] = None
    tarifa_menores: Optional[int] = None
    pricing_type: Optional[str] = "persona"


class PackageHotelResponse(PackageHotelPayload):
    id: str
    package_id: str
    iweb_client_id: str

    class Config:
        from_attributes = True


class PackageResponse(BaseModel):
    id: str
    iweb_client_id: str
    name: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    gastos: Optional[int] = None
    adicional: Optional[int] = None
    destino: Optional[str] = None
    periodo: Optional[str] = None
    image: Optional[str] = None
    active: Optional[bool] = None
    web: Optional[bool] = None
    dates: list[str] = []
    comisionable: Optional[bool] = False
    moneda: Optional[str] = "pesos"
    moneda_gastos: Optional[str] = "pesos"
    moneda_adicional: Optional[str] = "pesos"
    excursiones: Optional[str] = None
    hotels: list[PackageHotelResponse] = []

    class Config:
        from_attributes = True


class PackageCreateRequest(BaseModel):
    name: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    gastos: Optional[int] = None
    adicional: Optional[int] = None
    destino: Optional[str] = None
    periodo: Optional[str] = None
    image: Optional[str] = None
    active: Optional[bool] = True
    web: Optional[bool] = True
    dates: list[str] = []
    comisionable: Optional[bool] = False
    moneda: Optional[str] = "pesos"
    moneda_gastos: Optional[str] = "pesos"
    moneda_adicional: Optional[str] = "pesos"
    excursiones: Optional[str] = None
    hotels: list[PackageHotelPayload] = []


class PackageUpdateRequest(BaseModel):
    name: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    price: Optional[int] = None
    gastos: Optional[int] = None
    adicional: Optional[int] = None
    destino: Optional[str] = None
    periodo: Optional[str] = None
    image: Optional[str] = None
    active: Optional[bool] = None
    web: Optional[bool] = None
    dates: list[str] = []
    comisionable: Optional[bool] = None
    moneda: Optional[str] = None
    moneda_gastos: Optional[str] = None
    moneda_adicional: Optional[str] = None
    excursiones: Optional[str] = None
    hotels: Optional[list[PackageHotelPayload]] = None


class ReservaResponse(BaseModel):
    id: str
    iweb_client_id: str
    passenger_id: str
    salida_id: Optional[str] = None
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
    type: Optional[str] = "tradicional"

    class Config:
        from_attributes = True


class PagoCreateRequest(BaseModel):
    reserva_id: str
    payment_method: Optional[str] = None
    date_pay: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    observations: Optional[str] = None
    card_number: Optional[str] = None
    titular: Optional[str] = None
    operation_number: Optional[str] = None
    quotes_number: Optional[str] = None
    receipt_number: Optional[str] = None


class PagoResponse(BaseModel):
    id: str
    iweb_client_id: str
    reserva_id: str
    payment_method: Optional[str] = None
    date_pay: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    observations: Optional[str] = None
    card_number: Optional[str] = None
    titular: Optional[str] = None
    operation_number: Optional[str] = None
    quotes_number: Optional[str] = None
    receipt_number: Optional[str] = None
    account_id: Optional[str] = None

    class Config:
        from_attributes = True

class cuentasCorrientsClientsCreateRequest(BaseModel):
    id: Optional[str] = None
    iweb_client_id: Optional[str] = None
    client_id: Optional[str] = None
    booking_id: Optional[str] = None
    description: Optional[str] = None
    balance: Optional[float] = None
    total_bookings: Optional[float] = None
    total_payments: Optional[float] = None
    created_at: Optional[str] = None

class cuentasCorrientsClientsResponse(BaseModel):
    id: str
    iweb_client_id: str
    client_id: str
    booking_id: str
    description: Optional[str] = None
    balance: Optional[float] = None
    total_bookings: Optional[float] = None
    total_payments: Optional[float] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class cuentasCorrientsProvidersCreateRequest(BaseModel):
    id: Optional[str] = None
    iweb_client_id: Optional[str] = None
    type: Optional[str] = None
    transport_id: Optional[str] = None
    hotel_id: Optional[str] = None
    detail: Optional[str] = None
    balance: Optional[float] = None
    total_consumption: Optional[float] = None
    total_payments: Optional[float] = None
    created_at: Optional[str] = None

class cuentasCorrientsProvidersResponse(BaseModel):
    id: str
    iweb_client_id: str
    type: Optional[str] = None
    transport_id: Optional[str] = None
    hotel_id: Optional[str] = None
    detail: Optional[str] = None
    balance: Optional[float] = None
    total_consumption: Optional[float] = None
    total_payments: Optional[float] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ccProvidersConsumptionPaymentsCreateRequest(BaseModel):
    id: Optional[str] = None
    cc_provider_id: Optional[str] = None
    provider_type: Optional[str] = None
    hotel_id: Optional[str] = None
    transport_id: Optional[str] = None
    date: Optional[Union[PyDate, str]] = None
    detail: Optional[str] = None
    type: Optional[str] = None
    transf_account: Optional[str] = None
    amount: Optional[float] = None
    iweb_client_id: Optional[str] = None


class ccProvidersConsumptionPaymentsResponse(BaseModel):
    id: str
    cc_provider_id: Optional[str] = None
    provider_type: Optional[str] = None
    hotel_id: Optional[str] = None
    transport_id: Optional[str] = None
    date: Optional[Union[PyDate, str]] = None
    detail: Optional[str] = None
    type: Optional[str] = None
    transf_account: Optional[str] = None
    amount: Optional[float] = None
    iweb_client_id: str

    class Config:
        from_attributes = True


class GastoNoCommissionCreate(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    amount: Optional[float] = None
    iweb_client_id: Optional[str] = None


class GastoNoCommissionResponse(BaseModel):
    id: str
    liquidacion_id: Optional[str] = None
    name: Optional[str] = None
    amount: Optional[float] = None
    iweb_client_id: Optional[str] = None

    class Config:
        from_attributes = True


class LiquidacionCreateRequest(BaseModel):
    id: Optional[str] = None
    iweb_client_id: str
    booking_id: Optional[str] = None
    total_amout: Optional[float] = None
    total_commission: Optional[float] = None
    commission: Optional[float] = None
    gastos: Optional[list[GastoNoCommissionCreate]] = []


class LiquidacionResponse(BaseModel):
    id: str
    iweb_client_id: Optional[str] = None
    booking_id: Optional[str] = None
    total_amout: Optional[float] = None
    total_commission: Optional[float] = None
    commission: Optional[float] = None
    gastos: list[GastoNoCommissionResponse] = []

    class Config:
        from_attributes = True


class TesoroMovimientoCreateRequest(BaseModel):
    iweb_client_id: str
    account_id: str
    movement_type: str  # 'ingreso' or 'egreso'
    recibo_number: Optional[str] = None
    amount: float
    detail: str
    date: Optional[Union[PyDate, str]] = None


class TesoroPaseDineroCreateRequest(BaseModel):
    iweb_client_id: str
    account_origen_id: str
    account_destino_id: str
    amount: float
    detail: str
    date: Optional[Union[PyDate, str]] = None


class TesoroMovimientoResponse(BaseModel):
    id: str
    iweb_client_id: str
    account_id: str
    cuenta: str
    fecha: str
    recibo: str
    monto: float
    tipo: str
    detalle: str


class FormaDePagoPayload(BaseModel):
    id: str
    iweb_client_id: str
    calculator: bool = True
    card_text: Optional[str] = None

    class Config:
        from_attributes = True


class AccountsWebPayload(BaseModel):
    id: str
    iweb_client_id: str
    type_account: Optional[str] = None
    titular: Optional[str] = None
    account_number: Optional[str] = None
    cbu_cvu: Optional[str] = None
    alias: Optional[str] = None
    active: bool = True

    class Config:
        from_attributes = True


class CardsWebPayload(BaseModel):
    id: str
    iweb_client_id: str
    name: Optional[str] = None
    quotes: Optional[int] = 1
    recargo: Optional[float] = 0.0

    class Config:
        from_attributes = True

class cuentasCorrientsClientsCreateRequest(BaseModel):
    id: Optional[str] = None
    iweb_client_id: Optional[str] = None
    client_id: Optional[str] = None
    booking_id: Optional[str] = None
    description: Optional[str] = None
    balance: Optional[float] = None
    total_bookings: Optional[float] = None
    total_payments: Optional[float] = None
    created_at: Optional[str] = None

class cuentasCorrientsClientsResponse(BaseModel):
    id: str
    iweb_client_id: str
    client_id: str
    booking_id: str
    description: Optional[str] = None
    balance: Optional[float] = None
    total_bookings: Optional[float] = None
    total_payments: Optional[float] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class cuentasCorrientsProvidersCreateRequest(BaseModel):
    id: Optional[str] = None
    iweb_client_id: Optional[str] = None
    type: Optional[str] = None
    transport_id: Optional[str] = None
    hotel_id: Optional[str] = None
    detail: Optional[str] = None
    balance: Optional[float] = None
    total_consumption: Optional[float] = None
    total_payments: Optional[float] = None
    created_at: Optional[str] = None

class cuentasCorrientsProvidersResponse(BaseModel):
    id: str
    iweb_client_id: str
    type: Optional[str] = None
    transport_id: Optional[str] = None
    hotel_id: Optional[str] = None
    detail: Optional[str] = None
    balance: Optional[float] = None
    total_consumption: Optional[float] = None
    total_payments: Optional[float] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class ccProvidersConsumptionPaymentsCreateRequest(BaseModel):
    id: Optional[str] = None
    cc_provider_id: Optional[str] = None
    provider_type: Optional[str] = None
    hotel_id: Optional[str] = None
    transport_id: Optional[str] = None
    date: Optional[Union[PyDate, str]] = None
    detail: Optional[str] = None
    type: Optional[str] = None
    transf_account: Optional[str] = None
    amount: Optional[float] = None
    iweb_client_id: Optional[str] = None


class ccProvidersConsumptionPaymentsResponse(BaseModel):
    id: str
    cc_provider_id: Optional[str] = None
    provider_type: Optional[str] = None
    hotel_id: Optional[str] = None
    transport_id: Optional[str] = None
    date: Optional[Union[PyDate, str]] = None
    detail: Optional[str] = None
    type: Optional[str] = None
    transf_account: Optional[str] = None
    amount: Optional[float] = None
    iweb_client_id: str

    class Config:
        from_attributes = True


class GastoNoCommissionCreate(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    amount: Optional[float] = None
    iweb_client_id: Optional[str] = None


class GastoNoCommissionResponse(BaseModel):
    id: str
    liquidacion_id: Optional[str] = None
    name: Optional[str] = None
    amount: Optional[float] = None
    iweb_client_id: str

    class Config:
        from_attributes = True


class LiquidacionCreateRequest(BaseModel):
    id: Optional[str] = None
    iweb_client_id: str
    booking_id: Optional[str] = None
    total_amout: Optional[float] = None
    total_commission: Optional[float] = None
    commission: Optional[float] = None
    gastos: Optional[list[GastoNoCommissionCreate]] = []


class LiquidacionResponse(BaseModel):
    id: str
    iweb_client_id: Optional[str] = None
    booking_id: Optional[str] = None
    total_amout: Optional[float] = None
    total_commission: Optional[float] = None
    commission: Optional[float] = None
    gastos: list[GastoNoCommissionResponse] = []

    class Config:
        from_attributes = True


class TesoroMovimientoCreateRequest(BaseModel):
    iweb_client_id: str
    account_id: str
    movement_type: str  # 'ingreso' or 'egreso'
    recibo_number: Optional[str] = None
    amount: float
    detail: str
    date: Optional[Union[PyDate, str]] = None


class TesoroPaseDineroCreateRequest(BaseModel):
    iweb_client_id: str
    account_origen_id: str
    account_destino_id: str
    amount: float
    detail: str
    date: Optional[Union[PyDate, str]] = None


class TesoroMovimientoResponse(BaseModel):
    id: str
    iweb_client_id: str
    account_id: str
    cuenta: str
    fecha: str
    recibo: str
    monto: float
    tipo: str
    detalle: str


class FormaDePagoPayload(BaseModel):
    id: str
    iweb_client_id: str
    calculator: bool = True
    card_text: Optional[str] = None

    class Config:
        from_attributes = True


class AccountsWebPayload(BaseModel):
    id: str
    iweb_client_id: str
    type_account: Optional[str] = None
    titular: Optional[str] = None
    account_number: Optional[str] = None
    cbu_cvu: Optional[str] = None
    alias: Optional[str] = None
    active: bool = True

    class Config:
        from_attributes = True


class CardsWebPayload(BaseModel):
    id: str
    iweb_client_id: str
    name: Optional[str] = None
    quotes: Optional[int] = 1
    recargo: Optional[float] = 0.0

    class Config:
        from_attributes = True

import email
from http import client

from fastapi import File, UploadFile
from datetime import datetime
from pydantic import BaseModel
from typing import Optional
from datetime import date

# Schemas for authentication and user management

class LoginWebRequest(BaseModel):
    email: str
    password: str
    iweb_client_id: Optional[str] = None

class LoginSystemRequest(BaseModel):
    username: str
    password: str
    slug: Optional[str] = None

class iWebClientPayload(BaseModel):
    id: str
    folder_id: int
    slug: str
    name: str
    cuit: int
    email: str
    status: bool
    logo_xl: str
    logo_s: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    iweb_client: Optional[iWebClientPayload] = None

class UserPayload(BaseModel):
    id: str
    iweb_client_id: str
    name: Optional[str]
    last_name: Optional[str]
    username: str
    rol: Optional[str] = "admin"

class UserCreatePayload(BaseModel):
    name: Optional[str] = None
    last_name: Optional[str] = None
    dni: Optional[Union[int, str]] = None
    birthday: Optional[str] = None
    username: str
    password: Optional[str] = None
    phone: Optional[Union[int, str]] = None
    active: Optional[Union[bool, int]] = 1
    rol: Optional[str] = "admin"

class UserUpdatePayload(BaseModel):
    name: Optional[str] = None
    last_name: Optional[str] = None
    dni: Optional[Union[int, str]] = None
    birthday: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    phone: Optional[Union[int, str]] = None
    active: Optional[Union[bool, int]] = 1
    rol: Optional[str] = None

class UserUpdateRequest(BaseModel):
    user: UserUpdatePayload

class ClientsCreateRequest(BaseModel):
    client: ClientsCreatePayload

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
    slug: str
    name: str
    cuit: int
    email: str
    status: bool
    logo_xl: str
    logo_s: str

class TenantAdminInfo(BaseModel):
    id: str
    username: str
    name: Optional[str] = None
    last_name: Optional[str] = None
    initial_password: Optional[str] = None

class ProvisioningStatus(BaseModel):
    database: str = "OK"
    storage: str = "OK"
    subdomain: str = "OK"

class iWebClientProvisionResponse(BaseModel):
    client: iWebClientResponse
    admin_user: TenantAdminInfo
    login_url: str
    status: ProvisioningStatus

class TenantPublicInfoResponse(BaseModel):
    id: str
    name: str
    slug: str
    status: bool
    logo_xl: str
    logo_s: str

    
# Schemas for parameters management #

# Create

class CreateTransportCompanyRequest(BaseModel):
    id : Optional[str] = None
    type : Optional[str] = None
    name : Optional[str] = None
    cuit : Optional[int] = None
    web: Optional[str] = None
    phone: Optional[int] = None
    
class CreateHotelsRequest(BaseModel):
    id : Optional[str] = None
    destino : Optional[str] = None
    name : Optional[str] = None
    phone: Optional[int] = None
    address: Optional[str] = None
    web: Optional[str] = None
    
class CreateExcursionsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    destino : Optional[str] = None
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
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    
class CreateClientsTypeRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    adminForSellers: Optional[bool] = None
    admin_clients: Optional[str] = None
    
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
    active: Optional[bool] = True
    allow_reservas: Optional[bool] = True
    
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
    phone: Optional[Union[str, int]] = None
    
class CreateBusTypesRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    semicama_quantity: Optional[int] = None
    cama_quantity: Optional[int] = None
    panoramicos_quantity: Optional[int] = None
    description: Optional[str] = None
    # Compatibility with the current parameter form payload.
    cant_semi: Optional[Union[int, str]] = None
    cant_cama: Optional[Union[int, str]] = None
    cant_pano: Optional[Union[int, str]] = None
    observaciones: Optional[str] = None

# Update

class UpdateTransportCompanyRequest(BaseModel):
    id : Optional[str] = None
    type : Optional[str] = None
    name : Optional[str] = None
    cuit : Optional[int] = None
    web: Optional[str] = None
    phone: Optional[Union[str, int]] = None
    
class UpdateHotelsRequest(BaseModel):
    id : Optional[str] = None
    destino : Optional[str] = None
    name : Optional[str] = None
    phone: Optional[Union[str, int]] = None
    address: Optional[str] = None
    web: Optional[str] = None
    
class UpdateExcursionsRequest(BaseModel):
    id : Optional[str] = None
    name : Optional[str] = None
    destino : Optional[str] = None
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
    name: Optional[str] = None
    type: Optional[str] = None
    address: Optional[str] = None
    
class UpdateClientsTypeRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    adminForSellers: Optional[bool] = None
    admin_clients: Optional[str] = None
    
class UpdateClientsRequest(BaseModel):
    id: Optional[str] = None
    name_system: Optional[str] = None
    complete_name: Optional[str] = None
    client_type_id: Optional[str] = None
    parent_client_id: Optional[str] = None
    dni: Optional[int] = None
    birthday: Optional[date] = None
    email: Optional[str] = None
    phone: Optional[Union[str, int]] = None
    payment_method: Optional[str] = None
    commission: Optional[int] = None
    hashed_password: Optional[str] = None
    active: Optional[bool] = None
    allow_reservas: Optional[bool] = None
    
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
    phone: Optional[Union[str, int]] = None
    
class UpdateBusTypesRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    semicama_quantity: Optional[int] = None
    cama_quantity: Optional[int] = None
    panoramicos_quantity: Optional[int] = None
    description: Optional[str] = None
    # Compatibility with the current parameter form payload.
    cant_semi: Optional[Union[int, str]] = None
    cant_cama: Optional[Union[int, str]] = None
    cant_pano: Optional[Union[int, str]] = None
    observaciones: Optional[str] = None

# Schemas for permissions management

class PermissionPayload(BaseModel):
    id: str
    iweb_client_id: str
    name: Optional[str] = None
    salidas: Optional[bool] = None
    paquetes: Optional[bool] = None
    administracion: Optional[bool] = None
    parametros: Optional[bool] = None
    web: Optional[bool] = None
    permisos_users: Optional[bool] = None

class CreatePermissionRequest(BaseModel):
    name: Optional[str] = None
    salidas: Optional[bool] = None
    paquetes: Optional[bool] = None
    administracion: Optional[bool] = None
    parametros: Optional[bool] = None
    web: Optional[bool] = None
    permisos_users: Optional[bool] = None

class UpdatePermissionRequest(BaseModel):
    id: Optional[str] = None
    name: Optional[str] = None
    salidas: Optional[bool] = None
    paquetes: Optional[bool] = None
    administracion: Optional[bool] = None
    parametros: Optional[bool] = None
    web: Optional[bool] = None
    permisos_users: Optional[bool] = None

# Schemas for web management

class NewsPayload(BaseModel):
    id: str
    iweb_client_id: str
    url: Optional[str] = None

class CreateNewsRequest(BaseModel):
    url: Optional[str] = None
    
class UpdateNewsRequest(BaseModel):
    id: Optional[str] = None
    url: Optional[str] = None

class AccountCreateRequest(BaseModel):
    account_title: Optional[str] = None
    titular: Optional[str] = None
    account_number: Optional[str] = None
    cuit_cuil: Optional[int] = None
    cbu_cvu: Optional[int] = None
    alias: Optional[str] = None
    active: Optional[bool] = None

class AccountPayload(BaseModel):
    id: str
    iweb_client_id: str
    account_title: Optional[str] = None
    titular: Optional[str] = None
    account_number: Optional[str] = None
    cuit_cuil: Optional[int] = None
    cbu_cvu: Optional[int] = None
    alias: Optional[str] = None
    active: Optional[bool] = None

class AccountUpdateRequest(BaseModel):
    id: Optional[str] = None
    account_title: Optional[str] = None
    titular: Optional[str] = None
    account_number: Optional[str] = None
    cuit_cuil: Optional[int] = None
    cbu_cvu: Optional[int] = None
    alias: Optional[str] = None
    active: Optional[bool] = None


class CardResponse(BaseModel):
    id: str
    iweb_client_id: str
    name: Optional[str] = None
    status: Optional[bool] = True

    class Config:
        from_attributes = True


class CardCreateRequest(BaseModel):
    name: str
    status: Optional[bool] = True


class CardUpdateRequest(BaseModel):
    name: Optional[str] = None
    status: Optional[bool] = None


class InicioWebPayload(BaseModel):
    id: str
    iweb_client_id: str
    banner_url: Optional[str] = None
    carrusel_urls: Optional[list[str]] = []
    portada_footer_url: Optional[str] = None

    class Config:
        from_attributes = True
