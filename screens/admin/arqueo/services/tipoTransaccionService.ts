// screens/admin/arqueo/services/tipoTransaccionService.ts

import { TTL, configCache } from "@/cache/configCache";
import { httpClient } from "@/http/httpClient";
import type {
  LaravelPaginador,
  TipoTransaccion,
  TipoTransaccionFiltros,
  TipoTransaccionPayload,
  TipoTransaccionUpdatePayload,
} from "../types/arqueo.types";

const listKeys = new Set<string>();

const TIPO_CACHE = {
  detalle: (id: number) => `tipo-transaccion:${id}`,
  listado: (f: TipoTransaccionFiltros) =>
    [
      "tipos-transaccion",
      f.tipo_transaccion || "all",
      (f.buscar ?? "").trim().toLowerCase() || "-",
      f.page ?? 1,
      f.per_page ?? 15,
    ].join(":"),
};

export function getTipoListadoCache(f: TipoTransaccionFiltros): LaravelPaginador<TipoTransaccion> | null {
  return configCache.get<LaravelPaginador<TipoTransaccion>>(TIPO_CACHE.listado(f)) ?? null;
}

function invalidarListados() {
  if (listKeys.size === 0) return;
  configCache.invalidate(...Array.from(listKeys));
  listKeys.clear();
}

/** Fuerza refetch total de tipos (botón Actualizar). */
export function invalidarTodoTipos(): void {
  const keys = [...Array.from(listKeys)];
  listKeys.clear();
  if (keys.length > 0) configCache.invalidate(...keys);
}

function buildQuery(f: TipoTransaccionFiltros): string {
  const p = new URLSearchParams();
  if (f.tipo_transaccion) p.append("tipo_transaccion", f.tipo_transaccion);
  if (f.buscar) p.append("buscar", f.buscar);
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

export const tipoTransaccionService = {
  list: async (
    filtros: TipoTransaccionFiltros = {},
    options: { force?: boolean } = {},
  ): Promise<LaravelPaginador<TipoTransaccion>> => {
    const key = TIPO_CACHE.listado(filtros);
    listKeys.add(key);
    if (options.force) configCache.invalidate(key);
    return configCache.remember<LaravelPaginador<TipoTransaccion>>(key, TTL.lista, async () => {
      return httpClient.getAuth<LaravelPaginador<TipoTransaccion>>(
        `/api/tipos-transaccion${buildQuery(filtros)}`,
        "Error al cargar tipos de transacción",
      );
    });
  },

  getById: async (id: number): Promise<TipoTransaccion> => {
    const res = await httpClient.getAuth<{ data: TipoTransaccion } | TipoTransaccion>(
      `/api/tipos-transaccion/${id}`,
      "Error al cargar tipo de transacción",
    );
    return unwrap<TipoTransaccion>(res as { data: TipoTransaccion });
  },

  create: async (payload: TipoTransaccionPayload): Promise<TipoTransaccion> => {
    const res = await httpClient.postAuth<{ data: TipoTransaccion } | TipoTransaccion>(
      "/api/tipos-transaccion",
      payload,
      "No se pudo crear el tipo de transacción",
    );
    const tipo = unwrap<TipoTransaccion>(res as { data: TipoTransaccion });
    invalidarListados();
    return tipo;
  },

  update: async (id: number, payload: TipoTransaccionUpdatePayload): Promise<TipoTransaccion> => {
    const res = await httpClient.putAuth<{ data: TipoTransaccion } | TipoTransaccion>(
      `/api/tipos-transaccion/${id}`,
      payload,
      "No se pudo actualizar el tipo de transacción",
    );
    const tipo = unwrap<TipoTransaccion>(res as { data: TipoTransaccion });
    invalidarListados();
    configCache.invalidate(TIPO_CACHE.detalle(id));
    return tipo;
  },

  remove: async (id: number): Promise<void> => {
    await httpClient.deleteAuth(
      `/api/tipos-transaccion/${id}`,
      "No se pudo eliminar el tipo de transacción",
    );
    invalidarListados();
    configCache.invalidate(TIPO_CACHE.detalle(id));
  },
};

export default tipoTransaccionService;
