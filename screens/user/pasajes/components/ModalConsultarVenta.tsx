import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/useTheme";
import { haptics } from "@/animations/haptics";

interface Props {
  visible: boolean;
  loading?: boolean;
  onClose: () => void;
  onBuscar: (ventaId: number) => Promise<void>;
}

export function ModalConsultarVenta({
  visible,
  loading = false,
  onClose,
  onBuscar,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [ventaId, setVentaId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleBuscar = async () => {
    const id = Number(ventaId.trim());
    if (!ventaId.trim() || !Number.isInteger(id) || id <= 0) {
      haptics.error();
      setError("Ingresa un ID de venta válido.");
      return;
    }
    setError(null);
    haptics.selection();
    try {
      await onBuscar(id);
    } catch (err: any) {
      haptics.error();
      setError(err?.message || "No se encontró la venta.");
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Consultar venta"
      footer={
        <View style={styles.footer}>
          <Button title="Cancelar" variant="secondary" onPress={onClose} />
          <Button
            title="Buscar"
            loading={loading}
            disabled={loading}
            onPress={handleBuscar}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>
          Ingresa el ID de una venta ya realizada para visualizar sus pasajeros,
          cambiar asientos o anularla.
        </Text>
        <Input
          label="ID de venta"
          value={ventaId}
          onChangeText={(v) => {
            setVentaId(v.replace(/[^0-9]/g, ""));
            setError(null);
          }}
          placeholder="Ej: 42"
          keyboardType="numeric"
          editable={!loading}
        />
        {error ? (
          <Text style={{ color: c.destructive, fontSize: 12 }}>{error}</Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
});