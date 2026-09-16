export type TipoReporteAsignacion =
  | "por_chofer"
  | "historial"
  | "sin_asignar";

export type AccionReporteAsignacion =
  | "imprimir"
  | "pdf";

export type EstadoReporteAsignacion =
  | "Activo"
  | "Inactivo";

export type EstadoReporteVehiculo =
  | "Operativo"
  | "En mantenimiento"
  | "Baja";

export interface AsignacionReporteFiltros {
  fecha_inicio?: string;
  fecha_fin?: string;

  estado_asignacion?:
    EstadoReporteAsignacion;

  estado_vehiculo?:
    EstadoReporteVehiculo;
}
