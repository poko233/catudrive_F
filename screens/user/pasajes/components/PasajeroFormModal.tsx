import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

import { pasajeroService } from "../services/pasajero.service";
import type { Pasajero } from "../types/pasajes.types";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (pasajero: Pasajero) => void;
}

export function PasajeroFormModal({
  visible,
  onClose,
  onCreated,
}: Props) {
  const [nombres, setNombres] = useState("");
  const [paterno, setPaterno] = useState("");
  const [materno, setMaterno] = useState("");
  const [ci, setCi] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    setNombres("");
    setPaterno("");
    setMaterno("");
    setCi("");
  }, [visible]);

  const guardar = async () => {
    if (!nombres.trim() || !paterno.trim()) {
      Toast.show({
        type: "error",
        text1: "Datos incompletos",
        text2: "Nombres y apellido paterno son obligatorios.",
      });
      return;
    }

    setSaving(true);

    try {
      const pasajero =
        await pasajeroService.crear({
          nombres: nombres.trim(),
          apellido_paterno: paterno.trim(),
          apellido_materno: materno.trim() || null,
          ci: ci.trim() || null,
        });

      Toast.show({
        type: "success",
        text1: "Pasajero registrado",
      });

      onCreated(pasajero);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "No se pudo registrar",
        text2: error?.message || "Revisa los datos del pasajero.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title="Nuevo pasajero"
      onClose={onClose}
    >
      <View style={styles.body}>
        <Input
          label="Nombres *"
          value={nombres}
          onChangeText={setNombres}
        />

        <View style={styles.row}>
          <View style={styles.flex}>
            <Input
              label="Apellido paterno *"
              value={paterno}
              onChangeText={setPaterno}
            />
          </View>

          <View style={styles.flex}>
            <Input
              label="Apellido materno"
              value={materno}
              onChangeText={setMaterno}
            />
          </View>
        </View>

        <Input
          label="CI"
          value={ci}
          onChangeText={setCi}
        />

        <View style={styles.actions}>
          <Button
            title="Cancelar"
            variant="secondary"
            onPress={onClose}
            disabled={saving}
          />

          <Button
            title="Guardar pasajero"
            onPress={() => void guardar()}
            loading={saving}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
  },

  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  flex: {
    flex: 1,
    minWidth: 180,
  },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    flexWrap: "wrap",
  },
});
