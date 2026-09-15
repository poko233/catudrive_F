import {
  httpClient,
} from "@/http/httpClient";

import {
  TipoReporteVentaAnalitico,
  VentaReporteFiltros,
} from "../types/venta-reporte.types";

/*
|--------------------------------------------------------------------------
| QUERY STRING (solo analíticos; la planilla no lee query params)
|--------------------------------------------------------------------------
*/

function queryString(
  filtros:
    VentaReporteFiltros,
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

  if (
    filtros.id_vehiculo !==
    undefined
  ) {
    params.append(
      "id_vehiculo",
      String(
        filtros.id_vehiculo,
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

  if (
    filtros.forma_pago
  ) {
    params.append(
      "forma_pago",
      filtros.forma_pago,
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
| ENDPOINTS
|--------------------------------------------------------------------------
|
| Analíticos: GET /api/pasajes/reportes/{tipo}/html|pdf
| Planilla:   GET /api/pasajes/reportes/planilla/{idViaje}/html|pdf
|
*/

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
|
| NOTA: este módulo NO tiene endpoint JSON. Los reportes devuelven
| directamente HTML imprimible o PDF descargable. La vista previa
| del modal se construye con la configuración estática + filtros,
| y el HTML real lo pide el propio ReportPrintModal.
|
| Los reportes NO se cachean: son documentos generados bajo demanda
| con filtros variables (no catálogo compartido).
|
*/

export const ventaReporteService = {
  async obtenerHtml(
    tipo:
      TipoReporteVentaAnalitico,

    filtros:
      VentaReporteFiltros = {},
  ): Promise<string> {
    const response =
      await httpClient
        ._rawFetch(
          `/api/pasajes/reportes/${tipo}/html${queryString(
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
      TipoReporteVentaAnalitico,

    filtros:
      VentaReporteFiltros = {},
  ): Promise<Blob> {
    const response =
      await httpClient
        ._rawFetch(
          `/api/pasajes/reportes/${tipo}/pdf${queryString(
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

  async obtenerHtmlPlanilla(
    idViaje:
      number,
  ): Promise<string> {
    const response =
      await httpClient
        ._rawFetch(
          `/api/pasajes/reportes/planilla/${idViaje}/html`,
          "text/html",
          {
            timeoutMs:
              30_000,
          },
        );

    return response.text();
  },

  async descargarPdfPlanilla(
    idViaje:
      number,
  ): Promise<Blob> {
    const response =
      await httpClient
        ._rawFetch(
          `/api/pasajes/reportes/planilla/${idViaje}/pdf`,
          "application/pdf",
          {
            timeoutMs:
              60_000,
          },
        );

    return response.blob();
  },
};
