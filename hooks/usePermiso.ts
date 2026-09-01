import { useShallow } from "zustand/react/shallow";
import { useModulesStore } from "../store/modulesStore";

export const usePermiso = (
  modulo: string,
  formulario: string,
  accion: "Crear" | "Ver" | "Editar" | "Eliminar",
): boolean => {
  return useModulesStore(
    useShallow((state) => state.tienePermiso(modulo, formulario, accion)),
  );
};
