// components/SucursalApiTokenModal.tsx

import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";

import {
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
  ShieldOff,
} from "lucide-react-native";

import Toast from "react-native-toast-message";

import { ThemedText } from "@/components/ThemedText";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Divider } from "@/components/ui/Divider";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

import { useConfirm } from "@/hooks/useConfirm";

import { sucursalService } from "@/screens/admin/empresa/services/sucursalService";
import { useEmpresaStore } from "@/store/empresaStore";

import { useTheme } from "@/theme/useTheme";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface Props {
  visible: boolean;
  sucursalId: number;
  sucursalNombre: string;
  onClose: () => void;
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function SucursalApiTokenModal({
  visible,
  sucursalId,
  sucursalNombre,
  onClose,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const confirm = useConfirm();

  const meta = useEmpresaStore((s) => s.sucursalesConToken[sucursalId]);

  const [tokenDraft, setTokenDraft] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTokenDraft("");
    setShowToken(false);
  }, [visible]);

  const hasToken = meta?.hasToken ?? false;

  const guardar = async () => {
    const trimmed = tokenDraft.trim();
    if (!trimmed) return;

    try {
      setSaving(true);
      const data = await sucursalService.updateApiToken(sucursalId, trimmed);
      Toast.show({
        type: "success",
        text1: "Token guardado",
        text2: data.has_api_token
          ? `Configurado para ${sucursalNombre}.`
          : undefined,
      });
      setTokenDraft("");
      onClose();
    } catch (error: unknown) {
      Toast.show({
        type: "error",
        text1: "No se pudo guardar el token",
        text2: errorMessage(error, "Intenta nuevamente."),
      });
    } finally {
      setSaving(false);
    }
  };

  const limpiar = async () => {
    try {
      setClearing(true);
      await sucursalService.updateApiToken(sucursalId, null);
      Toast.show({
        type: "success",
        text1: "Token eliminado",
      });
      onClose();
    } catch (error: unknown) {
      Toast.show({
        type: "error",
        text1: "No se pudo eliminar el token",
        text2: errorMessage(error, "Intenta nuevamente."),
      });
    } finally {
      setClearing(false);
    }
  };

  const busy = saving || clearing;

  const footer = (
    <View style={styles.footer}>
      <Button
        title="Cancelar"
        variant="secondary"
        disabled={busy}
        onPress={onClose}
      />

      {hasToken && (
        <Button
          title="Limpiar"
          variant="destructive"
          loading={clearing}
          disabled={busy}
          onPress={() => void limpiar()}
        />
      )}

      <Button
        title="Guardar"
        loading={saving}
        disabled={busy || tokenDraft.trim().length === 0}
        onPress={() => void guardar()}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      title={`Token de pasarela · ${sucursalNombre}`}
      onClose={onClose}
      closeOnBackdropPress={!busy}
      width="96%"
      maxWidth={560}
      footer={footer}
    >
      <View style={styles.content}>
        {/* ESTADO ACTUAL */}

        <View
          style={[
            styles.statusBox,
            {
              backgroundColor: c.backgroundSecondary,
              borderColor: c.border,
            },
          ]}
        >
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor: hasToken
                  ? c.success + "22"
                  : c.textMuted + "22",
              },
            ]}
          >
            {hasToken ? (
              <ShieldCheck size={18} color={c.success} />
            ) : (
              <ShieldOff size={18} color={c.textMuted} />
            )}
          </View>

          <View style={styles.statusCopy}>
            <ThemedText style={styles.statusLabel}>
              {hasToken ? "Token configurado" : "Sin token configurado"}
            </ThemedText>

            <ThemedText
              numberOfLines={1}
              style={[styles.statusValue, { color: c.textSecondary }]}
            >
              {hasToken
                ? (meta?.masked ?? "••••••")
                : "Esta sucursal no podrá cobrar por la pasarela QR."}
            </ThemedText>
          </View>

          <Badge
            label={hasToken ? "Activo" : "Sin token"}
            variant={hasToken ? "success" : "muted"}
            dot
          />
        </View>

        <Divider spacing={10} />

        {/* INPUT */}

        <View style={styles.inputRow}>
          <View style={styles.inputWrap}>
            <Input
              label="Nuevo token"
              value={tokenDraft}
              placeholder="Pega aquí el token de la pasarela"
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={!showToken}
              onChangeText={setTokenDraft}
              helperText="Se cifra en el servidor y nunca se devuelve al cliente en texto plano."
            />
          </View>

          <IconButton
            icon={showToken ? EyeOff : Eye}
            variant="secondary"
            accessibilityLabel={showToken ? "Ocultar token" : "Mostrar token"}
            onPress={() => setShowToken((v) => !v)}
          />
        </View>

        {/* ICONO INFORMATIVO */}

        <View
          style={[
            styles.hint,
            {
              backgroundColor: c.backgroundSecondary,
              borderColor: c.border,
            },
          ]}
        >
          <KeyRound size={16} color={c.textSecondary} />

          <ThemedText style={[styles.hintText, { color: c.textSecondary }]}>
            Cada sucursal tiene su propio token. Los usuarios que cobren en esta
            sucursal usarán este token automáticamente.
          </ThemedText>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },

  statusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
  },

  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  statusCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },

  statusLabel: {
    fontSize: 13,
    fontWeight: "800",
  },

  statusValue: {
    fontSize: 11,
  },

  inputRow: {
    flexDirection: "row",
    alignItems: "center", // 👈 AQUÍ ESTÁ EL FIX
    gap: 8,
  },

  inputWrap: {
    flex: 1,
    minWidth: 0,
  },

  hint: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
  },

  hintText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },

  footer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "flex-end",
    flexWrap: "wrap",
    gap: 10,
  },
});

export default SucursalApiTokenModal;
