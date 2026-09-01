// screens/admin/auth/types/auth.types.ts

export interface LoginRequest {
  usuario: string;
  password: string;
}

export interface LoginResponse {
  token: string;

  empresa: {
    id: number;
    nombre: string;
  };

  message: string;
}

export interface SucursalEnEmpresa {
  id: number;
  sucursal: string;
  estado: string;
}

export interface SucursalDirecta {
  id: number;
  sucursal: string;
  ciudad: string | null;
  estado: string;
}

export interface EmpresaDisponible {
  id: number;
  empresa: string;
  sucursales: SucursalEnEmpresa[];
}

export interface RolUsuario {
  id: number;
  rol: string;
  estado: string;
}

export interface Usuario {
  id: number;
  usuario: string;
  nombres: string;
  primer_apellido: string;
  segundo_apellido: string;
  ci: string;
  expedido: string;

  email: string | null;
  telefono: string | null;
  celular: string | null;

  direccion: string;
  genero: string;
  fecha_nac: string;

  foto: string | null;
  codigo_qr: string | null;

  empresas?: EmpresaDisponible[];
  sucursales: SucursalDirecta[];

  roles: RolUsuario[];
}

export type ValidationErrors<T> =
  Partial<Record<keyof T, string>>;