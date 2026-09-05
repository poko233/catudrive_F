import { useCallback, useState } from "react";
import {
  confirmarVenta as confirmarVentaService,
  iniciarVenta as iniciarVentaService,
  cancelarVenta as cancelarVentaService,
  anularVenta as anularVentaService,
  cambiarAsiento as cambiarAsientoService,
  eliminarDetalle as eliminarDetalleService,
} from "../services/pasajes.service";
import { Venta } from "../types/pasajes.types";

export function useVenta() {
  const [ventaActual, setVentaActual] = useState<Venta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const iniciar = useCallback(
    async (
      idViaje: number,
      asientos: { id_asiento: number; precio_unitario: number }[],
    ): Promise<Venta> => {
      setLoading(true);
      setError(null);
      try {
        const response = await iniciarVentaService({
          id_viaje: idViaje,
          asientos,
        });
        setVentaActual(response.data);
        return response.data;
      } catch (err: any) {
        setError(err?.message || "Error al iniciar venta");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const confirmar = useCallback(
    async (formaPago: string): Promise<Venta> => {
      if (!ventaActual) throw new Error("No hay venta activa");
      setLoading(true);
      setError(null);
      try {
        const response = await confirmarVentaService(ventaActual.id, formaPago);
        setVentaActual(response.data);
        return response.data;
      } catch (err: any) {
        setError(err?.message || "Error al confirmar venta");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [ventaActual],
  );

  const cancelar = useCallback(async (): Promise<void> => {
    if (!ventaActual) throw new Error("No hay venta activa");
    setLoading(true);
    setError(null);
    try {
      await cancelarVentaService(ventaActual.id);
      setVentaActual(null);
    } catch (err: any) {
      setError(err?.message || "Error al cancelar venta");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ventaActual]);

  const anular = useCallback(async (): Promise<void> => {
    if (!ventaActual) throw new Error("No hay venta activa");
    setLoading(true);
    setError(null);
    try {
      await anularVentaService(ventaActual.id);
      setVentaActual(null);
    } catch (err: any) {
      setError(err?.message || "Error al anular venta");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [ventaActual]);

  const cambiarAsientoDetalle = useCallback(
    async (detalleId: number, nuevoIdAsiento: number): Promise<Venta> => {
      if (!ventaActual) throw new Error("No hay venta activa");
      setLoading(true);
      setError(null);
      try {
        const response = await cambiarAsientoService(detalleId, nuevoIdAsiento);
        setVentaActual(response.data);
        return response.data;
      } catch (err: any) {
        setError(err?.message || "Error al cambiar asiento");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [ventaActual],
  );

  const eliminarDetalleVenta = useCallback(
    async (detalleId: number): Promise<Venta> => {
      if (!ventaActual) throw new Error("No hay venta activa");
      setLoading(true);
      setError(null);
      try {
        await eliminarDetalleService(detalleId);
        const ventaActualizada: Venta = {
          ...ventaActual,
          detalles: ventaActual.detalles.filter((d) => d.id !== detalleId),
        };
        setVentaActual(ventaActualizada);
        return ventaActualizada;
      } catch (err: any) {
        setError(err?.message || "Error al eliminar pasajero");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [ventaActual],
  );

  const limpiarVenta = useCallback(() => setVentaActual(null), []);

  return {
    ventaActual,
    loading,
    error,
    iniciar,
    confirmar,
    cancelar,
    anular,
    cambiarAsientoDetalle,
    eliminarDetalleVenta,
    limpiarVenta,
  };
}
