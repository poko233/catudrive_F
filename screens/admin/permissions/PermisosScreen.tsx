// screens/admin/permisos/PermisosScreen.tsx
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useConfirm } from "../../../hooks/useConfirm";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";
import { EmptyState } from "../../../components/ui/EmptyState";
import { SearchBar } from "../../../components/ui/SearchBar";
import { SkeletonRolCard } from "../../../components/ui/Skeleton";
import { TabBar } from "../../../components/ui/TabBar";
import { useTheme } from "../../../theme/useTheme";
import { Modulo } from "../modulos/types/modulo.types";
import { RolConPermisos } from "../rol/types/rol.types";
import { usePermisos } from "./usePermisos";
import type { MatrizTodos } from "./types";

const ACCIONES = [
  { id: 1, label: "Ver", color: "#3B82F6" },
  { id: 2, label: "Crear", color: "#10B981" },
  { id: 3, label: "Editar", color: "#F59E0B" },
  { id: 4, label: "Elim.", color: "#EF4444" },
] as const;

const AVATAR_COLORS = [
  "#D32F2F",
  "#1976D2",
  "#388E3C",
  "#F57C00",
  "#7B1FA2",
  "#0097A7",
  "#C2185B",
  "#5D4037",
];

function initials(nombre: string): string {
  return nombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ── Tarjeta de un rol ─────────────────────────────────────────────────────
interface RolCardProps {
  rol: RolConPermisos;
  index: number;
  modulo: Modulo;
  matriz: MatrizTodos;
  onToggle: (idRol: number, idFormulario: number, idAccion: number) => void;
  selectoresText: Record<number, Record<number, string>>;
  onSelectorChange: (idRol: number, idFormulario: number, text: string) => void;
}

function RolPermisosCard({
  rol,
  index,
  modulo,
  matriz,
  onToggle,
  selectoresText,
  onSelectorChange,
}: RolCardProps) {
  const { theme } = useTheme();
  const c = theme.colors;

  const forms = modulo.formularios ?? [];
  const rolMatriz = matriz[rol.id] ?? {};
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const isActivo = rol.estado === "Activo";

  const formsConPermisos = forms.filter((f) => {
    const s = rolMatriz[f.id];
    return s && s.size > 0;
  }).length;

  return (
    <View
      style={[
        styles.rolCard,
        { backgroundColor: c.card, borderColor: c.border },
      ]}
    >
      {/* Header */}
      <View style={[styles.rolHeader, { borderBottomColor: c.border }]}>
        <Avatar initials={initials(rol.rol)} color={color} size={38} />
        <View style={styles.rolInfo}>
          <Text style={[styles.rolName, { color: c.text }]} numberOfLines={1}>
            {rol.rol}
          </Text>
          <Text style={[styles.rolCounter, { color: c.textMuted }]}>
            {formsConPermisos}/{forms.length} formularios con permisos
          </Text>
        </View>
        <Badge
          label={isActivo ? "Activo" : "Inactivo"}
          variant={isActivo ? "success" : "muted"}
        />
      </View>

      {/* Tabla */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={{ flex: 1, width: "100%", paddingRight: 16 }}>
          <View
            style={[
              styles.colRow,
              {
                borderBottomColor: c.border,
                backgroundColor: c.backgroundSecondary,
              },
            ]}
          >
            <Text style={[styles.colForm, { color: c.textMuted }]}>
              FORMULARIO
            </Text>
            {ACCIONES.map((a) => (
              <Text key={a.id} style={[styles.colAction, { color: a.color }]}>
                {a.label}
              </Text>
            ))}
            <Text style={[styles.colSelectores, { color: c.textMuted }]}>
              SELECTORES OCULTOS
            </Text>
          </View>
          {forms.length === 0 ? (
            <View style={styles.noForms}>
              <Text style={[styles.noFormsText, { color: c.textMuted }]}>
                Sin formularios en este módulo
              </Text>
            </View>
          ) : (
            forms.map((form, fi) => {
              const actions = rolMatriz[form.id] ?? new Set<number>();
              const currentSelectorText =
                selectoresText[rol.id]?.[form.id] ?? "";
              return (
                <View
                  key={form.id}
                  style={[
                    styles.formRow,
                    {
                      borderBottomColor: c.border,
                      backgroundColor:
                        fi % 2 === 1
                          ? c.backgroundSecondary + "88"
                          : "transparent",
                    },
                  ]}
                >
                  <Text
                    style={[styles.formName, { color: c.text }]}
                    numberOfLines={2}
                  >
                    {form.formulario}
                  </Text>
                  {ACCIONES.map((accion) => (
                    <View key={accion.id} style={styles.checkCell}>
                      <Checkbox
                        checked={actions.has(accion.id)}
                        onPress={() => onToggle(rol.id, form.id, accion.id)}
                        size={30}
                        color={accion.color}
                        accessibilityLabel={`${accion.label} — ${form.formulario} — ${rol.rol}`}
                      />
                    </View>
                  ))}
                  {/* Celda de selectores */}
                  <View style={styles.selectorCell}>
                    <TextInput
                      style={[
                        styles.selectorInput,
                        {
                          color: c.text,
                          backgroundColor: c.input,
                          borderColor: c.border,
                        },
                      ]}
                      value={currentSelectorText}
                      onChangeText={(text) =>
                        onSelectorChange(rol.id, form.id, text)
                      }
                      placeholder=".clase, #id"
                      placeholderTextColor={c.muted}
                      multiline={false}
                      numberOfLines={1}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────
export function PermisosScreen() {
  const { theme } = useTheme();
  const c = theme.colors;

  const confirm = useConfirm();
  const {
    rolesFiltrados,
    modulos,
    matriz,
    selectoresText,
    handleSelectorChange,
    loading,
    saving,
    hayCambios,
    search,
    setSearch,
    toggle,
    guardar,
    recargar,
  } = usePermisos();

  const modulosTabs = useMemo(
    () => modulos.map((m) => ({ key: String(m.id), label: m.modulo })),
    [modulos],
  );

  const [activeKey, setActiveKey] = useState("");

  const moduloActivo: Modulo | undefined = useMemo(() => {
    if (!modulos.length) return undefined;
    const key = activeKey || String(modulos[0].id);
    return modulos.find((m) => String(m.id) === key) ?? modulos[0];
  }, [modulos, activeKey]);

  async function handleCancelar() {
    if (!hayCambios) return;
    if (Platform.OS === "web") {
      if (globalThis.confirm?.("¿Descartar cambios?")) recargar();
      return;
    }
    const ok = await confirm({
      title: "Descartar cambios",
      message: "¿Quieres descartar los cambios no guardados?",
      variant: "warning",
      confirmText: "Descartar",
      cancelText: "Seguir editando",
    });
    if (ok) recargar();
  }

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <View
          style={[
            styles.skeletonHeader,
            { backgroundColor: c.card, borderBottomColor: c.border },
          ]}
        />
        <View style={{ padding: 12, gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <SkeletonRolCard key={i} />
          ))}
        </View>
      </View>
    );
  }

  if (modulos.length === 0) {
    return (
      <EmptyState
        icon="cube-outline"
        title="Sin módulos configurados"
        subtitle="Crea módulos con formularios para gestionar permisos."
      />
    );
  }

  const tabKey = activeKey || String(modulos[0].id);

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: c.card, borderBottomColor: c.border },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerTitle}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color={c.primary}
            />
            <Text style={[styles.title, { color: c.text }]}>
              Permisos por rol
            </Text>
          </View>
          <View style={styles.searchWrap}>
            <SearchBar
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar rol..."
            />
          </View>
        </View>
        {hayCambios && (
          <View
            style={[
              styles.banner,
              {
                backgroundColor: `${c.warning}18`,
                borderColor: `${c.warning}55`,
              },
            ]}
          >
            <Ionicons name="warning-outline" size={14} color={c.warning} />
            <Text style={[styles.bannerText, { color: c.warning }]}>
              Cambios sin guardar
            </Text>
          </View>
        )}
      </View>

      {/* Tabs módulos */}
      <TabBar
        tabs={modulosTabs}
        activeTab={tabKey}
        onTabChange={setActiveKey}
      />

      {/* Lista de roles */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {rolesFiltrados.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="Sin resultados"
            subtitle={`No hay roles que coincidan con "${search}".`}
          />
        ) : (
          moduloActivo &&
          rolesFiltrados.map((rol, i) => (
            <RolPermisosCard
              key={rol.id}
              rol={rol}
              index={i}
              modulo={moduloActivo}
              matriz={matriz}
              onToggle={toggle}
              selectoresText={selectoresText}
              onSelectorChange={handleSelectorChange}
            />
          ))
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { backgroundColor: c.card, borderTopColor: c.border },
        ]}
      >
        <Button
          title="Cancelar"
          variant="ghost"
          onPress={handleCancelar}
          disabled={!hayCambios || saving}
          style={styles.footerBtn}
        />
        <Button
          title="Guardar cambios"
          variant="primary"
          onPress={guardar}
          loading={saving}
          disabled={!hayCambios}
          style={styles.footerBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  skeletonHeader: { height: 60, borderBottomWidth: 1 },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 180,
  },
  title: { fontSize: 16, fontWeight: "800" },
  searchWrap: { minWidth: 180, maxWidth: 280, flex: 1 },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  bannerText: { fontSize: 12, fontWeight: "600" },
  list: { flex: 1 },
  listContent: { padding: 12, gap: 12, paddingBottom: 24 },

  rolCard: { borderWidth: 1, borderRadius: 16, overflow: "hidden" },
  rolHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
  },
  rolInfo: { flex: 1 },
  rolName: { fontSize: 15, fontWeight: "800" },
  rolCounter: { fontSize: 12, marginTop: 2 },

  noForms: { padding: 20, alignItems: "center" },
  noFormsText: { fontSize: 13 },

  colRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  colForm: { width: 160, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  colAction: {
    width: 56,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
  },
  colSelectores: {
    flex: 1,
    minWidth: 180,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
    textAlign: "left",
    paddingLeft: 8,
  },
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    minHeight: 48,
  },
  formName: {
    width: 160,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    paddingRight: 8,
  },
  checkCell: { width: 56, alignItems: "center" },
  selectorCell: {
    flex: 1,
    minWidth: 180,
    paddingHorizontal: 8,
  },
  selectorInput: {
    width: "100%",
    fontSize: 12,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    height: 30,
    textAlign: "left",
  },

  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
  },
  footerBtn: { minWidth: 140 },
});
