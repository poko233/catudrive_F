// components/MobileHeader.tsx

import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useMobileDrawer } from "../contexts/MobileDrawerContext";
import { useTheme } from "../theme/useTheme";

export const MobileHeader: React.FC = () => {
  const { theme } = useTheme();
  const c = theme.colors;

  const { toggleDrawer } = useMobileDrawer();

  const hamburgerScale = useSharedValue(1);

  const hamburgerAnim = useAnimatedStyle(() => ({
    transform: [
      {
        scale: hamburgerScale.value,
      },
    ],
  }));

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-start",
        backgroundColor: c.background,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <Animated.View style={hamburgerAnim}>
        <Pressable
          onPress={toggleDrawer}
          onPressIn={() => {
            hamburgerScale.value = withTiming(
              0.9,
              {
                duration: 150,
              }
            );
          }}
          onPressOut={() => {
            hamburgerScale.value = withTiming(
              1,
              {
                duration: 150,
              }
            );
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor:
              c.backgroundSecondary,
            alignItems: "center",
            justifyContent: "center",
          }}
          accessibilityLabel="Abrir menú lateral"
        >
          <Ionicons
            name="menu"
            size={24}
            color={c.text}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
};