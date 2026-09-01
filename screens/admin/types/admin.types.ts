import { ReactNode } from 'react';

export type Estado = "Activo" | "Inactivo";

export interface ColumnDef {
  key: string;
  header: string;
  width?: number;
  flex?: number;
  render?: (value: any, item: any) => ReactNode;
}

export interface CrudConfig<T> {
  fetchAll: () => Promise<T[]>;
  create: (data: Partial<T>) => Promise<T>;
  update: (id: number, data: Partial<T>) => Promise<T>;
  delete: (id: number) => Promise<void>;
  searchFields: (keyof T)[];
}

export interface AdminFormulario {
  id: number;
  formulario: string;
  ruta: string | null;
  descripcion: string | null;
  estado: Estado;
  modulos?: { id: number; modulo: string }[];
}

export interface CreateFormularioPayload {
  formulario: string;
  ruta?: string | null;
  descripcion?: string;
  estado: Estado;
  modulos?: number[];
}

export interface FormularioModuloAssignment {
  id_formulario: number;
  id_modulo: number;
  formulario?: string;
  modulo?: string;
}

export interface ModuloRolAssignment {
  id_modulo: number;
  id_rol: number;
  nombre_modulo?: string;
  nombre_rol?: string;
  icono_modulo?: string;
  descripcion_modulo?: string;
}

export interface CreateFormularioModuloPayload {
  id_formulario: number;
  id_modulo: number;
}

export interface CreateModuloRolPayload {
  id_modulo: number;
  id_rol: number;
}
