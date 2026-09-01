import { AppTheme, ThemeName } from "./types";

// ==========================================
// TEMA CLARO (Institucional Clásico)
// ==========================================
export const lightTheme: AppTheme = {
  name: "light",
  dark: false,
  colors: {
    // AJUSTE: Gris ultra claro para que el contenedor blanco (rgba(255,255,255,0.9)) contraste y el shadow-2xl se note real
    background: "#F9FAFB",
    backgroundSecondary: "#F3F4F6",
    backgroundTertiary: "#E5E7EB",

    text: "#111827",
    textSecondary: "#4B5563",
    textTertiary: "#6B7280",
    textMuted: "#9CA3AF",
    textInverse: "#FFFFFF",

    primary: "#D32F2F",
    primaryHover: "#B71C1C",
    primaryActive: "#9A0007",
    primaryForeground: "#FFFFFF",
    primarySubtle: "#FFEBEE",

    secondary: "#E4E9E7",
    secondaryHover: "#374151",
    secondaryActive: "#111827",
    secondaryForeground: "#FFFFFF",

    accent: "#FACC15",
    accentForeground: "#713F12",

    success: "#10B981",
    successForeground: "#FFFFFF",
    warning: "#F59E0B",
    warningForeground: "#FFFFFF",
    destructive: "#EF4444",
    destructiveHover: "#DC2626",
    destructiveForeground: "#FFFFFF",
    info: "#3B82F6",
    infoForeground: "#FFFFFF",

    card: "#FFFFFF",
    cardHover: "#F9FAFB",
    modal: "#FFFFFF",
    popover: "#FFFFFF",
    drawer: "#FFFFFF",

    border: "#E5E7EB",
    borderHover: "#D1D5DB",
    divider: "#F3F4F6",

    input: "#FFFFFF",
    inputBorder: "#D1D5DB",
    inputHover: "#9CA3AF",
    inputFocusRing: "rgba(211, 47, 47, 0.2)",

    disabled: "#E5E7EB",
    disabledForeground: "#9CA3AF",
    // AJUSTE: Cambiado a gris legible porque tus pantallas usan este token para textos secundarios
    muted: "#6B7280",

    shadow: "rgba(0, 0, 0, 0.08)",
    overlay: "rgba(17, 24, 39, 0.5)",
    gradient: ["#D32F2F", "#9A0007"],
  },
};

// ==========================================
// TEMA OSCURO (Moderno y Ergonómico)
// ==========================================
export const darkTheme: AppTheme = {
  name: "dark",
  dark: true,
  colors: {
    background: "#0F172A",
    backgroundSecondary: "#1E293B",
    backgroundTertiary: "#334155",

    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textTertiary: "#94A3B8",
    textMuted: "#64748B",
    textInverse: "#FFFFFF",

    primary: "#EF4444",
    primaryHover: "#F87171",
    primaryActive: "#DC2626",
    primaryForeground: "#FFFFFF",
    primarySubtle: "rgba(239, 68, 68, 0.15)",

    secondary: "#334155",
    secondaryHover: "#475569",
    secondaryActive: "#1E293B",
    secondaryForeground: "#F8FAFC",

    accent: "#FDE047",
    accentForeground: "#422006",

    success: "#10B981",
    successForeground: "#FFFFFF",
    warning: "#F59E0B",
    warningForeground: "#FFFFFF",
    destructive: "#F43F5E",
    destructiveHover: "#E11D48",
    destructiveForeground: "#FFFFFF",
    info: "#38BDF8",
    infoForeground: "#FFFFFF",

    card: "#1E293B",
    cardHover: "#334155",
    modal: "#1E293B",
    popover: "#0F172A",
    drawer: "#1E293B",

    border: "#334155",
    borderHover: "#475569",
    divider: "#1E293B",

    input: "#0F172A",
    inputBorder: "#334155",
    inputHover: "#475569",
    inputFocusRing: "rgba(239, 68, 68, 0.3)",

    disabled: "#334155",
    disabledForeground: "#64748B",
    // AJUSTE: Cambiado a Slate 500 para evitar que el texto desaparezca en modo oscuro
    muted: "#64748B",

    shadow: "rgba(0, 0, 0, 0.5)",
    overlay: "rgba(0, 0, 0, 0.75)",
    gradient: ["#1E293B", "#0F172A"],
  },
};

// ==========================================
// TEMA PREMIUM (Elegancia Festiva / VIP)
// ==========================================
export const premiumTheme: AppTheme = {
  name: "premium",
  dark: true,
  colors: {
    background: "#2C0508",
    backgroundSecondary: "#4A0810",
    backgroundTertiary: "#660B16",

    text: "#FDF6E3",
    textSecondary: "#E2C78E",
    textTertiary: "#B89B66",
    textMuted: "#856A45",
    textInverse: "#2C0508",

    primary: "#D4AF37",
    primaryHover: "#F1D570",
    primaryActive: "#AA8C2C",
    primaryForeground: "#2C0508",
    primarySubtle: "rgba(212, 175, 55, 0.15)",

    secondary: "#660B16",
    secondaryHover: "#800E1D",
    secondaryActive: "#4A0810",
    secondaryForeground: "#FDF6E3",

    accent: "#E53935",
    accentForeground: "#FFFFFF",

    success: "#34D399",
    successForeground: "#022C22",
    warning: "#FBBF24",
    warningForeground: "#451A03",
    destructive: "#F87171",
    destructiveHover: "#EF4444",
    destructiveForeground: "#450A0A",
    info: "#7DD3FC",
    infoForeground: "#082F49",

    card: "#4A0810",
    cardHover: "#5B0A13",
    modal: "#3D070D",
    popover: "#2C0508",
    drawer: "#3D070D",

    border: "#856A45",
    borderHover: "#D4AF37",
    divider: "#4A0810",

    input: "#2C0508",
    inputBorder: "#856A45",
    inputHover: "#D4AF37",
    inputFocusRing: "rgba(212, 175, 55, 0.4)",

    disabled: "#4A0810",
    disabledForeground: "#856A45",
    // AJUSTE: Cambiado a dorado apagado para mantener la coherencia de lectura sobre el fondo vino
    muted: "#856A45",

    shadow: "rgba(0, 0, 0, 0.6)",
    overlay: "rgba(15, 2, 3, 0.85)",
    gradient: ["#4A0810", "#2C0508"],
  },
};

export const themes: Record<ThemeName, AppTheme> = {
  light: lightTheme,
  dark: darkTheme,
  premium: premiumTheme,
};
