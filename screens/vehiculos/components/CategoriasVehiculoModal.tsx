import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import { Pencil, Plus, Trash2, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useCategoriasVehiculo } from "../hooks/useCategoriasVehiculo";
import type { CategoriaVehiculo } from "../types/vehiculo.types";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function CategoriasVehiculoModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const {
    categorias,
    loading,
    creando,
    editandoId,
    eliminandoId,
    crear,
    editar,
    eliminar,
    refresh,
  } = useCategoriasVehiculo();

  const [editando, setEditando] = useState<CategoriaVehiculo | null>(null);
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [error, setError] = useState("");

  // Cargar categorías al abrir (si aún no están cargadas)
  useEffect(() => {
    if (visible) {
      setEditando(null);
      setNuevaCategoria("");
      setError("");
      void refresh();
    }
  }, [visible, refresh]);

  // Bloqueo global durante cualquier operación
  const hayOperacionEnCurso =
    creando || editandoId !== null || eliminandoId !== null;

  const handleCrear = async () => {
    if (hayOperacionEnCurso) return;
    const nombre = nuevaCategoria.trim();
    if (!nombre) {
      setError("El nombre es obligatorio");
      return;
    }
    setError("");
    const ok = await crear(nombre);
    if (ok) {
      setNuevaCategoria("");
      setEditando(null);
    }
  };

  const handleEditar = async () => {
    if (!editando || hayOperacionEnCurso) return;
    const nombre = editando.categoria.trim();
    if (!nombre) {
      setError("El nombre es obligatorio");
      return;
    }
    setError("");
    const ok = await editar(editando.id, nombre);
    if (ok) {
      setEditando(null);
      setNuevaCategoria("");
    }
  };

  const handleEliminar = async (cat: CategoriaVehiculo) => {
    if (hayOperacionEnCurso) return;
    await eliminar(cat.id);
  };

  return (
    <Modal
      visible={visible}
      title="Categorías de vehículo"
      onClose={onClose}
      width="96%"
      maxWidth={600}
      footer={
        <View style={styles.footer}>
          <Button
            title="Cerrar"
            variant="secondary"
            onPress={onClose}
            disabled={hayOperacionEnCurso}
          />
        </View>
      }
    >
      <View style={styles.content}>
        {/* Lista de categorías */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={c.primary} />
            <ThemedText style={{ color: c.textSecondary }}>
              Cargando categorías...
            </ThemedText>
          </View>
        ) : categorias.length === 0 ? (
          <ThemedText style={{ color: c.textSecondary }}>
            No hay categorías registradas.
          </ThemedText>
        ) : (
          categorias.map((cat) => (
            <Card key={cat.id} style={styles.categoryRow}>
              {editando?.id === cat.id ? (
                <View style={styles.editRow}>
                  <View style={styles.inputWrapper}>
                    <Input
                      value={editando.categoria}
                      onChangeText={(text) =>
                        setEditando({ ...editando, categoria: text })
                      }
                      label="Nombre"
                      editable={!hayOperacionEnCurso}
                    />
                  </View>
                  <View style={styles.editActions}>
                    <IconButton
                      icon={X}
                      size="sm"
                      variant="secondary"
                      accessibilityLabel="Cancelar edición"
                      onPress={() => setEditando(null)}
                      disabled={hayOperacionEnCurso}
                    />
                    <IconButton
                      icon={Pencil}
                      size="sm"
                      variant="primary"
                      accessibilityLabel="Guardar cambios"
                      loading={editandoId === cat.id}
                      disabled={hayOperacionEnCurso}
                      onPress={handleEditar}
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.categoryRowContent}>
                  <ThemedText style={styles.categoryName}>
                    {cat.categoria}
                  </ThemedText>
                  <View style={styles.categoryActions}>
                    <IconButton
                      icon={Pencil}
                      size="sm"
                      variant="secondary"
                      accessibilityLabel="Editar categoría"
                      disabled={hayOperacionEnCurso}
                      onPress={() => setEditando(cat)}
                    />
                    <IconButton
                      icon={Trash2}
                      size="sm"
                      variant="destructive"
                      accessibilityLabel="Eliminar categoría"
                      loading={eliminandoId === cat.id}
                      disabled={hayOperacionEnCurso}
                      onPress={() => void handleEliminar(cat)}
                    />
                  </View>
                </View>
              )}
            </Card>
          ))
        )}

        {/* Formulario para nueva categoría */}
        <Card style={styles.newCategoryCard}>
          <ThemedText style={styles.sectionTitle}>Nueva categoría</ThemedText>
          <View style={styles.newCategoryRow}>
            <View style={styles.inputWrapper}>
              <Input
                value={nuevaCategoria}
                onChangeText={setNuevaCategoria}
                placeholder="Ej: Minibús"
                editable={!hayOperacionEnCurso}
              />
            </View>
            <IconButton
              icon={Plus}
              size="md"
              variant="primary"
              accessibilityLabel="Crear categoría"
              loading={creando}
              disabled={hayOperacionEnCurso}
              onPress={handleCrear}
            />
          </View>
          {error ? (
            <ThemedText style={{ color: c.destructive, fontSize: 12 }}>
              {error}
            </ThemedText>
          ) : null}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 20,
  },
  categoryRow: {
    padding: 10,
  },
  categoryRowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  categoryActions: {
    flexDirection: "row",
    gap: 6,
  },
  editRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  editActions: {
    flexDirection: "row",
    gap: 6,
  },
  newCategoryCard: {
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  newCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inputWrapper: {
    flex: 1,
    minWidth: 0,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
