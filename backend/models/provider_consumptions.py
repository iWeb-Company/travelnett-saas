"""Historical provider-consumption records created from new reservations.

These tables are snapshots and audit records. They must never be rebuilt from
the current provider catalog, because catalog edits do not change past costs.
"""
from datetime import date, datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from db.database import Base


def identifier():
    return str(uuid4())


class ReservationProviderEvaluation(Base):
    __tablename__ = "reservation_provider_evaluations"
    __table_args__ = (
        UniqueConstraint("iweb_client_id", "reserva_id", name="uq_provider_evaluation_reservation"),
        {"mysql_engine": "InnoDB"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    reserva_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    evaluated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="evaluated")


class ReservationProviderServiceSnapshot(Base):
    __tablename__ = "reservation_provider_service_snapshots"
    __table_args__ = (
        UniqueConstraint("iweb_client_id", "reserva_id", "provider_service_id", name="uq_provider_snapshot_service"),
        {"mysql_engine": "InnoDB"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    reserva_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    provider_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    provider_service_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    package_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    salida_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    hotel_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    excursion_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    regimen_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    hotel_fecha_in: Mapped[str | None] = mapped_column(String(50), nullable=True)
    validity_type: Mapped[str] = mapped_column(String(16), nullable=False)
    period_id: Mapped[str | None] = mapped_column(String(36), nullable=True)
    unit_cost: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="ARS", server_default="ARS")
    evaluated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")


class ProviderConsumptionGroup(Base):
    __tablename__ = "provider_consumption_groups"
    __table_args__ = (
        UniqueConstraint("iweb_client_id", "group_key", name="uq_provider_consumption_group_key"),
        {"mysql_engine": "InnoDB"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    provider_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    provider_service_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    salida_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    hotel_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    excursion_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    regimen_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    hotel_fecha_in: Mapped[str | None] = mapped_column(String(50), nullable=True)
    group_key: Mapped[str] = mapped_column(String(255), nullable=False)
    detail: Mapped[str] = mapped_column(String(510), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=0, server_default="0")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    created_at: Mapped[date | None] = mapped_column(Date, nullable=True)


class ProviderConsumptionContribution(Base):
    __tablename__ = "provider_consumption_contributions"
    __table_args__ = (
        UniqueConstraint("iweb_client_id", "source_key", name="uq_provider_contribution_source"),
        {"mysql_engine": "InnoDB"},
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=identifier)
    iweb_client_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    group_id: Mapped[str] = mapped_column(ForeignKey("provider_consumption_groups.id"), nullable=False, index=True)
    snapshot_id: Mapped[str] = mapped_column(ForeignKey("reservation_provider_service_snapshots.id"), nullable=False, index=True)
    reserva_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    reservation_passenger_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    source_key: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1, server_default="1")
    amount: Mapped[Decimal] = mapped_column(Numeric(15, 2), nullable=False, default=0, server_default="0")
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="1")
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, default=datetime.utcnow)


PROVIDER_CONSUMPTION_TABLES = [model.__table__ for model in (
    ReservationProviderEvaluation,
    ReservationProviderServiceSnapshot,
    ProviderConsumptionGroup,
    ProviderConsumptionContribution,
)]
