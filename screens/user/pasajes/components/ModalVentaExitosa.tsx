import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Divider } from "@/components/ui/Divider";
import { useTheme } from "@/theme/useTheme";
import { haptics } from "@/animations/haptics";
import { Venta, Asiento, Piso } from "../types/pasajes.types";
import { BusMap } from "./BusMap";
import { Toaster } from "@/components/Toaster";

interface Props {
  venta: Venta | null;
  asientosLibres: Asiento[];
  pisos: Piso[];
  accionFooter?: string;
  onClose: () => void;
  onListo: () => void;
  onCompartirPdf: () => Promise<void>;
  onImprimirTicket: () => Promise<void>;
  onAnular: () => Promise<void>;
  onCambiarAsiento: (
    detalleId: number,
    nuevoIdAsiento: number,
  ) => Promise<void>;
  onEliminarDetalle: (detalleId: number) => Promise<void>;
}

type Confirmado = { tipo: "anular" } | { tipo: "eliminar"; detalleId: number };

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
  pisos,
  accionFooter = "Nueva venta",
  onClose,
  onListo,
  onCompartirPdf,
  onImprimirTicket,
  onAnular,
  onCambiarAsiento,
  onEliminarDetalle,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [confirma, setConfirma] = useState<Confirmado | null>(null);
  const [cargandoPdf, setCargandoPdf] = useState(false);
  const [anulando, setAnulando] = useState(false);
  const [operando, setOperando] = useState(false);
  const [cambiandoDetalleId, setCambiandoDetalleId] = useState<number | null>(
    null,
  );
  const [imprimiendo, setImprimiendo] = useState(false);

  const asientosPendientes = asientosLibres.length;

  const asientosOcupados = useMemo(() => {
    const ocupados = new Map<number, "reservado" | "vendido">();
    pisos.forEach((piso) => {
      piso.asientos.forEach((asiento) => {
        if (
          asiento.tipo_celda === "pasajero" &&
          (asiento.estado_ocupacion === "reservado" ||
            asiento.estado_ocupacion === "vendido")
        ) {
          ocupados.set(asiento.id, asiento.estado_ocupacion);
        }
      });
    });
    return ocupados;
  }, [pisos]);

  const handleCompartirPdf = async () => {
    if (cargandoPdf || !venta) return;
    setCargandoPdf(true);
    try {
      await onCompartirPdf();
      haptics.success();
    } catch (err: any) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "No se pudo compartir",
        text2: err?.message || "Intenta nuevamente.",
      });
    } finally {
      setCargandoPdf(false);
    }
  };
  const handleImprimirTicket = async () => {
    if (imprimiendo || !venta) return;
    setImprimiendo(true);
    try {
      await onImprimirTicket();
      haptics.success();
    } catch (err: any) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "No se pudo imprimir",
        text2: err?.message || "Intenta nuevamente.",
      });
    } finally {
      setImprimiendo(false);
    }
  };
  const handleAnular = () => {
    if (anulando || !venta) return;
    haptics.selection();
    setConfirma({ tipo: "anular" });
  };

  const handleCambiarAsiento = async (
    detalleId: number,
    nuevoIdAsiento: number,
  ) => {
    if (operando) return;
    setOperando(true);
    try {
      await onCambiarAsiento(detalleId, nuevoIdAsiento);
      setCambiandoDetalleId(null);
      haptics.success();
    } catch (err: any) {
      haptics.error();
      Toast.show({
        type: "error",
        text1: "No se pudo cambiar el asiento",
        text2: err?.message || "Intenta nuevamente.",
      });
    } finally {
      setOperando(false);
    }
  };

  const handleEliminarDetalle = (detalleId: number) => {
    if (operando) return;
    haptics.selection();
    setConfirma({ tipo: "eliminar", detalleId });
  };

  const ejecutarAnular = async () => {
    if (!venta) return;
    setAnulando(true);
    try {
      await onAnular();
      haptics.success();
      setConfirma(null);
    } catch (err: any) {
      haptics.error();
      setConfirma(null);
      Toast.show({
        type: "error",
        text1: "No se pudo anular",
        text2: err?.message || "Intenta nuevamente.",
      });
    } finally {
      setAnulando(false);
    }
  };

  const ejecutarEliminar = async (detalleId: number) => {
    setOperando(true);
    try {
      await onEliminarDetalle(detalleId);
      haptics.success();
      setConfirma(null);
    } catch (err: any) {
      haptics.error();
      setConfirma(null);
      Toast.show({
        type: "error",
        text1: "No se pudo eliminar",
        text2: err?.message || "Intenta nuevamente.",
      });
    } finally {
      setOperando(false);
    }
  };

  const cambiarAsientoDisponible =
    cambiandoDetalleId !== null && venta !== null;

  return (
    <>
      <Modal
        visible={venta !== null}
        onClose={onClose}
        title="Venta registrada"
        footer={
          <View style={styles.footer}>
            <Button
              title={accionFooter}
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
                {
                  backgroundColor: c.backgroundSecondary,
                  borderColor: c.border,
                },
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
                        Asiento{" "}
                        {detalle.asiento.numero_asiento ?? detalle.asiento.id}
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
                    <Text
                      style={{
                        color: c.primary,
                        fontWeight: "700",
                        fontSize: 13,
                      }}
                    >
                      Bs. {detalle.precio_unitario}
                    </Text>
                    {cambiando ? (
                      <View style={styles.asientoOptions}>
                        <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                          Elige un asiento libre en la grilla:
                        </Text>
                        <View style={styles.busGrid}>
                          <BusMap
                            pisos={pisos}
                            asientosSeleccionados={[]}
                            onToggleSeleccion={(asiento) =>
                              handleCambiarAsiento(detalle.id, asiento.id)
                            }
                          />
                        </View>
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
                          disabled={
                            operando ||
                            asientosLibres.length === 0 ||
                            venta.estado !== "Pagada"
                          }
                          onPress={() => setCambiandoDetalleId(detalle.id)}
                        />
                        <Button
                          title="Quitar"
                          variant="destructive"
                          disabled={operando || venta.estado !== "Pagada"}
                          onPress={() => handleEliminarDetalle(detalle.id)}
                        />
                      </View>
                    ) : null}
                  </View>
                );
              })}
              {asientosOcupados.size > 0 && cambiarAsientoDisponible ? (
                <View style={styles.avisoOcupado}>
                  <Text style={{ color: c.warning, fontSize: 11 }}>
                    Los asientos en color amarillo ya están tomados y no se
                    pueden elegir.
                  </Text>
                </View>
              ) : null}
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
                title="Imprimir Ticket"
                variant="secondary"
                loading={imprimiendo || operando}
                disabled={imprimiendo || operando || venta.estado !== "Pagada"}
                onPress={handleImprimirTicket}
              />
              <Button
                title="Anular venta"
                variant="destructive"
                loading={anulando || operando}
                disabled={anulando || operando || venta.estado !== "Pagada"}
                onPress={handleAnular}
              />
            </View>

            {operando ? <ActivityIndicator color={c.primary} /> : null}
          </View>
        )}
        <Toaster />
      </Modal>

      <Modal
        visible={confirma !== null}
        onClose={() => setConfirma(null)}
        title={
          confirma?.tipo === "anular" ? "Anular venta" : "Eliminar pasajero"
        }
        maxWidth={420}
        footer={
          <View style={styles.footer}>
            <Button
              title="Cancelar"
              variant="secondary"
              disabled={anulando || operando}
              onPress={() => setConfirma(null)}
            />
            <Button
              title={confirma?.tipo === "anular" ? "Anular" : "Eliminar"}
              variant="destructive"
              loading={anulando || operando}
              disabled={anulando || operando}
              onPress={() => {
                if (confirma?.tipo === "anular") {
                  void ejecutarAnular();
                } else if (confirma?.tipo === "eliminar") {
                  void ejecutarEliminar(confirma.detalleId);
                }
              }}
            />
          </View>
        }
      >
        <Text style={{ color: c.textSecondary, fontSize: 14, lineHeight: 20 }}>
          {confirma?.tipo === "anular"
            ? "Se liberarán los asientos vendidos. Esta acción no se puede deshacer."
            : confirma?.tipo === "eliminar" && venta?.detalles.length === 1
              ? "Es el único asiento de la venta. Al quitarlo, la venta quedará eliminada y su asiento quedará libre."
              : "Se quitará el pasajero y su asiento quedará libre."}
        </Text>
      </Modal>
    </>
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
  busGrid: {
    overflow: "hidden",
  },
  avisoOcupado: {
    paddingVertical: 2,
  },
  acciones: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
});
