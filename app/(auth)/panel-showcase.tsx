// app/(app)/panel-showcase.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotiView, AnimatePresence } from "moti";
import { useTheme } from "../../theme/useTheme";
import { PressableAnimated } from "../../components/ui/PressableAnimated";
import { AnimatedBlock } from "../../components/ui/AnimatedBlock";
import {
  haptics,
  TIMING_MEDIUM,
  slideInRight,
  overlayFade,
} from "../../animations";

const { width } = Dimensions.get("window");

// Definimos la salida del panel localmente con timing (usamos as const para type)
const slideOutRight = {
  exit: { opacity: 0, translateX: width },
  exitTransition: { type: "timing" as const, duration: TIMING_MEDIUM },
};

export default function PanelShowcaseScreen() {
  const { theme } = useTheme();
  const c = theme.colors;
  const [isOpen, setIsOpen] = useState(false);

  const openPanel = () => {
    setIsOpen(true);
    haptics.medium();
  };

  const closePanel = () => {
    setIsOpen(false);
    haptics.light();
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Text style={[styles.title, { color: c.text }]}>Panel Lateral Demo</Text>
      <Text style={[styles.subtitle, { color: c.textSecondary }]}>
        Toca el botón para abrir el panel. La animación usa TIMING_MEDIUM (
        {TIMING_MEDIUM}ms).
      </Text>

      <PressableAnimated
        onPress={openPanel}
        style={[styles.button, { backgroundColor: c.primary }]}
      >
        <Text style={styles.buttonText}>Abrir Panel</Text>
      </PressableAnimated>

      {/* Overlay y Panel en absoluto, sin Modal para permitir salidas */}
      <AnimatePresence>
        {isOpen && (
          <MotiView
            key="overlay"
            from={overlayFade.from}
            animate={overlayFade.animate}
            exit={overlayFade.exit}
            transition={{ type: "timing" as const, duration: TIMING_MEDIUM }} // ✅ as const
            exitTransition={overlayFade.exitTransition}
            style={[styles.overlay, { backgroundColor: c.overlay }]}
          >
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={closePanel}
              activeOpacity={0}
            />
          </MotiView>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <MotiView
            key="panel"
            from={slideInRight.from}
            animate={slideInRight.animate}
            exit={slideOutRight.exit}
            transition={{ type: "timing" as const, duration: TIMING_MEDIUM }} // ✅ as const
            exitTransition={slideOutRight.exitTransition}
            style={[
              styles.panel,
              { backgroundColor: c.card, borderLeftColor: c.border },
            ]}
          >
            <View style={styles.panelHeader}>
              <Text style={[styles.panelTitle, { color: c.text }]}>
                Panel Lateral
              </Text>
              <PressableAnimated
                onPress={closePanel}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={c.text} />
              </PressableAnimated>
            </View>
            <Text style={[styles.panelBody, { color: c.textSecondary }]}>
              Este panel se abre con timing de {TIMING_MEDIUM}ms y se cierra
              deslizándose hacia la derecha. Los contenidos entran desde las
              cuatro direcciones.
            </Text>
            <View style={[styles.panelContent, { borderTopColor: c.border }]}>
              {/* Primero desde arriba (top → down) */}
              <AnimatedBlock
                preset="slideInDown"
                delay={100}
                duration={TIMING_MEDIUM}
              >
                <Text style={{ color: c.text }}>
                  Contenido 1 (desde arriba)
                </Text>
              </AnimatedBlock>
              {/* Segundo desde izquierda */}
              <AnimatedBlock
                preset="slideInLeft"
                delay={200}
                duration={TIMING_MEDIUM}
              >
                <Text style={{ color: c.text }}>
                  Contenido 2 (desde izquierda)
                </Text>
              </AnimatedBlock>
              {/* Tercero desde derecha */}
              <AnimatedBlock
                preset="slideInRight"
                delay={300}
                duration={TIMING_MEDIUM}
              >
                <Text style={{ color: c.text }}>
                  Contenido 3 (desde derecha)
                </Text>
              </AnimatedBlock>
              {/* Cuarto desde abajo (bottom → up) */}
              <AnimatedBlock
                preset="slideInUp"
                delay={400}
                duration={TIMING_MEDIUM}
              >
                <Text style={{ color: c.text }}>Contenido 4 (desde abajo)</Text>
              </AnimatedBlock>
            </View>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  panel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: width * 0.8,
    maxWidth: 400,
    borderLeftWidth: 1,
    padding: 20,
    zIndex: 101,
  },
  panelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  panelBody: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
  },
  panelContent: {
    borderTopWidth: 1,
    paddingTop: 20,
    gap: 12,
  },
});
