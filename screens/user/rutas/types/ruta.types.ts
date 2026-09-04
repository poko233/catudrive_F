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

  /*
  |--------------------------------------------------------------------------
  | HORARIO INDEPENDIENTE
  |--------------------------------------------------------------------------
  */

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