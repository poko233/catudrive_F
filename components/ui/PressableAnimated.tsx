// components/ui/PressableAnimated.tsx
import React, { useMemo } from "react";
import { MotiPressable } from "moti/interactions";
import type { MotiTransition } from "moti";
import { haptics } from "../../animations/haptics";
import { springConfig, TIMING_FAST } from "../../animations/configs";
import type { StyleProp, ViewStyle, AccessibilityRole } from "react-native";

interface PressableAnimatedProps {
  /** Contenido del botón */
  children: React.ReactNode;
  /** Función a ejecutar al presionar */
  onPress?: () => void;
  /** Deshabilitar el botón (no anima ni vibra) */
  disabled?: boolean;
  /** Escala durante el press (default 0.97) */
  scaleTo?: number;
  /**
   * Duración del efecto de presión (timing) en ms.
   * Por defecto usa TIMING_FAST (180ms) del sistema.
   */
  pressedDuration?: number;
  /** Estilos adicionales para el contenedor */
  style?: StyleProp<ViewStyle>;
  /** Accesibilidad */
  accessibilityLabel?: string;
  /** Rol de accesibilidad (button, link, etc.) */
  accessibilityRole?: AccessibilityRole;
}

export const PressableAnimated: React.FC<PressableAnimatedProps> = ({
  children,
  onPress,
  disabled = false,
  scaleTo = 0.97,
  pressedDuration = TIMING_FAST,
  style,
  accessibilityLabel,
  accessibilityRole,
}) => {
  const animate = useMemo(
    () =>
      ({ pressed }: { pressed: boolean }) => {
        "worklet";
        return {
          scale: disabled ? 1 : pressed ? scaleTo : 1,
          opacity: disabled ? 0.5 : 1,
        };
      },
    [disabled, scaleTo],
  );

  const transition = useMemo(
    () =>
      ({ pressed }: { pressed: boolean }) => {
        "worklet";
        // Si está presionado, usamos timing con la duración indicada (flexible)
        // Si se suelta, usamos spring (orgánico)
        const baseTransition: MotiTransition = pressed
          ? {
              type: "timing",
              duration: pressedDuration,
            }
          : {
              type: "spring",
              damping: springConfig.snappy.damping,
              stiffness: springConfig.snappy.stiffness,
              mass: springConfig.snappy.mass,
            };
        return baseTransition;
      },
    [pressedDuration],
  );

  return (
    <MotiPressable
      animate={animate}
      transition={transition}
      onPress={() => {
        if (!disabled) {
          haptics.light();
          onPress?.();
        }
      }}
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole}
    >
      {children}
    </MotiPressable>
  );
};

export default PressableAnimated;
