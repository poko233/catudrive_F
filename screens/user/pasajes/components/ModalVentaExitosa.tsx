import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Divider } from "@/components/ui/Divider";
import { useTheme } from "@/theme/useTheme";
import { useConfirm } from "@/hooks/useConfirm";
import { haptics } from "@/animations/haptics";
import { Venta, Asiento } from "../types/pasajes.types";

interface Props {
  venta: Venta | null;
  asientosLibres: Asiento[];
  onClose: () => void;
  onListo: () => void;
  onCompartirPdf: () => Promise<void>;
  onAnular: () => Promise<void>;
  onCambiarAsiento: (detalleId: number, nuevoIdAsiento: number) => Promise<void>;
  onEliminarDetalle: (detalleId: number) => Promise<void>;
}

function badgetEstadoVenta(estado: Venta["estado"]) {
  switch (estado) {
    case "Pagada":
      return "success" as const;
    case "Anulada":
      return "destructive" as const;
    default:
      return "warning" as const;
  }
}

export function ModalVentaExitosa({
  venta,
  asientosLibres,
  onClose,
  onListo,
  onCompartirPdf,
  onAnular,
  onCambiarAsiento,
  onEliminarDetalle,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const confirm = useConfirm();

  const [cargandoPdf, setCargandoPdf] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [operando, setOperando] = useState(false);
  const [cambiandoDetalleId, setCambiandoDetalleId] = useState<number | null>(
    null,
  );

  const asientosPendientes = asientosLibres.length;

  const opcionesAsientosLibres = useMemo(
    () =>
      asientosLibres.map((a) => ({
        label: `Asiento ${a.numero_asiento ?? a.id} · Piso ${a.fila}`,
        value: a.id,
      })),
    [asientosLibres],
  );

  const handleCompartirPdf = async () => {
    if (cargandoPdf || !venta) return;
    setCargandoPdf(true);
    try {
      await onCompartirPdf();
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setCargandoPdf(false);
    }
  };

  const handleAnular = async () => {
    if (anulando || !venta) return;
    const ok = await confirm({
      title: "Anular venta",
      message: "Se liberarán los asientos vendidos. Esta acción no se puede deshacer.",
      confirmText: "Anular",
      variant: "danger",
    });
    if (!ok) return;
    setAnulando(true);
    try {
      await onAnular();
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setAnulando(false);
    }
  };

  const handleCambiarAsiento = async (detalleId: number, nuevoIdAsiento: number) => {
    if (operando) return;
    setOperando(true);
    try {
      await onCambiarAsiento(detalleId, nuevoIdAsiento);
      setCambiandoDetalleId(null);
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setOperando(false);
    }
  };

  const handleEliminarDetalle = async (detalleId: number) => {
    if (operando) return;
    const ok = await confirm({
      title: "Eliminar pasajero",
      message: "Se quitará el pasajero y el asiento quedará libre.",
      confirmText: "Eliminar",
      variant: "danger",
    });
    if (!ok) return;
    setOperando(true);
    try {
      await onEliminarDetalle(detalleId);
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setOperando(false);
    }
  };

  return (
    <Modal
      visible={venta !== null}
      onClose={onClose}
      title="Venta registrada"
      footer={
        <View style={styles.footer}>
          <Button
            title="Nueva venta"
            loading={anulando || operando}
            disabled={anulando || operando}
            onPress={onListo}
          />
        </View>
      }
    >
      {venta && (
        <View style={styles.content}>
          <View
            style={[
              styles.resumen,
              { backgroundColor: c.backgroundSecondary, borderColor: c.border },
            ]}
          >
            <View style={styles.resumenTexto}>
              <Text style={[styles.ruta, { color: c.text }]}>
                {venta.origen} → {venta.destino}
              </Text>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                {new Date(venta.hora_salida).toLocaleString("es-BO", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
                {venta.forma_pago ? ` · ${venta.forma_pago}` : ""}
              </Text>
            </View>
            <Badge
              label={venta.estado}
              variant={badgetEstadoVenta(venta.estado)}
            />
          </View>

          <View style={styles.totalRow}>
            <Text style={{ color: c.textSecondary, fontSize: 13 }}>
              Total pagado
            </Text>
            <Text style={[styles.total, { color: c.primary }]}>
              Bs. {venta.precio_total}
            </Text>
          </View>

          <Divider spacing={6} />

          <View style={styles.detallesHeader}>
            <Text style={[styles.detallesTitulo, { color: c.text }]}>
              Pasajeros
            </Text>
            <Text style={{ color: c.textSecondary, fontSize: 12 }}>
              {venta.detalles.length} · {asientosPendientes} asientos libres
            </Text>
          </View>

          <ScrollView
            style={styles.detallesScroll}
            contentContainerStyle={styles.detallesContent}
            showsVerticalScrollIndicator={false}
          >
            {venta.detalles.map((detalle) => {
              const cambiando = cambiandoDetalleId === detalle.id;
              return (
                <View key={detalle.id} style={styles.detalle}>
                  <View style={styles.detalleInfo}>
                    <Text style={{ color: c.text, fontWeight: "700" }}>
                      Asiento {detalle.asiento.numero_asiento ?? detalle.asiento.id}
                    </Text>
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={{ color: c.textSecondary, fontSize: 12 }}
                    >
                      {detalle.pasajero
                        ? `${detalle.pasajero.nombres} ${detalle.pasajero.apellido_paterno} ${
                            detalle.pasajero.apellido_materno ?? ""
                          } · CI: ${detalle.pasajero.ci}`
                        : "Pasajero sin datos"}
                    </Text>
                  </View>
                  <Text style={{ color: c.primary, fontWeight: "700", fontSize: 13 }}>
                    Bs. {detalle.precio_unitario}
                  </Text>
                  {cambiando ? (
                    <View style={styles.asientoOptions}>
                      <Select
                        label="Asiento libre"
                        options={opcionesAsientosLibres}
                        onValueChange={(val) =>
                          handleCambiarAsiento(detalle.id, Number(val))
                        }
                        placeholder="Elige asiento"
                        searchable
                        searchPlaceholder="Buscar asiento..."
                      />
                      <Button
                        title="Cancelar"
                        variant="secondary"
                        disabled={operando}
                        onPress={() => setCambiandoDetalleId(null)}
                      />
                    </View>
                  ) : null}
                  {!cambiando ? (
                    <View style={styles.detalleAcciones}>
                      <Button
                        title="Cambiar asiento"
                        variant="secondary"
                        disabled={operando || asientosLibres.length === 0}
                        onPress={() => setCambiandoDetalleId(detalle.id)}
                      />
                      <Button
                        title="Quitar"
                        variant="destructive"
                        disabled={operando}
                        onPress={() => handleEliminarDetalle(detalle.id)}
                      />
                    </View>
                  ) : null}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.acciones}>
            <Button
              title="Compartir PDF"
              variant="secondary"
              loading={cargandoPdf || operando}
              disabled={cargandoPdf || operando || venta.estado !== "Pagada"}
              onPress={handleCompartirPdf}
            />
            <Button
              title="Anular venta"
              variant="destructive"
              loading={anulando || operando}
              disabled={anulando || operando || venta.estado !== "Pagada"}
              onPress={handleAnular}
            />
          </View>

          {operando ? (
            <ActivityIndicator color={c.primary} />
          ) : null}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  resumen: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  resumenTexto: {
    flex: 1,
    gap: 2,
  },
  ruta: {
    fontSize: 15,
    fontWeight: "800",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  total: {
    fontSize: 18,
    fontWeight: "900",
  },
  detallesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detallesTitulo: {
    fontSize: 14,
    fontWeight: "800",
  },
  detallesScroll: {
    maxHeight: 260,
  },
  detallesContent: {
    gap: 10,
  },
  detalle: {
    gap: 8,
  },
  detalleInfo: {
    gap: 2,
  },
  detalleAcciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  asientoOptions: {
    gap: 8,
  },
  acciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});