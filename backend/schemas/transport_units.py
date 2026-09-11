from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

Price = Annotated[Decimal, Field(ge=0, max_digits=15, decimal_places=2)]
Identifier = Annotated[str, Field(min_length=1, max_length=36)]


class TransportUnitCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    transport_company: Identifier
    price: Price
    type_bus: Identifier | None = None
    coordinador_nombre: str | None = Field(default=None, max_length=255)
    coordinador_telefono: str | None = Field(default=None, max_length=50)


class TransportUnitUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    transport_company: Identifier | None = None
    price: Price | None = None
    type_bus: Identifier | None = None
    coordinador_nombre: str | None = Field(default=None, max_length=255)
    coordinador_telefono: str | None = Field(default=None, max_length=50)


class TransportUnitResponse(TransportUnitCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    salida_id: str
    number: int
    semicama: int
    cama: int
    layout_snapshot: dict
    active: bool
    revision: int


class SeatAssignment(BaseModel):
    model_config = ConfigDict(extra="forbid")
    reservation_passenger_id: Identifier
    butaca_number: int | None = Field(default=None, ge=1, strict=True)


class SeatAssignments(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: int = Field(ge=0)
    assignments: list[SeatAssignment] = Field(max_length=500)
