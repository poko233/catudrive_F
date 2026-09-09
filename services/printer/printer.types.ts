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

export type SunmiTextAlignment =
  | "left"
  | "center"
  | "right";

export type SunmiImageMode =
  | "binary"
  | "grayscale";

export interface PrinterDevice {
  id: string;

  name: string;

  connectionType:
    PrinterConnectionType;

  status?:
    PrinterDeviceStatus;

  /*
  |--------------------------------------------------------------------------
  | NETWORK
  |--------------------------------------------------------------------------
  */

  ipAddress?:
    string;

  port?:
    number;

  /*
  |--------------------------------------------------------------------------
  | BLUETOOTH
  |--------------------------------------------------------------------------
  */

  macAddress?:
    string;

  paired?:
    boolean;

  /*
  |--------------------------------------------------------------------------
  | SYSTEM
  |--------------------------------------------------------------------------
  */

  systemPrinterUrl?:
    string;

  /*
  |--------------------------------------------------------------------------
  | HARDWARE
  |--------------------------------------------------------------------------
  */

  builtIn?:
    boolean;

  paperWidthMm?:
    number;

  /*
  |--------------------------------------------------------------------------
  | METADATA
  |--------------------------------------------------------------------------
  */

  model?:
    string;

  manufacturer?:
    string;
}

export interface SunmiPrintOptions {
  /*
  |--------------------------------------------------------------------------
  | TEXT
  |--------------------------------------------------------------------------
  */

  alignment?:
    SunmiTextAlignment;

  fontSize?:
    number;

  /*
  |--------------------------------------------------------------------------
  | IMAGE
  |--------------------------------------------------------------------------
  |
  | Expected form:
  | data:image/png;base64,...
  |
  */

  imageBase64?:
    string;

  imageWidth?:
    number;

  imageMode?:
    SunmiImageMode;

  /*
  |--------------------------------------------------------------------------
  | QR
  |--------------------------------------------------------------------------
  */

  qrData?:
    string;

  qrSize?:
    number;

  /*
  |--------------------------------------------------------------------------
  | FEED
  |--------------------------------------------------------------------------
  */

  feedLines?:
    number;
}

export interface PrinterPrintJob {
  id?:
    string;

  type:
    PrinterJobType;

  title?:
    string;

  /*
  |--------------------------------------------------------------------------
  | SYSTEM PRINTING
  |--------------------------------------------------------------------------
  */

  html?:
    string;

  /*
  |--------------------------------------------------------------------------
  | RECEIPT / RAW TEXT
  |--------------------------------------------------------------------------
  */

  text?:
    string;

  copies?:
    number;

  cutPaper?:
    boolean;

  /*
  |--------------------------------------------------------------------------
  | SUNMI-SPECIFIC OPTIONAL FEATURES
  |--------------------------------------------------------------------------
  |
  | Normal screens do not need to use this.
  | It only enables image/QR/style features on compatible SUNMI hardware.
  |
  */

  sunmi?:
    SunmiPrintOptions;
}

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
