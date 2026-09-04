import { configCache, TTL } from "@/cache/configCache";
import { httpClient } from "@/http/httpClient";
import type {
  CategoriaVehiculo,
  CategoriaVehiculoResponse,
} from "../types/vehiculo.types";

/*
|--------------------------------------------------------------------------
| CACHE KEYS
|--------------------------------------------------------------------------
*/

const CATEGORIA_VEHICULO_CACHE = {
  listado: () => "categorias-vehiculo:listado",
};

/*
|--------------------------------------------------------------------------
| CACHE LISTADO
|--------------------------------------------------------------------------
*/

export function getCategoriasVehiculoCache(): CategoriaVehiculoResponse | null {
  return (
    configCache.get<CategoriaVehiculoResponse>(
      CATEGORIA_VEHICULO_CACHE.listado(),
    ) ?? null
  );
}

/*
|--------------------------------------------------------------------------
| SINCRONIZAR CACHE (write-through)
|--------------------------------------------------------------------------
*/

function sincronizarCategoriasEnCache(categorias: CategoriaVehiculo[]): void {
  configCache.set<CategoriaVehiculoResponse>(
    CATEGORIA_VEHICULO_CACHE.listado(),
    { data: categorias },
    TTL.lista,
  );
}

/*
|--------------------------------------------------------------------------
| LISTAR
|--------------------------------------------------------------------------
*/

export async function getCategoriasVehiculo(
  options: { force?: boolean } = {},
): Promise<CategoriaVehiculo[]> {
  const { force = false } = options;

  if (force) {
    configCache.invalidate(CATEGORIA_VEHICULO_CACHE.listado());
  }

  const response = await configCache.remember<CategoriaVehiculoResponse>(
    CATEGORIA_VEHICULO_CACHE.listado(),
    TTL.lista,
    () =>
      httpClient.getAuth<CategoriaVehiculoResponse>(
        "/api/categorias-vehiculo",
        "No se pudieron cargar las categorías de vehículo.",
      ),
  );

  return response.data ?? [];
}

/*
|--------------------------------------------------------------------------
| CREAR
|--------------------------------------------------------------------------
*/

export async function createCategoriaVehiculo(
  categoria: string,
): Promise<CategoriaVehiculo> {
  const response = await httpClient.postAuth<CategoriaVehiculo>(
    "/api/categorias-vehiculo",
    { categoria },
    "No se pudo crear la categoría.",
  );

  // Refrescamos la caché forzando una recarga
  await getCategoriasVehiculo({ force: true });

  return response;
}

/*
|--------------------------------------------------------------------------
| ACTUALIZAR
|--------------------------------------------------------------------------
*/

export async function updateCategoriaVehiculo(
  id: number,
  categoria: string,
): Promise<CategoriaVehiculo> {
  const response = await httpClient.putAuth<CategoriaVehiculo>(
    `/api/categorias-vehiculo/${id}`,
    { categoria },
    "No se pudo actualizar la categoría.",
  );

  await getCategoriasVehiculo({ force: true });

  return response;
}

/*
|--------------------------------------------------------------------------
| ELIMINAR
|--------------------------------------------------------------------------
*/

export async function deleteCategoriaVehiculo(id: number): Promise<void> {
  await httpClient.deleteAuth(
    `/api/categorias-vehiculo/${id}`,
    "No se pudo eliminar la categoría.",
  );

  await getCategoriasVehiculo({ force: true });
}
