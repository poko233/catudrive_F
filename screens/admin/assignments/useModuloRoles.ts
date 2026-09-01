// screens/admin/assignments/useModuloRoles.ts

import { useModulesStore } from "@/store/modulesStore";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import { adminService } from "../services/admin.service";

import {
  CreateModuloRolPayload,
  ModuloRolAssignment,
} from "../types/admin.types";

export function useModuloRoles() {
  const [
    assignments,
    setAssignments,
  ] =
    useState<
      ModuloRolAssignment[]
    >([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  // ─────────────────────────────────────────────
  // Carga inicial / refresh manual
  // ─────────────────────────────────────────────

  const fetchAssignments =
    useCallback(async () => {
      try {
        setLoading(true);

        const data =
          await adminService.getModuloRoles();

        setAssignments(
          data,
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las asignaciones";

        Toast.show({
          type: "error",
          text1: "Error",
          text2: message,
        });
      } finally {
        setLoading(false);
      }
    }, []);

  // ─────────────────────────────────────────────
  // Asignar módulo a rol
  // ─────────────────────────────────────────────

  const assign = async (
    payload: CreateModuloRolPayload,
  ): Promise<boolean> => {
    try {
      setSaving(true);

      const nuevaAsignacion =
        await adminService.createModuloRol(
          payload,
        );

      /**
       * Actualización local.
       *
       * Evitamos volver a ejecutar:
       *
       * getModuloRoles()
       *
       * que genera múltiples peticiones
       * por cada rol.
       */
      setAssignments(
        (prev) => {
          const existe =
            prev.some(
              (item) =>
                item.id_modulo ===
                  nuevaAsignacion.id_modulo &&
                item.id_rol ===
                  nuevaAsignacion.id_rol,
            );

          if (existe) {
            return prev.map(
              (item) =>
                item.id_modulo ===
                  nuevaAsignacion.id_modulo &&
                item.id_rol ===
                  nuevaAsignacion.id_rol
                  ? {
                      ...item,
                      ...nuevaAsignacion,
                    }
                  : item,
            );
          }

          return [
            ...prev,
            nuevaAsignacion,
          ];
        },
      );

      /**
       * La asignación sí afecta el menú
       * y permisos del sidebar.
       */
      await useModulesStore
        .getState()
        .refreshSidebar();

      Toast.show({
        type: "success",
        text1:
          "Asignación creada",
        text2:
          "Módulo asignado al rol correctamente",
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo asignar el módulo";

      Toast.show({
        type: "error",
        text1: "Error",
        text2: message,
      });

      return false;
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Eliminar asignación
  // ─────────────────────────────────────────────

  const remove = async (
    id_modulo: number,
    id_rol: number,
  ): Promise<boolean> => {
    try {
      setSaving(true);

      await adminService.deleteModuloRol(
        id_modulo,
        id_rol,
      );

      /**
       * Quitamos únicamente la relación
       * eliminada.
       */
      setAssignments(
        (prev) =>
          prev.filter(
            (item) =>
              !(
                item.id_modulo ===
                  id_modulo &&
                item.id_rol ===
                  id_rol
              ),
          ),
      );

      /**
       * Actualizamos el sidebar una sola vez.
       */
      await useModulesStore
        .getState()
        .refreshSidebar();

      Toast.show({
        type: "success",
        text1: "Eliminado",
        text2:
          "Asignación eliminada correctamente",
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la asignación";

      Toast.show({
        type: "error",
        text1: "Error",
        text2: message,
      });

      return false;
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────
  // Carga inicial
  // ─────────────────────────────────────────────

  useEffect(() => {
    void fetchAssignments();
  }, [fetchAssignments]);

  return {
    assignments,

    loading,

    saving,

    /**
     * Se conserva para refresh manual,
     * no para CRUD.
     */
    fetchAssignments,

    assign,

    remove,
  };
}