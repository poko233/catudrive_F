import {
  SUNMI_INNER_PRINTER_DEVICE_ID,
  SUNMI_INNER_PRINTER_PAPER_WIDTH_MM,
} from "../printer.constants";

import type {
  PrinterAdapter,
  PrinterDevice,
} from "../printer.types";

/*
|--------------------------------------------------------------------------
| SUNMI DEVICE
|--------------------------------------------------------------------------
|
| This generic file is used by web/iOS.
| Android automatically resolves sunmiPrinter.adapter.android.ts instead.
|
*/

export const SUNMI_INNER_PRINTER_DEVICE:
  PrinterDevice = {
  id:
    SUNMI_INNER_PRINTER_DEVICE_ID,

  name:
    "SUNMI integrada 58 mm",

  connectionType:
    "sunmi",

  status:
    "disconnected",

  builtIn:
    true,

  paperWidthMm:
    SUNMI_INNER_PRINTER_PAPER_WIDTH_MM,

  manufacturer:
    "SUNMI",

  model:
    "V2 PRO / compatible",

  capabilities: {
    paperSizes: [
      "receipt-58",
    ],
    jobTypes: [
      "receipt",
    ],
    html: false,
    text: true,
    rasterImage: true,
  },
};

/*
|--------------------------------------------------------------------------
| UNSUPPORTED ADAPTER
|--------------------------------------------------------------------------
*/

function unsupported():
  never {
  throw new Error(
    "La impresora integrada SUNMI solo está disponible en Android mediante un Development Build compatible.",
  );
}

export const sunmiPrinterAdapter:
  PrinterAdapter = {
  type:
    "sunmi",

  isSupported() {
    return false;
  },

  async connect() {
    return unsupported();
  },

  async disconnect() {
    // No-op outside Android.
  },

  async testConnection() {
    return false;
  },

  async print() {
    return unsupported();
  },
};

export async function printSunmiTestPage():
  Promise<void> {
  unsupported();
}
