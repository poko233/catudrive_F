// screens/admin/rol/services/rol.service.ts

import { httpClient } from "@http";

import {
  CK,
  TTL,
  configCache,
} from "../../../../cache/configCache";

import {
  PermisoSync,
  Rol,
  RolConPermisos,
  RolPayload,
} from "../types/rol.types";

export const rolService = {
  // ─────────────────────────────────────────────
  // Listado
  // ─────────────────────────────────────────────

  getAll: async (): Promise<Rol[]> => {
    const key = CK.roles();

    const cached =
      configCache.get<Rol[]>(key);

    if (cached) {
      return cached;
    }

    const res =
      await httpClient.getAuth<any>(
        "/api/roles",
        "Error al cargar roles",
      );

    const data: Rol[] =
      res.data ??
      res.roles ??
      [];

    configCache.set(
      key,
      data,
      TTL.lista,
    );

    return data;
  },

  // ─────────────────────────────────────────────
  // Crear
  // ─────────────────────────────────────────────

  create: async (
    payload: RolPayload,
  ): Promise<Rol> => {
    const res =
      await httpClient.postAuth<any>(
        "/api/roles",
        payload,
        "Error al crear rol",
      );

    const rol: Rol | undefined =
      res.data ??
      res.rol;

    if (!rol) {
      throw new Error(
        "El servidor no devolvió el rol creado.",
      );
    }

    configCache.invalidate(
      CK.roles(),
      CK.todosRolesPermisos(),
    );

    return rol;
  },

  // ─────────────────────────────────────────────
  // Editar
  // ─────────────────────────────────────────────

  update: async (
    id: number,
    payload: RolPayload,
  ): Promise<Rol> => {
    const res =
      await httpClient.putAuth<any>(
        `/api/roles/${id}`,
        payload,
        "Error al actualizar rol",
      );

    const rol: Rol | undefined =
      res.data ??
      res.rol;

    if (!rol) {
      throw new Error(
        "El servidor no devolvió el rol actualizado.",
      );
    }

    configCache.invalidate(
      CK.roles(),
      CK.rolPermisos(id),
      CK.todosRolesPermisos(),
    );

    return rol;
  },

  // ─────────────────────────────────────────────
  // Eliminar
  // ─────────────────────────────────────────────

  delete: async (
    id: number,
  ): Promise<void> => {
    await httpClient.deleteAuth(
      `/api/roles/${id}`,
      "Error al eliminar rol",
    );

    configCache.invalidate(
      CK.roles(),
      CK.rolPermisos(id),
      CK.todosRolesPermisos(),
    );
  },

  // ─────────────────────────────────────────────
  // Permisos de un rol
  // ─────────────────────────────────────────────

  getPermisos: async (
    id: number,
  ): Promise<RolConPermisos> => {
    const key =
      CK.rolPermisos(id);

    const cached =
      configCache.get<RolConPermisos>(
        key,
      );

    if (cached) {
      return cached;
    }

    const res =
      await httpClient.getAuth<{
        data: RolConPermisos;
      }>(
        `/api/roles/${id}/permisos`,
        "Error al cargar permisos del rol",
      );

    configCache.set(
      key,
      res.data,
      TTL.permisos,
    );

    return res.data;
  },

  // ─────────────────────────────────────────────
  // Sincronizar permisos
  // ─────────────────────────────────────────────

  syncPermisos: async (
    id: number,
    permisos: PermisoSync[],
  ): Promise<void> => {
    await httpClient.putAuth(
      `/api/roles/${id}/permisos`,
      {
        permisos,
      },
      "Error al guardar permisos",
    );

    configCache.invalidate(
      CK.rolPermisos(id),
      CK.sidebar(),
      CK.todosRolesPermisos(),
    );
  },

  // ─────────────────────────────────────────────
  // Todos los roles con permisos
  // ─────────────────────────────────────────────

  getAllConPermisos:
    async (): Promise<
      RolConPermisos[]
    > => {
      return configCache.remember(
        CK.todosRolesPermisos(),
        TTL.permisos,
        async () => {
          const res =
            await httpClient.getAuth<{
              data: RolConPermisos[];
            }>(
              "/api/roles/permisos",
              "Error al cargar permisos de roles",
            );

          return res.data ?? [];
        },
      );
    },
};