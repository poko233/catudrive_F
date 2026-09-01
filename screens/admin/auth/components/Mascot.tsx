// screens/auth/components/Mascot.tsx
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../../../theme/useTheme";

interface MascotProps {
  isPasswordVisible: boolean;
  usernameFocused: SharedValue<boolean>;
  passwordFocused: SharedValue<boolean>;
  eyeOffsetX: SharedValue<number>;
  eyeOffsetY: SharedValue<number>;
}

export const Mascot: React.FC<MascotProps> = ({
  isPasswordVisible,
  usernameFocused,
  passwordFocused,
  eyeOffsetX,
  eyeOffsetY,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  // ==========================================
  // PALETA DINÁMICA ADAPTATIVA PARA CADA MODO
  // ==========================================
  const getMascotPalette = () => {
    switch (theme.name) {
      case "premium":
        return {
          chassis: "#FDF6E3", // Marfil/Crema Premium (coincide con tu texto VIP)
          face: "#150204", // Pantalla vino-negra ultra profunda
          arms: "#E2C78E", // Brazos de oro cepillado pulido
          shadowColor: "#000000",
          shadowOpacity: 0.65,
          shadowRadius: 20,
          mouth: "rgba(212, 175, 55, 0.2)", // Brillo sutil dorado
        };
      case "dark":
        return {
          chassis: "#F1F5F9", // Blanco platino/metalizado suave (evita el quemado de ojo)
          face: "#0B0F19", // Pantalla cyber-dark profunda
          arms: "#94A3B8", // Brazos Slate combinados
          shadowColor: "#000000",
          shadowOpacity: 0.5,
          shadowRadius: 18,
          mouth: "rgba(255, 255, 255, 0.08)",
        };
      case "light":
      default:
        return {
          chassis: "#FFFFFF", // Blanco puro clásico institucional
          face: "#1D2022", // Gris oscuro original
          arms: "#E0E3E5", // Gris estándar original
          shadowColor: "#000000",
          shadowOpacity: 0.18,
          shadowRadius: 12,
          mouth: "rgba(0, 0, 0, 0.06)",
        };
    }
  };

  const p = getMascotPalette();

  // Parpadeo
  const blinkHeight = useSharedValue(14);
  useEffect(() => {
    blinkHeight.value = withRepeat(
      withSequence(
        withTiming(14, { duration: 3600 }),
        withTiming(2, { duration: 100 }),
        withTiming(14, { duration: 100 }),
        withTiming(14, { duration: 200 }),
      ),
      -1,
      false,
    );
  }, [blinkHeight]);

  const headTranslateY = useSharedValue(0);
  const headScale = useSharedValue(1);
  const armLeftRotate = useSharedValue(0);
  const armRightRotate = useSharedValue(0);
  const bodyTranslateY = useSharedValue(0);
  // Saludo bajo demanda (clic en la mascota)
  const triggerGreeting = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    armLeftRotate.value = withSequence(
      withTiming(140, { duration: 300, easing: Easing.out(Easing.ease) }),
      withTiming(100, { duration: 150, easing: Easing.inOut(Easing.ease) }),
      withTiming(140, { duration: 150, easing: Easing.inOut(Easing.ease) }),
      withTiming(100, { duration: 150, easing: Easing.inOut(Easing.ease) }),
      withTiming(0, { duration: 300, easing: Easing.out(Easing.ease) }),
    );
  }, [armLeftRotate]);
  // Respiración
  useEffect(() => {
    bodyTranslateY.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 2000 }),
        withTiming(2, { duration: 2000 }),
      ),
      -1,
      true,
    );
    return () => {
      bodyTranslateY.value = 0;
    };
  }, [bodyTranslateY]);

  // Saludo inicial
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerGreeting();
    }, 500);
    return () => clearTimeout(timer);
  }, [triggerGreeting]);

  // Animación cubrirse los ojos (Modo privacidad)
  useEffect(() => {
    if (isPasswordVisible) {
      armLeftRotate.value = withTiming(-145, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      armRightRotate.value = withTiming(145, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      headTranslateY.value = withTiming(10, { duration: 300 });
      headScale.value = withTiming(0.95, { duration: 300 });
    } else {
      armLeftRotate.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      armRightRotate.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
      headTranslateY.value = withTiming(0, { duration: 300 });
      headScale.value = withTiming(1, { duration: 300 });
    }
  }, [
    isPasswordVisible,
    armLeftRotate,
    armRightRotate,
    headTranslateY,
    headScale,
  ]);

  const wrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bodyTranslateY.value }],
  }));

  const headAnimatedStyle = useAnimatedStyle(() => {
    const rotY = interpolate(eyeOffsetX.value, [-8, 8], [-8, 8]);
    const rotX = interpolate(eyeOffsetY.value, [-5, 5], [5, -5]);
    return {
      transform: [
        { rotateY: `${rotY}deg` },
        { rotateX: `${rotX}deg` },
        { translateY: headTranslateY.value },
        { scale: headScale.value },
      ],
    };
  });

  const eyeStyle = useAnimatedStyle(() => {
    const h = isPasswordVisible ? 2 : blinkHeight.value;
    return {
      height: h,
      opacity: h > 2 ? 1 : 0.8,
      transform: [
        { translateX: eyeOffsetX.value },
        { translateY: eyeOffsetY.value },
      ],
    };
  });

  const armLeftStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${armLeftRotate.value}deg` }],
  }));

  const armRightStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${armRightRotate.value}deg` }],
  }));

  const dynamicArmZIndex = isPasswordVisible ? 40 : 20;

  return (
    <Pressable onPress={triggerGreeting} style={styles.container}>
      <Animated.View style={[styles.wrapper, wrapperStyle]}>
        {/* Brazo Izquierdo */}
        <Animated.View
          style={[
            styles.arm,
            styles.armLeft,
            armLeftStyle,
            {
              backgroundColor: p.arms, // Dinámico
              zIndex: dynamicArmZIndex,
              transformOrigin: "top center",
            },
          ]}
        >
          <View style={[styles.hand, { backgroundColor: c.primary }]} />
        </Animated.View>

        {/* Brazo Derecho */}
        <Animated.View
          style={[
            styles.arm,
            styles.armRight,
            armRightStyle,
            {
              backgroundColor: p.arms, // Dinámico
              zIndex: dynamicArmZIndex,
              transformOrigin: "top center",
            },
          ]}
        >
          <View style={[styles.hand, { backgroundColor: c.primary }]} />
        </Animated.View>

        {/* Cabeza */}
        <Animated.View
          style={[
            styles.head,
            {
              backgroundColor: p.chassis, // Dinámico
              shadowColor: p.shadowColor,
              shadowOpacity: p.shadowOpacity,
              shadowRadius: p.shadowRadius,
            },
            headAnimatedStyle,
          ]}
        >
          <View style={[styles.face, { backgroundColor: p.face }]}>
            <View style={styles.eyeContainer}>
              <Animated.View
                style={[
                  styles.eye,
                  eyeStyle,
                  {
                    backgroundColor:
                      theme.name === "premium" ? "#FDF6E3" : "#ffb4ab",
                  },
                ]}
              />
            </View>
            <View style={styles.eyeContainer}>
              <Animated.View
                style={[
                  styles.eye,
                  eyeStyle,
                  {
                    backgroundColor:
                      theme.name === "premium" ? "#FDF6E3" : "#ffb4ab",
                  },
                ]}
              />
            </View>
          </View>
          <View style={[styles.mouth, { backgroundColor: p.mouth }]} />
        </Animated.View>

        {/* Cuerpo (Torso) */}
        <Animated.View
          style={[styles.body, { backgroundColor: p.chassis }]} // Dinámico
        >
          <View
            style={[styles.logoContainer, { borderColor: c.primary + "33" }]}
          >
            <View style={[styles.logo, { backgroundColor: c.primary }]} />
          </View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 256,
    height: 256,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  wrapper: {
    width: 256,
    height: 220,
    position: "relative",
    alignItems: "center",
  },
  arm: {
    position: "absolute",
    width: 24,
    height: 64,
    borderRadius: 99,
    top: 112,
  },
  armLeft: {
    left: 60,
  },
  armRight: {
    right: 60,
  },
  hand: {
    position: "absolute",
    bottom: -8,
    left: (24 - 32) / 2,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  head: {
    width: 144,
    height: 128,
    borderRadius: 48,
    zIndex: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 15,
    shadowOffset: { width: 0, height: 12 },
  },
  face: {
    width: 112,
    height: 80,
    borderRadius: 32,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  eyeContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  eye: {
    width: 14,
    height: 14,
    borderRadius: 7,
    shadowColor: "#cc1a1d",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 3,
  },
  mouth: {
    position: "absolute",
    bottom: 16,
    width: 32,
    height: 4,
    borderRadius: 2,
  },
  body: {
    width: 112,
    height: 96,
    borderTopLeftRadius: 48,
    borderTopRightRadius: 48,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginTop: -24,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 32,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 16,
    height: 16,
    borderRadius: 4,
    transform: [{ rotate: "45deg" }],
  },
});
