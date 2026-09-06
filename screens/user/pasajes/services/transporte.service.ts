import { httpClient } from "@/http/httpClient";
import { configCache, TTL } from "@/cache/configCache";
import {
  VCRResponse,
  VehiculoChoferRuta,
} from "../types/pasajes.types";

const CACHE = {
  vcr: () => "transporte:vcr",
};

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