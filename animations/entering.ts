// animations/entering.ts
import type { MotiTransition } from "moti";
import { springConfig, ENTER_DURATION } from "./configs";

type Direction = "up" | "down" | "left" | "right";

interface EnterPreset {
  from: Record<string, number>;
  animate: Record<string, number>;
  transition: MotiTransition;
}

const translateMap: Record<Direction, { axis: string; sign: number }> = {
  up: { axis: "translateY", sign: -1 },
  down: { axis: "translateY", sign: 1 },
  left: { axis: "translateX", sign: -1 },
  right: { axis: "translateX", sign: 1 },
};

/** Crea un preset de entrada con fade + slide desde una dirección */
function fadeSlide(direction: Direction, distance: number = 30): EnterPreset {
  const { axis, sign } = translateMap[direction];
  return {
    from: { opacity: 0, [axis]: sign * distance },
    animate: { opacity: 1, [axis]: 0 },
    transition: {
      type: "spring",
      ...springConfig.gentle,
    },
  };
}

/** Fade simple */
export const fadeIn: EnterPreset = {
  from: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { type: "timing", duration: ENTER_DURATION },
};

/** Scale + fade (zoom in) */
export const scaleIn: EnterPreset = {
  from: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: {
    type: "spring",
    ...springConfig.gentle,
  },
};

/** Slide + fade desde arriba */
export const slideInUp = fadeSlide("up");
/** Slide + fade desde abajo */
export const slideInDown = fadeSlide("down");
/** Slide + fade desde izquierda */
export const slideInLeft = fadeSlide("left");
/** Slide + fade desde derecha */
export const slideInRight = fadeSlide("right");
