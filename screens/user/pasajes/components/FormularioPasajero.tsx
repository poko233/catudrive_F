import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PressableAnimated } from "@/components/ui/PressableAnimated";
import { Copy } from "lucide-react-native";
import { DatosPasajero } from "../store/pasajesStore";

interface Props {
  titulo: string;
  asientoLabel: string;
  datos: DatosPasajero;
  onChange: (campo: keyof DatosPasajero, valor: string) => void;
  esPrincipal?: boolean;
  precio: number;
  onPrecioChange: (precio: number) => void;
  onTodosIguales: (precio: number) => void;
  error?: string | null;
}

export function FormularioPasajero({
  titulo,
  asientoLabel,
  datos,
  onChange,
  esPrincipal,
  precio,
  onPrecioChange,
  onTodosIguales,
  error,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const datosSeguros = datos ?? {
    nombres: "",
    apellido_paterno: "",
    apellido_materno: "",
    ci: "",
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: "800" }}>
            {titulo}
          </Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>
            {asientoLabel}
          </Text>
        </View>
        {esPrincipal && <Badge label="Principal" variant="info" />}
      </View>

      <View style={styles.grid}>
        <Input
          label="Nombres"
          value={datosSeguros.nombres}
          onChangeText={(v) => onChange("nombres", v)}
          placeholder="Ej: Juan"
        />
        <Input
          label="Apellido Paterno"
          value={datosSeguros.apellido_paterno}
          onChangeText={(v) => onChange("apellido_paterno", v)}
          placeholder="Ej: Pérez"
        />
        <Input
          label="Apellido Materno"
          value={datosSeguros.apellido_materno}
          onChangeText={(v) => onChange("apellido_materno", v)}
          placeholder="Ej: Flores"
        />
        <Input
          label="CI"
          value={datosSeguros.ci}
          onChangeText={(v) => onChange("ci", v)}
          placeholder="Ej: 1234567"
        />
      </View>

      <View style={styles.precioContainer}>
        <Text style={{ color: c.text, fontWeight: "700" }}>
          Precio del pasaje
        </Text>
        <View style={styles.precioRow}>
          <View style={styles.precioInput}>
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 14 }}>
              Bs.
            </Text>
            <View style={styles.precioField}>
              <Input
                value={String(precio)}
                onChangeText={(v) => {
                  const numero = parseFloat(v);
                  if (!isNaN(numero)) onPrecioChange(numero);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
          <PressableAnimated
            onPress={() => onTodosIguales(precio)}
            style={[
              styles.aplicarBtn,
              { backgroundColor: c.primary, borderColor: c.primary },
            ]}
            accessibilityLabel="Aplicar a todos"
          >
            <Copy size={16} color={c.primaryForeground} />
            <Text
              style={{
                color: c.primaryForeground,
                fontSize: 13,
                fontWeight: "800",
              }}
            >
              Aplicar a todos
            </Text>
          </PressableAnimated>
        </View>
      </View>

      {error ? (
        <Text style={{ color: c.destructive, fontSize: 12, fontWeight: "700" }}>
          {error}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grid: {
    gap: 12,
  },
  precioContainer: {
    gap: 8,
  },
  precioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  precioInput: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingBottom: 2,
  },
  precioField: {
    flex: 1,
  },
  aplicarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
});
