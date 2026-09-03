import {
  configCache,
  TTL,
} from "@/cache/configCache";

import {
  httpClient,
} from "@/http/httpClient";

import {
  Ruta,
  RutaPayload,
  RutaResponse,
  RutasResponse,
} from "../types/ruta.types";

/*
|--------------------------------------------------------------------------
| CACHE KEYS
|--------------------------------------------------------------------------
*/

const RUTA_CACHE = {
  listado: () =>
    "rutas:listado",

  detalle: (
    id: number,
  ) =>
    `rutas:detalle:${id}`,
};

/*
|--------------------------------------------------------------------------
| CACHE LISTADO
|--------------------------------------------------------------------------
*/

export function getRutasCache():
  RutasResponse | null {
  return (
    configCache.get<RutasResponse>(
      RUTA_CACHE.listado(),
    ) ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| CACHE DETALLE
|--------------------------------------------------------------------------
*/

export function getRutaCache(
  id: number,
): RutaResponse | null {
  return (
    configCache.get<RutaResponse>(
      RUTA_CACHE.detalle(
        id,
      ),
    ) ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| WRITE THROUGH
|--------------------------------------------------------------------------
*/

function sincronizarRutaEnCache(
  ruta: Ruta,
): void {
  /*
  |--------------------------------------------------------------------------
  | DETALLE
  |--------------------------------------------------------------------------
  */

  configCache.set<RutaResponse>(
    RUTA_CACHE.detalle(
      ruta.id,
    ),

    {
      ruta,
    },

    TTL.lista,
  );

  /*
  |--------------------------------------------------------------------------
  | LISTADO
  |--------------------------------------------------------------------------
  */

  const listado =
    getRutasCache();

  if (!listado) {
    return;
  }

  const existe =
    listado.rutas.some(
      (
        actual,
      ) =>
        actual.id ===
        ruta.id,
    );

  const rutas =
    existe
      ? listado.rutas.map(
          (
            actual,
          ) =>
            actual.id ===
            ruta.id
              ? ruta
              : actual,
        )
      : [
          ruta,
          ...listado.rutas,
        ];

  configCache.set<RutasResponse>(
    RUTA_CACHE.listado(),

    {
      rutas,
    },

    TTL.lista,
  );
}

/*
|--------------------------------------------------------------------------
| INVALIDAR
|--------------------------------------------------------------------------
*/

export function invalidarCacheRutas():
  void {
  const listado =
    getRutasCache();

  const detalles =
    (
      listado?.rutas ??
      []
    ).map(
      (
        ruta,
      ) =>
        RUTA_CACHE.detalle(
          ruta.id,
        ),
    );

  configCache.invalidate(
    RUTA_CACHE.listado(),

    ...detalles,
  );
}

/*
|--------------------------------------------------------------------------
| LISTAR
|--------------------------------------------------------------------------
*/

export async function getRutas(
  options: {
    force?: boolean;
  } = {},
): Promise<RutasResponse> {
  const {
    force = false,
  } =
    options;

  if (force) {
    invalidarCacheRutas();
  }

  return configCache.remember<RutasResponse>(
    RUTA_CACHE.listado(),

    TTL.lista,

    () =>
      httpClient.getAuth<RutasResponse>(
        "/api/rutas",

        "No se pudieron cargar las rutas.",
      ),
  );
}

/*
|--------------------------------------------------------------------------
| DETALLE
|--------------------------------------------------------------------------
*/

export async function getRuta(
  id: number,

  options: {
    force?: boolean;
  } = {},
): Promise<RutaResponse> {
  const key =
    RUTA_CACHE.detalle(
      id,
    );

  if (
    options.force
  ) {
    configCache.invalidate(
      key,
    );
  }

  return configCache.remember<RutaResponse>(
    key,

    TTL.lista,

    () =>
      httpClient.getAuth<RutaResponse>(
        `/api/rutas/${id}`,

        "No se pudo cargar la ruta.",
      ),
  );
}

/*
|--------------------------------------------------------------------------
| CREAR
|--------------------------------------------------------------------------
*/

export async function crearRuta(
  payload:
    RutaPayload,
): Promise<RutaResponse> {
  const response =
    await httpClient.postAuth<RutaResponse>(
      "/api/rutas",

      payload,

      "No se pudo registrar la ruta.",
    );

  sincronizarRutaEnCache(
    response.ruta,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| ACTUALIZAR
|--------------------------------------------------------------------------
*/

export async function actualizarRuta(
  id: number,

  payload:
    RutaPayload,
): Promise<RutaResponse> {
  const response =
    await httpClient.putAuth<RutaResponse>(
      `/api/rutas/${id}`,

      payload,

      "No se pudo actualizar la ruta.",
    );

  sincronizarRutaEnCache(
    response.ruta,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| BAJA LÓGICA
|--------------------------------------------------------------------------
*/

export async function darBajaRuta(
  id: number,
): Promise<RutaResponse> {
  const response =
    await httpClient.deleteAuth<RutaResponse>(
      `/api/rutas/${id}`,

      "No se pudo dar de baja la ruta.",
    );

  sincronizarRutaEnCache(
    response.ruta,
  );

  return response;
}