export type EstadoChofer =
  | "ACTIVO"
  | "INACTIVO";

export type CategoriaLicencia =
  | "M"
  | "P"
  | "A"
  | "B"
  | "C"
  | string;

export interface Chofer {
  id: number;

  carnet_sindical: string;

  fotografia?:
    | string
    | null;

  fotoUrl?:
    | string
    | null;

  nombre_completo: string;

  carnet_identidad: string;

  telefono: string;

  numero_licencia: string;

  categoria_licencia:
    CategoriaLicencia;

  estado:
    EstadoChofer;

  codigo_qr?:
    | string
    | null;

  qrUrl?:
    | string
    | null;

  created_at?:
    | string
    | null;

  updated_at?:
    | string
    | null;
}

export interface ChoferForm {
  carnet_sindical: string;

  nombre_completo: string;

  carnet_identidad: string;

  telefono: string;

  numero_licencia: string;

  categoria_licencia:
    CategoriaLicencia;

  estado:
    EstadoChofer;
}

export interface FotoChoferArchivo {
  uri: string;

  name: string;

  type: string;
}

export interface ChoferResponse {
  message?: string;

  chofer:
    Chofer;

  codigo_qr?:
    | string
    | null;

  qrUrl?:
    | string
    | null;
}

export interface ChoferesResponse {
  choferes:
    Chofer[];
}

export interface HistorialRutaChofer {
  id: number;

  origen: string;

  destino: string;

  tarifa: number;

  estado: string;
}

export interface HistorialViajeChofer {
  id: number;

  hora_inicio?:
    | string
    | null;

  created_at?:
    | string
    | null;

  ruta:
    HistorialRutaChofer;
}

export interface HistorialVehiculoChofer {
  id: number;

  placa: string;

  tipo: string;

  marca: string;

  modelo: string;

  color?:
    | string
    | null;

  estado: string;
}

export interface HistorialAsignacionChofer {
  id: number;

  estado: string;

  fecha_asignacion?:
    | string
    | null;

  fecha_actualizacion?:
    | string
    | null;

  fecha_eliminacion?:
    | string
    | null;

  vehiculo:
    HistorialVehiculoChofer;

  viajes:
    HistorialViajeChofer[];
}

export interface HistorialChoferResponse {
  historial:
    HistorialAsignacionChofer[];
}