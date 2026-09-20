// screens/admin/arqueo/components/ConfirmModal.tsx

import React, { useCallback, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { AlertTriangle, Ban, Trash2 } from "lucide-react-native";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";

/*
|--------------------------------------------------------------------------
| MODAL DE CONFIRMACIÓN LOCAL DEL MÓDULO ARQUEO
|--------------------------------------------------------------------------
|
| El confirm global (store/confirmStore) necesita su modal
| montado en el _layout y hoy NO lo está: su promesa no
| se resuelve nunca y los botones parecen "no hacer nada".
|
| Este modal es autocontenido: vive donde se usa, sin
| tocar el _layout.
|
*/

export type ConfirmVariant = "danger" | "warning" | "info";

export interface ConfirmAskOptions {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmState extends Required<Omit<ConfirmAskOptions, "message">> {
  message: string;
}

const ICONS = {
  danger: Trash2,
  warning: AlertTriangle,
  info: Ban,
} as const;

const ICON_BG = {
  danger: "#FEE2E2",
  warning: "#FEF3C7",
  info: "#E0E7FF",
} as const;

const ICON_FG = {
  danger: "#DC2626",
  warning: "#D97706",
  info: "#4F46E5",
} as const;

export function ConfirmModal({
  state,
  busy,
  onCancel,
  onConfirm,
}: {
  state: ConfirmState | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const Icon = state ? ICONS[state.variant] : AlertTriangle;

  return (
    <Modal
      visible={state !== null}
      onClose={busy ? () => {} : onCancel}
      title={state?.title ?? ""}
      maxWidth={420}
      footer={
        <View style={styles.footer}>
          <Button title={state?.cancelText ?? "Cancelar"} variant="ghost" onPress={onCancel} disabled={busy} />
          <Button
            title={busy ? "Procesando..." : (state?.confirmText ?? "Confirmar")}
            variant={state?.variant === "info" ? "primary" : "destructive"}
            onPress={onConfirm}
            loading={busy}
            disabled={busy}
          />
        </View>
      }
    >
      <View style={styles.body}>
        <View style={[styles.iconWrap, { backgroundColor: state ? ICON_BG[state.variant] : ICON_BG.warning }]}>
          <Icon size={26} color={state ? ICON_FG[state.variant] : ICON_FG.warning} />
        </View>
        <ThemedText style={[styles.message, { color: c.textSecondary }]}>
          {state?.message ?? ""}
        </ThemedText>
      </View>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| HOOK PROMESA (misma ergonomía que useConfirm, pero local)
|--------------------------------------------------------------------------
*/

export function useConfirmLocal() {
  const [state, setState] = useState<ConfirmState | null>(null);
  const [busy, setBusy] = useState(false);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const ask = useCallback((opts: ConfirmAskOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
      setBusy(false);
      setState({
        title: opts.title,
        message: opts.message ?? "¿Seguro que quieres continuar?",
        confirmText: opts.confirmText ?? "Confirmar",
        cancelText: opts.cancelText ?? "Cancelar",
        variant: opts.variant ?? "warning",
      });
    });
  }, []);

  const handleCancel = useCallback(() => {
    if (busy) return;
    resolver.current?.(false);
    resolver.current = null;
    setState(null);
  }, [busy]);

  const handleConfirm = useCallback(() => {
    resolver.current?.(true);
    resolver.current = null;
    setBusy(true);
    // El llamador hace el trabajo y cierra con closeConfirm().
  }, []);

  const closeConfirm = useCallback(() => {
    setBusy(false);
    setState(null);
  }, []);

  return { confirmState: state, confirmBusy: busy, ask, handleCancel, handleConfirm, closeConfirm };
}

const styles = StyleSheet.create({
  body: { alignItems: "center", gap: 12, paddingVertical: 6 },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  message: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
});

export default ConfirmModal;
