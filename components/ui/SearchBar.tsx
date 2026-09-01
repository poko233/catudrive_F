// components/ui/SearchBar.tsx

import { Ionicons } from "@expo/vector-icons";

import React from "react";

import {
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";

import { useTheme } from "../../theme/useTheme";

interface SearchBarProps {
  value: string;

  onChangeText: (
    text: string,
  ) => void;

  placeholder?: string;
}

export function SearchBar({
  value,
  onChangeText,
  placeholder = "Buscar...",
}: SearchBarProps) {
  const { theme } =
    useTheme();

  const c =
    theme.colors;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor:
            c.backgroundSecondary,

          borderColor:
            c.border,
        },
      ]}
    >
      <Ionicons
        name="search-outline"
        size={18}
        color={
          c.textMuted
        }
      />

      <TextInput
        value={value}
        onChangeText={
          onChangeText
        }
        placeholder={
          placeholder
        }
        placeholderTextColor={
          c.textMuted
        }
        selectionColor={
          c.primary
        }
        style={[
          styles.input,

          {
            color:
              c.text,
          },

          Platform.OS === "web"
            ? ({
                outlineStyle:
                  "none",

                outlineWidth:
                  0,

                outlineColor:
                  "transparent",
              } as any)
            : null,
        ]}
        accessibilityLabel={
          placeholder
        }
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      width:
        "100%",

      minHeight:
        44,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,

      borderWidth:
        1,

      borderRadius:
        12,

      paddingHorizontal:
        14,

      paddingVertical:
        10,
    },

    input: {
      flex:
        1,

      minWidth:
        0,

      padding:
        0,

      margin:
        0,

      borderWidth:
        0,

      backgroundColor:
        "transparent",

      fontSize:
        14,
    },
  });

export default SearchBar;