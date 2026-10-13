// screens/admin/perfil/components/mobile/PerfilMobileShell.tsx
//
// Orquestador visual del perfil mobile:
//   - ScrollView con el contenido (hero + banner + menú + footer)
//   - Secciones abiertas como hijos HERMANOS del ScrollView
//
// Regla:
//   - Secciones que NO cambian tema → Modal nativo (PerfilMobileSectionModal)
//   - Sección Apariencia y Tema → Overlay in-tree (PerfilMobileOverlay)
//     porque el wipe circular del ThemeContext vive en el árbol y solo
//     puede cubrir overlays que también viven en el árbol.

import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useTheme } from "@/theme/useTheme";

import { InformacionPersonal } from "../InformacionPersonal";
import { QrProfileCard } from "../QrProfileCard";
import { ThemeSelectorCard } from "../ThemeSelectorCard";

import { PerfilMobileOverlay } from "./PerfilMobileOverlay";
import { PerfilMobileSectionModal } from "./PerfilMobileSectionModal";
import {
  PerfilMobileScreen,
  type PerfilMobileSection,
} from "./PerfilMobileScreen";

export function PerfilMobileShell() {
  const { theme } = useTheme();

  const [section, setSection] = useState<PerfilMobileSection>(null);

  const close = () => setSection(null);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          <PerfilMobileScreen onOpenSection={setSection} />
        </View>
      </ScrollView>

      {/* ── INFORMACIÓN PERSONAL — Modal nativo ───────────── */}
      <PerfilMobileSectionModal
        visible={section === "info"}
        title="Información Personal"
        onClose={close}
      >
        <InformacionPersonal />
      </PerfilMobileSectionModal>

      {/* ── CREDENCIAL DIGITAL QR — Modal nativo ──────────── */}
      <PerfilMobileSectionModal
        visible={section === "qr"}
        title="Credencial Digital QR"
        onClose={close}
      >
        <QrProfileCard />
      </PerfilMobileSectionModal>

      {/* ── APARIENCIA Y TEMA — Overlay in-tree ───────────── */}
      <PerfilMobileOverlay
        visible={section === "theme"}
        title="Apariencia y Tema"
        onClose={close}
      >
        <ThemeSelectorCard />
      </PerfilMobileOverlay>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingTop: 14,
    paddingBottom: 24,
    paddingHorizontal: 14,
  },
  inner: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
  },
});

export default PerfilMobileShell;
