export type EstadoAsignacion =
  | "ACTIVO"
  | "FINALIZADO";

/*
|--------------------------------------------------------------------------
| CHOFER
|--------------------------------------------------------------------------
*/

export interface AsignacionChofer {
  id: number;

  nombre: string;

  ci:
    | string
    | null;

  carnet_sindical:
    | string
    | null;

  telefono:
    | string
    | null;
}

/*
|--------------------------------------------------------------------------
| VEHÍCULO
|--------------------------------------------------------------------------
*/

export interface AsignacionVehiculo {
  id: number;

  placa: string;

  tipo: string;

  marca: string;

  modelo: string;

  color:
    | string
    | null;

  capacidad: number;

  estado: string;
}

/*
|--------------------------------------------------------------------------
| ASIGNACIÓN
|--------------------------------------------------------------------------
*/

export interface Asignacion {
  id: number;

  fecha_asignacion: string;

  fecha_finalizacion:
    | string
    | null;

  observacion:
    | string
    | null;

  estado:
    EstadoAsignacion;

  chofer:
    AsignacionChofer;

  vehiculo:
    AsignacionVehiculo;

  created_at?:
    | string
    | null;

  updated_at?:
    | string
    | null;
}

/*
|--------------------------------------------------------------------------
| CATÁLOGO CHOFER
|--------------------------------------------------------------------------
*/

export interface CatalogoChofer {
  id: number;

  nombre: string;

  ci:
    | string
    | null;

  carnet_sindical:
    | string
    | null;

  numero_licencia:
    | string
    | null;

  categoria_licencia:
    | string
    | null;
}

/*
|--------------------------------------------------------------------------
| CATÁLOGO VEHÍCULO
|--------------------------------------------------------------------------
*/

export interface CatalogoVehiculo {
  id: number;

  placa: string;

  tipo: string;

  marca: string;

  modelo: string;

  color:
    | string
    | null;

  capacidad: number;

  estado: string;
}

/*
|--------------------------------------------------------------------------
| CATÁLOGOS
|--------------------------------------------------------------------------
*/

export interface CatalogosAsignacionResponse {
  choferes:
    CatalogoChofer[];

  vehiculos:
    CatalogoVehiculo[];
}

/*
|--------------------------------------------------------------------------
| RESPONSES
|--------------------------------------------------------------------------
*/

export interface AsignacionesResponse {
  asignaciones:
    Asignacion[];
}

export interface AsignacionResponse {
  message?: string;

  asignacion:
    Asignacion;
}

export interface CambioAsignacionResponse {
  message?: string;

  anterior:
    Asignacion;

  asignacion:
    Asignacion;
}

/*
|--------------------------------------------------------------------------
| PAYLOAD ASIGNACIÓN
|--------------------------------------------------------------------------
*/

export interface AsignacionPayload {
  fecha_asignacion: string;

  id_chofer: number;

  id_vehiculo: number;

  observacion:
    | string
    | null;
}

/*
|--------------------------------------------------------------------------
| FINALIZAR
|--------------------------------------------------------------------------
*/

export interface FinalizarAsignacionPayload {
  fecha_finalizacion: string;
}

/*
|--------------------------------------------------------------------------
| FORM
|--------------------------------------------------------------------------
*/

export interface AsignacionForm {
  fecha_asignacion: string;

  id_chofer:
    | number
    | null;

  id_vehiculo:
    | number
    | null;

  observacion: string;
}