import { useTheme } from "@/theme/useTheme";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

export type TooltipPosition =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

interface TooltipProps {
  message: string;
  icon?: React.ReactNode;
  position?: TooltipPosition;
}

/**
 * @description
 * Componente interactivo que despliega un cuadro de información contextual (Tooltip) flotante.
 * Renderiza un icono (o un "?" por defecto) que, al ser presionado o recibir hover, revela el texto.
 * * ============================================================================
 * ⚠️ CONSIDERACIONES CRÍTICAS DE ARQUITECTURA VISUAL Y RENDERIZADO ⚠️
 * ============================================================================
 * * 1. CONTEXTO DE APILAMIENTO (Stacking Context / Z-Index / Elevation):
 * El Tooltip gestiona su propia prioridad visual (`zIndex: 9999`, `elevation: 10`), PERO esta
 * prioridad es relativa a su contenedor padre. Para que el Tooltip se superponga sobre
 * componentes hermanos (ej. un Header u otras tarjetas), el CONTENEDOR PADRE del Tooltip
 * debe tener estrictamente un `zIndex` y `elevation` mayor que el de sus hermanos.
 * * 2. DESBORDAMIENTO EN CONTENEDORES CON SCROLL (ScrollViews / FlatLists):
 * - Si el Tooltip se ubica dentro de un ScrollView, el ScrollView y el contenedor de su
 * contenido (`contentContainerStyle`) DEBEN tener la propiedad `overflow: "visible"`.
 * - COMPORTAMIENTO EN ANDROID: El motor de renderizado de Android aplica un recorte (clipping)
 * muy estricto en los bordes de los ScrollViews, ignorando en ocasiones el `overflow: "visible"`.
 * Si el Tooltip se recorta cerca del límite superior/inferior, la solución técnica es
 * cambiar la `position` del Tooltip (ej. de "top" a "bottom" o "right").
 * * 3. ALINEACIÓN CON TEXTO U OTROS ELEMENTOS (Flexbox):
 * Para situar el Tooltip exactamente al lado de un texto (ej. Título de sección + Tooltip):
 * - El contenedor de ambos debe usar `flexDirection: "row"`.
 * - NO usar `justifyContent: "space-between"` si solo hay dos elementos, ya que los separará
 * a los extremos de la pantalla.
 * - USAR `justifyContent: "flex-start"` y añadir separación mediante la propiedad `gap: 6`
 * (o márgenes).
 * * @example
 * ```tsx
 * // Implementación correcta junto a un título dentro de un ScrollView
 * <View style={{
 * flexDirection: "row",
 * alignItems: "center",
 * justifyContent: "flex-start", // Agrupa los elementos a la izquierda
 * gap: 8,
 * zIndex: 999,      // Crucial para superposición en iOS
 * elevation: 10     // Crucial para superposición en Android
 * }}>
 * <Text style={styles.titulo}>Elementos Activos</Text>
 * <Tooltip
 * message="Descripción detallada de la métrica o elemento."
 * position="right" // Evita cortes en el borde izquierdo
 * />
 * </View>
 * ```
 * * @param {string} message - El texto informativo que se mostrará dentro del cuadro flotante.
 * @param {React.ReactNode} [icon] - (Opcional) Icono personalizado. Si se omite, renderiza "?".
 * @param {TooltipPosition} [position="top"] - (Opcional) Dirección de despliegue.
 *   Valores posibles: "top", "bottom", "left", "right", "top-left", "top-right", "bottom-left", "bottom-right".
 */
export function Tooltip({ message, icon, position = "top" }: TooltipProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [visible, setVisible] = useState(false);

  // Determina la posición exacta con un espaciado reducido (8px) para aparecer justo al lado
  const getPositionStyles = (): ViewStyle => {
    switch (position) {
      case "top":
        return { bottom: "100%", marginBottom: 8, alignSelf: "center" };
      case "top-left":
        return { bottom: "100%", marginBottom: 8, alignSelf: "flex-end" };
      case "top-right":
        return { bottom: "100%", marginBottom: 8, alignSelf: "flex-start" };
      case "bottom":
        return { top: "100%", marginTop: 8, alignSelf: "center" };
      case "bottom-left":
        return { top: "100%", marginTop: 8, alignSelf: "flex-end" };
      case "bottom-right":
        return { top: "100%", marginTop: 8, alignSelf: "flex-start" };
      case "left":
        return { right: "100%", marginRight: 8, alignSelf: "center" };
      case "right":
        return { left: "100%", marginLeft: 8, alignSelf: "center" };
      default:
        return { bottom: "100%", marginBottom: 8, alignSelf: "center" };
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          zIndex: visible ? 9999 : 1,
          elevation: visible ? 10 : 0, // Añadido para compatibilidad de capas en Android
        },
      ]}
    >
      <Pressable
        onHoverIn={() => setVisible(true)}
        onHoverOut={() => setVisible(false)}
        onPress={() => setVisible(!visible)}
        style={[
          styles.iconWrapper,
          !icon && { backgroundColor: c.primarySubtle },
        ]}
      >
        {icon ? (
          icon
        ) : (
          <Text style={[styles.iconText, { color: c.primary }]}>?</Text>
        )}
      </Pressable>

      {visible && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(100)}
          pointerEvents="none"
          style={[
            styles.tooltip,
            getPositionStyles(),
            {
              backgroundColor: c.popover,
              borderColor: c.border,
              borderWidth: 1,
              shadowColor: c.shadow,
            },
          ]}
        >
          <Text style={[styles.tooltipText, { color: c.text }]}>{message}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconWrapper: {
    minWidth: 20,
    minHeight: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  iconText: {
    fontSize: 13,
    fontWeight: "800",
  },
  tooltip: {
    position: "absolute",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 220,
    elevation: 5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  tooltipText: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
    textAlign: "center",
  },
});
