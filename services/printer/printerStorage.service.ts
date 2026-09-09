import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_PRINTER_STORAGE_KEY,
  SUNMI_INNER_PRINTER_PAPER_WIDTH_MM,
} from "./printer.constants";

import type {
  PrinterDevice,
} from "./printer.types";

import {
  sanitizePrinterName,
  validatePrinterDevice,
} from "./printer.validation";

/*
|--------------------------------------------------------------------------
| STORED DEVICE
|--------------------------------------------------------------------------
|
| We store only connection metadata.
|
| We DO NOT store:
| - Wi-Fi passwords
| - printer admin passwords
| - auth tokens
| - printed documents
|
*/

function sanitizeStoredDevice(
  device:
    PrinterDevice,
): PrinterDevice {
  const clean:
    PrinterDevice = {
    id:
      String(
        device.id,
      ).slice(
        0,
        160,
      ),

    name:
      sanitizePrinterName(
        device.name,
      ),

    connectionType:
      device.connectionType,

    status:
      "disconnected",
  };

  /*
  |--------------------------------------------------------------------------
  | NETWORK
  |--------------------------------------------------------------------------
  */

  if (
    device.connectionType ===
    "network"
  ) {
    clean.ipAddress =
      device.ipAddress?.trim();

    clean.port =
      device.port;
  }

  /*
  |--------------------------------------------------------------------------
  | BLUETOOTH
  |--------------------------------------------------------------------------
  */

  if (
    device.connectionType ===
    "bluetooth"
  ) {
    clean.macAddress =
      device.macAddress?.trim();

    clean.paired =
      true;
  }

  /*
  |--------------------------------------------------------------------------
  | SYSTEM
  |--------------------------------------------------------------------------
  */

  if (
    device.connectionType ===
    "system"
  ) {
    clean.systemPrinterUrl =
      device.systemPrinterUrl;
  }

  /*
  |--------------------------------------------------------------------------
  | SUNMI
  |--------------------------------------------------------------------------
  */

  if (
    device.connectionType ===
    "sunmi"
  ) {
    clean.builtIn =
      true;

    clean.paperWidthMm =
      SUNMI_INNER_PRINTER_PAPER_WIDTH_MM;

    clean.manufacturer =
      "SUNMI";

    clean.model =
      String(
        device.model ??
          "V2 PRO / compatible",
      ).slice(
        0,
        100,
      );
  }

  /*
  |--------------------------------------------------------------------------
  | METADATA
  |--------------------------------------------------------------------------
  */

  if (
    device.model &&
    !clean.model
  ) {
    clean.model =
      String(
        device.model,
      ).slice(
        0,
        100,
      );
  }

  if (
    device.manufacturer &&
    !clean.manufacturer
  ) {
    clean.manufacturer =
      String(
        device.manufacturer,
      ).slice(
        0,
        100,
      );
  }

  validatePrinterDevice(
    clean,
  );

  return clean;
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const printerStorageService = {
  async getDefaultPrinter():
    Promise<
      PrinterDevice | null
    > {
    try {
      const raw =
        await AsyncStorage.getItem(
          DEFAULT_PRINTER_STORAGE_KEY,
        );

      if (!raw) {
        return null;
      }

      const parsed =
        JSON.parse(
          raw,
        ) as PrinterDevice;

      return sanitizeStoredDevice(
        parsed,
      );
    } catch {
      await AsyncStorage.removeItem(
        DEFAULT_PRINTER_STORAGE_KEY,
      );

      return null;
    }
  },

  async setDefaultPrinter(
    device:
      PrinterDevice,
  ): Promise<
    PrinterDevice
  > {
    const clean =
      sanitizeStoredDevice(
        device,
      );

    await AsyncStorage.setItem(
      DEFAULT_PRINTER_STORAGE_KEY,
      JSON.stringify(
        clean,
      ),
    );

    return clean;
  },

  async clearDefaultPrinter():
    Promise<void> {
    await AsyncStorage.removeItem(
      DEFAULT_PRINTER_STORAGE_KEY,
    );
  },
};
