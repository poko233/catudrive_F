import * as Print from "expo-print";

import {
  SYSTEM_PRINTER_DEVICE_ID,
} from "../printer.constants";

import type {
  PrinterAdapter,
  PrinterDevice,
  PrinterPaperSize,
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

  capabilities: {
    paperSizes: [
      "receipt-58",
      "receipt-80",
      "letter",
      "a4",
      "custom",
    ],
    jobTypes: [
      "receipt",
      "document",
    ],
    html:
      true,
    text:
      true,
  },
};

/*
|--------------------------------------------------------------------------
| PAGE CSS
|--------------------------------------------------------------------------
*/

function getPageCss(
  paperSize:
    PrinterPaperSize | undefined,
): string {
  switch (
    paperSize
  ) {
    case "receipt-58":
      return "size: 58mm auto; margin: 3mm;";

    case "receipt-80":
      return "size: 80mm auto; margin: 4mm;";

    case "a4":
      return "size: A4; margin: 12mm;";

    case "letter":
      return "size: Letter; margin: 12mm;";

    case "custom":
    default:
      return "margin: 12mm;";
  }
}

/*
|--------------------------------------------------------------------------
| TEXT -> HTML
|--------------------------------------------------------------------------
*/

function textToHtml(
  text:
    string,
  title?:
    string,
  paperSize?:
    PrinterPaperSize,
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

  const pageCss =
    getPageCss(
      paperSize,
    );

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />

  <style>
    @page {
      ${pageCss}
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
    /* El sistema operativo administra la conexión. */
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
        job.paperSize,
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
