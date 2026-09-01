// storage/secureStorage.ts

import { Platform } from "react-native";

const isWeb =
  Platform.OS === "web";

// ─────────────────────────────────────────────
// Claves de almacenamiento
// ─────────────────────────────────────────────

const TOKEN_KEY = "token";

const SUCURSAL_ID_KEY =
  "sucursal_id";

const SECRET_KEY =
  process.env.EXPO_PUBLIC_MASTER_KEY;

// ─────────────────────────────────────────────
// Validación
// ─────────────────────────────────────────────

function getSecretKey(): string {
  if (
    !SECRET_KEY ||
    SECRET_KEY.trim().length === 0
  ) {
    throw new Error(
      "EXPO_PUBLIC_MASTER_KEY no está configurada.",
    );
  }

  return SECRET_KEY;
}

// ─────────────────────────────────────────────
// Helpers Base64
// ─────────────────────────────────────────────

function bufferSourceToBase64(
  source: BufferSource,
): string {
  let bytes: Uint8Array;

  if (
    source instanceof ArrayBuffer
  ) {
    bytes =
      new Uint8Array(
        source,
      );
  } else {
    bytes =
      new Uint8Array(
        source.buffer,
        source.byteOffset,
        source.byteLength,
      );
  }

  let binary = "";

  bytes.forEach(
    (byte) => {
      binary +=
        String.fromCharCode(
          byte,
        );
    },
  );

  return btoa(binary);
}

function base64ToArrayBuffer(
  base64: string,
): ArrayBuffer {
  const binary =
    atob(base64);

  const bytes =
    new Uint8Array(
      binary.length,
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes.buffer;
}

function str2ab(
  value: string,
): ArrayBuffer {
  return new TextEncoder()
    .encode(value)
    .buffer;
}

// ─────────────────────────────────────────────
// Generar clave AES
// ─────────────────────────────────────────────

async function getKey(): Promise<CryptoKey> {
  const secret =
    getSecretKey();

  if (
    typeof crypto ===
      "undefined" ||
    !crypto.subtle
  ) {
    throw new Error(
      "Web Crypto API no está disponible.",
    );
  }

  const keyMaterial =
    await crypto.subtle.importKey(
      "raw",

      str2ab(secret),

      "PBKDF2",

      false,

      [
        "deriveKey",
      ],
    );

  const salt =
    str2ab(
      "tecnologicosf-salt",
    );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",

      salt,

      iterations:
        100000,

      hash: "SHA-256",
    },

    keyMaterial,

    {
      name: "AES-GCM",
      length: 256,
    },

    false,

    [
      "encrypt",
      "decrypt",
    ],
  );
}

// ─────────────────────────────────────────────
// Guardar
// ─────────────────────────────────────────────

async function encryptedSetItem(
  key: string,
  value: string,
): Promise<void> {
  // ───────────────────────────────────────────
  // Android / iOS
  // ───────────────────────────────────────────

  if (!isWeb) {
    const {
      default: SecureStore,
    } =
      await import(
        "expo-secure-store"
      );

    await SecureStore.setItemAsync(
      key,
      value,
    );

    return;
  }

  // ───────────────────────────────────────────
  // Web
  // ───────────────────────────────────────────

  if (
    typeof localStorage ===
    "undefined"
  ) {
    throw new Error(
      "localStorage no está disponible.",
    );
  }

  /**
   * IMPORTANTE:
   *
   * Ya NO existe fallback a texto plano.
   *
   * Si el cifrado falla:
   * - NO guardamos el token
   * - propagamos el error
   */
  const cryptoKey =
    await getKey();

  const iv =
    crypto.getRandomValues(
      new Uint8Array(12),
    );

  const encoded =
    str2ab(value);

  const encrypted =
    await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },

      cryptoKey,

      encoded,
    );

  const storageValue = {
    version: 1,

    iv:
      bufferSourceToBase64(
        iv,
      ),

    data:
      bufferSourceToBase64(
        encrypted,
      ),
  };

  localStorage.setItem(
    key,
    JSON.stringify(
      storageValue,
    ),
  );
}

// ─────────────────────────────────────────────
// Leer
// ─────────────────────────────────────────────

async function encryptedGetItem(
  key: string,
): Promise<string | null> {
  // ───────────────────────────────────────────
  // Android / iOS
  // ───────────────────────────────────────────

  if (!isWeb) {
    try {
      const {
        default: SecureStore,
      } =
        await import(
          "expo-secure-store"
        );

      return await SecureStore.getItemAsync(
        key,
      );
    } catch {
      return null;
    }
  }

  // ───────────────────────────────────────────
  // Web
  // ───────────────────────────────────────────

  if (
    typeof localStorage ===
    "undefined"
  ) {
    return null;
  }

  const stored =
    localStorage.getItem(
      key,
    );

  if (!stored) {
    return null;
  }

  try {
    const parsed =
      JSON.parse(stored);

    /**
     * Rechazamos cualquier valor antiguo
     * guardado directamente como string.
     */
    if (
      !parsed ||
      typeof parsed !==
        "object" ||
      typeof parsed.iv !==
        "string" ||
      typeof parsed.data !==
        "string"
    ) {
      throw new Error(
        "Formato de almacenamiento inválido.",
      );
    }

    const cryptoKey =
      await getKey();

    const ivBuffer =
      base64ToArrayBuffer(
        parsed.iv,
      );

    const dataBuffer =
      base64ToArrayBuffer(
        parsed.data,
      );

    const decrypted =
      await crypto.subtle.decrypt(
        {
          name: "AES-GCM",

          iv:
            new Uint8Array(
              ivBuffer,
            ),
        },

        cryptoKey,

        dataBuffer,
      );

    return new TextDecoder()
      .decode(
        decrypted,
      );
  } catch {
    /**
     * IMPORTANTE:
     *
     * Antes:
     *
     * return stored;
     *
     * Eso permitía aceptar tokens
     * antiguos en texto plano.
     *
     * Ahora cualquier dato inválido,
     * corrupto o no cifrado se elimina.
     */
    localStorage.removeItem(
      key,
    );

    return null;
  }
}

// ─────────────────────────────────────────────
// Eliminar
// ─────────────────────────────────────────────

async function encryptedRemoveItem(
  key: string,
): Promise<void> {
  // ───────────────────────────────────────────
  // Android / iOS
  // ───────────────────────────────────────────

  if (!isWeb) {
    try {
      const {
        default: SecureStore,
      } =
        await import(
          "expo-secure-store"
        );

      await SecureStore.deleteItemAsync(
        key,
      );
    } catch {
      /**
       * No bloqueamos logout por
       * fallo de SecureStore.
       */
    }

    return;
  }

  // ───────────────────────────────────────────
  // Web
  // ───────────────────────────────────────────

  if (
    typeof localStorage !==
    "undefined"
  ) {
    localStorage.removeItem(
      key,
    );
  }
}

// ─────────────────────────────────────────────
// Token
// ─────────────────────────────────────────────

export async function saveToken(
  token: string,
): Promise<void> {
  await encryptedSetItem(
    TOKEN_KEY,
    token,
  );
}

export async function getToken(): Promise<
  string | null
> {
  return encryptedGetItem(
    TOKEN_KEY,
  );
}

// ─────────────────────────────────────────────
// Sucursal
// ─────────────────────────────────────────────

export async function saveSucursalId(
  id: number | null,
): Promise<void> {
  if (id === null) {
    await encryptedRemoveItem(
      SUCURSAL_ID_KEY,
    );

    return;
  }

  await encryptedSetItem(
    SUCURSAL_ID_KEY,
    String(id),
  );
}

export async function getSucursalId(): Promise<
  number | null
> {
  const raw =
    await encryptedGetItem(
      SUCURSAL_ID_KEY,
    );

  if (!raw) {
    return null;
  }

  const parsed =
    Number.parseInt(
      raw,
      10,
    );

  return Number.isNaN(
    parsed,
  )
    ? null
    : parsed;
}

// ─────────────────────────────────────────────
// Limpiar sesión
// ─────────────────────────────────────────────

export async function clearSession(): Promise<void> {
  await Promise.all([
    encryptedRemoveItem(
      TOKEN_KEY,
    ),

    encryptedRemoveItem(
      SUCURSAL_ID_KEY,
    ),
  ]);
}