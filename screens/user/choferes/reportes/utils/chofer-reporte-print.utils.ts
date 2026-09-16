import {
  ChoferReporteFiltros,
} from "../types/chofer-reporte.types";

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

export function periodoReporteChofer(
  filtros:
    ChoferReporteFiltros,
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

export function construirTextoReporteChofer(
  titulo:
    string,

  filtros:
    ChoferReporteFiltros,
): string {
  const lineas:
    string[] = [
      titulo,
      "================================",
      `Periodo: ${periodoReporteChofer(filtros)}`,
    ];

  if (
    filtros.estado
  ) {
    lineas.push(
      `Estado: ${filtros.estado}`,
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

export function descripcionFiltrosReporteChofer(
  filtros:
    ChoferReporteFiltros,
): string {
  const partes:
    string[] = [
      periodoReporteChofer(
        filtros,
      ),
    ];

  if (
    filtros.estado
  ) {
    partes.push(
      filtros.estado,
    );
  }

  return partes.join(
    " | ",
  );
}
