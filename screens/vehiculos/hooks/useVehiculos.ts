import { useCallback, useEffect, useMemo, useState } from "react";
import Toast from "react-native-toast-message";
import type { Vehiculo, VehiculoForm } from "../types/vehiculo.types";
import * as vehiculoService from "../services/vehiculo.service";

export function useVehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const resumen = useMemo(() => {
    const total = vehiculos.length;
    const operativos = vehiculos.filter((v) => v.estado === "Operativo").length;
    const enMantenimiento = vehiculos.filter(
      (v) => v.estado === "En mantenimiento",
    ).length;
    const bajas = vehiculos.filter((v) => v.estado === "Baja").length;
    return { total, operativos, enMantenimiento, bajas };
  }, [vehiculos]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const data = await vehiculoService.getVehiculos();
      setVehiculos(data);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "No se pudieron cargar los vehículos",
        text2: error instanceof Error ? error.message : "Error de red",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const guardar = useCallback(
    async (
      form: VehiculoForm,
      vehiculo?: Vehiculo | null,
    ): Promise<boolean> => {
      try {
        setSaving(true);
        if (vehiculo) {
          await vehiculoService.updateVehiculo(vehiculo.id, form);
        } else {
          await vehiculoService.createVehiculo(form);
        }
        await refresh();
        Toast.show({
          type: "success",
          text1: "Vehículo guardado correctamente",
        });
        return true;
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "No se pudo guardar el vehículo",
          text2: error instanceof Error ? error.message : "Error de red",
        });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const darBaja = useCallback(
    async (vehiculo: Vehiculo): Promise<boolean> => {
      try {
        setDeletingId(vehiculo.id);
        await vehiculoService.deleteVehiculo(vehiculo.id);
        await refresh();
        Toast.show({
          type: "success",
          text1: "Vehículo dado de baja correctamente",
        });
        return true;
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "No se pudo dar de baja",
          text2: error instanceof Error ? error.message : "Error de red",
        });
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [refresh],
  );

  return {
    vehiculos,
    loading,
    saving,
    deletingId,
    resumen,
    refresh,
    guardar,
    darBaja,
  };
}
