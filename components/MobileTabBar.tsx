// components/MobileTabBar.tsx
import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { haptics } from "@/animations/haptics";
import { useTheme } from "../theme/useTheme";

/*
|--------------------------------------------------------------------------
| BARRA DE TABS GLOBAL (SOLO MÓVIL)
|--------------------------------------------------------------------------
|
| Se renderiza en AppLayout para TODA la app (grupo (tabs)
| y grupo (app)), así las 3 tabs se ven y funcionan desde
| cualquier pantalla sin duplicar rutas en (tabs).
|
| Usa replace para no apilar historial entre tabs.
|
| Los estilos son estáticos (sin callbacks de Pressable)
| para una medición determinista en Android nativo.
|
*/

const TABS = [
  { ruta: "/venta", titulo: "Venta", icono: "ticket-outline" },
  { ruta: "/encomiendas", titulo: "Encomiendas", icono: "cube-outline" },
  { ruta: "/perfil", titulo: "Perfil", icono: "person-outline" },
] as const;

function TabItem({
  ruta,
  titulo,
  icono,
  activa,
  color,
  onPress,
}: {
  ruta: string;
  titulo: string;
  icono: keyof typeof Ionicons.glyphMap;
  activa: boolean;
  color: string;
  onPress: (ruta: string) => void;
}) {
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={() => onPress(ruta)}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={`Ir a ${titulo}`}
      accessibilityState={{ selected: activa }}
      style={[
        styles.tab,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Ionicons size={24} color={color} name={icono} />
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.etiqueta,
          {
            color,
            fontWeight: activa ? "700" : "600",
          },
        ]}
      >
        {titulo}
      </Text>
    </Pressable>
  );
}

export const MobileTabBar: React.FC = () => {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const pathname = usePathname() ?? "";

  const irATab = (ruta: string) => {
    if (pathname === ruta || pathname.startsWith(`${ruta}/`)) return;
    haptics.selection();
    router.replace(ruta as any);
  };

  return (
    <View
      style={[
        styles.barra,
        {
          backgroundColor: c.background,
          borderTopColor: c.border,
        },
      ]}
    >
      {TABS.map((tab) => {
        const activa =
          pathname === tab.ruta || pathname.startsWith(`${tab.ruta}/`);
        return (
          <TabItem
            key={tab.ruta}
            ruta={tab.ruta}
            titulo={tab.titulo}
            icono={tab.icono}
            activa={activa}
            color={activa ? c.primary : c.muted}
            onPress={irATab}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  barra: {
    width: "100%",
    height: 66,
    flexDirection: "row",
    flexWrap: "nowrap",
    alignItems: "stretch",
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tab: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  etiqueta: {
    fontSize: 12,
    marginTop: 2,
    textAlign: "center",
  },
});
