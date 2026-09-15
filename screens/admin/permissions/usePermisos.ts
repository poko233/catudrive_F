// screens/admin/permisos/usePermisos.ts
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import Toast from "react-native-toast-message";
import { useModulesStore } from "../../../store/modulesStore";
import { adminService } from "../services/admin.service";
import { moduloService } from "../modulos/services/modulo.service";
import { rolService } from "../rol/services/rol.service";
import { visibilityService } from "./services/visibility.service";
import type { Formulario, Modulo } from "../modulos/types/modulo.types";
import type { RolConPermisos } from "../rol/types/rol.types";
import type { AdminFormulario } from "../types/admin.types";
import type { MatrizTodos, PermisoSync } from "./types";

// ─── Helpers puros ───────────────────────────────────────────────────────────

export function clonarMatriz(m: MatrizTodos): MatrizTodos {
  const out: MatrizTodos = {};
  for (const ridStr in m) {
    const rid = Number(ridStr);
    out[rid] = {};
    for (const fidStr in m[rid]) {
      out[rid][Number(fidStr)] = new Set(m[rid][Number(fidStr)]);
    }
  }
  return out;
}

export function matricesIguales(a: MatrizTodos, b: MatrizTodos): boolean {
  const ridsA = Object.keys(a).map(Number);
  const ridsB = Object.keys(b).map(Number);
  if (ridsA.length !== ridsB.length) return false;
  for (const rid of ridsA) {
    const fidsA = Object.keys(a[rid] ?? {}).map(Number);
    const fidsB = Object.keys(b[rid] ?? {}).map(Number);
    if (fidsA.length !== fidsB.length) return false;
    for (const fid of fidsA) {
      const sa = a[rid][fid];
      const sb = b[rid]?.[fid];
      if (!sb || sa.size !== sb.size) return false;
      for (const v of sa) if (!sb.has(v)) return false;
    }
  }
  return true;
}

export function rolesPermisosAMatriz(
  rolesConPermisos: RolConPermisos[],
): MatrizTodos {
  const m: MatrizTodos = {};
  for (const rol of rolesConPermisos) {
    m[rol.id] = {};
    for (const modulo of rol.permisos ?? []) {
      for (const form of modulo.formularios ?? []) {
        m[rol.id][form.id_formulario] = new Set(
          form.acciones
            .map((a) => a.id_accion ?? (a as any).id ?? 0)
            .filter(Boolean),
        );
      }
    }
  }
  return m;
}

export function enriquecerModulos(
  modulosData: Modulo[],
  todosFormularios: AdminFormulario[],
): Modulo[] {
  const formsPorModulo = new Map<number, Formulario[]>();
  for (const f of todosFormularios) {
    for (const mod of f.modulos ?? []) {
      if (!formsPorModulo.has(mod.id)) formsPorModulo.set(mod.id, []);
      formsPorModulo.get(mod.id)!.push({
        id: f.id,
        formulario: f.formulario,
        descripcion: f.descripcion,
        ruta: f.ruta,
        estado: f.estado,
      });
    }
  }
  return modulosData.map((m): Modulo => {
    if (m.formularios && m.formularios.length > 0) return m;
    const forms = formsPorModulo.get(m.id);
    return forms?.length ? { ...m, formularios: forms } : m;
  });
}

// ─── Hook principal ───────────────────────────────────────────────────────────

export function usePermisos() {
  const [roles, setRoles] = useState<RolConPermisos[]>([]);
  const [modulos, setModulos] = useState<Modulo[]>([]);
  const [matriz, setMatriz] = useState<MatrizTodos>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  // ── Selectores de visibilidad ──────────────────────────────────────────
  // Mapa: id_rol -> id_formulario -> array de { id: number, selector: string }
  const [initialSelectoresMap, setInitialSelectoresMap] = useState<
    Record<number, Record<number, { id: number; selector: string }[]>>
  >({});

  // Mapa: id_rol -> id_formulario -> texto del input (selectores separados por coma)
  const [selectoresText, setSelectoresText] = useState<
    Record<number, Record<number, string>>
  >({});

  // Para calcular cambios, guardamos el texto inicial
  const [initialSelectoresText, setInitialSelectoresText] = useState<
    Record<number, Record<number, string>>
  >({});

  const matrizInicialRef = useRef<MatrizTodos>({});
  const canceladoRef = useRef(false);

  // ── Carga inicial ────────────────────────────────────────────────────────
  const cargar = useCallback(async () => {
    canceladoRef.current = false;
    setLoading(true);
    setMatriz({});
    matrizInicialRef.current = {};
    setSelectoresText({});
    setInitialSelectoresText({});
    setInitialSelectoresMap({});

    try {
      const [
        rolesConPermisos,
        modulosData,
        todosFormularios,
        reglasVisibilidad,
      ] = await Promise.all([
        rolService.getAllConPermisos(),
        moduloService.getAll(),
        adminService.getFormularios(),
        visibilityService.getAll(),
      ]);

      if (canceladoRef.current) return;

      const nuevaMatriz = rolesPermisosAMatriz(rolesConPermisos);

      const modulosEnriquecidos = enriquecerModulos(
        modulosData,
        todosFormularios,
      );
      const modulosConForms = modulosEnriquecidos.filter(
        (m) => (m.formularios?.length ?? 0) > 0,
      );

      setRoles(rolesConPermisos);
      setModulos(
        modulosConForms.length > 0 ? modulosConForms : modulosEnriquecidos,
      );
      setMatriz(nuevaMatriz);

      // Construir mapas iniciales de selectores (solo habilitado = false)
      const initMap: Record<
        number,
        Record<number, { id: number; selector: string }[]>
      > = {};
      const initText: Record<number, Record<number, string>> = {};

      for (const regla of reglasVisibilidad) {
        if (!regla.habilitado) {
          const { id_rol, id_formulario, id, selector_html } = regla;
          if (!initMap[id_rol]) initMap[id_rol] = {};
          if (!initMap[id_rol][id_formulario])
            initMap[id_rol][id_formulario] = [];
          initMap[id_rol][id_formulario].push({ id, selector: selector_html });
        }
      }

      // Convertir a textos con comas
      for (const rolId in initMap) {
        for (const formId in initMap[rolId]) {
          if (!initText[Number(rolId)]) initText[Number(rolId)] = {};
          const selectors = initMap[rolId][formId].map((s) => s.selector);
          initText[Number(rolId)][Number(formId)] = selectors.join(", ");
        }
      }

      setInitialSelectoresMap(initMap);
      setInitialSelectoresText(initText);
      setSelectoresText(structuredClone(initText)); // copia profunda para estado actual

      matrizInicialRef.current = clonarMatriz(nuevaMatriz);
    } catch (err: any) {
      if (!canceladoRef.current) {
        Toast.show({
          type: "error",
          text1: "Error al cargar permisos",
          text2: err?.message,
        });
      }
    } finally {
      if (!canceladoRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    return () => {
      canceladoRef.current = true;
    };
  }, [cargar]);

  // ── Toggle de checkbox ─────────────────────────────────────────────────
  function toggle(idRol: number, idFormulario: number, idAccion: number) {
    setMatriz((prev) => {
      const next = clonarMatriz(prev);
      if (!next[idRol]) next[idRol] = {};
      const set = new Set(next[idRol][idFormulario] ?? []);

      if (set.has(idAccion)) {
        set.delete(idAccion);
        if (idAccion === 1) set.clear();
      } else {
        set.add(idAccion);
        if (idAccion !== 1) set.add(1);
      }
      next[idRol][idFormulario] = set;
      return next;
    });
  }

  // ── Cambio en el input de selectores ────────────────────────────────────
  const handleSelectorChange = useCallback(
    (idRol: number, idFormulario: number, text: string) => {
      setSelectoresText((prev) => {
        const newState = { ...prev };
        if (!newState[idRol]) newState[idRol] = {};
        newState[idRol] = { ...newState[idRol], [idFormulario]: text };
        return newState;
      });
    },
    [],
  );

  // ── Guardar cambios (permisos + selectores) ──────────────────────────────
  async function guardar() {
    setSaving(true);
    try {
      // 1. Permisos
      const rolesModificados = roles.filter((r) => {
        const a = matriz[r.id] ?? {};
        const b = matrizInicialRef.current[r.id] ?? {};
        return !matricesIguales({ [r.id]: a }, { [r.id]: b });
      });

      const rolesFallidos: { id: number; nombre: string; mensaje: string }[] =
        [];
      if (rolesModificados.length > 0) {
        // Secuencial: un PUT por rol, uno después del otro,
        // para no colapsar al backend (sin Promise.all).
        // Si un rol falla, se continúa con los siguientes.
        for (const rol of rolesModificados) {
          const permisos: PermisoSync[] = [];
          for (const modulo of modulos) {
            for (const form of modulo.formularios ?? []) {
              const acciones = [...(matriz[rol.id]?.[form.id] ?? [])];
              if (acciones.length > 0) {
                permisos.push({
                  id_modulo: modulo.id,
                  id_formulario: form.id,
                  acciones,
                });
              }
            }
          }
          try {
            await rolService.syncPermisos(rol.id, permisos);
            // Solo los roles OK se marcan como guardados,
            // para que el fallido siga apareciendo como cambio pendiente.
            matrizInicialRef.current[rol.id] = clonarMatriz({
              [rol.id]: matriz[rol.id] ?? {},
            })[rol.id];
          } catch (err: any) {
            rolesFallidos.push({
              id: rol.id,
              nombre: rol.rol,
              mensaje: err?.message ?? "Error desconocido",
            });
          }
        }
      }

      // 2. Selectores
      const selectorChanges: {
        id_rol: number;
        id_formulario: number;
        toDelete: number[];
        toCreate: string[];
      }[] = [];

      const allRolIds = new Set([
        ...Object.keys(selectoresText).map(Number),
        ...Object.keys(initialSelectoresText).map(Number),
      ]);
      for (const idRol of allRolIds) {
        const currentFormMap = selectoresText[idRol] ?? {};
        const initialFormMap = initialSelectoresText[idRol] ?? {};
        const allFormIds = new Set([
          ...Object.keys(currentFormMap).map(Number),
          ...Object.keys(initialFormMap).map(Number),
        ]);
        for (const idFormulario of allFormIds) {
          const currentText = currentFormMap[idFormulario] ?? "";
          const initialText = initialFormMap[idFormulario] ?? "";
          if (currentText === initialText) continue;

          // Parsear textos a arrays
          const parseSelectors = (txt: string) =>
            txt
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0);
          const currentList = parseSelectors(currentText);
          const initialList = parseSelectors(initialText);

          // Selectores a crear (en current pero no en initial)
          const toCreate = currentList.filter((s) => !initialList.includes(s));
          // Selectores a eliminar (en initial pero no en current)
          const toDeleteSelectors = initialList.filter(
            (s) => !currentList.includes(s),
          );

          // Obtener IDs de los selectores a eliminar desde initialSelectoresMap
          const initialItems =
            initialSelectoresMap[idRol]?.[idFormulario] ?? [];
          const toDeleteIds = initialItems
            .filter((item) => toDeleteSelectors.includes(item.selector))
            .map((item) => item.id);

          if (toDeleteIds.length > 0 || toCreate.length > 0) {
            selectorChanges.push({
              id_rol: idRol,
              id_formulario: idFormulario,
              toDelete: toDeleteIds,
              toCreate,
            });
          }
        }
      }

      if (selectorChanges.length > 0) {
        // Procesar eliminaciones y creaciones
        await Promise.all(
          selectorChanges.map(async (change) => {
            // Eliminar
            if (change.toDelete.length > 0) {
              await Promise.all(
                change.toDelete.map((id) => visibilityService.remove(id)),
              );
            }
            // Crear
            if (change.toCreate.length > 0) {
              await Promise.all(
                change.toCreate.map((selector) =>
                  visibilityService.create(
                    change.id_rol,
                    change.id_formulario,
                    selector,
                  ),
                ),
              );
            }
          }),
        );

        // Refrescar el mapa inicial de selectores después de guardar
        // (volver a cargar todo para evitar inconsistencias)
        const nuevasReglas = await visibilityService.getAll();
        const nuevoMap: Record<
          number,
          Record<number, { id: number; selector: string }[]>
        > = {};
        const nuevoText: Record<number, Record<number, string>> = {};
        for (const regla of nuevasReglas) {
          if (!regla.habilitado) {
            if (!nuevoMap[regla.id_rol]) nuevoMap[regla.id_rol] = {};
            if (!nuevoMap[regla.id_rol][regla.id_formulario])
              nuevoMap[regla.id_rol][regla.id_formulario] = [];
            nuevoMap[regla.id_rol][regla.id_formulario].push({
              id: regla.id,
              selector: regla.selector_html,
            });
          }
        }
        for (const rolId in nuevoMap) {
          for (const formId in nuevoMap[rolId]) {
            if (!nuevoText[Number(rolId)]) nuevoText[Number(rolId)] = {};
            nuevoText[Number(rolId)][Number(formId)] = nuevoMap[rolId][formId]
              .map((s) => s.selector)
              .join(", ");
          }
        }
        setInitialSelectoresMap(nuevoMap);
        setInitialSelectoresText(nuevoText);
        setSelectoresText(structuredClone(nuevoText));
      }

      // 3. Refrescar módulos (sidebar) solo si hubo algún cambio
      if (rolesModificados.length > 0 || selectorChanges.length > 0) {
       await useModulesStore
  .getState()
  .refreshSidebar();
      }

      if (rolesFallidos.length > 0) {
        Toast.show({
          type: "error",
          text1: `Fallaron ${rolesFallidos.length} de ${rolesModificados.length} roles`,
          text2: rolesFallidos
            .map((f) => `${f.nombre}: ${f.mensaje}`)
            .join("\n"),
        });
      } else if (
        rolesModificados.length === 0 &&
        selectorChanges.length === 0
      ) {
        Toast.show({ type: "info", text1: "Sin cambios que guardar" });
      } else {
        Toast.show({
          type: "success",
          text1: "Cambios guardados correctamente",
        });
      }
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Error al guardar",
        text2: err?.message,
      });
    } finally {
      setSaving(false);
    }
  }

  // ── Detección de cambios ─────────────────────────────────────────────────
  const hayCambiosPermisos = !matricesIguales(matriz, matrizInicialRef.current);
  const hayCambiosSelectores = useMemo(() => {
    const allRolIds = new Set([
      ...Object.keys(selectoresText).map(Number),
      ...Object.keys(initialSelectoresText).map(Number),
    ]);
    for (const idRol of allRolIds) {
      const curForms = selectoresText[idRol] ?? {};
      const iniForms = initialSelectoresText[idRol] ?? {};
      const allFormIds = new Set([
        ...Object.keys(curForms).map(Number),
        ...Object.keys(iniForms).map(Number),
      ]);
      for (const idForm of allFormIds) {
        if ((curForms[idForm] ?? "") !== (iniForms[idForm] ?? "")) return true;
      }
    }
    return false;
  }, [selectoresText, initialSelectoresText]);

  const hayCambios = hayCambiosPermisos || hayCambiosSelectores;

  const rolesFiltrados = search.trim()
    ? roles.filter((r) => r.rol.toLowerCase().includes(search.toLowerCase()))
    : roles;

  return {
    // datos
    roles,
    rolesFiltrados,
    modulos,
    matriz,
    selectoresText,
    handleSelectorChange,
    // estados
    loading,
    saving,
    hayCambios,
    search,
    // acciones
    setSearch,
    toggle,
    guardar,
    recargar: cargar,
  };
}
