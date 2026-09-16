import {
  httpClient,
} from "@/http/httpClient";

import {
  ChoferReporteFiltros,
  TipoReporteChofer,
} from "../types/chofer-reporte.types";

/*
|--------------------------------------------------------------------------
| QUERY STRING
|--------------------------------------------------------------------------
*/

function queryString(
  filtros:
    ChoferReporteFiltros,
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
    filtros.estado
  ) {
    params.append(
      "estado",
      filtros.estado,
    );
  }

  const query =
    params.toString();

  return query
    ? `?${query}`
    : "";
}

/*
|--------------------------------------------------------------------------
| ENDPOINT
|--------------------------------------------------------------------------
|
| GET /api/choferes/reportes/{tipo}/html
| GET /api/choferes/reportes/{tipo}/pdf
|
*/

function endpoint(
  tipo:
    TipoReporteChofer,

  formato:
    "html" |
    "pdf",
): string {
  return `/api/choferes/reportes/${tipo}/${formato}`;
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const choferReporteService = {
  async obtenerHtml(
    tipo:
      TipoReporteChofer,

    filtros:
      ChoferReporteFiltros = {},
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
      TipoReporteChofer,

    filtros:
      ChoferReporteFiltros = {},
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
