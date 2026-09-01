import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { useTheme } from "../../theme/useTheme";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding = 16 }: CardProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: c.card, borderColor: c.border, padding },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
});
