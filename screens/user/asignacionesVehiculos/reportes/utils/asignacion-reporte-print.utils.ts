import {
  AsignacionReporteFiltros,
} from "../types/asignacion-reporte.types";

function fecha(
  value?:
    string |
    null,
): string {
  if (
    !value
  ) {
    return "-";
  }

  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})/,
    );

  if (
    !match
  ) {
    return value;
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function periodoReporteAsignacion(
  filtros:
    AsignacionReporteFiltros,
): string {
  if (
    filtros.fecha_inicio &&
    filtros.fecha_fin
  ) {
    return `${fecha(filtros.fecha_inicio)} - ${fecha(filtros.fecha_fin)}`;
  }

  if (
    filtros.fecha_inicio
  ) {
    return `Desde ${fecha(filtros.fecha_inicio)}`;
  }

  if (
    filtros.fecha_fin
  ) {
    return `Hasta ${fecha(filtros.fecha_fin)}`;
  }

  return "Todas las fechas";
}

export function construirTextoReporteAsignacion(
  titulo:
    string,

  filtros:
    AsignacionReporteFiltros,
): string {
  const lineas:
    string[] = [
      titulo,
      "================================",
    ];

  if (
    filtros.fecha_inicio ||
    filtros.fecha_fin
  ) {
    lineas.push(
      `Periodo: ${periodoReporteAsignacion(filtros)}`,
    );
  }

  if (
    filtros.estado_asignacion
  ) {
    lineas.push(
      `Estado asignacion: ${filtros.estado_asignacion}`,
    );
  }

  if (
    filtros.estado_vehiculo
  ) {
    lineas.push(
      `Estado vehiculo: ${filtros.estado_vehiculo}`,
    );
  }

  lineas.push(
    "================================",
    "",
    "El detalle del reporte se imprime",
    "desde el documento generado.",
  );

  return lineas.join(
    "\n",
  );
}

export function descripcionFiltrosReporteAsignacion(
  filtros:
    AsignacionReporteFiltros,
): string {
  const partes:
    string[] = [];

  if (
    filtros.fecha_inicio ||
    filtros.fecha_fin
  ) {
    partes.push(
      periodoReporteAsignacion(
        filtros,
      ),
    );
  }

  if (
    filtros.estado_asignacion
  ) {
    partes.push(
      `Asignación: ${filtros.estado_asignacion}`,
    );
  }

  if (
    filtros.estado_vehiculo
  ) {
    partes.push(
      `Vehículo: ${filtros.estado_vehiculo}`,
    );
  }

  return partes.length >
    0
    ? partes.join(
        " | ",
      )
    : "Sin filtros";
}
