import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  encomiendaService,
} from "../services/encomienda.service";

import {
  AsignarEncomiendaPayload,
  Encomienda,
  EncomiendaCatalogos,
  EncomiendaPayload,
  EncomiendaQrResponse,
} from "../types/encomienda.types";

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

export function useEncomiendas() {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    encomiendas,
    setEncomiendas,
  ] =
    useState<
      Encomienda[]
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
    processingId,
    setProcessingId,
  ] =
    useState<
      number | null
    >(
      null,
    );

  const [
    catalogos,
    setCatalogos,
  ] =
    useState<
      EncomiendaCatalogos | null
    >(
      null,
    );

  const [
    loadingCatalogos,
    setLoadingCatalogos,
  ] =
    useState(
      false,
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
        setLoading(
          true,
        );

        try {
          const data =
            await encomiendaService
              .listar(
                force,
              );

          setEncomiendas(
            data,
          );
        } catch (
          error
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "No se pudieron cargar las encomiendas",

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
          EncomiendaPayload,
      ): Promise<boolean> => {
        setSaving(
          true,
        );

        try {
          const response =
            await encomiendaService
              .crear(
                payload,
              );

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZACIÓN LOCAL + CACHE
          |--------------------------------------------------------------------------
          */

          setEncomiendas(
            (
              current,
            ) => {
              const next = [
                response.encomienda,

                ...current,
              ];

              encomiendaService
                .guardarLista(
                  next,
                );

              return next;
            },
          );

          Toast.show({
            type:
              "success",

            text1:
              "Encomienda registrada",

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
              "No se pudo registrar la encomienda",

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
  | ACTUALIZAR
  |--------------------------------------------------------------------------
  */

  const actualizar =
    useCallback(
      async (
        encomienda:
          Encomienda,

        payload:
          EncomiendaPayload,
      ): Promise<boolean> => {
        setSaving(
          true,
        );

        setProcessingId(
          encomienda.id,
        );

        try {
          const response =
            await encomiendaService
              .actualizar(
                encomienda.id,

                payload,
              );

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZACIÓN LOCAL + CACHE
          |--------------------------------------------------------------------------
          */

          setEncomiendas(
            (
              current,
            ) => {
              const next =
                current.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    encomienda.id
                      ? response.encomienda
                      : item,
                );

              encomiendaService
                .guardarLista(
                  next,
                );

              return next;
            },
          );

          Toast.show({
            type:
              "success",

            text1:
              "Encomienda actualizada",

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
              "No se pudo actualizar la encomienda",

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

          setProcessingId(
            null,
          );
        }
      },

      [],
    );

  /*
  |--------------------------------------------------------------------------
  | CARGAR CATÁLOGOS
  |--------------------------------------------------------------------------
  */

  const cargarCatalogos =
    useCallback(
      async (): Promise<
        boolean
      > => {
        setLoadingCatalogos(
          true,
        );

        try {
          const data =
            await encomiendaService
              .catalogos();

          setCatalogos(
            data,
          );

          return true;
        } catch (
          error
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "No se pudieron cargar los datos",

            text2:
              errorMessage(
                error,

                "No fue posible cargar las rutas y asignaciones.",
              ),
          });

          return false;
        } finally {
          setLoadingCatalogos(
            false,
          );
        }
      },

      [],
    );

  /*
  |--------------------------------------------------------------------------
  | ASIGNAR
  |--------------------------------------------------------------------------
  */

  const asignar =
    useCallback(
      async (
        encomienda:
          Encomienda,

        payload:
          AsignarEncomiendaPayload,
      ): Promise<boolean> => {
        setSaving(
          true,
        );

        setProcessingId(
          encomienda.id,
        );

        try {
          const response =
            await encomiendaService
              .asignar(
                encomienda.id,

                payload,
              );

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZACIÓN LOCAL + CACHE
          |--------------------------------------------------------------------------
          */

          setEncomiendas(
            (
              current,
            ) => {
              const next =
                current.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    encomienda.id
                      ? response.encomienda
                      : item,
                );

              encomiendaService
                .guardarLista(
                  next,
                );

              return next;
            },
          );

          Toast.show({
            type:
              "success",

            text1:
              "Encomienda asignada",

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
              "No se pudo asignar la encomienda",

            text2:
              errorMessage(
                error,

                "Revisa la ruta, el vehículo y el chofer.",
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
  | ENTREGAR
  |--------------------------------------------------------------------------
  */

  const entregar =
    useCallback(
      async (
        encomienda:
          Encomienda,
      ): Promise<boolean> => {
        setProcessingId(
          encomienda.id,
        );

        try {
          const response =
            await encomiendaService
              .entregar(
                encomienda.id,
              );

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZACIÓN LOCAL + CACHE
          |--------------------------------------------------------------------------
          */

          setEncomiendas(
            (
              current,
            ) => {
              const next =
                current.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    encomienda.id
                      ? response.encomienda
                      : item,
                );

              encomiendaService
                .guardarLista(
                  next,
                );

              return next;
            },
          );

          Toast.show({
            type:
              "success",

            text1:
              "Encomienda entregada",

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
              "No se pudo entregar la encomienda",

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
  | ANULAR
  |--------------------------------------------------------------------------
  */

  const anular =
    useCallback(
      async (
        encomienda:
          Encomienda,
      ): Promise<boolean> => {
        setProcessingId(
          encomienda.id,
        );

        try {
          const response =
            await encomiendaService
              .anular(
                encomienda.id,
              );

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZACIÓN LOCAL + CACHE
          |--------------------------------------------------------------------------
          */

          setEncomiendas(
            (
              current,
            ) => {
              const next =
                current.map(
                  (
                    item,
                  ) =>
                    item.id ===
                    encomienda.id
                      ? response.encomienda
                      : item,
                );

              encomiendaService
                .guardarLista(
                  next,
                );

              return next;
            },
          );

          Toast.show({
            type:
              "success",

            text1:
              "Encomienda anulada",

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
              "No se pudo anular la encomienda",

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
  | BUSCAR POR GUÍA
  |--------------------------------------------------------------------------
  */

  const buscarPorGuia =
    useCallback(
      async (
        guia: string,
      ): Promise<
        Encomienda | null
      > => {
        const valor =
          guia.trim();

        if (!valor) {
          return null;
        }

        try {
          return await encomiendaService
            .buscarPorGuia(
              valor,
            );
        } catch (
          error
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Encomienda no encontrada",

            text2:
              errorMessage(
                error,

                "Verifica el número de guía.",
              ),
          });

          return null;
        }
      },

      [],
    );

  /*
  |--------------------------------------------------------------------------
  | OBTENER QR
  |--------------------------------------------------------------------------
  */

  const obtenerQr =
    useCallback(
      async (
        encomienda: Encomienda,
      ): Promise<EncomiendaQrResponse | null> => {
        try {
          return await encomiendaService
            .obtenerQr(
              encomienda.id,
            );
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "No se pudo cargar el QR",
            text2: errorMessage(error, "Intenta nuevamente."),
          });
          return null;
        }
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | ESCANEAR QR
  |--------------------------------------------------------------------------
  */

  const escanearQr =
    useCallback(
      async (
        qr: string,
      ): Promise<Encomienda | null> => {
        try {
          return await encomiendaService
            .escanearQr({ qr });
        } catch (error) {
          Toast.show({
            type: "error",
            text1: "QR no válido",
            text2: errorMessage(error, "No se pudo consultar la encomienda."),
          });
          return null;
        }
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR
  |--------------------------------------------------------------------------
  |
  | Único flujo que fuerza nuevamente el GET general.
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
          encomiendas.length;

        const registradas =
          encomiendas.filter(
            (
              item,
            ) =>
              item.estado ===
              "REGISTRADA",
          ).length;

        const enTransito =
          encomiendas.filter(
            (
              item,
            ) =>
              item.estado ===
              "EN_TRANSITO",
          ).length;

        const entregadas =
          encomiendas.filter(
            (
              item,
            ) =>
              item.estado ===
              "ENTREGADA",
          ).length;

        const anuladas =
          encomiendas.filter(
            (
              item,
            ) =>
              item.estado ===
              "ANULADA",
          ).length;

        const ingresos =
          encomiendas
            .filter(
              (
                item,
              ) =>
                item.estado !==
                "ANULADA",
            )
            .reduce(
              (
                totalActual,

                item,
              ) =>
                totalActual +
                Number(
                  item.precio ??
                    0,
                ),

              0,
            );

        return {
          total,

          registradas,

          enTransito,

          entregadas,

          anuladas,

          ingresos,
        };
      },

      [
        encomiendas,
      ],
    );

  return {
    encomiendas,

    loading,

    saving,

    processingId,

    catalogos,

    loadingCatalogos,

    resumen,

    refresh,

    crear,

    actualizar,

    cargarCatalogos,

    asignar,

    entregar,

    anular,

    buscarPorGuia,

    obtenerQr,

    escanearQr,
  };
}