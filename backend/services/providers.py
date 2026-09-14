"""Atomic catalog writes. No reservation or accounting side effects.

MySQL writes serialize on the tenant row before current (locking) catalog reads.
SQLite fixtures acquire the write lock first. Retired rows retain stable IDs;
changing the underlying identity of an existing block is forbidden.
"""
import re
import unicodedata

from fastapi import HTTPException
from sqlalchemy import inspect, or_, text
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import set_committed_value

from models.models import Destinos, Excursions, Hotels, Periods, Regimenes, iWebClient
from models.providers import Provider, ProviderDestination, ProviderService, ProviderRegimenCost, PROVIDER_TABLES
from schemas.providers import ProviderResponse


def normalize_destination(value):
    return ''.join(c for c in unicodedata.normalize('NFD', str(value or ''))
                   if not unicodedata.combining(c)).strip().lower()


def destination_aliases(destination):
    aliases = {destination.id, destination.name, getattr(destination, 'sigla', None)}
    return {
        normalize_destination(part)
        for alias in aliases
        for part in re.split(r'\s*[/,+]\s*', str(alias or ''))
        if normalize_destination(part)
    }


def catalog_belongs_to_destination(catalog_destination, destination):
    catalog_values = {
        normalize_destination(part)
        for part in re.split(r'\s*[/,+]\s*', str(catalog_destination or ''))
        if normalize_destination(part)
    }
    return bool(catalog_values & destination_aliases(destination))


def require_schema(db):
    inspector = inspect(db.connection())
    for table in PROVIDER_TABLES:
        if not inspector.has_table(table.name):
            raise HTTPException(503, 'Proveedores requiere la migración de catálogo')
        actual = {c['name'] for c in inspector.get_columns(table.name)}
        if not set(table.columns.keys()) <= actual:
            raise HTTPException(503, 'Esquema de proveedores incompleto')


def lock_tenant(db, tenant):
    if db.bind.dialect.name == 'sqlite':
        # sqlite3 does not BEGIN for SELECTs; auth may already have read the user.
        if not db.connection().connection.driver_connection.in_transaction:
            db.execute(text('BEGIN IMMEDIATE'))
    row = db.query(iWebClient).filter_by(id=tenant).with_for_update().first()
    if not row:
        raise HTTPException(404, 'Agencia no encontrada')


def provider_query(db, tenant):
    return db.query(Provider).filter_by(iweb_client_id=tenant).options(
        selectinload(Provider.destinations).selectinload(ProviderDestination.services)
        .selectinload(ProviderService.regimen_costs))


def get_provider(db, tenant, provider_id, *, lock=False):
    if lock:
        query = db.query(Provider).filter_by(iweb_client_id=tenant, id=provider_id).populate_existing().with_for_update()
    else:
        query = provider_query(db, tenant).filter_by(id=provider_id)
    row = query.first()
    if row is None:
        raise HTTPException(404, 'Proveedor no encontrado')
    if lock:
        # Auth may have opened a REPEATABLE READ snapshot before waiting for
        # the tenant lock. Every nested row must also use a current read.
        destinations = db.query(ProviderDestination).filter_by(provider_id=row.id).populate_existing().with_for_update().all()
        services = db.query(ProviderService).filter_by(provider_id=row.id).populate_existing().with_for_update().all()
        amounts = db.query(ProviderRegimenCost).filter(
            ProviderRegimenCost.service_id.in_([s.id for s in services])
        ).populate_existing().with_for_update().all()
        for service in services:
            set_committed_value(service, 'regimen_costs', [r for r in amounts if r.service_id == service.id])
        for destination in destinations:
            set_committed_value(destination, 'services', [s for s in services if s.destination_id == destination.id])
        set_committed_value(row, 'destinations', destinations)
    return row


def serialize(provider):
    return ProviderResponse.model_validate({
        'id': provider.id, 'iweb_client_id': provider.iweb_client_id,
        'name': provider.name, 'type': provider.type, 'active': provider.active, 'revision': provider.revision,
        'destinations': [
            {'id': d.id, 'destino_id': d.destino_id, 'services': [
                {'id': s.id, 'hotel_id': s.hotel_id, 'excursion_id': s.excursion_id,
                 'validity_type': s.validity_type, 'start_date': s.start_date, 'end_date': s.end_date,
                 'period_id': s.period_id, 'cost': s.cost,
                 'regimen_costs': [{'regimen_id': r.regimen_id, 'cost': r.cost}
                                   for r in s.regimen_costs if r.active]}
                for s in sorted(d.services, key=lambda row: row.position) if s.active]}
            for d in sorted(provider.destinations, key=lambda row: row.position) if d.active]})


def list_providers(db, tenant, page, page_size, search):
    query = provider_query(db, tenant).filter_by(active=True)
    if search:
        query = query.filter(Provider.name.contains(search, autoescape=True))
    total = query.count()
    items = query.order_by(Provider.name, Provider.id).offset((page - 1) * page_size).limit(page_size).all()
    return {'items': [serialize(p) for p in items], 'total': total, 'page': page, 'page_size': page_size}


def catalog_rows(db, model, tenant, ids):
    if not ids:
        return {}
    rows = db.query(model).filter(model.iweb_client_id == tenant, model.id.in_(ids)).with_for_update().all()
    if {r.id for r in rows} != ids:
        raise HTTPException(422, 'Referencia de catálogo inexistente o ajena a la agencia')
    return {r.id: r for r in rows}


def validate_references(db, tenant, body):
    services = [s for d in body.destinations for s in d.services]
    destinations = catalog_rows(db, Destinos, tenant, {d.destino_id for d in body.destinations})
    catalog_rows(db, Periods, tenant, {s.period_id for s in services if s.period_id})
    catalog_rows(db, Regimenes, tenant, {r.regimen_id for s in services for r in s.regimen_costs})
    hotels = catalog_rows(db, Hotels, tenant, {s.hotel_id for s in services if s.hotel_id})
    excursions = catalog_rows(db, Excursions, tenant, {s.excursion_id for s in services if s.excursion_id})
    for destination in body.destinations:
        for service in destination.services:
            catalog = hotels[service.hotel_id] if service.hotel_id else excursions[service.excursion_id]
            if not catalog_belongs_to_destination(catalog.destino, destinations[destination.destino_id]):
                raise HTTPException(422, 'El hotel o excursión no pertenece al destino seleccionado')


def overlaps(left, right):
    if left.validity_type != right.validity_type:
        # Periods have no date bounds. Mixed validity policy must be decided
        # before consumption resolution; never invent calendar bounds from names.
        return False
    if left.validity_type == 'period':
        return left.period_id == right.period_id
    return left.start_date <= right.end_date and right.start_date <= left.end_date


def validate_overlap(db, tenant, body, provider_id):
    services = [s for d in body.destinations for s in d.services]
    hotel_ids = [s.hotel_id for s in services if s.hotel_id]
    excursion_ids = [s.excursion_id for s in services if s.excursion_id]
    existing = db.query(ProviderService).join(Provider, Provider.id == ProviderService.provider_id).filter(
        Provider.iweb_client_id == tenant, Provider.active.is_(True), ProviderService.active.is_(True),
        Provider.id != provider_id,
        or_(ProviderService.hotel_id.in_(hotel_ids), ProviderService.excursion_id.in_(excursion_ids)),
    ).populate_existing().with_for_update().all()
    by_identity = {(s.hotel_id, s.excursion_id): s for s in services}
    for other in existing:
        if overlaps(by_identity[(other.hotel_id, other.excursion_id)], other):
            raise HTTPException(409, 'El servicio ya tiene un proveedor activo en esa vigencia')


def check_revision(provider, revision):
    if provider.revision != revision or not provider.active:
        raise HTTPException(409, 'El proveedor cambió o fue dado de baja; recargá los datos')


def replace_catalog(db, provider, body):
    destinations = {d.destino_id: d for d in provider.destinations}
    services = {(s.hotel_id, s.excursion_id): s for d in provider.destinations for s in d.services}
    for d in provider.destinations:
        d.active = False
        for s in d.services:
            s.active = False
    for position, block in enumerate(body.destinations):
        destination = destinations.get(block.destino_id)
        if block.id and (destination is None or destination.id != block.id):
            raise HTTPException(422, 'ID de destino ajeno o identidad modificada')
        if destination is None:
            destination = ProviderDestination(destino_id=block.destino_id, position=position)
            provider.destinations.append(destination)
        destination.active, destination.position = True, position
        db.flush()
        for service_position, item in enumerate(block.services):
            service = services.get((item.hotel_id, item.excursion_id))
            if item.id and (service is None or service.id != item.id):
                raise HTTPException(422, 'ID de servicio ajeno o identidad modificada')
            if service is not None and service.destination_id != destination.id:
                raise HTTPException(422, 'No se puede trasladar la identidad de un servicio a otro destino')
            if service is None:
                service = ProviderService(provider_id=provider.id, hotel_id=item.hotel_id, excursion_id=item.excursion_id)
                destination.services.append(service)
            service.active, service.position = True, service_position
            for field in ('validity_type', 'start_date', 'end_date', 'period_id', 'cost'):
                setattr(service, field, getattr(item, field))
            amounts = {r.regimen_id: r for r in service.regimen_costs}
            for amount in amounts.values():
                amount.active = False
            for rate in item.regimen_costs:
                amount = amounts.get(rate.regimen_id)
                if amount is None:
                    amount = ProviderRegimenCost(regimen_id=rate.regimen_id)
                    service.regimen_costs.append(amount)
                amount.cost, amount.active = rate.cost, True
    provider.name = body.name
    db.flush()


def save_provider(db, tenant, body, provider_id=None):
    lock_tenant(db, tenant)
    provider = get_provider(db, tenant, provider_id, lock=True) if provider_id else None
    if provider:
        check_revision(provider, body.revision)
        if provider.type != body.type:
            raise HTTPException(422, 'El tipo de un proveedor existente no puede cambiar')
    elif any(d.id or any(s.id for s in d.services) for d in body.destinations):
        raise HTTPException(422, 'El alta no admite IDs de bloques existentes')
    validate_references(db, tenant, body)
    validate_overlap(db, tenant, body, provider_id or '')
    if provider is None:
        provider = Provider(iweb_client_id=tenant, name=body.name, type=body.type)
        db.add(provider)
        db.flush()
    else:
        provider.revision += 1
    replace_catalog(db, provider, body)
    return serialize(provider)


def delete_provider(db, tenant, provider_id, revision):
    lock_tenant(db, tenant)
    provider = get_provider(db, tenant, provider_id, lock=True)
    check_revision(provider, revision)
    provider.active = False
    provider.revision += 1
    db.flush()
    return serialize(provider)
