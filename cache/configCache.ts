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
  private store = new Map<string, Entry<unknown>>();

  /**
   * Peticiones que actualmente están
   * ejecutándose.
   *
   * Sirve para evitar que dos componentes
   * hagan el mismo GET al mismo tiempo.
   */
  private inFlight = new Map<string, InFlightEntry<unknown>>();

  /**
   * Versión individual de cada clave.
   *
   * Si una clave se invalida mientras existe
   * una petición en vuelo, impedimos que esa
   * petición antigua vuelva a guardar datos
   * obsoletos al terminar.
   */
  private versions = new Map<string, number>();

  /**
   * Versión global.
   *
   * Se incrementa en invalidateAll().
   */
  private globalVersion = 0;

  /**
   * Obtiene un valor del caché.
   *
   * Retorna null cuando:
   * - no existe
   * - expiró
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);

      return null;
    }

    return entry.data as T;
  }

  /**
   * Guarda manualmente un valor.
   */
  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Obtiene un valor del caché o ejecuta
   * el loader.
   *
   * Si ya existe otra petición ejecutándose
   * para la misma clave, reutiliza esa Promise.
   *
   * Esta es la función principal que utilizaremos
   * en los servicios.
   */
  async remember<T>(
    key: string,
    ttlMs: number,
    loader: () => Promise<T>,
  ): Promise<T> {
    /**
     * 1. Revisar caché terminado.
     */
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    /**
     * 2. Revisar si ya existe una petición
     * en ejecución para esta clave.
     */
    const existing = this.inFlight.get(key);

    if (existing) {
      return existing.promise as Promise<T>;
    }

    /**
     * Guardamos las versiones actuales para
     * detectar una invalidación durante el GET.
     */
    const keyVersion = this.getVersion(key);

    const currentGlobalVersion = this.globalVersion;

    /**
     * 3. Crear una única Promise.
     */
    const promise = loader()
      .then((data) => {
        /**
         * Solo guardamos el resultado si
         * la clave no fue invalidada mientras
         * la petición estaba ejecutándose.
         */
        const stillValid =
          this.getVersion(key) === keyVersion &&
          this.globalVersion === currentGlobalVersion;

        if (stillValid) {
          this.set(key, data, ttlMs);
        }

        return data;
      })
      .finally(() => {
        /**
         * Evitamos eliminar una Promise nueva
         * que pudiera haberse creado después
         * de una invalidación.
         */
        const current = this.inFlight.get(key);

        if (current?.promise === promise) {
          this.inFlight.delete(key);
        }
      });

    this.inFlight.set(key, {
      promise,
      version: keyVersion,
      globalVersion: currentGlobalVersion,
    });

    return promise;
  }

  /**
   * Invalida una o varias claves.
   */
  invalidate(...keys: string[]): void {
    for (const key of keys) {
      this.store.delete(key);

      /**
       * Incrementar versión evita que una
       * petición vieja escriba nuevamente
       * en caché.
       */
      this.versions.set(key, this.getVersion(key) + 1);

      /**
       * Dejamos de considerar esta petición
       * como reutilizable.
       *
       * La petición HTTP existente no puede
       * cancelarse desde aquí, pero su resultado
       * ya no podrá sobrescribir el caché.
       */
      this.inFlight.delete(key);
    }
  }

  /**
   * Limpia absolutamente todo.
   *
   * Más adelante lo utilizaremos también
   * durante logout.
   */
  invalidateAll(): void {
    this.store.clear();
    this.inFlight.clear();
    this.versions.clear();

    this.globalVersion += 1;
  }

  /**
   * Indica si una clave tiene datos válidos.
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Indica si existe actualmente una petición
   * ejecutándose para una clave.
   *
   * Útil para debugging y tests.
   */
  isInFlight(key: string): boolean {
    return this.inFlight.has(key);
  }

  /**
   * Número de peticiones actualmente
   * compartidas/en ejecución.
   *
   * Útil para tests.
   */
  getInFlightCount(): number {
    return this.inFlight.size;
  }

  private getVersion(key: string): number {
    return this.versions.get(key) ?? 0;
  }
}

export const configCache = new ConfigCache();

export const CK = {
  roles: () => "roles",

  modulos: () => "modulos",

  formularios: () => "formularios",

  formularioAcciones: () => "formulario-acciones",

  sidebar: () => "sidebar",

  rolPermisos: (rol: number) => `rol-permisos:${rol}`,

  todosRolesPermisos: () => "todos-roles-permisos",

  categoriasVehiculo: () => "categorias-vehiculo",
};

export const TTL = {
  lista: 5 * 60 * 1000,

  permisos: 2 * 60 * 1000,

  sidebar: 5 * 60 * 1000,
};
