// animations/exiting.ts
import type { MotiTransition } from "moti";
import { timingConfig } from "./configs";

interface ExitPreset {
  exit: Record<string, number>;
  exitTransition?: MotiTransition;
}

/** Fade out rápido */
export const fadeOut: ExitPreset = {
  exit: { opacity: 0 },
  exitTransition: { type: "timing", ...timingConfig.fast },
};

/** Scale out + fade */
export const scaleOut: ExitPreset = {
  exit: { opacity: 0, scale: 0.9 },
  exitTransition: { type: "timing", ...timingConfig.fast },
};

/** Slide out hacia arriba + fade */
export const slideOutUp: ExitPreset = {
  exit: { opacity: 0, translateY: -20 },
  exitTransition: { type: "timing", ...timingConfig.fast },
};

/** Slide out hacia abajo + fade */
export const slideOutDown: ExitPreset = {
  exit: { opacity: 0, translateY: 20 },
  exitTransition: { type: "timing", ...timingConfig.fast },
};
