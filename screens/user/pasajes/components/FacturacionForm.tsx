import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";

export function FacturacionForm() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [emitirFactura, setEmitirFactura] = useState(false);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>
          Datos de Facturación
        </Text>
        <Switch
          value={emitirFactura}
          onValueChange={setEmitirFactura}
          label="Emitir factura digital"
        />
      </View>
      {emitirFactura && (
        <View style={styles.form}>
          <Input label="Razón Social" placeholder="Nombre o razón social" />
          <Input label="NIT / CI" placeholder="Ej: 6849201 LP" />
          <Input
            label="Email para factura"
            placeholder="correo@ejemplo.com"
            keyboardType="email-address"
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  form: { gap: 10 },
});
