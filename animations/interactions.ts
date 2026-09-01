// animations/interactions.ts
import { useCallback } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from "react-native-reanimated";
import { springConfig } from "./configs";
import { haptics } from "./haptics";

// ── Presionar (escala) ────────────────────────────────────────────────────

/**
 * Hook que devuelve un estilo animado para aplicar feedback de presión.
 * Normalmente se usa con MotiPressable, pero aquí dejamos una alternativa
 * con Reanimated puro por si no se desea usar MotiPressable.
 *
 * @param scaleTo Escala durante el press (default 0.97)
 * @returns animatedStyle + handlers onPressIn/onPressOut
 */
export function usePressAnimation(scaleTo: number = 0.97) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, springConfig.snappy);
    haptics.light();
  }, [scale]);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, springConfig.snappy);
  }, [scale]);

  return { animatedStyle, onPressIn, onPressOut };
}

// ── Shake (error / terremoto leve) ────────────────────────────────────────

/**
 * Hook que devuelve un estilo animado para el efecto "shake" horizontal.
 * Útil para inputs con error de validación.
 *
 * @returns animatedStyle + triggerShake()
 */
export function useShake() {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const triggerShake = useCallback(() => {
    translateX.value = withSequence(
      withTiming(-8, { duration: 50, easing: Easing.out(Easing.cubic) }),
      withTiming(8, { duration: 50, easing: Easing.out(Easing.cubic) }),
      withTiming(-6, { duration: 50, easing: Easing.out(Easing.cubic) }),
      withTiming(6, { duration: 50, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 50, easing: Easing.out(Easing.cubic) }),
    );
    haptics.heavy();
  }, [translateX]);

  return { animatedStyle, triggerShake };
}
