// screens/admin/perfil/components/mobile/PerfilMobileOverlay.tsx
//
// Overlay full-screen que vive DENTRO del árbol de React (no usa el Modal
// nativo de RN). Es requisito para que el wipe circular del ThemeContext
// (que también vive en el árbol, zIndex 9999) pueda cubrirlo al cambiar
// de tema — igual que ocurre hoy en web.
//
// Uso: SOLO para secciones que cambian de tema desde dentro (hoy:
// Apariencia y Tema). Las demás secciones usan el Modal nativo vía
// PerfilMobileSectionModal.

import { X } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableAnimated } from "@/components/ui/PressableAnimated";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";

type Props = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function PerfilMobileOverlay({
  visible,
  title,
  onClose,
  children,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={styles.root}>
      {/* Backdrop — cubre toda la pantalla */}
      <Pressable
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Cerrar sección"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: c.overlay }]}
      />

      {/* Panel — flex:1 dentro del root absolute-fill */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: c.modal,
            paddingTop: insets.top,
          },
        ]}
      >
        <View style={[styles.header, { borderBottomColor: c.divider }]}>
          <ThemedText
            numberOfLines={1}
            ellipsizeMode="tail"
            style={styles.title}
          >
            {title}
          </ThemedText>

          <PressableAnimated
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            style={[
              styles.closeBtn,
              {
                backgroundColor: c.backgroundSecondary,
                borderColor: c.border,
              },
            ]}
          >
            <X size={18} color={c.text} strokeWidth={2.5} />
          </PressableAnimated>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 20) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  panel: {
    flex: 1,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flex: 1,
  },
  body: {
    padding: 16,
    gap: 14,
  },
});

export default PerfilMobileOverlay;
