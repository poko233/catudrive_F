// http/ApiError.ts

export type ApiErrorCode =
  | "HTTP_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT";

export interface ApiErrorOptions {
  status?: number;
  code?: ApiErrorCode;
  errors?: unknown;
  cause?: unknown;
}

/**
 * Error estándar para todas las peticiones
 * realizadas mediante httpClient.
 */
export class ApiError extends Error {
  readonly status: number;

  readonly code: ApiErrorCode;

  readonly errors?: unknown;

  constructor(
    message: string,
    options: ApiErrorOptions = {},
  ) {
    super(message);

    this.name = "ApiError";

    this.status =
      options.status ?? 0;

    this.code =
      options.code ??
      "HTTP_ERROR";

    this.errors =
      options.errors;

    /**
     * Necesario para mantener correctamente:
     *
     * error instanceof ApiError
     *
     * en distintos targets de JavaScript.
     */
    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );

    if (
      options.cause !==
      undefined
    ) {
      (
        this as Error & {
          cause?: unknown;
        }
      ).cause =
        options.cause;
    }
  }

  // ───────────────────────────────────────────
  // Helpers HTTP
  // ───────────────────────────────────────────

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isValidation(): boolean {
    return this.status === 422;
  }

  get isServerError(): boolean {
    return (
      this.status >= 500 &&
      this.status <= 599
    );
  }

  // ───────────────────────────────────────────
  // Helpers de transporte
  // ───────────────────────────────────────────

  get isNetworkError(): boolean {
    return (
      this.code ===
      "NETWORK_ERROR"
    );
  }

  get isTimeout(): boolean {
    return (
      this.code ===
      "TIMEOUT"
    );
  }
}

/**
 * Type Guard.
 *
 * Permite:
 *
 * if (isApiError(error)) {
 *   error.status
 *   error.code
 *   error.errors
 * }
 */
export function isApiError(
  error: unknown,
): error is ApiError {
  return (
    error instanceof
    ApiError
  );
}