// store/modulesStore.ts

import { create } from "zustand";

import { httpClient } from "../http/httpClient";

import { useVisibilityStore } from "./visibilityStore";

// ─────────────────────────────────────────────
// Tipos públicos
// ─────────────────────────────────────────────

export interface MiFormulario {
  id: number;
  nombre: string;
  ruta: string | null;
  icono: string | null;
  descripcion: string;
  acciones: string[];
}

export interface MiModulo {
  id: number;
  nombre: string;
  descripcion: string;
  icono: string;
  formularios: MiFormulario[];
}

// ─────────────────────────────────────────────
// Respuesta GET /api/sidebar
// ─────────────────────────────────────────────

interface SidebarFormulario {
  id: number;
  nombre: string;
  ruta: string | null;

  icono?: string | null;
  descripcion?: string;

  acciones?: string[];
  selectores_ocultos?: string[];
}

interface SidebarModulo {
  id: number;
  nombre: string;

  icono?: string;
  descripcion?: string;

  formularios: SidebarFormulario[];
}

interface SidebarResponse {
  data: SidebarModulo[];
}

// ─────────────────────────────────────────────
// Estado
// ─────────────────────────────────────────────

interface ModulesState {
  modulos: MiModulo[];

  loading: boolean;
  error: string | null;

  allowedRoutes: Set<string>;

  /**
   * Indica que ya se realizó al menos
   * una carga satisfactoria.
   */
  loaded: boolean;

  /**
   * Indica que los datos actuales deben
   * considerarse desactualizados.
   */
  dirty: boolean;

  /**
   * Momento de la última carga correcta.
   */
  lastFetched: number | null;

  /**
   * Indica que existe actualmente una
   * carga del sidebar en ejecución.
   */
  inFlight: boolean;

  fetchModulos: () => Promise<void>;

  /**
   * Marca los módulos como desactualizados.
   *
   * Más adelante lo utilizaremos después
   * de CRUD y cambios de permisos.
   */
  markDirty: () => void;

  refreshSidebar: () => Promise<void>;

  clearModulos: () => void;

  tienePermiso: (
    modulo: string,
    formulario: string,
    accion:
      | "Crear"
      | "Ver"
      | "Editar"
      | "Eliminar",
  ) => boolean;
}

// ─────────────────────────────────────────────
// Promise compartida
// ─────────────────────────────────────────────

let fetchModulosPromise:
  | Promise<void>
  | null = null;

/**
 * Incrementa cuando se limpia el Store.
 *
 * Así una respuesta antigua no puede
 * volver a llenar el Store después de
 * logout/reset.
 */
let fetchVersion = 0;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function mapSidebarToStore(
  raw: SidebarModulo[],
): MiModulo[] {
  return raw.map((modulo) => ({
    id: modulo.id,

    nombre: modulo.nombre,

    descripcion:
      modulo.descripcion ?? "",

    icono:
      modulo.icono ?? "apps",

    formularios:
      (modulo.formularios ?? []).map(
        (formulario) => ({
          id: formulario.id,

          nombre:
            formulario.nombre,

          ruta:
            formulario.ruta,

          icono:
            formulario.icono ??
            null,

          descripcion:
            formulario.descripcion ??
            "",

          acciones:
            formulario.acciones ??
            [],
        }),
      ),
  }));
}

function buildAllowedRoutes(
  modulos: MiModulo[],
): Set<string> {
  const routes =
    new Set<string>();

  for (const modulo of modulos) {
    if (
      modulo.formularios.length > 0
    ) {
      for (
        const formulario
        of modulo.formularios
      ) {
        const clean =
          (formulario.ruta ?? "")
            .replace(/\\/g, "/")
            .replace(/\/+$/, "") ||
          "/";

        routes.add(clean);
      }

      continue;
    }

    const slug = `/${(
      modulo.nombre ?? ""
    )
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")}`;

    routes.add(slug);
  }

  return routes;
}

// ─────────────────────────────────────────────
// Store
// ─────────────────────────────────────────────

export const useModulesStore =
  create<ModulesState>(
    (set, get) => ({
      modulos: [],

      loading: false,

      error: null,

      allowedRoutes:
        new Set<string>(),

      loaded: false,

      dirty: true,

      lastFetched: null,

      inFlight: false,

      // ───────────────────────────────────────
      // Cargar módulos/sidebar
      // ───────────────────────────────────────

      fetchModulos: () => {
        /**
         * Remontaje sin cambios (ej. cambio de tema):
         * si ya está cargado y limpio, no se repite
         * GET /api/sidebar. refreshSidebar marca dirty
         * antes, y clearModulos resetea loaded.
         */
        if (
          get().loaded &&
          !get().dirty
        ) {
          return Promise.resolve();
        }

        /**
         * Si ya existe una carga,
         * todas las llamadas reutilizan
         * exactamente la misma Promise.
         */
        if (fetchModulosPromise) {
          return fetchModulosPromise;
        }

        const currentVersion =
          fetchVersion;

        fetchModulosPromise =
          (async () => {
            set({
              loading: true,
              inFlight: true,
              error: null,
            });

            try {
              const response =
                await httpClient.getAuth<SidebarResponse>(
                  "/api/sidebar",
                  "Error al cargar el menú lateral",
                );

              /**
               * El Store pudo haber sido
               * limpiado mientras esperábamos.
               */
              if (
                currentVersion !==
                fetchVersion
              ) {
                return;
              }

              const raw =
                response.data ?? [];

              /**
               * Los mismos datos del sidebar
               * alimentan el Store de
               * visibilidad.
               */
              useVisibilityStore
                .getState()
                .loadFromSidebarData(
                  raw,
                );

              const modulos =
                mapSidebarToStore(
                  raw,
                );

              const allowedRoutes =
                buildAllowedRoutes(
                  modulos,
                );

              set({
                modulos,

                allowedRoutes,

                error: null,

                loaded: true,

                dirty: false,

                lastFetched:
                  Date.now(),
              });
            } catch (error) {
              if (
                currentVersion !==
                fetchVersion
              ) {
                return;
              }

              const message =
                error instanceof Error
                  ? error.message
                  : "Error al cargar el menú lateral";

              set({
                error: message,

                modulos: [],

                allowedRoutes:
                  new Set<string>(),

                /**
                 * Falló la carga, por lo que
                 * los datos siguen pendientes
                 * de actualización.
                 */
                dirty: true,
              });
            } finally {
              /**
               * Solo modificamos el estado si
               * esta carga sigue perteneciendo
               * a la sesión/versión actual.
               */
              if (
                currentVersion ===
                fetchVersion
              ) {
                set({
                  loading: false,
                  inFlight: false,
                });
              }

              fetchModulosPromise =
                null;
            }
          })();

        return fetchModulosPromise;
      },

      // ───────────────────────────────────────
      // Marcar desactualizado
      // ───────────────────────────────────────

      markDirty: () => {
        set({
          dirty: true,
        });
      },

      refreshSidebar: async () => {
  /**
   * Este es el único punto central para
   * actualizar el sidebar después de CRUD,
   * permisos o asignaciones.
   */
  get().markDirty();

  await get().fetchModulos();
},

      // ───────────────────────────────────────
      // Limpiar
      // ───────────────────────────────────────

      clearModulos: () => {
        /**
         * Invalida cualquier respuesta
         * actualmente en vuelo.
         */
        fetchVersion += 1;

        fetchModulosPromise =
          null;

        useVisibilityStore
          .getState()
          .clear();

        set({
          modulos: [],

          allowedRoutes:
            new Set<string>(),

          loading: false,

          error: null,

          loaded: false,

          dirty: true,

          lastFetched: null,

          inFlight: false,
        });
      },

      // ───────────────────────────────────────
      // Permisos
      // ───────────────────────────────────────

      tienePermiso: (
        modulo,
        formulario,
        accion,
      ) => {
        const all =
          get().modulos;

        const moduloEncontrado =
          all.find(
            (item) =>
              item.nombre.toLowerCase() ===
              modulo.toLowerCase(),
          );

        const formularioEncontrado =
          moduloEncontrado
            ? moduloEncontrado.formularios.find(
                (item) =>
                  item.nombre.toLowerCase() ===
                  formulario.toLowerCase(),
              )
            : all
                .flatMap(
                  (item) =>
                    item.formularios,
                )
                .find(
                  (item) =>
                    item.nombre.toLowerCase() ===
                    formulario.toLowerCase(),
                );

        if (
          !formularioEncontrado
        ) {
          return false;
        }

        return formularioEncontrado.acciones.some(
          (item) =>
            item.toLowerCase() ===
            accion.toLowerCase(),
        );
      },
    }),
  );