import { useCallback, useEffect, useState } from "react";
import { httpClient } from "@/http/httpClient";

interface Vehiculo {
  id: number;
  placa: string;
  marca: string;
  modelo: string;
}

interface Response {
  data: Vehiculo[];
}

export function useVehiculos() {
  const [data, setData] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.getAuth<Response>(
        "/api/vehiculos",
        "Error al cargar vehículos",
      );
      setData(response.data ?? []);
    } catch (err: any) {
      setError(err?.message || "Error al cargar vehículos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
