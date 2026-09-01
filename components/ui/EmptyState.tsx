import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../theme/useTheme";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = "cube-outline",
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={48} color={c.textMuted} />
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, { color: c.textSecondary }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  action: {
    marginTop: 8,
  },
});
