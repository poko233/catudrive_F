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
  SYSTEM_PRINTER_DEVICE,
  systemPrinterAdapter,
} from "./adapters/systemPrinter.adapter";

import {
  printerStorageService,
} from "./printerStorage.service";

import type {
  PrinterAdapter,
  PrinterConnectionType,
  PrinterDevice,
  PrinterPrintJob,
} from "./printer.types";

import {
  sanitizePrinterName,
  validatePrintJob,
  validatePrinterDevice,
} from "./printer.validation";

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

  network:
    networkPrinterAdapter,

  bluetooth:
    bluetoothPrinterAdapter,
};

/*
|--------------------------------------------------------------------------
| GET ADAPTER
|--------------------------------------------------------------------------
*/

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
  |--------------------------------------------------------------------------
  | SYSTEM DEVICE
  |--------------------------------------------------------------------------
  */

  getSystemPrinter():
    PrinterDevice {
    return {
      ...SYSTEM_PRINTER_DEVICE,
    };
  },

  /*
  |--------------------------------------------------------------------------
  | BUILD NETWORK DEVICE
  |--------------------------------------------------------------------------
  */

  buildNetworkPrinter(
    input: {
      name?: string;

      ipAddress: string;

      port?: number;
    },
  ): PrinterDevice {
    const ip =
      input
        .ipAddress
        .trim();

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
    };

    validatePrinterDevice(
      device,
    );

    return device;
  },

  /*
  |--------------------------------------------------------------------------
  | SUPPORT
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | BLUETOOTH DEVICES
  |--------------------------------------------------------------------------
  */

  async getBondedBluetoothPrinters():
    Promise<
      PrinterDevice[]
    > {
    const adapter =
      bluetoothPrinterAdapter;

    if (
      !adapter.isSupported()
    ) {
      return [];
    }

    return (
      await adapter.discover?.()
    ) ??
      [];
  },

  /*
  |--------------------------------------------------------------------------
  | CONNECT
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | DISCONNECT
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | TEST CONNECTION
  |--------------------------------------------------------------------------
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
  |--------------------------------------------------------------------------
  | PRINT
  |--------------------------------------------------------------------------
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
      job,
    );
  },

  /*
  |--------------------------------------------------------------------------
  | TEST PAGE
  |--------------------------------------------------------------------------
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

        title:
          "CatuDrive",

        html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />

  <style>
    @page {
      margin: 15mm;
    }

    body {
      font-family: Arial, sans-serif;
      color: #111;
    }

    .box {
      max-width: 500px;
      margin: 40px auto;
      padding: 28px;
      border: 2px solid #111;
      text-align: center;
    }

    h1 {
      margin: 0 0 14px;
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
  |--------------------------------------------------------------------------
  | DEFAULT PRINTER
  |--------------------------------------------------------------------------
  */

  getDefaultPrinter:
    printerStorageService.getDefaultPrinter,

  setDefaultPrinter:
    printerStorageService.setDefaultPrinter,

  clearDefaultPrinter:
    printerStorageService.clearDefaultPrinter,
};
