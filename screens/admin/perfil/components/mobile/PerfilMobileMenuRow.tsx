// screens/admin/perfil/components/mobile/PerfilMobileMenuRow.tsx

import type { LucideIcon } from "lucide-react-native";
import { ChevronRight } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AnimatedBlock } from "@/components/ui/AnimatedBlock";
import { PressableAnimated } from "@/components/ui/PressableAnimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";

type Props = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  /** Elemento a la derecha (badge / chip / status). */
  trailing?: ReactNode;
  /** Elemento junto al título (dot / contador). */
  titleSuffix?: ReactNode;
  onPress: () => void;
  delay?: number;
};

export function PerfilMobileMenuRow({
  icon: Icon,
  title,
  subtitle,
  trailing,
  titleSuffix,
  onPress,
  delay = 0,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <AnimatedBlock preset="slideInUp" delay={delay}>
      <PressableAnimated
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={[
          styles.row,
          {
            backgroundColor: c.backgroundSecondary,
            borderColor: c.border,
          },
        ]}
      >
        <View style={styles.left}>
          <View
            style={[
              styles.iconBox,
              {
                backgroundColor: c.backgroundTertiary,
                borderColor: c.border,
              },
            ]}
          >
            <Icon size={20} color={c.primary} strokeWidth={2} />
          </View>

          <View style={styles.textCol}>
            <View style={styles.titleRow}>
              <ThemedText
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.title}
              >
                {title}
              </ThemedText>
              {titleSuffix}
            </View>
            <ThemedText
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[styles.subtitle, { color: c.textSecondary }]}
            >
              {subtitle}
            </ThemedText>
          </View>
        </View>

        <View style={styles.right}>
          {trailing}
          <ChevronRight size={18} color={c.textMuted} strokeWidth={2.5} />
        </View>
      </PressableAnimated>
    </AnimatedBlock>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 11,
  },
  right: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
});

export default PerfilMobileMenuRow;
