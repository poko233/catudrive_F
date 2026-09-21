// screens/admin/arqueo/components/MovimientosAgrupados.tsx

import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ban, Printer } from "lucide-react-native";
import Visibility from "@/components/Visibility";
import { Table, TableColumn } from "@/components/Table";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import type { Egreso, Ingreso } from "../types/arqueo.types";
import { num } from "../types/arqueo.types";

type Mov = Ingreso | Egreso;

interface Grupo {
  clave: string;
  titulo: string;
  subtitulo: string;
  items: Mov[];
  totalValido: number;
  count: number;
}

function agrupar(items: Mov[]): Grupo[] {
  const map = new Map<string, Grupo>();
  for (const m of items) {
    const codigo = m.tipo_transaccion?.codigo ?? `TIPO_${m.id_tipo_transaccion}`;
    const nombre = m.tipo_transaccion?.transaccion ?? `Tipo #${m.id_tipo_transaccion}`;
    const clave = codigo;
    let g = map.get(clave);
    if (!g) {
      g = { clave, titulo: codigo, subtitulo: nombre, items: [], totalValido: 0, count: 0 };
      map.set(clave, g);
    }
    g.items.push(m);
    g.count += 1;
    if (m.estado !== "Anulado") g.totalValido += num(m.monto);
  }
  return [...map.values()].sort((a, b) => b.totalValido - a.totalValido);
}

const movColumns: TableColumn[] = [
  { key: "nro", label: "#", flex: 0.4, align: "center" },
  { key: "fecha", label: "Fecha", flex: 1.1, align: "center" },
  { key: "detalle", label: "Detalle", flex: 2, align: "center" },
  { key: "pago", label: "Pago", flex: 0.8, align: "center" },
  { key: "monto", label: "Monto", flex: 0.8, align: "center" },
  { key: "estado", label: "Estado", flex: 0.8, align: "center" },
  { key: "acciones", label: "Acciones", flex: 0.9, align: "center" },
];

function fechaCorta(iso: string): string {
  if (!iso) return "-";
  // "2026-09-19T08:15:00+00:00" -> "19/09 08:15"
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace("T", " ");
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

export function MovimientosAgrupados({
  titulo,
  items,
  emptyText,
  onPrint,
  printingId,
  onAnular,
  anulandoId,
}: {
  titulo: string;
  items: Mov[];
  emptyText: string;
  onPrint?: (id: number) => void;
  printingId?: number | null;
  onAnular?: (id: number) => void;
  anulandoId?: number | null;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  const grupos = useMemo(() => agrupar(items), [items]);
  const totalGeneral = useMemo(
    () => items.filter((m) => m.estado !== "Anulado").reduce((s, m) => s + num(m.monto), 0),
    [items],
  );

  if (items.length === 0) {
    return (
      <Card>
        <ThemedText style={styles.sectionTitle}>{titulo}</ThemedText>
        <ThemedText style={[styles.empty, { color: c.textSecondary }]}>{emptyText}</ThemedText>
      </Card>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <ThemedText style={styles.sectionTitle}>{titulo}</ThemedText>
        <Badge label={`${items.length} movs • Bs. ${totalGeneral.toFixed(2)}`} variant="muted" />
      </View>

      {grupos.map((g) => (
        <Card key={g.clave} style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <View style={styles.groupTitle}>
              <ThemedText style={styles.groupCodigo}>{g.titulo}</ThemedText>
              <ThemedText numberOfLines={1} style={[styles.groupNombre, { color: c.textSecondary }]}>
                {g.subtitulo}
              </ThemedText>
            </View>
            <View style={styles.groupBadges}>
              <Badge label={`${g.count} regs`} variant="info" />
              <Badge label={`Bs. ${g.totalValido.toFixed(2)}`} variant={g.totalValido >= 0 ? "success" : "warning"} />
            </View>
          </View>

          <View style={styles.tableContainer}>
            <Table<Mov>
              data={g.items}
              columns={movColumns}
              loading={false}
              scrollEnabled={false}
              columnGap={1}
              horizontalPadding={5}
              cellPaddingHorizontal={2}
              keyExtractor={(item) => String(item.id)}
              emptyMessage="Sin movimientos."
              renderCell={(item, column, rowIndex) => {
                switch (column.key) {
                  case "nro":
                    return <Text style={[styles.cellText, { color: c.textMuted }]}>{rowIndex + 1}</Text>;
                  case "fecha":
                    return (
                      <Text numberOfLines={1} style={[styles.cellText, { color: c.textSecondary }]}>
                        {fechaCorta(item.fecha_registro)}
                      </Text>
                    );
                  case "detalle":
                    return (
                      <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.cellBold, { color: c.text }]}>
                        {item.detalle || "-"}
                      </Text>
                    );
                  case "pago":
                    return <Badge label={item.tipo_pago} variant="info" />;
                  case "monto":
                    return <Text style={[styles.cellMonto, { color: c.primary }]}>Bs. {num(item.monto).toFixed(2)}</Text>;
                  case "estado":
                    return <Badge label={item.estado} variant={item.estado === "Valido" ? "success" : "muted"} />;
                  case "acciones":
                    return (
                      <View style={styles.accionesCell}>
                        {onPrint ? (
                          <Visibility action="Ver">
                            <IconButton
                              icon={Printer}
                              size="sm"
                              variant="secondary"
                              accessibilityLabel={`Imprimir comprobante #${item.id}`}
                              loading={printingId === item.id}
                              disabled={printingId === item.id}
                              onPress={() => onPrint(item.id)}
                            />
                          </Visibility>
                        ) : null}
                        {onAnular && item.estado === "Valido" ? (
                          <Visibility action="Editar">
                            <IconButton
                              icon={Ban}
                              size="sm"
                              variant="secondary"
                              accessibilityLabel={`Anular #${item.id}`}
                              loading={anulandoId === item.id}
                              disabled={anulandoId === item.id}
                              onPress={() => onAnular(item.id)}
                            />
                          </Visibility>
                        ) : null}
                      </View>
                    );
                  default:
                    return null;
                }
              }}
            />
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800" },
  empty: { fontSize: 13, marginTop: 6 },
  groupCard: { gap: 0 },
  groupHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 },
  groupTitle: { flex: 1, minWidth: 180 },
  groupCodigo: { fontSize: 14, fontWeight: "900" },
  groupNombre: { fontSize: 12, marginTop: 2 },
  groupBadges: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  tableContainer: { width: "100%" },
  cellText: { fontSize: 12, textAlign: "center" },
  cellBold: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  cellMonto: { fontSize: 12, fontWeight: "800", textAlign: "center" },
  accionesCell: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "nowrap" },
});

export default MovimientosAgrupados;
