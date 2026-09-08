import { useCallback, useEffect, useState } from "react";
import { getVCR } from "../services/transporte.service";
import { VehiculoChoferRuta } from "../types/pasajes.types";

export function useVCR(enabled = true) {
  const [data, setData] = useState<VehiculoChoferRuta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getVCR({ per_page: 100 });
      setData(response.data ?? []);
    } catch (err: any) {
      setError(err?.message || "Error al cargar relaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Lazy: solo pide cuando se necesita (ej. al abrir el modal).
    // El servicio es cache-first: si ya está en cache no hay petición.
    if (enabled) refetch();
  }, [enabled, refetch]);

  return { data, loading, error, refetch };
}
