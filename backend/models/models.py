from datetime import date, datetime

from sqlalchemy import BOOLEAN, INT, Date, DateTime, Integer, SmallInteger, String
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


class ClientsType(Base):
    __tablename__ = "clients_type"

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
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
