import {
  Platform,
} from "react-native";

// @ts-ignore - API legacy de expo-file-system
import * as FileSystemNS from "expo-file-system";

import * as Sharing from "expo-sharing";

import Toast from "react-native-toast-message";

import {
  TipoReporteVehiculo,
} from "../types/vehiculo-reporte.types";

const FileSystem =
  FileSystemNS as any;

/*
|--------------------------------------------------------------------------
| NOMBRE
|--------------------------------------------------------------------------
|
| Convención espejo del backend (nombreArchivo()):
| reporte-vehiculos-{tipo-con-guiones}-{Ymd-His}.pdf
|
*/

function fechaArchivo(): string {
  const ahora =
    new Date();

  const pad =
    (
      valor:
        number,
    ) =>
      String(
        valor,
      ).padStart(
        2,
        "0",
      );

  return [
    ahora.getFullYear(),
    pad(
      ahora.getMonth() +
      1,
    ),
    pad(
      ahora.getDate(),
    ),
    "-",
    pad(
      ahora.getHours(),
    ),
    pad(
      ahora.getMinutes(),
    ),
    pad(
      ahora.getSeconds(),
    ),
  ].join(
    "",
  );
}

export function nombreReporteVehiculo(
  tipo:
    TipoReporteVehiculo,
): string {
  return `reporte-vehiculos-${tipo.replace(
    /_/g,
    "-",
  )}-${fechaArchivo()}.pdf`;
}

/*
|--------------------------------------------------------------------------
| BLOB -> BASE64
|--------------------------------------------------------------------------
*/

async function blobABase64(
  blob:
    Blob,
): Promise<string> {
  const buffer =
    await blob.arrayBuffer();

  const bytes =
    new Uint8Array(
      buffer,
    );

  let binary =
    "";

  const chunkSize =
    0x8000;

  for (
    let offset =
      0;
    offset <
      bytes.length;
    offset +=
      chunkSize
  ) {
    binary +=
      String.fromCharCode(
        ...bytes.subarray(
          offset,
          Math.min(
            offset +
            chunkSize,
            bytes.length,
          ),
        ),
      );
  }

  return btoa(
    binary,
  );
}

/*
|--------------------------------------------------------------------------
| DESCARGAR / COMPARTIR
|--------------------------------------------------------------------------
*/

export async function descargarReporteVehiculo(
  blob:
    Blob,

  nombre:
    string,
): Promise<void> {
  if (
    Platform.OS ===
    "web"
  ) {
    const document =
      (globalThis as any)
        .document;

    if (!document) {
      throw new Error(
        "No se pudo iniciar la descarga en el navegador.",
      );
    }

    const url =
      URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        "a",
      );

    link.href =
      url;

    link.download =
      nombre;

    link.rel =
      "noopener noreferrer";

    document.body.appendChild(
      link,
    );

    link.click();

    document.body.removeChild(
      link,
    );

    URL.revokeObjectURL(
      url,
    );

    return;
  }

  const base64 =
    await blobABase64(
      blob,
    );

  const fileUri =
    `${FileSystem.cacheDirectory}${nombre}`;

  await FileSystem
    .writeAsStringAsync(
      fileUri,
      base64,
      {
        encoding:
          FileSystem.EncodingType.Base64,
      },
    );

  if (
    await Sharing
      .isAvailableAsync()
  ) {
    await Sharing
      .shareAsync(
        fileUri,
        {
          mimeType:
            "application/pdf",

          dialogTitle:
            "Guardar o compartir reporte PDF",

          UTI:
            "com.adobe.pdf",
        },
      );

    return;
  }

  Toast.show({
    type:
      "info",

    text1:
      "Reporte generado",

    text2:
      fileUri,
  });
}
