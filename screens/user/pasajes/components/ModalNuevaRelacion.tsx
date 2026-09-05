import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/useTheme";
import { crearVCR } from "../services/transporte.service";
import { haptics } from "@/animations/haptics";
import { useAsignacionesCacheadas } from "../hooks/useAsignaciones";
import { useRutasCacheadas } from "../hooks/useRutas";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ModalNuevaRelacion({ visible, onClose, onCreated }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const { data: asignaciones } = useAsignacionesCacheadas();
  const { data: rutas } = useRutasCacheadas();

  const [idAsignacion, setIdAsignacion] = useState<number | null>(null);
  const [idRuta, setIdRuta] = useState<number | null>(null);
  const [horaInicio, setHoraInicio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opcionesAsignaciones = asignaciones.map((a) => ({
    label: `${a.vehiculo.placa} - ${a.chofer.nombre}`,
    value: a.id,
  }));

  const opcionesRutas = rutas.map((r) => ({
    label: `${r.origen} → ${r.destino}`,
    value: r.id,
  }));

  const handleCrear = async () => {
    if (!idAsignacion || !idRuta) {
      setError("Selecciona asignación y ruta.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await crearVCR({
        id_asignacion_vehiculo_chofer: idAsignacion,
        id_ruta: idRuta,
        hora_inicio: horaInicio || null,
      });
      haptics.success();
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error al crear relación");
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Nueva Relación Vehículo-Chofer-Ruta"
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
          label="Asignación (Vehículo-Chofer)"
          value={idAsignacion ?? undefined}
          onValueChange={(val) => setIdAsignacion(Number(val))}
          options={opcionesAsignaciones}
          searchable
          placeholder="Selecciona asignación"
        />
        <Select
          label="Ruta"
          value={idRuta ?? undefined}
          onValueChange={(val) => setIdRuta(Number(val))}
          options={opcionesRutas}
          searchable
          placeholder="Selecciona ruta"
        />
        <Input
          label="Hora de Inicio (opcional)"
          value={horaInicio}
          onChangeText={setHoraInicio}
          placeholder="YYYY-MM-DD HH:MM:SS"
        />
        {error && <Text style={{ color: c.destructive }}>{error}</Text>}
      </View>
    </Modal>
  );
}
