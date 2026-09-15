"""Provider catalog HTTP tests; fixtures only, never the configured database."""
import unittest
from copy import deepcopy
from uuid import uuid4

from fastapi import FastAPI
from verification.providers_http_client import LocalClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from auth.login import create_access_token
from db.database import Base, get_db
from models.models import Destinos, Hotels, Excursions, Periods, Regimenes, User, iWebClient


class ProvidersTests(unittest.TestCase):
    def setUp(self):
        from migrations.providers import migrate
        from routers.providers import router
        self.engine = create_engine('sqlite://', connect_args={'check_same_thread': False}, poolclass=StaticPool)
        self.addCleanup(self.engine.dispose)
        catalogs = [iWebClient, User, Destinos, Hotels, Excursions, Periods, Regimenes]
        Base.metadata.create_all(self.engine, tables=[m.__table__ for m in catalogs])
        migrate(self.engine, apply=True)
        self.tenant, self.other, self.user = [str(uuid4()) for _ in range(3)]
        self.destinations = [str(uuid4()) for _ in range(2)]
        self.hotels = [str(uuid4()) for _ in range(4)]
        self.period, self.regimen, self.excursion = [str(uuid4()) for _ in range(3)]
        with Session(self.engine) as db:
            db.add_all([iWebClient(id=t, folder_id=i, slug=t) for i, t in enumerate([self.tenant, self.other])])
            db.add(User(id=self.user, username='fixture', active=1, rol='admin', iweb_client_id=self.tenant))
            db.add_all([Destinos(id=d, iweb_client_id=self.tenant) for d in self.destinations])
            db.add_all([Hotels(id=h, destino=self.destinations[i // 2], iweb_client_id=self.tenant) for i, h in enumerate(self.hotels)])
            db.add(Periods(id=self.period, iweb_client_id=self.tenant))
            db.add(Regimenes(id=self.regimen, iweb_client_id=self.tenant))
            db.add(Excursions(id=self.excursion, destino=self.destinations[0], iweb_client_id=self.tenant))
            db.commit()
        app = FastAPI()
        app.include_router(router)
        def fixture_db():
            with Session(self.engine) as db:
                yield db
        app.dependency_overrides[get_db] = fixture_db
        self.client = LocalClient(app)
        self.addCleanup(self.client.close)
        self.client.headers['Authorization'] = 'Bearer ' + create_access_token({'sub': self.user})
        self.url = '/parameters/providers'
        self.params = {'iweb_client_id': self.tenant}
        self.body = {'name': 'Proveedor', 'type': 'hotel', 'destinations': [
            {'destino_id': d, 'services': [self.service(h) for h in self.hotels[i*2:i*2+2]]}
            for i, d in enumerate(self.destinations)]}

    def service(self, hotel):
        return {'hotel_id': hotel, 'validity_type': 'dates', 'start_date': '2026-09-01',
                'end_date': '2026-09-30', 'regimen_costs': [{'regimen_id': self.regimen, 'cost': '300.50'}]}

    def create(self, body=None, expected=201):
        response = self.client.post(self.url, params=self.params, json=body or self.body)
        self.assertEqual(response.status_code, expected, response.text)
        return response.json()

    def editable(self, response):
        return {k: response[k] for k in ('name', 'type', 'destinations', 'revision')}

    def test_crud_preserves_ids_and_soft_deletes(self):
        from models.providers import ProviderService
        created = self.create()
        url = self.url + '/' + created['id']
        body = self.editable(created)
        body['name'] = 'Editado'
        body['destinations'][0]['services'][0]['regimen_costs'][0]['cost'] = None
        removed = body['destinations'][1]['services'].pop()
        result = self.client.put(url, params=self.params, json=body)
        self.assertEqual(result.status_code, 200, result.text)
        edited = result.json()
        self.assertEqual(edited['revision'], created['revision'] + 1)
        self.assertEqual(edited['destinations'][0]['services'][0]['id'], created['destinations'][0]['services'][0]['id'])
        self.assertEqual(self.client.get(url, params=self.params).json(), edited)
        self.assertEqual(self.client.put(url, params=self.params, json=body).status_code, 409)
        with Session(self.engine) as db:
            self.assertFalse(db.get(ProviderService, removed['id']).active)
            self.assertEqual(db.query(ProviderService).count(), 4)
        response = self.client.delete(url, params={**self.params, 'revision': edited['revision']})
        self.assertEqual(response.status_code, 200, response.text)
        self.assertFalse(response.json()['active'])
        self.assertEqual(self.client.get(self.url, params=self.params).json()['total'], 0)
        self.create()

    def test_auth_tenant_and_missing_provider(self):
        created = self.create()
        self.assertEqual(self.client.get(self.url, params={'iweb_client_id': self.other}).status_code, 403)
        self.assertEqual(self.client.get(self.url + '/' + str(uuid4()), params=self.params).status_code, 404)
        self.client.headers.pop('Authorization')
        self.assertEqual(self.client.get(self.url, params=self.params).status_code, 401)

    def test_duplicate_and_wrong_destination_are_atomic(self):
        body = deepcopy(self.body)
        body['destinations'][1]['services'][0]['hotel_id'] = self.hotels[0]
        self.create(body, 422)
        body = deepcopy(self.body)
        body['destinations'][0]['services'][0]['hotel_id'] = self.hotels[2]
        self.create(body, 422)
        self.assertEqual(self.client.get(self.url, params=self.params).json()['total'], 0)

    def test_service_destination_accepts_catalog_name_alias(self):
        body = deepcopy(self.body)
        body['destinations'] = [body['destinations'][0]]
        body['destinations'][0]['services'] = [body['destinations'][0]['services'][0]]
        with Session(self.engine) as db:
            db.get(Destinos, self.destinations[0]).name = 'Bariloche'
            db.get(Hotels, self.hotels[0]).destino = 'Bariloche'
            db.commit()
        self.create(body)

    def test_same_service_can_have_multiple_active_providers(self):
        self.create()
        second = deepcopy(self.body)
        second['name'] = 'Segundo proveedor'
        self.create(second)

    def test_receptivo_period_nullable_cost_allows_multiple_providers(self):
        body = {'name': 'Receptivo', 'type': 'receptivo', 'destinations': [
            {'destino_id': self.destinations[0], 'services': [
                {'excursion_id': self.excursion, 'validity_type': 'period', 'period_id': self.period, 'cost': None}]}]}
        self.create(body)
        self.create(body, 201)
        body['destinations'][0]['services'][0]['start_date'] = '2026-01-01'
        self.create(body, 422)

    def test_migration_default_is_dry_run_and_repeatable(self):
        from migrations.providers import migrate
        engine = create_engine('sqlite://')
        self.addCleanup(engine.dispose)
        migrate(engine)
        self.assertEqual(inspect(engine).get_table_names(), [])
        migrate(engine, apply=True)
        before = inspect(engine).get_table_names()
        migrate(engine, apply=True)
        self.assertEqual(inspect(engine).get_table_names(), before)


if __name__ == '__main__':
    unittest.main()
