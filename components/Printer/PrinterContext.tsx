import {
  AccessibilityInfo,
} from "react-native";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import type {
  DimensionValue,
} from "react-native";

import type {
  PrinterFeedMotion,
  PrinterPaperSize,
  PrinterStage,
} from "./Printer.types";

/*
|--------------------------------------------------------------------------
| CONTEXT
|--------------------------------------------------------------------------
*/

export interface PrinterContextValue {
  stage:
    PrinterStage;

  paperSize:
    PrinterPaperSize;

  animate:
    boolean;

  feedMotion:
    PrinterFeedMotion;

  printingDuration:
    number;

  paperWidth:
    DimensionValue;

  outputHeight:
    number;

  paperAspectRatio:
    number | undefined;

  paperMinHeight:
    number;

  serrated:
    boolean;

  reduceMotion:
    boolean;

  shouldMove:
    boolean;
}

/*
|--------------------------------------------------------------------------
| CONTEXT
|--------------------------------------------------------------------------
*/

export const PrinterContext =
  createContext<
    PrinterContextValue | null
  >(
    null,
  );

/*
|--------------------------------------------------------------------------
| REDUCED MOTION
|--------------------------------------------------------------------------
*/

export function usePrinterReducedMotion() {
  const [
    reduceMotion,
    setReduceMotion,
  ] =
    useState(false);

  useEffect(
    () => {
      let mounted =
        true;

      void AccessibilityInfo
        .isReduceMotionEnabled()
        .then(
          (
            enabled,
          ) => {
            if (
              mounted
            ) {
              setReduceMotion(
                enabled,
              );
            }
          },
        )
        .catch(
          () => {
            /*
            |--------------------------------------------------------------------------
            | Si la plataforma no soporta la API,
            | simplemente mantenemos animaciones.
            |--------------------------------------------------------------------------
            */
          },
        );

      const subscription =
        AccessibilityInfo.addEventListener(
          "reduceMotionChanged",
          (
            enabled,
          ) => {
            if (
              mounted
            ) {
              setReduceMotion(
                enabled,
              );
            }
          },
        );

      return () => {
        mounted =
          false;

        subscription?.remove();
      };
    },
    [],
  );

  return reduceMotion;
}

/*
|--------------------------------------------------------------------------
| HOOK
|--------------------------------------------------------------------------
*/

export function usePrinter(
  component:
    string,
) {
  const context =
    useContext(
      PrinterContext,
    );

  if (
    !context
  ) {
    throw new Error(
      `${component} debe utilizarse dentro de Printer.Root.`,
    );
  }

  return context;
}