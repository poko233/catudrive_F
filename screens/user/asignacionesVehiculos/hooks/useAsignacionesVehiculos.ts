import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  cambiarAsignacionVehiculo,
  crearAsignacionVehiculo,
  finalizarAsignacionVehiculo,
  getAsignacionesVehiculos,
} from "../services/asignacionVehiculo.service";

import {
  Asignacion,
  AsignacionPayload,
  FinalizarAsignacionPayload,
} from "../types/asignacionVehiculo.types";

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

export function useAsignacionesVehiculos() {
  const [
    asignaciones,
    setAsignaciones,
  ] =
    useState<Asignacion[]>(
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
    processingId,
    setProcessingId,
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
      async () => {
        setLoading(
          true,
        );

        try {
          const response =
            await getAsignacionesVehiculos();

          setAsignaciones(
            response.asignaciones ??
              [],
          );
        } catch (
          error
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "No se pudieron cargar las asignaciones",

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
  | CREAR
  |--------------------------------------------------------------------------
  */

  const crear =
    useCallback(
      async (
        payload:
          AsignacionPayload,
      ): Promise<boolean> => {
        setSaving(
          true,
        );

        try {
          const response =
            await crearAsignacionVehiculo(
              payload,
            );

          setAsignaciones(
            (
              current,
            ) => [
              response.asignacion,

              ...current,
            ],
          );

          Toast.show({
            type:
              "success",

            text1:
              "Vehículo asignado",

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
              "No se pudo asignar el vehículo",

            text2:
              errorMessage(
                error,

                "Revisa los datos seleccionados.",
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
  | CAMBIO
  |--------------------------------------------------------------------------
  */

  const cambiar =
    useCallback(
      async (
        actual:
          Asignacion,

        payload:
          AsignacionPayload,
      ): Promise<boolean> => {
        setSaving(
          true,
        );

        setProcessingId(
          actual.id,
        );

        try {
          const response =
            await cambiarAsignacionVehiculo(
              actual.id,

              payload,
            );

          setAsignaciones(
            (
              current,
            ) => [
              response.asignacion,

              ...current.map(
                (
                  item,
                ) =>
                  item.id ===
                  response.anterior.id
                    ? response.anterior
                    : item,
              ),
            ],
          );

          Toast.show({
            type:
              "success",

            text1:
              "Asignación cambiada",

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
              "No se pudo cambiar la asignación",

            text2:
              errorMessage(
                error,

                "Intenta nuevamente.",
              ),
          });

          return false;
        } finally {
          setSaving(
            false,
          );

          setProcessingId(
            null,
          );
        }
      },

      [],
    );

  /*
  |--------------------------------------------------------------------------
  | FINALIZAR
  |--------------------------------------------------------------------------
  */

  const finalizar =
    useCallback(
      async (
        asignacion:
          Asignacion,

        payload:
          FinalizarAsignacionPayload,
      ): Promise<boolean> => {
        setProcessingId(
          asignacion.id,
        );

        try {
          const response =
            await finalizarAsignacionVehiculo(
              asignacion.id,

              payload,
            );

          setAsignaciones(
            (
              current,
            ) =>
              current.map(
                (
                  item,
                ) =>
                  item.id ===
                  asignacion.id
                    ? response.asignacion
                    : item,
              ),
          );

          Toast.show({
            type:
              "success",

            text1:
              "Asignación finalizada",

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
              "No se pudo finalizar",

            text2:
              errorMessage(
                error,

                "Intenta nuevamente.",
              ),
          });

          return false;
        } finally {
          setProcessingId(
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
          asignaciones.length,

        activas:
          asignaciones.filter(
            (
              item,
            ) =>
              item.estado ===
              "ACTIVO",
          ).length,

        finalizadas:
          asignaciones.filter(
            (
              item,
            ) =>
              item.estado ===
              "FINALIZADO",
          ).length,
      }),

      [
        asignaciones,
      ],
    );

  return {
    asignaciones,

    loading,

    saving,

    processingId,

    resumen,

    refresh:
      cargar,

    crear,

    cambiar,

    finalizar,
  };
}