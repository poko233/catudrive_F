// animations/haptics.ts
import * as Haptics from "expo-haptics";

/**
 * Wrappers de retroalimentación háptica.
 *
 * USO:
 * - Ligero → botones, toggles, selección de checkbox.
 * - Medio → confirmaciones (submit, guardar).
 * - Pesado → acciones destructivas o errores.
 * - Selección → cambio en picker/datepicker.
 *
 * En web (cuando no hay soporte háptico) estas funciones
 * simplemente no hacen nada (expo-haptics maneja el fallback).
 */

export const haptics = {
  /** Toque suave: navegación, press de botón estándar. */
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  /** Toque medio: submit, guardar, confirmar. */
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  /** Toque fuerte: acciones destructivas, error. */
  heavy: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  /** Vibración de selección: cambio de opción en picker/switch. */
  selection: () => {
    Haptics.selectionAsync();
  },

  /** Notificación de éxito. */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  /** Notificación de advertencia. */
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  /** Notificación de error. */
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
