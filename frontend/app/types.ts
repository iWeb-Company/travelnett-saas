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

// Alias de conveniencia para mapear con el backend
export interface User extends UsersAgencys { }

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
export interface iWebClient extends Agencys { }


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
export interface Passenger extends Passengers { }

export interface Period {
    id?: string;
    iweb_client_id?: string;
    name: string;
    main_image?: string;
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

export interface Package {
    id?: string;
    iweb_client_id: string;
    name: string;
    subtitle: string;
    description: string;
    destino?: string;
    regimen?: string;
    excursion?: string;
    dates: PackageDateOfExit[];
    periodo?: string;
    price: number;
    gastos?: number | null;
    adicional?: number | null;
    hotel?: string;
    image: string;
    active: boolean;
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

export interface Reserva {
    id?: string;
    iweb_client_id?: string;
    passenger_id?: string;
}

export interface Salida {
    id?: string;
    iweb_client_id?: string;
    date_of_out?: string;
    type?: "aereo" | "bus" | string;
    active?: boolean;
    periodo?: string;
    transport_company?: string;
    destino?: string;
    passengers?: number;
    economy?: number;
    business?: number;
    lugaresCarga?: string[];
}

export interface SalidaLugarCarga {
    id?: string;
    iweb_client_id?: string;
    salida_id?: string;
    cargas?: string;
}