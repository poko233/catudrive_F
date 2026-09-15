/*
|--------------------------------------------------------------------------
| TIPO REPORTE ANALÍTICO
|--------------------------------------------------------------------------
|
| Valores EXACTOS aceptados por la ruta del backend
| (->whereIn('tipo', [...])). Case-sensitive.
|
*/

export type TipoReporteVentaAnalitico =
  | "vendidos_por_fecha"
  | "por_ruta"
  | "por_vehiculo"
  | "por_chofer"
  | "ingresos";

/*
|--------------------------------------------------------------------------
| TIPO REPORTE (ANALÍTICOS + PLANILLA)
|--------------------------------------------------------------------------
*/

export type TipoReporteVenta =
  | TipoReporteVentaAnalitico
  | "planilla";

/*
|--------------------------------------------------------------------------
| ESTADO DE VENTA
|--------------------------------------------------------------------------
|
| Valores EXACTOS del Rule::in del backend. Si se omite, el Service
| fuerza 'Pagada' (los Pendiente/Anulada quedan excluidos).
|
*/

export type EstadoVentaReporte =
  | "Pendiente"
  | "Pagada"
  | "Anulada";

/*
|--------------------------------------------------------------------------
| FILTROS ANALÍTICOS
|--------------------------------------------------------------------------
|
| Todos opcionales. Sin fechas se incluye el histórico completo.
| `id_ruta` solo afecta a `por_ruta`, `id_vehiculo` a `por_vehiculo`,
| `id_chofer` a `por_chofer` y `forma_pago` a `ingresos`.
| El backend ignora los filtros fuera de contexto.
|
*/

export interface VentaReporteFiltros {
  fecha_inicio?: string;
  fecha_fin?: string;
  id_ruta?: number;
  id_vehiculo?: number;
  id_chofer?: number;
  forma_pago?: string;
  estado?: EstadoVentaReporte;
}

/*
|--------------------------------------------------------------------------
| SOLICITUD (lo que arma el modal de filtros)
|--------------------------------------------------------------------------
|
| La planilla NO recibe query params: solo el id del viaje.
|
*/

export interface SolicitudReporteVenta {
  tipo:
    TipoReporteVenta;

  filtros:
    VentaReporteFiltros;

  idViaje?:
    number;
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

export type AccionReporteVenta =
  | "imprimir"
  | "pdf";
