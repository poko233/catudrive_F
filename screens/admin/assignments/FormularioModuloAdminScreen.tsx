import { getIonicon } from "@/screens/admin/modulos/types/modulo.types";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../../theme/useTheme";
import { useModulos } from "../modulos/hooks/useModulos";
import { EntitySelectModal } from "../components/EntitySelectModal";
import { useFormularios } from "../forms/useFormularios";
import { useFormularioModulos } from "./useFormularioModulos";
import Visibility from "@/components/Visibility";

export function FormularioModuloAdminScreen() {
  const [confirmId, setConfirmId] = useState<{
    id_formulario: number;
    id_modulo: number;
  } | null>(null);
  const { theme } = useTheme();
  const c = theme.colors;
  const { formularios } = useFormularios();
  const { modulos } = useModulos();
  const { assignments, loading, saving, assign, removeAssignment } =
    useFormularioModulos();

  const [modalFormulario, setModalFormulario] = useState(false);
  const [modalModulo, setModalModulo] = useState(false);
  const [selectedFormularioId, setSelectedFormularioId] = useState<
    number | null
  >(null);
  const [selectedModuloId, setSelectedModuloId] = useState<number | null>(null);

  const selectedFormulario = useMemo(
    () => formularios.find((item) => item.id === selectedFormularioId) ?? null,
    [formularios, selectedFormularioId],
  );
  const selectedModulo = useMemo(
    () => modulos.find((item) => item.id === selectedModuloId) ?? null,
    [modulos, selectedModuloId],
  );

  const rows = useMemo(() => {
    return assignments.map((item) => {
      const formulario =
        formularios.find((f) => f.id === item.id_formulario)?.formulario ??
        item.formulario ??
        `#${item.id_formulario}`;
      const modulo =
        modulos.find((m) => m.id === item.id_modulo)?.modulo ??
        item.modulo ??
        `#${item.id_modulo}`;
      return {
        key: `${item.id_formulario}-${item.id_modulo}`,
        id_formulario: item.id_formulario,
        id_modulo: item.id_modulo,
        formulario,
        modulo,
      };
    });
  }, [assignments, formularios, modulos]);

  const handleAssign = async () => {
    if (!selectedFormularioId || !selectedModuloId) return;
    const ok = await assign({
      id_formulario: selectedFormularioId,
      id_modulo: selectedModuloId,
    });
    if (ok) {
      setSelectedFormularioId(null);
      setSelectedModuloId(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View
        style={[
          styles.topBar,
          { backgroundColor: c.card, borderBottomColor: c.border },
        ]}
      >
        <View>
          <Text style={[styles.title, { color: c.text }]}>
            Formulario → Módulo
          </Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Asigna un formulario existente a un módulo
          </Text>
        </View>
        <Visibility action="Crear">
          <TouchableOpacity
            onPress={handleAssign}
            disabled={saving || !selectedFormularioId || !selectedModuloId}
            style={[
              styles.addButton,
              {
                backgroundColor:
                  saving || !selectedFormularioId || !selectedModuloId
                    ? c.muted
                    : c.primary,
              },
            ]}
          >
            <Ionicons
              name="link-outline"
              size={18}
              color={c.primaryForeground}
            />
            <Text
              style={[styles.addButtonText, { color: c.primaryForeground }]}
            >
              Asignar
            </Text>
          </TouchableOpacity>
        </Visibility>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Visibility action="Crear">
          <View
            style={[
              styles.selectorCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: c.text }]}>
              Selecciona formulario y módulo
            </Text>

            <View style={styles.selectorRow}>
              <TouchableOpacity
                onPress={() => setModalFormulario(true)}
                style={[
                  styles.selector,
                  { borderColor: c.border, backgroundColor: c.input },
                ]}
              >
                <Text
                  style={[styles.selectorLabel, { color: c.textSecondary }]}
                >
                  Formulario
                </Text>
                <Text
                  style={[styles.selectorValue, { color: c.text }]}
                  numberOfLines={1}
                >
                  {selectedFormulario?.formulario ?? "Seleccionar formulario"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalModulo(true)}
                style={[
                  styles.selector,
                  { borderColor: c.border, backgroundColor: c.input },
                ]}
              >
                <Ionicons
                  name={
                    (selectedModulo
                      ? getIonicon(selectedModulo.icono ?? "")
                      : "grid-outline") as any
                  }
                  size={16}
                  color={c.textSecondary}
                />
                <Text
                  style={[styles.selectorLabel, { color: c.textSecondary }]}
                >
                  Módulo
                </Text>
                <Text
                  style={[styles.selectorValue, { color: c.text }]}
                  numberOfLines={1}
                >
                  {selectedModulo?.modulo ?? "Seleccionar módulo"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Visibility>
        <Visibility action="Ver">
          <View
            style={[
              styles.tableCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <View style={styles.tableHeader}>
              <Text style={[styles.colId, { color: c.textSecondary }]}>
                ID Form.
              </Text>
              <Text style={[styles.colName, { color: c.textSecondary }]}>
                Formulario
              </Text>
              <Text style={[styles.colName, { color: c.textSecondary }]}>
                Módulo
              </Text>
              <Text
                style={{ width: 60, color: c.textSecondary, fontWeight: "700" }}
              >
                Acción
              </Text>
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={c.primary} />
              </View>
            ) : (
              <FlatList
                data={rows}
                keyExtractor={(item) => item.key}
                scrollEnabled={false}
                contentContainerStyle={
                  rows.length === 0 ? styles.emptyWrap : undefined
                }
                ListEmptyComponent={
                  <View style={styles.center}>
                    <Ionicons name="link-outline" size={42} color={c.muted} />
                    <Text style={{ color: c.textSecondary, marginTop: 10 }}>
                      No hay formularios asignados.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={[styles.row, { borderTopColor: c.border }]}>
                    <Text style={[styles.colId, { color: c.text }]}>
                      {item.id_formulario}
                    </Text>
                    <Text
                      style={[styles.colName, { color: c.text }]}
                      numberOfLines={1}
                    >
                      {item.formulario}
                    </Text>
                    <Text
                      style={[styles.colName, { color: c.textSecondary }]}
                      numberOfLines={1}
                    >
                      {item.modulo}
                    </Text>
                    <Visibility action="Eliminar">
                      <TouchableOpacity
                        onPress={() =>
                          setConfirmId({
                            id_formulario: item.id_formulario,
                            id_modulo: item.id_modulo,
                          })
                        }
                        style={{
                          width: 30,
                          height: 30,
                          borderWidth: 0.5,
                          borderRadius: 8,
                          borderColor: "#F43F5E",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={15}
                          color="#F43F5E"
                        />
                      </TouchableOpacity>
                    </Visibility>
                  </View>
                )}
              />
            )}
          </View>
        </Visibility>
      </ScrollView>

      <EntitySelectModal
        visible={modalFormulario}
        title="Seleccionar formulario"
        items={formularios}
        selectedId={selectedFormularioId}
        onClose={() => setModalFormulario(false)}
        onSelect={(item) => {
          setSelectedFormularioId(item.id);
          setModalFormulario(false);
        }}
        getLabel={(item) => item.formulario}
        getSubtitle={(item) => item.ruta ?? undefined}
        emptyText="No hay formularios registrados"
        searchPlaceholder="Buscar formulario..."
      />

      <EntitySelectModal
        visible={modalModulo}
        title="Seleccionar módulo"
        items={modulos}
        selectedId={selectedModuloId}
        onClose={() => setModalModulo(false)}
        onSelect={(item) => {
          setSelectedModuloId(item.id);
          setModalModulo(false);
        }}
        getLabel={(item) => item.modulo}
        getSubtitle={(item) => item.descripcion ?? undefined}
        emptyText="No hay módulos registrados"
        searchPlaceholder="Buscar módulo..."
      />

      <Modal visible={confirmId !== null} transparent animationType="fade">
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={() => setConfirmId(null)}
          accessible={false}
        />
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
          pointerEvents="box-none"
        >
          <View
            style={[
              {
                backgroundColor: c.card,
                borderRadius: 20,
                padding: 24,
                width: "100%",
                maxWidth: 360,
                alignItems: "center",
                gap: 14,
                borderWidth: 1,
                borderColor: c.border,
              },
            ]}
          >
            <Ionicons name="trash-outline" size={32} color={c.destructive} />
            <Text style={{ color: c.text, fontWeight: "700", fontSize: 16 }}>
              ¿Eliminar asignación?
            </Text>
            <Text style={{ color: c.textSecondary, textAlign: "center" }}>
              Esta acción no se puede deshacer.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
              <TouchableOpacity
                onPress={() => setConfirmId(null)}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderRadius: 10,
                  paddingVertical: 12,
                  borderColor: c.border,
                }}
              >
                <Text style={{ color: c.textSecondary }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!confirmId) return;
                  await removeAssignment(
                    confirmId.id_formulario,
                    confirmId.id_modulo,
                  );
                  setConfirmId(null);
                }}
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  paddingVertical: 12,
                  backgroundColor: c.destructive,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  Eliminar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 4 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addButtonText: { fontWeight: "700" },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 28,
  },
  selectorCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: "800" },
  selectorRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  selector: {
    flex: 1,
    minWidth: 260,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  selectorLabel: { fontSize: 11, fontWeight: "700" },
  selectorValue: { fontSize: 14, fontWeight: "700" },
  tableCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderTopWidth: 1,
  },
  colId: { width: 70, fontWeight: "700" },
  colName: { flex: 1, fontWeight: "600" },
  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  emptyWrap: {
    minHeight: 160,
  },
});
