import { useCallback, useEffect, useState } from "react";
import { httpClient } from "@/http/httpClient";

export interface VehiculoChoferRuta {
  id: number;
  vehiculo: string;
  chofer: string;
  ruta: string;
}

interface Response {
  data: VehiculoChoferRuta[];
}

export function useVehiculoChoferRuta() {
  const [opciones, setOpciones] = useState<VehiculoChoferRuta[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOpciones = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Ajusta la URL según tu backend real
      const response = await httpClient.getAuth<Response>(
        "/api/vehiculo-chofer-ruta",
        "Error al cargar asignaciones",
      );
      setOpciones(response.data ?? []);
    } catch (err: any) {
      setError(err?.message || "Error al cargar asignaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOpciones();
  }, [fetchOpciones]);

  return { opciones, loading, error, refetch: fetchOpciones };
}
