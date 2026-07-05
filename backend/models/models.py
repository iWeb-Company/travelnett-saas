from datetime import date, datetime

from sqlalchemy import BOOLEAN, INT, Date, DateTime, Integer, SmallInteger, String, Numeric
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
    phone: Mapped[int | None] = mapped_column(Integer, nullable=True)


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
    
class News(Base):
    __tablename__ = "news"
    
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    url: Mapped[str | None] = mapped_column(String(255), nullable=True)

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
    hotel: Mapped[str | None] = mapped_column(String(255), nullable=True)
    regimen: Mapped[str | None] = mapped_column(String(255), nullable=True)
    excursion: Mapped[str | None] = mapped_column(String(255), nullable=True)
    periodo: Mapped[str | None] = mapped_column(String(255), nullable=True)
    image: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)
    web: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True, default=True)


class PackagesDatesOfExit(Base):
    __tablename__ = "packages_dates_of_exit"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    package_id: Mapped[str] = mapped_column(String(36), nullable=False)
    salida_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    active: Mapped[bool] = mapped_column(BOOLEAN, nullable=False, default=True)


class Reservas(Base):
    __tablename__ = "reservas"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False)
    passenger_id: Mapped[str] = mapped_column(String(36), nullable=False)
    salida_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    codigo_reserva: Mapped[str | None] = mapped_column(String(255), nullable=True)
    client_id: Mapped[str | None] = mapped_column(String(36), nullable=True)  # FK → clients.id
    edad_categoria: Mapped[str | None] = mapped_column(String(63), nullable=True)
    lugar_carga_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    butaca: Mapped[str | None] = mapped_column(String(255), nullable=True)
    tipo_butaca: Mapped[str | None] = mapped_column(String(50), nullable=True)
    hotel_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    regimen_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    rooming_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    room_type: Mapped[str | None] = mapped_column(String(255), nullable=True)
    active: Mapped[bool | None] = mapped_column(BOOLEAN, nullable=True)


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