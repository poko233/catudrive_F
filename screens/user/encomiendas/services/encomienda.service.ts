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
  EncomiendasResponse,
} from "../types/encomienda.types";

/*
|--------------------------------------------------------------------------
| CACHE KEYS
|--------------------------------------------------------------------------
*/

const CACHE_KEYS = {
  lista:
    "encomiendas:list",
};

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
    force:
      boolean = false,
  ): Promise<
    Encomienda[]
  > {
    if (force) {
      configCache.invalidate(
        CACHE_KEYS.lista,
      );
    }

    return configCache.remember<
      Encomienda[]
    >(
      CACHE_KEYS.lista,

      TTL.lista,

      async () => {
        const response =
          await httpClient
            .getAuth<
              EncomiendasResponse
            >(
              "/api/encomiendas",

              "No se pudieron cargar las encomiendas",
            );

        return (
          response
            .encomiendas ??
          []
        );
      },
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

    configCache.invalidate(
      CACHE_KEYS.lista,
    );

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

    configCache.invalidate(
      CACHE_KEYS.lista,
    );

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

    configCache.invalidate(
      CACHE_KEYS.lista,
    );

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

    configCache.invalidate(
      CACHE_KEYS.lista,
    );

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

    configCache.invalidate(
      CACHE_KEYS.lista,
    );

    return response;
  },

  /*
  |--------------------------------------------------------------------------
  | GUARDAR LISTA
  |--------------------------------------------------------------------------
  */

  guardarLista(
    encomiendas:
      Encomienda[],
  ): void {
    configCache.set(
      CACHE_KEYS.lista,

      encomiendas,

      TTL.lista,
    );
  },

  /*
  |--------------------------------------------------------------------------
  | INVALIDAR CACHE
  |--------------------------------------------------------------------------
  */

  invalidarCache():
    void {
    configCache.invalidate(
      CACHE_KEYS.lista,
    );
  },
};