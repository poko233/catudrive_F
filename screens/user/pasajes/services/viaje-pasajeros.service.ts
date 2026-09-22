import {
  httpClient,
} from "@/http/httpClient";

import type {
  ViajePasajerosResponse,
} from "../types/viaje-pasajeros.types";

/*
|--------------------------------------------------------------------------
| PASAJEROS DE UN VIAJE
|--------------------------------------------------------------------------
|
| Se consulta solamente cuando el usuario presiona el botón de pasajeros.
|
| No se cachea de forma persistente porque una venta puede registrarse,
| anularse o cambiar de asiento mientras la pantalla sigue abierta.
|
*/

export async function getPasajerosViaje(
  idViaje: number,
): Promise<ViajePasajerosResponse> {
  return httpClient.getAuth<ViajePasajerosResponse>(
    `/api/pasajes/viajes/${idViaje}/pasajeros`,

    "No se pudieron cargar los pasajeros del viaje.",
  );
}
