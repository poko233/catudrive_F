// screens/admin/empresa/services/empresaService.ts

import { TTL, configCache } from "@/cache/configCache";
import { httpClient } from "@/http/httpClient";
import { Platform } from "react-native";

import { useEmpresaStore } from "@/store/empresaStore";

import {
  Empresa,
  EmpresaApiResponse,
  EmpresaFormData,
  EmpresaImageType,
  EmpresaUploadFile,
  MiEmpresaApiResponse,
  MiEmpresaPayload,
} from "../types/empresa.types";

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

const EMPRESA_CACHE = {
  principal: "empresa:principal",
  detalle: (id: number) => `empresa:${id}`,
};

/*
|--------------------------------------------------------------------------
| API PÚBLICA DE INVALIDACIÓN
|--------------------------------------------------------------------------
|
| sucursalService necesita invalidar el caché de /mi-empresa tras
| un PATCH api-token. Exportamos un helper para no duplicar la
| clave literal en otro archivo.
|
*/

export function invalidarCacheMiEmpresa(): void {
  configCache.invalidate(EMPRESA_CACHE.principal);
}

export function invalidarCacheEmpresa(id?: number): void {
  const keys = [EMPRESA_CACHE.principal];
  if (id) keys.push(EMPRESA_CACHE.detalle(id));
  configCache.invalidate(...keys);
}

export function getEmpresaCache(): Empresa | null {
  return configCache.get<Empresa>(EMPRESA_CACHE.principal) ?? null;
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const empresaService = {
  /*
  |--------------------------------------------------------------------------
  | GET /api/empresa/mi-empresa
  |--------------------------------------------------------------------------
  |
  | Cachea el payload completo (empresa + sucursales) y sincroniza
  | el empresaStore (que descifra y guarda los tokens por sucursal).
  |
  | El llamador recibe el payload directo, sin el wrapper `data`.
  |
  */

  getMiEmpresa: async (
    options: { force?: boolean } = {},
  ): Promise<MiEmpresaPayload> => {
    const { force = false } = options;

    if (force) {
      invalidarCacheMiEmpresa();
    }

    const response = await configCache.remember<MiEmpresaApiResponse>(
      EMPRESA_CACHE.principal,
      TTL.lista,
      async () => {
        return httpClient.getAuth<MiEmpresaApiResponse>(
          "/api/empresa/mi-empresa",
          "Error al cargar información de empresa",
        );
      },
    );

    const payload: MiEmpresaPayload = {
      empresa: response.data.empresa,
      sucursales: response.data.sucursales,
    };

    // Sincronizar el store (descifra todos los tokens)
    useEmpresaStore.getState().setFromMiEmpresa(payload);

    // Cachear también detalle por id (compatibilidad con cualquier
    // consumidor que use la clave empresa:{id}).
    configCache.set(
      EMPRESA_CACHE.detalle(payload.empresa.id),
      payload.empresa,
      TTL.lista,
    );

    return payload;
  },

  /*
  |--------------------------------------------------------------------------
  | UPDATE / IMÁGENES
  |--------------------------------------------------------------------------
  |
  | El endpoint /empresa no devuelve api_token, pero SÍ invalida
  | el caché de /mi-empresa (los datos base pueden haber cambiado,
  | aunque no los tokens).
  |
  */

  update: async (id: number, data: EmpresaFormData): Promise<Empresa> => {
    const response = await httpClient.putAuth<EmpresaApiResponse>(
      `/api/empresa/${id}`,
      data,
      "Error al actualizar empresa",
    );

    invalidarCacheMiEmpresa();
    configCache.set(
      EMPRESA_CACHE.detalle(response.data.id),
      response.data,
      TTL.lista,
    );

    return response.data;
  },

  uploadImagen: async (
    id: number,
    tipo: EmpresaImageType,
    archivo: EmpresaUploadFile,
  ): Promise<Empresa> => {
    const formData = new FormData();

    if (Platform.OS === "web") {
      const fileResponse = await fetch(archivo.uri);
      if (!fileResponse.ok) {
        throw new Error("No se pudo preparar la imagen.");
      }
      const blob = await fileResponse.blob();
      const file = new File(
        [blob],
        archivo.name || `empresa-${Date.now()}.webp`,
        { type: archivo.type || blob.type || "image/webp" },
      );
      formData.append("imagen", file);
    } else {
      formData.append("imagen", {
        uri: archivo.uri,
        name: archivo.name || `empresa-${Date.now()}.webp`,
        type: archivo.type || "image/webp",
      } as unknown as Blob);
    }

    const response = await httpClient.postFormData<EmpresaApiResponse>(
      `/api/empresa/${id}/imagen/${tipo}`,
      formData,
    );

    invalidarCacheMiEmpresa();
    configCache.set(
      EMPRESA_CACHE.detalle(response.data.id),
      response.data,
      TTL.lista,
    );

    return response.data;
  },

  deleteImagen: async (
    id: number,
    tipo: EmpresaImageType,
  ): Promise<Empresa> => {
    const response = await httpClient.deleteAuth<EmpresaApiResponse>(
      `/api/empresa/${id}/imagen/${tipo}`,
      "Error al eliminar imagen",
    );

    invalidarCacheMiEmpresa();
    configCache.set(
      EMPRESA_CACHE.detalle(response.data.id),
      response.data,
      TTL.lista,
    );

    return response.data;
  },
};

export default empresaService;
