import type {
  ViajeEstado,
} from "./pasajes.types";

/*
|--------------------------------------------------------------------------
| PASAJERO DEL VIAJE
|--------------------------------------------------------------------------
*/

export interface ViajePasajeroItem {
  id_detalle_venta: number;

  id_venta: number;

  pasajero: {
    id: number;

    nombre_completo: string;

    nombres:
      | string
      | null;

    apellido_paterno:
      | string
      | null;

    apellido_materno:
      | string
      | null;

    ci:
      | string
      | null;
  };

  asiento: {
    id: number;

    numero_asiento:
      | number
      | null;

    fila:
      | number
      | null;

    columna:
      | number
      | null;

    piso:
      | string
      | null;
  };

  precio_unitario: number;
}

/*
|--------------------------------------------------------------------------
| RESPONSE
|--------------------------------------------------------------------------
*/

export interface ViajePasajerosResponse {
  viaje: {
    id: number;

    estado:
      | ViajeEstado
      | string;

    origen:
      | string
      | null;

    destino:
      | string
      | null;

    hora_salida:
      | string
      | null;

    vehiculo:
      | string
      | null;

    chofer:
      | string
      | null;
  };

  total: number;

  pasajeros:
    ViajePasajeroItem[];
}