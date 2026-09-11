import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DEFAULT_PRINTER_PROFILES_STORAGE_KEY,
  LEGACY_DEFAULT_PRINTER_STORAGE_KEY,
  OLDER_LEGACY_DEFAULT_PRINTER_STORAGE_KEY,
  SUNMI_INNER_PRINTER_PAPER_WIDTH_MM,
} from "./printer.constants";

import {
  getDefaultCapabilitiesForType,
  inferPreferredProfileForDevice,
} from "./printer.compatibility";

import type {
  PrinterDefaultProfiles,
  PrinterDevice,
  PrinterProfileKey,
} from "./printer.types";

import {
  sanitizePrinterName,
  validatePrinterDevice,
} from "./printer.validation";

/*
|--------------------------------------------------------------------------
| SANITIZE STORED DEVICE
|--------------------------------------------------------------------------
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

  if (
    device.connectionType ===
    "network"
  ) {
    clean.ipAddress =
      device.ipAddress?.trim();

    clean.port =
      device.port;
  }

  if (
    device.connectionType ===
    "bluetooth"
  ) {
    clean.macAddress =
      device.macAddress?.trim();

    clean.paired =
      true;
  }

  if (
    device.connectionType ===
    "system"
  ) {
    clean.systemPrinterUrl =
      device.systemPrinterUrl;
  }

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
  } else if (
    typeof device.paperWidthMm ===
    "number"
  ) {
    clean.paperWidthMm =
      device.paperWidthMm;
  }

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

  /*
  |------------------------------------------------------------------------
  | CAPABILITIES
  |------------------------------------------------------------------------
  |
  | Solo persistimos capacidades conocidas. Si faltan, se regeneran de forma
  | segura según el tipo de conexión.
  |
  */

  clean.capabilities = {
    ...getDefaultCapabilitiesForType(
      clean.connectionType,
    ),
    ...(device.capabilities ?? {}),
    paperSizes:
      device.capabilities?.paperSizes ??
      getDefaultCapabilitiesForType(
        clean.connectionType,
      ).paperSizes,
    jobTypes:
      device.capabilities?.jobTypes ??
      getDefaultCapabilitiesForType(
        clean.connectionType,
      ).jobTypes,
  };

  validatePrinterDevice(
    clean,
  );

  return clean;
}

/*
|--------------------------------------------------------------------------
| SANITIZE PROFILE MAP
|--------------------------------------------------------------------------
*/

function sanitizeProfiles(
  value:
    PrinterDefaultProfiles,
): PrinterDefaultProfiles {
  const clean:
    PrinterDefaultProfiles = {};

  const keys:
    PrinterProfileKey[] = [
    "receipt-58",
    "receipt-80",
    "document",
  ];

  for (
    const key of keys
  ) {
    const device =
      value[key];

    if (!device) {
      continue;
    }

    try {
      clean[key] =
        sanitizeStoredDevice(
          device,
        );
    } catch {
      // Ignoramos únicamente la entrada corrupta.
    }
  }

  return clean;
}

/*
|--------------------------------------------------------------------------
| WRITE PROFILES
|--------------------------------------------------------------------------
*/

async function writeProfiles(
  profiles:
    PrinterDefaultProfiles,
): Promise<void> {
  await AsyncStorage.setItem(
    DEFAULT_PRINTER_PROFILES_STORAGE_KEY,
    JSON.stringify(
      profiles,
    ),
  );
}

/*
|--------------------------------------------------------------------------
| MIGRATION FROM V2 SINGLE DEFAULT
|--------------------------------------------------------------------------
*/

async function migrateLegacyDefault():
  Promise<PrinterDefaultProfiles> {
  try {
    const rawV2 =
      await AsyncStorage.getItem(
        LEGACY_DEFAULT_PRINTER_STORAGE_KEY,
      );

    const rawV1 =
      rawV2
        ? null
        : await AsyncStorage.getItem(
            OLDER_LEGACY_DEFAULT_PRINTER_STORAGE_KEY,
          );

    const raw =
      rawV2 ??
      rawV1;

    if (!raw) {
      return {};
    }

    const legacy =
      sanitizeStoredDevice(
        JSON.parse(
          raw,
        ) as PrinterDevice,
      );

    const profile =
      inferPreferredProfileForDevice(
        legacy,
      );

    const migrated:
      PrinterDefaultProfiles = {
      [profile]:
        legacy,
    };

    await writeProfiles(
      migrated,
    );

    /*
    |------------------------------------------------------------------------
    | Eliminamos la clave vieja solo después de guardar correctamente.
    |------------------------------------------------------------------------
    */

    await AsyncStorage.multiRemove([
      LEGACY_DEFAULT_PRINTER_STORAGE_KEY,
      OLDER_LEGACY_DEFAULT_PRINTER_STORAGE_KEY,
    ]);

    return migrated;
  } catch {
    return {};
  }
}

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/

export const printerStorageService = {
  async getDefaultPrinters():
    Promise<PrinterDefaultProfiles> {
    try {
      const raw =
        await AsyncStorage.getItem(
          DEFAULT_PRINTER_PROFILES_STORAGE_KEY,
        );

      if (!raw) {
        return migrateLegacyDefault();
      }

      const parsed =
        JSON.parse(
          raw,
        ) as PrinterDefaultProfiles;

      const clean =
        sanitizeProfiles(
          parsed,
        );

      /* Reescribe limpio para eliminar entradas inválidas. */
      await writeProfiles(
        clean,
      );

      return clean;
    } catch {
      await AsyncStorage.removeItem(
        DEFAULT_PRINTER_PROFILES_STORAGE_KEY,
      );

      return migrateLegacyDefault();
    }
  },

  async getDefaultPrinter(
    profile:
      PrinterProfileKey,
  ): Promise<PrinterDevice | null> {
    const profiles =
      await this.getDefaultPrinters();

    return (
      profiles[profile] ??
      null
    );
  },

  async setDefaultPrinter(
    profile:
      PrinterProfileKey,
    device:
      PrinterDevice,
  ): Promise<PrinterDevice> {
    const profiles =
      await this.getDefaultPrinters();

    const clean =
      sanitizeStoredDevice(
        device,
      );

    profiles[profile] =
      clean;

    await writeProfiles(
      profiles,
    );

    return clean;
  },

  async clearDefaultPrinter(
    profile:
      PrinterProfileKey,
  ): Promise<void> {
    const profiles =
      await this.getDefaultPrinters();

    delete profiles[
      profile
    ];

    await writeProfiles(
      profiles,
    );
  },

  async clearAllDefaultPrinters():
    Promise<void> {
    await AsyncStorage.removeItem(
      DEFAULT_PRINTER_PROFILES_STORAGE_KEY,
    );

    await AsyncStorage.multiRemove([
      LEGACY_DEFAULT_PRINTER_STORAGE_KEY,
      OLDER_LEGACY_DEFAULT_PRINTER_STORAGE_KEY,
    ]);
  },
};
