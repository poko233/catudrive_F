// screens/admin/arqueo/components/AbrirArqueoModal.tsx

import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import Visibility from "@/components/Visibility";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import { useArqueoStore } from "../store/arqueoStore";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AbrirArqueoModal({ visible, onClose, onSuccess }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const abrir = useArqueoStore((s) => s.abrir);
  const syncAbierto = useArqueoStore((s) => s.syncAbierto);

  const [saldo, setSaldo] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | SIN CHEQUEO AL ABRIR
  |--------------------------------------------------------------------------
  |
  | Quien abre este modal (Sidebar / pantalla) ya
  | sincronizó con el backend antes. Solo se
  | re-chequea justo antes del POST (anti-carrera
  | con auto-apertura por ventas).
  |
  */

  const handleAbrir = async () => {
    const n = parseFloat(String(saldo).replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      setError("Ingresa un saldo válido mayor o igual a 0.");
      return;
    }
    // Re-chequeo justo antes de abrir (evita "ya tiene arqueo" por auto-apertura).
    const fresco = await syncAbierto();
    if (fresco) {
      Toast.show({ type: "info", text1: `Ya tienes el arqueo #${fresco.id} abierto` });
      onClose();
      return;
    }
    setError("");
    setSaving(true);
    try {
      await abrir(n);
      Toast.show({ type: "success", text1: "Arqueo abierto", text2: `Saldo anterior Bs. ${n.toFixed(2)}` });
      setSaldo("0");
      onSuccess?.();
      onClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : "No se pudo abrir el arqueo. Quizá ya tienes uno abierto.";
      Toast.show({ type: "error", text1: "No se pudo abrir", text2: message });
      // Sincroniza por si el error fue "ya tiene arqueo abierto".
      void syncAbierto();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Abrir arqueo"
      footer={
        <View style={styles.footer}>
          <Button title="Cancelar" variant="ghost" onPress={onClose} disabled={saving} />
          <Visibility action="Crear">
            <Button
              title={saving ? "Abriendo..." : "Abrir turno"}
              onPress={() => void handleAbrir()}
              loading={saving}
              disabled={saving}
            />
          </Visibility>
        </View>
      }
    >
      <View style={styles.body}>
        <ThemedText style={[styles.desc, { color: c.textSecondary }]}>
          Ingresa el saldo anterior en caja para iniciar tu turno. Solo puedes tener un arqueo abierto.
        </ThemedText>
        <Input
          label="Saldo anterior (Bs)"
          value={saldo}
          onChangeText={setSaldo}
          keyboardType="numeric"
          placeholder="0.00"
          error={error}
          helperText="Ej: 150.00"
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12 },
  desc: { fontSize: 13, lineHeight: 19 },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
});

export default AbrirArqueoModal;
