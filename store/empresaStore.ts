// store/empresaStore.ts

import { create } from "zustand";

import { empresaService } from "@/screens/admin/empresa/services/empresaService";
import { decryptApiToken } from "@/utils/decryptApiToken";

import type { Empresa } from "@/screens/admin/empresa/types/empresa.types";
import type { Sucursal } from "@/screens/admin/empresa/types/sucursal.types";

export interface SucursalTokenMeta {
  nombre: string;
  hasToken: boolean;
  masked: string | null;
}

interface EmpresaState {
  /*
  |--------------------------------------------------------------------------
  | Datos de empresa + sucursales (fuente /mi-empresa)
  |--------------------------------------------------------------------------
  */

  empresa: Empresa | null;
  sucursales: Sucursal[];

  /*
  |--------------------------------------------------------------------------
  | Icono / logo (compatibilidad con consumidores previos)
  |--------------------------------------------------------------------------
  */

  iconoUrl: string | null;
  logoUrl: string | null;
  loading: boolean;
  error: string | null;

  /*
  |--------------------------------------------------------------------------
  | API TOKENS (uno por sucursal)
  |--------------------------------------------------------------------------
  |
  | apiTokensBySucursal: plaintext descifrado listo para la pasarela.
  | sucursalesConToken: metadata (nombre + máscara + flag).
  | tokensLoaded: true tras la primera carga (sea exitosa o no).
  |
  | Se sobreescribe completo con setFromMiEmpresa (idempotente).
  | Se modifica puntualmente con setSucursalToken (tras PATCH).
  |
  */

  apiTokensBySucursal: Record<number, string | null>;
  sucursalesConToken: Record<number, SucursalTokenMeta>;
  tokensLoaded: boolean;

  /*
  |--------------------------------------------------------------------------
  | Actions
  |--------------------------------------------------------------------------
  */

  setFromMiEmpresa: (payload: {
    empresa: Empresa;
    sucursales: Sucursal[];
  }) => void;

  setSucursalToken: (
    sucursalId: number,
    token: string | null,
    meta?: Partial<SucursalTokenMeta>,
  ) => void;

  fetchIcono: () => Promise<void>;
  updateIcono: (newIconoUrl: string | null) => void;
  clearEmpresa: () => void;
}

export const useEmpresaStore = create<EmpresaState>((set, get) => ({
  empresa: null,
  sucursales: [],
  iconoUrl: null,
  logoUrl: null,
  loading: false,
  error: null,

  apiTokensBySucursal: {},
  sucursalesConToken: {},
  tokensLoaded: false,

  /*
  |--------------------------------------------------------------------------
  | setFromMiEmpresa
  |--------------------------------------------------------------------------
  |
  | Descifra TODOS los api_token de las sucursales y los deja
  | en el mapa. También guarda metadata para que el modal QR
  | y SucursalesTab puedan mostrar el estado por sucursal.
  |
  */

  setFromMiEmpresa: (payload) => {
    const tokenMap: Record<number, string | null> = {};
    const metaMap: Record<number, SucursalTokenMeta> = {};

    for (const sucursal of payload.sucursales) {
      const hasEncrypted = !!sucursal.has_api_token && !!sucursal.api_token;

      const decrypted = hasEncrypted
        ? decryptApiToken(sucursal.api_token)
        : null;

      tokenMap[sucursal.id] = decrypted;
      metaMap[sucursal.id] = {
        nombre: sucursal.sucursal,
        hasToken: !!decrypted,
        masked: sucursal.api_token_masked ?? null,
      };
    }

    set({
      empresa: payload.empresa,
      sucursales: payload.sucursales,
      iconoUrl: payload.empresa.logos?.icono ?? null,
      logoUrl: payload.empresa.logos?.cuadrado ?? null,
      apiTokensBySucursal: tokenMap,
      sucursalesConToken: metaMap,
      tokensLoaded: true,
    });
  },

  /*
  |--------------------------------------------------------------------------
  | setSucursalToken
  |--------------------------------------------------------------------------
  |
  | Actualización puntual tras un PATCH exitoso. No requiere
  | un refetch de /mi-empresa.
  |
  */

  setSucursalToken: (sucursalId, token, meta) => {
    set((state) => {
      const prev = state.sucursalesConToken[sucursalId];

      return {
        apiTokensBySucursal: {
          ...state.apiTokensBySucursal,
          [sucursalId]: token,
        },
        sucursalesConToken: {
          ...state.sucursalesConToken,
          [sucursalId]: {
            nombre: meta?.nombre ?? prev?.nombre ?? `Sucursal ${sucursalId}`,
            hasToken: token !== null,
            masked:
              token !== null ? (meta?.masked ?? prev?.masked ?? null) : null,
          },
        },
      };
    });
  },

  /*
  |--------------------------------------------------------------------------
  | fetchIcono
  |--------------------------------------------------------------------------
  |
  | Compatibilidad: solo dispara getMiEmpresa (que ya sincroniza
  | el store vía setFromMiEmpresa). El estado iconoUrl se
  | actualiza como efecto colateral.
  |
  */

  fetchIcono: async () => {
    if (get().tokensLoaded) {
      return;
    }

    set({ loading: true, error: null });

    try {
      await empresaService.getMiEmpresa();
      set({ loading: false });
    } catch (error: unknown) {
      set({
        error:
          error instanceof Error ? error.message : "Error al cargar empresa",
        loading: false,
      });
    }
  },

  updateIcono: (newIconoUrl) => {
    set({ iconoUrl: newIconoUrl });
  },

  clearEmpresa: () => {
    set({
      empresa: null,
      sucursales: [],
      iconoUrl: null,
      logoUrl: null,
      loading: false,
      error: null,
      apiTokensBySucursal: {},
      sucursalesConToken: {},
      tokensLoaded: false,
    });
  },
}));
