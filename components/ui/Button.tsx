import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../theme/useTheme";

type Variant = "primary" | "secondary" | "destructive" | "ghost";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const bg: Record<Variant, string> = {
    primary: c.primary,
    secondary: c.secondary,
    destructive: c.destructive,
    ghost: "transparent",
  };

  const fg: Record<Variant, string> = {
    primary: c.primaryForeground,
    secondary: c.secondaryForeground,
    destructive: c.destructiveForeground,
    ghost: c.text,
  };

  const borderColor: Record<Variant, string> = {
    primary: c.primary,
    secondary: c.border,
    destructive: c.destructive,
    ghost: c.border,
  };

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg[variant],
          borderColor: borderColor[variant],
          opacity: isDisabled ? 0.5 : pressed ? 0.82 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg[variant]} />
      ) : (
        <Text style={[styles.label, { color: fg[variant] }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
});
