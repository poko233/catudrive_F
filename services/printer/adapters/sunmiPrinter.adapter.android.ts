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

/*
|--------------------------------------------------------------------------
| SUNMI DEVICE
|--------------------------------------------------------------------------
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
  },
};

/*
|--------------------------------------------------------------------------
| PREPARE
|--------------------------------------------------------------------------
|
| prepare() binds to SUNMI's integrated print service.
| If the device does not expose that service, the library throws.
|
*/

async function prepare():
  Promise<void> {
  await SunmiPrinterLibrary.prepare();
}

/*
|--------------------------------------------------------------------------
| NORMALIZE STYLE
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| PRINT ONE COPY
|--------------------------------------------------------------------------
*/

async function printOne(
  job:
    PrinterPrintJob,
): Promise<void> {
  const options =
    job.sunmi;

  /*
  |--------------------------------------------------------------------------
  | IMAGE
  |--------------------------------------------------------------------------
  */

  if (
    options?.imageBase64
  ) {
    await SunmiPrinterLibrary.setAlignment(
      "center",
    );

    await SunmiPrinterLibrary.printImage(
      options.imageBase64,

      options.imageWidth ??
        384,

      options.imageMode ??
        "binary",
    );

    await SunmiPrinterLibrary.lineWrap(
      1,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TITLE
  |--------------------------------------------------------------------------
  */

  if (
    job.title
  ) {
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

  /*
  |--------------------------------------------------------------------------
  | TEXT
  |--------------------------------------------------------------------------
  */

  if (
    job.text
  ) {
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

  /*
  |--------------------------------------------------------------------------
  | QR
  |--------------------------------------------------------------------------
  */

  if (
    options?.qrData
  ) {
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

  /*
  |--------------------------------------------------------------------------
  | FEED
  |--------------------------------------------------------------------------
  |
  | V2 PRO has a tear-off printer, not an auto cutter.
  | cutPaper is therefore intentionally ignored.
  |
  */

  await SunmiPrinterLibrary.lineWrap(
    options?.feedLines ??
      4,
  );

  await resetStyle();
}

/*
|--------------------------------------------------------------------------
| ADAPTER
|--------------------------------------------------------------------------
*/

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
    /*
    |--------------------------------------------------------------------------
    | The SUNMI print service is owned by the device.
    | There is no external Bluetooth/TCP socket to close here.
    |--------------------------------------------------------------------------
    */
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

    /*
    |--------------------------------------------------------------------------
    | The integrated 58 mm thermal printer does not render arbitrary HTML.
    |--------------------------------------------------------------------------
    */

    if (
      job.type ===
        "document" &&
      job.html &&
      !job.text &&
      !job.sunmi?.imageBase64
    ) {
      throw new Error(
        "La impresora integrada SUNMI de 58 mm no imprime HTML/Carta/A4 directamente. Usa texto, una imagen térmica o la impresión del sistema.",
      );
    }

    await prepare();

    const copies =
      job.copies ??
      1;

    for (
      let copy =
        0;
      copy <
      copies;
      copy++
    ) {
      await printOne(
        job,
      );
    }
  },
};

/*
|--------------------------------------------------------------------------
| TEST PAGE
|--------------------------------------------------------------------------
*/

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
    ].join(
      "\n",
    ) +
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
