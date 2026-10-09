import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import DashboardEgresos from "@/screens/user/dashboard/DashboardEgresos";
import { useTheme } from "@/theme/useTheme";

/** Ruta: /dashboard/egresos. La pantalla de Inicio no monta el módulo. */
export default function DashboardEgresosRoute() {
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;
  const { roles } = useAuth();
  const permitido = roles.some((rol) =>
    ["administrador", "superadmin", "chofer"].includes(rol.trim().toLowerCase()),
  );

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: c.background }]}
      contentContainerStyle={styles.contenido}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.volver}>
        <ArrowLeft size={20} color={c.primary} />
        <View style={styles.botonVolver}>
          <Button title="Volver al Dashboard" variant="ghost" onPress={() => router.replace("/dashboard" as any)} />
        </View>
      </View>
      <ThemedText style={[styles.leyenda, { color: c.textSecondary }]}>Módulos / Egresos</ThemedText>
      {permitido ? (
        <DashboardEgresos />
      ) : (
        <ThemedText style={{ color: c.destructive }}>No tienes permiso para acceder a este módulo.</ThemedText>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contenido: { width: "100%", maxWidth: 1100, alignSelf: "center", paddingHorizontal: 12, paddingTop: 12, paddingBottom: 36, gap: 12 },
  volver: { flexDirection: "row", alignItems: "center", gap: 2, alignSelf: "flex-start" },
  botonVolver: { minWidth: 0 },
  leyenda: { fontSize: 12, fontWeight: "700" },
});
