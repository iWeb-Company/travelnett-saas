from datetime import date, datetime

from sqlalchemy import BOOLEAN, INT, Date, DateTime, Integer, SmallInteger, String, Numeric, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


class iWebClient(Base):
    __tablename__ = "iweb_clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    folder_id: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cuit: Mapped[int | None] = mapped_column(INT, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    logo_xl: Mapped[str | None] = mapped_column(String(255), nullable=True)
    logo_s: Mapped[str | None] = mapped_column(String(255), nullable=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dni: Mapped[int | None] = mapped_column(Integer, nullable=True)
    birthday: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    username: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    rol: Mapped[str | None] = mapped_column(String(255), nullable=True, default="admin")
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)


class TransportCompany(Base):
    __tablename__ = "transport_companies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cuit: Mapped[int | None] = mapped_column(INT, nullable=True)
    web: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[int | None] = mapped_column(Integer, nullable=True)


class Hotels(Base):
    __tablename__ = "hotels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    destino: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[int | None] = mapped_column(Integer, nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    web: Mapped[str | None] = mapped_column(String(255), nullable=True)


class HotelsImages(Base):
    __tablename__ = "hotels_images"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    hotel_id: Mapped[str] = mapped_column(String(36), nullable=False)
    url: Mapped[str] = mapped_column(String(255), nullable=False)


class Excursions(Base):
    __tablename__ = "excursions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    destino: Mapped[str | None] = mapped_column(String(255), nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Periods(Base):
    __tablename__ = "periods"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    main_image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    web_enabled: Mapped[bool] = mapped_column(BOOLEAN, default=True, nullable=False, server_default="1")


class Destinos(Base):
    __tablename__ = "destinos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sigla: Mapped[str | None] = mapped_column(String(255), nullable=True)


class LugaresCarga(Base):
    __tablename__ = "lugares_carga"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_essential: Mapped[bool] = mapped_column(BOOLEAN, default=False, nullable=False, server_default="0")

class ClientsType(Base):
    __tablename__ = "clientsType"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    adminForSellers: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    admin_clients: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Clients(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name_system: Mapped[str | None] = mapped_column(String(255), nullable=True)
    complete_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_type: Mapped[str | None] = mapped_column(String(36), nullable=True)
    parent_client_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    dni: Mapped[int | None] = mapped_column(Integer, nullable=True)
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[int | None] = mapped_column(Integer, nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(255), nullable=True)
    commission: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hashed_password: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    active: Mapped[bool] = mapped_column(BOOLEAN, default=True, nullable=False, server_default="1")


class Regimenes(Base):
    __tablename__ = "regimenes"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    sigla: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)


class Passengers(Base):
    __tablename__ = "passengers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dni: Mapped[int | None] = mapped_column(Integer, nullable=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    sex: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)


class BusTypes(Base):
    __tablename__ = "bus_types"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    semicama_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cama_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    panoramicos_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    description: Mapped[str | None] = mapped_column("observations", String(510), nullable=True)

class Permission(Base):
    __tablename__ = "permissions"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    salidas: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    paquetes: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    administracion: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    parametros: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    web: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    permisos_users: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    
class Flyers(Base):
    __tablename__ = "flyers"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    periodo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    
class News(Base):
    __tablename__ = "news"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    url: Mapped[str | None] = mapped_column(String(255), nullable=True)

class Documentations(Base):
    __tablename__ = "documentations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)

class Accounts(Base):
    __tablename__ = "accounts"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    account_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    titular: Mapped[str | None] = mapped_column(String(255), nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cuit_cuil: Mapped[str | None] = mapped_column(String(50), nullable=True)
    cbu_cvu: Mapped[str | None] = mapped_column(String(50), nullable=True)
    alias: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)


class Salidas(Base):
    __tablename__ = "salidas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    date_of_out: Mapped[str | None] = mapped_column(String(255), nullable=True)
    passengers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    semicama: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cama: Mapped[int | None] = mapped_column(Integer, nullable=True)
    type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    periodo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    transport_company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    type_bus: Mapped[str | None] = mapped_column(String(255), nullable=True)
    destino: Mapped[str | None] = mapped_column(String(255), nullable=True)
    coordinador_nombre: Mapped[str | None] = mapped_column(String(255), nullable=True)
    coordinador_telefono: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hotel_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    regimen_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class SalidasLugaresCarga(Base):
    __tablename__ = "salidas_lugares_carga"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    salida_id: Mapped[str] = mapped_column(String(36), nullable=False)
    cargas: Mapped[str | None] = mapped_column(String(512), nullable=True)
    horarios: Mapped[str | None] = mapped_column(String(512), nullable=True)


class Packages(Base):
    __tablename__ = "packages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    subtitle: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(String(510), nullable=True)
    price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    gastos: Mapped[int | None] = mapped_column(Integer, nullable=True)
    adicional: Mapped[int | None] = mapped_column(Integer, nullable=True)
    destino: Mapped[str | None] = mapped_column(String(255), nullable=True)
    periodo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    web: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True, default=True)
    comisionable: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True, default=False)
    moneda: Mapped[str | None] = mapped_column(String(50), nullable=True, default="pesos")
    moneda_gastos: Mapped[str | None] = mapped_column(String(50), nullable=True, default="pesos")
    moneda_adicional: Mapped[str | None] = mapped_column(String(50), nullable=True, default="pesos")
    excursiones: Mapped[str | None] = mapped_column(String(512), nullable=True)


class PackagesDatesOfExit(Base):
    __tablename__ = "packages_dates_of_exit"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    package_id: Mapped[str] = mapped_column(String(36), nullable=False)
    salida_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    active: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=True)


class PackageHotels(Base):
    __tablename__ = "package_hotels"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    package_id: Mapped[str] = mapped_column(String(36), nullable=False)
    hotel_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hotel_noches: Mapped[int | None] = mapped_column(Integer, nullable=True)
    hotel_fecha_in: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hotel_fecha_out: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hotel_fecha_salida_mas: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hotel_regimen_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    tarifa_single: Mapped[int | None] = mapped_column(Integer, nullable=True)
    comisionable_single: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True, default=False)
    tarifa_doble: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tarifa_triple: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tarifa_cuadruple: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tarifa_quintuple: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tarifa_menores: Mapped[int | None] = mapped_column(Integer, nullable=True)
    pricing_type: Mapped[str | None] = mapped_column(String(50), nullable=True, default="persona")


class Reservas(Base):
    __tablename__ = "reservas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    salida_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    codigo_reserva: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_id: Mapped[str | None] = mapped_column(String(36), nullable=True)  # FK → clients.id
    lugar_carga_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    hotel_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    regimen_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    rooming_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    room_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    venciment: Mapped[str | None] = mapped_column(String(255), nullable=True)
    observations: Mapped[str | None] = mapped_column(String(255), nullable=True)
    package_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    commission: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    liberados: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)
    type: Mapped[str | None] = mapped_column(String(50), nullable=True, default="tradicional")
    titulo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.utcnow)
    created_by_user_id: Mapped[str | None] = mapped_column(String(36), nullable=True)


class ReservationPassengers(Base):
    __tablename__ = "reservation_passengers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    reserva_id: Mapped[str] = mapped_column(String(36), nullable=False)
    pasajero_id: Mapped[str] = mapped_column(String(36), nullable=False)
    pasajero_type: Mapped[str] = mapped_column(String(36), nullable=False)
    butaca_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    butaca_type: Mapped[str | None] = mapped_column(String(36), nullable=True)
    bus_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    lugar_carga_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    room_index: Mapped[int | None] = mapped_column(Integer, nullable=True, default=0)


class Vouchers(Base):
    __tablename__ = "vouchers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    reserva_id: Mapped[str] = mapped_column(String(36), nullable=False)
    salida_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    package_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    
    # Datos snapshot resueltos para el voucher
    destino_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    titular_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    titular_dni: Mapped[str | None] = mapped_column(String(50), nullable=True)
    total_passengers: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fecha_salida: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tipo_transporte: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tipo_butaca: Mapped[str | None] = mapped_column(String(255), nullable=True)
    lugar_carga: Mapped[str | None] = mapped_column(String(255), nullable=True)
    horario_carga: Mapped[str | None] = mapped_column(String(255), nullable=True)
    empresa_transporte: Mapped[str | None] = mapped_column(String(255), nullable=True)
    coordinador_nombre: Mapped[str | None] = mapped_column(String(255), nullable=True)
    coordinador_telefono: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hotel_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    room_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    passengers_names: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    regimen_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dias: Mapped[int | None] = mapped_column(Integer, nullable=True)
    noches: Mapped[int | None] = mapped_column(Integer, nullable=True)
    observations: Mapped[str | None] = mapped_column(String(510), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True, default=datetime.utcnow)


class Pagos(Base):
    __tablename__ = "pagos"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    reserva_id: Mapped[str] = mapped_column(String(36), nullable=False)
    payment_method: Mapped[str | None] = mapped_column(String(255), nullable=True)
    date_pay: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    currency: Mapped[str | None] = mapped_column(String(50), nullable=True)
    observations: Mapped[str | None] = mapped_column(String(510), nullable=True)
    card_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    titular: Mapped[str | None] = mapped_column(String(255), nullable=True)
    operation_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quotes_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    receipt_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    account_id: Mapped[str | None] = mapped_column(String(36), nullable=True)

class cuentasCorrientsClients(Base):
    __tablename__ = "cuentas_corrients_clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    booking_id: Mapped[str] = mapped_column(String(36), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    balance: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    total_bookings: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    total_payments: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

class cuentasCorrientesProviders(Base):
    __tablename__ = "cuentas_corrientes_providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    transport_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    hotel_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    detail: Mapped[str | None] = mapped_column(String(255), nullable=True)
    balance: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    total_consumption: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    total_payments: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    created_at: Mapped[date | None] = mapped_column(DateTime, nullable=True)


class ccProvidersConsumptionPayments(Base):
    __tablename__ = "cc_providers_consumption_payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    cc_provider_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    provider_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hotel_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    transport_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    date: Mapped[date | None] = mapped_column(Date, nullable=True)
    detail: Mapped[str | None] = mapped_column(String(255), nullable=True)
    type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    transf_account: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)


class Liquidaciones(Base):
    __tablename__ = "liquidaciones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False, default="GLOBAL")
    booking_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    total_amout: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    total_commission: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    commission: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)


class GastosNoCommission(Base):
    __tablename__ = "gastos_no_commission"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    liquidacion_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    amount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)


class Tesoro(Base):
    __tablename__ = "tesoro"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False, default="GLOBAL")
    account_id: Mapped[str] = mapped_column(String(36), nullable=False)
    movement_type: Mapped[str] = mapped_column(String(50), nullable=False)
    recibo_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    ammount: Mapped[float | None] = mapped_column(Numeric(15, 2), nullable=True)
    detail: Mapped[str | None] = mapped_column(String(510), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


class FormaDePago(Base):
    __tablename__ = "forma_de_pago"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    calculator: Mapped[bool | None] = mapped_column(BOOLEAN, default=True)
    card_text: Mapped[str | None] = mapped_column(String(1000), nullable=True)


class AccountsWeb(Base):
    __tablename__ = "accounts_web"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    type_account: Mapped[str | None] = mapped_column(String(255), nullable=True)
    titular: Mapped[str | None] = mapped_column(String(255), nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(255), nullable=True)
    cbu_cvu: Mapped[str | None] = mapped_column(String(255), nullable=True)
    alias: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active: Mapped[bool | None] = mapped_column(BOOLEAN, default=True)


class CardsWeb(Base):
    __tablename__ = "cards_web"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quotes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    recargo: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)


class Cards(Base):
    __tablename__ = "cards"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True, default=True)


class InicioWeb(Base):
    __tablename__ = "inicio_web"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False, unique=True)
    banner_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    carrusel_urls: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    portada_footer_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
