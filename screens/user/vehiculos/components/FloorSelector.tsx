import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import type { Piso } from "../types/vehiculo.types";

type Props = {
  pisos: Piso[];
  activeIndex: number;
  onSelectFloor: (index: number) => void;
};

/*
|--------------------------------------------------------------------------
| PESTAÑA DE PISO
|--------------------------------------------------------------------------
|
| Subcomponente con su propio estado pressed y estilos 100%
| estáticos (sin callbacks de Pressable): render determinista
| en Android nativo. Mismo patrón que components/ui/Select.tsx
| (SelectOptionRow) y MobileTabBar.
|
*/

function FloorTab({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isDesktop } = useResponsive();
  const [pressed, setPressed] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.tab,
        !isDesktop && styles.tabMobile,
        {
          backgroundColor: active ? c.primary : c.backgroundSecondary,
          borderColor: c.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <ThemedText
        style={{
          color: active ? c.primaryForeground : c.textSecondary,
          fontWeight: "800",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function FloorSelector({ pisos, activeIndex, onSelectFloor }: Props) {
  return (
    <View style={styles.row}>
      {pisos.map((piso, idx) => (
        <FloorTab
          key={piso.id ?? piso.numero}
          label={piso.nombre}
          active={idx === activeIndex}
          onPress={() => onSelectFloor(idx)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabMobile: {
    flexShrink: 0,
    minHeight: 40,
    justifyContent: "center",
  },
});
