import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { QrCode, CreditCard, Banknote } from "lucide-react-native";

export type MetodoPago = "qr" | "tarjeta" | "efectivo";

interface Props {
  onSelect: (metodo: MetodoPago) => void;
  valorInicial?: MetodoPago;
}

export function MetodoPagoSelector({ onSelect, valorInicial = "qr" }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [metodo, setMetodo] = useState<MetodoPago>(valorInicial);

  const handleSelect = (m: MetodoPago) => {
    setMetodo(m);
    onSelect(m);
  };

  return (
    <Card style={styles.card}>
      <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>
        Método de Pago
      </Text>
      <View style={styles.opciones}>
        <OpcionPago
          activo={metodo === "qr"}
          icono={QrCode}
          titulo="Pago QR"
          descripcion="Escanea desde tu app bancaria"
          onPress={() => handleSelect("qr")}
          color={c.primary}
        />
        <OpcionPago
          activo={metodo === "tarjeta"}
          icono={CreditCard}
          titulo="Tarjeta"
          descripcion="Débito o crédito"
          onPress={() => handleSelect("tarjeta")}
          color={c.info}
        />
        <OpcionPago
          activo={metodo === "efectivo"}
          icono={Banknote}
          titulo="Efectivo"
          descripcion="En terminal"
          onPress={() => handleSelect("efectivo")}
          color={c.warning}
        />
      </View>

      {metodo === "tarjeta" && (
        <View style={styles.cardForm}>
          <Input label="Titular" placeholder="Nombre del titular" />
          <Input
            label="Número tarjeta"
            placeholder="4000 1234 5678 9010"
            keyboardType="numeric"
          />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Input label="Vencimiento" placeholder="MM/AA" />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="CVV" placeholder="•••" secureTextEntry />
            </View>
          </View>
        </View>
      )}
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
  cardForm: { gap: 10, marginTop: 8 },
  row: { flexDirection: "row", gap: 10 },
});
