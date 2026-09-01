import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { useModulesStore } from "@/store/modulesStore";
import { rolService } from "../services/rol.service";
import { PermisoSync, RolConPermisos } from "../types/rol.types";

export function useRolPermisos(rolId: number) {
  const [data, setData] = useState<RolConPermisos | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await rolService.getPermisos(rolId);
      setData(result);
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Error", text2: err.message });
    } finally {
      setLoading(false);
    }
  }, [rolId]);

  const syncPermisos = async (permisos: PermisoSync[]): Promise<boolean> => {
    setSaving(true);
    try {
      await rolService.syncPermisos(rolId, permisos);
      Toast.show({ type: "success", text1: "Permisos guardados correctamente" });
      await useModulesStore
  .getState()
  .refreshSidebar();
      return true;
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Error", text2: err.message });
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, saving, syncPermisos, refetch };
}
