import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { FloorSelector } from "./FloorSelector";
import { CellToolbox } from "./CellToolbox";
import { CellGrid } from "./CellGrid";
import type { Piso, TipoCelda } from "../types/vehiculo.types";

type Props = {
  pisos: Piso[];
  onChangePisos: (pisos: Piso[]) => void;
  activePisoIndex: number;
  onActivePisoChange: (index: number) => void;
};

export function VehicleSeatBuilder({
  pisos,
  onChangePisos,
  activePisoIndex,
  onActivePisoChange,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [herramienta, setHerramienta] = useState<TipoCelda>("pasajero");

  const piso = pisos[activePisoIndex] ?? null;

  const handleCellPress = useCallback(
    (fila: number, columna: number) => {
      if (!piso) return;
      const actualizado = {
        ...piso,
        asientos: piso.asientos.map((a) =>
          a.fila === fila && a.columna === columna
            ? { ...a, tipo_celda: herramienta, estado: "Activo" as const }
            : a,
        ),
      };
      const nuevos = [...pisos];
      nuevos[activePisoIndex] = actualizado;
      onChangePisos(nuevos);
    },
    [pisos, activePisoIndex, piso, herramienta, onChangePisos],
  );

  const handleCellLongPress = useCallback(() => {
    // Reservado para edición manual de número de asiento
  }, []);

  if (!piso) {
    return (
      <View style={styles.empty}>
        <ThemedText style={{ color: c.textSecondary }}>
          No hay pisos definidos.
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CellToolbox selected={herramienta} onSelect={setHerramienta} />
      <FloorSelector
        pisos={pisos}
        activeIndex={activePisoIndex}
        onSelectFloor={onActivePisoChange}
      />
      <View style={styles.gridWrapper}>
        <CellGrid
          piso={piso}
          onCellPress={handleCellPress}
          onCellLongPress={handleCellLongPress}
          editable
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  empty: {
    padding: 20,
    alignItems: "center",
  },
  gridWrapper: {
    alignItems: "center",
    width: "100%",
  },
});
