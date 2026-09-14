"use client";

import { useEffect, useState } from 'react';
import DateRangePicker, { formatDateRangeParam } from '@/app/components/DateRangePicker';
import AddVioleta from '@/app/components/icons/AddVioleta';
import { catalogBelongsToDestination, emptyDestination, emptyService, type CatalogOption, type ProviderDestination, type ProviderInput, type ProviderService } from '@/lib/providerCatalog';

const inputClass = 'w-full border-gray-300 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium shadow-sm focus:outline-none';
const selectClass = 'w-full border-gray-300 bg-white rounded-sm p-2 text-black/60 font-medium shadow-sm focus:outline-none';
const date = (value?: string | null) => value ? new Date(`${value}T12:00:00`) : null;

type ProviderCatalogs = {
  destinos: CatalogOption[];
  hotels: CatalogOption[];
  excursions: CatalogOption[];
  periods: CatalogOption[];
  regimenes: CatalogOption[];
};

export default function ProviderForm({ value, onChange, onSubmit, busy, catalogs }: {
  value: ProviderInput;
  onChange: (value: ProviderInput) => void;
  onSubmit: () => void;
  busy: boolean;
  catalogs: ProviderCatalogs;
}) {
  const [activeDestinationIndex, setActiveDestinationIndex] = useState(0);
  const destinations = value.destinations.length ? value.destinations : [emptyDestination()];
  const destination = destinations[activeDestinationIndex] || destinations[0];

  useEffect(() => {
    setActiveDestinationIndex(index => Math.min(index, Math.max(0, destinations.length - 1)));
  }, [destinations.length]);

  const replaceDestination = (patch: Partial<ProviderDestination>) => {
    onChange({
      ...value,
      destinations: destinations.map((current, index) => index === activeDestinationIndex ? { ...current, ...patch } : current),
    });
  };

  const changeService = (serviceIndex: number, patch: Partial<ProviderService>) => {
    replaceDestination({
      services: destination.services.map((service, index) => index !== serviceIndex ? service : { ...service, ...patch }),
    });
  };

  const changeDestination = (destino_id: string) => {
    const existingIndex = destinations.findIndex((current, index) => index !== activeDestinationIndex && current.destino_id === destino_id);
    if (existingIndex >= 0) {
      if (!destination.destino_id) {
        onChange({ ...value, destinations: destinations.filter((_, index) => index !== activeDestinationIndex) });
        setActiveDestinationIndex(existingIndex > activeDestinationIndex ? existingIndex - 1 : existingIndex);
      } else {
        setActiveDestinationIndex(existingIndex);
      }
      return;
    }
    if (destination.destino_id === destino_id) return;

    if (!destination.destino_id) {
      replaceDestination({ destino_id, services: [emptyService()] });
      return;
    }

    onChange({ ...value, destinations: [...destinations, { ...emptyDestination(), destino_id }] });
    setActiveDestinationIndex(destinations.length);
  };

  const addDestination = () => {
    const emptyIndex = destinations.findIndex(current => !current.destino_id);
    if (emptyIndex >= 0) {
      setActiveDestinationIndex(emptyIndex);
      return;
    }
    onChange({ ...value, destinations: [...destinations, emptyDestination()] });
    setActiveDestinationIndex(destinations.length);
  };

  const addService = () => {
    if (!destination.destino_id) return;
    replaceDestination({ services: [...destination.services, emptyService()] });
  };

  const removeService = (serviceIndex: number) => {
    if (!window.confirm('Quitar este servicio del proveedor?')) return;
    replaceDestination({ services: destination.services.filter((_, index) => index !== serviceIndex) });
  };

  const selectedServices = new Set(
    destinations.flatMap(current => current.services)
      .map(service => value.type === 'hotel' ? service.hotel_id : service.excursion_id)
      .filter(Boolean),
  );

  return (
    <form id="provider-form" onSubmit={event => { event.preventDefault(); if (!busy) onSubmit(); }}>
      <fieldset disabled={busy} className="flex flex-col gap-4">
        <button type="button" disabled={value.revision != null} aria-label="Tipo de proveedor" onClick={() => {
          if (destinations.some(current => current.services.some(service => service.hotel_id || service.excursion_id)) && !window.confirm('Cambiar el tipo quitara los servicios del formulario. Continuar?')) return;
          setActiveDestinationIndex(0);
          onChange({ ...value, type: value.type === 'hotel' ? 'receptivo' : 'hotel', destinations: [emptyDestination()] });
        }} className="w-full text-start shadow-lg shadow-black/30 bg-white rounded-sm p-2 pr-4 text-black/90 font-medium focus:outline-none">
          {value.type === 'hotel' ? 'Hotel' : 'Receptivo'}
        </button>
        <input required maxLength={255} aria-label="Nombre del proveedor" type="text" value={value.name} onChange={event => onChange({ ...value, name: event.target.value })} placeholder="Nombre del proveedor" className={inputClass} />

        <section key={destination.id || `destination-${activeDestinationIndex}`} className="flex flex-col gap-4">
          <select required aria-label="Destino" value={destination.destino_id} onChange={event => changeDestination(event.target.value)} className={selectClass}>
            <option value="" disabled>Selecciona un destino</option>
            {catalogs.destinos.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
          </select>

          <button type="button" onClick={addDestination} className="flex items-end justify-end text-black" aria-label="Agregar otro destino"><AddVioleta color="white" /></button>

          {destination.services.map((service, serviceIndex) => {
            const hotel = value.type === 'hotel';
            const serviceId = (hotel ? service.hotel_id : service.excursion_id) || '';
            const catalog = hotel ? catalogs.hotels : catalogs.excursions;
            const options = catalog.filter(option => catalogBelongsToDestination(option, destination.destino_id, catalogs.destinos) && (option.id === serviceId || !selectedServices.has(option.id)));

            return <section key={service.id || `service-${serviceIndex}`} className="flex flex-col gap-2">
              <select required aria-label={`${hotel ? 'Hotel' : 'Excursion'} ${serviceIndex + 1}`} value={serviceId} disabled={!destination.destino_id} onChange={event => {
                if (event.target.value === '__remove__') removeService(serviceIndex);
                else changeService(serviceIndex, hotel ? { id: undefined, hotel_id: event.target.value } : { id: undefined, excursion_id: event.target.value });
              }} className={selectClass}>
                <option value="" disabled>Selecciona {hotel ? 'un hotel asociado' : 'una excursion asociada'}</option>
                {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
                {destination.services.length > 1 && <option value="__remove__">Quitar este servicio</option>}
              </select>

              {hotel ? catalogs.regimenes.map(regimen => <input key={regimen.id} type="text" inputMode="decimal" aria-label={`Costo ${regimen.sigla || regimen.name} ${serviceIndex + 1}`} placeholder={`Costo por pasajero ${regimen.sigla || regimen.name} (ARS)`} value={service.regimen_costs.find(row => row.regimen_id === regimen.id)?.cost ?? ''} onChange={event => changeService(serviceIndex, { regimen_costs: [...service.regimen_costs.filter(row => row.regimen_id !== regimen.id), { regimen_id: regimen.id, cost: event.target.value }] })} className={inputClass} />) :
                <input type="text" inputMode="decimal" aria-label={`Costo excursion ${serviceIndex + 1}`} placeholder="Costo por pasajero (ARS)" value={service.cost ?? ''} onChange={event => changeService(serviceIndex, { cost: event.target.value })} className={inputClass} />}

              <DateRangePicker onChange={([start, end]) => changeService(serviceIndex, { start_date: formatDateRangeParam(start), end_date: formatDateRangeParam(end), period_id: '', validity_type: 'dates' })} startDate={date(service.start_date)} endDate={date(service.end_date)} className="text-black/90 font-medium bg-white w-full border md:text-xl border-gray-400 p-2 rounded-sm shadow-md shadow-gray-500 focus:outline-none focus:ring-2 focus:ring-primary" />
              <select aria-label={`Periodo ${serviceIndex + 1}`} value={service.period_id || ''} onChange={event => changeService(serviceIndex, { period_id: event.target.value, validity_type: event.target.value ? 'period' : 'dates', ...(event.target.value ? { start_date: '', end_date: '' } : {})})} className={selectClass}>
                <option value="">Periodo (opcional)</option>
                {catalogs.periods.map(period => <option key={period.id} value={period.id}>{period.name}</option>)}
              </select>
            </section>;
          })}
        </section>

        <button type="button" disabled={!destination.destino_id} onClick={addService} className="self-end flex items-end justify-end text-black" aria-label={`Agregar otro ${value.type === 'hotel' ? 'hotel' : 'excursion'}`}><AddVioleta color="white" /></button>
      </fieldset>
    </form>
  );
}
