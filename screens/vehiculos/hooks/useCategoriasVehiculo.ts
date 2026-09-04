import { useCallback } from "react";
import { useCategoriasVehiculoStore } from "@/screens/vehiculos/store/categoriasVehiculoStore";

export function useCategoriasVehiculo() {
  const {
    categorias,
    loading,
    creando,
    editandoId,
    eliminandoId,
    fetchCategorias,
    crearCategoria,
    editarCategoria,
    eliminarCategoria,
  } = useCategoriasVehiculoStore();

  // Aseguramos que las categorías se carguen al usar el hook
  // (se ejecutará solo si no están cargadas)
  const refresh = useCallback(
    async (force = false) => {
      await fetchCategorias(force);
    },
    [fetchCategorias],
  );

  return {
    categorias,
    loading,
    creando,
    editandoId,
    eliminandoId,
    refresh,
    crear: crearCategoria,
    editar: editarCategoria,
    eliminar: eliminarCategoria,
  };
}
