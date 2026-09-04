type Entry<T> = {
  data: T;
  expiresAt: number;
};

type InFlightEntry<T> = {
  promise: Promise<T>;
  version: number;
  globalVersion: number;
};

class ConfigCache {
  /**
   * Datos ya resueltos.
   */
  private store =
    new Map<
      string,
      Entry<unknown>
    >();

  /**
   * Peticiones actualmente
   * ejecutándose.
   */
  private inFlight =
    new Map<
      string,
      InFlightEntry<unknown>
    >();

  /**
   * Versión individual por clave.
   */
  private versions =
    new Map<
      string,
      number
    >();

  /**
   * Versión global.
   */
  private globalVersion =
    0;

  /**
   * Obtiene un valor del caché.
   *
   * Retorna null cuando:
   *
   * - no existe
   * - expiró
   */
  get<T>(
    key: string,
  ): T | null {
    const entry =
      this.store.get(
        key,
      );

    if (!entry) {
      return null;
    }

    if (
      Date.now() >
      entry.expiresAt
    ) {
      this.store.delete(
        key,
      );

      return null;
    }

    return entry.data as T;
  }

  /**
   * Guarda manualmente.
   */
  set<T>(
    key: string,

    data: T,

    ttlMs: number,
  ): void {
    this.store.set(
      key,

      {
        data,

        expiresAt:
          Date.now() +
          ttlMs,
      },
    );
  }

  /**
   * Función principal.
   *
   * Si existe caché:
   * devuelve caché.
   *
   * Si existe un GET igual
   * en curso:
   * comparte la Promise.
   *
   * Si no:
   * ejecuta loader.
   */
  async remember<T>(
    key: string,

    ttlMs: number,

    loader:
      () => Promise<T>,
  ): Promise<T> {
    /*
    |--------------------------------------------------------------------------
    | 1. CACHE
    |--------------------------------------------------------------------------
    */

    const cached =
      this.get<T>(
        key,
      );

    if (
      cached !==
      null
    ) {
      return cached;
    }

    /*
    |--------------------------------------------------------------------------
    | 2. PETICIÓN EN VUELO
    |--------------------------------------------------------------------------
    */

    const existing =
      this.inFlight.get(
        key,
      );

    if (existing) {
      return existing.promise as Promise<T>;
    }

    /*
    |--------------------------------------------------------------------------
    | VERSIONES
    |--------------------------------------------------------------------------
    */

    const keyVersion =
      this.getVersion(
        key,
      );

    const currentGlobalVersion =
      this.globalVersion;

    /*
    |--------------------------------------------------------------------------
    | 3. LOADER
    |--------------------------------------------------------------------------
    */

    const promise =
      loader()
        .then(
          (
            data,
          ) => {
            const stillValid =
              this.getVersion(
                key,
              ) ===
                keyVersion &&
              this
                .globalVersion ===
                currentGlobalVersion;

            if (
              stillValid
            ) {
              this.set(
                key,

                data,

                ttlMs,
              );
            }

            return data;
          },
        )
        .finally(
          () => {
            const current =
              this.inFlight.get(
                key,
              );

            if (
              current
                ?.promise ===
              promise
            ) {
              this.inFlight.delete(
                key,
              );
            }
          },
        );

    this.inFlight.set(
      key,

      {
        promise,

        version:
          keyVersion,

        globalVersion:
          currentGlobalVersion,
      },
    );

    return promise;
  }

  /**
   * Invalida una o varias claves.
   */
  invalidate(
    ...keys: string[]
  ): void {
    for (
      const key of
      keys
    ) {
      this.store.delete(
        key,
      );

      this.versions.set(
        key,

        this.getVersion(
          key,
        ) + 1,
      );

      this.inFlight.delete(
        key,
      );
    }
  }

  /**
   * Limpia absolutamente todo.
   */
  invalidateAll(): void {
    this.store.clear();

    this.inFlight.clear();

    this.versions.clear();

    this.globalVersion +=
      1;
  }

  /**
   * Indica si existe
   * un valor válido.
   */
  has(
    key: string,
  ): boolean {
    return (
      this.get(
        key,
      ) !== null
    );
  }

  /**
   * Indica si existe
   * una petición en ejecución.
   */
  isInFlight(
    key: string,
  ): boolean {
    return this.inFlight.has(
      key,
    );
  }

  /**
   * Cantidad de peticiones
   * actualmente compartidas.
   */
  getInFlightCount():
    number {
    return this
      .inFlight
      .size;
  }

  private getVersion(
    key: string,
  ): number {
    return (
      this.versions.get(
        key,
      ) ?? 0
    );
  }
}

export const configCache =
  new ConfigCache();

/*
|--------------------------------------------------------------------------
| CACHE KEYS
|--------------------------------------------------------------------------
*/

export const CK = {
  /*
  |--------------------------------------------------------------------------
  | CONFIGURACIÓN GENERAL
  |--------------------------------------------------------------------------
  */

  roles:
    () =>
      "roles",

  modulos:
    () =>
      "modulos",

  formularios:
    () =>
      "formularios",

  formularioAcciones:
    () =>
      "formulario-acciones",

  sidebar:
    () =>
      "sidebar",

  rolPermisos:
    (
      rol: number,
    ) =>
      `rol-permisos:${rol}`,

  todosRolesPermisos:
    () =>
      "todos-roles-permisos",

  /*
  |--------------------------------------------------------------------------
  | RUTAS
  |--------------------------------------------------------------------------
  */

  rutas:
    () =>
      "rutas",

  ruta:
    (
      id: number,
    ) =>
      `ruta:${id}`,
};

/*
|--------------------------------------------------------------------------
| TTL
|--------------------------------------------------------------------------
*/

export const TTL = {
  /**
   * Listados/configuración
   * relativamente estable.
   */
  lista:
    5 *
    60 *
    1000,

  permisos:
    2 *
    60 *
    1000,

  sidebar:
    5 *
    60 *
    1000,
};