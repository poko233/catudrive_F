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
  moduloService,
} from "../services/modulo.service";

import {
  CreateModuloPayload,
  Modulo,
  UpdateModuloPayload,
} from "../types/modulo.types";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function ordenarModulos(
  modulos: Modulo[],
): Modulo[] {
  return [
    ...modulos,
  ].sort(
    (
      a,
      b,
    ) =>
      Number(
        a.orden ??
          0,
      ) -
        Number(
          b.orden ??
            0,
        ) ||
      a.modulo.localeCompare(
        b.modulo,
        "es",
      ),
  );
}

function errorMessage(
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

export function useModulos() {
  const [
    modulos,
    setModulos,
  ] =
    useState<
      Modulo[]
    >(
      [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false,
    );

  const [
    savingOrder,
    setSavingOrder,
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
  | CARGAR
  |--------------------------------------------------------------------------
  */

  const fetchModulos =
    useCallback(
      async (
        force =
          false,
      ) => {
        if (
          force
        ) {
          setRefreshing(
            true,
          );
        } else {
          setLoading(
            true,
          );
        }

        try {
          const data =
            await moduloService
              .getAll({
                force,
              });

          setModulos(
            ordenarModulos(
              data,
            ),
          );
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Error al cargar módulos",

            text2:
              errorMessage(
                error,
                "No se pudieron cargar los módulos.",
              ),
          });
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const onRefresh =
    useCallback(
      async () => {
        await fetchModulos(
          true,
        );
      },
      [
        fetchModulos,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CREAR
  |--------------------------------------------------------------------------
  */

  const createModulo =
    useCallback(
      async (
        payload:
          CreateModuloPayload,
      ): Promise<boolean> => {
        try {
          const nuevo =
            await moduloService
              .create(
                payload,
              );

          setModulos(
            (
              current,
            ) =>
              ordenarModulos([
                ...current,
                nuevo,
              ]),
          );

          Toast.show({
            type:
              "success",

            text1:
              "Módulo creado",

            text2:
              `"${nuevo.modulo}" fue creado correctamente.`,
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
              "Error al crear módulo",

            text2:
              errorMessage(
                error,
                "No se pudo crear el módulo.",
              ),
          });

          return false;
        }
      },
      [
        refreshSidebar,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR
  |--------------------------------------------------------------------------
  */

  const updateModulo =
    useCallback(
      async (
        id: number,

        payload:
          UpdateModuloPayload,
      ): Promise<boolean> => {
        try {
          const updated =
            await moduloService
              .update(
                id,
                payload,
              );

          setModulos(
            (
              current,
            ) =>
              ordenarModulos(
                current.map(
                  (
                    modulo,
                  ) =>
                    modulo.id ===
                    id
                      ? updated
                      : modulo,
                ),
              ),
          );

          Toast.show({
            type:
              "success",

            text1:
              "Módulo actualizado",
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
              "Error al editar módulo",

            text2:
              errorMessage(
                error,
                "No se pudo actualizar el módulo.",
              ),
          });

          return false;
        }
      },
      [
        refreshSidebar,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | GUARDAR ORDEN
  |--------------------------------------------------------------------------
  */

  const reorderModulos =
    useCallback(
      async (
        ids:
          number[],
      ): Promise<boolean> => {
        if (
          savingOrder
        ) {
          return false;
        }

        try {
          setSavingOrder(
            true,
          );

          const updated =
            await moduloService
              .reorder(
                ids,
              );

          setModulos(
            updated,
          );

          /*
           * Este refresh ya obtiene el Sidebar
           * con el nuevo orden.
           */

          await refreshSidebar();

          Toast.show({
            type:
              "success",

            text1:
              "Orden actualizado",

            text2:
              "El Sidebar fue actualizado correctamente.",
          });

          return true;
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "No se pudo guardar el orden",

            text2:
              errorMessage(
                error,
                "Intenta nuevamente.",
              ),
          });

          return false;
        } finally {
          setSavingOrder(
            false,
          );
        }
      },
      [
        refreshSidebar,
        savingOrder,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ELIMINAR
  |--------------------------------------------------------------------------
  */

  const deleteModulo =
    useCallback(
      async (
        modulo:
          Modulo,
      ): Promise<boolean> => {
        if (
          deletingId !==
          null
        ) {
          return false;
        }

        try {
          setDeletingId(
            modulo.id,
          );

          await moduloService
            .delete(
              modulo.id,
            );

          setModulos(
            (
              current,
            ) =>
              current.filter(
                (
                  item,
                ) =>
                  item.id !==
                  modulo.id,
              ),
          );

          Toast.show({
            type:
              "success",

            text1:
              "Módulo eliminado",

            text2:
              `"${modulo.modulo}" fue eliminado correctamente.`,
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
              "Error al eliminar módulo",

            text2:
              errorMessage(
                error,
                "No se pudo eliminar el módulo.",
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
  | INITIAL
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      void fetchModulos();
    },
    [
      fetchModulos,
    ],
  );

  return {
    modulos,

    loading,

    refreshing,

    savingOrder,

    deletingId,

    fetchModulos,

    onRefresh,

    createModulo,

    updateModulo,

    reorderModulos,

    deleteModulo,
  };
}

export default useModulos;