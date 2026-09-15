import {
  httpClient,
} from "@/http/httpClient";

import {
  TipoReporteVehiculo,
  VehiculoReporteFiltros,
} from "../types/vehiculo-reporte.types";

/*
|--------------------------------------------------------------------------
| QUERY STRING
|--------------------------------------------------------------------------
*/

function queryString(
  filtros:
    VehiculoReporteFiltros,
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

  if (
    filtros.id_categoria !==
    undefined
  ) {
    params.append(
      "id_categoria",
      String(
        filtros.id_categoria,
      ),
    );
  }

  if (
    filtros.id_chofer !==
    undefined
  ) {
    params.append(
      "id_chofer",
      String(
        filtros.id_chofer,
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
|
| GET /api/vehiculos/reportes/{tipo}/html
| GET /api/vehiculos/reportes/{tipo}/pdf
|
*/

function endpoint(
  tipo:
    TipoReporteVehiculo,

  formato:
    "html" |
    "pdf",
): string {
  return `/api/vehiculos/reportes/${tipo}/${formato}`;
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
|
| NOTA: este módulo NO tiene endpoint JSON. Los reportes devuelven
| directamente HTML imprimible o PDF descargable. Por eso no existe
| `obtener()` aquí: la vista previa del modal se construye con la
| configuración estática + los filtros, y el HTML real lo pide el
| propio ReportPrintModal vía `obtenerHtml()`.
|
| Los reportes NO se cachean: son documentos generados bajo demanda
| con filtros variables (no catálogo compartido).
|
*/

export const vehiculoReporteService = {
  async obtenerHtml(
    tipo:
      TipoReporteVehiculo,

    filtros:
      VehiculoReporteFiltros = {},
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
      TipoReporteVehiculo,

    filtros:
      VehiculoReporteFiltros = {},
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
