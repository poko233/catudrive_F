import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  actualizarChofer,
  actualizarFotoChofer,
  crearChofer,
  darBajaChofer,
  getChoferes,
  getChoferesCache,
  regenerarQrChofer,
} from "../services/chofer.service";

import {
  Chofer,
  ChoferForm,
  FotoChoferArchivo,
} from "../types/chofer.types";

/*
|--------------------------------------------------------------------------
| MENSAJE DE ERROR
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

export function useChoferes() {
  const cache =
    getChoferesCache();

  const [
    choferes,
    setChoferes,
  ] =
    useState<Chofer[]>(
      cache?.choferes ??
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
    useState(false);

  const [
    deletingId,
    setDeletingId,
  ] =
    useState<
      number | null
    >(null);

  const [
    qrLoadingId,
    setQrLoadingId,
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
          choferes.length ===
            0
        ) {
          setLoading(
            true,
          );
        }

        try {
          const response =
            await getChoferes({
              force,
            });

          setChoferes(
            response.choferes ??
              [],
          );
        } catch (
          error
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "No se pudieron cargar los choferes",

            text2:
              errorMessage(
                error,

                "Ocurrió un error al consultar los registros.",
              ),
          });
        } finally {
          setLoading(
            false,
          );
        }
      },

      [
        choferes.length,
      ],
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

    [],
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
          ChoferForm,

        chofer?:
          | Chofer
          | null,

        foto?:
          | FotoChoferArchivo
          | null,
      ): Promise<boolean> => {
        setSaving(
          true,
        );

        try {
          const response =
            chofer
              ? await actualizarChofer(
                  chofer.id,
                  form,
                )
              : await crearChofer(
                  form,
                );

          let final =
            response.chofer;

          /*
          |--------------------------------------------------------------------------
          | FOTOGRAFÍA
          |--------------------------------------------------------------------------
          */

          if (foto) {
            try {
              const fotoResponse =
                await actualizarFotoChofer(
                  final.id,
                  foto,
                );

              final =
                fotoResponse.chofer;
            } catch {
              Toast.show({
                type:
                  "info",

                text1:
                  "Chofer guardado",

                text2:
                  "Los datos fueron guardados, pero no se pudo subir la fotografía.",
              });
            }
          }

          /*
          |--------------------------------------------------------------------------
          | ESTADO LOCAL
          |--------------------------------------------------------------------------
          */

          setChoferes(
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
              chofer
                ? "Chofer actualizado"
                : "Chofer registrado",

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
              "No se pudo guardar",

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
  | DAR DE BAJA
  |--------------------------------------------------------------------------
  */

  const darBaja =
    useCallback(
      async (
        chofer:
          Chofer,
      ): Promise<boolean> => {
        setDeletingId(
          chofer.id,
        );

        try {
          const response =
            await darBajaChofer(
              chofer.id,
            );

          setChoferes(
            (
              actuales,
            ) =>
              actuales.map(
                (
                  item,
                ) =>
                  item.id ===
                  chofer.id
                    ? response.chofer
                    : item,
              ),
          );

          Toast.show({
            type:
              "success",

            text1:
              "Chofer dado de baja",

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
  | REGENERAR QR
  |--------------------------------------------------------------------------
  */

  const regenerarQr =
    useCallback(
      async (
        chofer:
          Chofer,
      ): Promise<
        Chofer | null
      > => {
        setQrLoadingId(
          chofer.id,
        );

        try {
          const response =
            await regenerarQrChofer(
              chofer.id,
            );

          setChoferes(
            (
              actuales,
            ) =>
              actuales.map(
                (
                  item,
                ) =>
                  item.id ===
                  chofer.id
                    ? response.chofer
                    : item,
              ),
          );

          Toast.show({
            type:
              "success",

            text1:
              "QR regenerado",

            text2:
              response.message,
          });

          return response.chofer;
        } catch (
          error
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "No se pudo regenerar el QR",

            text2:
              errorMessage(
                error,

                "Intenta nuevamente.",
              ),
          });

          return null;
        } finally {
          setQrLoadingId(
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
          choferes.length,

        activos:
          choferes.filter(
            (
              item,
            ) =>
              item.estado ===
              "ACTIVO",
          ).length,

        inactivos:
          choferes.filter(
            (
              item,
            ) =>
              item.estado ===
              "INACTIVO",
          ).length,
      }),

      [
        choferes,
      ],
    );

  return {
    choferes,

    loading,

    saving,

    deletingId,

    qrLoadingId,

    resumen,

    refresh:
      () =>
        cargar(
          true,
        ),

    guardar,

    darBaja,

    regenerarQr,
  };
}