// components/ui/Switch.tsx

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { MotiView } from "moti";
import { MotiPressable } from "moti/interactions";
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

export type SwitchSize =
  | "sm"
  | "md"
  | "lg";

interface SwitchProps {
  /**
   * Estado actual del switch.
   */
  value: boolean;

  /**
   * Se ejecuta cuando cambia el estado.
   */
  onValueChange: (value: boolean) => void;

  /**
   * Texto principal opcional.
   */
  label?: string;

  /**
   * Texto secundario opcional.
   */
  description?: string;

  /**
   * Deshabilita la interacción.
   */
  disabled?: boolean;

  /**
   * Tamaño del switch.
   *
   * @default "md"
   */
  size?: SwitchSize;

  /**
   * Permite personalizar el color cuando está activo.
   * Si no se indica usa theme.colors.primary.
   */
  activeColor?: string;

  /**
   * Etiqueta de accesibilidad.
   */
  accessibilityLabel?: string;

  /**
   * Estilos adicionales del contenedor completo.
   */
  style?: StyleProp<ViewStyle>;
}

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN DE TAMAÑOS
|--------------------------------------------------------------------------
*/

const sizeMap: Record<
  SwitchSize,
  {
    trackWidth: number;
    trackHeight: number;
    thumbSize: number;
    padding: number;
  }
> = {
  sm: {
    trackWidth: 38,
    trackHeight: 22,
    thumbSize: 16,
    padding: 3,
  },

  md: {
    trackWidth: 46,
    trackHeight: 26,
    thumbSize: 20,
    padding: 3,
  },

  lg: {
    trackWidth: 56,
    trackHeight: 32,
    thumbSize: 24,
    padding: 4,
  },
};

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function Switch({
  value,
  onValueChange,
  label,
  description,
  disabled = false,
  size = "md",
  activeColor,
  accessibilityLabel,
  style,
}: SwitchProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const config = sizeMap[size];

  const enabledColor =
    activeColor ?? c.primary;

  /*
  |--------------------------------------------------------------------------
  | POSICIÓN DEL THUMB
  |--------------------------------------------------------------------------
  */

  const maxTranslate =
    config.trackWidth -
    config.thumbSize -
    config.padding * 2;

  /*
  |--------------------------------------------------------------------------
  | CAMBIO DE ESTADO
  |--------------------------------------------------------------------------
  */

  const handlePress = () => {
    if (disabled) {
      return;
    }

    onValueChange(!value);
  };

  return (
    <MotiPressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={
        accessibilityLabel ??
        label ??
        "Interruptor"
      }
      accessibilityState={{
        checked: value,
        disabled,
      }}
      animate={({ pressed }) => ({
        scale:
          pressed && !disabled
            ? 0.98
            : 1,

        opacity:
          disabled
            ? 0.5
            : 1,
      })}
      transition={{
        type: "timing",
        duration: 120,
      }}
      style={[
        styles.container,
        style,
      ]}
    >
      {/* ===================================================== */}
      {/* TEXTO */}
      {/* ===================================================== */}

      {label || description ? (
        <View style={styles.textContainer}>
          {label ? (
            <ThemedText
              style={[
                styles.label,
                {
                  color: c.text,
                },
              ]}
            >
              {label}
            </ThemedText>
          ) : null}

          {description ? (
            <ThemedText
              style={[
                styles.description,
                {
                  color: c.textSecondary,
                },
              ]}
            >
              {description}
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      {/* ===================================================== */}
      {/* SWITCH */}
      {/* ===================================================== */}

      <MotiView
        animate={{
          backgroundColor: value
            ? enabledColor
            : c.backgroundSecondary,

          borderColor: value
            ? enabledColor
            : c.border,
        }}
        transition={{
          type: "timing",
          duration: 180,
        }}
        style={[
          styles.track,
          {
            width: config.trackWidth,
            height: config.trackHeight,

            borderRadius:
              config.trackHeight / 2,

            padding: config.padding,
          },
        ]}
      >
        {/* THUMB */}

        <MotiView
          animate={{
            translateX: value
              ? maxTranslate
              : 0,
          }}
          transition={{
            type: "timing",
            duration: 180,
          }}
          style={[
            styles.thumb,
            {
              width: config.thumbSize,
              height: config.thumbSize,

              borderRadius:
                config.thumbSize / 2,

              backgroundColor:
                c.primaryForeground,
            },
          ]}
        />
      </MotiView>
    </MotiPressable>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  container: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    gap: 16,
  },

  /*
  |--------------------------------------------------------------------------
  | TEXTO
  |--------------------------------------------------------------------------
  */

  textContainer: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
  },

  description: {
    marginTop: 3,

    fontSize: 12,
    lineHeight: 17,
  },

  /*
  |--------------------------------------------------------------------------
  | SWITCH
  |--------------------------------------------------------------------------
  */

  track: {
    borderWidth: 1,

    justifyContent: "center",

    flexShrink: 0,
  },

  thumb: {
    elevation: 2,
  },
});