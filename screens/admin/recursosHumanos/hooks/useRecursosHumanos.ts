// screens/admin/recursosHumanos/hooks/useRecursosHumanos.ts

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  actualizarFotoRRHH,
  actualizarUsuarioRRHH,
  getUsuarioDetalleRRHH,
  getUsuarioDetalleRRHHCache,
  getUsuariosRRHH,
  getUsuariosRRHHCache,
} from "../services/recursosHumanos.service";

import {
  FotoUsuarioArchivo,
  UsuarioFormRRHH,
  UsuarioRRHH,
} from "../types/recursosHumanos.types";

/*
|--------------------------------------------------------------------------
| ERROR HELPER
|--------------------------------------------------------------------------
*/

function getErrorMessage(
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

export function useRecursosHumanos() {
  /*
  |--------------------------------------------------------------------------
  | CACHE INICIAL
  |--------------------------------------------------------------------------
  |
  | Esta es una diferencia importante respecto al hook anterior.
  |
  | Antes:
  |
  | usuarios = []
  | loading
  | GET
  |
  | cada vez que la pantalla se montaba.
  |
  | Ahora arrancamos directamente con el cache disponible.
  |
  */

  const initialCache =
    useMemo(
      () =>
        getUsuariosRRHHCache(),
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    usuarios,
    setUsuarios,
  ] =
    useState<UsuarioRRHH[]>(
      () =>
        initialCache
          ?.usuarios ??
        [],
    );

  /*
   * loading:
   *
   * solo para carga inicial REAL.
   *
   * Si tenemos cache:
   * loading comienza en false.
   */

  const [
    loading,
    setLoading,
  ] =
    useState(
      () =>
        !initialCache,
    );

  /*
   * refreshing:
   *
   * exclusivamente para botón Actualizar.
   *
   * Esto evita convertir la tabla en skeleton
   * mientras ya existen datos visibles.
   */

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    guardando,
    setGuardando,
  ] =
    useState(false);

  const [
    cargandoDetalle,
    setCargandoDetalle,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | CARGAR USUARIOS
  |--------------------------------------------------------------------------
  */

  const cargarUsuarios =
    useCallback(
      async (
        force = false,
      ) => {
        /*
        |--------------------------------------------------------------------------
        | ESTADO VISUAL
        |--------------------------------------------------------------------------
        */

        if (force) {
          setRefreshing(
            true,
          );
        } else {
          /*
           * Solo mostramos loading cuando
           * realmente no existe cache.
           */

          const cached =
            getUsuariosRRHHCache();

          if (!cached) {
            setLoading(
              true,
            );
          }
        }

        try {
          const data =
            await getUsuariosRRHH({
              force,
            });

          setUsuarios(
            data.usuarios ??
              [],
          );
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Error al cargar usuarios",

            text2:
              getErrorMessage(
                error,
                "Intenta nuevamente.",
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
  | REFRESH MANUAL
  |--------------------------------------------------------------------------
  |
  | Este es el que utilizará el botón "Actualizar".
  |
  | Fuerza invalidación:
  |
  | cache
  |   ↓
  | GET
  |   ↓
  | cache nuevo
  |
  */

  const refrescarUsuarios =
    useCallback(
      async () => {
        await cargarUsuarios(
          true,
        );
      },
      [
        cargarUsuarios,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CARGAR DETALLE
  |--------------------------------------------------------------------------
  */

  const cargarDetalleUsuario =
    useCallback(
      async (
        id: number,
        force = false,
      ): Promise<UsuarioRRHH | null> => {
        /*
         * Si existe detalle cacheado, no mostramos
         * skeleton innecesariamente.
         */

        const cached =
          force
            ? null
            : getUsuarioDetalleRRHHCache(
                id,
              );

        if (!cached) {
          setCargandoDetalle(
            true,
          );
        }

        try {
          const data =
            await getUsuarioDetalleRRHH(
              id,

              {
                force,
              },
            );

          return (
            data.usuario ??
            null
          );
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Error al cargar detalle",

            text2:
              getErrorMessage(
                error,
                "Intenta nuevamente.",
              ),
          });

          return null;
        } finally {
          setCargandoDetalle(
            false,
          );
        }
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | GUARDAR USUARIO
  |--------------------------------------------------------------------------
  */

  const guardarUsuario =
    useCallback(
      async (
        id: number,
        form: UsuarioFormRRHH,
      ): Promise<UsuarioRRHH | null> => {
        try {
          setGuardando(
            true,
          );

          const data =
            await actualizarUsuarioRRHH(
              id,
              form,
            );

          const actualizado =
            data.usuario;

          /*
          |--------------------------------------------------------------------------
          | ACTUALIZACIÓN LOCAL
          |--------------------------------------------------------------------------
          |
          | El service ya actualizó configCache.
          |
          | Aquí solamente actualizamos el state de React
          | para que la tabla cambie inmediatamente.
          |
          */

          setUsuarios(
            (
              current,
            ) =>
              current.map(
                (
                  usuario,
                ) =>
                  usuario.id ===
                  actualizado.id
                    ? actualizado
                    : usuario,
              ),
          );

          Toast.show({
            type:
              "success",

            text1:
              "Usuario actualizado",

            text2:
              "Los cambios fueron guardados correctamente.",
          });

          return actualizado;
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Error al guardar usuario",

            text2:
              getErrorMessage(
                error,
                "Revisa los datos ingresados.",
              ),
          });

          return null;
        } finally {
          setGuardando(
            false,
          );
        }
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | ACTUALIZAR FOTO
  |--------------------------------------------------------------------------
  */

  const actualizarFotoUsuario =
    useCallback(
      async (
        id: number,
        archivo: FotoUsuarioArchivo,
      ): Promise<UsuarioRRHH | null> => {
        try {
          const data =
            await actualizarFotoRRHH(
              id,
              archivo,
            );

          const actualizado =
            data.usuario;

          /*
           * Actualización React local.
           *
           * NO hacemos:
           *
           * cargarUsuarios()
           */

          setUsuarios(
            (
              current,
            ) =>
              current.map(
                (
                  usuario,
                ) =>
                  usuario.id ===
                  actualizado.id
                    ? actualizado
                    : usuario,
              ),
          );

          return actualizado;
        } catch (
          error: unknown
        ) {
          Toast.show({
            type:
              "error",

            text1:
              "Error al actualizar foto",

            text2:
              getErrorMessage(
                error,
                "Intenta nuevamente.",
              ),
          });

          return null;
        }
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | CARGA INICIAL
  |--------------------------------------------------------------------------
  |
  | Siempre ejecutamos cargarUsuarios().
  |
  | PERO:
  |
  | si existe cache:
  |
  | getUsuariosRRHH()
  | → configCache.remember()
  | → devuelve cache
  | → NO hace GET
  |
  | Esto permite además que configCache determine correctamente
  | si el TTL expiró.
  |
  */

  useEffect(
    () => {
      void cargarUsuarios(
        false,
      );
    },
    [
      cargarUsuarios,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | RETURN
  |--------------------------------------------------------------------------
  */

  return {
    usuarios,

    loading,

    refreshing,

    guardando,

    cargandoDetalle,

    /*
     * carga normal:
     * reutiliza cache.
     */

    cargarUsuarios,

    /*
     * botón actualizar:
     * fuerza backend.
     */

    refrescarUsuarios,

    cargarDetalleUsuario,

    guardarUsuario,

    actualizarFotoUsuario,
  };
}

export default useRecursosHumanos;