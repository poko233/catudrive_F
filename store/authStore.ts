// store/authStore.ts

import {
  create,
} from "zustand";

import {
  useShallow,
} from "zustand/react/shallow";

import Toast from "react-native-toast-message";

import {
  CK,
  configCache,
} from "../cache/configCache";

import {
  configureHttpSession,
} from "../http/httpSession";

import {
  httpClient,
} from "../http/httpClient";

import {
  fetchMe,
} from "../screens/admin/auth/services/auth.service";

import type {
  Usuario,
} from "../screens/admin/auth/types/auth.types";

import {
  clearSession,
  getSucursalId,
  getToken,
  saveSucursalId,
  saveToken,
} from "../storage/secureStorage";

import {
  getTabsForRoles,
} from "../utils/roleBasedTabs";

import {
  useModulesStore,
} from "./modulesStore";

interface AuthState {
  user:
    Usuario | null;

  loading:
    boolean;

  sucursalId:
    number | null;

  roles:
    string[];

  allowedRoutes:
    Set<string>;

  initialize:
    () => Promise<void>;

  login:
    (
      token: string,
    ) => Promise<void>;

  logout:
    () => Promise<void>;

  changeSucursal:
    (
      sucursalId:
        number | null,
    ) => Promise<void>;

  hasRole:
    (
      role: string,
    ) => boolean;

  hasAnyRole:
    (
      roles: string[],
    ) => boolean;

  _loadProfile:
    () => Promise<void>;
}

// ─────────────────────────────────────────────
// Construir rutas permitidas
// ─────────────────────────────────────────────

function construirAllowedRoutes(
  roles: string[],
): Set<string> {
  const moduleRoutes =
    useModulesStore
      .getState()
      .allowedRoutes;

  const tabRoutes =
    new Set<string>();

  const tabsForRoles =
    getTabsForRoles(
      roles,
    );

  for (
    const tab
    of tabsForRoles
  ) {
    tabRoutes.add(
      `/${tab.name}`,
    );
  }

  return new Set([
    ...moduleRoutes,
    ...tabRoutes,
  ]);
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useAuthStore =
  create<AuthState>(
    (set, get) => ({
      user:
        null,

      loading:
        true,

      sucursalId:
        null,

      roles:
        [],

      allowedRoutes:
        new Set<string>(),

      // ───────────────────────────────────────
      // Inicializar
      // ───────────────────────────────────────

      initialize:
        async () => {
          try {
            const storedToken =
              await getToken();

            if (
              storedToken
            ) {
              await get()
                ._loadProfile();
            }
          } catch {
            /**
             * _loadProfile se encarga
             * de limpiar sesiones inválidas.
             */
          } finally {
            set({
              loading:
                false,
            });
          }
        },

      // ───────────────────────────────────────
      // Login
      // ───────────────────────────────────────

      login:
        async (
          token,
        ) => {
          /**
           * Nunca reutilizar configuración
           * de un usuario anterior.
           */
          configCache
            .invalidateAll();

          useModulesStore
            .getState()
            .clearModulos();

          set({
            user:
              null,

            sucursalId:
              null,

            roles:
              [],

            allowedRoutes:
              new Set<string>(),
          });

          await saveToken(
            token,
          );

          await get()
            ._loadProfile();

          const userName =
            get().user
              ?.nombres ??
            "usuario";

          Toast.show({
            type:
              "success",

            text1:
              "Inicio de sesión exitoso",

            text2:
              `Bienvenido de vuelta, ${userName}.`,
          });
        },

      // ───────────────────────────────────────
      // Logout
      // ───────────────────────────────────────

      logout:
        async () => {
          try {
            /**
             * Desactivamos manejo automático
             * del 401 específicamente aquí.
             *
             * Si el token ya expiró, simplemente
             * continuamos con el logout local.
             */
            await httpClient.postAuth(
              "/api/logout",

              {},

              "No se pudo cerrar la sesión",

              {
                handleUnauthorized:
                  false,
              },
            );
          } catch {
            /**
             * El logout local debe ejecutarse
             * aunque Laravel no responda.
             */
          } finally {
            configCache
              .invalidateAll();

            await clearSession();

            useModulesStore
              .getState()
              .clearModulos();

            set({
              user:
                null,

              sucursalId:
                null,

              roles:
                [],

              allowedRoutes:
                new Set<string>(),

              loading:
                false,
            });
          }
        },

      // ───────────────────────────────────────
      // Cambiar sucursal
      // ───────────────────────────────────────

      changeSucursal:
        async (
          newSucursalId,
        ) => {
          const currentSucursalId =
            get()
              .sucursalId;

          if (
            currentSucursalId ===
            newSucursalId
          ) {
            return;
          }

          /**
           * Se cambia primero el Store.
           *
           * De esta manera httpSession ya
           * devuelve la sucursal nueva para
           * el siguiente request.
           */
          set({
            sucursalId:
              newSucursalId,

            allowedRoutes:
              new Set<string>(),
          });

          await saveSucursalId(
            newSucursalId,
          );

          configCache.invalidate(
            CK.sidebar(),
          );

          const modulesStore =
            useModulesStore
              .getState();

          modulesStore
            .clearModulos();

          await modulesStore
            .fetchModulos();

          set({
            allowedRoutes:
              construirAllowedRoutes(
                get().roles,
              ),
          });
        },

      // ───────────────────────────────────────
      // Roles
      // ───────────────────────────────────────

      hasRole:
        (
          role,
        ) =>
          get()
            .roles
            .includes(
              role,
            ),

      hasAnyRole:
        (
          rolesToCheck,
        ) =>
          rolesToCheck.some(
            (role) =>
              get()
                .roles
                .includes(
                  role,
                ),
          ),

      // ───────────────────────────────────────
      // Perfil
      // ───────────────────────────────────────

      _loadProfile:
        async () => {
          try {
            const previousUserId =
              get()
                .user
                ?.id ??
              null;

            const userData =
              await fetchMe();

            /**
             * Protección ante cambio de usuario
             * sin logout previo.
             */
            if (
              previousUserId !==
                null &&
              previousUserId !==
                userData.id
            ) {
              configCache
                .invalidateAll();

              useModulesStore
                .getState()
                .clearModulos();
            }

            const persistedSucursalId =
              await getSucursalId();

            const sucursalValida =
              persistedSucursalId
                ? userData
                    .sucursales
                    ?.some(
                      (
                        sucursal,
                      ) =>
                        sucursal.id ===
                        persistedSucursalId,
                    )
                : false;

            const sucursalFinal =
              sucursalValida
                ? persistedSucursalId
                : (
                    userData
                      .sucursales
                      ?.find(
                        (
                          sucursal,
                        ) =>
                          sucursal.estado ===
                          "Activo",
                      )
                      ?.id ??
                    userData
                      .sucursales?.[0]
                      ?.id ??
                    null
                  );

            const roles =
              userData.roles.map(
                (rol) =>
                  rol.rol,
              );

            /**
             * Importante:
             *
             * sucursalId se establece ANTES
             * de fetchModulos().
             *
             * httpClient podrá obtenerla a
             * través de httpSession.
             */
            set({
              user:
                userData,

              sucursalId:
                sucursalFinal,

              roles,

              allowedRoutes:
                new Set<string>(),
            });

            if (
              sucursalFinal !==
              persistedSucursalId
            ) {
              await saveSucursalId(
                sucursalFinal,
              );
            }

            const modulesStore =
              useModulesStore
                .getState();

            await modulesStore
              .fetchModulos();

            set({
              allowedRoutes:
                construirAllowedRoutes(
                  roles,
                ),
            });
          } catch {
            configCache
              .invalidateAll();

            await clearSession();

            useModulesStore
              .getState()
              .clearModulos();

            set({
              user:
                null,

              sucursalId:
                null,

              roles:
                [],

              allowedRoutes:
                new Set<string>(),
            });
          }
        },
    }),
  );

// ─────────────────────────────────────────────
// Integración httpClient ↔ authStore
// ─────────────────────────────────────────────

configureHttpSession({
  /**
   * httpClient obtiene la sucursal sin
   * importarnos directamente.
   */
  getSucursalId:
    () =>
      useAuthStore
        .getState()
        .sucursalId,

  /**
   * Este callback solamente realiza
   * limpieza LOCAL.
   *
   * Nunca llama /api/logout, porque podría
   * producir otro 401 y crear un ciclo.
   */
  onUnauthorized:
    async () => {
      const hadActiveUser =
        useAuthStore
          .getState()
          .user !== null;

      configCache
        .invalidateAll();

      await clearSession();

      useModulesStore
        .getState()
        .clearModulos();

      useAuthStore.setState({
        user:
          null,

        sucursalId:
          null,

        roles:
          [],

        allowedRoutes:
          new Set<string>(),

        loading:
          false,
      });

      /**
       * Solo mostramos el aviso si realmente
       * había un usuario cargado.
       *
       * Esto evita múltiples Toast cuando
       * respuestas viejas llegan después
       * de que la sesión ya fue limpiada.
       */
      if (
        hadActiveUser
      ) {
        Toast.show({
          type:
            "info",

          text1:
            "Sesión finalizada",

          text2:
            "Tu sesión expiró. Inicia sesión nuevamente.",

          visibilityTime:
            4000,
        });
      }
    },
});

// ─────────────────────────────────────────────
// Hook público
// ─────────────────────────────────────────────

export const useAuth =
  () => {
    return useAuthStore(
      useShallow(
        (state) => ({
          user:
            state.user,

          loading:
            state.loading,

          isAdmin:
            state.roles.some(
              (role) =>
                role.toLowerCase() ===
                "administrador",
            ),

          sucursalId:
            state.sucursalId,

          roles:
            state.roles,

          allowedRoutes:
            state.allowedRoutes,

          login:
            state.login,

          logout:
            state.logout,

          changeSucursal:
            state.changeSucursal,

          hasRole:
            state.hasRole,

          hasAnyRole:
            state.hasAnyRole,
        }),
      ),
    );
  };