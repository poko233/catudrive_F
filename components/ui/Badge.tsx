// components/ui/Badge.tsx

import React from "react";

import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

import { useTheme } from "../../theme/useTheme";

// ─────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────

export type BadgeVariant =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "muted";

export type BadgeAppearance =
  | "soft"
  | "solid"
  | "outline";

export type BadgeSize =
  | "sm"
  | "md"
  | "lg";

interface BadgeProps {
  /**
   * Texto mostrado dentro del badge.
   */
  label: string | number;

  /**
   * Variante semántica.
   *
   * Default: muted
   */
  variant?: BadgeVariant;

  /**
   * Apariencia visual.
   *
   * soft:
   * fondo suave
   *
   * solid:
   * fondo completo
   *
   * outline:
   * solo borde
   *
   * Default: soft
   */
  appearance?: BadgeAppearance;

  /**
   * Tamaño.
   *
   * Default: sm
   */
  size?: BadgeSize;

  /**
   * Icono opcional.
   */
  icon?: React.ReactNode;

  /**
   * Mostrar punto de estado.
   */
  dot?: boolean;

  /**
   * Convertir texto a mayúsculas.
   */
  uppercase?: boolean;

  /**
   * Estilos adicionales.
   */
  style?: StyleProp<ViewStyle>;

  /**
   * Estilos adicionales del texto.
   */
  textStyle?: StyleProp<TextStyle>;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function withAlpha(
  color: string,
  alphaHex: string,
): string {
  /**
   * HEX normal:
   *
   * #FF0000
   * ↓
   * #FF000022
   */
  if (
    /^#[0-9A-Fa-f]{6}$/.test(
      color,
    )
  ) {
    return `${color}${alphaHex}`;
  }

  /**
   * HEX corto:
   *
   * #F00
   * ↓
   * #FF000022
   */
  if (
    /^#[0-9A-Fa-f]{3}$/.test(
      color,
    )
  ) {
    const [
      r,
      g,
      b,
    ] =
      color
        .slice(1)
        .split("");

    return `#${r}${r}${g}${g}${b}${b}${alphaHex}`;
  }

  /**
   * Si el tema utiliza rgb/rgba u otro formato,
   * usamos el color directamente.
   */
  return color;
}

function getContrastColor(
  color: string,
): string {
  if (
    !/^#[0-9A-Fa-f]{6}$/.test(
      color,
    )
  ) {
    return "#FFFFFF";
  }

  const r =
    parseInt(
      color.slice(
        1,
        3,
      ),
      16,
    );

  const g =
    parseInt(
      color.slice(
        3,
        5,
      ),
      16,
    );

  const b =
    parseInt(
      color.slice(
        5,
        7,
      ),
      16,
    );

  const luminance =
    (
      r * 299 +
      g * 587 +
      b * 114
    ) /
    1000;

  return luminance >
    165
    ? "#111827"
    : "#FFFFFF";
}

// ─────────────────────────────────────────────
// Componente
// ─────────────────────────────────────────────

export function Badge({
  label,
  variant = "muted",
  appearance = "soft",
  size = "sm",
  icon,
  dot = false,
  uppercase = false,
  style,
  textStyle,
}: BadgeProps) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  // ───────────────────────────────────────────
  // Colores
  // ───────────────────────────────────────────

  const colorMap:
    Record<
      BadgeVariant,
      string
    > = {
      primary:
        c.primary,

      success:
        c.success,

      warning:
        c.warning,

      info:
        c.info,

      destructive:
        c.destructive,

      muted:
        c.textMuted,
    };

  /**
   * Protección ante una variante inválida
   * proveniente de datos dinámicos.
   */
  const baseColor =
    colorMap[
      variant as BadgeVariant
    ] ??
    colorMap.muted;

  // ───────────────────────────────────────────
  // Apariencia
  // ───────────────────────────────────────────

  const appearanceStyle =
    appearance ===
    "solid"
      ? {
          backgroundColor:
            baseColor,

          borderColor:
            baseColor,

          textColor:
            getContrastColor(
              baseColor,
            ),
        }
      : appearance ===
          "outline"
        ? {
            backgroundColor:
              "transparent",

            borderColor:
              withAlpha(
                baseColor,
                "88",
              ),

            textColor:
              baseColor,
          }
        : {
            backgroundColor:
              withAlpha(
                baseColor,
                "20",
              ),

            borderColor:
              withAlpha(
                baseColor,
                "35",
              ),

            textColor:
              baseColor,
          };

  // ───────────────────────────────────────────
  // Tamaños
  // ───────────────────────────────────────────

  const sizeStyle =
    size === "lg"
      ? {
          paddingHorizontal:
            12,

          paddingVertical:
            6,

          fontSize:
            13,

          dotSize:
            7,

          gap:
            7,
        }
      : size ===
          "md"
        ? {
            paddingHorizontal:
              10,

            paddingVertical:
              4,

            fontSize:
              12,

            dotSize:
              6,

            gap:
              6,
          }
        : {
            paddingHorizontal:
              9,

            paddingVertical:
              3,

            fontSize:
              10,

            dotSize:
              5,

            gap:
              5,
          };

  // ───────────────────────────────────────────
  // Label
  // ───────────────────────────────────────────

  const displayLabel =
    uppercase
      ? String(
          label,
        ).toUpperCase()
      : String(
          label,
        );

  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={
        displayLabel
      }
      style={[
        styles.badge,

        {
          backgroundColor:
            appearanceStyle
              .backgroundColor,

          borderColor:
            appearanceStyle
              .borderColor,

          paddingHorizontal:
            sizeStyle
              .paddingHorizontal,

          paddingVertical:
            sizeStyle
              .paddingVertical,

          gap:
            sizeStyle.gap,
        },

        style,
      ]}
    >
      {/* Punto de estado */}

      {dot && (
        <View
          style={[
            styles.dot,

            {
              width:
                sizeStyle
                  .dotSize,

              height:
                sizeStyle
                  .dotSize,

              borderRadius:
                sizeStyle
                  .dotSize /
                2,

              backgroundColor:
                appearance ===
                "solid"
                  ? appearanceStyle
                      .textColor
                  : baseColor,
            },
          ]}
        />
      )}

      {/* Icono */}

      {icon ? (
        <View
          style={
            styles.icon
          }
        >
          {icon}
        </View>
      ) : null}

      {/* Texto */}

      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[
          styles.label,

          {
            color:
              appearanceStyle
                .textColor,

            fontSize:
              sizeStyle
                .fontSize,
          },

          textStyle,
        ]}
      >
        {displayLabel}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────

const styles =
  StyleSheet.create({
    badge: {
      alignSelf:
        "flex-start",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius:
        999,

      borderWidth:
        1,

      maxWidth:
        "100%",
    },

    label: {
      flexShrink:
        1,

      fontWeight:
        "800",

      letterSpacing:
        0.15,

      lineHeight:
        16,
    },

    dot: {
      flexShrink:
        0,
    },

    icon: {
      alignItems:
        "center",

      justifyContent:
        "center",

      flexShrink:
        0,
    },
  });

export default Badge;