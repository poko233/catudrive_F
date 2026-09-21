// screens/admin/arqueo/store/arqueoStore.ts

import { create } from "zustand";
import { arqueoService } from "../services/arqueoService";
import type { Arqueo, CerrarArqueoPayload } from "../types/arqueo.types";

interface ArqueoState {
  abierto: Arqueo | null;
  loading: boolean;
  refreshing: boolean;
  syncing: boolean;
  fetchAbierto: (force?: boolean) => Promise<Arqueo | null>;
  /** Chequeo fresco: ignora cache, pega al backend. Usar antes de abrir. */
  syncAbierto: () => Promise<Arqueo | null>;
  abrir: (saldo_anterior: number) => Promise<Arqueo>;
  cerrar: (id: number, payload: CerrarArqueoPayload) => Promise<Arqueo>;
  clear: () => void;
}

export const useArqueoStore = create<ArqueoState>((set) => ({
  abierto: null,
  loading: true,
  refreshing: false,
  syncing: false,

  fetchAbierto: async (force = false) => {
    if (force) {
      set({ refreshing: true });
    } else {
      set({ loading: true });
    }
    try {
      const data = await arqueoService.getAbierto({ force });
      set({ abierto: data });
      return data;
    } catch {
      set({ abierto: null });
      return null;
    } finally {
      set({ loading: false, refreshing: false });
    }
  },

  syncAbierto: async () => {
    set({ syncing: true });
    try {
      const data = await arqueoService.getAbierto({ force: true });
      set({ abierto: data });
      return data;
    } catch {
      set({ abierto: null });
      return null;
    } finally {
      set({ syncing: false });
    }
  },

  abrir: async (saldo_anterior) => {
    const arqueo = await arqueoService.abrir({ saldo_anterior });
    set({ abierto: arqueo });
    return arqueo;
  },

  cerrar: async (id, payload) => {
    const arqueo = await arqueoService.cerrar(id, payload);
    set({ abierto: null });
    return arqueo;
  },

  clear: () => set({ abierto: null, loading: false, refreshing: false, syncing: false }),
}));
