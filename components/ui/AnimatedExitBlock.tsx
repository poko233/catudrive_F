// components/ui/AnimatedExitBlock.tsx
import React, { useMemo } from "react";
import { MotiView } from "moti";
import type { MotiTransition } from "moti";
import type { ViewProps } from "react-native";
import {
  fadeOut,
  scaleOut,
  slideOutUp,
  slideOutDown,
} from "../../animations/exiting";

type ExitPresetName = "fadeOut" | "scaleOut" | "slideOutUp" | "slideOutDown";

interface AnimatedExitBlockProps extends ViewProps {
  /** Preset de salida a aplicar */
  preset?: ExitPresetName;
  /** Retardo en ms antes de iniciar la animación (para stagger) */
  delay?: number;
  /**
   * Duración en ms.
   * Sobrescribe la duración del preset de salida (forzando timing si se pasa).
   */
  duration?: number;
  /**
   * Transición personalizada para la salida. Sobrescribe completamente el preset.
   */
  transition?: MotiTransition;
  children: React.ReactNode;
}

const exitPresetMap = {
  fadeOut,
  scaleOut,
  slideOutUp,
  slideOutDown,
};

export const AnimatedExitBlock: React.FC<AnimatedExitBlockProps> = ({
  preset = "fadeOut",
  delay = 0,
  duration,
  transition: customTransition,
  children,
  style,
  ...rest
}) => {
  const p = exitPresetMap[preset];

  // Lógica idéntica a AnimatedBlock pero para salidas
  const finalTransition: MotiTransition = useMemo(() => {
    if (customTransition) {
      return { ...customTransition, delay };
    }
    if (duration !== undefined) {
      return { type: "timing" as const, duration, delay };
    }
    return { ...p.exitTransition, delay };
  }, [customTransition, duration, delay, p.exitTransition]);

  return (
    <MotiView
      exit={p.exit}
      exitTransition={finalTransition}
      style={style}
      {...rest}
    >
      {children}
    </MotiView>
  );
};

export default AnimatedExitBlock;
