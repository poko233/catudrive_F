import {
  CK,
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
| LISTAR
|--------------------------------------------------------------------------
|
| Comportamiento:
|
| getRutas()
|      ↓
| configCache.remember()
|      ↓
| existe cache → devuelve sin GET
| no existe    → GET y guarda
|
*/

export async function getRutas(
  force =
    false,
): Promise<Ruta[]> {
  const key =
    CK.rutas();

  /*
  |--------------------------------------------------------------------------
  | FORZAR RECARGA
  |--------------------------------------------------------------------------
  |
  | Se utiliza con el botón "Actualizar".
  |
  */

  if (force) {
    configCache.invalidate(
      key,
    );
  }

  return configCache.remember<Ruta[]>(
    key,

    TTL.lista,

    async () => {
      const response =
        await httpClient.getAuth<RutasResponse>(
          "/api/rutas",

          "No se pudieron cargar las rutas.",
        );

      return (
        response.rutas ??
        []
      );
    },
  );
}

/*
|--------------------------------------------------------------------------
| DETALLE
|--------------------------------------------------------------------------
*/

export async function getRuta(
  id: number,

  force =
    false,
): Promise<Ruta> {
  const key =
    CK.ruta(
      id,
    );

  if (force) {
    configCache.invalidate(
      key,
    );
  }

  return configCache.remember<Ruta>(
    key,

    TTL.lista,

    async () => {
      const response =
        await httpClient.getAuth<RutaResponse>(
          `/api/rutas/${id}`,

          "No se pudo cargar la ruta.",
        );

      return response.ruta;
    },
  );
}

/*
|--------------------------------------------------------------------------
| CREAR
|--------------------------------------------------------------------------
|
| No hacemos otro GET.
|
| Backend devuelve la ruta creada.
|
| Después invalidamos solamente
| el listado porque cambió.
|
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

  /*
  |--------------------------------------------------------------------------
  | INVALIDAR LISTADO
  |--------------------------------------------------------------------------
  */

  configCache.invalidate(
    CK.rutas(),
  );

  /*
  |--------------------------------------------------------------------------
  | GUARDAR DETALLE NUEVO
  |--------------------------------------------------------------------------
  |
  | Si inmediatamente abrimos el detalle
  | de la ruta, ya está disponible.
  |
  */

  configCache.set(
    CK.ruta(
      response.ruta.id,
    ),

    response.ruta,

    TTL.lista,
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

  /*
  |--------------------------------------------------------------------------
  | EL LISTADO YA NO ES VÁLIDO
  |--------------------------------------------------------------------------
  */

  configCache.invalidate(
    CK.rutas(),

    CK.ruta(
      id,
    ),
  );

  /*
  |--------------------------------------------------------------------------
  | GUARDAMOS LA RESPUESTA NUEVA
  |--------------------------------------------------------------------------
  */

  configCache.set(
    CK.ruta(
      id,
    ),

    response.ruta,

    TTL.lista,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| DAR DE BAJA
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

  /*
  |--------------------------------------------------------------------------
  | INVALIDAR
  |--------------------------------------------------------------------------
  */

  configCache.invalidate(
    CK.rutas(),

    CK.ruta(
      id,
    ),
  );

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR DETALLE
  |--------------------------------------------------------------------------
  */

  configCache.set(
    CK.ruta(
      id,
    ),

    response.ruta,

    TTL.lista,
  );

  return response;
}