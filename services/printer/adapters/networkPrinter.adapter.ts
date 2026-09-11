import {
  Platform,
} from "react-native";

import {
  PRINTER_CONNECT_TIMEOUT_MS,
} from "../printer.constants";

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

async function getTcpSocketModule() {
  if (
    Platform.OS ===
    "web"
  ) {
    throw new Error(
      "La impresión RAW por red no está disponible directamente desde la versión web.",
    );
  }

  try {
    const module =
      await import(
        "react-native-tcp-socket"
      );

    return module.default;
  } catch {
    throw new Error(
      "No se encontró el módulo nativo react-native-tcp-socket. Usa un Development Build / APK nativa de Expo.",
    );
  }
}

async function openConnection(
  device:
    PrinterDevice,
): Promise<any> {
  validatePrinterDevice(
    device,
  );

  const TcpSocket =
    await getTcpSocketModule();

  const host =
    device.ipAddress!;
  const port =
    device.port!;

  return new Promise(
    (
      resolve,
      reject,
    ) => {
      let settled =
        false;

      const client =
        TcpSocket.createConnection(
          {
            host,
            port,
            connectTimeout:
              PRINTER_CONNECT_TIMEOUT_MS,
            reuseAddress:
              true,
            ...(Platform.OS === "android"
              ? {
                  interface:
                    "wifi",
                }
              : {}),
          },
          () => {
            if (settled) {
              return;
            }

            settled =
              true;
            resolve(
              client,
            );
          },
        );

      client.on(
        "error",
        (
          error:
            unknown,
        ) => {
          if (settled) {
            return;
          }

          settled =
            true;

          try {
            client.destroy();
          } catch {
            // ignore
          }

          reject(
            error,
          );
        },
      );

      client.setTimeout(
        PRINTER_CONNECT_TIMEOUT_MS,
        () => {
          if (settled) {
            return;
          }

          settled =
            true;

          try {
            client.destroy();
          } catch {
            // ignore
          }

          reject(
            new Error(
              "Tiempo de conexión agotado.",
            ),
          );
        },
      );
    },
  );
}

async function sendRawText(
  device:
    PrinterDevice,
  payload:
    string,
): Promise<void> {
  const client =
    await openConnection(
      device,
    );

  await new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      let finished =
        false;

      const finish =
        (
          error?:
            unknown,
        ) => {
          if (finished) {
            return;
          }

          finished =
            true;

          try {
            client.end();
          } catch {
            try {
              client.destroy();
            } catch {
              // ignore
            }
          }

          if (error) {
            reject(
              error,
            );
            return;
          }

          resolve();
        };

      client.on(
        "error",
        finish,
      );

      client.write(
        payload,
        "utf8",
        () => finish(),
      );
    },
  );
}

/**
 * react-native-tcp-socket imita Node net.Socket:
 * write(data, "base64") decodifica el Base64 y envía bytes binarios reales.
 */
async function sendRawBase64(
  device:
    PrinterDevice,
  payloadBase64:
    string,
): Promise<void> {
  const client =
    await openConnection(
      device,
    );

  await new Promise<void>(
    (
      resolve,
      reject,
    ) => {
      let finished =
        false;

      const finish =
        (
          error?:
            unknown,
        ) => {
          if (finished) {
            return;
          }

          finished =
            true;

          try {
            client.end();
          } catch {
            try {
              client.destroy();
            } catch {
              // ignore
            }
          }

          if (error) {
            reject(
              error,
            );
            return;
          }

          resolve();
        };

      client.on(
        "error",
        finish,
      );

      client.write(
        payloadBase64,
        "base64",
        () => finish(),
      );
    },
  );
}

export const networkPrinterAdapter:
  PrinterAdapter = {
  type:
    "network",

  isSupported() {
    return (
      Platform.OS !==
      "web"
    );
  },

  async connect(
    device,
  ) {
    validatePrinterDevice(
      device,
    );

    const socket =
      await openConnection(
        device,
      );

    try {
      socket.end();
    } catch {
      socket.destroy?.();
    }

    return {
      ...device,
      status:
        "connected",
    };
  },

  async disconnect() {
    /* RAW TCP: socket corto por trabajo. */
  },

  async testConnection(
    device,
  ) {
    try {
      const socket =
        await openConnection(
          device,
        );

      try {
        socket.end();
      } catch {
        socket.destroy?.();
      }

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
    if (
      job.type ===
      "document"
    ) {
      throw new Error(
        "La conexión RAW TCP 9100 de este adaptador está destinada a impresoras ESC/POS. Para Carta/A4 utiliza la impresora del sistema.",
      );
    }

    const copies =
      job.copies ?? 1;

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
        await sendRawBase64(
          device,
          payloadBase64,
        );
      }

      return;
    }

    if (!job.text) {
      throw new Error(
        "La impresora de red necesita la imagen raster del ticket o texto ESC/POS.",
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
      await sendRawText(
        device,
        payload,
      );
    }
  },
};

export async function printNetworkTestPage(
  device:
    PrinterDevice,
): Promise<void> {
  await sendRawText(
    device,
    buildEscPosTestPage(
      device.name,
    ),
  );
}
