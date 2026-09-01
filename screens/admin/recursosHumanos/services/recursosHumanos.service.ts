// screens/admin/recursosHumanos/services/recursosHumanos.service.ts

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
  FotoUsuarioArchivo,
  UsuarioFormRRHH,
  UsuarioRRHH,
  UsuarioRRHHResponse,
  UsuariosRRHHResponse,
} from "../types/recursosHumanos.types";

/*
|--------------------------------------------------------------------------
| CACHE KEYS
|--------------------------------------------------------------------------
|
| Utilizamos el configCache central del proyecto.
|
| No creamos:
|
| - AsyncStorage propio
| - Map propio
| - caché local separado
|
| Toda la lógica sigue pasando por configCache.
|
*/

const RRHH_CACHE = {
  usuarios:
    () =>
      "rrhh:usuarios",

  detalle:
    (
      id: number,
    ) =>
      `rrhh:usuario:${id}`,
};

/*
|--------------------------------------------------------------------------
| LEER CACHE DE LISTADO
|--------------------------------------------------------------------------
|
| Esta función es síncrona.
|
| Permite al hook arrancar inmediatamente con los datos existentes
| sin enseñar loading mientras vuelve a entrar a la pantalla.
|
*/

export function getUsuariosRRHHCache():
  UsuariosRRHHResponse | null {
  return (
    configCache.get<UsuariosRRHHResponse>(
      RRHH_CACHE.usuarios(),
    ) ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| LEER CACHE DE DETALLE
|--------------------------------------------------------------------------
*/

export function getUsuarioDetalleRRHHCache(
  id: number,
): UsuarioRRHHResponse | null {
  return (
    configCache.get<UsuarioRRHHResponse>(
      RRHH_CACHE.detalle(
        id,
      ),
    ) ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| ACTUALIZAR UN USUARIO DENTRO DEL CACHE
|--------------------------------------------------------------------------
|
| Cuando editamos o cambiamos la fotografía:
|
| NO invalidamos todo para volver a descargar.
|
| Actualizamos:
|
| - listado
| - detalle
|
| con la respuesta fresca del backend.
|
*/

function sincronizarUsuarioEnCache(
  usuario: UsuarioRRHH,
): void {
  /*
  |--------------------------------------------------------------------------
  | DETALLE
  |--------------------------------------------------------------------------
  */

  configCache.set<UsuarioRRHHResponse>(
    RRHH_CACHE.detalle(
      usuario.id,
    ),
    {
      usuario,
    },
    TTL.lista,
  );

  /*
  |--------------------------------------------------------------------------
  | LISTADO
  |--------------------------------------------------------------------------
  */

  const listado =
    getUsuariosRRHHCache();

  if (!listado) {
    return;
  }

  const existe =
    listado.usuarios.some(
      (
        current,
      ) =>
        current.id ===
        usuario.id,
    );

  const usuarios =
    existe
      ? listado.usuarios.map(
          (
            current,
          ) =>
            current.id ===
            usuario.id
              ? usuario
              : current,
        )
      : [
          ...listado.usuarios,
          usuario,
        ];

  configCache.set<UsuariosRRHHResponse>(
    RRHH_CACHE.usuarios(),
    {
      ...listado,

      usuarios,
    },
    TTL.lista,
  );
}

/*
|--------------------------------------------------------------------------
| INVALIDAR LISTADO + DETALLES
|--------------------------------------------------------------------------
|
| Se utiliza únicamente para refresh manual.
|
| Al presionar "Actualizar" queremos garantizar que los datos provengan
| nuevamente del backend.
|
*/

export function invalidarCacheRRHH(): void {
  const listado =
    getUsuariosRRHHCache();

  const detalleKeys =
    (
      listado?.usuarios ??
      []
    ).map(
      (
        usuario,
      ) =>
        RRHH_CACHE.detalle(
          usuario.id,
        ),
    );

  configCache.invalidate(
    RRHH_CACHE.usuarios(),
    ...detalleKeys,
  );
}

/*
|--------------------------------------------------------------------------
| GET USUARIOS
|--------------------------------------------------------------------------
*/

export async function getUsuariosRRHH(
  options: {
    force?: boolean;
  } = {},
): Promise<UsuariosRRHHResponse> {
  const {
    force = false,
  } =
    options;

  /*
   * Refresh manual.
   */

  if (force) {
    invalidarCacheRRHH();
  }

  /*
   * remember():
   *
   * - devuelve cache si existe;
   * - evita GET duplicados;
   * - comparte Promise si dos componentes solicitan lo mismo;
   * - consulta backend solamente cuando corresponde.
   */

  return configCache.remember<UsuariosRRHHResponse>(
    RRHH_CACHE.usuarios(),

    TTL.lista,

    async () => {
      return httpClient.getAuth<UsuariosRRHHResponse>(
        "/api/recursos-humanos/usuarios",

        "No se pudieron cargar los usuarios.",
      );
    },
  );
}

/*
|--------------------------------------------------------------------------
| GET DETALLE
|--------------------------------------------------------------------------
*/

export async function getUsuarioDetalleRRHH(
  id: number,

  options: {
    force?: boolean;
  } = {},
): Promise<UsuarioRRHHResponse> {
  const {
    force = false,
  } =
    options;

  const key =
    RRHH_CACHE.detalle(
      id,
    );

  if (force) {
    configCache.invalidate(
      key,
    );
  }

  return configCache.remember<UsuarioRRHHResponse>(
    key,

    TTL.lista,

    async () => {
      return httpClient.getAuth<UsuarioRRHHResponse>(
        `/api/recursos-humanos/usuarios/${id}`,

        "No se pudo cargar el detalle del usuario.",
      );
    },
  );
}

/*
|--------------------------------------------------------------------------
| ACTUALIZAR USUARIO
|--------------------------------------------------------------------------
*/

export async function actualizarUsuarioRRHH(
  id: number,
  form: UsuarioFormRRHH,
): Promise<UsuarioRRHHResponse> {
  const response =
    await httpClient.putAuth<UsuarioRRHHResponse>(
      `/api/recursos-humanos/usuarios/${id}`,

      form,

      "No se pudo actualizar el usuario.",
    );

  /*
   * Write-through cache:
   *
   * backend
   *    ↓
   * respuesta nueva
   *    ↓
   * listado cache
   *    ↓
   * detalle cache
   */

  sincronizarUsuarioEnCache(
    response.usuario,
  );

  return response;
}

/*
|--------------------------------------------------------------------------
| ACTUALIZAR FOTOGRAFÍA
|--------------------------------------------------------------------------
*/

export async function actualizarFotoRRHH(
  id: number,
  archivo: FotoUsuarioArchivo,
): Promise<UsuarioRRHHResponse> {
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
    const response =
      await fetch(
        archivo.uri,
      );

    if (
      !response.ok
    ) {
      throw new Error(
        "No se pudo preparar la fotografía.",
      );
    }

    const blob =
      await response.blob();

    const file =
      new File(
        [
          blob,
        ],

        archivo.name ||
          `foto-${Date.now()}.jpg`,

        {
          type:
            archivo.type ||
            blob.type ||
            "image/jpeg",
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
          `foto-${Date.now()}.jpg`,

        type:
          archivo.type ||
          "image/jpeg",
      } as any,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | REQUEST
  |--------------------------------------------------------------------------
  */

  const response =
  await httpClient.postFormData<UsuarioRRHHResponse>(
    `/api/recursos-humanos/usuarios/${id}/foto`,

    formData,
  );

  /*
  |--------------------------------------------------------------------------
  | CACHE
  |--------------------------------------------------------------------------
  */

  sincronizarUsuarioEnCache(
    response.usuario,
  );

  return response;
}