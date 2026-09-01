// components/Sidebar/SidebarFooter.tsx
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import logoImg from "../../assets/images/logo_texto.png";
import { useAuth } from "@/store/authStore";
import { useMobileDrawer } from "../../contexts/MobileDrawerContext";
import { useModulesStore } from "../../store/modulesStore";
import { useTheme } from "../../theme/useTheme";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const LOGO_LARGO_URL = `${API_URL}/empresa/empresa_1_logo_largo.webp`;

export const SidebarFooter: React.FC<{ collapsed?: boolean }> = ({
  collapsed = false,
}) => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const { closeDrawer } = useMobileDrawer();
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      Toast.show({
        type: "success",
        text1: "Sesión cerrada",
        text2: "Has salido correctamente.",
        visibilityTime: 3000,
      });
      closeDrawer();
      useModulesStore.getState().clearModulos();
      router.replace("/");
    } catch (e) {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const hoverHandlers =
    Platform.OS === "web"
      ? {
          onMouseEnter: () => setHovered(true),
          onMouseLeave: () => setHovered(false),
        }
      : {};

  if (collapsed) {
    return (
      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          paddingVertical: 8,
          alignItems: "center",
        }}
      >
        <Pressable
          onPress={handleLogout}
          disabled={loading}
          {...(hoverHandlers as any)}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            padding: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor:
              hovered || pressed
                ? theme.colors.destructive
                : theme.colors.border,
            backgroundColor:
              hovered || pressed
                ? theme.colors.destructive + "12"
                : "transparent",
            opacity: loading ? 0.6 : 1,
          })}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.destructive} />
          ) : (
            <LogOut size={16} color={theme.colors.destructive} />
          )}
        </Pressable>
      </View>
    );
  }

  return (
    <View
      style={{
        marginTop: "auto",
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        paddingHorizontal: 8,
        paddingVertical: 6,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
      }}
    >
      <Image
        source={logoFailed ? logoImg : { uri: LOGO_LARGO_URL }}
        style={{ flex: 1, height: 28 }}
        contentFit="contain"
        contentPosition="left center"
        onError={() => setLogoFailed(true)}
        transition={200}
      />
      <Pressable
        onPress={handleLogout}
        disabled={loading}
        {...(hoverHandlers as any)}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 5,
          paddingHorizontal: 6,
          paddingVertical: 4,
          borderRadius: 8,
          borderWidth: 1,
          borderColor:
            hovered || pressed ? theme.colors.destructive : theme.colors.border,
          backgroundColor:
            hovered || pressed
              ? theme.colors.destructive + "12"
              : "transparent",
          opacity: loading ? 0.6 : 1,
        })}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.destructive} />
        ) : (
          <>
            <LogOut size={11} color={theme.colors.destructive} />
            <Text
              style={{
                fontSize: 9,
                fontWeight: "600",
                color: theme.colors.destructive,
              }}
            >
              Salir
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
};
