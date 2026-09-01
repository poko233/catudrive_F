export type Estado = "Activo" | "Inactivo";

export type Rol = {
  id: number;
  rol: string;
  descripcion?: string | null;
  estado: Estado;
  created_at?: string | null;
  updated_at?: string | null;
};

export type RolPayload = {
  rol: string;
  descripcion?: string | null;
  estado: Estado;
};

export type Accion = {
  // El backend puede devolver id o id_accion; se normaliza en el mapping
  id?: number;
  id_accion?: number;
  accion: "Ver" | "Crear" | "Editar" | "Eliminar";
};

export type PermisoFormulario = {
  id_formulario: number;
  formulario: string;
  acciones: Accion[];
};

export type PermisoModulo = {
  id_modulo: number;
  modulo: string;
  formularios: PermisoFormulario[];
};

export type RolConPermisos = Rol & { permisos: PermisoModulo[] };

export type PermisoSync = {
  id_modulo: number;
  id_formulario: number;
  acciones: number[];
};
