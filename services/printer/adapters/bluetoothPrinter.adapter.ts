import {
  PermissionsAndroid,
  Platform,
} from "react-native";

import {
  buildEscPosPayload,
  buildEscPosTestPage,
} from "../escpos.builder";

import {
  buildEscPosRasterPayloadBase64,
} from "../escpos.raster";

import type {
  PrinterAdapter,
  PrinterDevice,
  PrinterPrintJob,
} from "../printer.types";

import {
  validatePrinterDevice,
} from "../printer.validation";

async function getBluetoothModule() {
  if (
    Platform.OS ===
    "web"
  ) {
    throw new Error(
      "Bluetooth Classic no está disponible desde la versión web.",
    );
  }

  try {
    const module =
      await import(
        "react-native-bluetooth-classic"
      );

    return module.default;
  } catch {
    throw new Error(
      "No se encontró react-native-bluetooth-classic. Esta función requiere un Development Build / APK nativa de Expo.",
    );
  }
}

async function requestBluetoothConnectPermission():
  Promise<boolean> {
  if (
    Platform.OS !==
    "android"
  ) {
    return true;
  }

  const version =
    Number(
      Platform.Version,
    );

  if (version < 31) {
    return true;
  }

  const permission =
    PermissionsAndroid
      .PERMISSIONS
      .BLUETOOTH_CONNECT;

  if (!permission) {
    return true;
  }

  const result =
    await PermissionsAndroid.request(
      permission,
      {
        title:
          "Conectar impresora Bluetooth",
        message:
          "CatuDrive necesita permiso para conectarse con impresoras Bluetooth previamente emparejadas.",
        buttonPositive:
          "Permitir",
        buttonNegative:
          "Cancelar",
      },
    );

  return (
    result ===
    PermissionsAndroid
      .RESULTS
      .GRANTED
  );
}

async function listBondedDevices():
  Promise<PrinterDevice[]> {
  const allowed =
    await requestBluetoothConnectPermission();

  if (!allowed) {
    throw new Error(
      "Permiso Bluetooth denegado.",
    );
  }

  const Bluetooth =
    await getBluetoothModule();

  const devices =
    await Bluetooth.getBondedDevices();

  return devices.map(
    (
      device:
        any,
    ): PrinterDevice => ({
      id:
        String(
          device.id ??
            device.address,
        ),
      name:
        String(
          device.name ??
            "Impresora Bluetooth",
        ),
      connectionType:
        "bluetooth",
      macAddress:
        device.address
          ? String(
              device.address,
            )
          : undefined,
      paired:
        true,
      status:
        "disconnected",
      capabilities: {
        paperSizes: [
          "receipt-58",
          "receipt-80",
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
    }),
  );
}

async function connectBluetooth(
  device:
    PrinterDevice,
): Promise<void> {
  validatePrinterDevice(
    device,
  );

  const allowed =
    await requestBluetoothConnectPermission();

  if (!allowed) {
    throw new Error(
      "Permiso Bluetooth denegado.",
    );
  }

  const Bluetooth =
    await getBluetoothModule();

  const alreadyConnected =
    await Bluetooth
      .isDeviceConnected(
        device.id,
      )
      .catch(
        () => false,
      );

  if (alreadyConnected) {
    return;
  }

  await Bluetooth.connectToDevice(
    device.id,
    {
      connectorType:
        "rfcomm",
      connectionType:
        "binary",
      delimiter:
        "\n",
      charset:
        "ascii",
      secureSocket:
        true,
    },
  );
}

async function sendBluetoothText(
  device:
    PrinterDevice,
  payload:
    string,
): Promise<void> {
  await connectBluetooth(
    device,
  );

  const Bluetooth =
    await getBluetoothModule();

  await Bluetooth.writeToDevice(
    device.id,
    payload,
  );
}

/**
 * react-native-bluetooth-classic acepta una codificación base64.
 * Así enviamos bytes binarios ESC/POS sin corromperlos como UTF-8.
 */
async function sendBluetoothBase64(
  device:
    PrinterDevice,
  payloadBase64:
    string,
): Promise<void> {
  await connectBluetooth(
    device,
  );

  const Bluetooth =
    await getBluetoothModule();

  /*
   * Las térmicas Bluetooth económicas suelen tener un buffer pequeño.
   * Enviamos el raster en bloques base64 (4096 chars = 3072 bytes) para
   * evitar desbordar el buffer de la impresora con una sola escritura grande.
   */
  const CHUNK_BASE64_CHARS =
    4096; // múltiplo de 4

  for (
    let offset = 0;
    offset < payloadBase64.length;
    offset += CHUNK_BASE64_CHARS
  ) {
    const chunk =
      payloadBase64.slice(
        offset,
        offset + CHUNK_BASE64_CHARS,
      );

    await Bluetooth.writeToDevice(
      device.id,
      chunk,
      "base64",
    );

    /* Da tiempo al buffer serie de la térmica para consumir el bloque. */
    await new Promise<void>(
      (resolve) =>
        setTimeout(
          resolve,
          8,
        ),
    );
  }
}

export const bluetoothPrinterAdapter:
  PrinterAdapter = {
  type:
    "bluetooth",

  isSupported() {
    return (
      Platform.OS ===
        "android" ||
      Platform.OS ===
        "ios"
    );
  },

  async discover() {
    /* Solo dispositivos previamente emparejados. */
    return listBondedDevices();
  },

  async connect(
    device,
  ) {
    await connectBluetooth(
      device,
    );

    return {
      ...device,
      paired:
        true,
      status:
        "connected",
    };
  },

  async disconnect(
    device,
  ) {
    const Bluetooth =
      await getBluetoothModule();

    const connected =
      await Bluetooth
        .isDeviceConnected(
          device.id,
        )
        .catch(
          () => false,
        );

    if (connected) {
      await Bluetooth.disconnectFromDevice(
        device.id,
      );
    }
  },

  async testConnection(
    device,
  ) {
    try {
      await connectBluetooth(
        device,
      );

      const Bluetooth =
        await getBluetoothModule();

      return await Bluetooth.isDeviceConnected(
        device.id,
      );
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
    if (
      job.type ===
      "document"
    ) {
      throw new Error(
        "Este adaptador Bluetooth está destinado a impresoras térmicas ESC/POS. Para Carta/A4 utiliza la impresora del sistema.",
      );
    }

    const copies =
      job.copies ?? 1;

    /*
    |------------------------------------------------------------------------
    | PRIORIDAD 1: RASTER OFICIAL DEL BACKEND
    |------------------------------------------------------------------------
    */
    if (
      job.rasterImage?.base64
    ) {
      const payloadBase64 =
        buildEscPosRasterPayloadBase64(
          job.rasterImage.base64,
          {
            threshold:
              job.rasterImage.threshold,
            cutPaper:
              job.cutPaper,
            feedLines:
              3,
          },
        );

      for (
        let copy = 0;
        copy < copies;
        copy++
      ) {
        await sendBluetoothBase64(
          device,
          payloadBase64,
        );
      }

      return;
    }

    /* Fallback legacy de texto para otros módulos. */
    if (!job.text) {
      throw new Error(
        "La impresora Bluetooth necesita la imagen raster del ticket o texto ESC/POS.",
      );
    }

    const payload =
      buildEscPosPayload(
        job.text,
        {
          title:
            job.title,
          cutPaper:
            job.cutPaper,
        },
      );

    for (
      let copy = 0;
      copy < copies;
      copy++
    ) {
      await sendBluetoothText(
        device,
        payload,
      );
    }
  },
};

export async function printBluetoothTestPage(
  device:
    PrinterDevice,
): Promise<void> {
  await sendBluetoothText(
    device,
    buildEscPosTestPage(
      device.name,
    ),
  );
}
