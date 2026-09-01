// screens/admin/empresa/services/sucursalService.ts

import {
  TTL,
  configCache,
} from "@/cache/configCache";

import {
  httpClient,
} from "@/http/httpClient";

import {
  EstadoSucursal,
  Sucursal,
  SucursalApiResponse,
  SucursalFormData,
  SucursalListFilters,
  SucursalPaginatedResponse,
} from "../types/sucursal.types";

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

const listCacheKeys =
  new Set<string>();

const SUCURSAL_CACHE = {
  detalle: (
    id: number,
  ) =>
    `sucursal:${id}`,

  listado: (
    filters:
      SucursalListFilters,
  ) => {
    const empresa =
      filters.id_empresa ??
      "all";

    const estado =
      filters.estado ||
      "all";

    const buscar =
      (
        filters.buscar ??
        ""
      )
        .trim()
        .toLowerCase();

    const page =
      filters.page ??
      1;

    const perPage =
      filters.por_pagina ??
      15;

    return [
      "sucursales",
      empresa,
      estado,
      encodeURIComponent(
        buscar,
      ),
      page,
      perPage,
    ].join(":");
  },
};

/*
|--------------------------------------------------------------------------
| INVALIDAR LISTADOS
|--------------------------------------------------------------------------
*/

function invalidarListados(): void {
  if (
    listCacheKeys.size ===
    0
  ) {
    return;
  }

  configCache.invalidate(
    ...Array.from(
      listCacheKeys,
    ),
  );

  listCacheKeys.clear();
}

/*
|--------------------------------------------------------------------------
| DETALLE CACHE
|--------------------------------------------------------------------------
*/

function guardarDetalle(
  sucursal: Sucursal,
): void {
  configCache.set(
    SUCURSAL_CACHE.detalle(
      sucursal.id,
    ),

    sucursal,

    TTL.lista,
  );
}

/*
|--------------------------------------------------------------------------
| CACHE PÁGINA
|--------------------------------------------------------------------------
*/

export function getSucursalListCache(
  filters:
    SucursalListFilters,
):
  | SucursalPaginatedResponse
  | null {
  const key =
    SUCURSAL_CACHE.listado(
      filters,
    );

  return (
    configCache.get<SucursalPaginatedResponse>(
      key,
    ) ?? null
  );
}

export function setSucursalListCache(
  filters:
    SucursalListFilters,

  response:
    SucursalPaginatedResponse,
): void {
  const key =
    SUCURSAL_CACHE.listado(
      filters,
    );

  listCacheKeys.add(
    key,
  );

  configCache.set(
    key,
    response,
    TTL.lista,
  );
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const sucursalService = {
  /*
  |--------------------------------------------------------------------------
  | LISTADO
  |--------------------------------------------------------------------------
  */

  list:
    async (
      filters:
        SucursalListFilters = {},

      options: {
        force?: boolean;
      } = {},
    ): Promise<SucursalPaginatedResponse> => {
      const {
        force = false,
      } =
        options;

      const key =
        SUCURSAL_CACHE.listado(
          filters,
        );

      listCacheKeys.add(
        key,
      );

      if (force) {
        configCache.invalidate(
          key,
        );
      }

      return configCache.remember<SucursalPaginatedResponse>(
        key,

        TTL.lista,

        async () => {
          const params =
            new URLSearchParams();

          if (
            filters.id_empresa
          ) {
            params.append(
              "id_empresa",
              String(
                filters.id_empresa,
              ),
            );
          }

          if (
            filters.estado
          ) {
            params.append(
              "estado",
              filters.estado,
            );
          }

          if (
            filters.buscar
          ) {
            params.append(
              "buscar",
              filters.buscar,
            );
          }

          if (
            filters.por_pagina
          ) {
            params.append(
              "por_pagina",
              String(
                filters.por_pagina,
              ),
            );
          }

          if (
            filters.page
          ) {
            params.append(
              "page",
              String(
                filters.page,
              ),
            );
          }

          const query =
            params.toString();

          return httpClient.getAuth<SucursalPaginatedResponse>(
            `/api/sucursales${
              query
                ? `?${query}`
                : ""
            }`,

            "Error al cargar sucursales",
          );
        },
      );
    },

  /*
  |--------------------------------------------------------------------------
  | DETALLE
  |--------------------------------------------------------------------------
  */

  get:
    async (
      id: number,
    ): Promise<Sucursal> => {
      const key =
        SUCURSAL_CACHE.detalle(
          id,
        );

      return configCache.remember<Sucursal>(
        key,

        TTL.lista,

        async () => {
          const response =
            await httpClient.getAuth<SucursalApiResponse>(
              `/api/sucursales/${id}`,

              "Error al cargar sucursal",
            );

          return response.data;
        },
      );
    },

  /*
  |--------------------------------------------------------------------------
  | CREAR
  |--------------------------------------------------------------------------
  */

  create:
    async (
      data:
        SucursalFormData,
    ): Promise<Sucursal> => {
      const response =
        await httpClient.postAuth<SucursalApiResponse>(
          "/api/sucursales",

          data,

          "Error al crear sucursal",
        );

      invalidarListados();

      guardarDetalle(
        response.data,
      );

      return response.data;
    },

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR
  |--------------------------------------------------------------------------
  */

  update:
    async (
      id: number,
      data:
        Partial<SucursalFormData>,
    ): Promise<Sucursal> => {
      const response =
        await httpClient.putAuth<SucursalApiResponse>(
          `/api/sucursales/${id}`,

          data,

          "Error al actualizar sucursal",
        );

      invalidarListados();

      guardarDetalle(
        response.data,
      );

      return response.data;
    },

  /*
  |--------------------------------------------------------------------------
  | ELIMINAR
  |--------------------------------------------------------------------------
  */

  delete:
    async (
      id: number,
    ): Promise<void> => {
      await httpClient.deleteAuth(
        `/api/sucursales/${id}`,

        "Error al eliminar sucursal",
      );

      invalidarListados();

      configCache.invalidate(
        SUCURSAL_CACHE.detalle(
          id,
        ),
      );
    },

  /*
  |--------------------------------------------------------------------------
  | ESTADO
  |--------------------------------------------------------------------------
  */

  toggleEstado:
    async (
      id: number,
      estado:
        EstadoSucursal,
    ): Promise<Sucursal> => {
      const response =
        await httpClient.putAuth<SucursalApiResponse>(
          `/api/sucursales/${id}`,

          {
            estado,
          },

          "Error al cambiar estado",
        );

      invalidarListados();

      guardarDetalle(
        response.data,
      );

      return response.data;
    },
};

export default sucursalService;