// screens/admin/arqueo/services/arqueoService.ts

import { TTL, configCache } from "@/cache/configCache";
import { httpClient } from "@/http/httpClient";
import type {
  AbrirArqueoPayload,
  Arqueo,
  ArqueoFiltros,
  CerrarArqueoPayload,
  LaravelPaginador,
} from "../types/arqueo.types";

const listKeys = new Set<string>();

const ARQUEO_CACHE = {
  abierto: "arqueo:abierto",
  detalle: (id: number) => `arqueo:${id}`,
  listado: (f: ArqueoFiltros) =>
    [
      "arqueos",
      f.id_user ?? "me",
      f.estado || "all",
      f.fecha_desde || "-",
      f.fecha_hasta || "-",
      f.page ?? 1,
      f.per_page ?? 15,
    ].join(":"),
};

function track(key: string) {
  listKeys.add(key);
}

function registrarClaveListado(key: string): void {
  listKeys.add(key);
}

/*
|--------------------------------------------------------------------------
| LEER CACHE (estilo pasajes.service.ts)
|--------------------------------------------------------------------------
|
| Permiten pintar instantáneo desde cache
| sin esperar al backend.
|
*/

export function getArqueoAbiertoCache(): Arqueo | null {
  return configCache.get<Arqueo | null>(ARQUEO_CACHE.abierto) ?? null;
}

export function getArqueoDetalleCache(id: number): Arqueo | null {
  return configCache.get<Arqueo>(ARQUEO_CACHE.detalle(id)) ?? null;
}

export function getArqueoListadoCache(filtros: ArqueoFiltros): LaravelPaginador<Arqueo> | null {
  return configCache.get<LaravelPaginador<Arqueo>>(ARQUEO_CACHE.listado(filtros)) ?? null;
}

function invalidarListados() {
  if (listKeys.size === 0) return;
  configCache.invalidate(...Array.from(listKeys));
  listKeys.clear();
}

/*
|--------------------------------------------------------------------------
| INVALIDAR CACHE
|--------------------------------------------------------------------------
|
| Se llaman tras abrir/cerrar/eliminar y desde
| los botones "Actualizar" (force refetch).
| También tras vender un pasaje/encomienda que
| auto-abre arqueo en el backend.
|
*/

export function invalidarCacheArqueo(id?: number) {
  const keys = [ARQUEO_CACHE.abierto];
  if (id) keys.push(ARQUEO_CACHE.detalle(id));
  configCache.invalidate(...keys);
  invalidarListados();
}

/** Invalida TODO lo del módulo (abierto + detalle + listados). */
export function invalidarTodoArqueo(): void {
  const keys = [ARQUEO_CACHE.abierto, ...Array.from(listKeys)];
  listKeys.clear();
  configCache.invalidate(...keys);
}

function buildQuery(f: ArqueoFiltros): string {
  const p = new URLSearchParams();
  if (f.id_user) p.append("id_user", String(f.id_user));
  if (f.estado) p.append("estado", f.estado);
  if (f.fecha_desde) p.append("fecha_desde", f.fecha_desde);
  if (f.fecha_hasta) p.append("fecha_hasta", f.fecha_hasta);
  if (f.per_page) p.append("per_page", String(f.per_page));
  if (f.page) p.append("page", String(f.page));
  const q = p.toString();
  return q ? `?${q}` : "";
}

function unwrap<T>(res: { data: T } | T): T {
  if (res && typeof res === "object" && "data" in (res as object)) {
    return (res as { data: T }).data;
  }
  return res as T;
}

export const arqueoService = {
  getAbierto: async (options: { force?: boolean } = {}): Promise<Arqueo | null> => {
    if (options.force) configCache.invalidate(ARQUEO_CACHE.abierto);
    return configCache.remember<Arqueo | null>(
      ARQUEO_CACHE.abierto,
      TTL.lista,
      async () => {
        const res = await httpClient.getAuth<{ data: Arqueo | null }>(
          "/api/arqueos/abierto",
          "Error al cargar arqueo abierto",
        );
        return res.data ?? null;
      },
    );
  },

  list: async (
    filtros: ArqueoFiltros = {},
    options: { force?: boolean } = {},
  ): Promise<LaravelPaginador<Arqueo>> => {
    const key = ARQUEO_CACHE.listado(filtros);
    registrarClaveListado(key);
    if (options.force) configCache.invalidate(key);
    return configCache.remember<LaravelPaginador<Arqueo>>(key, TTL.lista, async () => {
      return httpClient.getAuth<LaravelPaginador<Arqueo>>(
        `/api/arqueos${buildQuery(filtros)}`,
        "Error al cargar arqueos",
      );
    });
  },

  getById: async (id: number, options: { force?: boolean } = {}): Promise<Arqueo> => {
    const key = ARQUEO_CACHE.detalle(id);
    if (options.force) configCache.invalidate(key);
    return configCache.remember<Arqueo>(key, TTL.lista, async () => {
      const res = await httpClient.getAuth<{ data: Arqueo } | Arqueo>(
        `/api/arqueos/${id}`,
        "Error al cargar arqueo",
      );
      return unwrap<Arqueo>(res as { data: Arqueo });
    });
  },

  abrir: async (payload: AbrirArqueoPayload): Promise<Arqueo> => {
    const res = await httpClient.postAuth<{ data: Arqueo } | Arqueo>(
      "/api/arqueos/abrir",
      payload,
      "No se pudo abrir el arqueo",
    );
    const arqueo = unwrap<Arqueo>(res as { data: Arqueo });
    invalidarCacheArqueo(arqueo?.id);
    return arqueo;
  },

  cerrar: async (id: number, payload: CerrarArqueoPayload): Promise<Arqueo> => {
    const res = await httpClient.patchAuth<{ data: Arqueo } | Arqueo>(
      `/api/arqueos/${id}/cerrar`,
      payload,
      "No se pudo cerrar el arqueo",
    );
    const arqueo = unwrap<Arqueo>(res as { data: Arqueo });
    invalidarCacheArqueo(id);
    return arqueo;
  },

  eliminar: async (id: number): Promise<void> => {
    await httpClient.deleteAuth(`/api/arqueos/${id}`, "No se pudo eliminar el arqueo");
    invalidarCacheArqueo(id);
  },
};

export default arqueoService;
