// screens/admin/arqueo/hooks/useTiposTransaccion.ts

import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { tipoTransaccionService } from "../services/tipoTransaccionService";
import type {
  NaturalezaTransaccion,
  TipoTransaccion,
  TipoTransaccionPayload,
  TipoTransaccionUpdatePayload,
} from "../types/arqueo.types";

const PER_PAGE = 15;

function msg(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useTiposTransaccion() {
  const [naturaleza, setNaturaleza] = useState<NaturalezaTransaccion | "">("");
  const [buscar, setBuscar] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<TipoTransaccion[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(buscar.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [buscar]);

  const cargar = useCallback(
    async (force = false) => {
      /*
      | REFRESH CON FEEDBACK: loading=true muestra los
      | skeletons de Table + el icono gira (spinner).
      */
      if (force) {
        setRefreshing(true);
        setLoading(true);
      } else {
        setLoading(true);
      }
      try {
        const res = await tipoTransaccionService.list(
          {
            tipo_transaccion: naturaleza || undefined,
            buscar: debounced || undefined,
            per_page: PER_PAGE,
            page,
          },
          { force },
        );
        setItems(res.data ?? []);
        setTotal(res.meta?.total ?? 0);
        setLastPage(res.meta?.last_page ?? 1);
      } catch (e) {
        Toast.show({ type: "error", text1: "Error al cargar tipos", text2: msg(e, "Intenta nuevamente.") });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [naturaleza, debounced, page],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const refrescar = useCallback(() => cargar(true), [cargar]);

  const guardar = useCallback(
    async (payload: TipoTransaccionPayload | TipoTransaccionUpdatePayload, id?: number) => {
      try {
        setSaving(true);
        if (id) await tipoTransaccionService.update(id, payload as TipoTransaccionUpdatePayload);
        else await tipoTransaccionService.create(payload as TipoTransaccionPayload);
        Toast.show({ type: "success", text1: id ? "Tipo actualizado" : "Tipo creado" });
        await cargar(true);
        return true;
      } catch (e) {
        Toast.show({ type: "error", text1: "No se pudo guardar", text2: msg(e, "Revisa código único y datos.") });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [cargar],
  );

  const eliminar = useCallback(
    async (id: number) => {
      try {
        setDeletingId(id);
        await tipoTransaccionService.remove(id);
        Toast.show({ type: "success", text1: "Tipo eliminado" });
        await cargar(true);
        return true;
      } catch (e) {
        Toast.show({
          type: "error",
          text1: "No se pudo eliminar",
          text2: msg(e, "Tiene movimientos asociados."),
        });
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [cargar],
  );

  return {
    items, total, page, lastPage, perPage: PER_PAGE,
    naturaleza, setNaturaleza, buscar, setBuscar,
    loading, refreshing, saving, deletingId,
    setPage, refrescar, guardar, eliminar,
  };
}

export default useTiposTransaccion;
