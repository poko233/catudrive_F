// components/ui/Divider.tsx

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import React from "react";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type DividerOrientation =
  | "horizontal"
  | "vertical";

export type DividerLabelPosition =
  | "start"
  | "center"
  | "end";

interface DividerProps {
  /**
   * Orientación del divisor.
   *
   * @default "horizontal"
   */
  orientation?: DividerOrientation;

  /**
   * Grosor de la línea.
   *
   * @default 1
   */
  thickness?: number;

  /**
   * Color personalizado.
   *
   * Si no se define utiliza:
   * theme.colors.border
   */
  color?: string;

  /**
   * Espaciado exterior.
   *
   * Horizontal:
   * marginVertical
   *
   * Vertical:
   * marginHorizontal
   *
   * @default 12
   */
  spacing?: number;

  /**
   * Margen desde los extremos.
   *
   * Horizontal:
   * marginHorizontal
   *
   * Vertical:
   * marginVertical
   *
   * @default 0
   */
  inset?: number;

  /**
   * Texto opcional.
   *
   * Solo funciona en horizontal.
   */
  label?: string;

  /**
   * Posición del texto.
   *
   * @default "center"
   */
  labelPosition?: DividerLabelPosition;

  /**
   * Estilos adicionales.
   */
  style?: StyleProp<ViewStyle>;
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function Divider({
  orientation = "horizontal",
  thickness = 1,
  color,
  spacing = 12,
  inset = 0,
  label,
  labelPosition = "center",
  style,
}: DividerProps) {
  const { theme } = useTheme();

  const c = theme.colors;

  const dividerColor =
    color ?? c.border;

  /*
  |--------------------------------------------------------------------------
  | DIVIDER VERTICAL
  |--------------------------------------------------------------------------
  */

  if (orientation === "vertical") {
    return (
      <View
        accessibilityRole="none"
        style={[
          styles.vertical,

          {
            width: thickness,

            backgroundColor:
              dividerColor,

            marginHorizontal:
              spacing,

            marginVertical:
              inset,
          },

          style,
        ]}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | DIVIDER HORIZONTAL SIN LABEL
  |--------------------------------------------------------------------------
  */

  if (!label) {
    return (
      <View
        accessibilityRole="none"
        style={[
          styles.horizontal,

          {
            height: thickness,

            backgroundColor:
              dividerColor,

            marginVertical:
              spacing,

            marginHorizontal:
              inset,
          },

          style,
        ]}
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | FLEX DE LAS LÍNEAS SEGÚN POSICIÓN
  |--------------------------------------------------------------------------
  */

  const startFlex =
    labelPosition === "start"
      ? 0.25
      : labelPosition === "end"
        ? 1
        : 1;

  const endFlex =
    labelPosition === "end"
      ? 0.25
      : labelPosition === "start"
        ? 1
        : 1;

  /*
  |--------------------------------------------------------------------------
  | DIVIDER HORIZONTAL CON LABEL
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={[
        styles.labelContainer,

        {
          marginVertical:
            spacing,

          marginHorizontal:
            inset,
        },

        style,
      ]}
    >
      {/* ===================================================== */}
      {/* LÍNEA IZQUIERDA */}
      {/* ===================================================== */}

      <View
        style={[
          styles.labelLine,

          {
            flex: startFlex,

            height: thickness,

            backgroundColor:
              dividerColor,
          },
        ]}
      />

      {/* ===================================================== */}
      {/* TEXTO */}
      {/* ===================================================== */}

      <ThemedText
        style={[
          styles.label,

          {
            color:
              c.textMuted,
          },
        ]}
      >
        {label}
      </ThemedText>

      {/* ===================================================== */}
      {/* LÍNEA DERECHA */}
      {/* ===================================================== */}

      <View
        style={[
          styles.labelLine,

          {
            flex: endFlex,

            height: thickness,

            backgroundColor:
              dividerColor,
          },
        ]}
      />
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  /*
  |--------------------------------------------------------------------------
  | HORIZONTAL
  |--------------------------------------------------------------------------
  */

  horizontal: {
    width: "auto",

    flexShrink: 0,
  },

  /*
  |--------------------------------------------------------------------------
  | VERTICAL
  |--------------------------------------------------------------------------
  */

  vertical: {
    alignSelf: "stretch",

    flexShrink: 0,
  },

  /*
  |--------------------------------------------------------------------------
  | LABEL
  |--------------------------------------------------------------------------
  */

  labelContainer: {
    width: "auto",

    flexDirection: "row",

    alignItems: "center",

    gap: 12,
  },

  labelLine: {
    minWidth: 20,
  },

  label: {
    flexShrink: 0,

    fontSize: 12,

    fontWeight: "600",
  },
});