// screens/admin/services/admin.service.ts

import { httpClient } from "@http";

import {
  CK,
  TTL,
  configCache,
} from "../../../cache/configCache";

import {
  AdminFormulario,
  CreateFormularioModuloPayload,
  CreateFormularioPayload,
  CreateModuloRolPayload,
  FormularioModuloAssignment,
  ModuloRolAssignment,
} from "../types/admin.types";

interface ApiItem<T> {
  success?: boolean;
  message?: string;
  data: T;
}

interface ApiList<T> {
  message?: string;
  data: T[];
}

// ─────────────────────────────────────────────
// Respuestas individuales
// ─────────────────────────────────────────────

interface FMBackend {
  data: {
    modulo: {
      id: number;
      modulo: string;
    };

    formularios: Array<{
      id: number;
      formulario: string;
      ruta: string | null;
      descripcion: string | null;
      estado: string;
    }>;
  };

  message?: string;
}

interface MRBackend {
  data: {
    rol: {
      id: number;
      rol: string;
    };

    modulos: Array<{
      id: number;
      modulo: string;
      icono: string | null;
      descripcion: string | null;
      estado?: string;
    }>;
  };

  message?: string;
}

// ─────────────────────────────────────────────
// Invalidaciones
// ─────────────────────────────────────────────

function invalidateFormularios(): void {
  configCache.invalidate(
    CK.formularios(),
    CK.modulos(),
    CK.sidebar(),
  );
}

function invalidateFormularioModulo(): void {
  configCache.invalidate(
    CK.formularios(),
    CK.modulos(),
    CK.sidebar(),
  );
}

// ─────────────────────────────────────────────
// Servicio
// ─────────────────────────────────────────────

export const adminService = {
  // ───────────────────────────────────────────
  // Formularios
  // ───────────────────────────────────────────

  getFormularios:
    async (): Promise<
      AdminFormulario[]
    > => {
      return configCache.remember(
        CK.formularios(),

        TTL.lista,

        async () => {
          const res =
            await httpClient.getAuth<{
              data:
                AdminFormulario[];
            }>(
              "/api/formularios",

              "Error al cargar formularios",
            );

          return (
            res.data ??
            []
          );
        },
      );
    },

  createFormulario:
    async (
      payload:
        CreateFormularioPayload,
    ): Promise<AdminFormulario> => {
      const res =
        await httpClient.postAuth<
          ApiItem<AdminFormulario>
        >(
          "/api/formularios",

          payload,

          "No se pudo crear el formulario",
        );

      invalidateFormularios();

      return res.data;
    },

  updateFormulario:
    async (
      id: number,

      payload:
        CreateFormularioPayload,
    ): Promise<AdminFormulario> => {
      const res =
        await httpClient.putAuth<
          ApiItem<AdminFormulario>
        >(
          `/api/formularios/${id}`,

          payload,

          "No se pudo actualizar el formulario",
        );

      invalidateFormularios();

      return res.data;
    },

  deleteFormulario:
    async (
      id: number,
    ): Promise<void> => {
      await httpClient.deleteAuth<unknown>(
        `/api/formularios/${id}`,

        "No se pudo eliminar el formulario",
      );

      invalidateFormularios();
    },

  // ───────────────────────────────────────────
  // Formulario ↔ Módulo
  // ───────────────────────────────────────────

  getFormularioModulos:
    async (): Promise<
      FormularioModuloAssignment[]
    > => {
      /**
       * Antes:
       *
       * GET /api/modulos
       *
       * +
       *
       * N ×
       * GET /api/modulos/{id}/formularios
       *
       *
       * Ahora:
       *
       * 1 único request HTTP.
       */

      const res =
        await httpClient.getAuth<
          ApiList<FormularioModuloAssignment>
        >(
          "/api/modulos/formularios/asignaciones",

          "No se pudieron cargar las asignaciones",
        );

      return (
        res.data ??
        []
      );
    },

  createFormularioModulo:
    async (
      payload:
        CreateFormularioModuloPayload,
    ): Promise<FormularioModuloAssignment> => {
      /**
       * Este GET NO es N+1.
       *
       * Solo se utiliza durante una operación
       * de sincronización individual porque
       * el backend espera formulario_ids
       * completos.
       */

      const currentRes =
        await httpClient.getAuth<FMBackend>(
          `/api/modulos/${payload.id_modulo}/formularios`,

          "No se pudieron cargar los formularios actuales",
        );

      const currentIds =
        currentRes
          .data
          .formularios
          .map(
            (formulario) =>
              formulario.id,
          );

      const nextIds = [
        ...new Set([
          ...currentIds,

          payload.id_formulario,
        ]),
      ];

      /**
       * Aprovechamos la respuesta del sync.
       *
       * Así obtenemos correctamente el
       * formulario recién añadido.
       */

      const syncRes =
        await httpClient.postAuth<FMBackend>(
          `/api/modulos/${payload.id_modulo}/formularios`,

          {
            formulario_ids:
              nextIds,
          },

          "No se pudo asignar el formulario al módulo",
        );

      invalidateFormularioModulo();

      const formulario =
        syncRes
          .data
          .formularios
          .find(
            (item) =>
              item.id ===
              payload.id_formulario,
          );

      return {
        id_formulario:
          payload.id_formulario,

        id_modulo:
          payload.id_modulo,

        formulario:
          formulario?.formulario,

        modulo:
          syncRes
            .data
            .modulo
            .modulo,
      };
    },

  deleteFormularioModulo:
    async (
      id_formulario:
        number,

      id_modulo:
        number,
    ): Promise<void> => {
      await httpClient.deleteAuth<unknown>(
        `/api/modulos/${id_modulo}/formularios/${id_formulario}`,

        "No se pudo eliminar la asignación",
      );

      invalidateFormularioModulo();
    },

  // ───────────────────────────────────────────
  // Módulo ↔ Rol
  // ───────────────────────────────────────────

  getModuloRoles:
    async (): Promise<
      ModuloRolAssignment[]
    > => {
      /**
       * Antes:
       *
       * GET /api/roles
       *
       * +
       *
       * N ×
       * GET /api/roles/{id}/modulos
       *
       *
       * Ahora:
       *
       * 1 único request HTTP.
       */

      const res =
        await httpClient.getAuth<
          ApiList<ModuloRolAssignment>
        >(
          "/api/roles/modulos/asignaciones",

          "No se pudieron cargar las asignaciones",
        );

      return (
        res.data ??
        []
      );
    },

  createModuloRol:
    async (
      payload:
        CreateModuloRolPayload,
    ): Promise<ModuloRolAssignment> => {
      /**
       * Operación individual de sync.
       *
       * No forma parte del N+1 de carga.
       */

      const currentRes =
        await httpClient.getAuth<MRBackend>(
          `/api/roles/${payload.id_rol}/modulos`,

          "No se pudieron cargar los módulos actuales",
        );

      const currentIds =
        currentRes
          .data
          .modulos
          .map(
            (modulo) =>
              modulo.id,
          );

      const nextIds = [
        ...new Set([
          ...currentIds,

          payload.id_modulo,
        ]),
      ];

      const syncRes =
        await httpClient.postAuth<MRBackend>(
          `/api/roles/${payload.id_rol}/modulos`,

          {
            modulo_ids:
              nextIds,
          },

          "No se pudo asignar el módulo al rol",
        );

      configCache.invalidate(
        CK.sidebar(),
      );

      const modulo =
        syncRes
          .data
          .modulos
          .find(
            (item) =>
              item.id ===
              payload.id_modulo,
          );

      return {
        id_modulo:
          payload.id_modulo,

        id_rol:
          payload.id_rol,

        nombre_rol:
          syncRes
            .data
            .rol
            .rol,

        nombre_modulo:
          modulo?.modulo,

        icono_modulo:
          modulo?.icono ??
          undefined,

        descripcion_modulo:
          modulo?.descripcion ??
          undefined,
      };
    },

  deleteModuloRol:
    async (
      id_modulo:
        number,

      id_rol:
        number,
    ): Promise<void> => {
      await httpClient.deleteAuth<unknown>(
        `/api/roles/${id_rol}/modulos/${id_modulo}`,

        "No se pudo eliminar la asignación módulo-rol",
      );

      configCache.invalidate(
        CK.sidebar(),
      );
    },
};