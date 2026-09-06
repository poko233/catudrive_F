import { useCallback, useEffect, useState } from "react";
import { httpClient } from "@/http/httpClient";

interface Chofer {
  id: number;
  nombre_completo: string;
  ci: string;
}

interface Response {
  data: Chofer[];
}

export function useChoferes() {
  const [data, setData] = useState<Chofer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.getAuth<Response>(
        "/api/choferes",
        "Error al cargar choferes",
      );
      setData(response.data ?? []);
    } catch (err: any) {
      setError(err?.message || "Error al cargar choferes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
