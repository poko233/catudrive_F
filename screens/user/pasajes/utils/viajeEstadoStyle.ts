// screens/user/pasajes/utils/viajeEstadoStyle.ts

import type { StyleProp, ViewStyle } from "react-native";

/*
|--------------------------------------------------------------------------
| COLOR SEMÁNTICO POR ESTADO DE VIAJE
|--------------------------------------------------------------------------
|
| Toda la fila (desktop) o toda la card (móvil) se tiñe
| según el estado, vía Table getRowStyle:
|
| Finalizado → grisáceo deshabilitado.
| Eliminado  → rojo (defensivo: el type no lo trae aún).
| Vendiendo  → verde.
| En curso   → azul.
|
*/

type ColoresMinimos = {
  success: string;
  info: string;
  destructive: string;
  textMuted: string;
};

function withAlpha(color: string, alphaHex: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return `${color}${alphaHex}`;
  }

  if (/^#[0-9A-Fa-f]{3}$/.test(color)) {
    const [r, g, b] = color.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}${alphaHex}`;
  }

  return color;
}

export function colorEstadoViaje(estado: string, c: ColoresMinimos): string {
  switch (estado) {
    case "Vendiendo":
      return c.success;
    case "En curso":
      return c.info;
    case "Eliminado":
      return c.destructive;
    case "Finalizado":
    default:
      return c.textMuted;
  }
}

export function estiloFilaViaje(
  estado: string,
  c: ColoresMinimos,
): StyleProp<ViewStyle> {
  const base = colorEstadoViaje(estado, c);

  return {
    backgroundColor: withAlpha(base, "1A"),
    borderLeftWidth: 4,
    borderLeftColor: base,
    opacity: estado === "Finalizado" ? 0.72 : 1,
  };
}
