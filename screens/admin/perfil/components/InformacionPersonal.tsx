// screens/admin/perfil/components/InformacionPersonal.tsx

import { Card } from "@/components/ui/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import {
  BadgeCheck,
  Cake,
  Mail,
  MapPin,
  Phone,
  Smartphone,
} from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { useResponsive } from "../../../../hooks/useResponsive";
import { usePerfilData } from "../hooks/usePerfilData";

const fields = [
  ["Correo electrónico", Mail, "correo"],
  ["Dirección", MapPin, "direccion"],
  ["Teléfono fijo", Phone, "telefono"],
  ["Celular", Smartphone, "celular"],
  ["Carnet de identidad", BadgeCheck, "ciExpedido"],
  ["Fecha de nacimiento", Cake, "fechaNacimiento"],
] as const;

export const InformacionPersonal = () => {
  const { theme } = useTheme();
  const { isDesktop } = useResponsive();
  const data = usePerfilData();

  return (
    <Card style={styles.card}>
      <ThemedText style={styles.title}>Información personal</ThemedText>
      <ThemedText style={{ color: theme.colors.textSecondary }}>
        Datos registrados en tu cuenta.
      </ThemedText>

      <View style={styles.grid}>
        {fields.map(([label, Icon, key]) => (
          <View
            key={key}
            style={[styles.field, { width: isDesktop ? "48.5%" : "100%" }]}
          >
            <ThemedText
              style={[styles.label, { color: theme.colors.textSecondary }]}
            >
              {label}
            </ThemedText>

            <View
              style={[
                styles.valueBox,
                {
                  backgroundColor: theme.colors.backgroundSecondary,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon size={16} color={theme.colors.primary} />
              <ThemedText style={styles.value}>
                {(data[key] as string) || "—"}
              </ThemedText>
            </View>
          </View>
        ))}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  field: {
    gap: 5,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  valueBox: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 11,
  },
  value: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
});
