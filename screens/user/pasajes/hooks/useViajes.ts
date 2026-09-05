// hooks/useViajes.ts
import { useCallback, useEffect, useState } from "react";
import { getViajes } from "../services/pasajes.service";
import { Viaje, ViajesResponse } from "../types/pasajes.types";

export function useViajes(initialFilters?: {
  origen?: string;
  destino?: string;
  fecha?: string;
  estado?: string;
  per_page?: number;
}) {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ViajesResponse["meta"] | null>(null);
  const [filtros, setFiltros] = useState(initialFilters);

  const fetchViajes = useCallback(
    async (filtrosActuales = filtros) => {
      setLoading(true);
      setError(null);
      try {
        const response = await getViajes(filtrosActuales);
        setViajes(response.data);
        setMeta(response.meta);
      } catch (err: any) {
        setError(err?.message || "Error al cargar viajes");
      } finally {
        setLoading(false);
      }
    },
    [filtros],
  );

  useEffect(() => {
    fetchViajes();
  }, []);

  const changeFiltros = useCallback(
    (nuevos: typeof filtros) => {
      setFiltros(nuevos);
      fetchViajes(nuevos);
    },
    [fetchViajes],
  );

  return {
    viajes,
    loading,
    error,
    meta,
    filtros,
    changeFiltros,
    refetch: fetchViajes,
  };
}
