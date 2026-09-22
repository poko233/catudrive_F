import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { PackageSearch, UserRound } from "lucide-react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";

import type { Viaje } from "../types/pasajes.types";
import type { ViajeEncomiendasResponse } from "../types/viaje-encomiendas.types";
import { getEncomiendasViaje } from "../services/viaje-encomiendas.service";

interface Props {
  viaje: Viaje;
}

function estadoVariant(estado: string): "info" | "warning" | "success" | "destructive" | "muted" {
  switch (estado) {
    case "En origen": return "info";
    case "En tránsito": return "warning";
    case "En destino": return "info";
    case "Entregada": return "success";
    case "Anulada": return "destructive";
    default: return "muted";
  }
}

export function ViajeEncomiendasAction({ viaje }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<ViajeEncomiendasResponse | null>(null);

  const abrir = async () => {
    setVisible(true);
    setLoading(true);
    setError("");

    try {
      setData(await getEncomiendasViaje(viaje.id));
    } catch (err: any) {
      setError(err?.message || "No se pudieron cargar las encomiendas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IconButton
        icon={PackageSearch}
        variant="secondary"
        size="sm"
        onPress={() => void abrir()}
        accessibilityLabel={`Ver encomiendas del viaje ${viaje.origen} → ${viaje.destino}`}
      />

      <Modal
        visible={visible}
        title={`Encomiendas del viaje #${viaje.id}`}
        onClose={() => setVisible(false)}
        maxWidth={780}
        footer={
          <View style={styles.footer}>
            <Button title="Cerrar" variant="secondary" onPress={() => setVisible(false)} />
          </View>
        }
      >
        <View style={styles.content}>
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Ruta</Text>
              <Text style={[styles.summaryValue, { color: c.text }]}>
                {data?.viaje.origen ?? viaje.origen} → {data?.viaje.destino ?? viaje.destino}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Vehículo</Text>
              <Text style={[styles.summaryValue, { color: c.text }]}>
                {data?.viaje.vehiculo ?? viaje.vehiculo ?? "—"}
              </Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: c.textSecondary }]}>Encomiendas</Text>
              <Badge label={String(data?.total ?? 0)} variant="info" />
            </View>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={c.primary} />
              <Text style={{ color: c.textSecondary }}>Cargando encomiendas...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Text style={[styles.error, { color: c.destructive }]}>{error}</Text>
              <Button title="Reintentar" variant="secondary" onPress={() => void abrir()} />
            </View>
          ) : !data || data.encomiendas.length === 0 ? (
            <View style={styles.center}>
              <PackageSearch size={36} color={c.textMuted} />
              <Text style={[styles.empty, { color: c.textSecondary }]}>
                Este viaje todavía no tiene encomiendas asignadas.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.list} showsVerticalScrollIndicator>
              {data.encomiendas.map((item) => (
                <Card key={item.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.guiaWrap}>
                      <PackageSearch size={20} color={c.primary} />
                      <View>
                        <Text style={[styles.guia, { color: c.text }]}>
                          {item.guia ?? `Encomienda #${item.id}`}
                        </Text>
                        <Text style={[styles.concepto, { color: c.textSecondary }]}>
                          {item.concepto || "Sin concepto"}
                        </Text>
                      </View>
                    </View>
                    <Badge label={item.estado} variant={estadoVariant(item.estado)} />
                  </View>

                  <View style={styles.people}>
                    <View style={styles.person}>
                      <UserRound size={16} color={c.textSecondary} />
                      <View style={styles.personText}>
                        <Text style={[styles.label, { color: c.textSecondary }]}>Remitente</Text>
                        <Text style={[styles.value, { color: c.text }]}>{item.remitente.nombre_completo || "—"}</Text>
                      </View>
                    </View>

                    <View style={styles.person}>
                      <UserRound size={16} color={c.textSecondary} />
                      <View style={styles.personText}>
                        <Text style={[styles.label, { color: c.textSecondary }]}>Destinatario</Text>
                        <Text style={[styles.value, { color: c.text }]}>{item.destinatario.nombre_completo || "—"}</Text>
                      </View>
                    </View>
                  </View>

                  {item.detalles.length > 0 ? (
                    <View style={styles.detalles}>
                      {item.detalles.map((detalle) => (
                        <Text key={detalle.id} style={[styles.detalle, { color: c.textSecondary }]}>
                          {detalle.cantidad} × {detalle.detalle} · Bs. {Number(detalle.precio_unitario).toFixed(2)}
                        </Text>
                      ))}
                    </View>
                  ) : null}

                  <View style={[styles.bottom, { borderTopColor: c.border }]}>
                    <View>
                      <Text style={[styles.label, { color: c.textSecondary }]}>Pago</Text>
                      <Badge
                        label={item.estado_pago}
                        variant={item.estado_pago === "Pagado" ? "success" : "warning"}
                      />
                    </View>
                    <View style={styles.totalWrap}>
                      <Text style={[styles.label, { color: c.textSecondary }]}>Total</Text>
                      <Text style={[styles.total, { color: c.primary }]}>Bs. {Number(item.total).toFixed(2)}</Text>
                    </View>
                  </View>
                </Card>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  summary: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  summaryItem: { flex: 1, minWidth: 150, gap: 4 },
  summaryLabel: { fontSize: 11, fontWeight: "700" },
  summaryValue: { fontSize: 13, fontWeight: "900" },
  center: { minHeight: 180, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 20 },
  error: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  empty: { maxWidth: 420, fontSize: 13, lineHeight: 19, textAlign: "center" },
  scroll: { maxHeight: 450 },
  list: { gap: 10, paddingBottom: 4 },
  card: { gap: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 },
  guiaWrap: { flex: 1, minWidth: 220, flexDirection: "row", alignItems: "center", gap: 9 },
  guia: { fontSize: 14, fontWeight: "900" },
  concepto: { marginTop: 2, fontSize: 12 },
  people: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  person: { flex: 1, minWidth: 220, flexDirection: "row", alignItems: "center", gap: 8 },
  personText: { flex: 1, minWidth: 0 },
  label: { fontSize: 10, fontWeight: "700" },
  value: { marginTop: 2, fontSize: 13, fontWeight: "800" },
  detalles: { gap: 4 },
  detalle: { fontSize: 12 },
  bottom: { borderTopWidth: 1, paddingTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", gap: 12 },
  totalWrap: { alignItems: "flex-end" },
  total: { marginTop: 2, fontSize: 15, fontWeight: "900" },
  footer: { flexDirection: "row", justifyContent: "flex-end" },
});
