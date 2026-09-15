import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand"; // <-- Importar zustand
import { useAuth } from "@/store/authStore";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../theme/useTheme";
import { MobileHeader } from "./MobileHeader";
import { MobileTabBar } from "./MobileTabBar";
import { Sidebar } from "./Sidebar/Sidebar";

// 1. Mini-estado global para mantener el colapso al cambiar de pantalla
const useSidebarStore = create<{
  collapsed: boolean;
  toggle: () => void;
}>((set) => ({
  collapsed: false,
  toggle: () => set((state) => ({ collapsed: !state.collapsed })),
}));

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { isDesktop } = useResponsive();
  const { theme } = useTheme();
  const { roles } = useAuth();
  const insets = useSafeAreaInsets();

  // 2. Extraer el estado global en lugar de useState
  const { collapsed, toggle } = useSidebarStore();

  // Roles con acceso completo al panel (sidebar + header).
  // Cubre "admin", "administrador", "superadmin", "super admin", etc.
  // Regla pedida:
  // - Desktop/Web: TODOS los roles ven Sidebar, sin tabs.
  // - Android/Movil: no-admin ve solo contenido + tabs
  //   (sin sidebar ni sidebar header).
  const hasFullAccess = roles.some((role) =>
    role.toLowerCase().includes("admin"),
  );

  if (isDesktop) {
    return (
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          backgroundColor: theme.colors.background,
        }}
      >
        <Sidebar collapsed={collapsed} onToggleCollapse={toggle} />
        <View
          style={{
            flex: 1,
            backgroundColor: theme.colors.backgroundSecondary,
            zIndex: 1, // <-- Mantiene el contenido por debajo del sidebar
          }}
        >
          {children}
        </View>
      </View>
    );
  }

  if (!hasFullAccess) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        <View style={{ flex: 1 }}>{children}</View>
        <MobileTabBar />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <MobileHeader />
      <View style={{ flex: 1 }}>{children}</View>
      <MobileTabBar />
    </View>
  );
};
