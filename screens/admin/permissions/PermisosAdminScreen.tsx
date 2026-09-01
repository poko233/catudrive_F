import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../../theme/useTheme";

// Esta pantalla fue reemplazada por RolPermisosScreen (accesible desde la lista de Roles → botón 🔑)
export function PermisosAdminScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={[styles.center, { backgroundColor: c.background }]}>
      <Ionicons name="key-outline" size={42} color={c.primary} />
      <Text style={[styles.title, { color: c.text }]}>
        Gestión de Permisos
      </Text>
      <Text style={[styles.sub, { color: c.textSecondary }]}>
        Abre la pestaña "Roles" y toca el ícono{" "}
        <Text style={{ fontWeight: "800" }}>🔑</Text> en cualquier rol para
        editar sus permisos.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  sub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
});
