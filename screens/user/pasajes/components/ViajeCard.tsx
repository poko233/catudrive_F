import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AnimatedBlock } from "@/components/ui/AnimatedBlock";
import { Viaje } from "../types/pasajes.types";

interface Props {
  viaje: Viaje;
  onSeleccionar: (viaje: Viaje) => void;
  index?: number;
}

export function ViajeCard({ viaje, onSeleccionar, index = 0 }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const fechaSalida = new Date(viaje.hora_salida);
  const hora = fechaSalida.toLocaleTimeString("es-BO", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <AnimatedBlock preset="slideInUp" delay={index * 60}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.origenDestino, { color: c.text }]}>
              {viaje.origen} → {viaje.destino}
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>
              {hora} hrs • {viaje.vehiculo}
            </Text>
          </View>
          <Badge
            label={viaje.estado}
            variant={viaje.estado === "Vendiendo" ? "success" : "muted"}
          />
        </View>

        <View style={styles.footer}>
          <View>
            <Text style={{ color: c.textMuted, fontSize: 11 }}>Tarifa</Text>
            <Text style={{ color: c.primary, fontSize: 20, fontWeight: "800" }}>
              Bs. {viaje.tarifa}
            </Text>
          </View>
          <Button
            title="Seleccionar"
            onPress={() => onSeleccionar(viaje)}
            disabled={viaje.estado !== "Vendiendo"}
          />
        </View>
      </Card>
    </AnimatedBlock>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  origenDestino: {
    fontSize: 16,
    fontWeight: "800",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
