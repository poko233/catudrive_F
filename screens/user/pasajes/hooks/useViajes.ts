// hooks/useViajes.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { getViajes } from "../services/pasajes.service";
import {
  FiltrosViajes,
  PaginacionMeta,
  Viaje,
} from "../types/pasajes.types";

/*
|--------------------------------------------------------------------------
| FILTROS DE BÚSQUEDA (SIN PAGINACIÓN)
|--------------------------------------------------------------------------
*/

export interface FiltrosBusquedaViajes {
  origen?: string;
  destino?: string;
  fecha?: string;
  estado?: string;
  vehiculo_id?: number;
  chofer_id?: number;
}

function normalizarFiltros(filtros?: FiltrosBusquedaViajes): FiltrosViajes {
  if (!filtros) return {};
  const salida: FiltrosViajes = {};
  if (filtros.origen?.trim()) salida.origen = filtros.origen.trim();
  if (filtros.destino?.trim()) salida.destino = filtros.destino.trim();
  if (filtros.fecha?.trim()) salida.fecha = filtros.fecha.trim();
  if (filtros.estado?.trim()) salida.estado = filtros.estado.trim();
  if (filtros.vehiculo_id !== undefined)
    salida.vehiculo_id = filtros.vehiculo_id;
  if (filtros.chofer_id !== undefined) salida.chofer_id = filtros.chofer_id;
  return salida;
}

export function useViajes(
  initialFilters?: FiltrosBusquedaViajes,
  perPage = 15,
) {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<PaginacionMeta | null>(null);
  const [filtros, setFiltros] = useState<FiltrosViajes>(() =>
    normalizarFiltros(initialFilters),
  );
  const [pagina, setPagina] = useState(1);

  // Evita pisar resultados cuando una petición vieja
  // responde después de una más reciente.
  const secuencia = useRef(0);

  /*
  |--------------------------------------------------------------------------
  | LISTA PAGINADA DESDE EL BACKEND
  |--------------------------------------------------------------------------
  |
  | Cada página se pide al backend con page/per_page y queda
  | en cache por combinación filtros+página (ver servicio).
  |
  | Es la ÚNICA petición inicial: contadores y modales son lazy.
  |
  */

  const fetchViajes = useCallback(
    async (filtrosActuales: FiltrosViajes, paginaActual: number) => {
      const ticket = ++secuencia.current;
      setLoading(true);
      setError(null);
      try {
        const response = await getViajes({
          ...filtrosActuales,
          per_page: perPage,
          page: paginaActual,
        });

        // Respuesta vieja: se ignora.
        if (secuencia.current !== ticket) return;

        setViajes(response.data);
        setMeta(response.meta ?? null);
        setPagina(response.meta?.current_page ?? paginaActual);
      } catch (err: any) {
        if (secuencia.current !== ticket) return;
        setError(err?.message || "Error al cargar viajes");
      } finally {
        if (secuencia.current === ticket) setLoading(false);
      }
    },
    [perPage],
  );

  useEffect(() => {
    fetchViajes(normalizarFiltros(initialFilters), 1);
    // Solo al montar: los cambios van por changeFiltros/goToPage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR FILTROS (BUSCADOR + CARDS) → PÁGINA 1 DEL BACKEND
  |--------------------------------------------------------------------------
  */

  const changeFiltros = useCallback(
    (nuevos?: FiltrosBusquedaViajes) => {
      const normalizados = normalizarFiltros(nuevos);
      setFiltros(normalizados);
      setPagina(1);
      fetchViajes(normalizados, 1);
    },
    [fetchViajes],
  );

  /*
  |--------------------------------------------------------------------------
  | PAGINADOR → PIDE LA PÁGINA AL BACKEND (USA CACHE SI YA SE PIDIÓ)
  |--------------------------------------------------------------------------
  */

  const goToPage = useCallback(
    (nuevaPagina: number) => {
      const destino = Math.max(1, Math.floor(nuevaPagina) || 1);
      const ultima = meta?.last_page ?? destino;
      const paginaFinal = Math.min(destino, Math.max(1, ultima));
      if (paginaFinal === pagina) return;
      setPagina(paginaFinal);
      fetchViajes(filtros, paginaFinal);
    },
    [fetchViajes, filtros, meta?.last_page, pagina],
  );

  return {
    viajes,
    loading,
    error,
    meta,
    pagina,
    filtros,
    perPage,
    changeFiltros,
    goToPage,
    refetch: () => fetchViajes(filtros, pagina),
  };
}
