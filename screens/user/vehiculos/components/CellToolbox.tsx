import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { TIPOS_CELDA } from "../utils/gridMapper";
import type { TipoCelda } from "../types/vehiculo.types";
import { SeatToolCard } from "./SeatToolCard";

type Props = {
  selected: TipoCelda;
  onSelect: (tipo: TipoCelda) => void;
};

/*
|--------------------------------------------------------------------------
| CAJA DE HERRAMIENTAS (LEYENDA SELECCIONABLE)
|--------------------------------------------------------------------------
|
| Fila compacta de chips sobre la grilla: cada chip es a la vez
| leyenda (muestra el aspecto real de la celda) y selector.
| Sin descripciones: ocupa poco alto para no tapar la grilla.
| Estilos 100% estáticos (sin callbacks de Pressable): render
| determinista en Android nativo.
|
*/

export function CellToolbox({ selected, onSelect }: Props) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.title}>Herramienta</ThemedText>

      <View style={styles.cards}>
        {TIPOS_CELDA.map((tool, index) => (
          <SeatToolCard
            key={tool.type}
            tool={tool.type}
            active={selected === tool.type}
            onPress={() => onSelect(tool.type)}
            index={index}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
  },
  cards: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
