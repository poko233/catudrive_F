import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import type { Piso } from "../types/vehiculo.types";

type Props = {
  pisos: Piso[];
  activeIndex: number;
  onSelectFloor: (index: number) => void;
};

export function FloorSelector({ pisos, activeIndex, onSelectFloor }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.row}>
      {pisos.map((piso, idx) => (
        <Pressable
          key={piso.id ?? piso.numero}
          onPress={() => onSelectFloor(idx)}
          style={({ pressed }) => [
            styles.tab,
            {
              backgroundColor:
                idx === activeIndex ? c.primary : c.backgroundSecondary,
              borderColor: c.border,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <ThemedText
            style={{
              color:
                idx === activeIndex ? c.primaryForeground : c.textSecondary,
              fontWeight: "800",
            }}
          >
            {piso.nombre}
          </ThemedText>
        </Pressable>
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
});
