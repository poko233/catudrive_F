import { create } from "zustand";
import {
  getCategoriasVehiculo,
  createCategoriaVehiculo as apiCreate,
  updateCategoriaVehiculo as apiUpdate,
  deleteCategoriaVehiculo as apiDelete,
} from "@/screens/vehiculos/services/categoriaVehiculo.service";
import type { CategoriaVehiculo } from "@/screens/vehiculos/types/vehiculo.types";

interface CategoriasVehiculoState {
  categorias: CategoriaVehiculo[];
  loaded: boolean;
  loading: boolean;
  creando: boolean;
  editandoId: number | null;
  eliminandoId: number | null;

  fetchCategorias: (force?: boolean) => Promise<void>;
  crearCategoria: (nombre: string) => Promise<boolean>;
  editarCategoria: (id: number, nombre: string) => Promise<boolean>;
  eliminarCategoria: (id: number) => Promise<boolean>;
  reset: () => void;
}

export const useCategoriasVehiculoStore = create<CategoriasVehiculoState>(
  (set, get) => ({
    categorias: [],
    loaded: false,
    loading: false,
    creando: false,
    editandoId: null,
    eliminandoId: null,

    fetchCategorias: async (force = false) => {
      const { loaded, loading } = get();

      // Si ya está cargando o ya cargó y no se fuerza, no recargamos
      if (loading || (loaded && !force)) return;

      set({ loading: true });
      try {
        const categorias = await getCategoriasVehiculo();
        set({ categorias, loaded: true, loading: false });
      } catch (error) {
        set({ loading: false });
        throw error;
      }
    },

    crearCategoria: async (nombre) => {
      const { creando } = get();
      if (creando) return false;

      set({ creando: true });
      try {
        await apiCreate(nombre);
        // Recargamos la lista después de crear
        await get().fetchCategorias(true);
        return true;
      } finally {
        set({ creando: false });
      }
    },

    editarCategoria: async (id, nombre) => {
      if (get().editandoId !== null) return false;

      set({ editandoId: id });
      try {
        await apiUpdate(id, nombre);
        await get().fetchCategorias(true);
        return true;
      } finally {
        set({ editandoId: null });
      }
    },

    eliminarCategoria: async (id) => {
      if (get().eliminandoId !== null) return false;

      set({ eliminandoId: id });
      try {
        await apiDelete(id);
        await get().fetchCategorias(true);
        return true;
      } finally {
        set({ eliminandoId: null });
      }
    },

    reset: () => {
      set({
        categorias: [],
        loaded: false,
        loading: false,
        creando: false,
        editandoId: null,
        eliminandoId: null,
      });
    },
  }),
);
