// http/httpClient.ts

import Toast from "react-native-toast-message";

import {
  getToken,
} from "../storage/secureStorage";

import {
  ApiError,
  isApiError,
} from "./ApiError";

import {
  getHttpSucursalId,
  handleHttpUnauthorized,
} from "./httpSession";

// ─────────────────────────────────────────────
// Configuración base
// ─────────────────────────────────────────────

const FALLBACK_API_URL =
  "http://192.168.100.65:8000";

export const BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL?.trim() ||
  FALLBACK_API_URL
).replace(
  /\/+$/,
  "",
);

const DEFAULT_TIMEOUT_MS =
  30_000;

// ─────────────────────────────────────────────
// Configuración de requests
// ─────────────────────────────────────────────

export interface HttpRequestConfig {
  /**
   * false:
   *
   * No ejecutar limpieza automática
   * de sesión cuando Laravel responda 401.
   *
   * Principalmente utilizado en logout.
   */
  handleUnauthorized?: boolean;

  /**
   * Timeout personalizado en milisegundos.
   *
   * Ejemplos:
   *
   * 10000 = 10 segundos
   * 60000 = 1 minuto
   * 0     = sin timeout
   */
  timeoutMs?: number;

  /**
   * AbortSignal externo para cancelar
   * manualmente la petición.
   */
  signal?: AbortSignal;
}

interface RequestSignalResult {
  signal: AbortSignal;

  cleanup: () => void;

  didTimeout: () => boolean;

  didExternalAbort:
    () => boolean;
}

// ─────────────────────────────────────────────
// Parsear mensaje de error
// ─────────────────────────────────────────────

async function parseErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const text =
    await res
      .text()
      .catch(() => "");

  if (!text) {
    return fallback;
  }

  try {
    const json =
      JSON.parse(text);

    if (
      typeof json?.message ===
      "string"
    ) {
      return json.message;
    }

    if (
      typeof json?.error ===
      "string"
    ) {
      return json.error;
    }

    if (json?.errors) {
      return "Algunos datos ya se encuentran registrados o son inválidos.";
    }

    return fallback;
  } catch {
    return text || fallback;
  }
}

// ─────────────────────────────────────────────
// Headers
// ─────────────────────────────────────────────

async function buildHeaders(
  authenticated: boolean,
  includeContentType = true,
): Promise<Record<string, string>> {
  const headers:
    Record<string, string> = {
      Accept:
        "application/json",
    };

  if (includeContentType) {
    headers[
      "Content-Type"
    ] = "application/json";
  }

  if (!authenticated) {
    return headers;
  }

  // ───────────────────────────────────────────
  // Token
  // ───────────────────────────────────────────

  const token =
    await getToken();

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  // ───────────────────────────────────────────
  // Sucursal
  // ───────────────────────────────────────────

  const sucursalId =
    getHttpSucursalId();

  if (
    sucursalId !== null
  ) {
    headers[
      "X-Sucursal-Id"
    ] = String(
      sucursalId,
    );
  }

  return headers;
}

// ─────────────────────────────────────────────
// Manejo global de 401
// ─────────────────────────────────────────────

async function processUnauthorized(
  status: number,
  authenticated: boolean,
  config: HttpRequestConfig,
): Promise<void> {
  if (
    authenticated &&
    status === 401 &&
    config.handleUnauthorized !==
      false
  ) {
    await handleHttpUnauthorized();
  }
}

// ─────────────────────────────────────────────
// Timeout + AbortController
// ─────────────────────────────────────────────

function createRequestSignal(
  config: HttpRequestConfig = {},
): RequestSignalResult {
  const controller =
    new AbortController();

  const timeoutMs =
    config.timeoutMs ??
    DEFAULT_TIMEOUT_MS;

  const externalSignal =
    config.signal;

  let timedOut =
    false;

  let externalAborted =
    false;

  let timeoutId:
    ReturnType<
      typeof setTimeout
    > | null =
    null;

  // ───────────────────────────────────────────
  // Cancelación externa
  // ───────────────────────────────────────────

  const handleExternalAbort =
    () => {
      externalAborted =
        true;

      if (
        !controller
          .signal
          .aborted
      ) {
        controller.abort();
      }
    };

  if (externalSignal) {
    if (
      externalSignal
        .aborted
    ) {
      handleExternalAbort();
    } else {
      externalSignal
        .addEventListener(
          "abort",
          handleExternalAbort,
          {
            once: true,
          },
        );
    }
  }

  // ───────────────────────────────────────────
  // Timeout
  // ───────────────────────────────────────────

  if (
    timeoutMs > 0 &&
    !controller
      .signal
      .aborted
  ) {
    timeoutId =
      setTimeout(
        () => {
          timedOut =
            true;

          if (
            !controller
              .signal
              .aborted
          ) {
            controller.abort();
          }
        },
        timeoutMs,
      );
  }

  // ───────────────────────────────────────────
  // Limpieza
  // ───────────────────────────────────────────

  const cleanup =
    () => {
      if (
        timeoutId !== null
      ) {
        clearTimeout(
          timeoutId,
        );

        timeoutId =
          null;
      }

      if (
        externalSignal
      ) {
        externalSignal
          .removeEventListener(
            "abort",
            handleExternalAbort,
          );
      }
    };

  return {
    signal:
      controller.signal,

    cleanup,

    didTimeout:
      () => timedOut,

    didExternalAbort:
      () =>
        externalAborted,
  };
}

// ─────────────────────────────────────────────
// Errores producidos por fetch
// ─────────────────────────────────────────────

function handleFetchError(
  error: unknown,
  signalState: RequestSignalResult,
): never {
  // ───────────────────────────────────────────
  // Timeout
  // ───────────────────────────────────────────

  if (
    signalState
      .didTimeout()
  ) {
    Toast.show({
      type: "error",

      text1:
        "Tiempo de espera agotado",

      text2:
        "El servidor tardó demasiado en responder.",

      visibilityTime:
        4000,
    });

    throw new ApiError(
      "El servidor tardó demasiado en responder.",
      {
        status: 0,

        code:
          "TIMEOUT",

        cause:
          error,
      },
    );
  }

  // ───────────────────────────────────────────
  // Cancelación manual
  // ───────────────────────────────────────────

  if (
    signalState
      .didExternalAbort()
  ) {
    /**
     * AbortError se mantiene separado
     * de ApiError.
     *
     * Una cancelación manual no es
     * un error del backend.
     */
    if (
      error instanceof
      Error
    ) {
      throw error;
    }

    const abortError =
      new Error(
        "La solicitud fue cancelada.",
      );

    abortError.name =
      "AbortError";

    throw abortError;
  }

  // ───────────────────────────────────────────
  // Abort normal
  // ───────────────────────────────────────────

  if (
    error instanceof
      Error &&
    error.name ===
      "AbortError"
  ) {
    throw error;
  }

  // ───────────────────────────────────────────
  // ApiError ya procesado
  // ───────────────────────────────────────────

  if (
    isApiError(error)
  ) {
    throw error;
  }

  // ───────────────────────────────────────────
  // Error de red
  // ───────────────────────────────────────────

  Toast.show({
    type: "error",

    text1:
      "Sin conexión",

    text2:
      "No se pudo conectar al servidor. Revisa tu conexión.",

    visibilityTime:
      4000,
  });

  throw new ApiError(
    "No se pudo conectar al servidor. Revisa tu conexión.",
    {
      status: 0,

      code:
        "NETWORK_ERROR",

      cause:
        error,
    },
  );
}

// ─────────────────────────────────────────────
// Request JSON central
// ─────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit,
  authenticated: boolean,
  fallback: string,
  config: HttpRequestConfig = {},
): Promise<T> {
  const headers =
    await buildHeaders(
      authenticated,
      true,
    );

  const signalState =
    createRequestSignal(
      config,
    );

  try {
    const response =
      await fetch(
        `${BASE_URL}${path}`,
        {
          ...options,

          signal:
            signalState.signal,

          headers: {
            ...headers,
            ...options.headers,
          },
        },
      );

    // ─────────────────────────────────────────
    // HTTP Error
    // ─────────────────────────────────────────

    if (!response.ok) {
      const message =
        await parseErrorMessage(
          response,
          fallback,
        );

      await processUnauthorized(
        response.status,
        authenticated,
        config,
      );

      throw new ApiError(
        message,
        {
          status:
            response.status,

          code:
            "HTTP_ERROR",
        },
      );
    }

    // ─────────────────────────────────────────
    // Respuesta
    // ─────────────────────────────────────────

    const text =
      await response.text();

    if (!text) {
      return {} as T;
    }

    try {
      return JSON.parse(
        text,
      ) as T;
    } catch {
      return text as T;
    }
  } catch (error) {
    /**
     * Si ya es ApiError, no debemos
     * convertirlo en NETWORK_ERROR.
     */
    if (
      isApiError(error)
    ) {
      throw error;
    }

    return handleFetchError(
      error,
      signalState,
    );
  } finally {
    signalState.cleanup();
  }
}

// ─────────────────────────────────────────────
// Cliente HTTP
// ─────────────────────────────────────────────

export const httpClient = {
  // ───────────────────────────────────────────
  // POST público
  // ───────────────────────────────────────────

  post: <T>(
    path: string,
    body: unknown,
    fallback =
      "Error en la petición",
    config: HttpRequestConfig = {},
  ): Promise<T> =>
    request<T>(
      path,

      {
        method:
          "POST",

        body:
          JSON.stringify(
            body,
          ),
      },

      false,

      fallback,

      config,
    ),

  // ───────────────────────────────────────────
  // GET autenticado
  // ───────────────────────────────────────────

  getAuth: <T>(
    path: string,
    fallback =
      "Error al cargar datos",

    /**
     * Se conserva por compatibilidad
     * con llamadas existentes.
     */
    signal?: AbortSignal,

    config: HttpRequestConfig = {},
  ): Promise<T> =>
    request<T>(
      path,

      {
        method:
          "GET",
      },

      true,

      fallback,

      {
        ...config,

        signal:
          signal ??
          config.signal,
      },
    ),

  // ───────────────────────────────────────────
  // POST autenticado
  // ───────────────────────────────────────────

  postAuth: <T>(
    path: string,
    body: unknown,
    fallback =
      "Error al guardar datos",
    config: HttpRequestConfig = {},
  ): Promise<T> =>
    request<T>(
      path,

      {
        method:
          "POST",

        body:
          JSON.stringify(
            body,
          ),
      },

      true,

      fallback,

      config,
    ),

  // ───────────────────────────────────────────
  // PUT autenticado
  // ───────────────────────────────────────────

  putAuth: <T>(
    path: string,
    body: unknown,
    fallback =
      "Error al guardar datos",
    config: HttpRequestConfig = {},
  ): Promise<T> =>
    request<T>(
      path,

      {
        method:
          "PUT",

        body:
          JSON.stringify(
            body,
          ),
      },

      true,

      fallback,

      config,
    ),

  // ───────────────────────────────────────────
  // DELETE autenticado
  // ───────────────────────────────────────────

  deleteAuth: <T>(
    path: string,
    fallback =
      "Error al eliminar datos",
    config: HttpRequestConfig = {},
  ): Promise<T> =>
    request<T>(
      path,

      {
        method:
          "DELETE",
      },

      true,

      fallback,

      config,
    ),

  // ───────────────────────────────────────────
  // FormData
  // ───────────────────────────────────────────

  async postFormData<T>(
    url: string,
    formData: FormData,
    config: HttpRequestConfig = {},
  ): Promise<T> {
    const headers =
      await buildHeaders(
        true,
        false,
      );

    const signalState =
      createRequestSignal(
        config,
      );

    try {
      const response =
        await fetch(
          `${BASE_URL}${url}`,
          {
            method:
              "POST",

            headers,

            body:
              formData,

            signal:
              signalState.signal,
          },
        );

      const text =
        await response.text();

      let data: unknown =
        null;

      if (text) {
        try {
          data =
            JSON.parse(
              text,
            );
        } catch {
          data =
            text;
        }
      }

      // ───────────────────────────────────────
      // Error
      // ───────────────────────────────────────

      if (!response.ok) {
        await processUnauthorized(
          response.status,
          true,
          config,
        );

        const parsedData =
          typeof data ===
            "object" &&
          data !== null
            ? (
                data as {
                  message?: string;
                  errors?: unknown;
                }
              )
            : null;

        throw new ApiError(
          parsedData
            ?.message ??
            "Error al subir archivo",
          {
            status:
              response.status,

            code:
              "HTTP_ERROR",

            errors:
              parsedData
                ?.errors,
          },
        );
      }

      return data as T;
    } catch (error) {
      if (
        isApiError(
          error,
        )
      ) {
        throw error;
      }

      return handleFetchError(
        error,
        signalState,
      );
    } finally {
      signalState.cleanup();
    }
  },

  // ───────────────────────────────────────────
  // Descargas / respuestas raw
  // ───────────────────────────────────────────

  async _rawFetch(
    path: string,
    accept: string,
    config: HttpRequestConfig = {},
  ): Promise<Response> {
    const headers =
      await buildHeaders(
        true,
        false,
      );

    const signalState =
      createRequestSignal(
        config,
      );

    try {
      const response =
        await fetch(
          `${BASE_URL}${path}`,
          {
            method:
              "GET",

            headers: {
              ...headers,

              Accept:
                accept,
            },

            signal:
              signalState.signal,
          },
        );

      // ───────────────────────────────────────
      // HTTP Error
      // ───────────────────────────────────────

      if (!response.ok) {
        const message =
          await parseErrorMessage(
            response,
            "Error al descargar",
          );

        await processUnauthorized(
          response.status,
          true,
          config,
        );

        throw new ApiError(
          message,
          {
            status:
              response.status,

            code:
              "HTTP_ERROR",
          },
        );
      }

      return response;
    } catch (error) {
      if (
        isApiError(
          error,
        )
      ) {
        throw error;
      }

      return handleFetchError(
        error,
        signalState,
      );
    } finally {
      signalState.cleanup();
    }
  },
};