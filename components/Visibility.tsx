// components/Visibility.tsx

import { usePathname } from "expo-router";
import React from "react";
import { View, type ViewProps } from "react-native";
import { useVisibilityStore } from "../store/visibilityStore";

/**
 * ──────────────────────────────────────────────────
 * PROPS DEL COMPONENTE Visibility
 * ──────────────────────────────────────────────────
 */
interface VisibilityProps extends ViewProps {
  /**
   * Selector CSS que identifica al elemento.
   * Debe coincidir exactamente con el valor guardado en
   * el backend, dentro de `selectores_ocultos` para el
   * formulario correspondiente.
   *
   * @example ".panel-estadisticas"
   * @example "#boton-eliminar"
   */
  selector?: string;

  /**
   * Acción concreta que se desea controlar.
   * Valores permitidos: "Ver", "Crear", "Editar", "Eliminar".
   *
   * Si la acción no aparece en el array `acciones` que el
   * backend devuelve para la ruta actual, el contenido se
   * oculta automáticamente (no se renderiza).
   *
   * @example action="Crear"
   * @example action="Eliminar"
   */
  action?: string;

  /** Contenido que se mostrará u ocultará según las reglas. */
  children: React.ReactNode;
}

/**
 * ──────────────────────────────────────────────────
 * COMPONENTE Visibility
 * ──────────────────────────────────────────────────
 *
 * ##  Propósito
 * Ocultar condicionalmente elementos de la interfaz según
 * las reglas de visibilidad definidas en el backend, sin
 * necesidad de escribir lógica condicional (if/else) en
 * cada componente.
 *
 * ##  Comportamiento
 * El componente consulta dos fuentes:
 * 1. **Por acción** → `visibilityStore.routeActions` para
 *    la ruta actual. Si la acción no está permitida, el
 *    componente retorna `null` y no renderiza nada.
 * 2. **Por selector** → `visibilityStore.formHiddenSelectors`
 *    para el formulario correspondiente a la ruta actual.
 *    Si el selector aparece en el conjunto de ocultos,
 *    retorna `null`.
 *
 * Si no se especifica ni `action` ni `selector`, el
 * componente simplemente funciona como un `<View>` normal.
 *
 * ##  Ventajas
 * - Cero configuración por pantalla.
 * - Funciona automáticamente con cualquier ruta gracias a
 *   `usePathname()` de Expo Router.
 * - No requiere hooks adicionales ni lógica condicional
 *   manual.
 * - Respeta los permisos RBAC sin esfuerzo.
 * - Se integra con NativeWind (acepta `className` y `style`).
 * - Seguro por defecto: si no hay datos en el store, se
 *   muestra el contenido.
 *
 * ##  Cuándo NO usar Visibility
 * - Para lógica de negocio que requiera más que mostrar/ocultar
 *   (por ejemplo, deshabilitar un botón en vez de ocultarlo).
 *   En ese caso, usa `usePermiso` o consulta el store
 *   manualmente.
 * - Para elementos que siempre deben mostrarse,
 *   independientemente de los permisos.
 * - Para controlar flujos de navegación o redirecciones;
 *   para eso ya existe `ProtectedRoute`.
 * - Si necesitas animaciones de entrada/salida al ocultar
 *   (el componente simplemente no se monta, no hay
 *   animación).
 *
 * ##  Ejemplos de uso
 *
 * ### Ocultar un botón según la acción
 * ```tsx
 * import Visibility from "@/components/Visibility";
 *
 * <Visibility action="Crear">
 *   <Button title="Nuevo registro" onPress={...} />
 * </Visibility>
 *
 * <Visibility action="Editar">
 *   <Button title="Editar" onPress={...} />
 * </Visibility>
 *
 * <Visibility action="Eliminar">
 *   <Button title="Eliminar" onPress={...} style={{ backgroundColor: 'red' }} />
 * </Visibility>
 * ```
 *
 * ### Ocultar una sección completa por selector CSS
 * ```tsx
 * <Visibility selector=".panel-estadisticas" style={styles.panel}>
 *   <Estadisticas />
 * </Visibility>
 * ```
 *
 * ### Combinar selector y acción (ambas condiciones deben cumplirse)
 * ```tsx
 * // Este componente solo se mostrará si el usuario tiene
 * // permiso de "Crear" Y el selector ".form-nuevo" no está
 * // en la lista de ocultos.
 * <Visibility action="Crear" selector=".form-nuevo">
 *   <FormularioCreacion />
 * </Visibility>
 * ```
 *
 * ##  Notas importantes
 * - Los selectores deben coincidir exactamente con los
 *   strings que el administrador guarda en el backend
 *   (respetando mayúsculas, puntos, almohadillas, etc.).
 * - Si la ruta actual no tiene datos en el store (por
 *   ejemplo, durante un cold start antes de cargar el
 *   sidebar), el componente muestra el contenido por
 *   seguridad.
 * - El componente **no** modifica estilos; simplemente
 *   no renderiza nada cuando corresponde. Si necesitas
 *   conservar el espacio del elemento oculto, usa un
 *   placeholder manual.
 *
 * ##  Integración con el sistema de permisos
 * Este componente reemplaza el uso de `usePermiso()` para
 * ocultar elementos visuales. Si un rol no tiene la acción,
 * el componente no se monta. Esto es complementario al
 * middleware `CheckPermission` del backend, que es la
 * verdadera barrera de seguridad.
 * @important EN CADA PAGINA/CRUD SIEMPRE DEBERIAN EXISTIR ALGUNA ACCION DE CREAR, EDITAR, ELIMINAR O VER, PARA QUE EL COMPONENTE Visibility FUNCIONE CORRECTAMENTE. ENTONCES NO OLVIDAR ADICIONAR LOS VISIBILTY DE ESTAS ACCIONES EN LAS PARTES IMPORTANTES DE LA PAGINA, COMO BOTONES DE CREAR, EDITAR, ELIMINAR, ETC.
 * @module Visibility
 */
export const Visibility: React.FC<VisibilityProps> = ({
  selector,
  action,
  children,
  style,
  ...rest
}) => {
  const pathname = usePathname();
  const { routeToFormId, formHiddenSelectors, routeActions } =
    useVisibilityStore();

  // Normalizar ruta actual: eliminar slash final y backslashes
  const currentRoute = pathname?.replace(/\\/g, "/").replace(/\/+$/, "") || "/";

  // ─── Verificar por selector ────────────────────────
  if (selector) {
    const formId = routeToFormId[currentRoute];
    if (formId) {
      const hiddenSet = formHiddenSelectors[formId];
      if (hiddenSet?.has(selector)) {
        return null; // Oculto por regla de visibilidad
      }
    }
    // Si no hay formId (ruta desconocida), asumimos visible
  }

  // ─── Verificar por acción ──────────────────────────
  if (action) {
    const allowedActions = routeActions[currentRoute];
    if (allowedActions) {
      if (!allowedActions.has(action)) {
        return null; // Oculto porque el rol no tiene esa acción
      }
    }
    // Si no hay datos de acciones para esa ruta, mostramos
  }

  // ─── Renderizado normal ────────────────────────────
  // Se comporta exactamente como un View, traspasando
  // cualquier prop de estilo o layout.
  return (
    <View style={style} {...rest}>
      {children}
    </View>
  );
};

export default Visibility;
