import { httpClient } from "@/http/httpClient";
import type {
  Vehiculo,
  VehiculoForm,
  VehiculoResponseCollection,
} from "../types/vehiculo.types";

export async function getVehiculos(): Promise<Vehiculo[]> {
  const response =
    await httpClient.getAuth<VehiculoResponseCollection>("/api/vehiculos");
  return response.data ?? [];
}

export async function getVehiculo(id: number): Promise<Vehiculo> {
  return httpClient.getAuth<Vehiculo>(`/api/vehiculos/${id}`);
}

export async function createVehiculo(form: VehiculoForm): Promise<Vehiculo> {
  return httpClient.postAuth<Vehiculo>("/api/vehiculos", form);
}

export async function updateVehiculo(
  id: number,
  form: VehiculoForm,
): Promise<Vehiculo> {
  return httpClient.putAuth<Vehiculo>(`/api/vehiculos/${id}`, form);
}

export async function deleteVehiculo(id: number): Promise<void> {
  await httpClient.deleteAuth(`/api/vehiculos/${id}`);
}
