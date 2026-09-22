import { httpClient } from "@/http/httpClient";
import type { ViajeEncomiendasResponse } from "../types/viaje-encomiendas.types";

export async function getEncomiendasViaje(
  idViaje: number,
): Promise<ViajeEncomiendasResponse> {
  return httpClient.getAuth<ViajeEncomiendasResponse>(
    `/api/pasajes/viajes/${idViaje}/encomiendas`,
    "No se pudieron cargar las encomiendas del viaje.",
  );
}
