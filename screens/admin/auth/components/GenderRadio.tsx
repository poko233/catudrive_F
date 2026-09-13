import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../theme/useTheme";

interface GenderRadioProps {
  value: string;
  onChange: (val: "MASCULINO" | "FEMENINO") => void;
  error?: string;
}

export const GenderRadio: React.FC<GenderRadioProps> = ({
  value,
  onChange,
  error,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.option,
            {
              backgroundColor:
                value === "MASCULINO" ? c.primary : c.backgroundSecondary,
              borderColor: value === "MASCULINO" ? c.primary : c.border,
            },
          ]}
          onPress={() => onChange("MASCULINO")}
          activeOpacity={0.7}
        >
          {/* Podríamos usar ícono, pero con texto basta */}
          <Text
            style={{
              color: value === "MASCULINO" ? c.primaryForeground : c.text,
              fontWeight: "600",
            }}
          >
            MASCULINO
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.option,
            {
              backgroundColor:
                value === "FEMENINO" ? c.primary : c.backgroundSecondary,
              borderColor: value === "FEMENINO" ? c.primary : c.border,
            },
          ]}
          onPress={() => onChange("FEMENINO")}
          activeOpacity={0.7}
        >
          <Text
            style={{
              color: value === "FEMENINO" ? c.primaryForeground : c.text,
              fontWeight: "600",
            }}
          >
            FEMENINO
          </Text>
        </TouchableOpacity>
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: c.destructive }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  row: { flexDirection: "row", gap: 12 },
  option: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { fontSize: 12, marginTop: 4, marginLeft: 4 },
});
