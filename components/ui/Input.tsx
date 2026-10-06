import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { useTheme } from "../../theme/useTheme";

interface InputProps extends Omit<TextInputProps, "style"> {
  label?: string;
  error?: string;
  helperText?: string;
  compact?: boolean;
}

export function Input({ label, error, helperText, compact = false, ...props }: InputProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);

  const borderColor = error
    ? c.destructive
    : focused
      ? c.primary
      : c.inputBorder;

  const shadowStyle = focused
    ? { shadowColor: c.inputFocusRing, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 4, elevation: 2 }
    : {};

  return (
    <View style={styles.wrapper}>
      {label ? (
        <Text style={[styles.label, compact && styles.labelCompact, { color: c.textSecondary }]}>{label}</Text>
      ) : null}
      <TextInput
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        placeholderTextColor={c.textMuted}
        style={[
          styles.input,
          compact && styles.inputCompact,
          {
            backgroundColor: c.input,
            borderColor,
            color: c.text,
          },
          shadowStyle,
        ]}
      />
      {error ? (
        <Text style={[styles.helperText, { color: c.destructive }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: c.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  labelCompact: { fontSize: 12 },
  input: {
    minHeight: 44,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputCompact: { minHeight: 38, paddingVertical: 7, paddingHorizontal: 11, fontSize: 13 },
  helperText: {
    fontSize: 12,
  },
});
