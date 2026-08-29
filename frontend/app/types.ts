// ==========================================
// 1. AUTENTICACIÓN Y TENANTS (iWebClients / Agencys)
// ==========================================

export interface UsersAgencys {
  id: string;
  name: string;
  phone: string | number;
  last_name: string;
  dni: string | number;
  birthday: string;
  iweb_client_id: string;
  active: boolean | number;
  username: string;
}

export interface Voucher {
  id: string;
  iweb_client_id: string;
  reserva_id: string;
  salida_id: string | null;
  package_id: string | null;
  destino_name: string | null;
  titular_name: string | null;
  titular_dni: string | null;
  total_passengers: number | null;
  fecha_salida: string | null;
  tipo_transporte: string | null;
  tipo_butaca: string | null;
  lugar_carga: string | null;
  horario_carga: string | null;
  empresa_transporte: string | null;
  coordinador_nombre: string | null;
  coordinador_telefono: string | null;
  hotel_name: string | null;
  room_type: string | null;
  passengers_names: string | null;
  regimen_name: string | null;
  dias: number | null;
  noches: number | null;
  observations: string | null;
}

// Alias de conveniencia para mapear con el backend
export interface User extends UsersAgencys {}

export interface Agencys {
  id: string;
  name: string;
  cuit: string | number;
  email: string;
  status: string | boolean;
  logo_xl: string;
  logo_s: string;
  domain?: string;
  slug?: string;
}

// Alias de conveniencia para mapear con el backend (iweb_clients)
export interface iWebClient extends Agencys {}

// ==========================================
// 2. PARÁMETROS Y TABLAS MAPEADAS (SQLAlchemy)
// ==========================================

export interface TransportCompany {
  id?: string;
  iweb_client_id?: string;
  name: string;
  web: string;
  type?: string;
  cuit: number | null;
  phone: number | null;
}

export interface Hotel {
  id?: string;
  iweb_client_id?: string;
  name: string;
  destino: string;
  address: string;
  web: string;
  phone?: number | null; // Opcional para evitar conflictos de inicialización de estado
  images?: string[]; // Utilizado en el frontend para agrupar urls de hotels_images
}

export interface HotelsImages {
  id: string;
  iweb_client_id: string;
  hotel_id: string;
  url: string;
}

export interface Excursion {
  id?: string;
  iweb_client_id?: string;
  destino: string;
  name: string;
  description: string;
}

export interface Destino {
  id?: string;
  iweb_client_id?: string;
  name: string;
  sigla: string;
}

export interface Regimen {
  id?: string;
  iweb_client_id?: string;
  name: string;
  sigla: string;
  description: string;
}

export interface Micro {
  id?: string;
  iweb_client_id?: string;
  name: string;
  cant_semi: string | number;
  cant_cama: string | number;
  cant_pano: string | number;
  observaciones: string;
}

// Representa a la tabla física bus_types
export interface BusType {
  id?: string;
  iweb_client_id?: string;
  name: string;
  semicama_quantity?: number | null;
  cama_quantity?: number | null;
  panoramicos_quantity?: number | null;
  observations?: string;
  description?: string; // Alias para compatibilidad backend
}

export interface Cliente {
  id?: string;
  iweb_client_id?: string;
  nombre_sistema: string;
  full_name: string;
  dni: string | number;
  fecha: string;
  tipo_cliente: string;
  telefono: string | number;
  forma_pago: string;
  comision: string | number;
}

// Representa a la tabla física clients
export interface Client {
  id?: string;
  iweb_client_id?: string;
  name_system?: string;
  complete_name?: string;
  client_type?: string;
  parent_client_id?: string;
  dni?: number;
  birthday?: string;
  email?: string;
  phone?: number;
  payment_method?: string;
  commission?: number;
  hashed_password?: string;
  created_at?: string;
  active?: boolean;
}

export interface TipoCliente {
  id?: string;
  iweb_client_id?: string;
  nombre: string;
  admin: boolean;
  si_es_admin?: string;
}

// Representa a la tabla física clientsType / clients_type
export interface ClientsType {
  id?: string;
  iweb_client_id?: string;
  name?: string;
  adminForSellers?: boolean;
  admin_clients?: string;
}

export interface Carga {
  id?: string;
  iweb_client_id?: string;
  nombre: string;
  direccion: string;
  tipo: "aereo" | "bus" | string;
}

// Representa a la tabla física lugares_carga
export interface LoadingPlace {
  id?: string;
  iweb_client_id?: string;
  name: string;
  address: string;
  type: "aereo" | "bus" | string;
  is_essential?: boolean;
}

export interface Passengers {
  id?: string;
  iweb_client_id?: string;
  name: string;
  last_name: string;
  dni: number;
  date_of_birth: string;
  sex: string;
  phone: number | null;
}

// Alias de conveniencia
export interface Passenger extends Passengers {}

export interface Period {
  id?: string;
  iweb_client_id?: string;
  name: string;
  main_image?: string;
  web_enabled?: boolean;
}

export interface Permission {
  id?: string;
  iweb_client_id?: string;
  name?: string;
  salidas?: boolean;
  paquetes?: boolean;
  administracion?: boolean;
  parametros?: boolean;
  web?: boolean;
  permisos_users?: boolean;
}

export interface Flyer {
  id?: string;
  iweb_client_id?: string;
  name?: string;
  url?: string;
}

export interface News {
  id?: string;
  iweb_client_id?: string;
  url?: string;
}

export interface Account {
  id?: string;
  iweb_client_id?: string;
  account_title?: string;
  titular?: string;
  account_number?: string;
  cuit_cuil?: string | null;
  cbu_cvu?: string | null;
  alias?: string;
  active?: boolean;
}

// ==========================================
// 3. TABLAS ADICIONALES SIN MAPEAR EN FastAPI (Lógica Local / Futura Integración)
// ==========================================

export interface Card {
  id?: string;
  iweb_client_id?: string;
  name?: string;
  status?: boolean;
}

export interface CardWeb {
  id?: string;
  iweb_client_id?: string;
  body?: string;
  quotes?: number;
  quality_extra?: number;
}

export interface CurrentAccountMovement {
  id?: string;
  iweb_client_id?: string;
  client_id?: string;
  reserva_id?: string;
  saldo?: number;
  description?: string;
  date?: string;
}

export interface Documentation {
  id?: string;
  iweb_client_id?: string;
  title?: string;
  body?: string;
}

export interface PackageHotel {
  id?: string;
  iweb_client_id?: string;
  package_id?: string;
  hotel_id?: string;
  hotel_noches?: number | null;
  hotel_fecha_in?: string | null;
  hotel_fecha_out?: string | null;
  hotel_fecha_salida_mas?: string | null;
  hotel_regimen_id?: string | null;
  tarifa_single?: number | null;
  comisionable_single?: boolean;
  tarifa_doble?: number | null;
  tarifa_triple?: number | null;
  tarifa_cuadruple?: number | null;
  tarifa_quintuple?: number | null;
  tarifa_menores?: number | null;
  pricing_type?: string;
}

export interface Package {
  id?: string;
  iweb_client_id: string;
  name: string;
  subtitle: string;
  description: string;
  destino?: string;
  dates: PackageDateOfExit[];
  periodo?: string;
  price: number;
  gastos?: number | null;
  adicional?: number | null;
  image: string;
  active: boolean;
  web?: boolean;
  comisionable?: boolean;
  moneda?: string;
  moneda_gastos?: string;
  moneda_adicional?: string;
  excursiones?: string | null;
  hotels?: PackageHotel[];
}

export interface PackageDateOfExit {
  id?: string;
  iweb_client_id?: string;
  package_id?: string;
  date?: string;
  active: boolean;
}

export interface Pago {
  id?: string;
  iweb_client_id?: string;
  reserva_id?: string;
  payment_method?: string;
  date_pay?: string;
  ammount?: number;
  observations?: string;
  card_number?: string;
  titular?: string;
  operation_number?: string;
  quotes_number?: string;
}

export interface ReservationPassengerDetail {
  id: string;
  reserva_id: string;
  pasajero_id: string;
  pasajero_type: string;
  butaca_number?: number | null;
  butaca_type?: string | null;
  nombre_completo?: string | null;
  name?: string | null;
  last_name?: string | null;
  dni?: number | null;
  fecha_nacimiento?: string | null;
  sex?: string | null;
  telefono?: string | null;
}

export interface Reserva {
  id: string;
  iweb_client_id: string;
  salida_id?: string | null;
  package_id?: string | null;
  codigo_reserva?: string | null;
  client_id?: string | null;
  client_nombre?: string | null;
  vendedor: string | null;
  lugar_carga_id?: string | null;
  lugar_carga_nombre?: string | null;
  lugar_carga_direccion?: string | null;
  hotel_id?: string | null;
  hotel_nombre?: string | null;
  regimen_id?: string | null;
  regimen_nombre?: string | null;
  rooming_id?: string | null;
  room_type?: string | null;
  active?: boolean;
  venciment?: string | null;
  observations?: string | null;
  commission?: number | null;
  liberados?: number | null;
  type?: "tradicional" | "bloqueo_grupo" | string;
  titulo?: string | null;

  // Virtuales/compatibilidad legacy
  passenger_id?: string | null;
  nombre_completo?: string | null;
  telefono?: string | null;
  dni?: number | null;
  fecha_nacimiento?: string | null;
  edad_categoria?: string | null;
  butaca?: string | null;
  tipo_butaca?: string | null;

  // Detalle de todos los pasajeros intermedios
  reservation_passengers?: ReservationPassengerDetail[];

  // Virtuales extras cruzados
  destino?: string | null;
  fecha?: string | null;
  numero?: number | null;
}

export interface Salida {
  id: string;
  iweb_client_id: string;
  date_of_out?: string | null;
  type?: "aereo" | "bus" | string | null;
  active?: boolean;
  periodo?: string | null;
  transport_company?: string | null;
  type_bus?: string | null;
  destino?: string | null;
  coordinador_nombre?: string | null;
  coordinador_telefono?: string | null;
  hotel_id?: string | null;
  regimen_id?: string | null;
  passengers?: number;
  semicama?: number | null;
  cama?: number | null;
  cargas?: {
    id: string;
    name?: string | null;
    type?: string | null;
    address?: string | null;
    horario?: string | null;
  }[];
  semicama_disponibles?: string;
  cama_disponibles?: string;
  semicama_reservadas?: string;
  cama_reservadas?: string;
}

export interface SalidaLugarCarga {
  id?: string;
  iweb_client_id?: string;
  salida_id?: string;
  cargas?: string;
}

export interface GastoNoCommission {
  id: string;
  liquidacion_id?: string | null;
  name?: string | null;
  amount?: number | null;
  iweb_client_id: string;
}

export interface Liquidacion {
  id: string;
  iweb_client_id: string;
  booking_id?: string | null;
  total_amout?: number | null;
  total_commission?: number | null;
  commission?: number | null;
  gastos?: GastoNoCommission[];
}

export interface TesoroMovement {
  id: string;
  iweb_client_id: string;
  account_id: string;
  movement_type: string;
  recibo_number?: string | null;
  ammount: number;
  created_at?: string;
}
