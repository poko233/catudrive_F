import React from "react";
import { View } from "react-native";
import { create } from "zustand"; // <-- Importar zustand
import { useAuth } from "@/store/authStore";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../theme/useTheme";
import { MobileHeader } from "./MobileHeader";
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
  const { user } = useAuth();

  // 2. Extraer el estado global en lugar de useState
  const { collapsed, toggle } = useSidebarStore();

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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <MobileHeader />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
};
