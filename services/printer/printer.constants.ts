/*
|--------------------------------------------------------------------------
| PRINTER SECURITY CONSTANTS
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| RAW TCP
|--------------------------------------------------------------------------
|
| CatuDrive only allows JetDirect/RAW printing through port 9100.
|
| We intentionally DO NOT allow arbitrary ports such as:
| 22, 80, 3306, 5432, etc.
|
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

export const DEFAULT_PRINTER_STORAGE_KEY =
  "@catudrive/printer/default:v2";

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
|
| The integrated SUNMI printer is not an arbitrary external endpoint.
| We use one fixed logical device id.
|
*/

export const SUNMI_INNER_PRINTER_DEVICE_ID =
  "sunmi-inner-printer";

export const SUNMI_INNER_PRINTER_PAPER_WIDTH_MM =
  58;
