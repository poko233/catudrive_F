import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Asiento } from "../types/pasajes.types";
import { PressableAnimated } from "@/components/ui/PressableAnimated";
import { haptics } from "@/animations/haptics";
import { User, ArrowUpDown, Ban } from "lucide-react-native";

interface Props {
  asiento: Asiento;
  seleccionado: boolean;
  onPress: (asiento: Asiento) => void;
}

export function AsientoButton({ asiento, seleccionado, onPress }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const esLibre =
    asiento.tipo_celda === "pasajero" && asiento.estado_ocupacion === "libre";

  const handlePress = () => {
    if (!esLibre) return;
    haptics.selection();
    onPress(asiento);
  };

  const config = (() => {
    switch (asiento.tipo_celda) {
      case "pasajero":
        return {
          bg: esLibre ? c.backgroundSecondary : c.backgroundTertiary,
          border: esLibre ? c.border : c.border,
          icon: null,
          showNumber: true,
        };
      case "conductor":
        return {
          bg: c.info,
          border: c.info,
          icon: <User size={16} color={c.infoForeground} />,
          showNumber: false,
        };
      case "escaleras":
        return {
          bg: c.warning,
          border: c.warning,
          icon: <ArrowUpDown size={16} color={c.warningForeground} />,
          showNumber: false,
        };
      case "no_disponible":
        return {
          bg: c.backgroundTertiary,
          border: c.border,
          icon: <Ban size={16} color={c.textMuted} />,
          showNumber: false,
        };
      case "pasillo":
      default:
        return {
          bg: "transparent",
          border: "transparent",
          icon: null,
          showNumber: false,
        };
    }
  })();

  if (asiento.tipo_celda === "pasillo") {
    return <View style={styles.pasillo} />;
  }

  const backgroundColor = seleccionado ? c.primary : config.bg;
  const borderColor = seleccionado ? c.primary : config.border;

  return (
    <PressableAnimated
      disabled={!esLibre}
      onPress={handlePress}
      scaleTo={0.92}
      style={[styles.asiento, { backgroundColor, borderColor }]}
      accessibilityLabel={`Asiento ${asiento.numero_asiento ?? asiento.id}`}
    >
      {config.icon ? config.icon : null}
      {config.showNumber && (
        <Text
          style={{
            color: seleccionado ? c.primaryForeground : c.text,
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
