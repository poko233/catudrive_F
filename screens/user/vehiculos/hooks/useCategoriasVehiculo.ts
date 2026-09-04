import { useCallback } from "react";
import { useCategoriasVehiculoStore } from "@/screens/user/vehiculos/store/categoriasVehiculoStore";

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
