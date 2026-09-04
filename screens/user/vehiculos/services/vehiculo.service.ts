import { configCache, TTL } from "@/cache/configCache";
import { httpClient } from "@/http/httpClient";
import type {
  Vehiculo,
  VehiculoForm,
  VehiculoResponse,
  VehiculoCollectionResponse,
} from "../types/vehiculo.types";

/*
|--------------------------------------------------------------------------
| CACHE KEYS
|--------------------------------------------------------------------------
*/

const VEHICULO_CACHE = {
  listado: () => "vehiculos:listado",
  detalle: (id: number) => `vehiculos:detalle:${id}`,
};

/*
|--------------------------------------------------------------------------
| CACHE LISTADO
|--------------------------------------------------------------------------
*/

export function getVehiculosCache(): VehiculoCollectionResponse | null {
  return (
    configCache.get<VehiculoCollectionResponse>(VEHICULO_CACHE.listado()) ??
    null
  );
}

export function getVehiculoDetalleCache(id: number): VehiculoResponse | null {
  return configCache.get<VehiculoResponse>(VEHICULO_CACHE.detalle(id)) ?? null;
}

/*
|--------------------------------------------------------------------------
| SINCRONIZAR EN CACHÉ (write-through)
|--------------------------------------------------------------------------
*/

function sincronizarVehiculoEnCache(vehiculo: Vehiculo): void {
  /*
  |--------------------------------------------------------------------------
  | DETALLE
  |--------------------------------------------------------------------------
  */
  configCache.set<VehiculoResponse>(
    VEHICULO_CACHE.detalle(vehiculo.id),
    { data: vehiculo },
    TTL.lista,
  );

  /*
  |--------------------------------------------------------------------------
  | LISTADO
  |--------------------------------------------------------------------------
  */
  const listado = getVehiculosCache();
  if (!listado) return;

  const existe = listado.data.some((actual) => actual.id === vehiculo.id);
  const vehiculos = existe
    ? listado.data.map((actual) =>
        actual.id === vehiculo.id ? vehiculo : actual,
      )
    : [vehiculo, ...listado.data];

  configCache.set<VehiculoCollectionResponse>(
    VEHICULO_CACHE.listado(),
    { data: vehiculos },
    TTL.lista,
  );
}

/*
|--------------------------------------------------------------------------
| INVALIDAR CACHÉ
|--------------------------------------------------------------------------
*/

export function invalidarCacheVehiculos(): void {
  const listado = getVehiculosCache();
  const detalles = (listado?.data ?? []).map((vehiculo) =>
    VEHICULO_CACHE.detalle(vehiculo.id),
  );

  configCache.invalidate(VEHICULO_CACHE.listado(), ...detalles);
}

/*
|--------------------------------------------------------------------------
| LISTAR
|--------------------------------------------------------------------------
*/

export async function getVehiculos(
  options: { force?: boolean } = {},
): Promise<Vehiculo[]> {
  const { force = false } = options;

  if (force) {
    invalidarCacheVehiculos();
  }

  const response = await configCache.remember<VehiculoCollectionResponse>(
    VEHICULO_CACHE.listado(),
    TTL.lista,
    () =>
      httpClient.getAuth<VehiculoCollectionResponse>(
        "/api/vehiculos",
        "No se pudieron cargar los vehículos.",
      ),
  );

  return response.data ?? [];
}

/*
|--------------------------------------------------------------------------
| DETALLE
|--------------------------------------------------------------------------
*/

export async function getVehiculo(
  id: number,
  options: { force?: boolean } = {},
): Promise<Vehiculo> {
  const key = VEHICULO_CACHE.detalle(id);

  if (options.force) {
    configCache.invalidate(key);
  }

  const response = await configCache.remember<VehiculoResponse>(
    key,
    TTL.lista,
    () =>
      httpClient.getAuth<VehiculoResponse>(
        `/api/vehiculos/${id}`,
        "No se pudo cargar el vehículo.",
      ),
  );

  return response.data;
}

/*
|--------------------------------------------------------------------------
| CREAR
|--------------------------------------------------------------------------
*/

export async function crearVehiculo(form: VehiculoForm): Promise<Vehiculo> {
  const response = await httpClient.postAuth<VehiculoResponse>(
    "/api/vehiculos",
    form,
    "No se pudo registrar el vehículo.",
  );

  sincronizarVehiculoEnCache(response.data);

  return response.data;
}

/*
|--------------------------------------------------------------------------
| ACTUALIZAR
|--------------------------------------------------------------------------
*/

export async function actualizarVehiculo(
  id: number,
  form: VehiculoForm,
): Promise<Vehiculo> {
  const response = await httpClient.putAuth<VehiculoResponse>(
    `/api/vehiculos/${id}`,
    form,
    "No se pudo actualizar el vehículo.",
  );

  sincronizarVehiculoEnCache(response.data);

  return response.data;
}

/*
|--------------------------------------------------------------------------
| BAJA LÓGICA
|--------------------------------------------------------------------------
*/

export async function darBajaVehiculo(id: number): Promise<Vehiculo> {
  const response = await httpClient.deleteAuth<VehiculoResponse>(
    `/api/vehiculos/${id}`,
    "No se pudo dar de baja el vehículo.",
  );

  sincronizarVehiculoEnCache(response.data);

  return response.data;
}
