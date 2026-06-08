export interface UsersAgencys {
    id: string;
    name: string;
    phone: string;
    last_name: string;
    dni: string;
    birthday: string;
    iweb_client_id: string;
    active: boolean;
    username: string;
}


export interface Agencys {
    id: string;
    name: string;
    cuit: string;
    email: string;
    status: string;
    logo_xl: string;
    logo_s: string;
}

// PARAMETROS
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
    images: string[];
}

export interface Excursion {
    id?: string;
    destino: string;
    iweb_client_id?: string;
    description: string;
    name: string;
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
    cant_semi: string;
    cant_cama: string;
    cant_pano: string;
    observaciones: string;
}

export interface Cliente {
    id?: string;
    iweb_client_id?: string;
    nombre_sistema: string;
    full_name: string;
    dni: string;
    fecha: string;
    tipo_cliente: string;
    telefono: string;
    forma_pago: string;
    comision: string;
}

export interface TipoCliente {
    id?: string;
    iweb_client_id?: string;
    nombre: string;
    admin: boolean;
    si_es_admin?: string;
}

export interface Carga {
    id?: string;
    iweb_client_id?: string;
    nombre: string;
    direccion: string;
    tipo: "aereo" | "bus";
}

export interface BusType {
    id: string;
    iweb_client_id: string;
    name: string;
    cant_semi: string;
    cant_cama: string;
    cant_pano: string;
    observaciones: string;
}

export interface LoadingPlace {
    id?: string;
    iweb_client_id?: string;
    name: string;
    address: string;
    type: "aereo" | "bus";
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

export interface Period {
    id?: string;
    iweb_client_id?: string;
    name: string;
    main_image?: string;
}