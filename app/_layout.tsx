// app/_layout.tsx
import { injectGlobalScrollbar } from "@/components/globalScrollbar";
import { Slot, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MobileDrawer } from "../components/MobileDrawer";
import { Toaster } from "../components/Toaster";
import { MobileDrawerProvider } from "../contexts/MobileDrawerContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import "../global.css";
import { useTheme } from "../theme/useTheme";
import { useAuthStore } from "../store/authStore";
import { Platform } from "react-native"; // ← añadido

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
const ICONO_URL = `${API_URL}/empresa/empresa_1_icono.webp`;

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  const loading = useAuthStore((s) => s.loading);

  useEffect(() => {
    initialize();
  }, []);

  if (loading) return null;

  return <>{children}</>;
}

function AppContent() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const isStudent = user?.roles?.some((r) => r.rol === "Estudiante");
  const showDrawer = !!user && pathname !== "/" && !isStudent;

  React.useEffect(() => {
    injectGlobalScrollbar({
      background: theme.colors.background,
      thumb: theme.colors.border,
      thumbHover: theme.colors.borderHover,
    });
  }, [theme]);

  return (
    <>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <MobileDrawerProvider>
        <Slot />
        {showDrawer && <MobileDrawer />}
      </MobileDrawerProvider>
      <Toaster />
    </>
  );
}

export default function RootLayout() {
  // Favicon dinámico (web) — se ejecuta siempre, sin depender de sesión
  useEffect(() => {
    if (Platform.OS !== "web") return;
    let link = document.querySelector(
      "link[rel='icon']",
    ) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = ICONO_URL;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthInitializer>
            <AppContent />
          </AuthInitializer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
