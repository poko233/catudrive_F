// screens/admin/roles/RolScreen.tsx

import { Table, TableColumn } from "@/components/Table";
import { ThemedText } from "@/components/ThemedText";
import Visibility from "@/components/Visibility";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { SearchBar } from "@/components/ui/SearchBar";
import { useTheme } from "@/theme/useTheme";
import { KeyRound, Pencil, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import { useConfirm } from "../../../hooks/useConfirm";
import RolFormModal from "./components/RolFormModal";
import { useRoles } from "./hooks/useRoles";
import { Rol, RolPayload } from "./types/rol.types";

type Props = {
  onPermisos: (rol: Rol) => void;
};

const columns: TableColumn[] = [
  { key: "numero", label: "#", style: { width: 60 } },
  { key: "rol", label: "ROL", style: { width: 190 } },
  { key: "estado", label: "ESTADO", style: { width: 120 } },
  { key: "descripcion", label: "DESCRIPCIÓN", style: { flex: 1, minWidth: 240 } },
  { key: "acciones", label: "ACCIONES", style: { width: 150 } },
];

export default function RolScreen({ onPermisos }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const confirm = useConfirm();

  const {
    filteredRoles,
    loading,
    saving,
    deletingId,
    search,
    setSearch,
    createRol,
    updateRol,
    deleteRol,
  } = useRoles();

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRol, setSelectedRol] = useState<Rol | null>(null);

  const openCreate = () => {
    setSelectedRol(null);
    setModalVisible(true);
  };

  const openEdit = (rol: Rol) => {
    setSelectedRol(rol);
    setModalVisible(true);
  };

  const handleSave = (payload: RolPayload) =>
    selectedRol
      ? updateRol(selectedRol.id, payload)
      : createRol(payload);

  const handleDelete = async (rol: Rol) => {
    const ok = await confirm({
      title: "Eliminar rol",
      message: `¿Seguro que quieres eliminar el rol "${rol.rol}"?`,
      variant: "danger",
      confirmText: "Eliminar",
    });

    if (ok) await deleteRol(rol.id);
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Card>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Badge label="Configuración" variant="info" />

              <ThemedText style={styles.title}>Roles y permisos</ThemedText>

              <ThemedText style={{ color: c.textSecondary }}>
                Administra los niveles de acceso del sistema.
              </ThemedText>
            </View>

            <Visibility action="Crear">
              <Button title="Nuevo rol" onPress={openCreate} />
            </Visibility>
          </View>
        </Card>

        <Card padding={0} style={styles.card}>
          <View style={[styles.toolbar, { borderBottomColor: c.border }]}>
            <View style={styles.toolbarTitle}>
              <ThemedText style={styles.listTitle}>Listado de roles</ThemedText>
              <Badge
                label={`${filteredRoles.length} roles`}
                variant="muted"
              />
            </View>
          </View>

          <View style={styles.search}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nombre o descripción..."
            />
          </View>

          <Visibility action="Ver">
            <View style={styles.table}>
              <Table<Rol>
                data={filteredRoles}
                columns={columns}
                loading={loading}
                emptyMessage="No hay roles registrados."
                keyExtractor={(rol) => String(rol.id)}
                renderRow={(rol, index) => (
                  <View
                    style={[
                      styles.row,
                      { borderBottomColor: c.border },
                    ]}
                  >
                    <Cell width={60} text={String(index + 1).padStart(2, "0")} />
                    <Cell width={190} text={rol.rol} bold />

                    <View style={[styles.cell, { width: 120 }]}>
                      <Badge
                        label={rol.estado ?? "Activo"}
                        variant={rol.estado === "Activo" ? "success" : "muted"}
                      />
                    </View>

                    <View style={[styles.cell, styles.description]}>
                      <ThemedText
                        numberOfLines={2}
                        style={{ color: c.textSecondary, fontSize: 12 }}
                      >
                        {rol.descripcion || "Sin descripción"}
                      </ThemedText>
                    </View>

                    <View style={[styles.cell, styles.actions]}>
                      <Visibility action="Editar">
                        <IconButton
                          icon={KeyRound}
                          size="sm"
                          variant="secondary"
                          accessibilityLabel={`Permisos de ${rol.rol}`}
                          onPress={() => onPermisos(rol)}
                        />
                      </Visibility>

                      <Visibility action="Editar">
                        <IconButton
                          icon={Pencil}
                          size="sm"
                          variant="secondary"
                          accessibilityLabel={`Editar ${rol.rol}`}
                          onPress={() => openEdit(rol)}
                        />
                      </Visibility>

                      <Visibility action="Eliminar">
                        <IconButton
                          icon={Trash2}
                          size="sm"
                          variant="destructive"
                          loading={deletingId === rol.id}
                          disabled={deletingId === rol.id}
                          accessibilityLabel={`Eliminar ${rol.rol}`}
                          onPress={() => handleDelete(rol)}
                        />
                      </Visibility>
                    </View>
                  </View>
                )}
              />
            </View>
          </Visibility>
        </Card>
      </ScrollView>

      <RolFormModal
        visible={modalVisible}
        rol={selectedRol}
        saving={saving}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

function Cell({
  width,
  text,
  bold = false,
}: {
  width: number;
  text: string;
  bold?: boolean;
}) {
  return (
    <View style={[styles.cell, { width }]}>
      <ThemedText
        numberOfLines={1}
        style={{ fontSize: 13, fontWeight: bold ? "800" : "700" }}
      >
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    width: "100%",
    maxWidth: 1400,
    alignSelf: "center",
    padding: 18,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  headerText: {
    flex: 1,
    minWidth: 240,
    alignItems: "flex-start",
    gap: 7,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
  },
  card: {
    overflow: "hidden",
  },
  toolbar: {
    padding: 16,
    borderBottomWidth: 1,
  },
  toolbarTitle: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  search: {
    padding: 14,
  },
  table: {
    height: 620,
  },
  row: {
    minWidth: 900,
    minHeight: 70,
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  cell: {
    minHeight: 70,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  description: {
    flex: 1,
    minWidth: 240,
  },
  actions: {
    width: 150,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
});
