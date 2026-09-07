import type {
  DimensionValue,
  StyleProp,
  TextProps,
  TextStyle,
  ViewProps,
  ViewStyle,
} from "react-native";

import type {
  ReactNode,
} from "react";

/*
|--------------------------------------------------------------------------
| ESTADO
|--------------------------------------------------------------------------
*/

export type PrinterStage =
  | "processing"
  | "printing"
  | "complete";

/*
|--------------------------------------------------------------------------
| MOVIMIENTO
|--------------------------------------------------------------------------
*/

export type PrinterFeedMotion =
  | "smooth"
  | "stepped";

/*
|--------------------------------------------------------------------------
| TAMAÑO DE PAPEL
|--------------------------------------------------------------------------
*/

export type PrinterPaperSize =
  | "receipt"
  | "letter"
  | "a4"
  | "custom";

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN PERSONALIZADA
|--------------------------------------------------------------------------
*/

export interface PrinterCustomPaperConfig {
  /**
   * Relación ancho / alto.
   *
   * Ejemplo:
   *
   * Carta:
   * 8.5 / 11 = 0.7727
   */
  aspectRatio?:
    number;

  /**
   * Altura mínima si no se utiliza aspectRatio.
   */
  minHeight?:
    number;

  /**
   * Borde inferior dentado.
   */
  serrated?:
    boolean;
}

/*
|--------------------------------------------------------------------------
| ROOT
|--------------------------------------------------------------------------
*/

export interface PrinterRootProps
  extends Omit<
    ViewProps,
    "children"
  > {
  /**
   * Estado actual.
   */
  stage:
    PrinterStage;

  /**
   * Tipo de papel.
   *
   * @default "letter"
   */
  paperSize?:
    PrinterPaperSize;

  /**
   * Configuración cuando paperSize="custom".
   */
  customPaper?:
    PrinterCustomPaperConfig;

  /**
   * Activa o desactiva animaciones.
   *
   * @default true
   */
  animate?:
    boolean;

  /**
   * Movimiento del papel.
   *
   * @default "smooth"
   */
  feedMotion?:
    PrinterFeedMotion;

  /**
   * Duración de impresión.
   *
   * @default depende del tamaño del papel
   */
  printingDuration?:
    number;

  /**
   * Ancho máximo de la impresora.
   *
   * Si no se especifica se calcula
   * automáticamente según paperSize.
   */
  machineMaxWidth?:
    number;

  /**
   * Ancho del papel respecto
   * a la impresora.
   *
   * Ejemplo:
   * "88%"
   */
  paperWidth?:
    DimensionValue;

  /**
   * Altura del área donde sale
   * el documento.
   */
  outputHeight?:
    number;

  children:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| MACHINE
|--------------------------------------------------------------------------
*/

export interface PrinterMachineProps
  extends ViewProps {
  children?:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/

export interface PrinterHeaderProps
  extends ViewProps {
  children?:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export interface PrinterScreenProps
  extends ViewProps {
  children?:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

export interface PrinterStatusProps
  extends Omit<
    ViewProps,
    "children"
  > {
  children?:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| OUTPUT
|--------------------------------------------------------------------------
*/

export interface PrinterOutputProps
  extends ViewProps {
  children?:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| PAPER
|--------------------------------------------------------------------------
*/

export interface PrinterPaperProps
  extends ViewProps {
  children?:
    ReactNode;

  /**
   * Color de la hoja.
   *
   * @default "#FFFFFF"
   */
  paperColor?:
    string;

  /**
   * Padding de la hoja.
   */
  padding?:
    number;
}

/*
|--------------------------------------------------------------------------
| TEXT
|--------------------------------------------------------------------------
*/

export type PrinterTextTone =
  | "default"
  | "muted"
  | "strong";

export interface PrinterTextProps
  extends TextProps {
  children?:
    ReactNode;

  tone?:
    PrinterTextTone;

  style?:
    StyleProp<TextStyle>;
}

/*
|--------------------------------------------------------------------------
| DIVIDER
|--------------------------------------------------------------------------
*/

export interface PrinterDividerProps
  extends ViewProps {
  dashed?:
    boolean;

  style?:
    StyleProp<ViewStyle>;
}