import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../../../theme/useTheme";

interface RoleChipsProps {
  roles: { rol: string; id: number }[];
  selected: string[];
  onToggle: (roleName: string) => void;
  error?: string;
}

export const RoleChips: React.FC<RoleChipsProps> = ({
  roles = [],
  selected = [],
  onToggle,
  error,
}) => {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.container}>
      <View style={styles.chipsContainer}>
        {roles.map((r) => {
          const active = selected.includes(r.rol);
          return (
            <TouchableOpacity
              key={r.id}
              onPress={() => onToggle(r.rol)}
              activeOpacity={0.7}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? c.primary : c.backgroundSecondary,
                  borderColor: active ? c.primary : c.border,
                },
              ]}
            >
              <Text
                style={{
                  color: active ? c.primaryForeground : c.text,
                  fontWeight: "600",
                  fontSize: 13,
                }}
              >
                {r.rol}
              </Text>
            </TouchableOpacity>
          );
        })}
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
  container: {
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
});
