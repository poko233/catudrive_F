// screens/admin/formularios/useFormularios.ts

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  useModulesStore,
} from "@/store/modulesStore";

import {
  adminService,
} from "../services/admin.service";

import {
  AdminFormulario,
  CreateFormularioPayload,
} from "../types/admin.types";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof
    Error
  ) {
    return (
      error.message ||
      fallback
    );
  }

  return fallback;
}

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function useFormularios() {
  const [
    formularios,
    setFormularios,
  ] =
    useState<
      AdminFormulario[]
    >(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    saving,
    setSaving,
  ] =
    useState(
      false,
    );

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<
      number | null
    >(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | SIDEBAR
  |--------------------------------------------------------------------------
  */

  const refreshSidebar =
    useCallback(
      async () => {
        try {
          await useModulesStore
            .getState()
            .refreshSidebar();
        } catch (
          error
        ) {
          /*
           * El CRUD ya pudo haberse guardado correctamente.
           *
           * Un error refrescando el Sidebar no debe hacer creer
           * al usuario que falló la creación/edición/eliminación.
           */

          console.warn(
            "No se pudo actualizar el Sidebar:",
            error,
          );
        }
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | LISTAR
  |--------------------------------------------------------------------------
  */

  const fetchFormularios =
    useCallback(
      async () => {
        try {
          setLoading(
            true,
          );

          const data =
            await adminService
              .getFormularios();

          setFormularios(
            data,
          );
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Error",

            text2:
              getErrorMessage(
                error,
                "No se pudieron cargar los formularios.",
              ),
          });
        } finally {
          setLoading(
            false,
          );
        }
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | CREAR
  |--------------------------------------------------------------------------
  */

  const createFormulario =
    useCallback(
      async (
        payload:
          CreateFormularioPayload,
      ): Promise<boolean> => {
        if (
          saving
        ) {
          return false;
        }

        try {
          setSaving(
            true,
          );

          const created =
            await adminService
              .createFormulario(
                payload,
              );

          setFormularios(
            (
              current,
            ) => [
              created,
              ...current,
            ],
          );

          Toast.show({
            type:
              "success",

            text1:
              "Formulario creado",

            text2:
              `"${created.formulario}" fue creado correctamente.`,
          });

          await refreshSidebar();

          return true;
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Error al crear formulario",

            text2:
              getErrorMessage(
                error,
                "No se pudo crear el formulario.",
              ),
          });

          return false;
        } finally {
          setSaving(
            false,
          );
        }
      },
      [
        refreshSidebar,
        saving,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR
  |--------------------------------------------------------------------------
  */

  const updateFormulario =
    useCallback(
      async (
        id:
          number,

        payload:
          CreateFormularioPayload,
      ): Promise<boolean> => {
        if (
          saving
        ) {
          return false;
        }

        try {
          setSaving(
            true,
          );

          const updated =
            await adminService
              .updateFormulario(
                id,
                payload,
              );

          setFormularios(
            (
              current,
            ) =>
              current.map(
                (
                  formulario,
                ) =>
                  formulario.id ===
                  id
                    ? updated
                    : formulario,
              ),
          );

          Toast.show({
            type:
              "success",

            text1:
              "Formulario actualizado",

            text2:
              `"${updated.formulario}" fue actualizado correctamente.`,
          });

          await refreshSidebar();

          return true;
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Error al actualizar formulario",

            text2:
              getErrorMessage(
                error,
                "No se pudo actualizar el formulario.",
              ),
          });

          return false;
        } finally {
          setSaving(
            false,
          );
        }
      },
      [
        refreshSidebar,
        saving,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ELIMINAR
  |--------------------------------------------------------------------------
  */

  const deleteFormulario =
    useCallback(
      async (
        formulario:
          AdminFormulario,
      ): Promise<boolean> => {
        if (
          deletingId !==
          null
        ) {
          return false;
        }

        try {
          setDeletingId(
            formulario.id,
          );

          await adminService
            .deleteFormulario(
              formulario.id,
            );

          setFormularios(
            (
              current,
            ) =>
              current.filter(
                (
                  item,
                ) =>
                  item.id !==
                  formulario.id,
              ),
          );

          Toast.show({
            type:
              "success",

            text1:
              "Formulario eliminado",

            text2:
              `"${formulario.formulario}" fue eliminado correctamente.`,
          });

          await refreshSidebar();

          return true;
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Error al eliminar formulario",

            text2:
              getErrorMessage(
                error,
                "No se pudo eliminar el formulario.",
              ),
          });

          return false;
        } finally {
          setDeletingId(
            null,
          );
        }
      },
      [
        deletingId,
        refreshSidebar,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | INIT
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      void fetchFormularios();
    },
    [
      fetchFormularios,
    ],
  );

  return {
    formularios,

    loading,

    saving,

    deletingId,

    fetchFormularios,

    createFormulario,

    updateFormulario,

    deleteFormulario,
  };
}

export default useFormularios;