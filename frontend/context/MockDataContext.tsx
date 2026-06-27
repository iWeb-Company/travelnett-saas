'use client';

import React, { createContext, useContext, ReactNode } from 'react';

export interface Salida {
  id: string;
  destinoId: string;
  destinoNombre: string;
  empresaId: string;
  empresaNombre: string;
  empresaTipo: 'aereo' | 'bus';
  fecha: string;
  periodoId: string;
  periodoNombre: string;
  pasajerosTotales: number;
  semicama: number;
  cama: number;
  precioBase: number;
  gastosAdmin: number;
  adicionalBuscama: number;
  cargas: string[];
  coordinadores: string;
  observaciones: string;
  active: boolean;
  asignaciones: Record<string, { id: number; nombre: string; localidad: string }>;
}

export interface Paquete {
  id: string;
  nombre: string;
  subtitulo: string;
  descripcion: string;
  destinoId: string;
  destinoNombre: string;
  hotelId: string;
  hotelNombre: string;
  regimenId: string;
  regimenNombre: string;
  excursionId: string;
  excursionNombre: string;
  fechaSalida: string;
  periodoId: string;
  periodoNombre: string;
  precio: number;
  moneda: string;
  gastosAdmin: number;
  adicionalBuscama: number;
  active: boolean;
}

export interface PasajeroReserva {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento: string;
  telefono: string;
  asiento?: string;
  cargaId?: string;
  cargaNombre?: string;
}

export interface Reserva {
  id: string;
  clienteId: string;
  clienteNombre: string;
  paqueteId?: string;
  paqueteNombre?: string;
  salidaId?: string;
  fechaCreacion: string;
  fechaViaje: string;
  pasajeros: PasajeroReserva[];
  montoTotal: number;
  moneda: string;
  saldoPendiente: number;
  estado: 'pendiente' | 'confirmada' | 'cancelada';
}

export interface MovimientoCaja {
  id: string;
  tipo: 'ingreso' | 'egreso' | 'pase';
  cuentaOrigen: string;
  cuentaDestino?: string;
  monto: number;
  moneda: string;
  fecha: string;
  observaciones: string;
}

interface MockDataContextType {
  salidas: Salida[];
  paquetes: Paquete[];
  reservas: Reserva[];
  movimientos: MovimientoCaja[];
  addSalida: (salida: Omit<Salida, 'id' | 'asignaciones'>) => string;
  updateSalida: (id: string, salida: Partial<Salida>) => void;
  deleteSalida: (id: string) => void;
  addPaquete: (paquete: Omit<Paquete, 'id'>) => string;
  updatePaquete: (id: string, paquete: Partial<Paquete>) => void;
  deletePaquete: (id: string) => void;
  addReserva: (reserva: Omit<Reserva, 'id' | 'fechaCreacion' | 'estado' | 'saldoPendiente'>) => string;
  updateReserva: (id: string, updates: Partial<Reserva>) => void;
  addMovimiento: (mov: Omit<MovimientoCaja, 'id'>) => void;
}

const MockDataContext = createContext<MockDataContextType | undefined>(undefined);

const staticSalidas: Salida[] = [];

const staticPaquetes: Paquete[] = [];

const staticReservas: Reserva[] = [];

const staticMovimientos: MovimientoCaja[] = [];

export function MockDataProvider({ children }: { children: ReactNode }) {
  // No-op handlers that do not save to localstorage or mutate state
  const addSalida = () => "salida-mock-id";
  const updateSalida = () => {};
  const deleteSalida = () => {};
  const addPaquete = () => "paquete-mock-id";
  const updatePaquete = () => {};
  const deletePaquete = () => {};
  const addReserva = () => "res-mock-id";
  const updateReserva = () => {};
  const addMovimiento = () => {};

  return (
    <MockDataContext.Provider value={{
      salidas: staticSalidas,
      paquetes: staticPaquetes,
      reservas: staticReservas,
      movimientos: staticMovimientos,
      addSalida,
      updateSalida,
      deleteSalida,
      addPaquete,
      updatePaquete,
      deletePaquete,
      addReserva,
      updateReserva,
      addMovimiento
    }}>
      {children}
    </MockDataContext.Provider>
  );
}

export function useMockData() {
  const context = useContext(MockDataContext);
  if (context === undefined) {
    throw new Error('useMockData must be used within a MockDataProvider');
  }
  return context;
}
