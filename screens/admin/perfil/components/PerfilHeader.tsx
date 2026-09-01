// screens/admin/perfil/components/PerfilHeader.tsx

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ThemedText } from "@/components/ThemedText";
import { useAuth } from "@/store/authStore";
import { useTheme } from "@/theme/useTheme";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

import { useMobileDrawer } from "../../../../contexts/MobileDrawerContext";
import { useResponsive } from "../../../../hooks/useResponsive";
import { useModulesStore } from "../../../../store/modulesStore";
import { usePerfilData } from "../hooks/usePerfilData";

type Props = {
  onChangePasswordPress: () => void;
};

const initials = (name?: string) =>
  name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U";

export const PerfilHeader = ({ onChangePasswordPress }: Props) => {
  const { theme } = useTheme();
  const { isDesktop, isMobile, isTablet } = useResponsive();
  const { nombreCompleto, roles, foto } = usePerfilData();
  const { logout } = useAuth();
  const router = useRouter();
  const { closeDrawer } = useMobileDrawer();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;

    setLoading(true);

    try {
      await logout();
      closeDrawer();
      useModulesStore.getState().clearModulos();
      router.replace("/");

      Toast.show({
        type: "success",
        text1: "Sesión cerrada",
      });
    } catch (error) {
      console.error(error);

      Toast.show({
        type: "error",
        text1: "No se pudo cerrar la sesión",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding={0} style={styles.card}>
      <View
        style={[
          styles.cover,
          { backgroundColor: theme.colors.primarySubtle },
        ]}
      />

      <View
        style={[
          styles.content,
          {
            flexDirection: isDesktop ? "row" : "column",
            alignItems: isDesktop ? "flex-end" : "center",
          },
        ]}
      >
        <View
          style={[
            styles.avatarShell,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.card,
            },
          ]}
        >
          {foto ? (
            <Image
              source={{ uri: foto }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.placeholder,
                { backgroundColor: theme.colors.primarySubtle },
              ]}
            >
              <ThemedText
                style={[styles.initials, { color: theme.colors.primary }]}
              >
                {initials(nombreCompleto)}
              </ThemedText>
            </View>
          )}
        </View>

        <View
          style={[
            styles.info,
            { alignItems: isDesktop ? "flex-start" : "center" },
          ]}
        >
          <ThemedText
            style={[
              styles.name,
              { textAlign: isDesktop ? "left" : "center" },
            ]}
          >
            {nombreCompleto || "Usuario"}
          </ThemedText>

          <View
            style={[
              styles.roles,
              { justifyContent: isDesktop ? "flex-start" : "center" },
            ]}
          >
            {roles?.length ? (
              roles.map((rol, index) => (
                <Badge
                  key={`${rol}-${index}`}
                  label={rol}
                  variant={index === 0 ? "info" : "muted"}
                />
              ))
            ) : (
              <Badge label="Sin rol" variant="muted" />
            )}
          </View>
        </View>

        <View style={[styles.actions, !isDesktop && styles.actionsMobile]}>
          {(isMobile || isTablet) && (
            <Button
              title="Cerrar sesión"
              variant="destructive"
              loading={loading}
              onPress={handleLogout}
            />
          )}

          <Button title="Cambiar contraseña" onPress={onChangePasswordPress} />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  cover: {
    height: 105,
  },
  content: {
    gap: 16,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: -38,
  },
  avatarShell: {
    width: 96,
    height: 96,
    borderRadius: 28,
    borderWidth: 5,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 28,
    fontWeight: "900",
  },
  info: {
    flex: 1,
    minWidth: 0,
    paddingBottom: 5,
  },
  name: {
    fontSize: 23,
    fontWeight: "900",
  },
  roles: {
    marginTop: 8,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 4,
  },
  actionsMobile: {
    width: "100%",
    justifyContent: "center",
  },
});
