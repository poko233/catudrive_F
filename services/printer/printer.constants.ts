/*
|--------------------------------------------------------------------------
| RAW TCP
|--------------------------------------------------------------------------
*/

export const ALLOWED_RAW_PRINTER_PORTS =
  Object.freeze([
    9100,
  ] as const);

export const DEFAULT_RAW_PRINTER_PORT =
  9100;

/*
|--------------------------------------------------------------------------
| TIMEOUTS
|--------------------------------------------------------------------------
*/

export const PRINTER_CONNECT_TIMEOUT_MS =
  3500;

export const PRINTER_WRITE_TIMEOUT_MS =
  6000;

/*
|--------------------------------------------------------------------------
| LIMITS
|--------------------------------------------------------------------------
*/

export const MAX_PRINTER_TEXT_LENGTH =
  64_000;

export const MAX_PRINTER_HTML_LENGTH =
  500_000;

export const MAX_PRINTER_NAME_LENGTH =
  80;

export const MAX_PRINT_COPIES =
  3;

/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

/** Nueva estructura: una predeterminada por perfil. */
export const DEFAULT_PRINTER_PROFILES_STORAGE_KEY =
  "@catudrive/printer/default-profiles:v1";

/** Clave anterior. Se conserva solo para migración automática. */
export const LEGACY_DEFAULT_PRINTER_STORAGE_KEY =
  "@catudrive/printer/default:v2";

/** Versión todavía más antigua. */
export const OLDER_LEGACY_DEFAULT_PRINTER_STORAGE_KEY =
  "@catudrive/printer/default:v1";

/*
|--------------------------------------------------------------------------
| SYSTEM DEVICE
|--------------------------------------------------------------------------
*/

export const SYSTEM_PRINTER_DEVICE_ID =
  "system-print-dialog";

/*
|--------------------------------------------------------------------------
| SUNMI
|--------------------------------------------------------------------------
*/

export const SUNMI_INNER_PRINTER_DEVICE_ID =
  "sunmi-inner-printer";

export const SUNMI_INNER_PRINTER_PAPER_WIDTH_MM =
  58;
