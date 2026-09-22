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
  RutaChoferesViajesResponse,
  RutaPayload,
  RutaResponse,
  RutasResponse,
} from "../types/ruta.types";

/*
|--------------------------------------------------------------------------
| LISTAR
|--------------------------------------------------------------------------
*/

export async function getRutas(
  force =
    false,
): Promise<Ruta[]> {
  const key =
    CK.rutas();

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
| CHOFERES QUE TIENEN VIAJES EN LA RUTA
|--------------------------------------------------------------------------
|
| Se consulta en el momento de abrir el modal.
|
| No usamos cache aquí porque los viajes pueden cambiar con frecuencia
| y queremos mostrar información fresca.
|
*/

export async function getChoferesViajesRuta(
  idRuta: number,
): Promise<RutaChoferesViajesResponse> {
  return httpClient.getAuth<RutaChoferesViajesResponse>(
    `/api/rutas/${idRuta}/choferes-viajes`,

    "No se pudieron cargar los choferes de la ruta.",
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

  configCache.invalidate(
    CK.rutas(),
  );

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

  configCache.invalidate(
    CK.rutas(),

    CK.ruta(
      id,
    ),
  );

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

  configCache.invalidate(
    CK.rutas(),

    CK.ruta(
      id,
    ),
  );

  configCache.set(
    CK.ruta(
      id,
    ),

    response.ruta,

    TTL.lista,
  );

  return response;
}
