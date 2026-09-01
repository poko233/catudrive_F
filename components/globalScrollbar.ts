import { Platform } from "react-native";

export interface ScrollbarColors {
  background: string; // fondo del track (usaré background)
  thumb: string; // color base del thumb
  thumbHover: string; // thumb al pasar el mouse
}

const STYLE_ID = "global-scrollbar-styles";

/**
 * Inyecta/actualiza los estilos del scrollbar web con los colores del tema.
 * Llámala cada vez que cambie el tema (ya se hace desde AppContent).
 */
export const injectGlobalScrollbar = (colors: ScrollbarColors) => {
  if (Platform.OS !== "web" || typeof document === "undefined") return;

  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null;

  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: ${colors.background};
    }

    ::-webkit-scrollbar-thumb {
      background-color: ${colors.thumb};
      border-radius: 10px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: ${colors.thumbHover};
    }

    ::-webkit-scrollbar-corner {
      background: transparent;
    }
  `;
};
