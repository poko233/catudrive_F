export {
  printerService,
  PrinterCompatibilityError,
} from "./printer.service";

export {
  printerStorageService,
} from "./printerStorage.service";

export {
  DEFAULT_RAW_PRINTER_PORT,
  ALLOWED_RAW_PRINTER_PORTS,
  DEFAULT_PRINTER_PROFILES_STORAGE_KEY,
  LEGACY_DEFAULT_PRINTER_STORAGE_KEY,
  OLDER_LEGACY_DEFAULT_PRINTER_STORAGE_KEY,
  SUNMI_INNER_PRINTER_DEVICE_ID,
  SUNMI_INNER_PRINTER_PAPER_WIDTH_MM,
  MAX_PRINTER_RASTER_BASE64_LENGTH,
  RECEIPT_58_DOTS,
  RECEIPT_80_DOTS,
} from "./printer.constants";

export {
  checkPrinterCompatibility,
  checkPrintJobCompatibility,
  getDefaultCapabilitiesForType,
  getPrinterCapabilities,
  getPrinterPaperLabel,
  getPrinterProfileForRequirement,
  getPrinterProfileLabel,
  inferPreferredProfileForDevice,
  normalizePrinterRequirement,
} from "./printer.compatibility";

export {
  escapeHtml,
  isAllowedPrinterPort,
  isPrivateIpv4,
  sanitizePrintableText,
  validatePrintJob,
  validatePrinterDevice,
} from "./printer.validation";

export {
  buildEscPosRasterPayloadBase64,
} from "./escpos.raster";

export type {
  PrinterAdapter,
  PrinterCapabilities,
  PrinterCompatibilityResult,
  PrinterConnectionResult,
  PrinterConnectionType,
  PrinterDefaultProfiles,
  PrinterDevice,
  PrinterDeviceStatus,
  PrinterJobRequirement,
  PrinterJobType,
  PrinterPaperSize,
  PrinterPrintJob,
  PrinterProfileKey,
  PrinterRasterImage,
  SunmiImageMode,
  SunmiPrintOptions,
  SunmiTextAlignment,
} from "./printer.types";
