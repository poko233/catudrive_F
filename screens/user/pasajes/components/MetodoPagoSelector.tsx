import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Card } from "@/components/ui/Card";
import { QrCode, CreditCard, Banknote } from "lucide-react-native";

export type MetodoPago = "qr" | "tarjeta" | "efectivo";

interface Props {
  onSelect: (metodo: MetodoPago) => void;
  valorInicial?: MetodoPago;
}

export function MetodoPagoSelector({
  onSelect,
  valorInicial = "efectivo",
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Card style={styles.card}>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>
        Método de Pago
      </Text>
      <View style={styles.opciones}>
        <OpcionPago
          activo={valorInicial === "qr"}
          icono={QrCode}
          titulo="Pago QR"
          descripcion="Escanea desde tu app bancaria"
          onPress={() => onSelect("qr")}
          color={c.primary}
        />
        <OpcionPago
          activo={valorInicial === "tarjeta"}
          icono={CreditCard}
          titulo="Tarjeta"
          descripcion="Débito o crédito"
          onPress={() => onSelect("tarjeta")}
          color={c.info}
        />
        <OpcionPago
          activo={valorInicial === "efectivo"}
          icono={Banknote}
          titulo="Efectivo"
          descripcion="En terminal"
          onPress={() => onSelect("efectivo")}
          color={c.warning}
        />
      </View>
    </Card>
  );
}

function OpcionPago({
  activo,
  icono: Icon,
  titulo,
  descripcion,
  onPress,
  color,
}: {
  activo: boolean;
  icono: typeof QrCode;
  titulo: string;
  descripcion: string;
  onPress: () => void;
  color: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.opcion,
        {
          backgroundColor: activo ? c.primarySubtle : c.backgroundSecondary,
          borderColor: activo ? c.primary : c.border,
        },
      ]}
    >
      <Icon size={24} color={activo ? c.primary : c.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: "700" }}>{titulo}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 11 }}>
          {descripcion}
        </Text>
      </View>
      {activo && <Text style={{ color: c.primary }}>✓</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  opciones: { gap: 8 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
});
