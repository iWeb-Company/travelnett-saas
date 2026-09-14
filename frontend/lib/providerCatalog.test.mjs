import { test } from 'node:test';
import assert from 'node:assert/strict';
import { catalogBelongsToDestination, emptyDestination, emptyProvider, providerPayload, providerDraft } from './providerCatalog.ts';

test('catalog requires a name, service and validity', () => {
  assert.throws(() => providerPayload(emptyProvider()), /nombre/i);
});
test('hotel regime amounts preserve missing vs zero and service IDs', () => {
  const draft = emptyProvider();
  draft.name = 'Proveedor';
  draft.destinations[0].destino_id = 'destination';
  Object.assign(draft.destinations[0].services[0], { id: 'service', hotel_id: 'hotel', period_id: 'period', regimen_costs: [{ regimen_id: 'map', cost: '' }, { regimen_id: 'all', cost: '0' }] });
  const body = providerPayload(draft);
  assert.equal(body.destinations[0].services[0].id, 'service');
  assert.deepEqual(body.destinations[0].services[0].regimen_costs.map(r => r.cost), [null, '0']);
  assert.equal(body.destinations[0].services[0].validity_type, 'period');
  assert.deepEqual(providerPayload(providerDraft({ ...body, id: 'provider', active: true, revision: 2, iweb_client_id: 'tenant' })).revision, 2);
});
test('receptivo rejects malformed money and reversed dates', () => {
  const draft = emptyProvider();
  draft.type = 'receptivo'; draft.name = 'Receptivo';
  draft.destinations[0].destino_id = 'destination';
  const service = draft.destinations[0].services[0];
  Object.assign(service, { excursion_id: 'excursion', start_date: '2026-09-20', end_date: '2026-09-10', cost: '100' });
  assert.throws(() => providerPayload(draft), /rango/i);
  service.end_date = '2026-09-25'; service.cost = '-1';
  assert.throws(() => providerPayload(draft), /costo/i);
  service.cost = '123,50';
  assert.equal(providerPayload(draft).destinations[0].services[0].cost, '123.50');
});
test('catalog service options include every hotel referenced by the selected destination', () => {
  const destinations = [{ id: 'bariloche', name: 'Bariloche', sigla: 'BRC' }];
  assert.equal(catalogBelongsToDestination({ id: 'hotel-1', name: 'Hotel Atlantico', destino: 'bariloche' }, 'bariloche', destinations), true);
  assert.equal(catalogBelongsToDestination({ id: 'hotel-2', name: 'Hotel Centro', destino: 'BRC' }, 'bariloche', destinations), true);
  assert.equal(catalogBelongsToDestination({ id: 'hotel-3', name: 'Hotel Salta', destino: 'salta' }, 'bariloche', destinations), false);
});
test('provider payload keeps independent services for multiple destinations', () => {
  const draft = emptyProvider();
  draft.name = 'Proveedor multi destino';
  draft.destinations[0].destino_id = 'bariloche';
  Object.assign(draft.destinations[0].services[0], { hotel_id: 'hotel-1', start_date: '2026-09-01', end_date: '2026-09-10' });
  const salta = emptyDestination();
  salta.destino_id = 'salta';
  Object.assign(salta.services[0], { hotel_id: 'hotel-2', start_date: '2026-10-01', end_date: '2026-10-10' });
  draft.destinations.push(salta);
  const body = providerPayload(draft);
  assert.deepEqual(body.destinations.map(destination => destination.destino_id), ['bariloche', 'salta']);
  assert.deepEqual(body.destinations.map(destination => destination.services[0].hotel_id), ['hotel-1', 'hotel-2']);
});
