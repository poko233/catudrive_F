// screens/admin/permisos/types/visibility.types.ts

export interface FormularioAccion {
  id: number;
  id_rol: number;
  id_formulario: number;
  id_accion: number | null;
  selector_html: string;
  habilitado: boolean;
  created_at?: string;
  updated_at?: string;
  rol?: { id: number; rol: string };
  formulario?: { id: number; formulario: string };
  accion?: { id: number; accion: string } | null;
}
