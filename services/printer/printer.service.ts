import {
  DEFAULT_RAW_PRINTER_PORT,
} from "./printer.constants";

import {
  bluetoothPrinterAdapter,
  printBluetoothTestPage,
} from "./adapters/bluetoothPrinter.adapter";

import {
  networkPrinterAdapter,
  printNetworkTestPage,
} from "./adapters/networkPrinter.adapter";

import {
  SUNMI_INNER_PRINTER_DEVICE,
  printSunmiTestPage,
  sunmiPrinterAdapter,
} from "./adapters/sunmiPrinter.adapter";

import {
  SYSTEM_PRINTER_DEVICE,
  systemPrinterAdapter,
} from "./adapters/systemPrinter.adapter";

import {
  printerStorageService,
} from "./printerStorage.service";

import {
  checkPrintJobCompatibility,
  checkPrinterCompatibility,
  getDefaultCapabilitiesForType,
  getPrinterPaperLabel,
  getPrinterProfileForRequirement,
  inferPreferredProfileForDevice,
  normalizePrinterRequirement,
} from "./printer.compatibility";

import type {
  PrinterAdapter,
  PrinterCompatibilityResult,
  PrinterConnectionType,
  PrinterDefaultProfiles,
  PrinterDevice,
  PrinterJobRequirement,
  PrinterPrintJob,
  PrinterProfileKey,
} from "./printer.types";

import {
  sanitizePrinterName,
  validatePrintJob,
  validatePrinterDevice,
} from "./printer.validation";

/*
|--------------------------------------------------------------------------
| ERRORS
|--------------------------------------------------------------------------
*/

export class PrinterCompatibilityError extends Error {
  result:
    PrinterCompatibilityResult;

  constructor(
    result:
      PrinterCompatibilityResult,
  ) {
    super(
      result.reason ??
        "La impresora seleccionada no es compatible con este trabajo.",
    );

    this.name =
      "PrinterCompatibilityError";

    this.result =
      result;
  }
}

/*
|--------------------------------------------------------------------------
| ADAPTER MAP
|--------------------------------------------------------------------------
*/

const adapters:
  Record<
    PrinterConnectionType,
    PrinterAdapter
  > = {
  system:
    systemPrinterAdapter,

  sunmi:
    sunmiPrinterAdapter,

  network:
    networkPrinterAdapter,

  bluetooth:
    bluetoothPrinterAdapter,
};

function getAdapter(
  type:
    PrinterConnectionType,
): PrinterAdapter {
  return adapters[
    type
  ];
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const printerService = {
  /*
  |------------------------------------------------------------------------
  | SYSTEM
  |------------------------------------------------------------------------
  */

  getSystemPrinter():
    PrinterDevice {
    return {
      ...SYSTEM_PRINTER_DEVICE,
    };
  },

  /*
  |------------------------------------------------------------------------
  | SUNMI
  |------------------------------------------------------------------------
  */

  getSunmiPrinter():
    PrinterDevice {
    return {
      ...SUNMI_INNER_PRINTER_DEVICE,
    };
  },

  async detectSunmiPrinter():
    Promise<
      PrinterDevice | null
    > {
    if (
      !sunmiPrinterAdapter.isSupported()
    ) {
      return null;
    }

    const device = {
      ...SUNMI_INNER_PRINTER_DEVICE,
    };

    const available =
      await sunmiPrinterAdapter.testConnection(
        device,
      );

    return available
      ? device
      : null;
  },

  /*
  |------------------------------------------------------------------------
  | BUILD NETWORK DEVICE
  |------------------------------------------------------------------------
  */

  buildNetworkPrinter(
    input: {
      name?:
        string;

      ipAddress:
        string;

      port?:
        number;

      paperWidthMm?:
        number;
    },
  ): PrinterDevice {
    const ip =
      input.ipAddress.trim();

    const port =
      input.port ??
      DEFAULT_RAW_PRINTER_PORT;

    const device:
      PrinterDevice = {
      id:
        `network:${ip}:${port}`,

      name:
        sanitizePrinterName(
          input.name ||
            `Impresora ${ip}`,
        ),

      connectionType:
        "network",

      ipAddress:
        ip,

      port,

      status:
        "disconnected",

      paperWidthMm:
        input.paperWidthMm,

      capabilities:
        getDefaultCapabilitiesForType(
          "network",
        ),
    };

    validatePrinterDevice(
      device,
    );

    return device;
  },

  /*
  |------------------------------------------------------------------------
  | SUPPORT
  |------------------------------------------------------------------------
  */

  isSupported(
    type:
      PrinterConnectionType,
  ): boolean {
    return getAdapter(
      type,
    ).isSupported();
  },

  /*
  |------------------------------------------------------------------------
  | BLUETOOTH
  |------------------------------------------------------------------------
  */

  async getBondedBluetoothPrinters():
    Promise<PrinterDevice[]> {
    const adapter =
      bluetoothPrinterAdapter;

    if (
      !adapter.isSupported()
    ) {
      return [];
    }

    return (
      await adapter.discover?.()
    ) ?? [];
  },

  /*
  |------------------------------------------------------------------------
  | COMPATIBILITY
  |------------------------------------------------------------------------
  */

  checkCompatibility(
    device:
      PrinterDevice,
    requirement:
      PrinterJobRequirement,
  ): PrinterCompatibilityResult {
    return checkPrinterCompatibility(
      device,
      requirement,
    );
  },

  checkJobCompatibility(
    device:
      PrinterDevice,
    job:
      PrinterPrintJob,
  ): PrinterCompatibilityResult {
    return checkPrintJobCompatibility(
      device,
      job,
    );
  },

  getProfileForRequirement:
    getPrinterProfileForRequirement,

  getPaperLabel:
    getPrinterPaperLabel,

  normalizeRequirement:
    normalizePrinterRequirement,

  inferPreferredProfileForDevice,

  /*
  |------------------------------------------------------------------------
  | CONNECT
  |------------------------------------------------------------------------
  */

  async connect(
    device:
      PrinterDevice,
  ): Promise<PrinterDevice> {
    validatePrinterDevice(
      device,
    );

    const adapter =
      getAdapter(
        device.connectionType,
      );

    if (
      !adapter.isSupported()
    ) {
      throw new Error(
        `La conexión ${device.connectionType} no está disponible en esta plataforma.`,
      );
    }

    return adapter.connect({
      ...device,
      status:
        "connecting",
    });
  },

  /*
  |------------------------------------------------------------------------
  | DISCONNECT
  |------------------------------------------------------------------------
  */

  async disconnect(
    device:
      PrinterDevice,
  ): Promise<void> {
    const adapter =
      getAdapter(
        device.connectionType,
      );

    await adapter.disconnect(
      device,
    );
  },

  /*
  |------------------------------------------------------------------------
  | TEST
  |------------------------------------------------------------------------
  */

  async testConnection(
    device:
      PrinterDevice,
  ): Promise<boolean> {
    validatePrinterDevice(
      device,
    );

    const adapter =
      getAdapter(
        device.connectionType,
      );

    if (
      !adapter.isSupported()
    ) {
      return false;
    }

    return adapter.testConnection(
      device,
    );
  },

  /*
  |------------------------------------------------------------------------
  | PRINT
  |------------------------------------------------------------------------
  */

  async print(
    device:
      PrinterDevice,
    job:
      PrinterPrintJob,
  ): Promise<void> {
    validatePrinterDevice(
      device,
    );

    validatePrintJob(
      job,
    );

    const compatibility =
      checkPrintJobCompatibility(
        device,
        job,
      );

    if (
      !compatibility.compatible
    ) {
      throw new PrinterCompatibilityError(
        compatibility,
      );
    }

    const adapter =
      getAdapter(
        device.connectionType,
      );

    if (
      !adapter.isSupported()
    ) {
      throw new Error(
        "La impresora seleccionada no está soportada en esta plataforma.",
      );
    }

    await adapter.print(
      device,
      {
        ...job,
        paperSize:
          compatibility.paperSize,
      },
    );
  },

  /*
  |------------------------------------------------------------------------
  | TEST PAGE
  |------------------------------------------------------------------------
  */

  async printTestPage(
    device:
      PrinterDevice,
  ): Promise<void> {
    validatePrinterDevice(
      device,
    );

    if (
      device.connectionType ===
      "sunmi"
    ) {
      await printSunmiTestPage();
      return;
    }

    if (
      device.connectionType ===
      "network"
    ) {
      await printNetworkTestPage(
        device,
      );
      return;
    }

    if (
      device.connectionType ===
      "bluetooth"
    ) {
      await printBluetoothTestPage(
        device,
      );
      return;
    }

    await systemPrinterAdapter.print(
      device,
      {
        type:
          "document",
        paperSize:
          "letter",
        title:
          "CatuDrive",
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <style>
    @page { size: Letter; margin: 15mm; }
    body { font-family: Arial, sans-serif; color: #111; }
    .box {
      max-width: 500px;
      margin: 40px auto;
      padding: 28px;
      border: 2px solid #111;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>CATUDRIVE</h1>
    <h2>Prueba de impresión</h2>
    <p>La impresión del sistema está funcionando.</p>
  </div>
</body>
</html>
        `.trim(),
      },
    );
  },

  /*
  |------------------------------------------------------------------------
  | DEFAULTS BY PROFILE
  |------------------------------------------------------------------------
  */

  async getDefaultPrinters():
    Promise<PrinterDefaultProfiles> {
    return printerStorageService.getDefaultPrinters();
  },

  async getDefaultPrinterForProfile(
    profile:
      PrinterProfileKey,
  ): Promise<PrinterDevice | null> {
    return printerStorageService.getDefaultPrinter(
      profile,
    );
  },

  async getDefaultPrinterForRequirement(
    requirement:
      PrinterJobRequirement,
  ): Promise<PrinterDevice | null> {
    const profile =
      getPrinterProfileForRequirement(
        requirement,
      );

    return printerStorageService.getDefaultPrinter(
      profile,
    );
  },

  async setDefaultPrinterForProfile(
    profile:
      PrinterProfileKey,
    device:
      PrinterDevice,
  ): Promise<PrinterDevice> {
    const requirement:
      PrinterJobRequirement =
      profile ===
      "receipt-58"
        ? {
            type:
              "receipt",
            paperSize:
              "receipt-58",
          }
        : profile ===
            "receipt-80"
          ? {
              type:
                "receipt",
              paperSize:
                "receipt-80",
            }
          : {
              type:
                "document",
              paperSize:
                "letter",
            };

    const compatibility =
      checkPrinterCompatibility(
        device,
        requirement,
      );

    if (
      !compatibility.compatible
    ) {
      throw new PrinterCompatibilityError(
        compatibility,
      );
    }

    return printerStorageService.setDefaultPrinter(
      profile,
      device,
    );
  },

  async clearDefaultPrinterForProfile(
    profile:
      PrinterProfileKey,
  ): Promise<void> {
    await printerStorageService.clearDefaultPrinter(
      profile,
    );
  },

  clearAllDefaultPrinters:
    printerStorageService.clearAllDefaultPrinters,

  /*
  |------------------------------------------------------------------------
  | BACKWARD-COMPATIBLE ALIASES
  |------------------------------------------------------------------------
  |
  | El código nuevo debe utilizar las funciones por perfil.
  | Estos aliases evitan romper pantallas antiguas durante la migración.
  |
  */

  async getDefaultPrinter():
    Promise<PrinterDevice | null> {
    const profiles =
      await printerStorageService.getDefaultPrinters();

    return (
      profiles[
        "receipt-58"
      ] ??
      profiles[
        "receipt-80"
      ] ??
      profiles.document ??
      null
    );
  },

  async setDefaultPrinter(
    device:
      PrinterDevice,
  ): Promise<PrinterDevice> {
    const profile =
      inferPreferredProfileForDevice(
        device,
      );

    return this.setDefaultPrinterForProfile(
      profile,
      device,
    );
  },

  async clearDefaultPrinter():
    Promise<void> {
    await printerStorageService.clearAllDefaultPrinters();
  },
};
