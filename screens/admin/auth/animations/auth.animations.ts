// screens/auth/animations/auth.animations.ts
import type { SharedValue } from "react-native-reanimated";
import { withSequence, withSpring, withTiming } from "react-native-reanimated";

export const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 0.5,
};

export const buttonPressAnimation = (scale: SharedValue<number>) => {
  scale.value = withSequence(
    withTiming(0.95, { duration: 50 }),
    withSpring(1, springConfig),
  );
};

export const errorShakeAnimation = (translateX: SharedValue<number>) => {
  translateX.value = withSequence(
    withTiming(-8, { duration: 30 }),
    withTiming(8, { duration: 30 }),
    withTiming(-4, { duration: 30 }),
    withTiming(0, { duration: 30 }),
  );
};

export const staggerListConfig = {
  damping: 15,
  stiffness: 100,
};
