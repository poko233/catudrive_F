import { useCallback, useState } from "react";
import {
  getVenta as getVentaService,
  confirmarVenta as confirmarVentaService,
  iniciarVenta as iniciarVentaService,
  cancelarVenta as cancelarVentaService,
  anularVenta as anularVentaService,
  cambiarAsiento as cambiarAsientoService,
  eliminarDetalle as eliminarDetalleService,
  invalidarCacheVenta,
} from "../services/pasajes.service";
import {
  ConfirmarPasajero,
  Venta,
} from "../types/pasajes.types";

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

  const cargarVenta = useCallback(
    async (ventaId: number): Promise<Venta> => {
      setLoading(true);
      setError(null);
      try {
        invalidarCacheVenta(ventaId);
        const response = await getVentaService(ventaId);
        setVentaActual(response.data);
        return response.data;
      } catch (err: any) {
        setError(err?.message || "Error al cargar la venta");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const confirmar = useCallback(
    async (
      formaPago: string,
      pasajeros: ConfirmarPasajero[],
      ventaId?: number,
    ): Promise<Venta> => {
      const id = ventaId ?? ventaActual?.id;
      if (!id) throw new Error("No hay venta activa");
      setLoading(true);
      setError(null);
      try {
        const response = await confirmarVentaService(id, formaPago, pasajeros);
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

  const anular = useCallback(
    async (ventaId?: number): Promise<void> => {
      const id = ventaId ?? ventaActual?.id;
      if (!id) throw new Error("No hay venta activa");
      setLoading(true);
      setError(null);
      try {
        await anularVentaService(id);
        if (ventaActual?.id === id) setVentaActual(null);
      } catch (err: any) {
        setError(err?.message || "Error al anular venta");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [ventaActual],
  );

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
    async (detalleId: number, ventaId?: number): Promise<Venta | null> => {
      const id = ventaId ?? ventaActual?.id;
      if (!id) throw new Error("No hay venta activa");
      setLoading(true);
      setError(null);
      try {
        await eliminarDetalleService(detalleId);
        // Si era el último asiento, el backend puede eliminar la venta
        // completa; en ese caso no hay venta que refrescar.
        try {
          const ventaActualizada = await cargarVenta(id);
          return ventaActualizada;
        } catch {
          setVentaActual(null);
          return null;
        }
      } catch (err: any) {
        setError(err?.message || "Error al eliminar pasajero");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [ventaActual, cargarVenta],
  );

  const limpiarVenta = useCallback(() => setVentaActual(null), []);

  return {
    ventaActual,
    loading,
    error,
    iniciar,
    cargarVenta,
    confirmar,
    cancelar,
    anular,
    cambiarAsientoDetalle,
    eliminarDetalleVenta,
    limpiarVenta,
  };
}