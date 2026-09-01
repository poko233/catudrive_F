// components/ui/IconButton.tsx

import { useTheme } from "@/theme/useTheme";
import type { LucideIcon } from "lucide-react-native";
import { MotiPressable } from "moti/interactions";
import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type IconButtonVariant =
  | "primary"
  | "secondary"
  | "destructive"
  | "ghost";

export type IconButtonSize =
  | "sm"
  | "md"
  | "lg";

interface IconButtonProps {
  /**
   * Icono de lucide-react-native.
   *
   * @example
   * icon={Eye}
   * icon={Pencil}
   * icon={Trash2}
   */
  icon: LucideIcon;

  /**
   * Acción ejecutada al presionar.
   */
  onPress: () => void;

  /**
   * Variante visual.
   *
   * @default "ghost"
   */
  variant?: IconButtonVariant;

  /**
   * Tamaño general del botón.
   *
   * @default "md"
   */
  size?: IconButtonSize;

  /**
   * Tamaño personalizado del icono.
   * Si no se especifica, depende de `size`.
   */
  iconSize?: number;

  /**
   * Deshabilita el botón.
   */
  disabled?: boolean;

  /**
   * Muestra un spinner en lugar del icono.
   */
  loading?: boolean;

  /**
   * Convierte el botón en círculo.
   *
   * @default false
   */
  rounded?: boolean;

  /**
   * Etiqueta obligatoria recomendada
   * para accesibilidad.
   */
  accessibilityLabel: string;

  /**
   * Estilos adicionales.
   */
  style?: StyleProp<ViewStyle>;
}

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN DE TAMAÑOS
|--------------------------------------------------------------------------
*/

const sizeMap: Record<
  IconButtonSize,
  {
    button: number;
    icon: number;
    radius: number;
  }
> = {
  sm: {
    button: 32,
    icon: 16,
    radius: 8,
  },

  md: {
    button: 40,
    icon: 19,
    radius: 10,
  },

  lg: {
    button: 48,
    icon: 22,
    radius: 12,
  },
};

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function IconButton({
  icon: Icon,
  onPress,
  variant = "ghost",
  size = "md",
  iconSize,
  disabled = false,
  loading = false,
  rounded = false,
  accessibilityLabel,
  style,
}: IconButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const sizeConfig = sizeMap[size];

  const isDisabled =
    disabled || loading;

  /*
  |--------------------------------------------------------------------------
  | COLORES
  |--------------------------------------------------------------------------
  */

  const backgroundMap: Record<
    IconButtonVariant,
    string
  > = {
    primary: c.primary,

    secondary:
      c.backgroundSecondary,

    destructive:
      c.destructive,

    ghost: "transparent",
  };

  const foregroundMap: Record<
    IconButtonVariant,
    string
  > = {
    primary:
      c.primaryForeground,

    secondary: c.text,

    destructive:
      c.destructiveForeground,

    ghost: c.textSecondary,
  };

  const borderMap: Record<
    IconButtonVariant,
    string
  > = {
    primary: c.primary,

    secondary: c.border,

    destructive:
      c.destructive,

    ghost: c.border,
  };

  const backgroundColor =
    backgroundMap[variant];

  const foregroundColor =
    foregroundMap[variant];

  const borderColor =
    borderMap[variant];

  return (
    <MotiPressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel
      }
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
      }}
      animate={({ pressed }) => ({
        scale:
          pressed && !isDisabled
            ? 0.9
            : 1,

        opacity: isDisabled
          ? 0.45
          : pressed
            ? 0.82
            : 1,
      })}
      transition={{
        type: "timing",
        duration: 120,
      }}
      style={[
        styles.button,
        {
          width:
            sizeConfig.button,

          height:
            sizeConfig.button,

          borderRadius: rounded
            ? sizeConfig.button / 2
            : sizeConfig.radius,

          backgroundColor,

          borderColor,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={foregroundColor}
        />
      ) : (
        <Icon
          size={
            iconSize ??
            sizeConfig.icon
          }
          color={foregroundColor}
          strokeWidth={2}
        />
      )}
    </MotiPressable>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,

    alignItems: "center",
    justifyContent: "center",

    flexShrink: 0,
  },
});