/*
|--------------------------------------------------------------------------
| PRINTER TYPES
|--------------------------------------------------------------------------
*/

export type PrinterConnectionType =
  | "system"
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

export interface PrinterDevice {
  id: string;
  name: string;
  connectionType: PrinterConnectionType;

  status?: PrinterDeviceStatus;

  /*
  |--------------------------------------------------------------------------
  | NETWORK
  |--------------------------------------------------------------------------
  */

  ipAddress?: string;
  port?: number;

  /*
  |--------------------------------------------------------------------------
  | BLUETOOTH
  |--------------------------------------------------------------------------
  */

  macAddress?: string;
  paired?: boolean;

  /*
  |--------------------------------------------------------------------------
  | SYSTEM
  |--------------------------------------------------------------------------
  */

  systemPrinterUrl?: string;

  /*
  |--------------------------------------------------------------------------
  | METADATA
  |--------------------------------------------------------------------------
  */

  model?: string;
  manufacturer?: string;
}

export interface PrinterPrintJob {
  id?: string;

  type: PrinterJobType;

  title?: string;

  /*
  |--------------------------------------------------------------------------
  | SYSTEM PRINTING
  |--------------------------------------------------------------------------
  |
  | HTML is used by expo-print.
  |
  */

  html?: string;

  /*
  |--------------------------------------------------------------------------
  | ESC/POS / RAW TEXT
  |--------------------------------------------------------------------------
  |
  | Used only by approved Bluetooth/network adapters.
  |
  */

  text?: string;

  copies?: number;

  cutPaper?: boolean;
}

export interface PrinterAdapter {
  type: PrinterConnectionType;

  isSupported(): boolean;

  discover?(): Promise<PrinterDevice[]>;

  connect(
    device: PrinterDevice,
  ): Promise<PrinterDevice>;

  disconnect(
    device: PrinterDevice,
  ): Promise<void>;

  testConnection(
    device: PrinterDevice,
  ): Promise<boolean>;

  print(
    device: PrinterDevice,
    job: PrinterPrintJob,
  ): Promise<void>;
}

export interface PrinterConnectionResult {
  ok: boolean;

  device?: PrinterDevice;

  message?: string;
}
