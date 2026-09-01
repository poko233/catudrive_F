import {
  httpClient,
} from "@http";

import {
  CK,
  TTL,
  configCache,
} from "../../../../cache/configCache";

import {
  CreateModuloPayload,
  Modulo,
  ReordenarModulosPayload,
  UpdateModuloPayload,
} from "../types/modulo.types";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function ordenarModulos(
  modulos: Modulo[],
): Modulo[] {
  return [
    ...modulos,
  ].sort(
    (
      a,
      b,
    ) => {
      const ordenA =
        Number(
          a.orden ??
            0,
        );

      const ordenB =
        Number(
          b.orden ??
            0,
        );

      if (
        ordenA !==
        ordenB
      ) {
        return (
          ordenA -
          ordenB
        );
      }

      return a.modulo.localeCompare(
        b.modulo,
        "es",
        {
          sensitivity:
            "base",
        },
      );
    },
  );
}

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

function invalidateModuloCache() {
  configCache.invalidate(
    CK.modulos(),
    CK.sidebar(),
  );
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const moduloService = {
  /*
  |--------------------------------------------------------------------------
  | LISTAR
  |--------------------------------------------------------------------------
  */

  getAll: async (
    options: {
      force?: boolean;
    } = {},
  ): Promise<Modulo[]> => {
    if (
      options.force
    ) {
      configCache.invalidate(
        CK.modulos(),
      );
    }

    const data =
      await configCache.remember<Modulo[]>(
        CK.modulos(),

        TTL.lista,

        async () => {
          const res =
            await httpClient
              .getAuth<{
                data: Modulo[];
              }>(
                "/api/modulos",

                "Error al cargar módulos",
              );

          return (
            res.data ??
            []
          );
        },
      );

    return ordenarModulos(
      data,
    );
  },

  /*
  |--------------------------------------------------------------------------
  | CREAR
  |--------------------------------------------------------------------------
  */

  create: async (
    payload:
      CreateModuloPayload,
  ): Promise<Modulo> => {
    const res =
      await httpClient
        .postAuth<{
          data?: Modulo;
          modulo?: Modulo;
        }>(
          "/api/modulos",

          payload,

          "Error al crear módulo",
        );

    const modulo =
      res.data ??
      res.modulo;

    if (
      !modulo
    ) {
      throw new Error(
        "El servidor no devolvió el módulo creado.",
      );
    }

    invalidateModuloCache();

    return modulo;
  },

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR
  |--------------------------------------------------------------------------
  */

  update: async (
    id: number,

    payload:
      UpdateModuloPayload,
  ): Promise<Modulo> => {
    const res =
      await httpClient
        .putAuth<{
          data?: Modulo;
          modulo?: Modulo;
        }>(
          `/api/modulos/${id}`,

          payload,

          "Error al actualizar módulo",
        );

    const modulo =
      res.data ??
      res.modulo;

    if (
      !modulo
    ) {
      throw new Error(
        "El servidor no devolvió el módulo actualizado.",
      );
    }

    invalidateModuloCache();

    return modulo;
  },

  /*
  |--------------------------------------------------------------------------
  | REORDENAR
  |--------------------------------------------------------------------------
  */

  reorder: async (
    moduloIds:
      number[],
  ): Promise<Modulo[]> => {
    const payload:
      ReordenarModulosPayload =
      {
        modulo_ids:
          moduloIds,
      };

    const res =
      await httpClient
        .putAuth<{
          data: Modulo[];
        }>(
          "/api/modulos/orden",

          payload,

          "No se pudo guardar el orden de los módulos.",
        );

    invalidateModuloCache();

    return ordenarModulos(
      res.data ??
        [],
    );
  },

  /*
  |--------------------------------------------------------------------------
  | ELIMINAR
  |--------------------------------------------------------------------------
  */

  delete: async (
    id: number,
  ): Promise<void> => {
    await httpClient
      .deleteAuth(
        `/api/modulos/${id}`,

        "Error al eliminar módulo",
      );

    invalidateModuloCache();
  },
};

export default moduloService;