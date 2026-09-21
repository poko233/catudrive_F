// screens/admin/arqueo/components/TipoTransaccionFormModal.tsx

import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { useTheme } from "@/theme/useTheme";
import type { NaturalezaTransaccion, TipoTransaccion } from "../types/arqueo.types";

interface Props {
  visible: boolean;
  actual: TipoTransaccion | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: { codigo: string; transaccion: string; tipo_transaccion: NaturalezaTransaccion }) => Promise<boolean>;
}

export function TipoTransaccionFormModal({ visible, actual, saving, onClose, onSave }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [codigo, setCodigo] = useState("");
  const [transaccion, setTransaccion] = useState("");
  const [naturaleza, setNaturaleza] = useState<NaturalezaTransaccion>("Ingreso");
  const [errors, setErrors] = useState<{ codigo?: string; transaccion?: string }>({});

  useEffect(() => {
    if (!visible) return;
    setCodigo(actual?.codigo ?? "");
    setTransaccion(actual?.transaccion ?? "");
    setNaturaleza(actual?.tipo_transaccion ?? "Ingreso");
    setErrors({});
  }, [visible, actual]);

  const handleSave = async () => {
    const e: typeof errors = {};
    if (!codigo.trim()) e.codigo = "El código es obligatorio.";
    else if (codigo.trim().length > 10) e.codigo = "Máximo 10 caracteres.";
    if (!transaccion.trim()) e.transaccion = "El nombre es obligatorio.";
    else if (transaccion.trim().length > 80) e.transaccion = "Máximo 80 caracteres.";
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    const ok = await onSave({ codigo: codigo.trim(), transaccion: transaccion.trim(), tipo_transaccion: naturaleza });
    if (ok) onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={actual ? `Editar tipo #${actual.id}` : "Nuevo tipo de transacción"}
      footer={
        <View style={styles.footer}>
          <Button title="Cancelar" variant="ghost" onPress={onClose} disabled={saving} />
          <Button title={saving ? "Guardando..." : "Guardar"} onPress={handleSave} loading={saving} disabled={saving} />
        </View>
      }
    >
      <View style={styles.body}>
        {actual ? (
          <ThemedText style={[styles.hint, { color: c.textSecondary }]}>
            Cambiar el código puede romper integraciones que usan el código como clave estable.
          </ThemedText>
        ) : null}
        <Input label="Código (único, máx 10)" value={codigo} onChangeText={setCodigo} placeholder="VENTA_PASAJE" autoCapitalize="characters" error={errors.codigo} />
        <Input label="Nombre visible (máx 80)" value={transaccion} onChangeText={setTransaccion} placeholder="Venta de pasaje" error={errors.transaccion} />
        <Select<NaturalezaTransaccion>
          label="Naturaleza"
          value={naturaleza}
          options={[
            { label: "Ingreso", value: "Ingreso" },
            { label: "Egreso", value: "Egreso" },
          ]}
          onValueChange={setNaturaleza}
          modalTitle="Naturaleza"
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

export default TipoTransaccionFormModal;
