// screens/admin/roles/components/RolFormModal.tsx

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { useTheme } from "@/theme/useTheme";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";

import { Estado, Rol, RolPayload } from "../types/rol.types";

type Props = {
  visible: boolean;
  rol?: Rol | null;
  saving: boolean;
  onClose: () => void;
  onSave: (payload: RolPayload) => Promise<boolean>;
};

export default function RolFormModal({
  visible,
  rol,
  saving,
  onClose,
  onSave,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [estado, setEstado] = useState<Estado>("Activo");
  const [error, setError] = useState("");

  const editing = !!rol;

  useEffect(() => {
    if (!visible) return;

    setNombre(rol?.rol ?? "");
    setDescripcion(rol?.descripcion ?? "");
    setEstado(rol?.estado ?? "Activo");
    setError("");
  }, [visible, rol]);

  const save = async () => {
    const value = nombre.trim();

    if (!value) {
      setError("El nombre del rol es obligatorio");
      return;
    }

    if (value.length > 40) {
      setError("Máximo 40 caracteres");
      return;
    }

    const ok = await onSave({
      rol: value,
      descripcion: descripcion.trim() || null,
      estado,
    });

    if (ok) onClose();
  };

  return (
    <Modal
      visible={visible}
      title={editing ? "Editar rol" : "Nuevo rol"}
      onClose={onClose}
      closeOnBackdropPress={!saving}
      width="94%"
      maxWidth={520}
      footer={
        <View style={styles.footer}>
          <Button
            title="Cancelar"
            variant="secondary"
            disabled={saving}
            onPress={onClose}
          />

          <Button
            title={editing ? "Guardar cambios" : "Crear rol"}
            loading={saving}
            disabled={saving}
            onPress={save}
          />
        </View>
      }
    >
      <View style={styles.form}>
        <Input
          label="Nombre del rol"
          value={nombre}
          placeholder="Ej: Administrador"
          maxLength={40}
          error={error}
          onChangeText={(value) => {
            setNombre(value);
            if (error) setError("");
          }}
        />

        <Input
          label="Descripción"
          value={descripcion}
          placeholder="Ej: Acceso completo al sistema"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          onChangeText={setDescripcion}
        />

        <View
          style={[
            styles.status,
            {
              backgroundColor: c.backgroundSecondary,
              borderColor: c.border,
            },
          ]}
        >
          <Switch
            label={estado}
            description={
              estado === "Activo"
                ? "El rol está habilitado"
                : "El rol está deshabilitado"
            }
            value={estado === "Activo"}
            onValueChange={(value) => setEstado(value ? "Activo" : "Inactivo")}
          />
        </View>

        <ThemedText style={{ color: c.textSecondary, fontSize: 11 }}>
          Los permisos del rol se configuran después desde la acción de llave.
        </ThemedText>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  status: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
  },
});
