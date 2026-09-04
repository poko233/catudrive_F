import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  actualizarRuta,
  crearRuta,
  darBajaRuta,
  getRutas,
} from "../services/ruta.service";

import {
  Ruta,
  RutaPayload,
} from "../types/ruta.types";

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
    error instanceof
      Error &&
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

export function useRutas() {
  const [
    rutas,
    setRutas,
  ] =
    useState<Ruta[]>(
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
    >(null);

  /*
  |--------------------------------------------------------------------------
  | CARGAR
  |--------------------------------------------------------------------------
  |
  | force = false
  |     ↓
  | usa cache
  |
  | force = true
  |     ↓
  | invalida cache
  | hace GET nuevo
  |
  */

  const cargar =
    useCallback(
      async (
        force =
          false,
      ) => {
        setLoading(
          true,
        );

        try {
          const data =
            await getRutas(
              force,
            );

          setRutas(
            data,
          );
        } catch (
          error
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "No se pudieron cargar las rutas",

            text2:
              errorMessage(
                error,

                "Intenta nuevamente.",
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
  | PRIMERA CARGA
  |--------------------------------------------------------------------------
  |
  | NO fuerza GET.
  |
  | Si Rutas ya fue cargado durante
  | los últimos 5 minutos, usa cache.
  |
  */

  useEffect(
    () => {
      void cargar(
        false,
      );
    },

    [
      cargar,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | CREAR / EDITAR
  |--------------------------------------------------------------------------
  */

  const guardar =
    useCallback(
      async (
        ruta:
          | Ruta
          | null,

        payload:
          RutaPayload,
      ): Promise<boolean> => {
        setSaving(
          true,
        );

        try {
          /*
          |--------------------------------------------------------------------------
          | EDITAR
          |--------------------------------------------------------------------------
          */

          if (ruta) {
            const response =
              await actualizarRuta(
                ruta.id,

                payload,
              );

            /*
            |--------------------------------------------------------------------------
            | ACTUALIZACIÓN LOCAL
            |--------------------------------------------------------------------------
            |
            | No hacemos otro GET.
            |
            */

            setRutas(
              (
                current,
              ) =>
                current.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    ruta.id
                      ? response.ruta
                      : item,
                ),
            );

            Toast.show({
              type:
                "success",

              text1:
                "Ruta actualizada",

              text2:
                response.message,
            });

            return true;
          }

          /*
          |--------------------------------------------------------------------------
          | CREAR
          |--------------------------------------------------------------------------
          */

          const response =
            await crearRuta(
              payload,
            );

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZACIÓN LOCAL
          |--------------------------------------------------------------------------
          |
          | Tampoco hacemos GET.
          |
          */

          setRutas(
            (
              current,
            ) => [
              response.ruta,

              ...current,
            ],
          );

          Toast.show({
            type:
              "success",

            text1:
              "Ruta registrada",

            text2:
              response.message,
          });

          return true;
        } catch (
          error
        ) {
          Toast.show({
            type:
              "error",

            text1:
              ruta
                ? "No se pudo actualizar la ruta"
                : "No se pudo registrar la ruta",

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

      [],
    );

  /*
  |--------------------------------------------------------------------------
  | BAJA
  |--------------------------------------------------------------------------
  */

  const darBaja =
    useCallback(
      async (
        ruta:
          Ruta,
      ): Promise<boolean> => {
        setDeletingId(
          ruta.id,
        );

        try {
          const response =
            await darBajaRuta(
              ruta.id,
            );

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZAR LOCALMENTE
          |--------------------------------------------------------------------------
          */

          setRutas(
            (
              current,
            ) =>
              current.map(
                (
                  item,
                ) =>
                  item.id ===
                  ruta.id
                    ? response.ruta
                    : item,
              ),
          );

          Toast.show({
            type:
              "success",

            text1:
              "Ruta dada de baja",

            text2:
              response.message,
          });

          return true;
        } catch (
          error
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "No se pudo dar de baja",

            text2:
              errorMessage(
                error,

                "Intenta nuevamente.",
              ),
          });

          return false;
        } finally {
          setDeletingId(
            null,
          );
        }
      },

      [],
    );

  /*
  |--------------------------------------------------------------------------
  | RESUMEN
  |--------------------------------------------------------------------------
  */

  const resumen =
    useMemo(
      () => ({
        total:
          rutas.length,

        activas:
          rutas.filter(
            (
              item,
            ) =>
              item.estado ===
              "ACTIVA",
          ).length,

        inactivas:
          rutas.filter(
            (
              item,
            ) =>
              item.estado ===
              "INACTIVA",
          ).length,

        conViajes:
          rutas.filter(
            (
              item,
            ) =>
              Number(
                item.viajes_count ??
                  0,
              ) >
              0,
          ).length,
      }),

      [
        rutas,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | REFRESH REAL
  |--------------------------------------------------------------------------
  */

  const refresh =
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

  return {
    rutas,

    loading,

    saving,

    deletingId,

    resumen,

    refresh,

    guardar,

    darBaja,
  };
}