// screens/admin/roles/RolPermisosScreen.tsx

import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTheme } from "@/theme/useTheme";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { useConfirm } from "../../../../hooks/useConfirm";
import { moduloService } from "../../modulos/services/modulo.service";
import { Modulo } from "../../modulos/types/modulo.types";
import { rolService } from "../services/rol.service";
import { PermisoSync, Rol } from "../types/rol.types";

const ACCIONES = [
  { id: 1, label: "Ver" },
  { id: 2, label: "Crear" },
  { id: 3, label: "Editar" },
  { id: 4, label: "Eliminar" },
] as const;

type Props = {
  rol: Rol;
  onBack: () => void;
};

export function RolPermisosScreen({ rol, onBack }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const confirm = useConfirm();

  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [permisos, setPermisos] = useState<Record<number, Set<number>>>({});
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      moduloService.getAll(),
      rolService.getPermisos(rol.id),
    ])
      .then(([mods, rolPerms]) => {
        if (cancelled) return;

        const disponibles = mods.filter(
          (modulo) => (modulo.formularios?.length ?? 0) > 0,
        );

        const map: Record<number, Set<number>> = {};

        for (const modulo of rolPerms.permisos ?? []) {
          for (const formulario of modulo.formularios ?? []) {
            map[formulario.id_formulario] = new Set(
              formulario.acciones
                .map((accion) => accion.id_accion ?? accion.id ?? 0)
                .filter(Boolean),
            );
          }
        }

        setModulos(disponibles);
        setPermisos(map);
        setExpanded(disponibles[0] ? new Set([disponibles[0].id]) : new Set());
      })
      .catch((error) => {
        Toast.show({
          type: "error",
          text1: "Error al cargar permisos",
          text2: error.message,
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [rol.id]);

  const totalForms = useMemo(
    () => modulos.reduce((sum, m) => sum + (m.formularios?.length ?? 0), 0),
    [modulos],
  );

  const selectedForms = useMemo(
    () =>
      modulos.reduce(
        (sum, m) =>
          sum +
          (m.formularios ?? []).filter(
            (f) => (permisos[f.id]?.size ?? 0) > 0,
          ).length,
        0,
      ),
    [modulos, permisos],
  );

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggle = (formId: number, actionId: number) => {
    setChanged(true);

    setPermisos((prev) => {
      const current = new Set(prev[formId] ?? []);

      if (current.has(actionId)) {
        current.delete(actionId);
        if (actionId === 1) current.clear();
      } else {
        current.add(actionId);
        if (actionId !== 1) current.add(1);
      }

      return { ...prev, [formId]: current };
    });
  };

  const bulk = (moduloId: number, actions: number[]) => {
    const modulo = modulos.find((item) => item.id === moduloId);
    if (!modulo) return;

    setPermisos((prev) => {
      const next = { ...prev };

      for (const form of modulo.formularios ?? []) {
        next[form.id] = new Set(actions);
      }

      return next;
    });

    setChanged(true);
  };

  const buildPayload = (): PermisoSync[] =>
    modulos.flatMap((modulo) =>
      (modulo.formularios ?? [])
        .filter((form) => (permisos[form.id]?.size ?? 0) > 0)
        .map((form) => ({
          id_modulo: modulo.id,
          id_formulario: form.id,
          acciones: Array.from(permisos[form.id]),
        })),
    );

  const save = async () => {
    setSaving(true);

    try {
      await rolService.syncPermisos(rol.id, buildPayload());

      Toast.show({
        type: "success",
        text1: "Permisos guardados correctamente",
      });
         
      setChanged(false);
      onBack();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "No se pudieron guardar los permisos",
        text2: error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const back = async () => {
    if (!changed) {
      onBack();
      return;
    }

    const ok = await confirm({
      title: "Cambios sin guardar",
      message: "¿Quieres salir sin guardar los cambios?",
      variant: "warning",
      confirmText: "Salir sin guardar",
      cancelText: "Seguir editando",
    });

    if (ok) onBack();
  };

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        <View style={styles.loading}>
          <Skeleton width="45%" height={36} />
          <Skeleton width="100%" height={90} />
          <Skeleton width="100%" height={140} />
          <Skeleton width="100%" height={140} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <IconButton
          icon={ArrowLeft}
          variant="secondary"
          accessibilityLabel="Volver a roles"
          onPress={back}
        />

        <View style={styles.headerText}>
          <ThemedText style={styles.title}>{rol.rol}</ThemedText>
          <ThemedText
            numberOfLines={1}
            style={{ color: c.textSecondary, fontSize: 12 }}
          >
            {rol.descripcion || "Configuración de permisos"}
          </ThemedText>
        </View>

        {changed && <Badge label="Sin guardar" variant="warning" />}

        <Button
          title="Guardar"
          loading={saving}
          disabled={saving}
          onPress={save}
        />
      </View>

      <View
        style={[
          styles.summary,
          {
            backgroundColor: c.backgroundSecondary,
            borderBottomColor: c.border,
          },
        ]}
      >
        <ThemedText style={{ color: c.textSecondary }}>
          {selectedForms} de {totalForms} formularios con permisos
        </ThemedText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {modulos.length === 0 ? (
          <Card>
            <ThemedText style={{ color: c.textSecondary, textAlign: "center" }}>
              No hay módulos con formularios configurados.
            </ThemedText>
          </Card>
        ) : (
          modulos.map((modulo) => {
            const open = expanded.has(modulo.id);
            const forms = modulo.formularios ?? [];
            const count = forms.filter(
              (f) => (permisos[f.id]?.size ?? 0) > 0,
            ).length;

            return (
              <Card key={modulo.id} padding={0} style={styles.module}>
                <Pressable
                  onPress={() => toggleExpand(modulo.id)}
                  style={styles.moduleHeader}
                >
                  <View style={styles.moduleInfo}>
                    <ThemedText style={styles.moduleName}>
                      {modulo.modulo}
                    </ThemedText>

                    <ThemedText
                      style={{ color: c.textSecondary, fontSize: 11 }}
                    >
                      {count}/{forms.length} formularios
                    </ThemedText>
                  </View>

                  {open ? (
                    <ChevronUp size={18} color={c.textMuted} />
                  ) : (
                    <ChevronDown size={18} color={c.textMuted} />
                  )}
                </Pressable>

                {open && (
                  <View style={[styles.moduleBody, { borderTopColor: c.border }]}>
                    <View style={styles.bulk}>
                      <Button
                        title="Solo ver"
                        variant="secondary"
                        onPress={() => bulk(modulo.id, [1])}
                      />
                      <Button
                        title="Marcar todo"
                        variant="secondary"
                        onPress={() => bulk(modulo.id, [1, 2, 3, 4])}
                      />
                      <Button
                        title="Limpiar"
                        variant="ghost"
                        onPress={() => bulk(modulo.id, [])}
                      />
                    </View>

                    {forms.map((form) => (
                      <View
                        key={form.id}
                        style={[styles.formRow, { borderTopColor: c.border }]}
                      >
                        <ThemedText style={styles.formName}>
                          {form.formulario}
                        </ThemedText>

                        <View style={styles.actions}>
                          {ACCIONES.map((action) => {
                            const checked =
                              permisos[form.id]?.has(action.id) ?? false;

                            return (
                              <PermissionToggle
                                key={action.id}
                                label={action.label}
                                checked={checked}
                                onPress={() => toggle(form.id, action.id)}
                              />
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function PermissionToggle({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[
        styles.permission,
        {
          backgroundColor: checked ? c.primary : c.backgroundSecondary,
          borderColor: checked ? c.primary : c.border,
        },
      ]}
    >
      <ThemedText
        style={{
          color: checked ? c.primaryForeground : c.textSecondary,
          fontSize: 10,
          fontWeight: "700",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  loading: {
    padding: 18,
    gap: 12,
  },
  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 17,
    fontWeight: "900",
  },
  summary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  list: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    padding: 14,
    gap: 10,
    paddingBottom: 40,
  },
  module: {
    overflow: "hidden",
  },
  moduleHeader: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  moduleInfo: {
    flex: 1,
    gap: 3,
  },
  moduleName: {
    fontSize: 14,
    fontWeight: "900",
  },
  moduleBody: {
    borderTopWidth: 1,
  },
  bulk: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
  },
  formRow: {
    minHeight: 62,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  formName: {
    flex: 1,
    minWidth: 180,
    fontSize: 13,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  permission: {
    minWidth: 58,
    minHeight: 34,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 9,
    borderWidth: 1,
    borderRadius: 9,
  },
});
