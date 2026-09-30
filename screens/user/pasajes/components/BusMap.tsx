import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/theme/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { Piso, Asiento } from "../types/pasajes.types";
import { AsientoButton } from "./AsientoButton";
import { AnimatedBlock } from "@/components/ui/AnimatedBlock";
import PressableAnimated from "@/components/ui/PressableAnimated";

/*
|--------------------------------------------------------------------------
| TAMAÑO DE ASIENTO EN MÓVIL
|--------------------------------------------------------------------------
|
| Pequeños (ej. 4x4): escalan al máximo ancho disponible.
| Grandes (ej. 15x15): mantienen el mínimo funcional con
| scroll horizontal + vertical del paso.
|
*/

const TAM_MINIMO = 44;
const TAM_MAXIMO = 72;
const TAM_DESKTOP = 40;

interface Props {
  pisos: Piso[];
  asientosSeleccionados: Asiento[];
  onToggleSeleccion: (asiento: Asiento) => void;
  onOcupado?: (asiento: Asiento) => void;
  onReanudar?: (asiento: Asiento) => void;
}

export function BusMap({
  pisos,
  asientosSeleccionados,
  onToggleSeleccion,
  onOcupado,
  onReanudar,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { isMobile, width } = useResponsive();
  const [pisoActivo, setPisoActivo] = useState(pisos[0]?.id ?? 1);

  const pisoActual = pisos.find((p) => p.id === pisoActivo) ?? pisos[0];

  const tamAsiento = useMemo(() => {
    if (!isMobile) return TAM_DESKTOP;

    const columnas =
      pisoActual?.asientos.reduce(
        (max, a) => Math.max(max, a.columna),
        1,
      ) ?? 1;

    const disponible = width - 100;

    return Math.max(
      TAM_MINIMO,
      Math.min(TAM_MAXIMO, Math.floor(disponible / columnas)),
    );
  }, [isMobile, width, pisoActual]);

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
      // Defensa: columnas siempre en orden posicional aunque
      // los datos lleguen desordenados del backend.
      const asientos = filas
        .get(filaNum)!
        .slice()
        .sort((a, b) => a.columna - b.columna);
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
                onOcupado={onOcupado}
                onReanudar={onReanudar}
                pisoNombre={pisoActual?.nombre ?? null}
                size={tamAsiento}
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
                  backgroundColor: c.success,
                  borderColor: c.success,
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
                { backgroundColor: c.destructive, borderColor: c.destructive },
              ]}
            />
            <Text style={{ color: c.textSecondary, fontSize: 11 }}>
              Ocupado
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendBox,
                { backgroundColor: c.warning, borderColor: c.warning },
              ]}
            />
            <Text style={{ color: c.textSecondary, fontSize: 11 }}>
              Reservado
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
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
