// screens/admin/arqueo/components/DetalleArqueoModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import Visibility from "@/components/Visibility";
import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import { useArqueoStore } from "../store/arqueoStore";
import { ConfirmModal, useConfirmLocal } from "./ConfirmModal";
import { arqueoService } from "../services/arqueoService";
import { egresoService } from "../services/egresoService";
import { ingresoService } from "../services/ingresoService";
import { MovimientosAgrupados } from "./MovimientosAgrupados";
import { MovimientoPrintModal } from "./MovimientoPrintModal";
import { ViajesChoferSection } from "./ViajesChoferSection";
import type { MovComprobante } from "./MovimientoComprobantePrint";
import {
  Arqueo,
  CONTEO_VACIO,
  ConteoArqueo,
  DENOMINACIONES,
  calcularTotalConteo,
  conteoDesdeArqueo,
  num,
} from "../types/arqueo.types";

interface Props {
  visible: boolean;
  arqueoId: number | null;
  onClose: () => void;
  onClosed?: () => void;
  /** Se llama cuando un movimiento se anula (para refrescar listas padre). */
  onMovimientoChanged?: () => void;
}

function ResumenItem({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const { theme } = useTheme();
  const c = theme.colors;
  return (
    <View style={[styles.resumenItem, { backgroundColor: c.backgroundSecondary, borderColor: highlight ? c.primary : "transparent" }]}>
      <ThemedText style={[styles.resumenLabel, { color: c.textSecondary }]}>{label}</ThemedText>
      <ThemedText style={[styles.resumenValue, { color: highlight ? c.primary : c.text }]}>
        Bs. {Number(value || 0).toFixed(2)}
      </ThemedText>
    </View>
  );
}

export function DetalleArqueoModal({ visible, arqueoId, onClose, onClosed, onMovimientoChanged }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const confirmLocal = useConfirmLocal();
  const cerrarStore = useArqueoStore((s) => s.cerrar);

  const [arqueo, setArqueo] = useState<Arqueo | null>(null);
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [conteo, setConteo] = useState<ConteoArqueo>({ ...CONTEO_VACIO });
  const [anulandoId, setAnulandoId] = useState<number | null>(null);
  const [printTarget, setPrintTarget] = useState<{
    kind: "ingreso" | "egreso";
    mov: MovComprobante;
  } | null>(null);
  const [errorCierre, setErrorCierre] = useState<string | null>(null);

  const recargar = async () => {
    if (!arqueoId) return;
    setErrorCierre(null);
    try {
      const data = await arqueoService.getById(arqueoId, { force: true });
      setArqueo(data);
      setConteo(conteoDesdeArqueo(data));
    } catch {
      Toast.show({ type: "error", text1: "Error", text2: "No se pudo recargar el arqueo" });
    }
  };

  useEffect(() => {
    if (!visible || !arqueoId) return;
    let alive = true;
    (async () => {
      setLoading(true);
      setErrorCierre(null);
      try {
        const data = await arqueoService.getById(arqueoId, { force: true });
        if (!alive) return;
        setArqueo(data);
        setConteo(conteoDesdeArqueo(data));
      } catch {
        Toast.show({ type: "error", text1: "Error", text2: "No se pudo cargar el arqueo" });
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible, arqueoId]);

  const ingresosValidos = useMemo(
    () => (arqueo?.ingresos ?? []).filter((i) => i.estado !== "Anulado"),
    [arqueo],
  );
  const egresosValidos = useMemo(
    () => (arqueo?.egresos ?? []).filter((e) => e.estado !== "Anulado"),
    [arqueo],
  );

  const totales = useMemo(() => {
    let efectivo = 0, tarjeta = 0, qr = 0, transferencia = 0;
    for (const i of ingresosValidos) {
      const m = num(i.monto);
      if (i.tipo_pago === "Efectivo") efectivo += m;
      else if (i.tipo_pago === "Tarjeta") tarjeta += m;
      else if (i.tipo_pago === "QR") qr += m;
      else if (i.tipo_pago === "Transferencia") transferencia += m;
    }
    for (const e of egresosValidos) {
      const m = num(e.monto);
      if (e.tipo_pago === "Efectivo") efectivo -= m;
      else if (e.tipo_pago === "Tarjeta") tarjeta -= m;
      else if (e.tipo_pago === "QR") qr -= m;
      else if (e.tipo_pago === "Transferencia") transferencia -= m;
    }
    return { efectivo, tarjeta, qr, transferencia };
  }, [ingresosValidos, egresosValidos]);

  const saldoAnterior = num(arqueo?.saldo_anterior);
  const esperadoEfectivo = saldoAnterior + totales.efectivo;
  const totalContado = useMemo(() => calcularTotalConteo(conteo), [conteo]);
  const diferencia = Math.round((totalContado - esperadoEfectivo) * 100) / 100;

  const totalIngresos = useMemo(() => ingresosValidos.reduce((s, i) => s + num(i.monto), 0), [ingresosValidos]);
  const totalEgresos = useMemo(() => egresosValidos.reduce((s, e) => s + num(e.monto), 0), [egresosValidos]);

  const handleCerrar = async () => {
    if (!arqueo || arqueo.estado !== "Iniciado") return;
    const ok = await confirmLocal.ask({
      title: `Cerrar arqueo #${arqueo.id}`,
      message: `Contado Bs. ${totalContado.toFixed(2)} vs esperado Bs. ${esperadoEfectivo.toFixed(2)} (${diferencia === 0 ? "cuadrado" : diferencia > 0 ? `sobrante ${diferencia.toFixed(2)}` : `faltante ${Math.abs(diferencia).toFixed(2)}`}). No se puede reabrir.`,
      variant: "danger",
      confirmText: "Cerrar",
    });
    if (!ok) return;
    setClosing(true);
    try {
      const cerrado = await cerrarStore(arqueo.id, {
        total_efectivo: totalContado,
        total_tarjeta: Math.round(totales.tarjeta * 100) / 100,
        total_qr: Math.round(totales.qr * 100) / 100,
        total_transferencia: Math.round(totales.transferencia * 100) / 100,
        total_general: Math.round((totalContado + totales.tarjeta + totales.qr + totales.transferencia) * 100) / 100,
        ...conteo,
      });
      setArqueo(cerrado);
      setConteo(conteoDesdeArqueo(cerrado));
      Toast.show({ type: "success", text1: `Arqueo #${cerrado.id} cerrado` });
      onClosed?.();
    } catch (e) {
      const detail = e instanceof Error ? e.message : "Intenta nuevamente.";
      setErrorCierre(detail);
      Toast.show({ type: "error", text1: "No se pudo cerrar el arqueo", text2: detail, visibilityTime: 6000 });
    } finally {
      setClosing(false);
      confirmLocal.closeConfirm();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | ANULAR MOVIMIENTO (backend: POST /{id}/anular, sin body)
  |--------------------------------------------------------------------------
  |
  | Cambia Valido → Anulado. No borra, no recalcula
  | totales del arqueo. Se recarga el detalle para
  | reflejarlo al instante.
  |
  */

  const handleAnular = async (kind: "ingreso" | "egreso", id: number) => {
    const ok = await confirmLocal.ask({
      title: `Anular ${kind} #${id}`,
      message: "Queda registrado para auditoría. Los totales se recomputan al vuelo.",
      variant: "warning",
      confirmText: "Anular",
    });
    if (!ok) return;
    setAnulandoId(id);
    try {
      if (kind === "ingreso") await ingresoService.anular(id);
      else await egresoService.anular(id);
      Toast.show({ type: "success", text1: `${kind === "ingreso" ? "Ingreso" : "Egreso"} #${id} anulado` });
      await recargar();
      onMovimientoChanged?.();
    } catch (e) {
      Toast.show({ type: "error", text1: "No se pudo anular", text2: e instanceof Error ? e.message : "Intenta nuevamente.", visibilityTime: 5000 });
    } finally {
      setAnulandoId(null);
      confirmLocal.closeConfirm();
    }
  };

  /*
  |--------------------------------------------------------------------------
  | IMPRIMIR COMPROBANTE (patrón ModalImprimirTicket)
  |--------------------------------------------------------------------------
  |
  | Solo se abre el modal con el mov de la lista embebida.
  | El modal espera el HTML del endpoint y al llegar abre
  | la ventana nueva con el print() de esa ventana.
  |
  */

  const handlePrint = (kind: "ingreso" | "egreso", id: number) => {
    const lista = kind === "ingreso" ? (arqueo?.ingresos ?? []) : (arqueo?.egresos ?? []);
    const mov = lista.find((m) => m.id === id);
    if (!mov) return;
    setPrintTarget({ kind, mov });
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={arqueo ? `Arqueo #${arqueo.id} — ${arqueo.estado}` : "Detalle de arqueo"}
      maxWidth={860}
      footer={
        <View style={styles.footer}>
          <Button title="Cerrar" variant="ghost" onPress={onClose} disabled={closing} />
          {arqueo?.estado === "Iniciado" ? (
            <Visibility action="Editar">
              <Button title={closing ? "Cerrando..." : "Cerrar arqueo"} variant="destructive" onPress={() => void handleCerrar()} loading={closing} disabled={closing || loading} />
            </Visibility>
          ) : null}
        </View>
      }
    >
      {loading || !arqueo ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.row}>
            <Badge label={arqueo.estado} variant={arqueo.estado === "Iniciado" ? "success" : "muted"} />
            <ThemedText style={[styles.sub, { color: c.textSecondary }]}>
              Apertura: {arqueo.fecha_apertura}{arqueo.fecha_cierre ? ` • Cierre: ${arqueo.fecha_cierre}` : ""}
            </ThemedText>
          </View>

          <Card>
            <ThemedText style={styles.sectionTitle}>Resumen de caja</ThemedText>
            <View style={styles.grid}>
              <ResumenItem label="Saldo anterior" value={saldoAnterior} />
              <ResumenItem label="Ingresos válidos" value={totalIngresos} />
              <ResumenItem label="Egresos válidos" value={totalEgresos} />
              <ResumenItem label="Esperado efectivo" value={esperadoEfectivo} highlight />
            </View>
          </Card>

          <Card>
            <ThemedText style={styles.sectionTitle}>Totales por método (neto)</ThemedText>
            <View style={styles.grid}>
              <ResumenItem label="Efectivo" value={totales.efectivo} />
              <ResumenItem label="Tarjeta" value={totales.tarjeta} />
              <ResumenItem label="QR" value={totales.qr} />
              <ResumenItem label="Transferencia" value={totales.transferencia} />
            </View>
          </Card>

          <MovimientosAgrupados
            titulo={`Ingresos (${ingresosValidos.length} válidos de ${arqueo.ingresos?.length ?? 0})`}
            items={arqueo.ingresos ?? []}
            emptyText="No hay ingresos en este arqueo."
            onPrint={(id) => handlePrint("ingreso", id)}
            onAnular={(id) => void handleAnular("ingreso", id)}
            anulandoId={anulandoId}
          />

          <MovimientosAgrupados
            titulo={`Egresos (${egresosValidos.length} válidos de ${arqueo.egresos?.length ?? 0})`}
            items={arqueo.egresos ?? []}
            emptyText="No hay egresos en este arqueo."
            onPrint={(id) => handlePrint("egreso", id)}
            onAnular={(id) => void handleAnular("egreso", id)}
            anulandoId={anulandoId}
          />

          <ViajesChoferSection arqueo={arqueo} />

          <Card>
            <ThemedText style={styles.sectionTitle}>Conteo físico de efectivo</ThemedText>
            <View style={styles.grid}>
              {DENOMINACIONES.map((d) => (
                <View key={d.key} style={styles.conteoField}>
                  <Input
                    label={d.label}
                    value={String(conteo[d.key] ?? 0)}
                    onChangeText={(v) => {
                      const n = Math.max(0, parseInt(v || "0", 10) || 0);
                      setConteo((p) => ({ ...p, [d.key]: n }));
                    }}
                    keyboardType="numeric"
                    editable={arqueo.estado === "Iniciado"}
                  />
                </View>
              ))}
            </View>
            <View style={styles.totalesRow}>
              <ThemedText style={{ color: c.textSecondary }}>Total contado:</ThemedText>
              <ThemedText style={[styles.totalBig, { color: c.primary }]}>Bs. {totalContado.toFixed(2)}</ThemedText>
            </View>
            <View style={styles.totalesRow}>
              <ThemedText style={{ color: c.textSecondary }}>Esperado:</ThemedText>
              <ThemedText style={styles.totalBig}>Bs. {esperadoEfectivo.toFixed(2)}</ThemedText>
            </View>
            {diferencia !== 0 ? (
              <View style={[styles.alert, { backgroundColor: diferencia > 0 ? "#FEF3C7" : "#FEE2E2" }]}>
                <ThemedText style={[styles.alertText, { color: diferencia > 0 ? "#92400E" : "#991B1B" }]}>
                  {diferencia > 0 ? `Sobrante: Bs. ${diferencia.toFixed(2)}` : `Faltante: Bs. ${Math.abs(diferencia).toFixed(2)}`}
                </ThemedText>
              </View>
            ) : (
              <View style={[styles.alert, { backgroundColor: "#DCFCE7" }]}>
                <ThemedText style={[styles.alertText, { color: "#166534" }]}>Cuadrado — sin diferencia</ThemedText>
              </View>
            )}
            {errorCierre ? (
              <View style={[styles.alert, { backgroundColor: "#FEE2E2" }]}>
                <ThemedText style={[styles.alertText, { color: "#991B1B" }]}>
                  No se pudo cerrar: {errorCierre}
                </ThemedText>
              </View>
            ) : null}
            <ThemedText style={[styles.hint, { color: c.textMuted }]}>
              Al cerrar se guarda: efectivo = total contado, tarjeta/QR/transferencia = neto de movimientos, general = suma.
            </ThemedText>
          </Card>
        </View>
      )}

      <ConfirmModal
        state={confirmLocal.confirmState}
        busy={confirmLocal.confirmBusy || closing || anulandoId !== null}
        onCancel={confirmLocal.handleCancel}
        onConfirm={confirmLocal.handleConfirm}
      />

      <MovimientoPrintModal
        visible={printTarget !== null}
        kind={printTarget?.kind ?? "ingreso"}
        movimiento={printTarget?.mov ?? null}
        onClose={() => setPrintTarget(null)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12 },
  center: { padding: 24, alignItems: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  sub: { fontSize: 12, flex: 1, flexWrap: "wrap" },
  sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 10 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  resumenItem: { flex: 1, minWidth: 140, padding: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  resumenLabel: { fontSize: 11 },
  resumenValue: { fontSize: 14, fontWeight: "800", marginTop: 4 },
  conteoField: { width: "31%", minWidth: 130, flexGrow: 1 },
  totalesRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  totalBig: { fontSize: 17, fontWeight: "800" },
  alert: { marginTop: 10, padding: 10, borderRadius: 10, alignItems: "center" },
  alertText: { fontSize: 13, fontWeight: "700" },
  hint: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
});

export default DetalleArqueoModal;
