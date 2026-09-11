/*
|--------------------------------------------------------------------------
| PRINTER TYPES
|--------------------------------------------------------------------------
*/

export type PrinterConnectionType =
  | "system"
  | "sunmi"
  | "network"
  | "bluetooth";

export type PrinterDeviceStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

export type PrinterJobType =
  | "receipt"
  | "document";

/*
|--------------------------------------------------------------------------
| PAPER
|--------------------------------------------------------------------------
*/

export type PrinterPaperSize =
  | "receipt-58"
  | "receipt-80"
  | "letter"
  | "a4"
  | "custom";

/*
|--------------------------------------------------------------------------
| DEFAULT PROFILE
|--------------------------------------------------------------------------
|
| CatuDrive no utiliza una única impresora predeterminada para todo.
|
| Ejemplo:
| - receipt-58 -> SUNMI integrada
| - receipt-80 -> térmica 80 mm
| - document   -> impresora del sistema / Carta / A4
|
*/

export type PrinterProfileKey =
  | "receipt-58"
  | "receipt-80"
  | "document";

export type PrinterDefaultProfiles =
  Partial<
    Record<
      PrinterProfileKey,
      PrinterDevice
    >
  >;

/*
|--------------------------------------------------------------------------
| CAPABILITIES
|--------------------------------------------------------------------------
*/

export interface PrinterCapabilities {
  paperSizes:
    PrinterPaperSize[];

  jobTypes:
    PrinterJobType[];

  /** Puede recibir HTML directamente. */
  html?:
    boolean;

  /** Puede recibir texto plano / ESC-POS. */
  text?:
    boolean;
}

export interface PrinterDevice {
  id: string;

  name: string;

  connectionType:
    PrinterConnectionType;

  status?:
    PrinterDeviceStatus;

  /*
  |------------------------------------------------------------------------
  | NETWORK
  |------------------------------------------------------------------------
  */

  ipAddress?:
    string;

  port?:
    number;

  /*
  |------------------------------------------------------------------------
  | BLUETOOTH
  |------------------------------------------------------------------------
  */

  macAddress?:
    string;

  paired?:
    boolean;

  /*
  |------------------------------------------------------------------------
  | SYSTEM
  |------------------------------------------------------------------------
  */

  systemPrinterUrl?:
    string;

  /*
  |------------------------------------------------------------------------
  | HARDWARE
  |------------------------------------------------------------------------
  */

  builtIn?:
    boolean;

  paperWidthMm?:
    number;

  capabilities?:
    PrinterCapabilities;

  /*
  |------------------------------------------------------------------------
  | METADATA
  |------------------------------------------------------------------------
  */

  model?:
    string;

  manufacturer?:
    string;
}

/*
|--------------------------------------------------------------------------
| REQUIREMENT
|--------------------------------------------------------------------------
|
| Se usa para abrir el selector ANTES de tener un contenido completo.
|
| Ejemplo:
| { type: "document", paperSize: "letter" }
|
*/

export interface PrinterJobRequirement {
  type:
    PrinterJobType;

  paperSize?:
    PrinterPaperSize;
}

export interface PrinterCompatibilityResult {
  compatible:
    boolean;

  paperSize:
    PrinterPaperSize;

  profile:
    PrinterProfileKey;

  reason?:
    string;
}

/*
|--------------------------------------------------------------------------
| SUNMI
|--------------------------------------------------------------------------
*/

export type SunmiTextAlignment =
  | "left"
  | "center"
  | "right";

export type SunmiImageMode =
  | "binary"
  | "grayscale";

export interface SunmiPrintOptions {
  alignment?:
    SunmiTextAlignment;

  fontSize?:
    number;

  imageBase64?:
    string;

  imageWidth?:
    number;

  imageMode?:
    SunmiImageMode;

  qrData?:
    string;

  qrSize?:
    number;

  feedLines?:
    number;
}

/*
|--------------------------------------------------------------------------
| PRINT JOB
|--------------------------------------------------------------------------
*/

export interface PrinterPrintJob {
  id?:
    string;

  type:
    PrinterJobType;

  /**
   * Si no se envía:
   * - receipt  -> receipt-58
   * - document -> letter
   */
  paperSize?:
    PrinterPaperSize;

  title?:
    string;

  /** Sistema / documentos. */
  html?:
    string;

  /** SUNMI / Bluetooth / RAW TCP / fallback sistema. */
  text?:
    string;

  copies?:
    number;

  cutPaper?:
    boolean;

  sunmi?:
    SunmiPrintOptions;
}

/*
|--------------------------------------------------------------------------
| ADAPTER
|--------------------------------------------------------------------------
*/

export interface PrinterAdapter {
  type:
    PrinterConnectionType;

  isSupported():
    boolean;

  discover?():
    Promise<
      PrinterDevice[]
    >;

  connect(
    device:
      PrinterDevice,
  ): Promise<
    PrinterDevice
  >;

  disconnect(
    device:
      PrinterDevice,
  ): Promise<void>;

  testConnection(
    device:
      PrinterDevice,
  ): Promise<boolean>;

  print(
    device:
      PrinterDevice,
    job:
      PrinterPrintJob,
  ): Promise<void>;
}

export interface PrinterConnectionResult {
  ok:
    boolean;

  device?:
    PrinterDevice;

  message?:
    string;
}
