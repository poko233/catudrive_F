// screens/admin/arqueo/hooks/useArqueos.ts

import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { arqueoService } from "../services/arqueoService";
import type { Arqueo, ArqueoFiltros, EstadoArqueo } from "../types/arqueo.types";

const PER_PAGE = 15;

function msg(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useArqueos() {
  const [estado, setEstado] = useState<EstadoArqueo | "">("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<Arqueo[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const cargar = useCallback(
    async (force = false) => {
      const filtros: ArqueoFiltros = {
        estado: estado || undefined,
        fecha_desde: fechaDesde || undefined,
        fecha_hasta: fechaHasta || undefined,
        per_page: PER_PAGE,
        page,
      };
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
        const res = await arqueoService.list(filtros, { force });
        setItems(res.data ?? []);
        setTotal(res.meta?.total ?? 0);
        setLastPage(res.meta?.last_page ?? 1);
      } catch (e) {
        Toast.show({ type: "error", text1: "Error al cargar arqueos", text2: msg(e, "Intenta nuevamente.") });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [estado, fechaDesde, fechaHasta, page],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const refrescar = useCallback(() => cargar(true), [cargar]);

  const cambiarPagina = useCallback((p: number) => setPage(Math.max(1, p)), []);

  const limpiarFiltros = useCallback(() => {
    setEstado("");
    setFechaDesde("");
    setFechaHasta("");
    setPage(1);
  }, []);

  const eliminar = useCallback(
    async (id: number) => {
      try {
        setDeletingId(id);
        await arqueoService.eliminar(id);
        Toast.show({ type: "success", text1: "Arqueo eliminado" });
        await cargar(true);
        return true;
      } catch (e) {
        Toast.show({ type: "error", text1: "No se pudo eliminar", text2: msg(e, "Solo arqueos Terminados.") });
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [cargar],
  );

  return {
    items, total, page, lastPage, perPage: PER_PAGE,
    estado, setEstado, fechaDesde, setFechaDesde, fechaHasta, setFechaHasta,
    loading, refreshing, deletingId,
    setPage: cambiarPagina, refrescar, limpiarFiltros, eliminar,
  };
}

export default useArqueos;
