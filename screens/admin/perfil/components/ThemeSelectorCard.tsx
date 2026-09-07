// screens/admin/perfil/components/ThemeSelectorCard.tsx

import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ThemedText } from "@/components/ThemedText";
import { themes } from "@/theme/themes";
import type { ThemeName } from "@/theme/types";
import { useTheme } from "@/theme/useTheme";
import { Check } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import { useResponsive } from "../../../../hooks/useResponsive";

const label = (name: ThemeName) =>
  name === "light"
    ? "Claro"
    : name === "dark"
      ? "Oscuro"
      : name === "premium"
        ? "Premium"
        : String(name);

export const ThemeSelectorCard = () => {
  const { theme, setTheme } = useTheme();
  const { isDesktop } = useResponsive();
  const names = Object.keys(themes) as ThemeName[];

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText style={styles.title}>Apariencia</ThemedText>
          <ThemedText style={{ color: theme.colors.textSecondary }}>
            Selecciona el tema del sistema.
          </ThemedText>
        </View>

        <Badge label={label(theme.name as ThemeName)} variant="info" />
      </View>

      <View style={[styles.grid, !isDesktop && styles.gridMobile]}>
        {names.map((name) => {
          const active = theme.name === name;
          const preview = themes[name].colors;

          return (
            <Pressable
              key={name}
              onPress={() => setTheme(name)}
              style={({ pressed }) => [
                styles.option,
                {
                  borderColor: active ? theme.colors.primary : theme.colors.border,
                  backgroundColor: theme.colors.backgroundSecondary,
                  transform: [{ scale: pressed ? 0.985 : 1 }],
                },
                !isDesktop && styles.optionMobile,
              ]}
            >
              <View
                style={[
                  styles.preview,
                  { backgroundColor: preview.background },
                ]}
              >
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: preview.card,
                      borderColor: preview.border,
                    },
                  ]}
                />
              </View>

              <View style={styles.footer}>
                <ThemedText
                  style={{
                    fontWeight: "700",
                    color: active ? theme.colors.primary : theme.colors.text,
                  }}
                >
                  {label(name)}
                </ThemedText>

                {active && (
                  <View
                    style={[
                      styles.check,
                      { backgroundColor: theme.colors.primary },
                    ]}
                  >
                    <Check size={12} color={theme.colors.primaryForeground} />
                  </View>
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    gap: 14,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  headerText: {
    flex: 1,
    minWidth: 220,
    gap: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "900",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridMobile: {
    flexDirection: "column",
    flexWrap: "nowrap",
  },
  option: {
    flexGrow: 1,
    minWidth: 180,
    overflow: "hidden",
    borderWidth: 1.5,
    borderRadius: 13,
  },
  optionMobile: {
    flexGrow: 0,
    minWidth: 0,
    width: "100%",
  },
  preview: {
    height: 80,
    padding: 10,
    borderTopLeftRadius: 11,
    borderTopRightRadius: 11,
    overflow: "hidden",
  },
  previewCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
  },
  footer: {
    minHeight: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
});
