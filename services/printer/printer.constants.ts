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

/**
 * Base64 crece ~33% respecto del binario.
 * 6 MB es suficiente para un ticket térmico largo sin aceptar imágenes enormes.
 */
export const MAX_PRINTER_RASTER_BASE64_LENGTH =
  6_000_000;

export const MAX_PRINTER_NAME_LENGTH =
  80;

export const MAX_PRINT_COPIES =
  3;

/*
|--------------------------------------------------------------------------
| STORAGE
|--------------------------------------------------------------------------
*/

export const DEFAULT_PRINTER_PROFILES_STORAGE_KEY =
  "@catudrive/printer/default-profiles:v1";

export const LEGACY_DEFAULT_PRINTER_STORAGE_KEY =
  "@catudrive/printer/default:v2";

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

/*
|--------------------------------------------------------------------------
| THERMAL RASTER
|--------------------------------------------------------------------------
*/

/** 58 mm típico: 384 dots a 203 dpi. */
export const RECEIPT_58_DOTS =
  384;

/** 80 mm típico: 576 dots a 203 dpi. */
export const RECEIPT_80_DOTS =
  576;
