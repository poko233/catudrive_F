// screens/auth/components/SubmitButton.tsx
import * as Haptics from "expo-haptics";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../../../theme/useTheme";

interface SubmitButtonProps {
  title: string;
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
}

export const SubmitButton = ({
  title,
  onPress,
  loading,
  disabled,
}: SubmitButtonProps) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      translateY.value = withSpring(2, { damping: 15, stiffness: 300 });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    translateY.value = withSpring(0, { damping: 15, stiffness: 300 });
  };

  return (
    <Animated.View style={[animatedStyle, styles.wrapper]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[
          styles.button,
          {
            backgroundColor: theme.colors.primary,
            shadowColor: theme.colors.primaryActive,
            opacity: disabled || loading ? 0.5 : 1,
          },
        ]}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color={theme.colors.primaryForeground} />
        ) : (
          <Text
            style={[styles.text, { color: theme.colors.primaryForeground }]}
          >
            {title}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginTop: 8,
  },
  button: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    // Sombra inferior simulando profundidad
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  text: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
