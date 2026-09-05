import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/useTheme";
import { crearAsignacion } from "../services/transporte.service";
import { haptics } from "@/animations/haptics";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  opcionesChoferes: { label: string; value: number }[];
  opcionesVehiculos: { label: string; value: number }[];
}

export function ModalNuevaAsignacion({
  visible,
  onClose,
  onCreated,
  opcionesChoferes,
  opcionesVehiculos,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [idChofer, setIdChofer] = useState<number | null>(null);
  const [idVehiculo, setIdVehiculo] = useState<number | null>(null);
  const [fechaAsignacion, setFechaAsignacion] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [fechaFinalizacion, setFechaFinalizacion] = useState("");
  const [observacion, setObservacion] = useState("");
  const [estado, setEstado] = useState("Activo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCrear = async () => {
    if (!idChofer || !idVehiculo) {
      setError("Selecciona chofer y vehículo.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await crearAsignacion({
        id_chofer: idChofer,
        id_vehiculo: idVehiculo,
        fecha_asignacion: fechaAsignacion,
        fecha_finalizacion: fechaFinalizacion || null,
        observacion: observacion || null,
        estado,
      });
      haptics.success();
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error al crear asignación");
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Nueva Asignación"
      footer={
        <View
          style={{ flexDirection: "row", gap: 10, justifyContent: "flex-end" }}
        >
          <Button title="Cancelar" variant="secondary" onPress={onClose} />
          <Button title="Crear" loading={loading} onPress={handleCrear} />
        </View>
      }
    >
      <View style={{ gap: 12 }}>
        <Select
          label="Chofer"
          value={idChofer ?? undefined}
          onValueChange={(val) => setIdChofer(Number(val))}
          options={opcionesChoferes}
          searchable
          placeholder="Selecciona chofer"
        />
        <Select
          label="Vehículo"
          value={idVehiculo ?? undefined}
          onValueChange={(val) => setIdVehiculo(Number(val))}
          options={opcionesVehiculos}
          searchable
          placeholder="Selecciona vehículo"
        />
        <Input
          label="Fecha Asignación"
          value={fechaAsignacion}
          onChangeText={setFechaAsignacion}
        />
        <Input
          label="Fecha Finalización (opcional)"
          value={fechaFinalizacion}
          onChangeText={setFechaFinalizacion}
        />
        <Input
          label="Observación"
          value={observacion}
          onChangeText={setObservacion}
          multiline
        />
        {error && <Text style={{ color: c.destructive }}>{error}</Text>}
      </View>
    </Modal>
  );
}
