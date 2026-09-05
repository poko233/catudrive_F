import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/theme/useTheme";
import { useVCR } from "../hooks/useVCR";
import { ModalNuevaRelacion } from "./ModalNuevaRelacion";
import { crearViaje } from "../services/pasajes.service";
import { haptics } from "@/animations/haptics";

interface Props {
  visible: boolean;
  onClose: () => void;
  onViajeCreado: () => void;
}

export function ModalNuevoViaje({ visible, onClose, onViajeCreado }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const { data: vcrData, refetch: refetchVCR } = useVCR();
  const [idVCR, setIdVCR] = useState<number | null>(null);
  const [showRelacion, setShowRelacion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opcionesVCR = vcrData.map((vcr) => {
    const asignacion = vcr.asignacion;
    const ruta = vcr.ruta;
    const vehiculo = asignacion?.vehiculo;
    const chofer = asignacion?.chofer;

    const vehiculoLabel = vehiculo
      ? `${vehiculo.placa} - ${vehiculo.marca} ${vehiculo.modelo}`
      : "Vehículo ?";
    // Aquí usamos nombre_completo, que es el campo en pasajes.types.ts
    const choferLabel = chofer ? chofer.nombre_completo : "Chofer ?";
    const rutaLabel = ruta ? `${ruta.origen} → ${ruta.destino}` : "Ruta ?";

    return {
      label: `${vehiculoLabel} | ${choferLabel} | ${rutaLabel}`,
      value: vcr.id,
    };
  });

  const handleCrearViaje = async () => {
    if (!idVCR) return;
    setLoading(true);
    setError(null);
    try {
      await crearViaje(idVCR);
      haptics.success();
      onViajeCreado();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error al crear viaje");
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  const handleRelacionCreada = () => {
    refetchVCR();
  };

  return (
    <>
      <Modal
        visible={visible}
        onClose={onClose}
        title="Crear Nuevo Viaje"
        footer={
          <View
            style={{
              flexDirection: "row",
              gap: 10,
              justifyContent: "flex-end",
            }}
          >
            <Button title="Cancelar" variant="secondary" onPress={onClose} />
            <Button
              title="Crear Viaje"
              loading={loading}
              disabled={!idVCR}
              onPress={handleCrearViaje}
            />
          </View>
        }
      >
        <View style={{ gap: 12 }}>
          <Text style={{ color: c.text, fontSize: 14, fontWeight: "600" }}>
            Selecciona una relación Vehículo-Chofer-Ruta:
          </Text>
          <Select
            label="Vehículo - Chofer - Ruta"
            value={idVCR ?? undefined}
            onValueChange={(val) => setIdVCR(Number(val))}
            options={opcionesVCR}
            searchable
            placeholder="Selecciona relación"
          />
          {vcrData.length === 0 && (
            <Text style={{ color: c.warning, fontSize: 12 }}>
              No hay relaciones disponibles. Crea una nueva relación.
            </Text>
          )}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
            <Button
              title="Nueva Relación"
              variant="secondary"
              onPress={() => setShowRelacion(true)}
            />
          </View>
          {error && <Text style={{ color: c.destructive }}>{error}</Text>}
        </View>
      </Modal>

      <ModalNuevaRelacion
        visible={showRelacion}
        onClose={() => setShowRelacion(false)}
        onCreated={handleRelacionCreada}
      />
    </>
  );
}
