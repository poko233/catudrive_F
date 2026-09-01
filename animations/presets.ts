// animations/presets.ts
import { fadeIn, slideInUp, slideInDown, scaleIn } from "./entering";
import { fadeOut, scaleOut, slideOutDown } from "./exiting";

/**
 * Presets completos para casos de uso comunes.
 * Combinan entrada, salida y transición.
 */

/** Modal centrado con escala */
export const modalScale = {
  from: scaleIn.from,
  animate: scaleIn.animate,
  exit: scaleOut.exit,
  transition: scaleIn.transition,
  exitTransition: scaleOut.exitTransition,
};

/** Modal tipo bottom sheet (slide up + fade) */
export const bottomSheet = {
  from: slideInDown.from,
  animate: slideInDown.animate,
  exit: slideOutDown.exit,
  transition: slideInDown.transition,
  exitTransition: slideOutDown.exitTransition,
};

/** Fade simple para overlays */
export const overlayFade = {
  from: fadeIn.from,
  animate: fadeIn.animate,
  exit: fadeOut.exit,
  transition: fadeIn.transition,
  exitTransition: fadeOut.exitTransition,
};
