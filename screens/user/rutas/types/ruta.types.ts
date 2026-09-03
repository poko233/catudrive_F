export type EstadoRuta =
  | "ACTIVA"
  | "INACTIVA";

export interface Ruta {
  id: number;

  origen: string;

  destino: string;

  /*
  |--------------------------------------------------------------------------
  | DATOS GUARDADOS EN BACKEND
  |--------------------------------------------------------------------------
  |
  | Laravel continúa devolviendo:
  |
  | YYYY-MM-DD HH:mm
  |
  */

  hora_inicio:
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
| FORMULARIO
|--------------------------------------------------------------------------
|
| En frontend dividimos fecha y hora.
|
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
| PAYLOAD API
|--------------------------------------------------------------------------
|
| Antes de enviar volvemos a unir:
|
| fecha + hora
|
*/

export interface RutaPayload {
  origen: string;

  destino: string;

  hora_inicio:
    | string
    | null;

  hora_fin:
    | string
    | null;

  tarifa: number;

  estado:
    EstadoRuta;
}

export interface RutaResponse {
  message?: string;

  ruta:
    Ruta;
}

export interface RutasResponse {
  rutas:
    Ruta[];
}