import {
  configCache,
  TTL,
} from "@/cache/configCache";

import {
  httpClient,
} from "@/http/httpClient";

import {
  Asignacion,
  AsignacionPayload,
  AsignacionResponse,
  AsignacionesResponse,
  CambioAsignacionResponse,
  CatalogosAsignacionResponse,
  FinalizarAsignacionPayload,
} from "../types/asignacionVehiculo.types";

/*
|--------------------------------------------------------------------------
| CACHE KEYS
|--------------------------------------------------------------------------
|
| No modificamos configCache.ts.
|
| Las claves viven únicamente dentro
| del módulo de asignaciones.
|
*/

const ASIGNACIONES_LIST_CACHE_KEY =
  "asignaciones-vehiculos:list";

const ASIGNACIONES_HISTORIAL_CACHE_KEY =
  "asignaciones-vehiculos:historial";

/*
|--------------------------------------------------------------------------
| LISTAR ASIGNACIONES
|--------------------------------------------------------------------------
|
| force = false
|      ↓
| usa caché si existe
|
| force = true
|      ↓
| invalida
|      ↓
| GET real
|
*/

export async function getAsignacionesVehiculos(
  force = false,
): Promise<Asignacion[]> {
  /*
  |--------------------------------------------------------------------------
  | FORZAR ACTUALIZACIÓN
  |--------------------------------------------------------------------------
  */

  if (force) {
    configCache.invalidate(
      ASIGNACIONES_LIST_CACHE_KEY,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CACHE
  |--------------------------------------------------------------------------
  */

  return configCache.remember<Asignacion[]>(
    ASIGNACIONES_LIST_CACHE_KEY,

    TTL.lista,

    async () => {
      const response =
        await httpClient.getAuth<AsignacionesResponse>(
          "/api/asignaciones-vehiculos",

          "No se pudieron cargar las asignaciones.",
        );

      return (
        response.asignaciones ??
        []
      );
    },
  );
}

/*
|--------------------------------------------------------------------------
| ESCRIBIR CACHE DEL LISTADO
|--------------------------------------------------------------------------
|
| Después de un POST / PUT actualizamos
| la pantalla localmente.
|
| Con esta función guardamos exactamente
| ese mismo estado actualizado en caché.
|
| Así, si salimos de la vista y volvemos,
| tampoco necesitamos hacer otro GET.
|
*/

export function setAsignacionesVehiculosCache(
  asignaciones:
    Asignacion[],
): void {
  configCache.set(
    ASIGNACIONES_LIST_CACHE_KEY,

    asignaciones,

    TTL.lista,
  );
}

/*
|--------------------------------------------------------------------------
| HISTORIAL
|--------------------------------------------------------------------------
*/

export async function getHistorialAsignaciones(
  force = false,
): Promise<Asignacion[]> {
  if (force) {
    configCache.invalidate(
      ASIGNACIONES_HISTORIAL_CACHE_KEY,
    );
  }

  return configCache.remember<Asignacion[]>(
    ASIGNACIONES_HISTORIAL_CACHE_KEY,

    TTL.lista,

    async () => {
      const response =
        await httpClient.getAuth<AsignacionesResponse>(
          "/api/asignaciones-vehiculos/historial",

          "No se pudo cargar el historial de asignaciones.",
        );

      return (
        response.asignaciones ??
        []
      );
    },
  );
}

/*
|--------------------------------------------------------------------------
| CATÁLOGOS
|--------------------------------------------------------------------------
|
| IMPORTANTE:
|
| NO USAMOS CACHE.
|
| Estos datos representan disponibilidad
| en tiempo real.
|
| Un chofer puede pasar de:
|
| disponible
|     ↓
| ocupado
|
| inmediatamente después de una asignación.
|
*/

export async function getCatalogosAsignacion(
  asignacionId?: number,
): Promise<CatalogosAsignacionResponse> {
  const query =
    asignacionId
      ? `?asignacion_id=${asignacionId}`
      : "";

  return httpClient.getAuth<CatalogosAsignacionResponse>(
    `/api/asignaciones-vehiculos/catalogos${query}`,

    "No se pudieron cargar los choferes y vehículos disponibles.",
  );
}

/*
|--------------------------------------------------------------------------
| CREAR ASIGNACIÓN
|--------------------------------------------------------------------------
*/

export async function crearAsignacionVehiculo(
  payload:
    AsignacionPayload,
): Promise<AsignacionResponse> {
  const response =
    await httpClient.postAuth<AsignacionResponse>(
      "/api/asignaciones-vehiculos",

      payload,

      "No se pudo registrar la asignación.",
    );

  /*
  |--------------------------------------------------------------------------
  | INVALIDAR
  |--------------------------------------------------------------------------
  |
  | El Hook volverá a guardar el listado actualizado.
  |
  */

  configCache.invalidate(
    ASIGNACIONES_LIST_CACHE_KEY,

    ASIGNACIONES_HISTORIAL_CACHE_KEY,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| CAMBIAR ASIGNACIÓN
|--------------------------------------------------------------------------
*/

export async function cambiarAsignacionVehiculo(
  id: number,

  payload:
    AsignacionPayload,
): Promise<CambioAsignacionResponse> {
  const response =
    await httpClient.putAuth<CambioAsignacionResponse>(
      `/api/asignaciones-vehiculos/${id}/cambiar`,

      payload,

      "No se pudo cambiar la asignación.",
    );

  /*
  |--------------------------------------------------------------------------
  | INVALIDAR
  |--------------------------------------------------------------------------
  |
  | El cambio genera:
  |
  | asignación anterior → FINALIZADA
  | nueva asignación    → ACTIVA
  |
  */

  configCache.invalidate(
    ASIGNACIONES_LIST_CACHE_KEY,

    ASIGNACIONES_HISTORIAL_CACHE_KEY,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| FINALIZAR ASIGNACIÓN
|--------------------------------------------------------------------------
*/

export async function finalizarAsignacionVehiculo(
  id: number,

  payload:
    FinalizarAsignacionPayload,
): Promise<AsignacionResponse> {
  const response =
    await httpClient.putAuth<AsignacionResponse>(
      `/api/asignaciones-vehiculos/${id}/finalizar`,

      payload,

      "No se pudo finalizar la asignación.",
    );

  /*
  |--------------------------------------------------------------------------
  | INVALIDAR
  |--------------------------------------------------------------------------
  */

  configCache.invalidate(
    ASIGNACIONES_LIST_CACHE_KEY,

    ASIGNACIONES_HISTORIAL_CACHE_KEY,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| INVALIDAR CACHE PÚBLICAMENTE
|--------------------------------------------------------------------------
*/

export function invalidateAsignacionesVehiculosCache(): void {
  configCache.invalidate(
    ASIGNACIONES_LIST_CACHE_KEY,

    ASIGNACIONES_HISTORIAL_CACHE_KEY,
  );
}