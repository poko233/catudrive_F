import React from "react";
import { StyleSheet, View } from "react-native";
import { ArrowUpDown, Ban, Check, User } from "lucide-react-native";
import { ThemedText } from "@/components/ThemedText";
import { AnimatedBlock } from "@/components/ui/AnimatedBlock";
import { PressableAnimated } from "@/components/ui/PressableAnimated";
import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import type { TipoCelda } from "../types/vehiculo.types";

/*
|--------------------------------------------------------------------------
| ETIQUETAS CORTAS
|--------------------------------------------------------------------------
|
| Las tarjetas muestran el nombre directo (Pasajero, Conductor…),
| no "Asiento Pasajero". TIPOS_CELDA no se toca: es compartido.
|
*/

export const SEAT_TOOL_SHORT_LABEL: Record<TipoCelda, string> = {
  pasajero: "Pasajero",
  conductor: "Conductor",
  escaleras: "Escaleras",
  no_disponible: "Indisponible",
  pasillo: "Pasillo",
};

/*
|--------------------------------------------------------------------------
| MINIATURA DE CELDA
|--------------------------------------------------------------------------
|
| Réplica exacta del aspecto de CellGrid a tamaño chip, para
| que el usuario vea lo que va a pintar antes de tocar la grilla.
| Usa los mismos iconos que CellGrid (User, ArrowUpDown, Ban).
|
*/

function ToolPreview({ tool }: { tool: TipoCelda }) {
  const { theme } = useTheme();
  const c = theme.colors;

  let backgroundColor = "transparent";
  let borderColor = c.border;
  let content: React.ReactNode = null;

  switch (tool) {
    case "pasajero":
      backgroundColor = c.primarySubtle;
      borderColor = c.primary;
      content = (
        <ThemedText style={[styles.previewNumber, { color: c.primary }]}>
          1
        </ThemedText>
      );
      break;
    case "conductor":
      backgroundColor = c.info;
      borderColor = c.info;
      content = <User size={15} color={c.infoForeground} strokeWidth={2} />;
      break;
    case "escaleras":
      backgroundColor = c.warning;
      borderColor = c.warning;
      content = (
        <ArrowUpDown size={15} color={c.warningForeground} strokeWidth={2} />
      );
      break;
    case "no_disponible":
      backgroundColor = c.muted;
      borderColor = c.muted;
      content = <Ban size={15} color={c.textMuted} strokeWidth={2} />;
      break;
    case "pasillo":
    default:
      backgroundColor = "transparent";
      borderColor = c.border;
      content = null;
      break;
  }

  return (
    <View
      style={[
        styles.preview,
        {
          backgroundColor,
          borderColor,
          borderStyle: tool === "pasillo" ? "dashed" : "solid",
        },
      ]}
    >
      {content}
    </View>
  );
}

type Props = {
  tool: TipoCelda;
  active: boolean;
  onPress: () => void;
  /** Posición en la fila, para el stagger (respeta index * 60). */
  index?: number;
};

/*
|--------------------------------------------------------------------------
| TARJETA DE HERRAMIENTA (CHIP COMPACTO)
|--------------------------------------------------------------------------
|
| Chip horizontal: miniatura + etiqueta corta. Ocupa poco alto
| para que la grilla quede visible mientras se pinta.
| Estilos 100% estáticos (sin callbacks de Pressable): render
| determinista en Android nativo.
|
*/

export function SeatToolCard({ tool, active, onPress, index = 0 }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isDesktop } = useResponsive();

  const idleFill = isDesktop ? c.backgroundSecondary : c.backgroundTertiary;

  return (
    <AnimatedBlock preset="scaleIn" delay={index * 60} style={styles.slot}>
      <PressableAnimated
        onPress={onPress}
        accessibilityLabel={`Herramienta ${SEAT_TOOL_SHORT_LABEL[tool]}`}
        accessibilityRole="button"
        style={[
          styles.card,
          {
            backgroundColor: active ? c.primarySubtle : idleFill,
            borderColor: active ? c.primary : c.border,
            borderWidth: active ? 2 : 1,
          },
        ]}
      >
        <ToolPreview tool={tool} />

        <ThemedText
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.cardLabel}
        >
          {SEAT_TOOL_SHORT_LABEL[tool]}
        </ThemedText>

        {active ? (
          <View style={[styles.check, { backgroundColor: c.primary }]}>
            <Check size={10} strokeWidth={3.5} color={c.primaryForeground} />
          </View>
        ) : null}
      </PressableAnimated>
    </AnimatedBlock>
  );
}

const styles = StyleSheet.create({
  slot: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 128,
    minWidth: 118,
  },
  card: {
    flex: 1,
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  preview: {
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  previewNumber: {
    fontSize: 14,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  cardLabel: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "700",
  },
  check: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
});
