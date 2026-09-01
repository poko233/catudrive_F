// store/visibilityStore.ts
import { create } from "zustand";

interface VisibilityState {
  /** Mapa: ruta -> formId */
  routeToFormId: Record<string, number>;
  /** Mapa: formId -> conjunto de selectores ocultos */
  formHiddenSelectors: Record<number, Set<string>>;
  /** Mapa: ruta -> conjunto de acciones permitidas */
  routeActions: Record<string, Set<string>>;

  /** Carga los mapas desde los datos crudos del sidebar */
  loadFromSidebarData: (rawModules: SidebarModulo[]) => void;
  /** Limpia el store (logout) */
  clear: () => void;
}

// Tipos crudos que vienen del backend (los mismos que usa modulesStore)
interface SidebarFormulario {
  id: number;
  nombre: string;
  ruta: string | null;
  icono?: string | null;
  descripcion?: string;
  acciones?: string[];
  selectores_ocultos?: string[];
}

interface SidebarModulo {
  id: number;
  nombre: string;
  icono?: string;
  descripcion?: string;
  formularios: SidebarFormulario[];
}

export const useVisibilityStore = create<VisibilityState>((set) => ({
  routeToFormId: {},
  formHiddenSelectors: {},
  routeActions: {},

  loadFromSidebarData: (rawModules) => {
    const routeToFormId: Record<string, number> = {};
    const formHiddenSelectors: Record<number, Set<string>> = {};
    const routeActions: Record<string, Set<string>> = {};

    for (const modulo of rawModules) {
      for (const form of modulo.formularios ?? []) {
        const formId = form.id;
        // Mapear ruta → formId (normalizar sin backslashes, sin slash final)
        if (form.ruta) {
          const ruta = form.ruta.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
          routeToFormId[ruta] = formId;
          // Acciones permitidas
          if (form.acciones) {
            routeActions[ruta] = new Set(form.acciones);
          }
        }
        // Selectores ocultos
        if (form.selectores_ocultos && form.selectores_ocultos.length > 0) {
          formHiddenSelectors[formId] = new Set(form.selectores_ocultos);
        }
      }
    }

    set({ routeToFormId, formHiddenSelectors, routeActions });
  },

  clear: () => {
    set({ routeToFormId: {}, formHiddenSelectors: {}, routeActions: {} });
  },
}));
