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
  getRutasCache,
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
  const cache =
    getRutasCache();

  const [
    rutas,
    setRutas,
  ] =
    useState<Ruta[]>(
      cache?.rutas ??
        [],
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      !cache,
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
  */

  const cargar =
    useCallback(
      async (
        force = false,
      ) => {
        if (
          force ||
          !getRutasCache()
        ) {
          setLoading(
            true,
          );
        }

        try {
          const response =
            await getRutas({
              force,
            });

          setRutas(
            response.rutas ??
              [],
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

                "Ocurrió un error al consultar las rutas.",
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
  | GUARDAR
  |--------------------------------------------------------------------------
  */

  const guardar =
    useCallback(
      async (
        payload:
          RutaPayload,

        ruta?:
          | Ruta
          | null,
      ): Promise<boolean> => {
        setSaving(
          true,
        );

        try {
          const response =
            ruta
              ? await actualizarRuta(
                  ruta.id,

                  payload,
                )
              : await crearRuta(
                  payload,
                );

          const final =
            response.ruta;

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZAR ESTADO LOCAL
          |--------------------------------------------------------------------------
          */

          setRutas(
            (
              actuales,
            ) => {
              const existe =
                actuales.some(
                  (
                    item,
                  ) =>
                    item.id ===
                    final.id,
                );

              return existe
                ? actuales.map(
                    (
                      item,
                    ) =>
                      item.id ===
                      final.id
                        ? final
                        : item,
                  )
                : [
                    final,
                    ...actuales,
                  ];
            },
          );

          Toast.show({
            type:
              "success",

            text1:
              ruta
                ? "Ruta actualizada"
                : "Ruta registrada",

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
              "No se pudo guardar la ruta",

            text2:
              errorMessage(
                error,

                "Revisa los datos e intenta nuevamente.",
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

          setRutas(
            (
              actuales,
            ) =>
              actuales.map(
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
              ruta,
            ) =>
              ruta.estado ===
              "ACTIVA",
          ).length,

        inactivas:
          rutas.filter(
            (
              ruta,
            ) =>
              ruta.estado ===
              "INACTIVA",
          ).length,

        viajes:
          rutas.reduce(
            (
              total,
              ruta,
            ) =>
              total +
              Number(
                ruta.viajes_count ??
                  0,
              ),

            0,
          ),
      }),

      [
        rutas,
      ],
    );

  return {
    rutas,

    loading,

    saving,

    deletingId,

    resumen,

    refresh:
      () =>
        cargar(
          true,
        ),

    guardar,

    darBaja,
  };
}