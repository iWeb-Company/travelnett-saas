from sqlalchemy import BOOLEAN, INT, Column, String, Integer, SmallInteger
from sqlalchemy.orm import Mapped, mapped_column
from db.database import Base
from sqlalchemy import Date
from sqlalchemy import DateTime

# Models for auth

class iWebClient(Base):
    __tablename__ = "iweb_clients"

    id = Column(String(36), primary_key=True)
    folder_id: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    name = Column(String(255))
    cuit = Column(INT)
    email = Column(String(255))
    status = Column(BOOLEAN)
    logo_xl = Column(String(255))
    logo_s = Column(String(255))

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True)
    name = Column(String(255))
    dni = Column(Integer)
    birthday = Column(String(255))
    last_name = Column(String(255))
    username = Column(String(255))
    hashed_password = Column(String(255))
    phone = Column(Integer)
    active = Column(SmallInteger)
    iweb_client_id = Column(String(36), nullable=False)

# Models for parameters

class TransportCompany(Base):
    __tablename__ = "transport_companies"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    airplane = Column(BOOLEAN)
    bus = Column(BOOLEAN)
    name = Column(String(255))
    cuit = Column(INT)
    web = Column(String(255))
    phone = Column(Integer)
    
class Hotels(Base):
    __tablename__ = "hotels"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name = Column(String(255))
    phone = Column(Integer)
    address = Column(String(255))
    web = Column(String(255))
    
class Excursions(Base):
    __tablename__ = "excursions"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name = Column(String(255))
    description = Column(String(255))
    
class Periods(Base):
    __tablename__ = "periods"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name = Column(String(255))
    main_image = Column(String(255))
    
class Destinos(Base):
    __tablename__ = "destinos"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name = Column(String(255))
    sigla = Column(String(255))
    
class LugaresCarga(Base):
    __tablename__ = "lugares_carga"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name = Column(String(255))
    
class ClientsType(Base):
    __tablename__ = "clients_type"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name = Column(String(255))
    adminForSellers = Column(BOOLEAN)
    
class Clients(Base):
    __tablename__ = "clients"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name_system = Column(String(255))
    complete_name = Column(String(255))
    client_type_id = Column(String(36))
    parent_client_id = Column(String(36))
    dni = Column(Integer)
    birthday = Column(Date)
    email = Column(String(255))
    phone = Column(Integer)
    payment_method = Column(String(255))
    commission = Column(Integer)
    hashed_password = Column(String(255))
    created_at = Column(DateTime)
    
class Regimenes(Base):
    __tablename__ = "regimenes"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name = Column(String(255))
    sigla = Column(String(255))
    description = Column(String(255))
    
class Passengers(Base):
    __tablename__ = "passengers"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name = Column(String(255))
    last_name = Column(String(255))
    dni = Column(Integer)
    date_of_birth = Column(Date)
    sex = Column(String(255))
    phone = Column(Integer)

class BusTypes(Base):
    __tablename__ = "bus_types"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name = Column(String(255))
    semicama_quantity = Column(Integer)
    cama_quantity = Column(Integer)
    panoramicos_quantity = Column(Integer)
    description = Column(String(255))