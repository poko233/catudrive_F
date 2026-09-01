
export type MatrizTodos = Record<number, Record<number, Set<number>>>;

export type PermisoSync = {
  id_modulo: number;
  id_formulario: number;
  acciones: number[];
};

export const ACCIONES = [
  { id: 1, label: "Ver",    short: "V", color: "#3B82F6" },
  { id: 2, label: "Crear",  short: "C", color: "#10B981" },
  { id: 3, label: "Editar", short: "E", color: "#F59E0B" },
  { id: 4, label: "Elim.",  short: "X", color: "#EF4444" },
] as const;

export type AccionId = 1 | 2 | 3 | 4;