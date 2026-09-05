import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useTheme } from "@/theme/useTheme";
import { cambiarEstadoViaje } from "../services/pasajes.service";
import { Viaje, ViajeEstado } from "../types/pasajes.types";
import { haptics } from "@/animations/haptics";

/*
|--------------------------------------------------------------------------
| MATRIZ DE TRANSICIONES
|--------------------------------------------------------------------------
*/

export const TRANSICIONES_ESTADO_VIAJE: Record<ViajeEstado, ViajeEstado[]> = {
  Vendiendo: ["En curso", "Cancelado"],
  "En curso": ["Finalizado", "Cancelado"],
  Finalizado: [],
  Cancelado: [],
};

interface Props {
  visible: boolean;
  viaje: Viaje | null;
  onClose: () => void;
  onCambiado: () => void;
}

export function ModalCambioEstadoViaje({
  visible,
  viaje,
  onClose,
  onCambiado,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  const [estado, setEstado] = useState<ViajeEstado | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setEstado(null);
      setError(null);
    }
  }, [visible, viaje]);

  const opciones = useMemo(() => {
    if (!viaje) return [];
    return TRANSICIONES_ESTADO_VIAJE[viaje.estado].map((e) => ({
      label: e,
      value: e,
    }));
  }, [viaje]);

  const handleGuardar = async () => {
    if (!viaje || !estado) return;
    setLoading(true);
    setError(null);
    try {
      await cambiarEstadoViaje(viaje.id, estado);
      haptics.success();
      onCambiado();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error al cambiar el estado");
      haptics.error();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Cambiar estado del viaje"
      footer={
        <View style={styles.footer}>
          <Button title="Cancelar" variant="secondary" onPress={onClose} />
          <Button
            title="Guardar"
            loading={loading}
            disabled={!estado || opciones.length === 0}
            onPress={handleGuardar}
          />
        </View>
      }
    >
      <View style={styles.content}>
        {viaje && (
          <View
            style={[
              styles.resumen,
              { backgroundColor: c.backgroundSecondary, borderColor: c.border },
            ]}
          >
            <View style={styles.resumenTexto}>
              <Text style={[styles.ruta, { color: c.text }]}>
                {viaje.origen} → {viaje.destino}
              </Text>
              <Text style={{ color: c.textSecondary, fontSize: 12 }}>
                {new Date(viaje.hora_salida).toLocaleString("es-BO", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </Text>
            </View>
            <Badge
              label={viaje.estado}
              variant={
                viaje.estado === "Vendiendo"
                  ? "success"
                  : viaje.estado === "En curso"
                    ? "info"
                    : viaje.estado === "Cancelado"
                      ? "destructive"
                      : "muted"
              }
            />
          </View>
        )}

        {opciones.length > 0 ? (
          <Select
            label="Nuevo estado"
            value={estado ?? undefined}
            onValueChange={(val) => setEstado(val as ViajeEstado)}
            options={opciones}
            placeholder="Selecciona el nuevo estado"
          />
        ) : (
          <Text style={[styles.sinTransiciones, { color: c.textSecondary }]}>
            Este viaje no admite cambios de estado.
          </Text>
        )}

        {error && <Text style={{ color: c.destructive }}>{error}</Text>}
      </View>
    </Modal>
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
  sinTransiciones: {
    fontSize: 13,
  },
});