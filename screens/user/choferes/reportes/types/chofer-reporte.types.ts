/*
|--------------------------------------------------------------------------
| TIPOS DE REPORTE
|--------------------------------------------------------------------------
|
| Valores EXACTOS aceptados por el backend.
|
*/

export type TipoReporteChofer =
  | "lista"
  | "activos_inactivos"
  | "carnets_sindicales";

/*
|--------------------------------------------------------------------------
| FILTROS
|--------------------------------------------------------------------------
*/

export type EstadoReporteChofer =
  | "Activo"
  | "Inactivo";

export interface ChoferReporteFiltros {
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: EstadoReporteChofer;
}

/*
|--------------------------------------------------------------------------
| ACCIÓN
|--------------------------------------------------------------------------
*/

export type AccionReporteChofer =
  | "imprimir"
  | "pdf";
