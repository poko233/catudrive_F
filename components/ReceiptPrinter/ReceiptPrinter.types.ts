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
| ESTADOS
|--------------------------------------------------------------------------
*/

export type ReceiptPrinterStage =
  | "processing"
  | "printing"
  | "complete";

/*
|--------------------------------------------------------------------------
| TIPO DE SALIDA DEL PAPEL
|--------------------------------------------------------------------------
*/

export type ReceiptFeedMotion =
  | "smooth"
  | "stepped";

/*
|--------------------------------------------------------------------------
| ROOT
|--------------------------------------------------------------------------
*/

export interface ReceiptPrinterRootProps
  extends Omit<
    ViewProps,
    "children"
  > {
  /**
   * Estado actual de la impresora.
   */
  stage:
    ReceiptPrinterStage;

  /**
   * Habilita o deshabilita las animaciones.
   *
   * @default true
   */
  animate?: boolean;

  /**
   * Forma en la que sale el papel.
   *
   * smooth:
   *   movimiento continuo.
   *
   * stepped:
   *   movimiento por pasos simulando
   *   una impresora térmica.
   *
   * @default "stepped"
   */
  feedMotion?:
    ReceiptFeedMotion;

  /**
   * Duración total aproximada
   * de la impresión.
   *
   * @default 1750
   */
  printingDuration?:
    number;

  /**
   * Ancho máximo de la impresora.
   *
   * @default 390
   */
  maxWidth?:
    number;

  /**
   * Ancho del recibo respecto
   * a la impresora.
   *
   * @default "82%"
   */
  paperWidth?:
    DimensionValue;

  /**
   * Alto del área donde
   * aparecerá el recibo.
   *
   * @default 520
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

export interface ReceiptPrinterMachineProps
  extends ViewProps {
  children?:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| HEADER
|--------------------------------------------------------------------------
*/

export interface ReceiptPrinterHeaderProps
  extends ViewProps {
  children?:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export interface ReceiptPrinterScreenProps
  extends ViewProps {
  children?:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

export interface ReceiptPrinterStatusProps
  extends Omit<
    ViewProps,
    "children"
  > {
  /**
   * Si no se manda children,
   * se utiliza automáticamente
   * el texto correspondiente
   * al estado actual.
   */
  children?:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| OUTPUT
|--------------------------------------------------------------------------
*/

export interface ReceiptPrinterOutputProps
  extends ViewProps {
  children?:
    ReactNode;
}

/*
|--------------------------------------------------------------------------
| PAPER
|--------------------------------------------------------------------------
*/

export interface ReceiptPrinterPaperProps
  extends ViewProps {
  children?:
    ReactNode;

  /**
   * Color del papel.
   *
   * @default "#FFFFFF"
   */
  paperColor?:
    string;
}

/*
|--------------------------------------------------------------------------
| TEXT
|--------------------------------------------------------------------------
*/

export type ReceiptPrinterTextTone =
  | "default"
  | "muted"
  | "strong";

export interface ReceiptPrinterTextProps
  extends TextProps {
  children?:
    ReactNode;

  tone?:
    ReceiptPrinterTextTone;

  style?:
    StyleProp<TextStyle>;
}

/*
|--------------------------------------------------------------------------
| DIVIDER
|--------------------------------------------------------------------------
*/

export interface ReceiptPrinterDividerProps
  extends ViewProps {
  style?:
    StyleProp<ViewStyle>;
}