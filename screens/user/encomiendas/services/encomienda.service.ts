import {
  configCache,
  TTL,
} from "@/cache/configCache";

import {
  httpClient,
} from "@/http/httpClient";

import {
  AsignarEncomiendaPayload,
  Encomienda,
  EncomiendaCatalogos,
  EncomiendaMutationResponse,
  EncomiendaPayload,
  EncomiendaResponse,
  EncomiendaQrResponse,
  EncomiendaListFilters,
  EscanearEncomiendaQrPayload,
  EncomiendasResponse,
} from "../types/encomienda.types";

/*
|--------------------------------------------------------------------------
| CACHE KEYS
|--------------------------------------------------------------------------
*/

const CACHE_KEYS = {
  lista: (clave: string) =>
    `encomiendas:list:${clave}`,
};

const clavesListaEnCache = new Set<string>();

function claveLista(
  filtros: EncomiendaListFilters,
): string {
  return JSON.stringify({
    buscar: filtros.buscar?.trim() ?? "",
    estado: filtros.estado ?? "",
    page: filtros.page ?? 1,
    per_page: filtros.per_page ?? 15,
  });
}

function invalidarListas(): void {
  const claves = Array.from(
    clavesListaEnCache,
  ).map((clave) =>
    CACHE_KEYS.lista(clave),
  );

  if (claves.length > 0) {
    configCache.invalidate(
      ...claves,
    );
  }

  clavesListaEnCache.clear();
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const encomiendaService = {
  /*
  |--------------------------------------------------------------------------
  | LISTAR
  |--------------------------------------------------------------------------
  */

  async listar(
    filtros: EncomiendaListFilters = {},
    force = false,
  ): Promise<EncomiendasResponse> {
    if (force) {
      invalidarListas();
    }

    const params = new URLSearchParams();
    const buscar = filtros.buscar?.trim();

    if (buscar) {
      params.append(
        "buscar",
        buscar,
      );
    }

    if (filtros.estado) {
      params.append(
        "estado",
        filtros.estado,
      );
    }

    params.append(
      "page",
      String(filtros.page ?? 1),
    );

    params.append(
      "per_page",
      String(filtros.per_page ?? 15),
    );

    const query =
      params.toString();

    const clave =
      claveLista(filtros);

    clavesListaEnCache.add(
      clave,
    );

    return configCache.remember<EncomiendasResponse>(
      CACHE_KEYS.lista(clave),
      TTL.lista,
      () =>
        httpClient.getAuth<EncomiendasResponse>(
          `/api/encomiendas?${query}`,
          "No se pudieron cargar las encomiendas",
        ),
    );
  },

  /*
  |--------------------------------------------------------------------------
  | OBTENER
  |--------------------------------------------------------------------------
  */

  async obtener(
    id: number,
  ): Promise<
    Encomienda
  > {
    const response =
      await httpClient
        .getAuth<
          EncomiendaResponse
        >(
          `/api/encomiendas/${id}`,

          "No se pudo cargar la encomienda",
        );

    return response
      .encomienda;
  },

  /*
  |--------------------------------------------------------------------------
  | BUSCAR POR GUÍA
  |--------------------------------------------------------------------------
  */

  async buscarPorGuia(
    guia: string,
  ): Promise<
    Encomienda
  > {
    const valor =
      guia.trim();

    const response =
      await httpClient
        .getAuth<
          EncomiendaResponse
        >(
          `/api/encomiendas/guia/${encodeURIComponent(
            valor,
          )}`,

          "No se encontró la encomienda",
        );

    return response
      .encomienda;
  },

  /*
  |--------------------------------------------------------------------------
  | CATÁLOGOS
  |--------------------------------------------------------------------------
  */

  async catalogos():
    Promise<
      EncomiendaCatalogos
    > {
    return httpClient
      .getAuth<
        EncomiendaCatalogos
      >(
        "/api/encomiendas/catalogos",

        "No se pudieron cargar los datos para asignar la encomienda",
      );
  },

  /*
  |--------------------------------------------------------------------------
  | CREAR
  |--------------------------------------------------------------------------
  */

  async crear(
    payload:
      EncomiendaPayload,
  ): Promise<
    EncomiendaMutationResponse
  > {
    const response =
      await httpClient
        .postAuth<
          EncomiendaMutationResponse
        >(
          "/api/encomiendas",

          payload,

          "No se pudo registrar la encomienda",
        );

    invalidarListas();

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR
  |--------------------------------------------------------------------------
  */

  async actualizar(
    id: number,

    payload:
      EncomiendaPayload,
  ): Promise<
    EncomiendaMutationResponse
  > {
    const response =
      await httpClient
        .putAuth<
          EncomiendaMutationResponse
        >(
          `/api/encomiendas/${id}`,

          payload,

          "No se pudo actualizar la encomienda",
        );

    invalidarListas();

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | ASIGNAR
  |--------------------------------------------------------------------------
  */

  async asignar(
    id: number,

    payload:
      AsignarEncomiendaPayload,
  ): Promise<
    EncomiendaMutationResponse
  > {
    const response =
      await httpClient
        .putAuth<
          EncomiendaMutationResponse
        >(
          `/api/encomiendas/${id}/asignar`,

          payload,

          "No se pudo asignar la encomienda",
        );

    invalidarListas();

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | ENTREGAR
  |--------------------------------------------------------------------------
  */

  async entregar(
    id: number,
  ): Promise<
    EncomiendaMutationResponse
  > {
    const response =
      await httpClient
        .putAuth<
          EncomiendaMutationResponse
        >(
          `/api/encomiendas/${id}/entregar`,

          {},

          "No se pudo entregar la encomienda",
        );

    invalidarListas();

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | ANULAR
  |--------------------------------------------------------------------------
  */

  async anular(
    id: number,
  ): Promise<
    EncomiendaMutationResponse
  > {
    const response =
      await httpClient
        .putAuth<
          EncomiendaMutationResponse
        >(
          `/api/encomiendas/${id}/anular`,

          {},

          "No se pudo anular la encomienda",
        );

    invalidarListas();

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | OBTENER QR
  |--------------------------------------------------------------------------
  */

  async obtenerQr(
    id: number,
  ): Promise<
    EncomiendaQrResponse
  > {
    return httpClient
      .getAuth<
        EncomiendaQrResponse
      >(
        `/api/encomiendas/${id}/qr`,

        "No se pudo generar el QR de la encomienda",
      );
  },

  /*
  |--------------------------------------------------------------------------
  | ESCANEAR QR
  |--------------------------------------------------------------------------
  */

  async escanearQr(
    payload: EscanearEncomiendaQrPayload,
  ): Promise<
    Encomienda
  > {
    const response =
      await httpClient
        .postAuth<
          EncomiendaResponse
        >(
          "/api/encomiendas/qr/escanear",

          payload,

          "No se pudo consultar el QR de la encomienda",
        );

    return response.encomienda;
  },

  /*
  |--------------------------------------------------------------------------
  | HTML DE IMPRESIÓN QR
  |--------------------------------------------------------------------------
  */

  async obtenerTicketQrHtml(
    id: number,

    tipo: "etiqueta" | "comprobante" = "etiqueta",
  ): Promise<string> {
    const response =
      await httpClient._rawFetch(
        `/api/encomiendas/${id}/qr/ticket-html?tipo=${tipo}`,

        "text/html",

        { timeoutMs: 15000 },
      );

    return response.text();
  },

  /*
  |--------------------------------------------------------------------------
  | INVALIDAR CACHE
  |--------------------------------------------------------------------------
  */

  invalidarCache():
    void {
    invalidarListas();
  },
};