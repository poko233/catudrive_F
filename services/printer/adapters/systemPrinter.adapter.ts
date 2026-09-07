import * as Print from "expo-print";

import {
  SYSTEM_PRINTER_DEVICE_ID,
} from "../printer.constants";

import type {
  PrinterAdapter,
  PrinterDevice,
  PrinterPrintJob,
} from "../printer.types";

import {
  escapeHtml,
} from "../printer.validation";

/*
|--------------------------------------------------------------------------
| SYSTEM DEVICE
|--------------------------------------------------------------------------
*/

export const SYSTEM_PRINTER_DEVICE:
  PrinterDevice = {
  id:
    SYSTEM_PRINTER_DEVICE_ID,

  name:
    "Impresora del sistema",

  connectionType:
    "system",

  status:
    "connected",
};

/*
|--------------------------------------------------------------------------
| TEXT -> HTML
|--------------------------------------------------------------------------
*/

function textToHtml(
  text: string,
  title?: string,
): string {
  const safeTitle =
    escapeHtml(
      title ??
      "CatuDrive",
    );

  const safeText =
    escapeHtml(
      text,
    );

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />

  <style>
    @page {
      margin: 12mm;
    }

    body {
      margin: 0;
      color: #111;
      font-family: Arial, sans-serif;
      font-size: 12px;
    }

    h1 {
      margin: 0 0 16px;
      font-size: 18px;
    }

    pre {
      margin: 0;
      font-family: monospace;
      white-space: pre-wrap;
      word-break: break-word;
    }
  </style>
</head>

<body>
  <h1>${safeTitle}</h1>
  <pre>${safeText}</pre>
</body>
</html>
  `.trim();
}

/*
|--------------------------------------------------------------------------
| ADAPTER
|--------------------------------------------------------------------------
*/

export const systemPrinterAdapter:
  PrinterAdapter = {
  type:
    "system",

  isSupported() {
    return true;
  },

  async connect(
    device,
  ) {
    return {
      ...SYSTEM_PRINTER_DEVICE,
      ...device,

      status:
        "connected",
    };
  },

  async disconnect() {
    /*
    |--------------------------------------------------------------------------
    | The operating system owns this connection.
    |--------------------------------------------------------------------------
    */
  },

  async testConnection() {
    return true;
  },

  async print(
    _device:
      PrinterDevice,

    job:
      PrinterPrintJob,
  ) {
    const copies =
      job.copies ??
      1;

    const html =
      job.html ??
      textToHtml(
        job.text ??
          "",

        job.title,
      );

    for (
      let copy =
        0;
      copy <
      copies;
      copy++
    ) {
      await Print.printAsync({
        html,
      });
    }
  },
};
