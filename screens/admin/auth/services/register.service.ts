import { httpClient } from "@/http/httpClient";
import type {
  RegisterFormData,
  RegisterResponse,
  RolItem,
} from "../types/register.types";

export const fetchRoles = async (): Promise<RolItem[]> => {
  const response = await httpClient.getAuth<{
    success: boolean;
    roles: RolItem[];
  }>("/api/roles", "Error al cargar roles");
  return response.roles;
};

export const registerUser = async (
  data: RegisterFormData,
): Promise<RegisterResponse> => {
  // Mapear al formato que espera el backend
  const payload = {
    usuario: data.usuario,
    password: data.password,
    ci: data.ci,
    nombres: data.nombres,
    apellidoPaterno: data.apellidoPaterno,
    apellidoMaterno: data.apellidoMaterno || null,
    genero: data.genero,
    fecha_nac: data.fecha_nac,
    email: data.email || null,
    telefono: data.telefono || null,
    celular: data.celular || null,
    direccion: data.direccion || null,
    expedido: data.expedido || null,
    roles: data.roles,
  };

  return httpClient.postAuth<RegisterResponse>(
    "/api/register",
    payload,
    "Error al registrar usuario",
  );
};
