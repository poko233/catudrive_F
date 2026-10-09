import { httpClient } from "@/http/httpClient";
import type { DashboardChoferesResponse, DashboardPeriodo } from "../types/dashboard.types";

/**
 * El servidor aplica el alcance por rol. No se envían IDs de chofer ni de usuario.
 * Se evita caché para mostrar movimientos y recaudaciones actualizados.
 */
export const dashboardService = {
  choferes(periodo: DashboardPeriodo = "mes"): Promise<DashboardChoferesResponse> {
    return httpClient.getAuth<DashboardChoferesResponse>(
      `/api/dashboard/choferes?periodo=${periodo}`,
      "No se pudo cargar la información financiera del dashboard.",
    );
  },
};
