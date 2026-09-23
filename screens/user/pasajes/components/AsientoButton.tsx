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
}

export function AsientoButton({
  asiento,
  seleccionado,
  onPress,
  onOcupado,
  onReanudar,
  pisoNombre,
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

  const config = (() => {
    if (esPasajero) {
      if (esReservado) {
        return {
          bg: c.warning,
          border: c.warning,
          fg: c.warningForeground,
          icon: <Lock size={14} color={c.warningForeground} />,
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
          icon: <User size={16} color={c.infoForeground} />,
          showNumber: false,
        };
      case "escaleras":
        return {
          bg: c.warning,
          border: c.warning,
          fg: c.warningForeground,
          icon: <ArrowUpDown size={16} color={c.warningForeground} />,
          showNumber: false,
        };
      case "no_disponible":
        return {
          bg: c.backgroundTertiary,
          border: c.border,
          fg: c.textMuted,
          icon: <Ban size={16} color={c.textMuted} />,
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
    return <View style={styles.pasillo} />;
  }

  const backgroundColor = seleccionado ? c.primary : config.bg;
  const borderColor = seleccionado ? c.primary : config.border;

  return (
    <PressableAnimated
      disabled={!esPasajero}
      onPress={handlePress}
      scaleTo={0.92}
      style={[styles.asiento, { backgroundColor, borderColor }]}
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
            fontSize: 12,
          }}
        >
          {asiento.numero_asiento ?? ""}
        </Text>
      )}
      {seleccionado && (
        <Text style={{ color: c.primaryForeground, fontSize: 10 }}>✓</Text>
      )}
    </PressableAnimated>
  );
}

const styles = StyleSheet.create({
  asiento: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
  },
  pasillo: {
    width: 40,
    height: 40,
    margin: 2,
  },
});