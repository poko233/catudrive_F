// screens/admin/arqueo/components/ViajesChoferSection.tsx

import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Printer } from "lucide-react-native";
import Toast from "react-native-toast-message";
import Visibility from "@/components/Visibility";
import { Table, TableColumn } from "@/components/Table";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme } from "@/theme/useTheme";
import { compartirPdfVenta } from "@/screens/user/pasajes/utils/compartirPdfVenta";
import type { Arqueo, ViajeArqueo, ViajeArqueoAsiento } from "../types/arqueo.types";
import { esDesgloseChofer, etiquetaAsiento, num } from "../types/arqueo.types";

/*
|--------------------------------------------------------------------------
| DESGLOSE POR VIAJE (rol Chofer, GET /api/arqueos/{id})
|--------------------------------------------------------------------------
|
| Solo se renderiza si la clave viajes existe (chofer).
| - viajes_totales: agregados globales.
| - Por viaje: ruta, vehículo, conteo de asientos,
|   mis asientos (re-desglose de arqueo.ingresos) y lo
|   vendido por otros (INFORMATIVO: no suma al arqueo,
|   es lo que la oficina le debe pagar al chofer).
| - Cada asiento permite reimprimir su ticket
|   (/api/pasajes/ventas/{id}/pdf vía compartirPdfVenta).
|
*/

const asientoColumns: TableColumn[] = [
  { key: "nro", label: "#", flex: 0.4, align: "center" },
  { key: "asiento", label: "Asiento", flex: 1, align: "center" },
  { key: "monto", label: "Monto", flex: 0.8, align: "center" },
  { key: "fecha", label: "Fecha", flex: 1, align: "center" },
  { key: "venta", label: "Venta", flex: 0.7, align: "center" },
  { key: "acciones", label: "Ticket", flex: 0.6, align: "center" },
];

function fechaCorta(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 16).replace("T", " ");
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function estadoViajeVariant(estado: string): "success" | "info" | "muted" | "destructive" {
  if (estado === "Vendiendo") return "success";
  if (estado === "En curso") return "info";
  if (estado === "Cancelado") return "destructive";
  return "muted";
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.mini, { backgroundColor: c.backgroundSecondary }]}>
      <ThemedText style={[styles.miniLabel, { color: c.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={[styles.miniValue, { color: c.text }]}>{value}</ThemedText>
    </View>
  );
}

function AsientosTable({
  asientos,
  printingId,
  onPrint,
}: {
  asientos: ViajeArqueoAsiento[];
  printingId: number | null;
  onPrint: (idVenta: number) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.tableContainer}>
      <Table<ViajeArqueoAsiento>
        data={asientos}
        columns={asientoColumns}
        loading={false}
        scrollEnabled={false}
        columnGap={1}
        horizontalPadding={5}
        cellPaddingHorizontal={2}
        keyExtractor={(item) => String(item.id_detalle_venta)}
        emptyMessage="Sin asientos."
        renderCell={(item, column, rowIndex) => {
          switch (column.key) {
            case "nro":
              return <Text style={[styles.cellText, { color: c.textMuted }]}>{rowIndex + 1}</Text>;
            case "asiento":
              return (
                <Text numberOfLines={1} style={[styles.cellBold, { color: c.text }]}>
                  {etiquetaAsiento(item)}
                </Text>
              );
            case "monto":
              return <Text style={[styles.cellMonto, { color: c.primary }]}>Bs. {num(item.monto).toFixed(2)}</Text>;
            case "fecha":
              return (
                <Text numberOfLines={1} style={[styles.cellText, { color: c.textSecondary }]}>
                  {fechaCorta(item.fecha)}
                </Text>
              );
            case "venta":
              return <Text style={[styles.cellText, { color: c.textSecondary }]}>#{item.id_venta}</Text>;
            case "acciones":
              return (
                <View style={styles.accionesCell}>
                  <Visibility action="Ver">
                    <IconButton
                      icon={Printer}
                      size="sm"
                      variant="secondary"
                      accessibilityLabel={`Reimprimir ticket venta #${item.id_venta}`}
                      loading={printingId === item.id_venta}
                      disabled={printingId === item.id_venta}
                      onPress={() => onPrint(item.id_venta)}
                    />
                  </Visibility>
                </View>
              );
            default:
              return null;
          }
        }}
      />
    </View>
  );
}

function ViajeCard({
  viaje,
  printingId,
  onPrint,
}: {
  viaje: ViajeArqueo;
  printingId: number | null;
  onPrint: (idVenta: number) => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Card>
      <View style={styles.viajeHeader}>
        <View style={styles.viajeTitle}>
          <ThemedText style={styles.viajeRuta}>
            {viaje.ruta ? `${viaje.ruta.origen} → ${viaje.ruta.destino}` : `Viaje #${viaje.id_viaje}`}
          </ThemedText>
          <ThemedText style={[styles.viajeSub, { color: c.textSecondary }]}>
            Viaje #{viaje.id_viaje}
            {viaje.vehiculo ? ` • ${viaje.vehiculo.placa} (${viaje.vehiculo.tipo})` : ""}
          </ThemedText>
        </View>
        <Badge label={viaje.estado_viaje} variant={estadoViajeVariant(viaje.estado_viaje)} />
      </View>

      <View style={styles.miniGrid}>
        <MiniStat label="Asientos" value={viaje.asientos.totales} />
        <MiniStat label="Míos" value={viaje.asientos.vendidos_por_mi} />
        <MiniStat label="Otros" value={viaje.asientos.vendidos_por_otros} />
        <MiniStat label="Pendientes" value={viaje.asientos.pendientes} />
        <MiniStat label="Mi total" value={`Bs. ${num(viaje.mis_ingresos.total).toFixed(2)}`} />
      </View>

      <ThemedText style={styles.groupTitle}>Mis asientos vendidos ({viaje.mis_ingresos.asientos.length})</ThemedText>
      <AsientosTable asientos={viaje.mis_ingresos.asientos} printingId={printingId} onPrint={onPrint} />

      {viaje.ingresos_de_otros.length > 0 ? (
        <View style={styles.otrosWrap}>
          <ThemedText style={styles.groupTitle}>Vendido por otros (oficina te debe)</ThemedText>
          {viaje.ingresos_de_otros.map((otro) => (
            <View key={otro.id_user} style={styles.otroBloque}>
              <View style={styles.otroHeader}>
                <ThemedText style={styles.otroNombre} numberOfLines={1}>
                  {otro.nombre_completo || otro.usuario} ({otro.usuario})
                </ThemedText>
                <Badge label={`Bs. ${num(otro.total).toFixed(2)}`} variant="warning" />
              </View>
              <AsientosTable asientos={otro.asientos} printingId={printingId} onPrint={onPrint} />
            </View>
          ))}
        </View>
      ) : (
        <ThemedText style={[styles.hint, { color: c.textMuted }]}>Nadie más vendió de este viaje.</ThemedText>
      )}
    </Card>
  );
}

export function ViajesChoferSection({ arqueo }: { arqueo: Arqueo }) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [printingId, setPrintingId] = useState<number | null>(null);

  // Clave ausente = no es chofer: no se renderiza nada.
  if (!esDesgloseChofer(arqueo)) return null;

  const viajes = arqueo.viajes ?? [];
  const totales = arqueo.viajes_totales;

  const handlePrintTicket = async (idVenta: number) => {
    setPrintingId(idVenta);
    try {
      await compartirPdfVenta(idVenta);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "No se pudo abrir el ticket",
        text2: e instanceof Error ? e.message : "Intenta nuevamente.",
      });
    } finally {
      setPrintingId(null);
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <ThemedText style={styles.sectionTitle}>Mis viajes (chofer)</ThemedText>
        <Badge label={`${viajes.length} viaje(s)`} variant="info" />
      </View>

      {viajes.length === 0 ? (
        <Card>
          <EmptyState title="Sin viajes activos" subtitle="No tienes viajes activos hoy." />
        </Card>
      ) : (
        <>
          {totales ? (
            <Card>
              <ThemedText style={styles.sectionTitle}>Totales de mis viajes</ThemedText>
              <View style={styles.miniGrid}>
                <MiniStat label="Asientos" value={totales.asientos_totales} />
                <MiniStat label="Míos" value={totales.vendidos_por_mi} />
                <MiniStat label="Otros" value={totales.vendidos_por_otros} />
                <MiniStat label="Pendientes" value={totales.pendientes} />
                <MiniStat label="Mi ingreso" value={`Bs. ${num(totales.ingreso_por_mi).toFixed(2)}`} />
                <MiniStat label="Oficina me debe" value={`Bs. ${num(totales.ingreso_por_otros).toFixed(2)}`} />
              </View>
              <ThemedText style={[styles.hint, { color: c.textMuted }]}>
                Lo vendido por otros es informativo: no suma a tu arqueo. Se cobra físicamente en oficina.
              </ThemedText>
            </Card>
          ) : null}

          {viajes.map((viaje) => (
            <ViajeCard key={viaje.id_viaje} viaje={viaje} printingId={printingId} onPrint={(id) => void handlePrintTicket(id)} />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: "800" },
  miniGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 10 },
  mini: { flex: 1, minWidth: 100, padding: 10, borderRadius: 10, alignItems: "center" },
  miniLabel: { fontSize: 11 },
  miniValue: { fontSize: 14, fontWeight: "800", marginTop: 4 },
  viajeHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 4 },
  viajeTitle: { flex: 1, minWidth: 0 },
  viajeRuta: { fontSize: 15, fontWeight: "900" },
  viajeSub: { fontSize: 12, marginTop: 2 },
  groupTitle: { fontSize: 13, fontWeight: "800", marginTop: 12, marginBottom: 8 },
  otrosWrap: { gap: 10, marginTop: 4 },
  otroBloque: { gap: 8 },
  otroHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  otroNombre: { flex: 1, fontSize: 13, fontWeight: "700" },
  tableContainer: { width: "100%" },
  cellText: { fontSize: 12, textAlign: "center" },
  cellBold: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  cellMonto: { fontSize: 12, fontWeight: "800", textAlign: "center" },
  accionesCell: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  hint: { fontSize: 12, marginTop: 8, lineHeight: 17 },
});

export default ViajesChoferSection;
