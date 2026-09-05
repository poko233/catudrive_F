import { httpClient } from "@/http/httpClient";
import { configCache, TTL } from "@/cache/configCache";
import {
  AsignacionesResponse,
  RutasResponse,
  VCRResponse,
  Asignacion,
  VehiculoChoferRuta,
} from "../types/pasajes.types";

const CACHE = {
  asignaciones: () => "transporte:asignaciones",
  rutas: () => "transporte:rutas",
  vcr: () => "transporte:vcr",
};

export async function getAsignaciones(params?: {
  estado?: string;
  buscar?: string;
  per_page?: number;
}): Promise<AsignacionesResponse> {
  const qs = new URLSearchParams();
  if (params?.estado) qs.append("estado", params.estado);
  if (params?.buscar) qs.append("buscar", params.buscar);
  if (params?.per_page) qs.append("per_page", String(params.per_page));
  const url = `/api/pasajes/asignaciones${qs.toString() ? `?${qs.toString()}` : ""}`;
  return configCache.remember(CACHE.asignaciones(), TTL.lista, () =>
    httpClient.getAuth<AsignacionesResponse>(
      url,
      "Error al cargar asignaciones",
    ),
  );
}

export async function crearAsignacion(payload: {
  id_chofer: number;
  id_vehiculo: number;
  fecha_asignacion: string;
  fecha_finalizacion?: string | null;
  observacion?: string | null;
  estado: string;
}): Promise<Asignacion> {
  const response = await httpClient.postAuth<{ data: Asignacion }>(
    "/api/pasajes/asignaciones",
    payload,
    "Error al crear asignación",
  );
  configCache.invalidate(CACHE.asignaciones());
  return response.data;
}

export async function getRutas(params?: {
  origen?: string;
  destino?: string;
  estado?: string;
  per_page?: number;
}): Promise<RutasResponse> {
  const qs = new URLSearchParams();
  if (params?.origen) qs.append("origen", params.origen);
  if (params?.destino) qs.append("destino", params.destino);
  if (params?.estado) qs.append("estado", params.estado);
  if (params?.per_page) qs.append("per_page", String(params.per_page));
  const url = `/api/pasajes/rutas${qs.toString() ? `?${qs.toString()}` : ""}`;
  return configCache.remember(CACHE.rutas(), TTL.lista, () =>
    httpClient.getAuth<RutasResponse>(url, "Error al cargar rutas"),
  );
}

export async function getVCR(params?: {
  id_asignacion?: number;
  id_ruta?: number;
  per_page?: number;
}): Promise<VCRResponse> {
  const qs = new URLSearchParams();
  if (params?.id_asignacion)
    qs.append("id_asignacion", String(params.id_asignacion));
  if (params?.id_ruta) qs.append("id_ruta", String(params.id_ruta));
  if (params?.per_page) qs.append("per_page", String(params.per_page));
  const url = `/api/pasajes/vehiculo-chofer-ruta${qs.toString() ? `?${qs.toString()}` : ""}`;
  return configCache.remember(CACHE.vcr(), TTL.lista, () =>
    httpClient.getAuth<VCRResponse>(url, "Error al cargar relaciones"),
  );
}

export async function crearVCR(payload: {
  id_asignacion_vehiculo_chofer: number;
  id_ruta: number;
  hora_inicio?: string | null;
}): Promise<VehiculoChoferRuta> {
  const response = await httpClient.postAuth<{ data: VehiculoChoferRuta }>(
    "/api/pasajes/vehiculo-chofer-ruta",
    payload,
    "Error al crear relación",
  );
  configCache.invalidate(CACHE.vcr());
  return response.data;
}
