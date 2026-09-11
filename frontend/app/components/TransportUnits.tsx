'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { SalidaTransportUnit, TransportCompany, TransportUnitInput } from '@/app/types';
import { apiClient } from '@/lib/api';

const inputClass = 'border border-gray-400 shadow-md text-gray-700 font-semibold shadow-gray-400 w-full rounded p-2 bg-white';

function UnitForm({ unit, companies, busy, onSave }: {
  unit?: SalidaTransportUnit; companies: TransportCompany[]; busy: boolean;
  onSave: (value: TransportUnitInput) => Promise<void>;
}) {
  return <form className="flex flex-col gap-3 w-full" onSubmit={async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    await onSave({ transport_company: String(values.get('company')), price: Number(values.get('price')),
      coordinador_nombre: String(values.get('name') || '') || null,
      coordinador_telefono: String(values.get('phone') || '') || null });
  }}>
    <label>Empresa de transporte<select name="company" required defaultValue={unit?.transport_company || ''} className={inputClass} disabled={busy}>
      <option value="">Seleccionar empresa</option>
      {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
    </select></label>
    <label>Precio<input name="price" type="number" min="0" step="0.01" required defaultValue={unit ? Number(unit.price) : ''} className={inputClass} disabled={busy} /></label>
    <label>Coordinador<input name="name" maxLength={255} defaultValue={unit?.coordinador_nombre || ''} className={inputClass} disabled={busy} /></label>
    <label>Teléfono del coordinador<input name="phone" type="tel" maxLength={50} defaultValue={unit?.coordinador_telefono || ''} className={inputClass} disabled={busy} /></label>
    <button disabled={busy} className="w-full bg-primary text-white font-semibold text-lg py-2 rounded-lg disabled:opacity-50">{busy ? 'Guardando...' : unit ? 'Guardar micro' : 'Agregar micro'}</button>
  </form>;
}

export default function TransportUnits({ tenant, salidaId, initialUnits, companies }: {
  tenant: string; salidaId: string; initialUnits: SalidaTransportUnit[]; companies: TransportCompany[];
}) {
  const [units, setUnits] = useState(initialUnits);
  const [busy, setBusy] = useState(false);
  const [newFormKey, setNewFormKey] = useState(0);
  const [openUnitId, setOpenUnitId] = useState<string | null>(null);
  async function save(body: TransportUnitInput, unit?: SalidaTransportUnit) {
    setBusy(true);
    try {
      const result = unit
        ? await apiClient.updateTransportUnit(tenant, salidaId, unit.id, body)
        : await apiClient.createTransportUnit(tenant, salidaId, body);
      setUnits(previous => unit ? previous.map(item => item.id === unit.id ? result : item) : [...previous, result]);
      if (!unit) setNewFormKey(value => value + 1);
      toast.success('Micro guardado');
    } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo guardar el micro'); }
    finally { setBusy(false); }
  }
  return <section className="flex justify-center gap-5 items-center mx-auto max-w-2xl flex-col w-full">
    {units.map(unit => <section key={unit.id} className="flex flex-col gap-3 w-full border-b border-gray-300 pb-3">
      <button type="button" disabled={!unit.active} aria-expanded={unit.active && openUnitId === unit.id}
        aria-controls={`micro-${unit.id}`} className="flex w-full items-center justify-between text-left font-semibold disabled:cursor-default"
        onClick={() => setOpenUnitId(current => current === unit.id ? null : unit.id)}>
        <span>Micro {unit.number}{unit.active ? '' : ' — Anulado'}</span>
        {unit.active && <span aria-hidden="true">{openUnitId === unit.id ? '−' : '+'}</span>}
      </button>
      {unit.active && <div id={`micro-${unit.id}`} aria-hidden={openUnitId !== unit.id}
        className={`grid w-full transition-[grid-template-rows,opacity,transform] duration-300 ease-out ${
          openUnitId === unit.id
            ? 'grid-rows-[1fr] translate-y-0 opacity-100'
            : 'pointer-events-none grid-rows-[0fr] -translate-y-1 opacity-0'
        }`}>
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-3 w-full">
        <UnitForm unit={unit} companies={companies} busy={busy} onSave={body => save(body, unit)} />
        <p>Cupos: {unit.semicama} Semicama / {unit.cama} Cama</p>
        <Link className="text-secondary font-semibold" href={`/salidas/lista/${salidaId}/butacas?micro=${unit.id}`}>Taquilla y tipo de bus</Link>
        <button disabled={busy} className="text-red-600" onClick={async () => {
          if (!window.confirm(`¿Anular Micro ${unit.number}? Se conservará su historial.`)) return;
          setBusy(true);
          try {
            const result = await apiClient.deleteTransportUnit(tenant, salidaId, unit.id);
            setUnits(previous => previous.map(item => item.id === unit.id ? result : item));
            toast.success('Micro anulado');
          } catch (error) { toast.error(error instanceof Error ? error.message : 'No se pudo anular'); }
          finally { setBusy(false); }
        }}>Anular micro</button>
          </div>
        </div>
      </div>}
    </section>)}
    <section className="flex flex-col gap-3 w-full">
      <h2 className="font-semibold">Nuevo micro</h2>
      <UnitForm key={newFormKey} companies={companies} busy={busy} onSave={body => save(body)} />
    </section>
  </section>;
}
