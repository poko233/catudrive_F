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

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN BASE
|--------------------------------------------------------------------------
|
| TEMPORAL PARA PRUEBAS EN RED LOCAL.
|
| PC:
| 192.168.100.65
|
| Laravel:
| php artisan serve --host=0.0.0.0 --port=8000
|
*/

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  "https://catudrive.metasoft-bolivia.com";

const DEFAULT_TIMEOUT_MS =
  30_000;

/*
|--------------------------------------------------------------------------
| CONFIGURACIÓN DE REQUEST
|--------------------------------------------------------------------------
*/

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
   * Timeout personalizado.
   *
   * Ejemplos:
   *
   * 10000 = 10 segundos
   * 60000 = 1 minuto
   * 0     = sin timeout
   */
  timeoutMs?: number;

  /**
   * AbortSignal externo.
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

/*
|--------------------------------------------------------------------------
| URL
|--------------------------------------------------------------------------
*/

/**
 * Convierte:
 *
 * api/login
 *
 * en:
 *
 * /api/login
 */
function normalizePath(
  path: string,
): string {
  const clean =
    String(
      path ?? "",
    ).trim();

  if (!clean) {
    return "";
  }

  return clean.startsWith(
    "/",
  )
    ? clean
    : `/${clean}`;
}

/**
 * Construye siempre una URL válida.
 *
 * BASE_URL:
 * http://192.168.100.65:8000
 *
 * path:
 * /api/login
 *
 * resultado:
 * http://192.168.100.65:8000/api/login
 */
function buildUrl(
  path: string,
): string {
  return `${BASE_URL}${normalizePath(
    path,
  )}`;
}

/*
|--------------------------------------------------------------------------
| PARSEAR ERROR DEL BACKEND
|--------------------------------------------------------------------------
*/

async function parseErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  const text =
    await res
      .text()
      .catch(
        () => "",
      );

  if (!text) {
    return fallback;
  }

  try {
    const json =
      JSON.parse(
        text,
      );

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

    if (
      json?.errors
    ) {
      return "Algunos datos ya se encuentran registrados o son inválidos.";
    }

    return fallback;
  } catch {
    return (
      text ||
      fallback
    );
  }
}

/*
|--------------------------------------------------------------------------
| HEADERS
|--------------------------------------------------------------------------
*/

async function buildHeaders(
  authenticated: boolean,
  includeContentType = true,
): Promise<
  Record<string, string>
> {
  const headers:
    Record<string, string> = {
      Accept:
        "application/json",
    };

  if (
    includeContentType
  ) {
    headers[
      "Content-Type"
    ] =
      "application/json";
  }

  if (
    !authenticated
  ) {
    return headers;
  }

  /*
  |--------------------------------------------------------------------------
  | TOKEN
  |--------------------------------------------------------------------------
  */

  const token =
    await getToken();

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  /*
  |--------------------------------------------------------------------------
  | SUCURSAL
  |--------------------------------------------------------------------------
  */

  const sucursalId =
    getHttpSucursalId();

  if (
    sucursalId !==
    null
  ) {
    headers[
      "X-Sucursal-Id"
    ] = String(
      sucursalId,
    );
  }

  return headers;
}

/*
|--------------------------------------------------------------------------
| 401
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| TIMEOUT + ABORT CONTROLLER
|--------------------------------------------------------------------------
*/

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

  /*
  |--------------------------------------------------------------------------
  | CANCELACIÓN EXTERNA
  |--------------------------------------------------------------------------
  */

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

  if (
    externalSignal
  ) {
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

  /*
  |--------------------------------------------------------------------------
  | TIMEOUT
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | CLEANUP
  |--------------------------------------------------------------------------
  */

  const cleanup =
    () => {
      if (
        timeoutId !==
        null
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
      () =>
        timedOut,

    didExternalAbort:
      () =>
        externalAborted,
  };
}

/*
|--------------------------------------------------------------------------
| ERROR DE FETCH
|--------------------------------------------------------------------------
*/

function handleFetchError(
  error: unknown,
  signalState: RequestSignalResult,
  requestUrl: string,
): never {
  const realMessage =
    error instanceof Error
      ? error.message
      : String(
          error,
        );

  /*
  |--------------------------------------------------------------------------
  | DEBUG
  |--------------------------------------------------------------------------
  */

  console.error(
    "[HTTP NETWORK ERROR]",
    {
      baseUrl:
        BASE_URL,

      requestUrl,

      error:
        realMessage,
    },
  );

  /*
  |--------------------------------------------------------------------------
  | TIMEOUT
  |--------------------------------------------------------------------------
  */

  if (
    signalState
      .didTimeout()
  ) {
    Toast.show({
      type:
        "error",

      text1:
        "Tiempo de espera agotado",

      text2:
        `No respondió: ${requestUrl}`,

      visibilityTime:
        7000,
    });

    throw new ApiError(
      "El servidor tardó demasiado en responder.",
      {
        status:
          0,

        code:
          "TIMEOUT",

        cause:
          error,
      },
    );
  }

  /*
  |--------------------------------------------------------------------------
  | CANCELACIÓN EXTERNA
  |--------------------------------------------------------------------------
  */

  if (
    signalState
      .didExternalAbort()
  ) {
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

  /*
  |--------------------------------------------------------------------------
  | ABORT NORMAL
  |--------------------------------------------------------------------------
  */

  if (
    error instanceof
      Error &&
    error.name ===
      "AbortError"
  ) {
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | API ERROR YA PROCESADO
  |--------------------------------------------------------------------------
  */

  if (
    isApiError(
      error,
    )
  ) {
    throw error;
  }

  /*
  |--------------------------------------------------------------------------
  | ERROR DE RED
  |--------------------------------------------------------------------------
  */

  Toast.show({
    type:
      "error",

    text1:
      "Error de conexión",

    text2:
      realMessage ||
      `No se pudo conectar a ${requestUrl}`,

    visibilityTime:
      8000,
  });

  throw new ApiError(
    realMessage ||
      "No se pudo conectar al servidor.",
    {
      status:
        0,

      code:
        "NETWORK_ERROR",

      cause:
        error,
    },
  );
}

/*
|--------------------------------------------------------------------------
| REQUEST JSON CENTRAL
|--------------------------------------------------------------------------
*/

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

  const requestUrl =
    buildUrl(
      path,
    );

  /*
  |--------------------------------------------------------------------------
  | DEBUG
  |--------------------------------------------------------------------------
  */

  console.log(
    "[HTTP REQUEST]",
    {
      method:
        options.method ??
        "GET",

      url:
        requestUrl,
    },
  );

  try {
    const response =
      await fetch(
        requestUrl,
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

    /*
    |--------------------------------------------------------------------------
    | DEBUG RESPONSE
    |--------------------------------------------------------------------------
    */

    console.log(
      "[HTTP RESPONSE]",
      {
        url:
          requestUrl,

        status:
          response.status,

        ok:
          response.ok,
      },
    );

    /*
    |--------------------------------------------------------------------------
    | HTTP ERROR
    |--------------------------------------------------------------------------
    */

    if (
      !response.ok
    ) {
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

    /*
    |--------------------------------------------------------------------------
    | RESPUESTA
    |--------------------------------------------------------------------------
    */

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
    /*
    |--------------------------------------------------------------------------
    | API ERROR YA PROCESADO
    |--------------------------------------------------------------------------
    */

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
      requestUrl,
    );
  } finally {
    signalState.cleanup();
  }
}

/*
|--------------------------------------------------------------------------
| CLIENTE HTTP
|--------------------------------------------------------------------------
*/

export const httpClient = {
  /*
  |--------------------------------------------------------------------------
  | POST PÚBLICO
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | GET AUTENTICADO
  |--------------------------------------------------------------------------
  */

  getAuth: <T>(
    path: string,
    fallback =
      "Error al cargar datos",
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

  /*
  |--------------------------------------------------------------------------
  | POST AUTENTICADO
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | PUT AUTENTICADO
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | DELETE AUTENTICADO
  |--------------------------------------------------------------------------
  */

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

  /*
  |--------------------------------------------------------------------------
  | FORM DATA
  |--------------------------------------------------------------------------
  */

  async postFormData<T>(
    path: string,
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

    const requestUrl =
      buildUrl(
        path,
      );

    console.log(
      "[HTTP FORM DATA]",
      {
        url:
          requestUrl,
      },
    );

    try {
      const response =
        await fetch(
          requestUrl,
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

      let data:
        unknown =
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

      if (
        !response.ok
      ) {
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
        requestUrl,
      );
    } finally {
      signalState.cleanup();
    }
  },

  /*
  |--------------------------------------------------------------------------
  | RAW FETCH
  |--------------------------------------------------------------------------
  */

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

    const requestUrl =
      buildUrl(
        path,
      );

    console.log(
      "[HTTP RAW FETCH]",
      {
        url:
          requestUrl,
      },
    );

    try {
      const response =
        await fetch(
          requestUrl,
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

      if (
        !response.ok
      ) {
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
        requestUrl,
      );
    } finally {
      signalState.cleanup();
    }
  },
};