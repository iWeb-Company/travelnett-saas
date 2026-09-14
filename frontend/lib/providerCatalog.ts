export interface CatalogOption { id: string; name: string; sigla?: string; destino?: string }
export interface ProviderService {
  id?: string;
  hotel_id?: string | null;
  excursion_id?: string | null;
  validity_type: 'dates' | 'period';
  start_date?: string | null;
  end_date?: string | null;
  period_id?: string | null;
  cost?: string | number | null;
  regimen_costs: { regimen_id: string; cost: string | number | null }[];
}
export interface ProviderDestination { id?: string; destino_id: string; services: ProviderService[] }
export interface ProviderInput { name: string; type: 'hotel' | 'receptivo'; destinations: ProviderDestination[]; revision?: number }
export interface Provider extends ProviderInput { id: string; revision: number; active: boolean; iweb_client_id: string }
export interface ProviderPage { items: Provider[]; total: number; page: number; page_size: number }

export const emptyService = (): ProviderService => ({ hotel_id: '', excursion_id: '', validity_type: 'dates', start_date: '', end_date: '', period_id: '', cost: '', regimen_costs: [] });
export const emptyDestination = (): ProviderDestination => ({ destino_id: '', services: [emptyService()] });
export const emptyProvider = (): ProviderInput => ({ name: '', type: 'hotel', destinations: [emptyDestination()] });
export const providerDraft = (provider: Provider): ProviderInput => ({ name: provider.name, type: provider.type, revision: provider.revision, destinations: structuredClone(provider.destinations) });

export const providerForDestination = (draft: ProviderInput, destino_id: string): ProviderInput => ({
  ...draft,
  destinations: [{ destino_id, services: [emptyService()] }],
});

/** Catalog entries can reference a destination by id, name or sigla. */
export const catalogBelongsToDestination = (option: CatalogOption, destinoId: string, destinos: CatalogOption[]): boolean => {
  const normalize = (value: unknown) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const aliases = (value: unknown) => {
    const normalized = normalize(value);
    const destination = destinos.find(item => [item.id, item.name, item.sigla].some(candidate => normalize(candidate) === normalized));
    return new Set([value, destination?.id, destination?.name, destination?.sigla].flatMap(item => normalize(item).split(/\s*[/,+]\s*/)).filter(Boolean));
  };
  const selected = aliases(destinoId);
  return Boolean(destinoId) && [...aliases(option.destino)].some(alias => selected.has(alias));
};

function amount(value: string | number | null | undefined): string | null {
  if (value == null || String(value).trim() === '') return null;
  const normalized = String(value).trim().replace(',', '.');
  if (!/^\d{1,13}(\.\d{1,2})?$/.test(normalized)) throw new Error('El costo debe ser positivo o cero, con hasta dos decimales.');
  return normalized;
}

// Only catalogue data crosses this boundary; never reservation or ledger values.
export function providerPayload(draft: ProviderInput): ProviderInput {
  if (!draft.name.trim()) throw new Error('Ingresá el nombre del proveedor.');
  if (!draft.destinations.length) throw new Error('Agregá un destino.');
  const destinations = new Set<string>();
  const services = new Set<string>();
  return { name: draft.name.trim(), type: draft.type, ...(draft.revision == null ? {} : { revision: draft.revision }), destinations: draft.destinations.map(destination => {
    if (!destination.destino_id || destinations.has(destination.destino_id)) throw new Error('Seleccioná destinos distintos.');
    destinations.add(destination.destino_id);
    if (!destination.services.length) throw new Error('Agregá un servicio al destino.');
    return { ...(destination.id ? { id: destination.id } : {}), destino_id: destination.destino_id, services: destination.services.map(service => {
      const serviceId = draft.type === 'hotel' ? service.hotel_id : service.excursion_id;
      if (!serviceId || services.has(serviceId)) throw new Error('Seleccioná hoteles o excursiones distintos.');
      services.add(serviceId);
      const period = Boolean(service.period_id);
      if (!period && (!service.start_date || !service.end_date || service.start_date > service.end_date)) throw new Error('Seleccioná un rango de fechas válido o un período.');
      return { ...(service.id ? { id: service.id } : {}),
        hotel_id: draft.type === 'hotel' ? serviceId : null,
        excursion_id: draft.type === 'receptivo' ? serviceId : null,
        validity_type: period ? 'period' : 'dates',
        period_id: period ? service.period_id : null,
        start_date: period ? null : service.start_date,
        end_date: period ? null : service.end_date,
        cost: draft.type === 'receptivo' ? amount(service.cost) : null,
        regimen_costs: draft.type === 'hotel' ? service.regimen_costs.map(row => ({ regimen_id: row.regimen_id, cost: amount(row.cost) })) : [],
      };
    }) };
  }) };
}
