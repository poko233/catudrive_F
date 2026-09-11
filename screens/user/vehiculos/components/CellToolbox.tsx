import React, { useState } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { TIPOS_CELDA } from "../utils/gridMapper";
import type { TipoCelda } from "../types/vehiculo.types";

type Props = {
  selected: TipoCelda;
  onSelect: (tipo: TipoCelda) => void;
};

/*
|--------------------------------------------------------------------------
| HERRAMIENTA
|--------------------------------------------------------------------------
|
| Subcomponente con su propio estado pressed y estilos 100%
| estáticos (sin callbacks de Pressable): render determinista
| en Android nativo. Mismo patrón que components/ui/Select.tsx
| (SelectOptionRow) y MobileTabBar.
|
*/

function ToolboxTool({
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

  /*
  |--------------------------------------------------------------------------
  | FONDO VISIBLE EN MÓVIL
  |--------------------------------------------------------------------------
  |
  | backgroundSecondary es idéntico al fondo del Card en los 3
  | temas (las pills se mimetizan). En móvil se usa tertiary,
  | que sí contrasta con el Card en todos los temas.
  | Desktop intacto.
  |
  */
  const idleFill = isDesktop ? c.backgroundSecondary : c.backgroundTertiary;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.tool,
        !isDesktop && styles.toolMobile,
        {
          backgroundColor: active ? c.primarySubtle : idleFill,
          borderColor: active ? c.primary : c.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <ThemedText style={styles.toolLabel}>{label}</ThemedText>
    </Pressable>
  );
}

export function CellToolbox({ selected, onSelect }: Props) {
  return (
    <View style={styles.wrapper}>
      {TIPOS_CELDA.map((tool) => (
        <ToolboxTool
          key={tool.type}
          label={tool.label}
          active={selected === tool.type}
          onPress={() => onSelect(tool.type)}
        />
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
  toolMobile: {
    flexShrink: 0,
    minHeight: 40,
    justifyContent: "center",
  },
  toolLabel: { fontSize: 12, fontWeight: "700" },
});
