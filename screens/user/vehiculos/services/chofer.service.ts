import { configCache, TTL } from "@/cache/configCache";
import { httpClient } from "@/http/httpClient";
import type { ChoferBusqueda } from "../types/vehiculo.types";

/*
|--------------------------------------------------------------------------
| CACHE KEYS
|--------------------------------------------------------------------------
*/

const CHOFER_CACHE = {
  activos: () => "choferes:activos",
};

interface ChoferesSearchResponse {
  choferes: ChoferBusqueda[];
}

/*
|--------------------------------------------------------------------------
| CACHE LISTA BASE
|--------------------------------------------------------------------------
*/

export function getChoferesActivosCache(): ChoferBusqueda[] | null {
  return configCache.get<ChoferBusqueda[]>(CHOFER_CACHE.activos()) ?? null;
}

function sincronizarChoferesActivosEnCache(choferes: ChoferBusqueda[]): void {
  configCache.set<ChoferBusqueda[]>(
    CHOFER_CACHE.activos(),
    choferes,
    TTL.lista,
  );
}

/*
|--------------------------------------------------------------------------
| OBTENER CHOFERES ACTIVOS (con caché)
|--------------------------------------------------------------------------
*/

export async function getChoferesActivos(
  options: { force?: boolean } = {},
): Promise<ChoferBusqueda[]> {
  const { force = false } = options;

  if (force) {
    configCache.invalidate(CHOFER_CACHE.activos());
  }

  const choferes = await configCache.remember<ChoferBusqueda[]>(
    CHOFER_CACHE.activos(),
    TTL.lista,
    async () => {
      const response = await httpClient.getAuth<ChoferesSearchResponse>(
        "/api/choferes/search",
        "No se pudieron cargar los choferes.",
      );
      return response.choferes ?? [];
    },
  );

  return choferes;
}

/*
|--------------------------------------------------------------------------
| BUSCAR CHOFERES (sin caché)
|--------------------------------------------------------------------------
*/

export async function buscarChoferes(
  termino: string,
): Promise<ChoferBusqueda[]> {
  const response = await httpClient.getAuth<ChoferesSearchResponse>(
    `/api/choferes/search?search=${encodeURIComponent(termino)}`,
    "No se pudieron buscar choferes.",
  );
  return response.choferes ?? [];
}
