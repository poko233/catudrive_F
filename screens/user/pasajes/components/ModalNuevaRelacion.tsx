import React, { useState } from "react";
import { View, Text } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { SelectRich } from "@/components/ui/SelectRich";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/useTheme";
import { crearVCR } from "../services/transporte.service";
import { haptics } from "@/animations/haptics";
import { useAsignacionesCacheadas } from "../hooks/useAsignaciones";
import { useRutasCacheadas } from "../hooks/useRutas";
import {
  opcionesAsignaciones as armarOpcionesAsignaciones,
  opcionesRutas as armarOpcionesRutas,
} from "../utils/opcionesSeleccion";

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ModalNuevaRelacion({ visible, onClose, onCreated }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const { data: asignaciones, loading: loadingAsignaciones } =
    useAsignacionesCacheadas(visible);
  const { data: rutas, loading: loadingRutas } = useRutasCacheadas(visible);

  const [idAsignacion, setIdAsignacion] = useState<number | null>(null);
  const [idRuta, setIdRuta] = useState<number | null>(null);
  const [horaInicio, setHoraInicio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opcionesAsignaciones = armarOpcionesAsignaciones(asignaciones);
  const opcionesRutas = armarOpcionesRutas(rutas);

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
        <SelectRich
          label="Asignación (Vehículo-Chofer)"
          value={idAsignacion ?? undefined}
          onValueChange={setIdAsignacion}
          options={opcionesAsignaciones}
          searchable
          searchPlaceholder="Buscar por placa, chofer o CI"
          modalTitle="Seleccionar asignación"
          placeholder={
            asignaciones.length === 0
              ? "No hay opciones disponibles"
              : "Selecciona asignación"
          }
          loading={loadingAsignaciones && asignaciones.length === 0}
          disabled={asignaciones.length === 0}
        />
        <SelectRich
          label="Ruta"
          value={idRuta ?? undefined}
          onValueChange={setIdRuta}
          options={opcionesRutas}
          searchable
          searchPlaceholder="Buscar por origen o destino"
          modalTitle="Seleccionar ruta"
          placeholder={
            rutas.length === 0
              ? "No hay opciones disponibles"
              : "Selecciona ruta"
          }
          loading={loadingRutas && rutas.length === 0}
          disabled={rutas.length === 0}
        />

        {error && <Text style={{ color: c.destructive }}>{error}</Text>}
      </View>
    </Modal>
  );
}
