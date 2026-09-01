// animations/configs.ts
import type {
  WithSpringConfig,
  WithTimingConfig,
} from "react-native-reanimated";

/**
 * Constantes de duración estandarizadas del proyecto.
 * Cambia estos valores y toda la app se actualizará.
 */
export const TIMING_FAST = 250;
export const TIMING_MEDIUM = 600;
export const TIMING_SLOW = 1000;

export const ENTER_DURATION = TIMING_MEDIUM;
export const LAYOUT_DURATION = TIMING_MEDIUM;

export const springConfig: Record<
  "snappy" | "gentle" | "bouncy",
  WithSpringConfig
> = {
  /** Rápido y firme, sin oscilación. Ideal para press feedback. */
  snappy: {
    damping: 28,
    stiffness: 160,
    mass: 1.0,
  },
  /** Suave y controlado. Para entradas/salidas. */
  gentle: {
    damping: 20,
    stiffness: 150,
    mass: 1.0,
  },
  /** Un poco más elástico, sin llegar a molestar. Para elementos decorativos. */
  bouncy: {
    damping: 15,
    stiffness: 150,
    mass: 1.0,
  },
};

export const timingConfig: Record<
  "fast" | "normal" | "slow",
  WithTimingConfig
> = {
  fast: { duration: TIMING_FAST },
  normal: { duration: TIMING_MEDIUM },
  slow: { duration: TIMING_SLOW },
};
