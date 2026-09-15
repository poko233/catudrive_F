import {
  EstadoVehiculo,
} from "../../types/vehiculo.types";

/*
|--------------------------------------------------------------------------
| TIPO REPORTE
|--------------------------------------------------------------------------
|
| Valores EXACTOS aceptados por la ruta del backend
| (->whereIn('tipo', [...])). Case-sensitive.
|
*/

export type TipoReporteVehiculo =
  | "lista"
  | "disponibles"
  | "asignados"
  | "por_propietario";

/*
|--------------------------------------------------------------------------
| FILTROS
|--------------------------------------------------------------------------
|
| Todos opcionales. Sin fechas se incluyen todos los registros.
| `estado` solo afecta a `lista`; `id_categoria` a `lista` y
| `disponibles`; `id_chofer` a `asignados` y `por_propietario`.
| El backend ignora los filtros que no corresponden al tipo.
|
*/

export interface VehiculoReporteFiltros {
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoVehiculo;
  id_categoria?: number;
  id_chofer?: number;
}

/*
|--------------------------------------------------------------------------
| ACCIÓN
|--------------------------------------------------------------------------
|
| El backend SOLO expone html (impresión) y pdf (descarga).
| No existe endpoint JSON ni CSV para este módulo.
|
*/

export type AccionReporteVehiculo =
  | "imprimir"
  | "pdf";
