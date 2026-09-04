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
  setAsignacionesVehiculosCache,
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
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

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
      async (
        force = false,
      ) => {
        setLoading(
          true,
        );

        try {
          const data =
            await getAsignacionesVehiculos(
              force,
            );

          setAsignaciones(
            data,
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
  |
  | force = false
  |
  | Puede utilizar caché.
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

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZACIÓN LOCAL + CACHE
          |--------------------------------------------------------------------------
          */

          setAsignaciones(
            (
              current,
            ) => {
              const next = [
                response.asignacion,

                ...current,
              ];

              setAsignacionesVehiculosCache(
                next,
              );

              return next;
            },
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
  | CAMBIAR ASIGNACIÓN
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

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZACIÓN LOCAL
          |--------------------------------------------------------------------------
          |
          | Anterior:
          | ACTIVA -> FINALIZADA
          |
          | Nueva:
          | ACTIVA
          |
          */

          setAsignaciones(
            (
              current,
            ) => {
              const reemplazadas =
                current.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    response.anterior.id
                      ? response.anterior
                      : item,
                );

              const next = [
                response.asignacion,

                ...reemplazadas,
              ];

              /*
              |--------------------------------------------------------------------------
              | NUEVO CACHE
              |--------------------------------------------------------------------------
              */

              setAsignacionesVehiculosCache(
                next,
              );

              return next;
            },
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

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZACIÓN LOCAL + CACHE
          |--------------------------------------------------------------------------
          */

          setAsignaciones(
            (
              current,
            ) => {
              const next =
                current.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    asignacion.id
                      ? response.asignacion
                      : item,
                );

              setAsignacionesVehiculosCache(
                next,
              );

              return next;
            },
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
  | ACTUALIZAR
  |--------------------------------------------------------------------------
  |
  | Es el único botón que fuerza GET.
  |
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

  /*
  |--------------------------------------------------------------------------
  | RESUMEN
  |--------------------------------------------------------------------------
  */

  const resumen =
    useMemo(
      () => {
        const total =
          asignaciones.length;

        const activas =
          asignaciones.filter(
            (
              item,
            ) =>
              item.estado ===
              "ACTIVO",
          ).length;

        const finalizadas =
          asignaciones.filter(
            (
              item,
            ) =>
              item.estado ===
              "FINALIZADO",
          ).length;

        return {
          total,

          activas,

          finalizadas,
        };
      },

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

    refresh,

    crear,

    cambiar,

    finalizar,
  };
}