"""Parameters catalog only. Stable identities survive edits and logical removal."""
from datetime import date
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Boolean, CheckConstraint, Date, ForeignKey, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from db.database import Base


def identifier():
    return str(uuid4())


class Provider(Base):
    __tablename__ = 'providers'
    __table_args__ = (CheckConstraint("type IN ('hotel', 'receptivo')", name='ck_provider_type'),
                      {'mysql_engine': 'InnoDB'})
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(16), nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default='1')
    revision: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default='1')
    destinations: Mapped[list['ProviderDestination']] = relationship(order_by='ProviderDestination.position')


class ProviderDestination(Base):
    __tablename__ = 'provider_destinations'
    __table_args__ = (UniqueConstraint('provider_id', 'destino_id', name='uq_provider_destination'),
                      {'mysql_engine': 'InnoDB'})
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    provider_id: Mapped[str] = mapped_column(ForeignKey('providers.id'), nullable=False)
    destino_id: Mapped[str] = mapped_column(String(36), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default='1')
    services: Mapped[list['ProviderService']] = relationship(order_by='ProviderService.position')


class ProviderService(Base):
    __tablename__ = 'provider_services'
    __table_args__ = (
        UniqueConstraint('provider_id', 'hotel_id', name='uq_provider_hotel'),
        UniqueConstraint('provider_id', 'excursion_id', name='uq_provider_excursion'),
        CheckConstraint('(hotel_id IS NOT NULL AND excursion_id IS NULL) OR '
                        '(hotel_id IS NULL AND excursion_id IS NOT NULL)', name='ck_provider_service_kind'),
        CheckConstraint("(validity_type = 'dates' AND start_date IS NOT NULL AND end_date IS NOT NULL "
                        "AND start_date <= end_date AND period_id IS NULL) OR "
                        "(validity_type = 'period' AND period_id IS NOT NULL AND start_date IS NULL "
                        "AND end_date IS NULL)", name='ck_provider_validity'),
        CheckConstraint('cost IS NULL OR (cost >= 0 AND hotel_id IS NULL)', name='ck_provider_cost'),
        {'mysql_engine': 'InnoDB'},
    )
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    provider_id: Mapped[str] = mapped_column(ForeignKey('providers.id'), nullable=False)
    destination_id: Mapped[str] = mapped_column(ForeignKey('provider_destinations.id'), nullable=False)
    hotel_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    excursion_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default='1')
    validity_type: Mapped[str] = mapped_column(String(16), nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    period_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    cost: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    regimen_costs: Mapped[list['ProviderRegimenCost']] = relationship(order_by='ProviderRegimenCost.regimen_id')


class ProviderRegimenCost(Base):
    __tablename__ = 'provider_regimen_costs'
    __table_args__ = (UniqueConstraint('service_id', 'regimen_id', name='uq_provider_regimen'),
                      CheckConstraint('cost IS NULL OR cost >= 0', name='ck_provider_regimen_cost'),
                      {'mysql_engine': 'InnoDB'})
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    service_id: Mapped[str] = mapped_column(ForeignKey('provider_services.id'), nullable=False)
    regimen_id: Mapped[str] = mapped_column(String(36), nullable=False)
    cost: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default='1')


PROVIDER_TABLES = [model.__table__ for model in
                   (Provider, ProviderDestination, ProviderService, ProviderRegimenCost)]
