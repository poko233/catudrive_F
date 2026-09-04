import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import { StyleSheet, View } from "react-native";
import type { Vehiculo } from "../types/vehiculo.types";

type Props = {
  visible: boolean;
  vehiculo: Vehiculo | null;
  loading: boolean;
  onClose: () => void;
  onConfirm: (vehiculo: Vehiculo) => Promise<void>;
};

export function VehiculoBajaModal({
  visible,
  vehiculo,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Modal
      visible={visible}
      title="Dar de baja al vehículo"
      onClose={onClose}
      closeOnBackdropPress={!loading}
      width="94%"
      maxWidth={520}
      footer={
        <View style={styles.footer}>
          <Button
            title="Cancelar"
            variant="secondary"
            disabled={loading}
            onPress={onClose}
          />
          <Button
            title="Dar de baja"
            variant="destructive"
            loading={loading}
            disabled={loading || !vehiculo}
            onPress={() => {
              if (vehiculo) {
                void onConfirm(vehiculo);
              }
            }}
          />
        </View>
      }
    >
      {vehiculo ? (
        <View style={styles.content}>
          <ThemedText style={{ color: c.textSecondary }}>
            El vehículo no será eliminado físicamente. Quedará con estado Baja y
            se conservará toda su información y plano de asientos.
          </ThemedText>

          <View
            style={[
              styles.box,
              {
                borderColor: c.border,
                backgroundColor: c.backgroundSecondary,
              },
            ]}
          >
            <ThemedText style={styles.name}>
              {vehiculo.placa} · {vehiculo.marca} {vehiculo.modelo}
            </ThemedText>
            <ThemedText style={{ color: c.textSecondary }}>
              Tipo: {vehiculo.tipo}
            </ThemedText>
            <ThemedText style={{ color: c.textSecondary }}>
              Categoría: {vehiculo.categoria?.categoria ?? "—"}
            </ThemedText>
            <ThemedText style={{ color: c.textSecondary }}>
              Capacidad: {vehiculo.capacidad}
            </ThemedText>

            <View style={{ alignSelf: "flex-start" }}>
              <Badge
                label={vehiculo.estado}
                variant={
                  vehiculo.estado === "Operativo"
                    ? "success"
                    : vehiculo.estado === "En mantenimiento"
                      ? "warning"
                      : "destructive"
                }
              />
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  box: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: "900",
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
  },
});
