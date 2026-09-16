import {
  httpClient,
} from "@/http/httpClient";

import {
  AsignacionReporteFiltros,
  TipoReporteAsignacion,
} from "../types/asignacion-reporte.types";

function queryString(
  filtros:
    AsignacionReporteFiltros,
): string {
  const params =
    new URLSearchParams();

  if (
    filtros.fecha_inicio
  ) {
    params.append(
      "fecha_inicio",
      filtros.fecha_inicio,
    );
  }

  if (
    filtros.fecha_fin
  ) {
    params.append(
      "fecha_fin",
      filtros.fecha_fin,
    );
  }

  if (
    filtros.estado_asignacion
  ) {
    params.append(
      "estado_asignacion",
      filtros.estado_asignacion,
    );
  }

  if (
    filtros.estado_vehiculo
  ) {
    params.append(
      "estado_vehiculo",
      filtros.estado_vehiculo,
    );
  }

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
}

function endpoint(
  tipo:
    TipoReporteAsignacion,

  formato:
    "html" |
    "pdf",
): string {
  return `/api/asignaciones-vehiculos/reportes/${tipo}/${formato}`;
}

export const asignacionReporteService = {
  async obtenerHtml(
    tipo:
      TipoReporteAsignacion,

    filtros:
      AsignacionReporteFiltros = {},
  ): Promise<string> {
    const response =
      await httpClient
        ._rawFetch(
          `${endpoint(
            tipo,
            "html",
          )}${queryString(
            filtros,
          )}`,
          "text/html",
          {
            timeoutMs:
              30_000,
          },
        );

    return response.text();
  },

  async descargarPdf(
    tipo:
      TipoReporteAsignacion,

    filtros:
      AsignacionReporteFiltros = {},
  ): Promise<Blob> {
    const response =
      await httpClient
        ._rawFetch(
          `${endpoint(
            tipo,
            "pdf",
          )}${queryString(
            filtros,
          )}`,
          "application/pdf",
          {
            timeoutMs:
              60_000,
          },
        );

    return response.blob();
  },
};
