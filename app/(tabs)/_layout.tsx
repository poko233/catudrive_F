// app/(tabs)/_layout.tsx
import { AppLayout } from "@/components/AppLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router/tabs";
import { useAuth } from "@/store/authStore";
import { useResponsive } from "../../hooks/useResponsive";
import { useTheme } from "../../theme/useTheme";
import { TabDefinition, getTabsForRoles } from "../../utils/roleBasedTabs";

// ⚠️ Lista COMPLETA de todas las pantallas que existen en app/(tabs)/
// Si agregas un archivo nuevo a (tabs), agrégalo aquí también.
const ALL_POSSIBLE_TABS: TabDefinition[] = [
  { name: "perfil", title: "Perfil", icon: "person-outline" },
];

export default function TabsLayout() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { isDesktop } = useResponsive();

  // Tabs que el usuario SÍ puede ver según sus roles
  const allowedTabs = getTabsForRoles(user?.roles.map((r) => r.rol) || []);
  const allowedNames = new Set(allowedTabs.map((t) => t.name));

  return (
    <ProtectedRoute>
      <AppLayout>
        <Tabs
          tabBar={isDesktop ? () => null : undefined}
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: theme.colors.primary,
            tabBarInactiveTintColor: theme.colors.muted,
            tabBarStyle: {
              backgroundColor: theme.colors.background,
              borderTopColor: theme.colors.border,
              paddingBottom: 12,
              paddingTop: 10,
              height: 79,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: "700",
              marginTop: 4,
              paddingBottom: 2,
            },
          }}
        >
          {ALL_POSSIBLE_TABS.map((tab) => {
            const isAllowed = allowedNames.has(tab.name);

            if (!isAllowed) {
              // href: null → Expo Router oculta la pestaña Y bloquea la navegación
              return (
                <Tabs.Screen
                  key={tab.name}
                  name={tab.name}
                  options={{ href: null }}
                />
              );
            }

            return (
              <Tabs.Screen
                key={tab.name}
                name={tab.name}
                options={{
                  title: tab.title,
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons
                      name={tab.icon as keyof typeof Ionicons.glyphMap}
                      size={size}
                      color={color}
                    />
                  ),
                }}
              />
            );
          })}
        </Tabs>
      </AppLayout>
    </ProtectedRoute>
  );
}
