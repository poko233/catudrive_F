import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { AnimatedBlock } from "@/components/ui/AnimatedBlock";
import { PressableAnimated } from "@/components/ui/PressableAnimated";
import { useTheme } from "@/theme/useTheme";

type Props = {
  /** Título: "Pisos" | "Filas" | "Columnas". */
  label: string;
  /** Descripción corta bajo el título. */
  hint: string;
  /** Valor actual (solo lectura, lo controla el padre). */
  value: number;
  /** Decrementar. */
  onMinus: () => void;
  /** Incrementar. */
  onPlus: () => void;
  /** Deshabilita el botón − (mínimo alcanzado o guardando). */
  minusDisabled?: boolean;
  /** Deshabilita el botón + (normalmente guardando). */
  plusDisabled?: boolean;
  /**
   * Tiñe el botón − de destructivo. Úsalo cuando restar
   * elimina datos (quitar un piso). Filas/columnas no lo usan.
   */
  dangerMinus?: boolean;
  /** Retardo de entrada para el stagger (respeta index * 60). */
  delay?: number;
};

/*
|--------------------------------------------------------------------------
| DIMENSION STEPPER
|--------------------------------------------------------------------------
|
| Control − valor + para una dimensión del bus (pisos, filas o
| columnas). PressableAnimated da el feedback táctil + háptico
| centralizado; AnimatedBlock la entrada con stagger.
|
*/

export function DimensionStepper({
  label,
  hint,
  value,
  onMinus,
  onPlus,
  minusDisabled = false,
  plusDisabled = false,
  dangerMinus = false,
  delay = 0,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const minusBg = dangerMinus ? c.destructive : c.backgroundSecondary;
  const minusFg = dangerMinus ? c.destructiveForeground : c.text;
  const minusBorder = dangerMinus ? c.destructive : c.border;

  return (
    <AnimatedBlock preset="fadeIn" delay={delay} style={styles.stepper}>
      <View style={styles.textBlock}>
        <ThemedText style={styles.label}>{label}</ThemedText>
        <ThemedText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.hint, { color: c.textSecondary }]}
        >
          {hint}
        </ThemedText>
      </View>

      <View style={styles.controls}>
        <PressableAnimated
          onPress={onMinus}
          disabled={minusDisabled}
          accessibilityLabel={`Quitar ${label}`}
          accessibilityRole="button"
          style={[
            styles.stepButton,
            {
              backgroundColor: minusBg,
              borderColor: minusBorder,
            },
          ]}
        >
          <ThemedText style={[styles.stepGlyph, { color: minusFg }]}>
            −
          </ThemedText>
        </PressableAnimated>

        <View
          style={[
            styles.valuePill,
            {
              backgroundColor: c.backgroundSecondary,
              borderColor: c.border,
            },
          ]}
        >
          <ThemedText style={[styles.value, { color: c.text }]}>
            {value}
          </ThemedText>
        </View>

        <PressableAnimated
          onPress={onPlus}
          disabled={plusDisabled}
          accessibilityLabel={`Añadir ${label}`}
          accessibilityRole="button"
          style={[
            styles.stepButton,
            {
              backgroundColor: c.primary,
              borderColor: c.primary,
            },
          ]}
        >
          <ThemedText
            style={[styles.stepGlyph, { color: c.primaryForeground }]}
          >
            +
          </ThemedText>
        </PressableAnimated>
      </View>
    </AnimatedBlock>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 150,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "800",
  },
  hint: {
    fontSize: 11,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  stepButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepGlyph: {
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 19,
    textAlign: "center",
  },
  valuePill: {
    minWidth: 40,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 15,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
});
