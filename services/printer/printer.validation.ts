import {
  ALLOWED_RAW_PRINTER_PORTS,
  MAX_PRINT_COPIES,
  MAX_PRINTER_HTML_LENGTH,
  MAX_PRINTER_NAME_LENGTH,
  MAX_PRINTER_RASTER_BASE64_LENGTH,
  MAX_PRINTER_TEXT_LENGTH,
  RECEIPT_58_DOTS,
  RECEIPT_80_DOTS,
  SUNMI_INNER_PRINTER_DEVICE_ID,
} from "./printer.constants";

import type {
  PrinterDevice,
  PrinterPrintJob,
} from "./printer.types";

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)$/;

const MAC_REGEX =
  /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

export function isPrivateIpv4(
  value:
    string,
): boolean {
  const ip =
    value.trim();

  if (!IPV4_REGEX.test(ip)) {
    return false;
  }

  const [a, b] =
    ip
      .split(".")
      .map(Number);

  if (
    a === 0 ||
    a === 127 ||
    a >= 224
  ) {
    return false;
  }

  if (a === 10) {
    return true;
  }

  if (
    a === 172 &&
    b >= 16 &&
    b <= 31
  ) {
    return true;
  }

  return (
    a === 192 &&
    b === 168
  );
}

export function isAllowedPrinterPort(
  port:
    number,
): boolean {
  return (
    Number.isInteger(port) &&
    ALLOWED_RAW_PRINTER_PORTS.includes(
      port as 9100,
    )
  );
}

export function isValidMacAddress(
  value:
    string | undefined,
): boolean {
  return !!value &&
    MAC_REGEX.test(
      value.trim(),
    );
}

export function sanitizePrinterName(
  value:
    string,
): string {
  return value
    .replace(
      /[\u0000-\u001F\u007F]/g,
      "",
    )
    .trim()
    .slice(
      0,
      MAX_PRINTER_NAME_LENGTH,
    );
}

export function sanitizePrintableText(
  value:
    string,
): string {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      "",
    )
    .slice(
      0,
      MAX_PRINTER_TEXT_LENGTH,
    );
}

export function toEscPosSafeText(
  value:
    string,
): string {
  return sanitizePrintableText(value)
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^\x09\x0A\x20-\x7E]/g,
      "?",
    );
}

export function validatePrinterDevice(
  device:
    PrinterDevice,
): void {
  const name =
    sanitizePrinterName(
      device.name,
    );

  if (!name) {
    throw new Error(
      "La impresora no tiene un nombre válido.",
    );
  }

  if (
    device.connectionType ===
    "network"
  ) {
    if (
      !device.ipAddress ||
      !isPrivateIpv4(
        device.ipAddress,
      )
    ) {
      throw new Error(
        "Solo se permiten impresoras con una dirección IPv4 privada válida.",
      );
    }

    if (
      !device.port ||
      !isAllowedPrinterPort(
        device.port,
      )
    ) {
      throw new Error(
        "El puerto de la impresora no está autorizado. CatuDrive permite RAW TCP únicamente por el puerto 9100.",
      );
    }
  }

  if (
    device.connectionType ===
    "bluetooth"
  ) {
    if (!device.id) {
      throw new Error(
        "La impresora Bluetooth no tiene un identificador válido.",
      );
    }

    if (
      device.macAddress &&
      !isValidMacAddress(
        device.macAddress,
      )
    ) {
      throw new Error(
        "La dirección Bluetooth de la impresora no es válida.",
      );
    }

    if (
      device.paired ===
      false
    ) {
      throw new Error(
        "Por seguridad solo se permiten impresoras Bluetooth previamente emparejadas con el dispositivo.",
      );
    }
  }

  if (
    device.connectionType ===
    "sunmi"
  ) {
    if (
      device.id !==
      SUNMI_INNER_PRINTER_DEVICE_ID
    ) {
      throw new Error(
        "La impresora SUNMI integrada no tiene un identificador autorizado.",
      );
    }

    if (
      device.builtIn ===
      false
    ) {
      throw new Error(
        "La configuración SUNMI no corresponde a la impresora integrada.",
      );
    }
  }
}

function isValidBase64Payload(
  value:
    string,
): boolean {
  if (
    !value ||
    value.length >
      MAX_PRINTER_RASTER_BASE64_LENGTH
  ) {
    return false;
  }

  return /^[A-Za-z0-9+/=\r\n]+$/.test(
    value,
  );
}

export function validatePrintJob(
  job:
    PrinterPrintJob,
): void {
  const allowedPaperSizes = [
    "receipt-58",
    "receipt-80",
    "letter",
    "a4",
    "custom",
  ] as const;

  if (
    job.paperSize !== undefined &&
    !allowedPaperSizes.includes(
      job.paperSize as
        (typeof allowedPaperSizes)[number],
    )
  ) {
    throw new Error(
      "El formato de papel solicitado no es válido.",
    );
  }

  const copies =
    job.copies ?? 1;

  if (
    !Number.isInteger(copies) ||
    copies < 1 ||
    copies > MAX_PRINT_COPIES
  ) {
    throw new Error(
      `La cantidad de copias debe estar entre 1 y ${MAX_PRINT_COPIES}.`,
    );
  }

  const hasText =
    !!job.text;
  const hasHtml =
    !!job.html;
  const hasRasterImage =
    !!job.rasterImage?.base64;
  const hasSunmiImage =
    !!job.sunmi?.imageBase64;
  const hasSunmiQr =
    !!job.sunmi?.qrData;

  if (
    !hasText &&
    !hasHtml &&
    !hasRasterImage &&
    !hasSunmiImage &&
    !hasSunmiQr
  ) {
    throw new Error(
      "El trabajo de impresión no contiene información.",
    );
  }

  if (
    job.text &&
    job.text.length >
      MAX_PRINTER_TEXT_LENGTH
  ) {
    throw new Error(
      "El contenido de texto excede el tamaño permitido.",
    );
  }

  if (
    job.html &&
    job.html.length >
      MAX_PRINTER_HTML_LENGTH
  ) {
    throw new Error(
      "El documento HTML excede el tamaño permitido.",
    );
  }

  if (job.rasterImage) {
    if (
      !isValidBase64Payload(
        job.rasterImage.base64,
      )
    ) {
      throw new Error(
        "La imagen raster del ticket no es válida o es demasiado grande.",
      );
    }

    const expectedWidth =
      job.paperSize === "receipt-80"
        ? RECEIPT_80_DOTS
        : RECEIPT_58_DOTS;

    if (
      !Number.isInteger(
        job.rasterImage.width,
      ) ||
      job.rasterImage.width < 64 ||
      job.rasterImage.width > RECEIPT_80_DOTS ||
      (
        job.type === "receipt" &&
        Math.abs(
          job.rasterImage.width -
            expectedWidth,
        ) > 16
      )
    ) {
      throw new Error(
        `La imagen raster no tiene un ancho válido para ${job.paperSize ?? "ticket"}.`,
      );
    }

    if (
      job.rasterImage.threshold !==
        undefined &&
      (
        job.rasterImage.threshold < 0 ||
        job.rasterImage.threshold > 255
      )
    ) {
      throw new Error(
        "El umbral de imagen térmica debe estar entre 0 y 255.",
      );
    }
  }

  if (
    job.sunmi?.qrSize !== undefined &&
    (
      !Number.isInteger(job.sunmi.qrSize) ||
      job.sunmi.qrSize < 1 ||
      job.sunmi.qrSize > 16
    )
  ) {
    throw new Error(
      "El tamaño del QR SUNMI debe estar entre 1 y 16.",
    );
  }

  if (
    job.sunmi?.feedLines !== undefined &&
    (
      !Number.isInteger(
        job.sunmi.feedLines,
      ) ||
      job.sunmi.feedLines < 0 ||
      job.sunmi.feedLines > 10
    )
  ) {
    throw new Error(
      "El avance de papel SUNMI debe estar entre 0 y 10 líneas.",
    );
  }

  if (
    job.sunmi?.fontSize !== undefined &&
    (
      job.sunmi.fontSize < 12 ||
      job.sunmi.fontSize > 64
    )
  ) {
    throw new Error(
      "El tamaño de fuente SUNMI debe estar entre 12 y 64.",
    );
  }
}

export function escapeHtml(
  value:
    string,
): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
