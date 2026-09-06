import React from "react";
import { StyleSheet, View, Pressable, TextInput } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { User, ArrowUpDown, Ban } from "lucide-react-native";
import type { Piso, Asiento, TipoCelda } from "../types/vehiculo.types";

type Props = {
  piso: Piso;
  onCellPress: (fila: number, columna: number) => void;
  onCellLongPress?: (fila: number, columna: number) => void;
  onCellNumberChange?: (
    fila: number,
    columna: number,
    numero: number | null,
  ) => void;
  editable?: boolean;
  cellSize?: number;
};

export function CellGrid({
  piso,
  onCellPress,
  onCellLongPress,
  onCellNumberChange,
  editable = true,
  cellSize = 44,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const getCellStyle = (tipo: TipoCelda) => {
    switch (tipo) {
      case "pasajero":
        return {
          backgroundColor: c.primarySubtle,
          borderColor: c.primary,
          color: c.primary,
        };
      case "conductor":
        return {
          backgroundColor: c.info,
          borderColor: c.info,
          color: c.infoForeground,
        };
      case "escaleras":
        return {
          backgroundColor: c.warning,
          borderColor: c.warning,
          color: c.warningForeground,
        };
      case "no_disponible":
        return {
          backgroundColor: c.muted,
          borderColor: c.muted,
          color: c.textMuted,
        };
      case "pasillo":
      default:
        return {
          backgroundColor: "transparent",
          borderColor: c.border,
          color: c.textSecondary,
        };
    }
  };

  const renderCellContent = (asiento: Asiento) => {
    const style = getCellStyle(asiento.tipo_celda);
    const iconSize = Math.round(cellSize * 0.45);

    switch (asiento.tipo_celda) {
      case "pasajero":
        return (
          <TextInput
            style={[
              styles.numberInput,
              {
                color: style.color,
                fontSize: Math.round(cellSize * 0.32),
                width: cellSize * 0.7,
                height: cellSize * 0.7,
              },
            ]}
            value={asiento.numero_asiento?.toString() ?? ""}
            onChangeText={(text) => {
              const parsed = parseInt(text, 10);
              const nuevoNumero = Number.isNaN(parsed) ? null : parsed;
              onCellNumberChange?.(asiento.fila, asiento.columna, nuevoNumero);
            }}
            keyboardType="numeric"
            maxLength={3}
            textAlign="center"
            editable={editable}
            selectTextOnFocus
          />
        );
      case "conductor":
        return <User size={iconSize} color={style.color} strokeWidth={2} />;
      case "escaleras":
        return (
          <ArrowUpDown size={iconSize} color={style.color} strokeWidth={2} />
        );
      case "no_disponible":
        return <Ban size={iconSize} color={style.color} strokeWidth={2} />;
      case "pasillo":
      default:
        return null;
    }
  };

  return (
    <View style={styles.grid}>
      {Array.from({ length: piso.filas }, (_, fila) => (
        <View key={fila} style={styles.row}>
          {Array.from({ length: piso.columnas }, (_, col) => {
            const asiento = piso.asientos.find(
              (a) => a.fila === fila + 1 && a.columna === col + 1,
            );
            if (!asiento)
              return (
                <View key={col} style={{ width: cellSize, height: cellSize }} />
              );
            const style = getCellStyle(asiento.tipo_celda);
            return (
              <Pressable
                key={`${fila}-${col}`}
                onPress={() => editable && onCellPress(fila + 1, col + 1)}
                onLongPress={() =>
                  editable && onCellLongPress?.(fila + 1, col + 1)
                }
                style={({ pressed }) => [
                  styles.cell,
                  {
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: style.backgroundColor,
                    borderColor: style.borderColor,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                {renderCellContent(asiento)}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: 4 },
  row: { flexDirection: "row", gap: 4 },
  cell: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  numberInput: {
    textAlign: "center",
    fontWeight: "900",
    padding: 0,
    margin: 0,
  },
});
