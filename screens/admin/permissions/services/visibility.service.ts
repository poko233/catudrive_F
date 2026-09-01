// screens/admin/permisos/services/visibility.service.ts

import {
  CK,
  TTL,
  configCache,
} from "@/cache/configCache";

import { httpClient } from "@/http/httpClient";

import type { FormularioAccion } from "../types/visibility.types";

export const visibilityService = {
  /**
   * Obtiene todas las reglas de visibilidad.
   *
   * Usa configCache.remember() para evitar
   * GET duplicados cuando varios componentes
   * solicitan las mismas reglas al mismo tiempo.
   */
  getAll: async (): Promise<FormularioAccion[]> => {
    return configCache.remember(
      CK.formularioAcciones(),
      TTL.permisos,
      async () => {
        const res =
          await httpClient.getAuth<{
            data: FormularioAccion[];
          }>(
            "/api/formulario_acciones",
            "No se pudieron cargar las reglas de visibilidad",
          );

        return res.data ?? [];
      },
    );
  },

  /**
   * Crea una nueva regla de visibilidad.
   *
   * Por defecto habilitado = false,
   * es decir, la regla oculta el selector.
   */
  create: async (
    id_rol: number,
    id_formulario: number,
    selector_html: string,
  ): Promise<FormularioAccion> => {
    const res =
      await httpClient.postAuth<{
        data: FormularioAccion;
      }>(
        "/api/formulario_acciones",
        {
          id_rol,
          id_formulario,
          selector_html,
          habilitado: false,
        },
        "No se pudo crear la regla de visibilidad",
      );

    /**
     * El listado cacheado ya no es válido
     * después de crear una regla.
     */
    configCache.invalidate(
      CK.formularioAcciones(),
    );

    return res.data;
  },

  /**
   * Elimina una regla de visibilidad.
   */
  remove: async (
    id: number,
  ): Promise<void> => {
    await httpClient.deleteAuth(
      `/api/formulario_acciones/${id}`,
      "No se pudo eliminar la regla de visibilidad",
    );

    /**
     * Invalidamos para que la próxima lectura
     * obtenga los datos actualizados.
     */
    configCache.invalidate(
      CK.formularioAcciones(),
    );
  },
};