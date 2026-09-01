// http/httpSession.ts

type UnauthorizedHandler =
  () => void | Promise<void>;

interface HttpSessionConfig {
  getSucursalId: () => number | null;
  onUnauthorized: UnauthorizedHandler;
}

let sucursalGetter:
  (() => number | null) | null =
  null;

let unauthorizedHandler:
  UnauthorizedHandler | null =
  null;

/**
 * Promise compartida.
 *
 * Si varias peticiones reciben 401 al mismo
 * tiempo, todas esperan la misma limpieza
 * de sesión.
 */
let unauthorizedInFlight:
  Promise<void> | null =
  null;

/**
 * Configura la integración entre authStore
 * y httpClient sin crear dependencia circular.
 */
export function configureHttpSession(
  config: HttpSessionConfig,
): void {
  sucursalGetter =
    config.getSucursalId;

  unauthorizedHandler =
    config.onUnauthorized;
}

/**
 * Devuelve la sucursal seleccionada actualmente.
 */
export function getHttpSucursalId():
  number | null {
  if (!sucursalGetter) {
    return null;
  }

  try {
    return sucursalGetter();
  } catch {
    return null;
  }
}

/**
 * Ejecuta el manejador global de HTTP 401.
 *
 * Evita múltiples limpiezas simultáneas.
 */
export async function handleHttpUnauthorized():
  Promise<void> {
  if (!unauthorizedHandler) {
    return;
  }

  if (unauthorizedInFlight) {
    await unauthorizedInFlight;
    return;
  }

  unauthorizedInFlight =
    Promise.resolve()
      .then(async () => {
        const handler =
          unauthorizedHandler;

        if (handler) {
          await handler();
        }
      })
      .finally(() => {
        unauthorizedInFlight =
          null;
      });

  await unauthorizedInFlight;
}