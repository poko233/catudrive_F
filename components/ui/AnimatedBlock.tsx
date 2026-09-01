// components/ui/AnimatedBlock.tsx
import React, { useState, useEffect, useMemo } from "react";
import { MotiView } from "moti";
import type { MotiTransition } from "moti";
import type { ViewProps } from "react-native";
import {
  fadeIn,
  scaleIn,
  slideInUp,
  slideInDown,
  slideInLeft,
  slideInRight,
} from "../../animations/entering";

type PresetName =
  | "fadeIn"
  | "scaleIn"
  | "slideInUp"
  | "slideInDown"
  | "slideInLeft"
  | "slideInRight";

interface AnimatedBlockProps extends ViewProps {
  /** Preset de entrada a aplicar */
  preset?: PresetName;
  /** Retardo en ms antes de iniciar la animación (para stagger) */
  delay?: number;
  /**
   * Duración en ms.
   * - Si el preset usa timing, sobrescribe su duración.
   * - Si el preset usa spring, cambia la animación a timing con esta duración.
   */
  duration?: number;
  /**
   * Transición personalizada. Sobrescribe completamente la transición del preset.
   * Úsalo si necesitas un spring con parámetros custom.
   */
  transition?: MotiTransition;
  children: React.ReactNode;
}

const presetMap = {
  fadeIn,
  scaleIn,
  slideInUp,
  slideInDown,
  slideInLeft,
  slideInRight,
};

export const AnimatedBlock: React.FC<AnimatedBlockProps> = ({
  preset = "fadeIn",
  delay = 0,
  duration,
  transition: customTransition,
  children,
  style,
  ...rest
}) => {
  const p = presetMap[preset];
  const [isMounted, setIsMounted] = useState(false);

  // Solución para SSR en web: esperar a que monte en el cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Lógica centralizada para construir la transición final con el delay INYECTADO
  const finalTransition: MotiTransition = useMemo(() => {
    if (customTransition) {
      // Si hay transición custom, inyectamos el delay
      return { ...customTransition, delay };
    }
    if (duration !== undefined) {
      // Si hay duración, forzamos timing + inyectamos delay
      return { type: "timing" as const, duration, delay };
    }
    // Si no hay nada, usamos el preset del mapa + inyectamos delay
    return { ...p.transition, delay };
  }, [customTransition, duration, delay, p.transition]);

  return (
    <MotiView
      from={p.from}
      animate={isMounted ? p.animate : p.from}
      transition={finalTransition}
      style={style}
      {...rest}
    >
      {children}
    </MotiView>
  );
};

export default AnimatedBlock;
