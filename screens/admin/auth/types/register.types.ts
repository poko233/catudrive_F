// Tipos para el registro de usuarios (wizard)

export interface RegisterFormData {
  // Paso 1
  usuario: string;
  password: string;
  roles: string[]; // nombres de rol, ej: ["Estudiante","Docente"]

  // Paso 2
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string; // opcional pero siempre string (vacío si no)
  ci: string;
  expedido: string; // valores permitidos: LPZ, CBBA, OR, ...
  genero: "MASCULINO" | "FEMENINO" | "";
  fecha_nac: string; // YYYY-MM-DD

  // Paso 3
  email: string;
  telefono: string;
  celular: string;
  direccion: string;
}

export interface RolItem {
  id: number;
  rol: string;
  descripcion: string;
}

export interface RegisterResponse {
  data: {
    id: number;
    usuario: string;
    ci: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string | null;
    genero: string;
    fecha_nac: string;
    email: string | null;
    telefono: string | null;
    celular: string | null;
    direccion: string | null;
    expedido: string | null;
    foto: string | null;
    codigo_qr: string | null;
    roles: string[];
    estado: string;
    created_at: string;
    updated_at: string;
  };
  message: string;
}

export type ValidationErrors = Partial<Record<keyof RegisterFormData, string>>;
