import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { TIPOS_CELDA } from "../utils/gridMapper";
import type { TipoCelda } from "../types/vehiculo.types";

type Props = {
  selected: TipoCelda;
  onSelect: (tipo: TipoCelda) => void;
};

export function CellToolbox({ selected, onSelect }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.wrapper}>
      {TIPOS_CELDA.map((tool) => (
        <Pressable
          key={tool.type}
          onPress={() => onSelect(tool.type)}
          style={({ pressed }) => [
            styles.tool,
            {
              backgroundColor:
                selected === tool.type
                  ? c.primarySubtle
                  : c.backgroundSecondary,
              borderColor: selected === tool.type ? c.primary : c.border,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <ThemedText style={styles.toolLabel}>{tool.label}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tool: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolLabel: { fontSize: 12, fontWeight: "700" },
});
