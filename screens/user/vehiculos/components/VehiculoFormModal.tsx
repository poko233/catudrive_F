import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { useTheme } from "@/theme/useTheme";
import { useCategoriasVehiculo } from "../hooks/useCategoriasVehiculo";
import { VehicleSeatBuilder } from "./VehicleSeatBuilder";
import { ChoferSelectorModal } from "./ChoferSelectorModal";
import { DimensionStepper } from "./DimensionStepper";
import type {
  Vehiculo,
  VehiculoForm,
  Piso,
  EstadoVehiculo,
  ChoferBusqueda,
} from "../types/vehiculo.types";
import {
  crearPisoVacio,
  cambiarDimensionPiso,
  normalizarPiso,
  limpiarPisosParaEdicion,
} from "../utils/gridMapper";
import type { SelectOption } from "@/components/ui/Select";
import { X } from "lucide-react-native";

type Props = {
  visible: boolean;
  vehiculo?: Vehiculo | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (
    form: VehiculoForm,
    vehiculo?: Vehiculo | null,
  ) => Promise<boolean>;
};

const estadoOptions: SelectOption<EstadoVehiculo>[] = [
  { label: "Operativo", value: "Operativo" },
  { label: "En mantenimiento", value: "En mantenimiento" },
  { label: "Baja", value: "Baja" },
];

export function VehiculoFormModal({
  visible,
  vehiculo,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const {
    categorias,
    loading: loadingCategorias,
    refresh,
  } = useCategoriasVehiculo();

  const [form, setForm] = useState<VehiculoForm>({
    id_categoria: 0,
    placa: "",
    tipo: "",
    marca: "",
    modelo: "",
    color: "",
    estado: "Operativo",
    pisos: [],
  });
  const [pisosInactivos, setPisosInactivos] = useState<Piso[]>([]);
  const [error, setError] = useState("");
  const [pisoActivo, setPisoActivo] = useState(0);
  const [propietario, setPropietario] = useState<ChoferBusqueda | null>(null);
  const [choferSelectorVisible, setChoferSelectorVisible] = useState(false);
  // Estado pressed con estilos 100% estáticos (sin callbacks de
  // Pressable): render determinista en Android nativo. Mismo patrón
  // que components/ui/Select.tsx y MobileTabBar.
  const [propietarioPressed, setPropietarioPressed] = useState(false);

  useEffect(() => {
    if (!visible) return;
    void refresh();
    if (vehiculo) {
      const todosPisos = vehiculo.pisos ?? [];
      // Pisos activos limpios y reenumerados
      const activos = limpiarPisosParaEdicion(todosPisos);
      // Pisos inactivos solo normalizados (sin reenumerar)
      const inactivos = todosPisos
        .filter((piso) => piso.estado !== "Activo")
        .map((piso) => normalizarPiso(piso));

      setForm({
        id_categoria: vehiculo.id_categoria,
        placa: vehiculo.placa,
        tipo: vehiculo.tipo,
        marca: vehiculo.marca,
        modelo: vehiculo.modelo,
        color: vehiculo.color ?? "",
        estado: vehiculo.estado,
        pisos: activos.length > 0 ? activos : [crearPisoVacio(1, 2, 2)],
      });
      setPisosInactivos(inactivos);
      setPisoActivo(0);

      // Cargar propietario existente
      if (vehiculo.propietario) {
        setPropietario({
          id: vehiculo.propietario.id_chofer,
          nombre_completo: vehiculo.propietario.nombre_completo,
          ci: vehiculo.propietario.ci,
          carnet_sindical: vehiculo.propietario.carnet_sindical,
        });
      } else {
        setPropietario(null);
      }
    } else {
      setForm({
        id_categoria: categorias[0]?.id ?? 0,
        placa: "",
        tipo: "",
        marca: "",
        modelo: "",
        color: "",
        estado: "Operativo",
        pisos: [crearPisoVacio(1, 2, 2)],
      });
      setPisosInactivos([]);
      setPisoActivo(0);
      setPropietario(null);
    }
    setError("");
  }, [visible, vehiculo, categorias, refresh]);

  const update = <K extends keyof VehiculoForm>(
    key: K,
    value: VehiculoForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError("");
  };

  const handleChangePisos = useCallback((pisos: Piso[]) => {
    setForm((prev) => ({ ...prev, pisos }));
  }, []);

  const addPiso = () => {
    if (pisosInactivos.length > 0) {
      const pisoReactivado = normalizarPiso({
        ...pisosInactivos[0],
        estado: "Activo",
        asientos: pisosInactivos[0].asientos.map((asiento) => ({
          ...asiento,
          estado: "Activo",
        })),
      });
      const restantesInactivos = pisosInactivos.slice(1);
      setPisosInactivos(restantesInactivos);

      const nuevosPisos = [...form.pisos, pisoReactivado];
      setForm((prev) => ({ ...prev, pisos: nuevosPisos }));
      setPisoActivo(nuevosPisos.length - 1);
    } else {
      const nuevoNumero = form.pisos.length + 1;
      const nuevoPiso = crearPisoVacio(nuevoNumero, 2, 2);
      setForm((prev) => ({ ...prev, pisos: [...prev.pisos, nuevoPiso] }));
      setPisoActivo(nuevoNumero - 1);
    }
  };

  const removePiso = () => {
    if (form.pisos.length <= 1) return;
    const pisoEliminado = form.pisos[pisoActivo];
    const pisoInactivo = normalizarPiso({
      ...pisoEliminado,
      estado: "Inactivo",
      asientos: pisoEliminado.asientos.map((a) => ({
        ...a,
        estado: "Inactivo",
      })),
    });
    setPisosInactivos((prev) => [pisoInactivo, ...prev]);

    const nuevos = form.pisos
      .filter((_, index) => index !== pisoActivo)
      .map((p, i) => ({ ...p, numero: i + 1, nombre: `Piso ${i + 1}` }));
    setForm((prev) => ({ ...prev, pisos: nuevos }));
    setPisoActivo((prev) => Math.min(prev, nuevos.length - 1));
  };

  const pisoActual = form.pisos[pisoActivo];

  const addRow = () => {
    if (!pisoActual) return;
    const nuevos = [...form.pisos];
    nuevos[pisoActivo] = normalizarPiso(
      cambiarDimensionPiso(
        pisoActual,
        pisoActual.filas + 1,
        pisoActual.columnas,
      ),
    );
    setForm((prev) => ({ ...prev, pisos: nuevos }));
  };

  const removeRow = () => {
    if (!pisoActual || pisoActual.filas <= 1) return;
    const nuevos = [...form.pisos];
    nuevos[pisoActivo] = normalizarPiso(
      cambiarDimensionPiso(
        pisoActual,
        pisoActual.filas - 1,
        pisoActual.columnas,
      ),
    );
    setForm((prev) => ({ ...prev, pisos: nuevos }));
  };

  const addColumn = () => {
    if (!pisoActual) return;
    const nuevos = [...form.pisos];
    nuevos[pisoActivo] = normalizarPiso(
      cambiarDimensionPiso(
        pisoActual,
        pisoActual.filas,
        pisoActual.columnas + 1,
      ),
    );
    setForm((prev) => ({ ...prev, pisos: nuevos }));
  };

  const removeColumn = () => {
    if (!pisoActual || pisoActual.columnas <= 1) return;
    const nuevos = [...form.pisos];
    nuevos[pisoActivo] = normalizarPiso(
      cambiarDimensionPiso(
        pisoActual,
        pisoActual.filas,
        pisoActual.columnas - 1,
      ),
    );
    setForm((prev) => ({ ...prev, pisos: nuevos }));
  };

  const validar = (): string | null => {
    if (!form.id_categoria) return "Seleccione una categoría";
    if (!form.placa.trim()) return "La placa es obligatoria";
    if (!form.tipo.trim()) return "El tipo es obligatorio";
    if (!form.marca.trim()) return "La marca es obligatoria";
    if (!form.modelo.trim()) return "El modelo es obligatorio";
    if (form.pisos.length === 0) return "Debe definir al menos un piso";
    for (const piso of form.pisos) {
      if (
        piso.estado === "Activo" &&
        piso.asientos.length !== piso.filas * piso.columnas
      ) {
        return `El piso ${piso.numero} tiene dimensiones inconsistentes`;
      }
    }
    return null;
  };

  const guardar = async () => {
    const validation = validar();
    if (validation) {
      setError(validation);
      return;
    }
    const formData: VehiculoForm = {
      ...form,
      id_chofer_propietario: propietario ? propietario.id : null,
    };
    const ok = await onSubmit(formData, vehiculo);
    if (ok) onClose();
  };

  const selectOptions = useMemo(
    () => categorias.map((cat) => ({ label: cat.categoria, value: cat.id })),
    [categorias],
  );

  return (
    <Modal
      visible={visible}
      title={vehiculo ? "Modificar vehículo" : "Registrar vehículo"}
      onClose={onClose}
      closeOnBackdropPress={!saving}
      width="98%"
      maxWidth={900}
      footer={
        <View style={styles.footer}>
          <Button
            title="Cancelar"
            variant="secondary"
            disabled={saving}
            onPress={onClose}
          />
          <Button
            title={vehiculo ? "Guardar cambios" : "Registrar"}
            loading={saving}
            disabled={saving}
            onPress={guardar}
          />
        </View>
      }
    >
      <View style={styles.content}>
        {/* Datos generales */}
        <View style={styles.row}>
          <View style={styles.field}>
            <Select<number>
              label="Categoría"
              value={form.id_categoria || undefined}
              options={selectOptions}
              onValueChange={(value) => update("id_categoria", value)}
              disabled={saving}
              modalTitle="Categoría de vehículo"
            />
          </View>
          <View style={styles.field}>
            <Input
              label="Placa"
              value={form.placa}
              onChangeText={(v) => update("placa", v)}
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Input
              label="Tipo"
              value={form.tipo}
              onChangeText={(v) => update("tipo", v)}
              editable={!saving}
            />
          </View>
          <View style={styles.field}>
            <Input
              label="Marca"
              value={form.marca}
              onChangeText={(v) => update("marca", v)}
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Input
              label="Modelo"
              value={form.modelo}
              onChangeText={(v) => update("modelo", v)}
              editable={!saving}
            />
          </View>
          <View style={styles.field}>
            <Input
              label="Color"
              value={form.color ?? ""}
              onChangeText={(v) => update("color", v)}
              editable={!saving}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Select<EstadoVehiculo>
              label="Estado"
              value={form.estado}
              options={estadoOptions}
              onValueChange={(v) => update("estado", v)}
              disabled={saving}
            />
          </View>
          <View style={styles.field}>
            <ThemedText style={{ fontWeight: "700", marginBottom: 6 }}>
              Propietario
            </ThemedText>
            <Pressable
              onPress={() => setChoferSelectorVisible(true)}
              disabled={saving}
              onPressIn={() => setPropietarioPressed(true)}
              onPressOut={() => setPropietarioPressed(false)}
              accessibilityRole="button"
              accessibilityLabel="Seleccionar propietario"
              style={[
                styles.propietarioButton,
                {
                  backgroundColor: c.backgroundSecondary,
                  borderColor: c.border,
                  opacity: saving ? 0.55 : propietarioPressed ? 0.8 : 1,
                },
              ]}
            >
              <ThemedText style={{ flex: 1 }}>
                {propietario
                  ? propietario.nombre_completo
                  : "Seleccionar chofer..."}
              </ThemedText>
              {propietario && (
                <IconButton
                  icon={X}
                  size="sm"
                  variant="ghost"
                  accessibilityLabel="Quitar propietario"
                  onPress={() => setPropietario(null)}
                  disabled={saving}
                />
              )}
            </Pressable>
          </View>
        </View>

        {/* Constructor de asientos */}
        <Card style={styles.builderCard}>
          <View style={styles.pisosHeader}>
            <ThemedText style={{ fontWeight: "900" }}>
              Pisos ({form.pisos.length})
            </ThemedText>
            <View style={styles.steppers}>
              <DimensionStepper
                label="Pisos"
                hint="Niveles del bus"
                value={form.pisos.length}
                onMinus={removePiso}
                onPlus={addPiso}
                minusDisabled={saving || form.pisos.length <= 1}
                plusDisabled={saving}
                dangerMinus
                delay={0}
              />
              <DimensionStepper
                label="Filas"
                hint="Hileras del piso activo"
                value={pisoActual?.filas ?? 0}
                onMinus={removeRow}
                onPlus={addRow}
                minusDisabled={
                  saving || !pisoActual || pisoActual.filas <= 1
                }
                plusDisabled={saving || !pisoActual}
                delay={60}
              />
              <DimensionStepper
                label="Columnas"
                hint="Celdas por hilera"
                value={pisoActual?.columnas ?? 0}
                onMinus={removeColumn}
                onPlus={addColumn}
                minusDisabled={
                  saving || !pisoActual || pisoActual.columnas <= 1
                }
                plusDisabled={saving || !pisoActual}
                delay={120}
              />
            </View>
          </View>
          <VehicleSeatBuilder
            pisos={form.pisos}
            onChangePisos={handleChangePisos}
            activePisoIndex={pisoActivo}
            onActivePisoChange={setPisoActivo}
          />
        </Card>

        {!!error && (
          <ThemedText style={{ color: c.destructive }}>{error}</ThemedText>
        )}
      </View>

      <ChoferSelectorModal
        visible={choferSelectorVisible}
        onClose={() => setChoferSelectorVisible(false)}
        onSelect={(chofer) => {
          setPropietario(chofer);
          setChoferSelectorVisible(false);
        }}
        selectedChoferId={propietario?.id}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  field: { flex: 1, minWidth: 200 },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end",
    gap: 10,
  },
  builderCard: { gap: 12 },
  pisosHeader: {
    gap: 10,
  },
  steppers: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  propietarioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
});
