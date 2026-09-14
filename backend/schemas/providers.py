"""PUT replaces the active catalog; omitted rows are retired, never deleted.

Money is ARS, per passenger, nullable. POST is not safe to retry blindly.
Periods have no dates; the mixed validity policy is a separate domain decision.
"""
from datetime import date
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, model_validator


def uuid_string(value: str) -> str:
    return str(UUID(value))


Identifier = Annotated[str, AfterValidator(uuid_string)]
Price = Annotated[Decimal, Field(ge=0, max_digits=15, decimal_places=2, allow_inf_nan=False)]


class CatalogInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)


class RegimenCost(CatalogInput):
    regimen_id: Identifier
    cost: Price | None = None


class ServiceInput(CatalogInput):
    id: Identifier | None = None
    hotel_id: Identifier | None = None
    excursion_id: Identifier | None = None
    validity_type: Literal['dates', 'period']
    start_date: date | None = None
    end_date: date | None = None
    period_id: Identifier | None = None
    cost: Price | None = None
    regimen_costs: list[RegimenCost] = Field(default_factory=list, max_length=100)

    @model_validator(mode='after')
    def validate_service(self):
        if bool(self.hotel_id) == bool(self.excursion_id):
            raise ValueError('Seleccioná un hotel o una excursión, exclusivamente')
        if self.hotel_id and self.cost is not None:
            raise ValueError('Hotel requiere costos por régimen')
        if self.excursion_id and self.regimen_costs:
            raise ValueError('Receptivo no admite costos por régimen')
        if self.validity_type == 'dates':
            if not self.start_date or not self.end_date or self.period_id or self.start_date > self.end_date:
                raise ValueError('Seleccioná un rango válido sin período')
        elif not self.period_id or self.start_date or self.end_date:
            raise ValueError('Seleccioná un período sin rango de fechas')
        if len({r.regimen_id for r in self.regimen_costs}) != len(self.regimen_costs):
            raise ValueError('Régimen duplicado')
        return self


class DestinationInput(CatalogInput):
    id: Identifier | None = None
    destino_id: Identifier
    services: list[ServiceInput] = Field(min_length=1, max_length=100)


class ProviderCreate(CatalogInput):
    name: str = Field(min_length=1, max_length=255)
    type: Literal['hotel', 'receptivo']
    destinations: list[DestinationInput] = Field(min_length=1, max_length=50)

    @model_validator(mode='after')
    def validate_catalog(self):
        if len({d.destino_id for d in self.destinations}) != len(self.destinations):
            raise ValueError('Destino duplicado')
        services = [s for d in self.destinations for s in d.services]
        if len(services) > 500:
            raise ValueError('Máximo 500 servicios por proveedor')
        if any(bool(s.hotel_id) != (self.type == 'hotel') for s in services):
            raise ValueError('El servicio no corresponde al tipo de proveedor')
        if len({s.hotel_id or s.excursion_id for s in services}) != len(services):
            raise ValueError('Cada hotel o excursión se carga una sola vez por proveedor')
        ids = [s.id for s in services if s.id]
        destination_ids = [d.id for d in self.destinations if d.id]
        if len(ids) != len(set(ids)) or len(destination_ids) != len(set(destination_ids)):
            raise ValueError('ID de bloque duplicado')
        return self


class ProviderUpdate(ProviderCreate):
    revision: int = Field(ge=1, strict=True)


class ServiceResponse(ServiceInput):
    id: Identifier


class DestinationResponse(DestinationInput):
    id: Identifier
    services: list[ServiceResponse]


class ProviderResponse(ProviderCreate):
    id: Identifier
    iweb_client_id: str
    active: bool
    revision: int
    destinations: list[DestinationResponse]


class ProviderPage(BaseModel):
    items: list[ProviderResponse]
    total: int
    page: int
    page_size: int
