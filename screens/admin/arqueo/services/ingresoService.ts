// screens/admin/arqueo/services/ingresoService.ts

import { TTL, configCache } from "@/cache/configCache";
import { httpClient } from "@/http/httpClient";
import type {
  Ingreso,
  LaravelPaginador,
  MovimientoFiltros,
  MovimientoPayload,
} from "../types/arqueo.types";
import { invalidarCacheArqueo } from "./arqueoService";

const listKeys = new Set<string>();

const INGRESO_CACHE = {
  detalle: (id: number) => `ingreso:${id}`,
  listado: (f: MovimientoFiltros) =>
    [
      "ingresos",
      f.id_arqueo ?? "all",
      f.id_user ?? "me",
      f.id_tipo_transaccion ?? "all",
      f.tipo_pago || "all",
      f.estado || "all",
      f.fecha_desde || "-",
      f.fecha_hasta || "-",
      f.page ?? 1,
      f.per_page ?? 15,
    ].join(":"),
};

export function getIngresoListadoCache(f: MovimientoFiltros): LaravelPaginador<Ingreso> | null {
  return configCache.get<LaravelPaginador<Ingreso>>(INGRESO_CACHE.listado(f)) ?? null;
}

function invalidarListados() {
  if (listKeys.size === 0) return;
  configCache.invalidate(...Array.from(listKeys));
  listKeys.clear();
}

export function invalidarCacheIngresos(id?: number) {
  if (id) configCache.invalidate(INGRESO_CACHE.detalle(id));
  invalidarListados();
  invalidarCacheArqueo();
}

/** Fuerza refetch total de ingresos (botón Actualizar). */
export function invalidarTodoIngresos(): void {
  const keys = [...Array.from(listKeys)];
  listKeys.clear();
  if (keys.length > 0) configCache.invalidate(...keys);
  invalidarCacheArqueo();
}

function buildQuery(f: MovimientoFiltros): string {
  const p = new URLSearchParams();
  if (f.id_arqueo) p.append("id_arqueo", String(f.id_arqueo));
  if (f.id_user) p.append("id_user", String(f.id_user));
  if (f.id_tipo_transaccion) p.append("id_tipo_transaccion", String(f.id_tipo_transaccion));
  if (f.tipo_pago) p.append("tipo_pago", f.tipo_pago);
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

export const ingresoService = {
  list: async (
    filtros: MovimientoFiltros = {},
    options: { force?: boolean } = {},
  ): Promise<LaravelPaginador<Ingreso>> => {
    const key = INGRESO_CACHE.listado(filtros);
    listKeys.add(key);
    if (options.force) configCache.invalidate(key);
    return configCache.remember<LaravelPaginador<Ingreso>>(key, TTL.lista, async () => {
      return httpClient.getAuth<LaravelPaginador<Ingreso>>(
        `/api/ingresos${buildQuery(filtros)}`,
        "Error al cargar ingresos",
      );
    });
  },

  getById: async (id: number): Promise<Ingreso> => {
    const res = await httpClient.getAuth<{ data: Ingreso } | Ingreso>(
      `/api/ingresos/${id}`,
      "Error al cargar ingreso",
    );
    return unwrap<Ingreso>(res as { data: Ingreso });
  },

  create: async (payload: MovimientoPayload): Promise<Ingreso> => {
    const res = await httpClient.postAuth<{ data: Ingreso } | Ingreso>(
      "/api/ingresos",
      payload,
      "No se pudo registrar el ingreso",
    );
    const ingreso = unwrap<Ingreso>(res as { data: Ingreso });
    invalidarCacheIngresos();
    return ingreso;
  },

  anular: async (id: number): Promise<Ingreso> => {
    const res = await httpClient.postAuth<{ data: Ingreso } | Ingreso>(
      `/api/ingresos/${id}/anular`,
      {},
      "No se pudo anular el ingreso",
    );
    const ingreso = unwrap<Ingreso>(res as { data: Ingreso });
    invalidarCacheIngresos(id);
    return ingreso;
  },

  /*
  |--------------------------------------------------------------------------
  | HTML COMPROBANTE (patrón obtenerTicketHtml de pasajes.service.ts)
  |--------------------------------------------------------------------------
  |
  | GET /api/ingresos/{id}/comprobante → text/html (Blade renderizado).
  | El front decide: ventana nueva, iframe o PDF cliente-side.
  | Permiso: Arqueo,Ingreso,Ver. Errores 401/403/404 en JSON.
  |
  */

  obtenerHtmlComprobante: async (id: number): Promise<string> => {
    const response = await httpClient._rawFetch(
      `/api/ingresos/${id}/comprobante`,
      "text/html",
      { timeoutMs: 60000 },
    );
    return response.text();
  },
};

export default ingresoService;
