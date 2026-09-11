import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { FloorSelector } from "./FloorSelector";
import { CellToolbox } from "./CellToolbox";
import { CellGrid } from "./CellGrid";
import type { Piso, TipoCelda } from "../types/vehiculo.types";
import { siguienteNumeroPasajero } from "../utils/gridMapper";

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
  const { isDesktop, width } = useResponsive();
  const [herramienta, setHerramienta] = useState<TipoCelda>("pasajero");

  const piso = pisos[activePisoIndex] ?? null;

  /*
  |--------------------------------------------------------------------------
  | TAMAÑO DE CELDA RESPONSIVE (SOLO MÓVIL/TABLET)
  |--------------------------------------------------------------------------
  |
  | En web siempre 44. En móvil la celda se encoge para que
  | todas las columnas quepan sin recorte horizontal.
  |
  */

  const columnasActivas = Math.max(1, piso?.columnas ?? 1);
  const cellSize = isDesktop
    ? 44
    : Math.max(
        28,
        Math.min(44, Math.floor((width - 120) / columnasActivas)),
      );

  const handleCellPress = useCallback(
    (fila: number, columna: number) => {
      if (!piso) return;

      const nuevoTipo = herramienta;

      /*
      |--------------------------------------------------------------------------
      | CELDA FALTANTE → SE CREA AL TOCAR
      |--------------------------------------------------------------------------
      |
      | Si la posición no tiene entrada (datos viejos/incompletos),
      | se agrega como celda nueva en vez de ignorar el tap.
      | Así la grilla nunca queda con huecos muertos.
      |
      */

      const asientoExistente = piso.asientos.find(
        (a) => a.fila === fila && a.columna === columna,
      );

      if (!asientoExistente) {
        const nuevoAsiento = {
          fila,
          columna,
          tipo_celda: nuevoTipo,
          numero_asiento:
            nuevoTipo === "pasajero"
              ? siguienteNumeroPasajero(piso)
              : null,
          estado: "Activo" as const,
        };

        const nuevosPisos = [...pisos];
        nuevosPisos[activePisoIndex] = {
          ...piso,
          asientos: [...piso.asientos, nuevoAsiento],
        };
        onChangePisos(nuevosPisos);
        return;
      }

      let nuevosAsientos = piso.asientos.map((a) =>
        a.fila === fila && a.columna === columna
          ? {
              ...a,
              tipo_celda: nuevoTipo,
              estado: "Activo" as const,
              // Si estamos cambiando a pasajero y antes no era pasajero,
              // asignamos automáticamente el siguiente número.
              numero_asiento:
                nuevoTipo === "pasajero" && a.tipo_celda !== "pasajero"
                  ? siguienteNumeroPasajero({
                      ...piso,
                      asientos: piso.asientos.map((asiento) =>
                        asiento.fila === fila && asiento.columna === columna
                          ? { ...asiento, tipo_celda: nuevoTipo }
                          : asiento,
                      ),
                    })
                  : a.numero_asiento,
            }
          : a,
      );

      const pisoActualizado: Piso = {
        ...piso,
        asientos: nuevosAsientos,
      };

      const nuevosPisos = [...pisos];
      nuevosPisos[activePisoIndex] = pisoActualizado;
      onChangePisos(nuevosPisos);
    },
    [pisos, activePisoIndex, piso, herramienta, onChangePisos],
  );

  const handleCellNumberChange = useCallback(
    (fila: number, columna: number, numero: number | null) => {
      if (!piso) return;

      const pisoActualizado: Piso = {
        ...piso,
        asientos: piso.asientos.map((a) =>
          a.fila === fila && a.columna === columna
            ? { ...a, numero_asiento: numero }
            : a,
        ),
      };

      const nuevosPisos = [...pisos];
      nuevosPisos[activePisoIndex] = pisoActualizado;
      onChangePisos(nuevosPisos);
    },
    [pisos, activePisoIndex, piso, onChangePisos],
  );

  const handleCellLongPress = useCallback(() => {
    // Reservado para funcionalidad futura
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
          cellSize={cellSize}
          onCellPress={handleCellPress}
          onCellLongPress={handleCellLongPress}
          onCellNumberChange={handleCellNumberChange}
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
