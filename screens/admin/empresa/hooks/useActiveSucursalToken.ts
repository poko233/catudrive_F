// hooks/useActiveSucursalToken.ts

import { useAuthStore } from "@/store/authStore";
import { useEmpresaStore } from "@/store/empresaStore";

/*
|--------------------------------------------------------------------------
| useActiveSucursalToken
|--------------------------------------------------------------------------
|
| Combina authStore.sucursalId + empresaStore.apiTokensBySucursal
| para devolver el token plaintext de la sucursal activa.
|
| Este hook vive fuera de empresaStore para romper el ciclo
| authStore ↔ empresaStore (empresaStore no importa authStore).
|
*/

export interface ActiveSucursalToken {
  sucursalId: number | null;
  token: string | null;
  sucursalNombre: string | null;
  masked: string | null;
  hasToken: boolean;
  loaded: boolean;
}

export function useActiveSucursalToken(): ActiveSucursalToken {
  const sucursalId = useAuthStore((s) => s.sucursalId);

  const token = useEmpresaStore((s) =>
    sucursalId !== null ? (s.apiTokensBySucursal[sucursalId] ?? null) : null,
  );

  const meta = useEmpresaStore((s) =>
    sucursalId !== null ? s.sucursalesConToken[sucursalId] : undefined,
  );

  const loaded = useEmpresaStore((s) => s.tokensLoaded);

  return {
    sucursalId,
    token,
    sucursalNombre: meta?.nombre ?? null,
    masked: meta?.masked ?? null,
    hasToken: !!token,
    loaded,
  };
}

export default useActiveSucursalToken;
