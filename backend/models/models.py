from sqlalchemy import BOOLEAN, INT, Column, String, Integer, SmallInteger
from db.database import Base

class iWebClient(Base):
    __tablename__ = "iweb_clients"

    id = Column(String(36), primary_key=True)
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

class Client(Base):
    __tablename__ = "clients"

    id = Column(String(36), primary_key=True)
    iweb_client_id = Column(String(36), nullable=False)
    name = Column(String(255))
    last_name = Column(String(255))
    dni = Column(Integer)
    birthday = Column(String(255))
    username = Column(String(255))
    hashed_password = Column(String(255))
    phone = Column(Integer)
    active = Column(SmallInteger)
    
    