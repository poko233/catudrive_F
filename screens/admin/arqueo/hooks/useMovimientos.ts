// screens/admin/arqueo/hooks/useMovimientos.ts

import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { egresoService } from "../services/egresoService";
import { ingresoService } from "../services/ingresoService";
import type {
  Egreso,
  EstadoMovimiento,
  Ingreso,
  MovimientoFiltros,
  MovimientoPayload,
  TipoPago,
} from "../types/arqueo.types";

const PER_PAGE = 15;

function msg(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function useMovimientoBase<T extends Ingreso | Egreso>(
  kind: "ingreso" | "egreso",
  baseFiltros: MovimientoFiltros,
) {
  const [tipoPago, setTipoPago] = useState<TipoPago | "">("");
  const [estado, setEstado] = useState<EstadoMovimiento | "">("");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [anulandoId, setAnulandoId] = useState<number | null>(null);

  const cargar = useCallback(
    async (force = false) => {
      const filtros: MovimientoFiltros = {
        ...baseFiltros,
        tipo_pago: tipoPago || undefined,
        estado: estado || undefined,
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
        const res =
          kind === "ingreso"
            ? await ingresoService.list(filtros, { force })
            : await egresoService.list(filtros, { force });
        setItems((res.data ?? []) as T[]);
        setTotal(res.meta?.total ?? 0);
        setLastPage(res.meta?.last_page ?? 1);
      } catch (e) {
        Toast.show({
          type: "error",
          text1: kind === "ingreso" ? "Error al cargar ingresos" : "Error al cargar egresos",
          text2: msg(e, "Intenta nuevamente."),
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, baseFiltros.id_arqueo, baseFiltros.id_tipo_transaccion, tipoPago, estado, page],
  );

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const refrescar = useCallback(() => cargar(true), [cargar]);

  const crear = useCallback(
    async (payload: MovimientoPayload) => {
      try {
        setSaving(true);
        if (kind === "ingreso") await ingresoService.create(payload);
        else await egresoService.create(payload);
        Toast.show({
          type: "success",
          text1: kind === "ingreso" ? "Ingreso registrado" : "Egreso registrado",
          text2: "Puede haber abierto tu arqueo automáticamente.",
        });
        await cargar(true);
        return true;
      } catch (e) {
        Toast.show({
          type: "error",
          text1: kind === "ingreso" ? "No se pudo registrar ingreso" : "No se pudo registrar egreso",
          text2: msg(e, "Revisa tipo, monto y detalle."),
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [kind, cargar],
  );

  const anular = useCallback(
    async (id: number) => {
      try {
        setAnulandoId(id);
        if (kind === "ingreso") await ingresoService.anular(id);
        else await egresoService.anular(id);
        Toast.show({ type: "success", text1: "Movimiento anulado" });
        await cargar(true);
        return true;
      } catch (e) {
        Toast.show({ type: "error", text1: "No se pudo anular", text2: msg(e, "Intenta nuevamente.") });
        return false;
      } finally {
        setAnulandoId(null);
      }
    },
    [kind, cargar],
  );

  return {
    items, total, page, lastPage, perPage: PER_PAGE,
    tipoPago, setTipoPago, estado, setEstado,
    loading, refreshing, saving, anulandoId,
    setPage, refrescar, crear, anular,
  };
}

export function useIngresos(filtros: MovimientoFiltros = {}) {
  return useMovimientoBase<Ingreso>("ingreso", filtros);
}

export function useEgresos(filtros: MovimientoFiltros = {}) {
  return useMovimientoBase<Egreso>("egreso", filtros);
}
