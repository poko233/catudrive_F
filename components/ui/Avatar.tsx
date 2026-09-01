import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface AvatarProps {
  initials: string;
  color: string;
  size?: number;
}

export function Avatar({ initials, color, size = 40 }: AvatarProps) {
  const fontSize = Math.round(size * 0.35);

  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color + "28",
          borderColor: color + "55",
        },
      ]}
    >
      <Text style={[styles.text, { color, fontSize }]}>{initials}</Text>
    </View>
  );
}

function styles_factory() {
  return StyleSheet.create({
    circle: {
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
    },
    text: {
      fontWeight: "800",
      letterSpacing: 0.5,
    },
  });
}

const styles = styles_factory();
