// screens/admin/empresa/services/empresaService.ts

import {
  TTL,
  configCache,
} from "@/cache/configCache";

import {
  httpClient,
} from "@/http/httpClient";

import {
  Platform,
} from "react-native";

import {
  Empresa,
  EmpresaApiResponse,
  EmpresaFormData,
  EmpresaImageType,
  EmpresaUploadFile,
} from "../types/empresa.types";

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

const EMPRESA_CACHE = {
  principal:
    "empresa:principal",

  detalle: (
    id: number,
  ) =>
    `empresa:${id}`,
};

/*
|--------------------------------------------------------------------------
| CACHE HELPERS
|--------------------------------------------------------------------------
*/

function guardarEmpresaEnCache(
  empresa: Empresa,
): void {
  configCache.set(
    EMPRESA_CACHE.principal,
    empresa,
    TTL.lista,
  );

  configCache.set(
    EMPRESA_CACHE.detalle(
      empresa.id,
    ),
    empresa,
    TTL.lista,
  );
}

export function getEmpresaCache():
  Empresa | null {
  return (
    configCache.get<Empresa>(
      EMPRESA_CACHE.principal,
    ) ?? null
  );
}

export function invalidarCacheEmpresa(
  id?: number,
): void {
  const keys = [
    EMPRESA_CACHE.principal,
  ];

  if (id) {
    keys.push(
      EMPRESA_CACHE.detalle(
        id,
      ),
    );
  }

  configCache.invalidate(
    ...keys,
  );
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const empresaService = {
  /*
  |--------------------------------------------------------------------------
  | EMPRESA PRINCIPAL
  |--------------------------------------------------------------------------
  */

  getMiEmpresa:
    async (
      options: {
        force?: boolean;
      } = {},
    ): Promise<Empresa> => {
      const {
        force = false,
      } =
        options;

      if (force) {
        invalidarCacheEmpresa();
      }

      return configCache.remember<Empresa>(
        EMPRESA_CACHE.principal,

        TTL.lista,

        async () => {
          const response =
            await httpClient.getAuth<EmpresaApiResponse>(
              "/api/empresa/mi-empresa",

              "Error al cargar información de empresa",
            );

          const empresa =
            response.data;

          /*
           * Dejamos también disponible
           * la clave de detalle.
           */

          configCache.set(
            EMPRESA_CACHE.detalle(
              empresa.id,
            ),
            empresa,
            TTL.lista,
          );

          return empresa;
        },
      );
    },

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR
  |--------------------------------------------------------------------------
  */

  update:
    async (
      id: number,
      data: EmpresaFormData,
    ): Promise<Empresa> => {
      const response =
        await httpClient.putAuth<EmpresaApiResponse>(
          `/api/empresa/${id}`,

          data,

          "Error al actualizar empresa",
        );

      guardarEmpresaEnCache(
        response.data,
      );

      return response.data;
    },

  /*
  |--------------------------------------------------------------------------
  | SUBIR IMAGEN
  |--------------------------------------------------------------------------
  */

  uploadImagen:
    async (
      id: number,
      tipo: EmpresaImageType,
      archivo: EmpresaUploadFile,
    ): Promise<Empresa> => {
      const formData =
        new FormData();

      /*
      |--------------------------------------------------------------------------
      | WEB
      |--------------------------------------------------------------------------
      */

      if (
        Platform.OS ===
        "web"
      ) {
        const fileResponse =
          await fetch(
            archivo.uri,
          );

        if (
          !fileResponse.ok
        ) {
          throw new Error(
            "No se pudo preparar la imagen.",
          );
        }

        const blob =
          await fileResponse.blob();

        const file =
          new File(
            [
              blob,
            ],

            archivo.name ||
              `empresa-${Date.now()}.webp`,

            {
              type:
                archivo.type ||
                blob.type ||
                "image/webp",
            },
          );

        formData.append(
          "imagen",
          file,
        );
      } else {
        /*
        |--------------------------------------------------------------------------
        | MOBILE
        |--------------------------------------------------------------------------
        */

        formData.append(
          "imagen",

          {
            uri:
              archivo.uri,

            name:
              archivo.name ||
              `empresa-${Date.now()}.webp`,

            type:
              archivo.type ||
              "image/webp",
          } as any,
        );
      }

      /*
      |--------------------------------------------------------------------------
      | REQUEST
      |--------------------------------------------------------------------------
      */

      const response =
        await httpClient.postFormData<EmpresaApiResponse>(
          `/api/empresa/${id}/imagen/${tipo}`,

          formData,
        );

      guardarEmpresaEnCache(
        response.data,
      );

      return response.data;
    },

  /*
  |--------------------------------------------------------------------------
  | ELIMINAR IMAGEN
  |--------------------------------------------------------------------------
  */

  deleteImagen:
    async (
      id: number,
      tipo: EmpresaImageType,
    ): Promise<Empresa> => {
      const response =
        await httpClient.deleteAuth<EmpresaApiResponse>(
          `/api/empresa/${id}/imagen/${tipo}`,

          "Error al eliminar imagen",
        );

      guardarEmpresaEnCache(
        response.data,
      );

      return response.data;
    },
};

export default empresaService;