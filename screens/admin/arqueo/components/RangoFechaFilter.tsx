// screens/admin/arqueo/components/RangoFechaFilter.tsx

import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { DatePicker, DatePickerResult } from "@/components/ui/DatePicker";
import { useTheme } from "@/theme/useTheme";

/*
|--------------------------------------------------------------------------
| FILTRO DE RANGO DE FECHAS (patrón reportes)
|--------------------------------------------------------------------------
|
| Botón con el rango + limpiar + DatePicker mode="range".
| Formato del backend: YYYY-MM-DD.
|
*/

function fechaLabel(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function RangoFechaFilter({
  desde,
  hasta,
  onApply,
  onClear,
  titulo = "Rango de fechas",
}: {
  desde: string;
  hasta: string;
  onApply: (desde: string, hasta: string) => void;
  onClear: () => void;
  titulo?: string;
}) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [visible, setVisible] = useState(false);

  const aplicar = (result: DatePickerResult) => {
    if (result.type !== "range") return;
    onApply(result.start, result.end);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.main}>
          <Button
            title={
              desde && hasta
                ? `${fechaLabel(desde)} → ${fechaLabel(hasta)}`
                : "Seleccionar rango de fechas"
            }
            variant="secondary"
            onPress={() => setVisible(true)}
          />
        </View>
        {desde && hasta ? (
          <Button title="Limpiar" variant="ghost" onPress={onClear} />
        ) : null}
      </View>
      {desde && hasta ? (
        <ThemedText style={[styles.helper, { color: c.textMuted }]}>
          Filtrando aperturas entre esas fechas.
        </ThemedText>
      ) : null}

      <DatePicker
        visible={visible}
        mode="range"
        title={titulo}
        initialRange={desde && hasta ? { start: desde, end: hasta } : undefined}
        onClose={() => setVisible(false)}
        onApply={aplicar}
      />
    </View>
  );
}

export function RangoAperturaFilter(props: {
  desde: string;
  hasta: string;
  onApply: (desde: string, hasta: string) => void;
  onClear: () => void;
}) {
  return <RangoFechaFilter {...props} titulo="Apertura (rango)" />;
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  main: { flex: 1 },
  helper: { fontSize: 12 },
});
