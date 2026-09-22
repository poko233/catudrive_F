// hooks/useAsientos.ts
import { useCallback, useEffect, useState } from "react";
import { getAsientos } from "../services/pasajes.service";
import { Asiento, Piso } from "../types/pasajes.types";

export function useAsientos(idViaje: number | null) {
  const [pisos, setPisos] = useState<Piso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAsientos = useCallback(
    async (force = false) => {
      if (!idViaje) return;
      setLoading(true);
      setError(null);
      try {
        const response = await getAsientos(idViaje, { force });
        setPisos(response.data);
      } catch (err: any) {
        setError(err?.message || "Error al cargar asientos");
      } finally {
        setLoading(false);
      }
    },
    [idViaje],
  );

  useEffect(() => {
    fetchAsientos();
  }, [fetchAsientos]);

  return {
    pisos,
    loading,
    error,
    /**
     * force=true: invalida caché y pega al backend.
     */
    refetch: fetchAsientos,
  };
}

export function useAsientoSeleccionado(pisos: Piso[]) {
  const [seleccionados, setSeleccionados] = useState<Asiento[]>([]);

  const toggleSeleccion = useCallback((asiento: Asiento) => {
    if (
      asiento.tipo_celda !== "pasajero" ||
      asiento.estado_ocupacion !== "libre"
    )
      return;
    setSeleccionados((prev) => {
      const existe = prev.find((a) => a.id === asiento.id);
      if (existe) {
        return prev.filter((a) => a.id !== asiento.id);
      }
      return [...prev, asiento];
    });
  }, []);

  const clearSeleccion = useCallback(() => setSeleccionados([]), []);

  return { seleccionados, toggleSeleccion, clearSeleccion };
}
