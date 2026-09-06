import { useCallback, useEffect, useState } from "react";
import { getAsignacionesVehiculos } from "@/screens/user/asignacionesVehiculos/services/asignacionVehiculo.service";
import { Asignacion } from "@/screens/user/asignacionesVehiculos/types/asignacionVehiculo.types";

export function useAsignacionesCacheadas() {
  const [data, setData] = useState<Asignacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const asignaciones = await getAsignacionesVehiculos();
      setData(asignaciones);
    } catch (err: any) {
      setError(err?.message || "Error al cargar asignaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
