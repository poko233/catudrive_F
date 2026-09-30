import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Asiento } from "../types/pasajes.types";
import { PressableAnimated } from "@/components/ui/PressableAnimated";
import { haptics } from "@/animations/haptics";
import { User, ArrowUpDown, Ban, Lock } from "lucide-react-native";

interface Props {
  asiento: Asiento;
  seleccionado: boolean;
  onPress: (asiento: Asiento) => void;
  onOcupado?: (asiento: Asiento) => void;
  onReanudar?: (asiento: Asiento) => void;
  pisoNombre?: string | null;
  /**
   * Tamaño del botón (touch target). Default 40.
   * En móvil BusMap lo calcula (mínimo 44).
   */
  size?: number;
}

export function AsientoButton({
  asiento,
  seleccionado,
  onPress,
  onOcupado,
  onReanudar,
  pisoNombre,
  size = 40,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const esPasajero = asiento.tipo_celda === "pasajero";
  const estadoOcupacion = asiento.estado_ocupacion;
  const esLibre = esPasajero && estadoOcupacion === "libre";
  const esReservado = esPasajero && estadoOcupacion === "reservado";
  const esVendido = esPasajero && estadoOcupacion === "vendido";
  const esReanudable =
    esReservado && typeof asiento.id_venta === "number";

  const handlePress = () => {
    if (!esPasajero) return;
    if (esLibre) {
      haptics.selection();
      onPress(asiento);
      return;
    }
    haptics.error();
    if (esReanudable && onReanudar) {
      onReanudar(asiento);
      return;
    }
    onOcupado?.(asiento);
  };

  const iconChico = Math.round(size * 0.35);
  const iconGrande = Math.round(size * 0.4);
  const fontNumero = Math.round(size * 0.3);
  const fontCheck = Math.max(9, Math.round(size * 0.25));

  const config = (() => {
    if (esPasajero) {
      if (esReservado) {
        return {
          bg: c.warning,
          border: c.warning,
          fg: c.warningForeground,
          icon: <Lock size={iconChico} color={c.warningForeground} />,
          showNumber: true,
        };
      }
      if (esVendido) {
        return {
          bg: c.destructive,
          border: c.destructive,
          fg: c.destructiveForeground,
          icon: null,
          showNumber: true,
        };
      }
      return {
        bg: c.success,
        border: c.success,
        fg: c.successForeground,
        icon: null,
        showNumber: true,
      };
    }

    switch (asiento.tipo_celda) {
      case "conductor":
        return {
          bg: c.info,
          border: c.info,
          fg: c.infoForeground,
          icon: <User size={iconGrande} color={c.infoForeground} />,
          showNumber: false,
        };
      case "escaleras":
        return {
          bg: c.warning,
          border: c.warning,
          fg: c.warningForeground,
          icon: (
            <ArrowUpDown size={iconGrande} color={c.warningForeground} />
          ),
          showNumber: false,
        };
      case "no_disponible":
        return {
          bg: c.backgroundTertiary,
          border: c.border,
          fg: c.textMuted,
          icon: <Ban size={iconGrande} color={c.textMuted} />,
          showNumber: false,
        };
      case "pasillo":
      default:
        return {
          bg: "transparent",
          border: "transparent",
          fg: c.text,
          icon: null,
          showNumber: false,
        };
    }
  })();

  if (asiento.tipo_celda === "pasillo") {
    // Espacio vacío invisible (ocupa su lugar, sin caja ni borde).
    return (
      <View
        style={[styles.pasillo, { width: size, height: size }]}
      />
    );
  }

  const backgroundColor = seleccionado ? c.primary : config.bg;
  const borderColor = seleccionado ? c.primary : config.border;

  return (
    <PressableAnimated
      disabled={!esPasajero}
      onPress={handlePress}
      scaleTo={0.92}
      style={[
        styles.asiento,
        { width: size, height: size, backgroundColor, borderColor },
      ]}
      accessibilityLabel={
        pisoNombre
          ? `Asiento ${asiento.numero_asiento ?? asiento.id}, ${pisoNombre}`
          : `Asiento ${asiento.numero_asiento ?? asiento.id}`
      }
    >
      {config.icon ? config.icon : null}
      {config.showNumber && (
        <Text
          style={{
            color: seleccionado ? c.primaryForeground : config.fg,
            fontWeight: "800",
            fontSize: fontNumero,
          }}
        >
          {asiento.numero_asiento ?? ""}
        </Text>
      )}
      {seleccionado && (
        <Text
          style={{ color: c.primaryForeground, fontSize: fontCheck }}
        >
          ✓
        </Text>
      )}
    </PressableAnimated>
  );
}

const styles = StyleSheet.create({
  asiento: {
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
  },
  pasillo: {
    margin: 2,
  },
});