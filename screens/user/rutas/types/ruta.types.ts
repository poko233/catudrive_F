export type EstadoRuta =
  | "ACTIVA"
  | "INACTIVA";

/*
|--------------------------------------------------------------------------
| RUTA
|--------------------------------------------------------------------------
*/

export interface Ruta {
  id: number;

  origen: string;

  destino: string;

  fecha_inicio:
    | string
    | null;

  hora_inicio:
    | string
    | null;

  fecha_fin:
    | string
    | null;

  hora_fin:
    | string
    | null;

  tarifa: number;

  estado:
    EstadoRuta;

  viajes_count: number;

  created_at?:
    | string
    | null;

  updated_at?:
    | string
    | null;
}

/*
|--------------------------------------------------------------------------
| CHOFERES CON VIAJES EN UNA RUTA
|--------------------------------------------------------------------------
*/

export interface RutaChoferViaje {
  id: number;

  nombre_completo: string;

  carnet_identidad:
    | string
    | null;

  carnet_sindical:
    | string
    | null;

  telefono:
    | string
    | null;

  fotografia:
    | string
    | null;

  fotoUrl:
    | string
    | null;

  estado:
    | string
    | null;

  viajes_count: number;

  primera_salida:
    | string
    | null;

  ultima_salida:
    | string
    | null;
}

export interface RutaChoferesViajesResponse {
  ruta: {
    id: number;
    origen: string;
    destino: string;
  };

  total: number;

  choferes:
    RutaChoferViaje[];
}

/*
|--------------------------------------------------------------------------
| PAYLOAD
|--------------------------------------------------------------------------
*/

export interface RutaPayload {
  origen: string;

  destino: string;

  fecha_inicio:
    | string
    | null;

  hora_inicio:
    | string
    | null;

  fecha_fin:
    | string
    | null;

  hora_fin:
    | string
    | null;

  tarifa: number;

  estado:
    EstadoRuta;
}

/*
|--------------------------------------------------------------------------
| FORMULARIO
|--------------------------------------------------------------------------
*/

export interface RutaForm {
  origen: string;

  destino: string;

  fecha_inicio: string;

  hora_inicio: string;

  fecha_fin: string;

  hora_fin: string;

  tarifa: string;

  estado:
    EstadoRuta;
}

/*
|--------------------------------------------------------------------------
| RESPONSES
|--------------------------------------------------------------------------
*/

export interface RutasResponse {
  rutas: Ruta[];
}

export interface RutaResponse {
  message?: string;

  ruta: Ruta;
}
