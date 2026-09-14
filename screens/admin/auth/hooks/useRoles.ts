import { useEffect, useState } from "react";
import { fetchRoles } from "../services/register.service";
import type { RolItem } from "../types/register.types";

export function useRoles() {
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRoles()
      .then((data) => {
        if (!cancelled) {
          setRoles(Array.isArray(data) ? data : []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || "Error al cargar roles");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { roles, loading, error };
}
