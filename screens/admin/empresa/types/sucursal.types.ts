// screens/admin/empresa/types/sucursal.types.ts

export type EstadoSucursal =
  | "Activo"
  | "Inactivo";

export interface Sucursal {
  id: number;

  id_empresa: number;

  empresa?: {
    id: number;
    empresa: string;
  };

  sucursal: string;

  responsable?: string | null;

  direccion?: string | null;

  longitud?: string | null;

  latitud?: string | null;

  telefono?: string | null;

  celular?: string | null;

  email?: string | null;

  pais?: string | null;

  ciudad?: string | null;

  localidad?: string | null;

  imagen?: string | null;

  estado: EstadoSucursal;

  created_at?: string;

  updated_at?: string;
}

export interface SucursalFormData {
  id_empresa: number;

  sucursal: string;

  responsable?: string;

  direccion?: string;

  telefono?: string;

  celular?: string;

  email?: string;

  estado?: EstadoSucursal;
}

export interface SucursalListFilters {
  id_empresa?: number;

  estado?:
    | EstadoSucursal
    | "";

  buscar?: string;

  por_pagina?: number;

  page?: number;
}

export interface SucursalApiResponse {
  data: Sucursal;

  message?: string;
}

export interface SucursalPaginatedResponse {
  data: Sucursal[];

  current_page: number;

  last_page: number;

  per_page: number;

  total: number;

  from: number | null;

  to: number | null;
}