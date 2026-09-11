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

  /** Puede recibir una imagen raster del ticket. */
  rasterImage?:
    boolean;
}

export interface PrinterDevice {
  id: string;

  name: string;

  connectionType:
    PrinterConnectionType;

  status?:
    PrinterDeviceStatus;

  /* NETWORK */
  ipAddress?:
    string;

  port?:
    number;

  /* BLUETOOTH */
  macAddress?:
    string;

  paired?:
    boolean;

  /* SYSTEM */
  systemPrinterUrl?:
    string;

  /* HARDWARE */
  builtIn?:
    boolean;

  paperWidthMm?:
    number;

  capabilities?:
    PrinterCapabilities;

  /* METADATA */
  model?:
    string;

  manufacturer?:
    string;
}

/*
|--------------------------------------------------------------------------
| REQUIREMENT
|--------------------------------------------------------------------------
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
| RASTER IMAGE
|--------------------------------------------------------------------------
|
| Esta imagen se obtiene renderizando el HTML oficial del backend.
| Para 58 mm se genera a 384 puntos de ancho.
|
*/

export interface PrinterRasterImage {
  /** PNG/JPG en Base64 SIN prefijo data:image/... */
  base64: string;

  /** Ancho físico objetivo en puntos de impresora. */
  width: number;

  /** Alto de la imagen capturada en píxeles. */
  height?: number;

  /** Umbral B/N usado al convertir a ESC/POS. */
  threshold?: number;
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

  /** Legacy: se conserva para no romper otras pantallas. */
  imageBase64?:
    string;

  /** Legacy: se conserva para no romper otras pantallas. */
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

  /** Texto legacy / fallback. */
  text?:
    string;

  /**
   * Fuente raster derivada del MISMO HTML oficial del backend.
   * SUNMI/Bluetooth/RAW TCP usan esta imagen para mantener el mismo diseño.
   */
  rasterImage?:
    PrinterRasterImage;

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
