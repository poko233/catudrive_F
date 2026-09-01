// components/MobileDrawer.tsx
import React, { useEffect } from "react";
import { Pressable } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useMobileDrawer } from "../contexts/MobileDrawerContext";
import { useResponsive } from "../hooks/useResponsive";
import { useTheme } from "../theme/useTheme";
import { Sidebar } from "./Sidebar/Sidebar";

export const MobileDrawer: React.FC = () => {
  const { isOpen, closeDrawer } = useMobileDrawer();
  const { theme } = useTheme();
  const c = theme.colors;
  const { isDesktop } = useResponsive();

  const translateX = useSharedValue(-300);
  const backdropOpacity = useSharedValue(0);

  // En escritorio jamás se muestra este drawer
  useEffect(() => {
    if (isDesktop) {
      translateX.value = withTiming(-300, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop) return;

    if (isOpen) {
      translateX.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
      backdropOpacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withTiming(-300, {
        duration: 250,
        easing: Easing.in(Easing.quad),
      });
      backdropOpacity.value = withTiming(0, { duration: 250 });
    }
  }, [isOpen, isDesktop]);

  const drawerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  // Si es escritorio no renderizamos nada
  if (isDesktop) return null;

  return (
    <>
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 9,
          },
          backdropStyle,
        ]}
        pointerEvents={isOpen ? "auto" : "none"}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={closeDrawer}
          accessibilityLabel="Cerrar menú"
        />
      </Animated.View>

      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 280,
            zIndex: 10,
            backgroundColor: c.card,
            elevation: 20,
            shadowColor: "#000",
            shadowOffset: { width: 5, height: 0 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
          },
          drawerStyle,
        ]}
      >
        {/* El botón de cerrar fue eliminado completamente de aquí */}
        <Sidebar onNavigate={closeDrawer} />
      </Animated.View>
    </>
  );
};
