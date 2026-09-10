import {
  httpClient,
} from "@/http/httpClient";

import {
  EncomiendaReporteFiltros,
  EncomiendaReporteResponse,
  TipoReporteEncomienda,
} from "../types/encmienda-reporte.types";

/*
|--------------------------------------------------------------------------
| QUERY STRING
|--------------------------------------------------------------------------
*/

function queryString(
  filtros:
    EncomiendaReporteFiltros,
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
    filtros.id_ruta !==
    undefined
  ) {
    params.append(
      "id_ruta",
      String(
        filtros.id_ruta,
      ),
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
| ENDPOINT JSON
|--------------------------------------------------------------------------
*/

function endpoint(
  tipo:
    TipoReporteEncomienda,
): string {
  switch (
    tipo
  ) {
    case "registradas":
      return "/api/encomiendas/reportes/registradas";

    case "pendientes":
      return "/api/encomiendas/reportes/pendientes";

    case "entregadas":
      return "/api/encomiendas/reportes/entregadas";

    case "por_destino":
      return "/api/encomiendas/reportes/por-destino";

    case "ingresos":
      return "/api/encomiendas/reportes/ingresos";
  }
}

/*
|--------------------------------------------------------------------------
| ENDPOINT EXPORTACIÓN
|--------------------------------------------------------------------------
*/

function endpointExportacion(
  tipo:
    TipoReporteEncomienda,

  formato:
    "html" |
    "pdf" |
    "csv",
): string {
  return `/api/encomiendas/reportes/${tipo}/${formato}`;
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const encomiendaReporteService = {
  async obtener(
    tipo:
      TipoReporteEncomienda,

    filtros:
      EncomiendaReporteFiltros = {},
  ): Promise<EncomiendaReporteResponse> {
    const url =
      `${endpoint(
        tipo,
      )}${queryString(
        filtros,
      )}`;

    return httpClient
      .getAuth<
        EncomiendaReporteResponse
      >(
        url,
        "Error al generar el reporte de encomiendas",
      );
  },

  async obtenerHtml(
    tipo:
      TipoReporteEncomienda,

    filtros:
      EncomiendaReporteFiltros = {},
  ): Promise<string> {
    const response =
      await httpClient
        ._rawFetch(
          `${endpointExportacion(
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
      TipoReporteEncomienda,

    filtros:
      EncomiendaReporteFiltros = {},
  ): Promise<Blob> {
    const response =
      await httpClient
        ._rawFetch(
          `${endpointExportacion(
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

  async descargarCsv(
    tipo:
      TipoReporteEncomienda,

    filtros:
      EncomiendaReporteFiltros = {},
  ): Promise<Blob> {
    const response =
      await httpClient
        ._rawFetch(
          `${endpointExportacion(
            tipo,
            "csv",
          )}${queryString(
            filtros,
          )}`,
          "text/csv",
          {
            timeoutMs:
              60_000,
          },
        );

    return response.blob();
  },
};
