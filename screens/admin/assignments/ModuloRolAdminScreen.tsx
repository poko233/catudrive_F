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
import { useRoles } from "../rol/hooks/useRoles";
import { EntitySelectModal } from "../components/EntitySelectModal";
import { useModuloRoles } from "./useModuloRoles";
import Visibility from "@/components/Visibility";

/* ─────────────────────────────────────────────────────────────
   Colores para badges
───────────────────────────────────────────────────────────── */
const BADGE_COLORS = [
  { bg: "#EEF2FF", text: "#4F46E5", border: "#C7D2FE" },
  { bg: "#FFF1F2", text: "#E11D48", border: "#FECDD3" },
  { bg: "#F0FDF4", text: "#16A34A", border: "#BBF7D0" },
  { bg: "#FFF7ED", text: "#EA580C", border: "#FED7AA" },
  { bg: "#F5F3FF", text: "#7C3AED", border: "#DDD6FE" },
];
const badgeColor = (i: number) => BADGE_COLORS[i % BADGE_COLORS.length];

const resolveIcon = (key: string | null): any => {
  return getIonicon(key ?? "apps-outline");
};
/* ─────────────────────────────────────────────────────────────
   Tipos
───────────────────────────────────────────────────────────── */
interface RolGroup {
  id_rol: number;
  nombre_rol: string;
  modulos: Array<{
    id_modulo: number;
    nombre: string;
    icono: string;
  }>;
}

interface ConfirmState {
  visible: boolean;
  id_modulo: number | null;
  id_rol: number | null;
  moduloNombre: string;
  rolNombre: string;
}

/* ─────────────────────────────────────────────────────────────
   Modal de confirmación — sin Alert nativo
───────────────────────────────────────────────────────────── */
function ConfirmModal({
  state,
  onCancel,
  onConfirm,
  saving,
}: {
  state: ConfirmState;
  onCancel: () => void;
  onConfirm: () => void;
  saving: boolean;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Modal
      visible={state.visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={cm.overlay}>
        <View
          style={[cm.card, { backgroundColor: c.card, borderColor: c.border }]}
        >
          {/* Ícono */}
          <View style={cm.iconWrap}>
            <Ionicons name="trash-outline" size={28} color="#E11D48" />
          </View>

          {/* Texto */}
          <Text style={[cm.title, { color: c.text }]}>Eliminar asignación</Text>
          <Text style={[cm.body, { color: c.textSecondary }]}>
            ¿Quitar el módulo{" "}
            <Text style={{ fontWeight: "800", color: c.text }}>
              "{state.moduloNombre}"
            </Text>{" "}
            del rol{" "}
            <Text style={{ fontWeight: "800", color: c.text }}>
              "{state.rolNombre}"
            </Text>
            ?{"\n"}Esta acción no se puede deshacer.
          </Text>

          {/* Botones */}
          <View style={cm.btnRow}>
            <TouchableOpacity
              onPress={onCancel}
              style={[
                cm.btn,
                { backgroundColor: c.input, borderColor: c.border },
              ]}
            >
              <Text style={[cm.btnText, { color: c.text }]}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              disabled={saving}
              style={[
                cm.btn,
                { backgroundColor: "#E11D48", borderColor: "#E11D48" },
              ]}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="trash-outline" size={15} color="#fff" />
              )}
              <Text style={[cm.btnText, { color: "#fff" }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const cm = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF1F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: "800" },
  body: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 8, width: "100%" },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnText: { fontWeight: "700", fontSize: 14 },
});

/* ─────────────────────────────────────────────────────────────
   Pantalla principal
───────────────────────────────────────────────────────────── */
export function ModuloRolAdminScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const { modulos } = useModulos();
  const { roles } = useRoles();
  const { assignments, loading, saving, assign, remove } = useModuloRoles();

  const [modalModulo, setModalModulo] = useState(false);
  const [modalRol, setModalRol] = useState(false);
  const [selectedModuloId, setSelectedModuloId] = useState<number | null>(null);
  const [selectedRolId, setSelectedRolId] = useState<number | null>(null);

  const [confirm, setConfirm] = useState<ConfirmState>({
    visible: false,
    id_modulo: null,
    id_rol: null,
    moduloNombre: "",
    rolNombre: "",
  });

  /* ── helpers ─────────────────────────────────────────── */
  const selectedModulo = useMemo(
    () => modulos.find((m) => m.id === selectedModuloId) ?? null,
    [modulos, selectedModuloId],
  );
  const selectedRol = useMemo(
    () => roles.find((r) => r.id === selectedRolId) ?? null,
    [roles, selectedRolId],
  );

  /* ── agrupar por rol ─────────────────────────────────── */
  const rolGroups = useMemo<RolGroup[]>(() => {
    const map = new Map<number, RolGroup>();
    for (const a of assignments) {
      if (!map.has(a.id_rol)) {
        map.set(a.id_rol, {
          id_rol: a.id_rol,
          nombre_rol:
            a.nombre_rol ??
            roles.find((r) => r.id === a.id_rol)?.rol ??
            `Rol #${a.id_rol}`,
          modulos: [],
        });
      }
      map.get(a.id_rol)!.modulos.push({
        id_modulo: a.id_modulo,
        nombre:
          a.nombre_modulo ??
          modulos.find((m) => m.id === a.id_modulo)?.modulo ??
          `#${a.id_modulo}`,
        icono: a.icono_modulo ?? "grid-outline",
      });
    }
    return Array.from(map.values());
  }, [assignments, modulos, roles]);

  /* ── asignar ─────────────────────────────────────────── */
  const handleAssign = async () => {
    if (!selectedModuloId || !selectedRolId) return;
    const ok = await assign({
      id_modulo: selectedModuloId,
      id_rol: selectedRolId,
    });
    if (ok) {
      setSelectedModuloId(null);
      setSelectedRolId(null);
    }
  };

  /* ── eliminar ────────────────────────────────────────── */
  const askDelete = (
    id_modulo: number,
    id_rol: number,
    moduloNombre: string,
    rolNombre: string,
  ) => {
    setConfirm({ visible: true, id_modulo, id_rol, moduloNombre, rolNombre });
  };

  const handleConfirmDelete = async () => {
    if (confirm.id_modulo == null || confirm.id_rol == null) return;
    await remove(confirm.id_modulo, confirm.id_rol);
    setConfirm({
      visible: false,
      id_modulo: null,
      id_rol: null,
      moduloNombre: "",
      rolNombre: "",
    });
  };

  const handleCancelDelete = () => {
    setConfirm({
      visible: false,
      id_modulo: null,
      id_rol: null,
      moduloNombre: "",
      rolNombre: "",
    });
  };

  /* ── ícono del rol ───────────────────────────────────── */
  const rolIcon = (nombre: string): keyof typeof Ionicons.glyphMap => {
    const n = nombre.toLowerCase();
    if (n.includes("admin")) return "shield-half-outline";
    if (n.includes("vend")) return "pricetag-outline";
    if (n.includes("soporte")) return "headset-outline";
    if (n.includes("conta")) return "calculator-outline";
    return "person-circle-outline";
  };

  /* ── render ──────────────────────────────────────────── */
  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      {/* TOP BAR */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: c.card, borderBottomColor: c.border },
        ]}
      >
        <View>
          <Text style={[styles.title, { color: c.text }]}>Asignar</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            Módulo → Rol
          </Text>
        </View>

        {/* BOTÓN ASIGNAR — solo visible si el rol tiene "Crear"*/}
        <Visibility action="Crear" selector="#menso">
          <TouchableOpacity
            onPress={handleAssign}
            disabled={saving || !selectedModuloId || !selectedRolId}
            style={[
              styles.addButton,
              {
                backgroundColor:
                  saving || !selectedModuloId || !selectedRolId
                    ? c.muted
                    : c.primary,
              },
            ]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="add" size={18} color="#fff" />
            )}
            <Text style={styles.addButtonText}>Asignar</Text>
          </TouchableOpacity>
        </Visibility>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/*SELECTORES — visibles con "Crear"*/}
        <Visibility action="Crear">
          <View
            style={[
              styles.selectorCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: c.textSecondary }]}>
              Selecciona módulo y rol para asignar
            </Text>
            <View style={styles.selectorRow}>
              <TouchableOpacity
                onPress={() => setModalModulo(true)}
                style={[
                  styles.selector,
                  { borderColor: c.border, backgroundColor: c.input },
                ]}
              >
                <Ionicons
                  name="grid-outline"
                  size={15}
                  color={c.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.selectorLabel, { color: c.textSecondary }]}
                  >
                    Módulo
                  </Text>
                  <Text
                    style={[styles.selectorValue, { color: c.text }]}
                    numberOfLines={1}
                  >
                    {selectedModulo?.modulo ?? "Seleccionar…"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={14} color={c.muted} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setModalRol(true)}
                style={[
                  styles.selector,
                  { borderColor: c.border, backgroundColor: c.input },
                ]}
              >
                <Ionicons
                  name="shield-outline"
                  size={15}
                  color={c.textSecondary}
                />
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.selectorLabel, { color: c.textSecondary }]}
                  >
                    Rol
                  </Text>
                  <Text
                    style={[styles.selectorValue, { color: c.text }]}
                    numberOfLines={1}
                  >
                    {selectedRol?.rol ?? "Seleccionar…"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={14} color={c.muted} />
              </TouchableOpacity>
            </View>
          </View>
        </Visibility>

        {/* TABLA */}
        {/*TABLA COMPLETA — visible con "Ver"*/}
        <Visibility action="Ver">
          <View
            style={[
              styles.tableCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            {/* Cabecera verde */}
            <View style={[styles.tableHead, { backgroundColor: c.primary }]}>
              <Text style={[styles.thId, { color: "#fff" }]}># ID</Text>
              <Text style={[styles.thRol, { color: "#fff" }]}>Rol</Text>
              <Text style={[styles.thModulos, { color: "#fff" }]}>
                Resumen de Módulos
              </Text>
            </View>

            {loading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color={c.primary} />
              </View>
            ) : rolGroups.length === 0 ? (
              <View style={styles.center}>
                <Ionicons name="shield-outline" size={42} color={c.muted} />
                <Text style={{ color: c.textSecondary, marginTop: 10 }}>
                  No hay módulos asignados a roles.
                </Text>
              </View>
            ) : (
              <FlatList
                data={rolGroups}
                keyExtractor={(item) => String(item.id_rol)}
                scrollEnabled={false}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.tableRow,
                      {
                        borderBottomColor: c.border,
                        backgroundColor:
                          index % 2 === 0 ? c.card : c.backgroundSecondary,
                      },
                    ]}
                  >
                    {/* # */}
                    <Text style={[styles.tdId, { color: c.textSecondary }]}>
                      {index + 1}
                    </Text>

                    {/* Rol */}
                    <View style={styles.tdRol}>
                      <Ionicons
                        name={rolIcon(item.nombre_rol)}
                        size={18}
                        color={c.textSecondary}
                      />
                      <Text
                        style={[styles.rolName, { color: c.text }]}
                        numberOfLines={2}
                      >
                        {item.nombre_rol}
                      </Text>
                    </View>

                    {/* Badges con X integrada */}
                    <View style={styles.tdModulos}>
                      <View style={styles.badgesWrap}>
                        {item.modulos.map((mod, mi) => {
                          const col = badgeColor(mi);
                          return (
                            <View
                              key={String(mod.id_modulo)}
                              style={[
                                styles.badge,
                                {
                                  backgroundColor: col.bg,
                                  borderColor: col.border,
                                },
                              ]}
                            >
                              <Ionicons
                                name={resolveIcon(mod.icono)}
                                size={11}
                                color={col.text}
                              />
                              <Text
                                style={[styles.badgeText, { color: col.text }]}
                              >
                                {mod.nombre.toUpperCase()}
                              </Text>
                              {/* ═══════════════════════════════════════════════
                                  BOTÓN ELIMINAR (X) — solo visible con "Eliminar"
                                  ═══════════════════════════════════════════════ */}
                              <Visibility action="Eliminar">
                                <TouchableOpacity
                                  onPress={() =>
                                    askDelete(
                                      mod.id_modulo,
                                      item.id_rol,
                                      mod.nombre,
                                      item.nombre_rol,
                                    )
                                  }
                                  hitSlop={{
                                    top: 6,
                                    bottom: 6,
                                    left: 4,
                                    right: 6,
                                  }}
                                  style={[
                                    styles.badgeX,
                                    { backgroundColor: col.border },
                                  ]}
                                >
                                  <Ionicons
                                    name="close"
                                    size={10}
                                    color={col.text}
                                  />
                                </TouchableOpacity>
                              </Visibility>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  </View>
                )}
              />
            )}

            {/* Footer */}
            {rolGroups.length > 0 && (
              <View style={[styles.tableFooter, { borderTopColor: c.border }]}>
                <Text style={[styles.footerText, { color: c.textSecondary }]}>
                  Mostrando 1 to {rolGroups.length} of {rolGroups.length}{" "}
                  registros
                </Text>
              </View>
            )}
          </View>
        </Visibility>
      </ScrollView>

      {/* MODAL CONFIRMACIÓN ELIMINAR */}
      <ConfirmModal
        state={confirm}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        saving={saving}
      />

      {/* MODALES SELECCIÓN */}
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
        searchPlaceholder="Buscar módulo…"
      />
      <EntitySelectModal
        visible={modalRol}
        title="Seleccionar rol"
        items={roles}
        selectedId={selectedRolId}
        onClose={() => setModalRol(false)}
        onSelect={(item) => {
          setSelectedRolId(item.id);
          setModalRol(false);
        }}
        getLabel={(item) => item.rol}
        getSubtitle={(item) => item.descripcion ?? undefined}
        emptyText="No hay roles registrados"
        searchPlaceholder="Buscar rol…"
      />
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────
   Estilos
───────────────────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1 },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  content: { padding: 14, gap: 14, paddingBottom: 30 },

  selectorCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 10,
  },
  sectionLabel: { fontSize: 12, fontWeight: "600" },
  selectorRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  selector: {
    flex: 1,
    minWidth: 200,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  selectorLabel: { fontSize: 10, fontWeight: "700" },
  selectorValue: { fontSize: 13, fontWeight: "700" },

  tableCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 13,
    gap: 8,
  },
  thId: { width: 36, fontSize: 12, fontWeight: "700" },
  thRol: { width: 130, fontSize: 12, fontWeight: "700" },
  thModulos: { flex: 1, fontSize: 12, fontWeight: "700" },

  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  tdId: { width: 36, fontSize: 13, fontWeight: "700", paddingTop: 6 },
  tdRol: {
    width: 130,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 4,
    flexShrink: 0,
  },
  rolName: { fontSize: 13, fontWeight: "700", flexShrink: 1 },

  tdModulos: { flex: 1 },
  badgesWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },

  /* Badge con X integrada a la derecha */
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingLeft: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  badgeX: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
    marginRight: 3,
  },

  tableFooter: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  footerText: { fontSize: 12 },

  center: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
});
