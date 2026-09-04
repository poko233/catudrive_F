import {
  httpClient,
} from "@/http/httpClient";

import {
  AsignacionPayload,
  AsignacionResponse,
  AsignacionesResponse,
  CambioAsignacionResponse,
  CatalogosAsignacionResponse,
  FinalizarAsignacionPayload,
} from "../types/asignacionVehiculo.types";

/*
|--------------------------------------------------------------------------
| LISTAR
|--------------------------------------------------------------------------
*/

export async function getAsignacionesVehiculos():
  Promise<AsignacionesResponse> {
  return httpClient.getAuth<AsignacionesResponse>(
    "/api/asignaciones-vehiculos",

    "No se pudieron cargar las asignaciones.",
  );
}

/*
|--------------------------------------------------------------------------
| CATÁLOGOS
|--------------------------------------------------------------------------
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
| HISTORIAL
|--------------------------------------------------------------------------
*/

export async function getHistorialAsignaciones():
  Promise<AsignacionesResponse> {
  return httpClient.getAuth<AsignacionesResponse>(
    "/api/asignaciones-vehiculos/historial",

    "No se pudo cargar el historial de asignaciones.",
  );
}

/*
|--------------------------------------------------------------------------
| CREAR
|--------------------------------------------------------------------------
*/

export async function crearAsignacionVehiculo(
  payload:
    AsignacionPayload,
): Promise<AsignacionResponse> {
  return httpClient.postAuth<AsignacionResponse>(
    "/api/asignaciones-vehiculos",

    payload,

    "No se pudo registrar la asignación.",
  );
}

/*
|--------------------------------------------------------------------------
| CAMBIAR
|--------------------------------------------------------------------------
*/

export async function cambiarAsignacionVehiculo(
  id: number,

  payload:
    AsignacionPayload,
): Promise<CambioAsignacionResponse> {
  return httpClient.putAuth<CambioAsignacionResponse>(
    `/api/asignaciones-vehiculos/${id}/cambiar`,

    payload,

    "No se pudo cambiar la asignación.",
  );
}

/*
|--------------------------------------------------------------------------
| FINALIZAR
|--------------------------------------------------------------------------
*/

export async function finalizarAsignacionVehiculo(
  id: number,

  payload:
    FinalizarAsignacionPayload,
): Promise<AsignacionResponse> {
  return httpClient.putAuth<AsignacionResponse>(
    `/api/asignaciones-vehiculos/${id}/finalizar`,

    payload,

    "No se pudo finalizar la asignación.",
  );
}