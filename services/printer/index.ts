export {
  printerService,
} from "./printer.service";

export {
  printerStorageService,
} from "./printerStorage.service";

export {
  DEFAULT_RAW_PRINTER_PORT,
  ALLOWED_RAW_PRINTER_PORTS,
  SUNMI_INNER_PRINTER_DEVICE_ID,
  SUNMI_INNER_PRINTER_PAPER_WIDTH_MM,
} from "./printer.constants";

export {
  escapeHtml,
  isAllowedPrinterPort,
  isPrivateIpv4,
  sanitizePrintableText,
  validatePrintJob,
  validatePrinterDevice,
} from "./printer.validation";

export type {
  PrinterAdapter,
  PrinterConnectionResult,
  PrinterConnectionType,
  PrinterDevice,
  PrinterDeviceStatus,
  PrinterJobType,
  PrinterPrintJob,
  SunmiImageMode,
  SunmiPrintOptions,
  SunmiTextAlignment,
} from "./printer.types";
