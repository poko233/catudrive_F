import { httpClient } from "@/http/httpClient";
import { configCache, CK, TTL } from "@/cache/configCache";
import type {
  CategoriaVehiculo,
  CategoriaVehiculoResponse,
} from "../types/vehiculo.types";

export async function getCategoriasVehiculo(): Promise<CategoriaVehiculo[]> {
  return configCache.remember<CategoriaVehiculo[]>(
    CK.categoriasVehiculo(),
    TTL.lista,
    async () => {
      const response = await httpClient.getAuth<CategoriaVehiculoResponse>(
        "/api/categorias-vehiculo",
      );
      return response.data ?? [];
    },
  );
}

export async function createCategoriaVehiculo(
  categoria: string,
): Promise<CategoriaVehiculo> {
  const nueva = await httpClient.postAuth<CategoriaVehiculo>(
    "/api/categorias-vehiculo",
    { categoria },
  );
  configCache.invalidate(CK.categoriasVehiculo());
  return nueva;
}

export async function updateCategoriaVehiculo(
  id: number,
  categoria: string,
): Promise<CategoriaVehiculo> {
  const actualizada = await httpClient.putAuth<CategoriaVehiculo>(
    `/api/categorias-vehiculo/${id}`,
    { categoria },
  );
  configCache.invalidate(CK.categoriasVehiculo());
  return actualizada;
}

export async function deleteCategoriaVehiculo(id: number): Promise<void> {
  await httpClient.deleteAuth(`/api/categorias-vehiculo/${id}`);
  configCache.invalidate(CK.categoriasVehiculo());
}
