import { useCallback, useEffect, useState } from "react";
import { getRutas } from "@/screens/user/rutas/services/ruta.service";
import { Ruta } from "@/screens/user/rutas/types/ruta.types";

export function useRutasCacheadas() {
  const [data, setData] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rutas = await getRutas();
      setData(rutas);
    } catch (err: any) {
      setError(err?.message || "Error al cargar rutas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
