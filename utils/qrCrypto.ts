import CryptoJS from "crypto-js";

// Obtener y limpiar la clave
let QR_KEY = process.env.EXPO_PUBLIC_QR_SECRET_KEY ?? "";
QR_KEY = QR_KEY.replace(/[^0-9a-fA-F]/g, "");

if (!QR_KEY || QR_KEY.length !== 64) {
  console.error(
    `🔐 QR_KEY inválida (longitud ${QR_KEY.length}, se esperaban 64 caracteres hex)`,
  );
}

const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Decodifica una cadena Base62 a bytes (Uint8Array).
 * A diferencia del frontend anterior, no espera prefijo de longitud.
 */
function base62ToBytes(str: string): Uint8Array {
  str = str.replace(/[^0-9A-Za-z]/g, "");
  if (str.length === 0) throw new Error("Base62 vacío");

  let bi = 0n;
  for (const ch of str) {
    const idx = BASE62_CHARS.indexOf(ch);
    if (idx === -1) continue;
    bi = bi * 62n + BigInt(idx);
  }

  // Convertir BigInt a bytes (big‑endian)
  if (bi === 0n) return new Uint8Array([0]);
  const hex = bi.toString(16);
  const len = Math.ceil(hex.length / 2);
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2) || "0", 16);
  }
  return bytes;
}

/**
 * Desencripta un QR que contiene solo el ciphertext (sin IV).
 * El IV es fijo: primeros 16 bytes de la clave (igual que el backend).
 */
export function decryptQrData(qrData: string): number | null {
  try {
    console.log("🔐 [CRYPTO_DEBUG] Iniciando desencriptación...");
    console.log(
      `🔐 [CRYPTO_DEBUG] QR Original (Longitud: ${qrData.length}): ${qrData}`,
    );

    // 1. Decodificar Base62 → ciphertext puro
    const ciphertextBytes = base62ToBytes(qrData);
    console.log(
      `🔐 [CRYPTO_DEBUG] Ciphertext (${ciphertextBytes.length} bytes)`,
    );

    // 2. IV fijo: primeros 16 bytes de la clave
    const keyHex = QR_KEY;
    const ivHex = keyHex.substring(0, 32); // 16 bytes = 32 hex chars
    const iv = CryptoJS.enc.Hex.parse(ivHex);
    console.log(`🔐 [CRYPTO_DEBUG] IV (Hex): ${ivHex}`);

    // 3. Clave AES y ciphertext como WordArray
    const keyWordArray = CryptoJS.enc.Hex.parse(keyHex);
    const ciphertext = CryptoJS.lib.WordArray.create(ciphertextBytes);

    // 4. Desencriptar
    const decrypted = CryptoJS.AES.decrypt(
      { ciphertext } as any,
      keyWordArray,
      { iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 },
    );

    const resultHex = decrypted.toString();
    console.log(
      `🔐 [CRYPTO_DEBUG] Resultado Crudo Desencriptado (Hex): ${resultHex}`,
    );

    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    if (!jsonString) {
      console.error("🔐 [CRYPTO_DEBUG] No se pudo convertir a UTF-8");
      return null;
    }

    console.log(
      `🔐 [CRYPTO_DEBUG] Payload descifrado como texto: ${jsonString}`,
    );

    const payload = JSON.parse(jsonString);
    if (payload.user_id && typeof payload.user_id === "number") {
      console.log(
        `✅ [CRYPTO_DEBUG] Desencriptación exitosa. User ID: ${payload.user_id}`,
      );
      return payload.user_id;
    }
    return null;
  } catch (error) {
    console.error("❌ Error al desencriptar QR:", error);
    return null;
  }
}
