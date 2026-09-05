import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Search } from "lucide-react-native";
import { useTheme } from "@/theme/useTheme";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export function FiltroInput({
  value,
  onChangeText,
  placeholder = "Buscar...",
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.input, borderColor: c.inputBorder },
      ]}
    >
      <Search size={18} color={c.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.textMuted}
        style={[styles.input, { color: c.text }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    minWidth: 0,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },
});
