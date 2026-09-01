export type ThemeName = string;

/**
 * Interfaz exhaustiva de tokens de color para una UI/UX premium.
 * Clasificada por categorías de control y responsabilidad.
 */
export interface Colors {
  // ==========================================
  // FUNDAMENTOS Y FONDOS
  // ==========================================
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;

  // ==========================================
  // TIPOGRAFÍA
  // ==========================================
  text: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  textInverse: string;

  // ==========================================
  // MARCA Y COLORES PRINCIPALES (BRANDING)
  // ==========================================
  primary: string;
  primaryHover: string;
  primaryActive: string;
  primaryForeground: string;
  primarySubtle: string;

  secondary: string;
  secondaryHover: string;
  secondaryActive: string;
  secondaryForeground: string;

  accent: string;
  accentForeground: string;

  // ==========================================
  // SEMÁNTICA Y ESTADOS (FEEDBACK)
  // ==========================================
  success: string;
  successForeground: string;
  warning: string;
  warningForeground: string;
  destructive: string;
  destructiveHover: string;
  destructiveForeground: string;
  info: string;
  infoForeground: string;

  // ==========================================
  // SUPERFICIES Y ELEVACIÓN (SURFACES)
  // ==========================================
  card: string;
  cardHover: string;
  modal: string;
  popover: string;
  drawer: string;

  // ==========================================
  // ELEMENTOS DE UI Y CONTROLES
  // ==========================================
  border: string;
  borderHover: string;
  divider: string;

  input: string;
  inputBorder: string;
  inputHover: string;
  inputFocusRing: string;

  // ==========================================
  // ESTADOS DESHABILITADOS Y EFECTOS
  // ==========================================
  disabled: string;
  disabledForeground: string;
  muted: string;

  shadow: string;
  overlay: string;
  gradient: readonly [string, string, ...string[]];
}

export interface AppTheme {
  name: ThemeName;
  dark: boolean;
  colors: Colors;
}
