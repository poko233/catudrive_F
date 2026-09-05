import React, { useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { Piso, Asiento } from "../types/pasajes.types";
import { AsientoButton } from "./AsientoButton";
import { AnimatedBlock } from "@/components/ui/AnimatedBlock";
import PressableAnimated from "@/components/ui/PressableAnimated";

interface Props {
  pisos: Piso[];
  asientosSeleccionados: Asiento[];
  onToggleSeleccion: (asiento: Asiento) => void;
}

export function BusMap({
  pisos,
  asientosSeleccionados,
  onToggleSeleccion,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [pisoActivo, setPisoActivo] = useState(pisos[0]?.id ?? 1);

  const pisoActual = pisos.find((p) => p.id === pisoActivo) ?? pisos[0];

  const renderFilas = () => {
    if (!pisoActual) return null;
    const filas = new Map<number, Asiento[]>();
    pisoActual.asientos.forEach((asiento) => {
      const fila = asiento.fila;
      if (!filas.has(fila)) filas.set(fila, []);
      filas.get(fila)!.push(asiento);
    });
    const filasOrdenadas = Array.from(filas.keys()).sort((a, b) => a - b);

    return filasOrdenadas.map((filaNum) => {
      const asientos = filas.get(filaNum)!;
      return (
        <View key={filaNum} style={styles.fila}>
          {asientos.map((asiento) => {
            const seleccionado = asientosSeleccionados.some(
              (a) => a.id === asiento.id,
            );
            return (
              <AsientoButton
                key={asiento.id}
                asiento={asiento}
                seleccionado={seleccionado}
                onPress={onToggleSeleccion}
              />
            );
          })}
        </View>
      );
    });
  };

  return (
    <AnimatedBlock preset="fadeIn">
      <View
        style={[
          styles.container,
          { backgroundColor: c.backgroundSecondary, borderColor: c.border },
        ]}
      >
        {pisos.length > 1 && (
          <View style={styles.pisoSelector}>
            {pisos.map((piso) => (
              <PressableAnimated
                key={piso.id}
                onPress={() => setPisoActivo(piso.id)}
                style={[
                  styles.pisoButton,
                  pisoActivo === piso.id && { backgroundColor: c.primary },
                ]}
              >
                <Text
                  style={{
                    color:
                      pisoActivo === piso.id ? c.primaryForeground : c.text,
                  }}
                >
                  {piso.nombre}
                </Text>
              </PressableAnimated>
            ))}
          </View>
        )}

        {/* Leyenda */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendBox,
                {
                  backgroundColor: c.backgroundSecondary,
                  borderColor: c.border,
                },
              ]}
            />
            <Text style={{ color: c.textSecondary, fontSize: 11 }}>Libre</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: c.primary }]} />
            <Text style={{ color: c.textSecondary, fontSize: 11 }}>
              Seleccionado
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendBox,
                { backgroundColor: c.backgroundTertiary },
              ]}
            />
            <Text style={{ color: c.textSecondary, fontSize: 11 }}>
              Ocupado
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendBox, { backgroundColor: c.info }]} />
            <Text style={{ color: c.textSecondary, fontSize: 11 }}>
              Conductor
            </Text>
          </View>
        </View>

        {/* Asientos centrados */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.busBody}>{renderFilas()}</View>
        </ScrollView>
      </View>
    </AnimatedBlock>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  pisoSelector: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  pisoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
  },
  busBody: {
    gap: 4,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
});
