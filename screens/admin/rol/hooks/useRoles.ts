// screens/admin/rol/hooks/useRoles.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import { rolService } from "../services/rol.service";

import {
  Rol,
  RolPayload,
} from "../types/rol.types";

export function useRoles() {
  const [
    roles,
    setRoles,
  ] = useState<Rol[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<number | null>(
    null,
  );

  const [
    search,
    setSearch,
  ] = useState("");

  // ─────────────────────────────────────────────
  // Carga inicial / refresh manual
  // ─────────────────────────────────────────────

  const fetchRoles =
    useCallback(async () => {
      try {
        setLoading(true);

        const data =
          await rolService.getAll();

        setRoles(data);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "No se pudieron cargar los roles";

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
  // Crear
  // ─────────────────────────────────────────────

  const createRol = async (
    payload: RolPayload,
  ): Promise<boolean> => {
    try {
      setSaving(true);

      const nuevo =
        await rolService.create(
          payload,
        );

      /**
       * Actualización local.
       *
       * Ya no hacemos:
       *
       * GET /api/roles
       */
      setRoles((prev) => {
        const existe =
          prev.some(
            (rol) =>
              rol.id ===
              nuevo.id,
          );

        if (existe) {
          return prev.map(
            (rol) =>
              rol.id ===
              nuevo.id
                ? nuevo
                : rol,
          );
        }

        return [
          ...prev,
          nuevo,
        ];
      });

      Toast.show({
        type: "success",
        text1: "Rol creado",
        text2:
          "El rol se registró correctamente",
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear el rol";

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
  // Editar
  // ─────────────────────────────────────────────

  const updateRol = async (
    id: number,
    payload: RolPayload,
  ): Promise<boolean> => {
    try {
      setSaving(true);

      const actualizado =
        await rolService.update(
          id,
          payload,
        );

      /**
       * Sustituimos únicamente el rol
       * modificado.
       */
      setRoles((prev) =>
        prev.map((rol) =>
          rol.id === id
            ? actualizado
            : rol,
        ),
      );

      Toast.show({
        type: "success",
        text1: "Rol actualizado",
        text2:
          "Los cambios se guardaron correctamente",
      });

      return true;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el rol";

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
  // Eliminar
  // ─────────────────────────────────────────────

  const deleteRol = async (
    id: number,
  ): Promise<void> => {
    try {
      setDeletingId(id);

      await rolService.delete(id);

      /**
       * Eliminamos únicamente el rol
       * correspondiente del estado local.
       */
      setRoles((prev) =>
        prev.filter(
          (rol) =>
            rol.id !== id,
        ),
      );

      Toast.show({
        type: "success",
        text1: "Rol eliminado",
        text2:
          "El rol fue eliminado correctamente",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo eliminar el rol";

      Toast.show({
        type: "error",
        text1: "Error",
        text2: message,
      });
    } finally {
      setDeletingId(null);
    }
  };

  // ─────────────────────────────────────────────
  // Filtro
  // ─────────────────────────────────────────────

  const filteredRoles =
    useMemo(() => {
      const q =
        search
          .trim()
          .toLowerCase();

      if (!q) {
        return roles;
      }

      return roles.filter(
        (item) =>
          item.rol
            ?.toLowerCase()
            .includes(q) ||
          item.descripcion
            ?.toLowerCase()
            .includes(q),
      );
    }, [
      roles,
      search,
    ]);

  // ─────────────────────────────────────────────
  // Carga inicial
  // ─────────────────────────────────────────────

  useEffect(() => {
    void fetchRoles();
  }, [fetchRoles]);

  return {
    roles,

    filteredRoles,

    loading,

    saving,

    deletingId,

    search,

    setSearch,

    /**
     * Se conserva para refresh manual.
     *
     * Ya no se usa después de CRUD.
     */
    fetchRoles,

    createRol,

    updateRol,

    deleteRol,
  };
}