// screens/admin/auth/components/GlassCard.tsx
import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../../../../theme/useTheme";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style }) => {
  const { theme } = useTheme();

  // Usamos el color card del tema con alta opacidad para garantizar legibilidad
  const backgroundColor = theme.dark
    ? "rgba(30, 41, 59, 0.88)" // Slate-800 (card en dark) con alpha
    : "rgba(255, 255, 255, 0.88)"; // Blanco (card en light) con alpha

  const borderColor = theme.dark
    ? "rgba(255, 255, 255, 0.18)"
    : "rgba(0, 0, 0, 0.12)";

  const blurIntensity = theme.dark ? 55 : 40;
  const tint = theme.dark ? "dark" : "light";

  return (
    <View style={[styles.container, style]}>
      <BlurView
        intensity={blurIntensity}
        tint={tint}
        style={[
          styles.blur,
          {
            backgroundColor,
            borderColor,
          },
        ]}
      >
        {children}
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 32,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
    elevation: 20,
  },
  blur: {
    paddingVertical: 20,
    paddingHorizontal: 28,
    borderRadius: 32,
    borderWidth: 1,
  },
});
