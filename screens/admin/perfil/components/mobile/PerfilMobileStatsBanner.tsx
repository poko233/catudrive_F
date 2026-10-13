// screens/admin/perfil/components/mobile/PerfilMobileStatsBanner.tsx

import { LinearGradient } from "expo-linear-gradient";
import { ShieldCheck } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";

type Props = {
  /** Texto combinado CI + teléfono, ej: "CI 13099670 • Tel 345345345". */
  detail: string;
};

export function PerfilMobileStatsBanner({ detail }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: c.backgroundSecondary,
          borderColor: c.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconBox,
          {
            backgroundColor: `${c.primary}18`,
            borderColor: `${c.primary}33`,
          },
        ]}
      >
        <ShieldCheck size={18} color={c.primary} strokeWidth={2} />
      </View>

      <View style={styles.text}>
        <ThemedText style={styles.title} numberOfLines={1}>
          Estado de Verificación
        </ThemedText>
        <ThemedText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.detail, { color: c.textSecondary }]}
        >
          {detail}
        </ThemedText>
      </View>

      <Badge label="Activo" variant="success" appearance="soft" size="sm" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  text: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
  },
  detail: {
    fontSize: 10,
  },
});

export default PerfilMobileStatsBanner;
