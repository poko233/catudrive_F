// components/Sidebar/SidebarHeader.tsx
import React from "react";
import { Image, StyleSheet, Text, View, Pressable } from "react-native"; // <-- Importar Pressable
import { useRouter } from "expo-router"; // <-- Importar useRouter
import { useAuth } from "@/store/authStore";
import { useTheme } from "../../theme/useTheme";

export const SidebarHeader: React.FC<{ collapsed?: boolean }> = ({
  collapsed = false,
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter(); // <-- Inicializar router

  if (!user) return null;

  const { nombres, primer_apellido, segundo_apellido, foto } = user;
  const apellido = `${primer_apellido || ""} ${segundo_apellido || ""}`.trim();
  const nombreCompleto =
    `${nombres || ""} ${apellido || ""}`.trim() || "Usuario";

  const initials = () => {
    const n = nombres?.charAt(0) || "";
    const a = primer_apellido?.charAt(0) || "";
    return (n + a).toUpperCase() || "U";
  };

  const avatarSize = collapsed ? 36 : 40;
  const avatarRadius = avatarSize / 2;

  // Renderizado del Avatar (Se usa para ambos modos)
  const renderAvatar = () => (
    <View style={{ position: "relative" }}>
      <View
        style={{
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarRadius,
          borderWidth: 1.5,
          borderColor: theme.colors.primary,
          overflow: "hidden",
          backgroundColor: theme.colors.backgroundSecondary,
        }}
      >
        {foto ? (
          <Image
            source={{ uri: foto }}
            style={{ width: "100%", height: "100%", resizeMode: "cover" }}
          />
        ) : (
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: theme.colors.text,
              }}
            >
              {initials()}
            </Text>
          </View>
        )}
      </View>
      {/* Punto Online */}
      <View
        style={[
          styles.onlineDot,
          { borderColor: theme.colors.backgroundSecondary },
        ]}
      />
    </View>
  );

  // Modo colapsado
  if (collapsed) {
    return (
      <Pressable
        onPress={() => router.push("/perfil")}
        style={styles.collapsedContainer}
      >
        {renderAvatar()}
      </Pressable>
    );
  }

  // Modo extendido
  return (
    <Pressable onPress={() => router.push("/perfil")} style={styles.container}>
      {renderAvatar()}
      <View style={styles.textContainer}>
        <Text
          style={{ fontSize: 13, fontWeight: "700", color: theme.colors.text }}
          numberOfLines={1}
        >
          {nombreCompleto}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  textContainer: {
    flex: 1,
  },
  collapsedContainer: {
    alignItems: "center",
    paddingVertical: 10,
  },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#22c55e", // Verde online
    borderWidth: 2.5,
  },
});
