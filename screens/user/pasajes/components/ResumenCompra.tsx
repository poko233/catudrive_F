import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { Badge } from "@/components/ui/Badge";
import { Viaje, Asiento } from "../types/pasajes.types";

interface Props {
  viaje: Viaje | null;
  asientos: Asiento[];
  precios: { [asientoId: number]: number };
}

export function ResumenCompra({ viaje, asientos, precios }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const total = asientos.reduce(
    (sum, a) => sum + (precios[a.id] ?? parseFloat(viaje?.tarifa ?? "0")),
    0,
  );

  if (!viaje) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>
          Resumen de Compra
        </Text>
        <Badge label={`${asientos.length} asientos`} variant="info" />
      </View>

      <View style={styles.section}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: "700" }}>
          {viaje.origen} → {viaje.destino}
        </Text>
        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
          {new Date(viaje.hora_salida).toLocaleString("es-BO", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </Text>
      </View>

      <Divider spacing={8} />

      {asientos.map((asiento, idx) => (
        <View key={asiento.id} style={styles.asientoRow}>
          <View style={styles.asientoInfo}>
            <Text style={{ color: c.text, fontWeight: "600" }}>
              Asiento {asiento.numero_asiento ?? asiento.id}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 11 }}>
              Piso {asiento.fila}
            </Text>
          </View>
          <Text style={{ color: c.primary, fontWeight: "700" }}>
            Bs. {(precios[asiento.id] ?? parseFloat(viaje.tarifa)).toFixed(2)}
          </Text>
        </View>
      ))}

      <Divider spacing={8} />

      <View style={styles.totalRow}>
        <Text style={{ color: c.text, fontSize: 14, fontWeight: "800" }}>
          Total
        </Text>
        <Text style={{ color: c.primary, fontSize: 18, fontWeight: "900" }}>
          Bs. {total.toFixed(2)}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  section: {
    gap: 4,
  },
  asientoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  asientoInfo: {
    flex: 1,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
