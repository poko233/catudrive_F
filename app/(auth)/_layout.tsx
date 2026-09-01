// app/(auth)/_layout.tsx
import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/store/authStore";
import { useTheme } from "../../theme/useTheme";

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  // Mientras carga la sesión, mostramos un splash para no enseñar el login
  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  // Si ya hay sesión, redirigimos fuera del área pública
  if (user) {
    return <Redirect href="/perfil" />;
  }

  // Solo si NO hay sesión, mostramos el flujo de autenticación
  return <Slot />;
}
