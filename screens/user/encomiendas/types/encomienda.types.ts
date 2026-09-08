export type EstadoEncomienda =
    | "REGISTRADA"
    | "EN_TRANSITO"
    | "ENTREGADA"
    | "ANULADA";

export interface EncomiendaRuta {
    id: number;
    origen: string;
    destino: string;
    estado: string;
}

export interface EncomiendaChofer {
    id: number;
    nombre: string;
    ci: string | null;
    carnet_sindical: string | null;
}

export interface EncomiendaVehiculo {
    id: number;
    placa: string | null;
    tipo: string | null;
    marca: string | null;
    modelo: string | null;
    color: string | null;
}

export interface EncomiendaViaje {
    id: number;
    estado: string | null;
    hora_inicio: string | null;
    ruta: EncomiendaRuta | null;
    chofer: EncomiendaChofer | null;
    vehiculo: EncomiendaVehiculo | null;
}

export interface Encomienda {
    id: number;
    guia: string | null;
    fecha: string | null;
    remitente: string;
    destinatario: string;
    origen: string;
    destino: string;
    descripcion: string | null;
    cantidad: number;
    precio: string;
    estado: EstadoEncomienda;
    viaje: EncomiendaViaje | null;
    created_at: string | null;
    updated_at: string | null;
}

export interface EncomiendaPayload {
    remitente: string;
    destinatario: string;
    origen: string;
    destino: string;
    descripcion?: string | null;
    cantidad: number;
    precio: number;
}

export interface AsignarEncomiendaPayload {
    id_viaje: number;
}

export interface EncomiendaCatalogoChofer {
    id: number;
    nombre: string;
    ci: string | null;
    carnet_sindical: string | null;
}

export interface EncomiendaCatalogoVehiculo {
    id: number;
    placa: string | null;
    tipo: string | null;
    marca: string | null;
    modelo: string | null;
    color: string | null;
    estado: string | null;
}

export interface EncomiendaCatalogoRuta {
    id: number;
    origen: string;
    destino: string;
    estado: string;
}

export interface EncomiendaCatalogoViaje {
    id: number;
    estado: string | null;
    hora_inicio: string | null;
    ruta: EncomiendaCatalogoRuta | null;
    chofer: EncomiendaCatalogoChofer | null;
    vehiculo: EncomiendaCatalogoVehiculo | null;
}

export interface EncomiendaCatalogos {
    viajes: EncomiendaCatalogoViaje[];
}

export interface EncomiendasResponse {
    encomiendas: Encomienda[];
}

export interface EncomiendaResponse {
    encomienda: Encomienda;
}

export interface EncomiendaMutationResponse {
    message: string;
    encomienda: Encomienda;
}