import {
  PermissionsAndroid,
  Platform,
} from "react-native";

import {
  buildEscPosPayload,
  buildEscPosTestPage,
} from "../escpos.builder";

import type {
  PrinterAdapter,
  PrinterDevice,
  PrinterPrintJob,
} from "../printer.types";

import {
  validatePrinterDevice,
} from "../printer.validation";

/*
|--------------------------------------------------------------------------
| BLUETOOTH MODULE
|--------------------------------------------------------------------------
*/

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
      "No se encontró react-native-bluetooth-classic. Esta función requiere un Development Build de Expo.",
    );
  }
}

/*
|--------------------------------------------------------------------------
| ANDROID PERMISSION
|--------------------------------------------------------------------------
|
| We only ask for CONNECT because this implementation lists BONDED devices.
| It does not perform broad nearby-device discovery.
|
*/

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

  if (
    version <
    31
  ) {
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
          "CatuDrive necesita permiso para conectarse únicamente con impresoras Bluetooth previamente emparejadas.",

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

/*
|--------------------------------------------------------------------------
| BONDED DEVICES
|--------------------------------------------------------------------------
*/

async function listBondedDevices():
  Promise<
    PrinterDevice[]
  > {
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
    }),
  );
}

/*
|--------------------------------------------------------------------------
| CONNECT
|--------------------------------------------------------------------------
*/

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
        () =>
          false,
      );

  if (
    alreadyConnected
  ) {
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

/*
|--------------------------------------------------------------------------
| SEND
|--------------------------------------------------------------------------
*/

async function sendBluetooth(
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

/*
|--------------------------------------------------------------------------
| ADAPTER
|--------------------------------------------------------------------------
*/

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
    /*
    |--------------------------------------------------------------------------
    | Security decision:
    | We intentionally expose only bonded devices.
    | Pairing must happen through the operating system first.
    |--------------------------------------------------------------------------
    */

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
          () =>
            false,
        );

    if (
      connected
    ) {
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
        "document" &&
      !job.text
    ) {
      throw new Error(
        "Este adaptador Bluetooth está pensado para impresoras térmicas ESC/POS. Para Carta/A4 utiliza la impresora del sistema o un SDK específico del fabricante.",
      );
    }

    const payload =
      buildEscPosPayload(
        job.text ??
          "",
        {
          title:
            job.title,

          cutPaper:
            job.cutPaper,
        },
      );

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
      await sendBluetooth(
        device,
        payload,
      );
    }
  },
};

/*
|--------------------------------------------------------------------------
| TEST PRINT
|--------------------------------------------------------------------------
*/

export async function printBluetoothTestPage(
  device:
    PrinterDevice,
): Promise<void> {
  await sendBluetooth(
    device,
    buildEscPosTestPage(
      device.name,
    ),
  );
}
