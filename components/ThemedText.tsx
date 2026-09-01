// components/ThemedText.tsx

import React from "react";
import {
  StyleSheet,
  Text,
  TextProps,
} from "react-native";

import { useTheme } from "../theme/useTheme";

export function ThemedText({
  children,
  style,
  ...props
}: TextProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Text
      {...props}
      style={[
        styles.text,
        {
          color: c.text,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
  },
});