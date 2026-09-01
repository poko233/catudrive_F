// screens/admin/empresa/hooks/useSucursales.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  getSucursalListCache,
  setSucursalListCache,
  sucursalService,
} from "../services/sucursalService";

import {
  EstadoSucursal,
  Sucursal,
  SucursalFormData,
  SucursalListFilters,
  SucursalPaginatedResponse,
} from "../types/sucursal.types";

const PER_PAGE =
  15;

const SEARCH_DELAY =
  350;

/*
|--------------------------------------------------------------------------
| ERROR
|--------------------------------------------------------------------------
*/

function errorMessage(
  error: unknown,
  fallback: string,
): string {
  if (
    error instanceof Error &&
    error.message
  ) {
    return error.message;
  }

  return fallback;
}

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function useSucursales(
  empresaId: number,
) {
  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] =
    useState("");

  const [
    page,
    setPage,
  ] =
    useState(1);

  /*
  |--------------------------------------------------------------------------
  | SEARCH DEBOUNCE
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const timer =
        setTimeout(
          () => {
            setDebouncedSearch(
              search.trim(),
            );

            setPage(
              1,
            );
          },
          SEARCH_DELAY,
        );

      return () =>
        clearTimeout(
          timer,
        );
    },
    [
      search,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | FILTROS
  |--------------------------------------------------------------------------
  */

  const filters =
    useMemo<SucursalListFilters>(
      () => ({
        id_empresa:
          empresaId,

        buscar:
          debouncedSearch ||
          undefined,

        por_pagina:
          PER_PAGE,

        page,
      }),
      [
        empresaId,
        debouncedSearch,
        page,
      ],
    );

  const initialCache =
    getSucursalListCache(
      filters,
    );

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    data,
    setData,
  ] =
    useState<SucursalPaginatedResponse>(
      () =>
        initialCache ?? {
          data: [],
          current_page:
            1,
          last_page:
            1,
          per_page:
            PER_PAGE,
          total:
            0,
          from:
            null,
          to:
            null,
        },
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      () =>
        !initialCache,
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    changingStatusId,
    setChangingStatusId,
  ] =
    useState<number | null>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | CARGAR
  |--------------------------------------------------------------------------
  */

  const cargar =
    useCallback(
      async (
        force = false,
      ) => {
        const cached =
          force
            ? null
            : getSucursalListCache(
                filters,
              );

        if (force) {
          setRefreshing(
            true,
          );
        } else if (
          !cached
        ) {
          setLoading(
            true,
          );
        }

        try {
          const response =
            await sucursalService
              .list(
                filters,

                {
                  force,
                },
              );

          setData(
            response,
          );

          return response;
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Error al cargar sucursales",

            text2:
              errorMessage(
                error,
                "Intenta nuevamente.",
              ),
          });

          return null;
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [
        filters,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CAMBIO DE FILTROS / PÁGINA
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      void cargar();
    },
    [
      cargar,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | REFRESH
  |--------------------------------------------------------------------------
  */

  const refrescar =
    useCallback(
      async () => {
        await cargar(
          true,
        );
      },
      [
        cargar,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR CACHE ACTUAL
  |--------------------------------------------------------------------------
  */

  const sincronizarPaginaActual =
    useCallback(
      (
        next:
          SucursalPaginatedResponse,
      ) => {
        setData(
          next,
        );

        setSucursalListCache(
          filters,
          next,
        );
      },
      [
        filters,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | GUARDAR
  |--------------------------------------------------------------------------
  */

  const guardar =
    useCallback(
      async (
        form:
          SucursalFormData,

        actual:
          Sucursal | null,
      ): Promise<boolean> => {
        try {
          setSaving(
            true,
          );

          if (actual) {
            const updated =
              await sucursalService
                .update(
                  actual.id,
                  form,
                );

            const next = {
              ...data,

              data:
                data.data.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    updated.id
                      ? updated
                      : item,
                ),
            };

            sincronizarPaginaActual(
              next,
            );

            Toast.show({
              type:
                "success",

              text1:
                "Sucursal actualizada",
            });
          } else {
            const created =
              await sucursalService
                .create(
                  form,
                );

            /*
             * No hacemos GET adicional.
             *
             * Insertamos la respuesta del POST
             * directamente en la página actual.
             */

            const nextData =
              page === 1
                ? [
                    created,
                    ...data.data,
                  ].slice(
                    0,
                    PER_PAGE,
                  )
                : data.data;

            const next: SucursalPaginatedResponse =
              {
                ...data,

                data:
                  nextData,

                total:
                  data.total +
                  1,

                from:
                  data.total ===
                  0
                    ? 1
                    : data.from,

                to:
                  page ===
                  1
                    ? Math.min(
                        data.total +
                          1,
                        PER_PAGE,
                      )
                    : data.to,

                last_page:
                  Math.max(
                    1,

                    Math.ceil(
                      (
                        data.total +
                        1
                      ) /
                        PER_PAGE,
                    ),
                  ),
              };

            sincronizarPaginaActual(
              next,
            );

            Toast.show({
              type:
                "success",

              text1:
                "Sucursal creada",
            });
          }

          return true;
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "No se pudo guardar la sucursal",

            text2:
              errorMessage(
                error,
                "Revisa los datos ingresados.",
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
        data,
        page,
        sincronizarPaginaActual,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | ESTADO
  |--------------------------------------------------------------------------
  */

  const cambiarEstado =
    useCallback(
      async (
        sucursal:
          Sucursal,
      ): Promise<boolean> => {
        const estado:
          EstadoSucursal =
            sucursal.estado ===
            "Activo"
              ? "Inactivo"
              : "Activo";

        try {
          setChangingStatusId(
            sucursal.id,
          );

          const updated =
            await sucursalService
              .toggleEstado(
                sucursal.id,
                estado,
              );

          const next = {
            ...data,

            data:
              data.data.map(
                (
                  item,
                ) =>
                  item.id ===
                  updated.id
                    ? updated
                    : item,
              ),
          };

          sincronizarPaginaActual(
            next,
          );

          Toast.show({
            type:
              "success",

            text1:
              estado ===
              "Activo"
                ? "Sucursal activada"
                : "Sucursal desactivada",
          });

          return true;
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "No se pudo cambiar el estado",

            text2:
              errorMessage(
                error,
                "Intenta nuevamente.",
              ),
          });

          return false;
        } finally {
          setChangingStatusId(
            null,
          );
        }
      },
      [
        data,
        sincronizarPaginaActual,
      ],
    );

  return {
    sucursales:
      data.data,

    total:
      data.total,

    from:
      data.from ??
      0,

    to:
      data.to ??
      0,

    page,

    totalPages:
      Math.max(
        1,
        data.last_page,
      ),

    perPage:
      PER_PAGE,

    search,

    loading,

    refreshing,

    saving,

    changingStatusId,

    setSearch,

    setPage,

    refrescar,

    guardar,

    cambiarEstado,
  };
}

export default useSucursales;