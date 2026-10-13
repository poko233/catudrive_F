// screens/user/pasajes/components/ViajeFiltrosModal.tsx

import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useTheme } from "@/theme/useTheme";
import type { ViajeEstado } from "../types/pasajes.types";

/*
|--------------------------------------------------------------------------
| FILTROS DE VIAJES (espejo de EncomiendaFiltrosModal)
|--------------------------------------------------------------------------
|
| Reemplaza las tarjetas de filtro: icono filtro → modal con
| selector de estado + limpiar. Solo presentación; la
| lógica de filtrado sigue en la pantalla.
|
*/

export type FiltroEstadoViaje = "TODOS" | ViajeEstado;

const ESTADOS: FiltroEstadoViaje[] = [
  "TODOS",
  "Vendiendo",
  "En curso",
  "Finalizado",
  "Cancelado",
];

interface Props {
  visible: boolean;
  valor: FiltroEstadoViaje;
  onClose: () => void;
  onApply: (estado: FiltroEstadoViaje) => void;
  onClear: () => void;
}

export function ViajeFiltrosModal({
  visible,
  valor,
  onClose,
  onApply,
  onClear,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [estado, setEstado] = useState<FiltroEstadoViaje>(valor);

  useEffect(() => {
    if (visible) setEstado(valor);
  }, [visible, valor]);

  return (
    <Modal
      visible={visible}
      title="Filtrar viajes"
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button title="Limpiar" variant="ghost" onPress={onClear} />

          <Button
            title="Aplicar"
            onPress={() => {
              onApply(estado);
              onClose();
            }}
          />
        </View>
      }
    >
      <View style={styles.body}>
        <Select<FiltroEstadoViaje>
          label="Estado del viaje"
          value={estado}
          options={ESTADOS.map((e) => ({
            label: e === "TODOS" ? "Todos" : e,
            value: e,
          }))}
          onValueChange={setEstado}
          modalTitle="Estado del viaje"
        />

        <ThemedText style={[styles.helper, { color: c.textSecondary }]}>
          Filtra la lista por el estado actual del viaje.
        </ThemedText>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
  },

  helper: {
    fontSize: 12,
    lineHeight: 17,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
});
