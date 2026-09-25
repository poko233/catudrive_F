import { httpClient } from "@/http/httpClient";
import type { Pasajero } from "../types/pasajes.types";

export interface CrearPasajeroPayload {
  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;
  ci?: string | null;
}

interface PasajerosResponse {
  pasajeros: Pasajero[];
}

interface PasajeroResponse {
  message: string;
  pasajero: Pasajero;
}

export const pasajeroService = {
  async buscar(buscar = ""): Promise<Pasajero[]> {
    const params = new URLSearchParams();
    const termino = buscar.trim();

    if (termino) {
      params.append("buscar", termino);
    }

    params.append("limite", "50");

    const response =
      await httpClient.getAuth<PasajerosResponse>(
        `/api/pasajes/pasajeros?${params.toString()}`,
        "No se pudieron cargar los pasajeros.",
      );

    return response.pasajeros ?? [];
  },

  async crear(
    payload: CrearPasajeroPayload,
  ): Promise<Pasajero> {
    const response =
      await httpClient.postAuth<PasajeroResponse>(
        "/api/pasajes/pasajeros",
        payload,
        "No se pudo registrar el pasajero.",
      );

    return response.pasajero;
  },
};

export default pasajeroService;
