// utils/decryptApiToken.ts

import CryptoJS from "crypto-js";

/*
|--------------------------------------------------------------------------
| DESCIFRADO DEL API TOKEN DE EMPRESA
|--------------------------------------------------------------------------
|
| Idéntico patrón al usado en utils/qrCrypto.ts:
|
| - Ciphertext recibido en Base62 (proveniente del backend)
| - AES-256-CBC
| - IV = primeros 16 bytes de la clave (32 hex chars)
| - Clave desde EXPO_PUBLIC_QR_SECRET_KEY (64 hex)
|
| Devuelve el plaintext o null si algo falla.
|
*/

const BASE62_CHARS =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function base62ToBytes(
  str: string,
): Uint8Array {
  const clean = str.replace(
    /[^0-9A-Za-z]/g,
    "",
  );

  if (clean.length === 0) {
    throw new Error(
      "Base62 vacío",
    );
  }

  let big = 0n;

  for (const char of clean) {
    const index =
      BASE62_CHARS.indexOf(
        char,
      );

    if (index === -1) {
      continue;
    }

    big =
      big * 62n +
      BigInt(index);
  }

  if (big === 0n) {
    return new Uint8Array([
      0,
    ]);
  }

  const hex = big.toString(
    16,
  );

  const byteLength = Math.ceil(
    hex.length / 2,
  );

  const bytes = new Uint8Array(
    byteLength,
  );

  for (
    let index = 0;
    index < byteLength;
    index++
  ) {
    const slice =
      hex.substring(
        index * 2,
        index * 2 + 2,
      ) || "0";

    bytes[index] =
      parseInt(
        slice,
        16,
      );
  }

  return bytes;
}

function getKeyHex(): string | null {
  const raw =
    (
      process.env
        .EXPO_PUBLIC_QR_SECRET_KEY ??
      ""
    ).replace(
      /[^0-9a-fA-F]/g,
      "",
    );

  if (raw.length !== 64) {
    return null;
  }

  return raw;
}

export function decryptApiToken(
  encryptedBase62: string | null | undefined,
): string | null {
  if (!encryptedBase62) {
    return null;
  }

  const keyHex = getKeyHex();

  if (!keyHex) {
    return null;
  }

  try {
    const ciphertextBytes =
      base62ToBytes(
        encryptedBase62,
      );

    const ivHex = keyHex.substring(
      0,
      32,
    );

    const iv =
      CryptoJS.enc.Hex.parse(
        ivHex,
      );

    const key =
      CryptoJS.enc.Hex.parse(
        keyHex,
      );

    const ciphertext =
      CryptoJS.lib.WordArray.create(
        ciphertextBytes,
      );

    const decrypted =
      CryptoJS.AES.decrypt(
        {
          ciphertext,
        } as unknown as CryptoJS.lib.CipherParams,
        key,
        {
          iv,
          mode:
            CryptoJS.mode.CBC,
          padding:
            CryptoJS.pad.Pkcs7,
        },
      );

    const plain =
      decrypted.toString(
        CryptoJS.enc.Utf8,
      );

    if (!plain) {
      return null;
    }

    return plain;
  } catch {
    return null;
  }
}

export default decryptApiToken;