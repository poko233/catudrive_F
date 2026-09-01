// screens/admin/auth/services/auth.service.ts

import { httpClient } from "../../../../http/httpClient";
import type {
  LoginRequest,
  LoginResponse,
  Usuario,
} from "../types/auth.types";

export const loginUser = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  return httpClient.post<LoginResponse>(
    "/api/login",
    data,
    "Error al iniciar sesión"
  );
};

/**
 * Obtiene el perfil completo del usuario.
 * Retorna el objeto "data" directamente.
 */
export const fetchMe = async (): Promise<Usuario> => {
  const response =
    await httpClient.getAuth<{
      data: Usuario;
      message: string;
    }>(
      "/api/me",
      "Error al obtener el perfil"
    );

  return response.data;
};