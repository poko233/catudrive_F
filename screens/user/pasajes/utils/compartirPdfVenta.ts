import { Platform } from "react-native";
// @ts-ignore - API legacy de expo-file-system
import * as FileSystemNS from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { descargarPdf } from "../services/pasajes.service";

// Se usa el API legacy (writeAsStringAsync / cacheDirectory / EncodingType)
// tipado como any, igual que en QrProfileCard.
const FileSystem = FileSystemNS as any;

/*
|--------------------------------------------------------------------------
| CONVERTIR BLOB A BASE64 (MÓVIL)
|--------------------------------------------------------------------------
*/

function blobABase64(blob: Blob): Promise<string> {
  return blob.arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    const partes: string[] = [];
    for (let i = 0; i < bytes.length; i++) {
      partes.push(String.fromCharCode(bytes[i]));
    }
    return btoa(partes.join(""));
  });
}

/*
|--------------------------------------------------------------------------
| COMPARTIR / DESCARGAR PDF DE LA VENTA
|--------------------------------------------------------------------------
*/

export async function compartirPdfVenta(ventaId: number): Promise<void> {
  const blob = await descargarPdf(ventaId);
  const nombre = `boleto_${ventaId}.pdf`;

  /*
  |--------------------------------------------------------------------------
  | WEB
  |--------------------------------------------------------------------------
  */

  if (Platform.OS === "web") {
    const document = (globalThis as any).document;
    if (!document) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nombre;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | MÓVIL
  |--------------------------------------------------------------------------
  */

  const base64 = await blobABase64(blob);
  const fileUri = `${FileSystem.cacheDirectory}${nombre}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: "application/pdf",
      dialogTitle: "Compartir boleto",
      UTI: "com.adobe.pdf",
    });
  } else {
    Toast.show({
      type: "info",
      text1: "Boleto guardado",
      text2: fileUri,
    });
  }
}