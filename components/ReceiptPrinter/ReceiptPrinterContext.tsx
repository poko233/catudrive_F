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
  ReceiptFeedMotion,
  ReceiptPrinterStage,
} from "./ReceiptPrinter.types";

/*
|--------------------------------------------------------------------------
| CONTEXT
|--------------------------------------------------------------------------
*/

export interface ReceiptPrinterContextValue {
  stage:
    ReceiptPrinterStage;

  animate:
    boolean;

  feedMotion:
    ReceiptFeedMotion;

  printingDuration:
    number;

  paperWidth:
    DimensionValue;

  outputHeight:
    number;

  reduceMotion:
    boolean;

  shouldMove:
    boolean;
}

export const ReceiptPrinterContext =
  createContext<
    ReceiptPrinterContextValue | null
  >(
    null,
  );

/*
|--------------------------------------------------------------------------
| REDUCED MOTION
|--------------------------------------------------------------------------
*/

export function useReceiptReducedMotion() {
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
            // Si el dispositivo no soporta
            // esta API simplemente continuamos
            // con animaciones normales.
          },
        );

      const subscription =
        AccessibilityInfo.addEventListener(
          "reduceMotionChanged",
          (
            enabled,
          ) => {
            setReduceMotion(
              enabled,
            );
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
| HOOK INTERNO
|--------------------------------------------------------------------------
*/

export function useReceiptPrinter(
  component:
    string,
) {
  const context =
    useContext(
      ReceiptPrinterContext,
    );

  if (!context) {
    throw new Error(
      `${component} debe utilizarse dentro de ReceiptPrinter.Root.`,
    );
  }

  return context;
}