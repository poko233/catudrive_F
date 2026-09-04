import { AppTheme } from "./types";

// ==========================================
// TEMA OSCURO (Taxi - Amarillo)
// ==========================================
export const darkTheme: AppTheme = {
  name: "dark",
  dark: true,
  colors: {
    background: "#0D0D0D",
    backgroundSecondary: "#1A1A1A",
    backgroundTertiary: "#262626",

    text: "#FFFFFF",
    textSecondary: "#B3B3B3",
    textTertiary: "#808080",
    textMuted: "#666666",
    textInverse: "#0D0D0D",

    primary: "#FFC107",
    primaryHover: "#FFCA28",
    primaryActive: "#FFA000",
    primaryForeground: "#0D0D0D",
    primarySubtle: "rgba(255, 193, 7, 0.15)",

    secondary: "#333333",
    secondaryHover: "#424242",
    secondaryActive: "#262626",
    secondaryForeground: "#FFFFFF",

    accent: "#FFD700",
    accentForeground: "#0D0D0D",

    success: "#4CAF50",
    successForeground: "#FFFFFF",
    warning: "#FF9800",
    warningForeground: "#FFFFFF",
    destructive: "#F44336",
    destructiveHover: "#D32F2F",
    destructiveForeground: "#FFFFFF",
    info: "#2196F3",
    infoForeground: "#FFFFFF",

    card: "#1A1A1A",
    cardHover: "#262626",
    modal: "#242424",
    popover: "#1A1A1A",
    drawer: "#1A1A1A",

    border: "#333333",
    borderHover: "#444444",
    divider: "#2A2A2A",

    input: "#1A1A1A",
    inputBorder: "#333333",
    inputHover: "#555555",
    inputFocusRing: "rgba(255, 193, 7, 0.4)",

    disabled: "#2A2A2A",
    disabledForeground: "#555555",
    muted: "#777777",

    shadow: "rgba(0, 0, 0, 0.8)",
    overlay: "rgba(0, 0, 0, 0.75)",
    gradient: ["#FFC107", "#FFA000"],
  },
};

// ==========================================
// TEMA CLARO (Taxi - Amarillo)
// ==========================================
export const lightTheme: AppTheme = {
  name: "light",
  dark: false,
  colors: {
    background: "#F8F9FA",
    backgroundSecondary: "#FFFFFF",
    backgroundTertiary: "#F1F3F5",

    text: "#212529",
    textSecondary: "#495057",
    textTertiary: "#6C757D",
    textMuted: "#ADB5BD",
    textInverse: "#FFFFFF",

    primary: "#FFC107",
    primaryHover: "#FFCA28",
    primaryActive: "#FFA000",
    primaryForeground: "#FFFFFF",
    primarySubtle: "rgba(255, 193, 7, 0.12)",

    secondary: "#E9ECEF",
    secondaryHover: "#DEE2E6",
    secondaryActive: "#CED4DA",
    secondaryForeground: "#212529",

    accent: "#FFE082",
    accentForeground: "#3E2723",

    success: "#28A745",
    successForeground: "#FFFFFF",
    warning: "#FFC107",
    warningForeground: "#FFFFFF",
    destructive: "#DC3545",
    destructiveHover: "#C82333",
    destructiveForeground: "#FFFFFF",
    info: "#007BFF",
    infoForeground: "#FFFFFF",

    card: "#FFFFFF",
    cardHover: "#F8F9FA",
    modal: "#FFFFFF",
    popover: "#FFFFFF",
    drawer: "#FFFFFF",

    border: "#DEE2E6",
    borderHover: "#CED4DA",
    divider: "#E9ECEF",

    input: "#FFFFFF",
    inputBorder: "#CED4DA",
    inputHover: "#ADB5BD",
    inputFocusRing: "rgba(255, 193, 7, 0.3)",

    disabled: "#E9ECEF",
    disabledForeground: "#ADB5BD",
    muted: "#6C757D",

    shadow: "rgba(0, 0, 0, 0.08)",
    overlay: "rgba(33, 37, 41, 0.5)",
    gradient: ["#FFC107", "#FFA000"],
  },
};

// ==========================================
// TEMA OSCURO CELESTE (Nuevo)
// ==========================================
export const darkCelesteTheme: AppTheme = {
  name: "Celeste",
  dark: true,
  colors: {
    // Fondos: Azul muy oscuro (casi negro) con matices fríos
    background: "#0A0F1F",
    backgroundSecondary: "#151E2E",
    backgroundTertiary: "#1E2A3A",

    // Textos: Blanco y azules grisáceos
    text: "#F0F4FF",
    textSecondary: "#B0C4DE",
    textTertiary: "#8BA3C7",
    textMuted: "#6A7F9B",
    textInverse: "#0A0F1F",

    // Primario: Azul celeste brillante
    primary: "#38BDF8",
    primaryHover: "#60CFFF",
    primaryActive: "#0EA5E9",
    primaryForeground: "#0A0F1F",
    primarySubtle: "rgba(56, 189, 248, 0.15)",

    // Secundario: Azul grisáceo oscuro
    secondary: "#1A2A3A",
    secondaryHover: "#253A4A",
    secondaryActive: "#15202A",
    secondaryForeground: "#F0F4FF",

    // Acento: Azul eléctrico para detalles
    accent: "#7DD3FC",
    accentForeground: "#0A0F1F",

    // Estados de feedback
    success: "#34D399",
    successForeground: "#064E3B",
    warning: "#FBBF24",
    warningForeground: "#451A03",
    destructive: "#F87171",
    destructiveHover: "#EF4444",
    destructiveForeground: "#450A0A",
    info: "#60A5FA",
    infoForeground: "#082F49",

    // Contenedores
    card: "#151E2E",
    cardHover: "#1E2A3A",
    modal: "#111A28",
    popover: "#151E2E",
    drawer: "#151E2E",

    // Bordes y Divisores
    border: "#1E2A3A",
    borderHover: "#2A3A4A",
    divider: "#151E2E",

    // Inputs
    input: "#0A0F1F",
    inputBorder: "#1E2A3A",
    inputHover: "#2A3A4A",
    inputFocusRing: "rgba(56, 189, 248, 0.4)",

    // Deshabilitados
    disabled: "#1A2A3A",
    disabledForeground: "#5A6A7A",
    muted: "#5A6A7A",

    // Sombras y Overlays
    shadow: "rgba(0, 0, 0, 0.8)",
    overlay: "rgba(0, 0, 0, 0.75)",
    gradient: ["#38BDF8", "#0284C7"],
  },
};

// ==========================================
// EXPORTACIÓN DE TEMAS
// ==========================================
export const themes: Record<string, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
  Celeste: darkCelesteTheme,
};
