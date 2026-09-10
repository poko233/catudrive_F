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
| ENDPOINT
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
};