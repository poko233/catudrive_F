import {
  configCache,
  TTL,
} from "@/cache/configCache";

import {
  httpClient,
} from "@/http/httpClient";

import {
  Platform,
} from "react-native";

import {
  Chofer,
  ChoferForm,
  ChoferResponse,
  ChoferesResponse,
  FotoChoferArchivo,
  HistorialChoferResponse,
} from "../types/chofer.types";

/*
|--------------------------------------------------------------------------
| CACHE
|--------------------------------------------------------------------------
*/

const CHOFER_CACHE = {
  listado: () =>
    "choferes:listado",

  detalle: (
    id: number,
  ) =>
    `choferes:detalle:${id}`,
};

/*
|--------------------------------------------------------------------------
| LEER CACHE
|--------------------------------------------------------------------------
*/

export function getChoferesCache():
  ChoferesResponse | null {
  return (
    configCache.get<ChoferesResponse>(
      CHOFER_CACHE.listado(),
    ) ??
    null
  );
}

export function getChoferDetalleCache(
  id: number,
): ChoferResponse | null {
  return (
    configCache.get<ChoferResponse>(
      CHOFER_CACHE.detalle(
        id,
      ),
    ) ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| WRITE THROUGH CACHE
|--------------------------------------------------------------------------
*/

function sincronizarChoferEnCache(
  chofer: Chofer,
): void {
  /*
  |--------------------------------------------------------------------------
  | DETALLE
  |--------------------------------------------------------------------------
  */

  configCache.set<ChoferResponse>(
    CHOFER_CACHE.detalle(
      chofer.id,
    ),

    {
      chofer,
    },

    TTL.lista,
  );

  /*
  |--------------------------------------------------------------------------
  | LISTADO
  |--------------------------------------------------------------------------
  */

  const listado =
    getChoferesCache();

  if (!listado) {
    return;
  }

  const existe =
    listado.choferes.some(
      (
        actual,
      ) =>
        actual.id ===
        chofer.id,
    );

  const choferes =
    existe
      ? listado.choferes.map(
          (
            actual,
          ) =>
            actual.id ===
            chofer.id
              ? chofer
              : actual,
        )
      : [
          chofer,
          ...listado.choferes,
        ];

  configCache.set<ChoferesResponse>(
    CHOFER_CACHE.listado(),

    {
      choferes,
    },

    TTL.lista,
  );
}

/*
|--------------------------------------------------------------------------
| INVALIDAR CACHE
|--------------------------------------------------------------------------
*/

export function invalidarCacheChoferes():
  void {
  const listado =
    getChoferesCache();

  const detalles =
    (
      listado?.choferes ??
      []
    ).map(
      (
        chofer,
      ) =>
        CHOFER_CACHE.detalle(
          chofer.id,
        ),
    );

  configCache.invalidate(
    CHOFER_CACHE.listado(),
    ...detalles,
  );
}

/*
|--------------------------------------------------------------------------
| LISTAR
|--------------------------------------------------------------------------
*/

export async function getChoferes(
  options: {
    force?: boolean;
  } = {},
): Promise<ChoferesResponse> {
  const {
    force = false,
  } =
    options;

  if (force) {
    invalidarCacheChoferes();
  }

  return configCache.remember<ChoferesResponse>(
    CHOFER_CACHE.listado(),

    TTL.lista,

    () =>
      httpClient.getAuth<ChoferesResponse>(
        "/api/choferes",

        "No se pudieron cargar los choferes.",
      ),
  );
}

/*
|--------------------------------------------------------------------------
| DETALLE
|--------------------------------------------------------------------------
*/

export async function getChofer(
  id: number,

  options: {
    force?: boolean;
  } = {},
): Promise<ChoferResponse> {
  const key =
    CHOFER_CACHE.detalle(
      id,
    );

  if (
    options.force
  ) {
    configCache.invalidate(
      key,
    );
  }

  return configCache.remember<ChoferResponse>(
    key,

    TTL.lista,

    () =>
      httpClient.getAuth<ChoferResponse>(
        `/api/choferes/${id}`,

        "No se pudo cargar el chofer.",
      ),
  );
}

/*
|--------------------------------------------------------------------------
| CREAR
|--------------------------------------------------------------------------
*/

export async function crearChofer(
  form:
    ChoferForm,
): Promise<ChoferResponse> {
  const response =
    await httpClient.postAuth<ChoferResponse>(
      "/api/choferes",

      form,

      "No se pudo registrar el chofer.",
    );

  sincronizarChoferEnCache(
    response.chofer,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| ACTUALIZAR
|--------------------------------------------------------------------------
*/

export async function actualizarChofer(
  id: number,

  form:
    ChoferForm,
): Promise<ChoferResponse> {
  const response =
    await httpClient.putAuth<ChoferResponse>(
      `/api/choferes/${id}`,

      form,

      "No se pudo actualizar el chofer.",
    );

  sincronizarChoferEnCache(
    response.chofer,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| BAJA LÓGICA
|--------------------------------------------------------------------------
*/

export async function darBajaChofer(
  id: number,
): Promise<ChoferResponse> {
  const response =
    await httpClient.deleteAuth<ChoferResponse>(
      `/api/choferes/${id}`,

      "No se pudo dar de baja al chofer.",
    );

  sincronizarChoferEnCache(
    response.chofer,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| FOTOGRAFÍA
|--------------------------------------------------------------------------
*/

export async function actualizarFotoChofer(
  id: number,

  archivo:
    FotoChoferArchivo,
): Promise<ChoferResponse> {
  const formData =
    new FormData();

  /*
  |--------------------------------------------------------------------------
  | WEB
  |--------------------------------------------------------------------------
  */

  if (
    Platform.OS ===
    "web"
  ) {
    const fileResponse =
      await fetch(
        archivo.uri,
      );

    if (
      !fileResponse.ok
    ) {
      throw new Error(
        "No se pudo preparar la fotografía.",
      );
    }

    const blob =
      await fileResponse.blob();

    const file =
      new File(
        [
          blob,
        ],

        archivo.name ||
          `chofer-${Date.now()}.webp`,

        {
          type:
            archivo.type ||
            blob.type ||
            "image/webp",
        },
      );

    formData.append(
      "foto",
      file,
    );
  } else {
    /*
    |--------------------------------------------------------------------------
    | MOBILE
    |--------------------------------------------------------------------------
    */

    formData.append(
      "foto",

      {
        uri:
          archivo.uri,

        name:
          archivo.name ||
          `chofer-${Date.now()}.webp`,

        type:
          archivo.type ||
          "image/webp",
      } as any,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REQUEST
  |--------------------------------------------------------------------------
  */

  const response =
    await httpClient.postFormData<ChoferResponse>(
      `/api/choferes/${id}/foto`,

      formData,
    );

  sincronizarChoferEnCache(
    response.chofer,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| REGENERAR QR
|--------------------------------------------------------------------------
*/

export async function regenerarQrChofer(
  id: number,
): Promise<ChoferResponse> {
  const response =
    await httpClient.postAuth<ChoferResponse>(
      `/api/choferes/${id}/qr/regenerar`,

      {},

      "No se pudo regenerar el código QR.",
    );

  sincronizarChoferEnCache(
    response.chofer,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| HISTORIAL
|--------------------------------------------------------------------------
|
| No utilizamos cache porque las asignaciones
| pueden cambiar constantemente.
|
*/

export async function getHistorialChofer(
  id: number,
): Promise<HistorialChoferResponse> {
  return httpClient.getAuth<HistorialChoferResponse>(
    `/api/choferes/${id}/historial`,

    "No se pudo cargar el historial de asignaciones.",
  );
}