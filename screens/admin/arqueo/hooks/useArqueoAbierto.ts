// screens/admin/arqueo/hooks/useArqueoAbierto.ts

import { useCallback, useEffect } from "react";
import Toast from "react-native-toast-message";
import { useArqueoStore } from "../store/arqueoStore";
import { useAuthStore } from "@/store/authStore";

function msg(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function useArqueoAbierto(auto = true) {
  const abierto = useArqueoStore((s) => s.abierto);
  const loading = useArqueoStore((s) => s.loading);
  const refreshing = useArqueoStore((s) => s.refreshing);
  const fetchAbierto = useArqueoStore((s) => s.fetchAbierto);
  const abrir = useArqueoStore((s) => s.abrir);
  const cerrar = useArqueoStore((s) => s.cerrar);

  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (auto && user) void fetchAbierto();
  }, [auto, user, fetchAbierto]);

  const refrescar = useCallback(async () => {
    try {
      await fetchAbierto(true);
    } catch (e) {
      Toast.show({ type: "error", text1: "Error al actualizar arqueo", text2: msg(e, "Intenta nuevamente.") });
    }
  }, [fetchAbierto]);

  const abrirArqueo = useCallback(
    async (saldo: number) => {
      try {
        const a = await abrir(saldo);
        Toast.show({ type: "success", text1: "Arqueo abierto", text2: `Saldo anterior Bs. ${Number(saldo).toFixed(2)}` });
        return a;
      } catch (e) {
        Toast.show({ type: "error", text1: "No se pudo abrir", text2: msg(e, "Revisa el saldo ingresado.") });
        return null;
      }
    },
    [abrir],
  );

  return { abierto, loading, refreshing, refrescar, abrirArqueo, cerrar };
}

export default useArqueoAbierto;
