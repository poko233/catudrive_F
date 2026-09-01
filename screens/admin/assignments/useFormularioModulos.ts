import { useModulesStore } from "@/store/modulesStore";
import { useCallback, useEffect, useState } from "react";
import Toast from "react-native-toast-message";
import { adminService } from "../services/admin.service";
import { CreateFormularioModuloPayload, FormularioModuloAssignment } from "../types/admin.types";

export function useFormularioModulos() {
  const [assignments, setAssignments] = useState<FormularioModuloAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminService.getFormularioModulos();
      setAssignments(data);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "No se pudieron cargar las asignaciones",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const assign = async (payload: CreateFormularioModuloPayload): Promise<boolean> => {
    try {
      setSaving(true);
      const created = await adminService.createFormularioModulo(payload);
      setAssignments((prev) => [created, ...prev]);
      Toast.show({
        type: "success",
        text1: "Asignación creada",
        text2: "Formulario asignado al módulo",
      });
     await useModulesStore
  .getState()
  .refreshSidebar();
      return true;
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.message || "No se pudo asignar el formulario",
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const removeAssignment = async (id_formulario: number, id_modulo: number): Promise<boolean> => {
    try {
      await adminService.deleteFormularioModulo(id_formulario, id_modulo);
      setAssignments((prev) =>
        prev.filter(
          (a) => !(a.id_formulario === id_formulario && a.id_modulo === id_modulo),
        ),
      );
      Toast.show({ type: "success", text1: "Asignación eliminada" });
      return true;
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Error", text2: error?.message });
      return false;
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,
    loading,
    saving,
    fetchAssignments,
    assign,
    removeAssignment,
  };
}
