import * as SunmiPrinterLibrary from "@mitsuharu/react-native-sunmi-printer-library";

import {
  SUNMI_INNER_PRINTER_DEVICE_ID,
  SUNMI_INNER_PRINTER_PAPER_WIDTH_MM,
} from "../printer.constants";

import type {
  PrinterAdapter,
  PrinterDevice,
  PrinterPrintJob,
} from "../printer.types";

import {
  sanitizePrintableText,
  validatePrinterDevice,
} from "../printer.validation";

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
    html:
      false,
    text:
      true,
    rasterImage:
      true,
  },
};

async function prepare():
  Promise<void> {
  await SunmiPrinterLibrary.prepare();
}

async function resetStyle():
  Promise<void> {
  await SunmiPrinterLibrary.setAlignment(
    "left",
  );

  await SunmiPrinterLibrary.setTextStyle(
    "bold",
    false,
  );

  await SunmiPrinterLibrary.setFontSize(
    24,
  );
}

async function printOne(
  job:
    PrinterPrintJob,
): Promise<void> {
  const options =
    job.sunmi;

  /*
  |--------------------------------------------------------------------------
  | TICKET RASTER OFICIAL DEL BACKEND
  |--------------------------------------------------------------------------
  |
  | Si existe rasterImage, se imprime SOLO la imagen para no duplicar
  | título/texto/QR. Esa imagen ya contiene todo lo definido en Blade.
  |
  */

  const rasterBase64 =
    job.rasterImage?.base64 ??
    options?.imageBase64;

  if (rasterBase64) {
    await SunmiPrinterLibrary.setAlignment(
      "center",
    );

    const sunmiImageBase64 =
      rasterBase64.startsWith(
        "data:",
      )
        ? rasterBase64
        : `data:image/png;base64,${rasterBase64}`;

    await SunmiPrinterLibrary.printImage(
      sunmiImageBase64,
      job.rasterImage?.width ??
        options?.imageWidth ??
        384,
      options?.imageMode ??
        "binary",
    );

    await SunmiPrinterLibrary.lineWrap(
      options?.feedLines ??
        4,
    );

    await resetStyle();
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | LEGACY: TÍTULO / TEXTO / QR
  |--------------------------------------------------------------------------
  |
  | Se conserva para no romper otras pantallas que aún impriman nativamente.
  |
  */

  if (job.title) {
    await SunmiPrinterLibrary.setAlignment(
      "center",
    );

    await SunmiPrinterLibrary.setTextStyle(
      "bold",
      true,
    );

    await SunmiPrinterLibrary.setFontSize(
      28,
    );

    await SunmiPrinterLibrary.printText(
      `${sanitizePrintableText(
        job.title,
      )}\n`,
    );

    await SunmiPrinterLibrary.setTextStyle(
      "bold",
      false,
    );
  }

  if (job.text) {
    await SunmiPrinterLibrary.setAlignment(
      options?.alignment ??
        "left",
    );

    await SunmiPrinterLibrary.setFontSize(
      options?.fontSize ??
        24,
    );

    await SunmiPrinterLibrary.printText(
      `${sanitizePrintableText(
        job.text,
      )}\n`,
    );
  }

  if (options?.qrData) {
    await SunmiPrinterLibrary.lineWrap(
      1,
    );

    await SunmiPrinterLibrary.setAlignment(
      "center",
    );

    await SunmiPrinterLibrary.printQRCode(
      sanitizePrintableText(
        options.qrData,
      ),
      options.qrSize ??
        6,
      "middle",
    );

    await SunmiPrinterLibrary.lineWrap(
      1,
    );
  }

  await SunmiPrinterLibrary.lineWrap(
    options?.feedLines ??
      4,
  );

  await resetStyle();
}

export const sunmiPrinterAdapter:
  PrinterAdapter = {
  type:
    "sunmi",

  isSupported() {
    return true;
  },

  async connect(
    device,
  ) {
    validatePrinterDevice(
      device,
    );

    await prepare();

    return {
      ...SUNMI_INNER_PRINTER_DEVICE,
      ...device,
      status:
        "connected",
      builtIn:
        true,
      paperWidthMm:
        SUNMI_INNER_PRINTER_PAPER_WIDTH_MM,
      manufacturer:
        "SUNMI",
    };
  },

  async disconnect() {
    /* Servicio integrado del equipo, sin socket externo. */
  },

  async testConnection(
    device,
  ) {
    try {
      validatePrinterDevice(
        device,
      );
      await prepare();
      return true;
    } catch {
      return false;
    }
  },

  async print(
    device:
      PrinterDevice,
    job:
      PrinterPrintJob,
  ) {
    validatePrinterDevice(
      device,
    );

    if (
      job.type === "document" &&
      job.html &&
      !job.text &&
      !job.rasterImage?.base64 &&
      !job.sunmi?.imageBase64
    ) {
      throw new Error(
        "La impresora integrada SUNMI de 58 mm no imprime HTML/Carta/A4 directamente. Usa una imagen térmica o la impresión del sistema.",
      );
    }

    await prepare();

    const copies =
      job.copies ?? 1;

    for (
      let copy = 0;
      copy < copies;
      copy++
    ) {
      await printOne(
        job,
      );
    }
  },
};

export async function printSunmiTestPage():
  Promise<void> {
  await prepare();
  await resetStyle();

  await SunmiPrinterLibrary.setAlignment(
    "center",
  );
  await SunmiPrinterLibrary.setTextStyle(
    "bold",
    true,
  );
  await SunmiPrinterLibrary.setFontSize(
    30,
  );
  await SunmiPrinterLibrary.printText(
    "CATUDRIVE\n",
  );

  await SunmiPrinterLibrary.setTextStyle(
    "bold",
    false,
  );
  await SunmiPrinterLibrary.setFontSize(
    24,
  );
  await SunmiPrinterLibrary.printText(
    [
      "PRUEBA DE IMPRESION",
      "",
      "SUNMI integrada 58 mm",
      "Conexion correcta",
      "",
      new Date().toLocaleString(
        "es-BO",
      ),
    ].join("\n") +
      "\n",
  );

  await SunmiPrinterLibrary.lineWrap(
    1,
  );
  await SunmiPrinterLibrary.printQRCode(
    "CATUDRIVE-SUNMI-OK",
    6,
    "middle",
  );
  await SunmiPrinterLibrary.lineWrap(
    4,
  );

  await resetStyle();
}
