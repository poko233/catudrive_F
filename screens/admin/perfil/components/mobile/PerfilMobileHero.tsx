// screens/admin/perfil/components/mobile/PerfilMobileHero.tsx

import { Image } from "expo-image";
import { CheckCircle2, KeyRound, LogOut } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

import { Badge } from "@/components/ui/Badge";
import { PressableAnimated } from "@/components/ui/PressableAnimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";

type Props = {
  nombreCompleto: string;
  roles: string[];
  foto: string | null;
  tieneArqueo: boolean;
  arqueoId: number | null;
  syncingArqueo: boolean;
  loggingOut: boolean;
  onArqueoPress: () => void;
  onPasswordPress: () => void;
  onLogoutPress: () => void;
};

const initialsOf = (name: string): string => {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const result = parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  return result || "U";
};

const capitalize = (value: string): string =>
  value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);

export function PerfilMobileHero({
  nombreCompleto,
  roles,
  foto,
  tieneArqueo,
  arqueoId,
  syncingArqueo,
  loggingOut,
  onArqueoPress,
  onPasswordPress,
  onLogoutPress,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const primaryRole = roles[0] ? capitalize(roles[0]) : null;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.backgroundSecondary,
          borderColor: `${c.primary}33`,
        },
      ]}
    >
      {/*
        Glow radial real (SVG). Suave, sin bordes visibles.
        Centrado horizontal, anclado arriba (detrás del avatar + nombre).
      */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="heroGlow"
              cx="50%"
              cy="14%"
              r="60%"
              fx="50%"
              fy="14%"
            >
              <Stop offset="0%" stopColor={c.primary} stopOpacity={0.22} />
              <Stop offset="40%" stopColor={c.primary} stopOpacity={0.07} />
              <Stop offset="100%" stopColor={c.primary} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#heroGlow)" />
        </Svg>
      </View>

      <View style={styles.body}>
        {/* ── Fila superior: avatar + identidad ─────────────── */}
        <View style={styles.topRow}>
          <View style={styles.avatarWrap}>
            <View
              style={[
                styles.avatar,
                {
                  backgroundColor: c.primarySubtle,
                  borderColor: c.primary,
                },
              ]}
            >
              {foto ? (
                <Image
                  source={{ uri: foto }}
                  style={styles.avatarImg}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                />
              ) : (
                <ThemedText
                  style={[styles.avatarInitials, { color: c.primary }]}
                >
                  {initialsOf(nombreCompleto)}
                </ThemedText>
              )}
            </View>

            <Pressable
              onPress={onArqueoPress}
              disabled={syncingArqueo}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={
                syncingArqueo
                  ? "Verificando arqueo"
                  : tieneArqueo
                    ? "Ver arqueo abierto"
                    : "Abrir arqueo"
              }
              style={[
                styles.onlineDot,
                {
                  borderColor: c.backgroundSecondary,
                  backgroundColor: tieneArqueo ? c.success : c.destructive,
                  opacity: syncingArqueo ? 0.5 : 1,
                },
              ]}
            />
          </View>

          <View style={styles.identity}>
            <View style={styles.nameRow}>
              <ThemedText
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.name}
              >
                {nombreCompleto}
              </ThemedText>

              {primaryRole ? (
                <Badge
                  label={primaryRole}
                  variant="info"
                  appearance="soft"
                  size="sm"
                />
              ) : (
                <Badge
                  label="Sin rol"
                  variant="muted"
                  appearance="soft"
                  size="sm"
                />
              )}
            </View>

            <View style={styles.statusRow}>
              <CheckCircle2
                size={14}
                color={tieneArqueo ? c.success : c.textMuted}
                strokeWidth={2}
              />
              <ThemedText
                numberOfLines={1}
                ellipsizeMode="tail"
                style={[
                  styles.statusText,
                  { color: tieneArqueo ? c.success : c.textMuted },
                ]}
              >
                {tieneArqueo
                  ? `Caja abierta #${arqueoId ?? "—"}`
                  : "Sin arqueo abierto"}
              </ThemedText>
              <ThemedText style={[styles.statusDot, { color: c.textMuted }]}>
                •
              </ThemedText>
              <ThemedText
                onPress={onArqueoPress}
                style={[styles.statusLink, { color: c.textSecondary }]}
              >
                Detalles
              </ThemedText>
            </View>
          </View>
        </View>

        {/* ── Fila inferior: acciones rápidas centradas ─────── */}
        <View style={[styles.actionsRow, { borderTopColor: `${c.text}0F` }]}>
          <PressableAnimated
            onPress={onPasswordPress}
            accessibilityRole="button"
            accessibilityLabel="Cambiar contraseña"
            style={[
              styles.actionBtn,
              {
                backgroundColor: c.backgroundTertiary,
                borderColor: `${c.primary}55`,
              },
            ]}
          >
            <KeyRound size={16} color={c.primary} strokeWidth={2} />
            <ThemedText style={[styles.actionLabel, { color: c.primary }]}>
              Contraseña
            </ThemedText>
          </PressableAnimated>

          <PressableAnimated
            onPress={onLogoutPress}
            disabled={loggingOut}
            accessibilityRole="button"
            accessibilityLabel="Cerrar sesión"
            style={[
              styles.actionBtn,
              {
                backgroundColor: c.backgroundTertiary,
                borderColor: c.border,
                opacity: loggingOut ? 0.6 : 1,
              },
            ]}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color={c.destructive} />
            ) : (
              <>
                <LogOut size={16} color={c.destructive} strokeWidth={2} />
                <ThemedText style={[styles.actionLabel, { color: c.text }]}>
                  Cerrar sesión
                </ThemedText>
              </>
            )}
          </PressableAnimated>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  body: {
    padding: 16,
    gap: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2.5,
  },
  identity: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    flexShrink: 1,
  },
  statusDot: {
    fontSize: 11,
  },
  statusLink: {
    fontSize: 11,
    textDecorationLine: "underline",
  },

  /* ── acciones ─────────────────────────────────────────── */
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center", // ← centra el grupo
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    maxWidth: 180, // ← parejos y centrados, no infinitos
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
});

export default PerfilMobileHero;
