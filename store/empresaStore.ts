import { create } from "zustand";
import { empresaService } from "@/screens/admin/empresa/services/empresaService";

interface EmpresaState {
  iconoUrl: string | null;
  logoUrl: string | null;
  loading: boolean;
  error: string | null;

  fetchIcono: () => Promise<void>;
  updateIcono: (newIconoUrl: string | null) => void;
  clearEmpresa: () => void;
}

export const useEmpresaStore = create<EmpresaState>((set, get) => ({
  iconoUrl: null,
  logoUrl: null,
  loading: false,
  error: null,

  fetchIcono: async () => {
    try {
      set({ loading: true, error: null });
      const empresa = await empresaService.getMiEmpresa();
      set({
        iconoUrl: empresa.logos?.icono || null,
        logoUrl: empresa.logos?.cuadrado || null,
        loading: false,
      });
    } catch (error: any) {
      set({
        error: error?.message || "Error al cargar icono",
        loading: false,
      });
    }
  },

  updateIcono: (newIconoUrl: string | null) => {
    set({ iconoUrl: newIconoUrl });
  },

  clearEmpresa: () => {
    set({
      iconoUrl: null,
      logoUrl: null,
      loading: false,
      error: null,
    });
  },
}));
