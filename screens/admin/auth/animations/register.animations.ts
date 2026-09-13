import { Easing } from "react-native-reanimated";

export const getStepTransition = (direction: "forward" | "backward") => {
  const enterX = direction === "forward" ? 40 : -40;
  const exitX = direction === "forward" ? -40 : 40;

  return {
    from: {
      opacity: 0,
      translateX: enterX,
    },
    animate: {
      opacity: 1,
      translateX: 0,
    },
    exit: {
      opacity: 0,
      translateX: exitX,
    },
    transition: {
      type: "timing" as const,
      duration: 700,
      easing: Easing.out(Easing.cubic),
    },
    exitTransition: {
      type: "timing" as const,
      duration: 700,
      easing: Easing.in(Easing.cubic),
    },
  };
};
