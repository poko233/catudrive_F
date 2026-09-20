// screens/admin/arqueo/components/MovimientoFormModal.tsx

import React, { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useTheme } from "@/theme/useTheme";
import { tipoTransaccionService } from "../services/tipoTransaccionService";
import type { MovimientoPayload, NaturalezaTransaccion, TipoPago, TipoTransaccion } from "../types/arqueo.types";

interface Props {
  visible: boolean;
  tipo: NaturalezaTransaccion;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: MovimientoPayload) => Promise<boolean>;
}

const PAGOS: TipoPago[] = ["Efectivo", "Tarjeta", "QR", "Transferencia"];

export function MovimientoFormModal({ visible, tipo, saving, onClose, onSave }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [tipos, setTipos] = useState<TipoTransaccion[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [tipoId, setTipoId] = useState<number | undefined>(undefined);
  const [monto, setMonto] = useState("");
  const [tipoPago, setTipoPago] = useState<TipoPago>("Efectivo");
  const [detalle, setDetalle] = useState("");
  const [errors, setErrors] = useState<{ tipo?: string; monto?: string; detalle?: string }>({});

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    (async () => {
      setLoadingTipos(true);
      try {
        const res = await tipoTransaccionService.list({ tipo_transaccion: tipo, per_page: 100, page: 1 });
        if (!alive) return;
        setTipos(res.data ?? []);
      } catch {
        if (alive) setTipos([]);
      } finally {
        if (alive) setLoadingTipos(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [visible, tipo]);

  useEffect(() => {
    if (!visible) {
      setTipoId(undefined);
      setMonto("");
      setTipoPago("Efectivo");
      setDetalle("");
      setErrors({});
    }
  }, [visible]);

  const options = useMemo(
    () => tipos.map((t) => ({ label: `${t.codigo} — ${t.transaccion}`, value: t.id, description: t.tipo_transaccion })),
    [tipos],
  );

  const handleSave = async () => {
    const e: typeof errors = {};
    if (!tipoId) e.tipo = "Selecciona el tipo de transacción.";
    const m = parseFloat(String(monto).replace(",", "."));
    if (!Number.isFinite(m) || m <= 0) e.monto = "Monto debe ser mayor a 0.";
    if (!detalle.trim()) e.detalle = "El detalle es obligatorio.";
    else if (detalle.trim().length > 2000) e.detalle = "Máximo 2000 caracteres.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const ok = await onSave({ tipo_transaccion: tipoId as number, monto: m, tipo_pago: tipoPago, detalle: detalle.trim() });
    if (ok) onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={tipo === "Ingreso" ? "Nuevo ingreso" : "Nuevo egreso"}
      footer={
        <View style={styles.footer}>
          <Button title="Cancelar" variant="ghost" onPress={onClose} disabled={saving} />
          <Button title={saving ? "Guardando..." : "Guardar"} onPress={handleSave} loading={saving} disabled={saving} />
        </View>
      }
    >
      <View style={styles.body}>
        <ThemedText style={[styles.hint, { color: c.textSecondary }]}>
          Si no tienes arqueo abierto, se crea uno automáticamente con saldo 0.
        </ThemedText>
        <Select<number>
          label="Tipo de transacción"
          value={tipoId}
          options={options}
          onValueChange={setTipoId}
          placeholder={loadingTipos ? "Cargando tipos..." : "Selecciona un tipo"}
          searchable
          searchPlaceholder="Buscar por código o nombre..."
          modalTitle={`Tipos de ${tipo.toLowerCase()}`}
          emptyText="No hay tipos registrados. Créalo en la tab Tipos."
          error={errors.tipo}
          disabled={loadingTipos}
        />
        <Input label="Monto (Bs)" value={monto} onChangeText={setMonto} keyboardType="numeric" placeholder="50.00" error={errors.monto} />
        <Select<TipoPago>
          label="Tipo de pago"
          value={tipoPago}
          options={PAGOS.map((p) => ({ label: p, value: p }))}
          onValueChange={setTipoPago}
          modalTitle="Tipo de pago"
        />
        <Input
          label="Detalle"
          value={detalle}
          onChangeText={setDetalle}
          placeholder={tipo === "Ingreso" ? "Venta #123 - Viaje 45" : "Compra de bolsas"}
          multiline
          numberOfLines={3}
          error={errors.detalle}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: 12 },
  hint: { fontSize: 12, lineHeight: 17 },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10 },
});

export default MovimientoFormModal;
