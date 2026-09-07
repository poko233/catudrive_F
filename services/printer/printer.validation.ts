import {
  ALLOWED_RAW_PRINTER_PORTS,
  MAX_PRINT_COPIES,
  MAX_PRINTER_HTML_LENGTH,
  MAX_PRINTER_NAME_LENGTH,
  MAX_PRINTER_TEXT_LENGTH,
} from "./printer.constants";

import type {
  PrinterDevice,
  PrinterPrintJob,
} from "./printer.types";

/*
|--------------------------------------------------------------------------
| IPV4
|--------------------------------------------------------------------------
*/

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)\.(25[0-5]|2[0-4]\d|1?\d?\d)$/;

/*
|--------------------------------------------------------------------------
| MAC
|--------------------------------------------------------------------------
*/

const MAC_REGEX =
  /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/;

/*
|--------------------------------------------------------------------------
| PRIVATE IPV4
|--------------------------------------------------------------------------
|
| Only RFC1918 private IPv4 ranges are accepted.
|
| 10.0.0.0/8
| 172.16.0.0/12
| 192.168.0.0/16
|
*/

export function isPrivateIpv4(
  value: string,
): boolean {
  const ip =
    value.trim();

  if (
    !IPV4_REGEX.test(
      ip,
    )
  ) {
    return false;
  }

  const parts =
    ip
      .split(".")
      .map(Number);

  const [
    a,
    b,
    c,
    d,
  ] =
    parts;

  /*
  |--------------------------------------------------------------------------
  | Reject ambiguous/reserved endpoints.
  |--------------------------------------------------------------------------
  */

  if (
    a === 0 ||
    a === 127 ||
    a >= 224
  ) {
    return false;
  }

  if (
    a === 10
  ) {
    return true;
  }

  if (
    a === 172 &&
    b >= 16 &&
    b <= 31
  ) {
    return true;
  }

  if (
    a === 192 &&
    b === 168
  ) {
    return true;
  }

  return false;
}

/*
|--------------------------------------------------------------------------
| PORT
|--------------------------------------------------------------------------
*/

export function isAllowedPrinterPort(
  port: number,
): boolean {
  return (
    Number.isInteger(
      port,
    ) &&
    ALLOWED_RAW_PRINTER_PORTS.includes(
      port as 9100,
    )
  );
}

/*
|--------------------------------------------------------------------------
| MAC
|--------------------------------------------------------------------------
*/

export function isValidMacAddress(
  value:
    string | undefined,
): boolean {
  if (!value) {
    return false;
  }

  return MAC_REGEX.test(
    value.trim(),
  );
}

/*
|--------------------------------------------------------------------------
| NAME
|--------------------------------------------------------------------------
*/

export function sanitizePrinterName(
  value: string,
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

/*
|--------------------------------------------------------------------------
| PRINTABLE TEXT
|--------------------------------------------------------------------------
|
| Removes ESC/POS control characters received from external/user text.
| Our own ESC/POS builder adds trusted commands afterwards.
|
*/

export function sanitizePrintableText(
  value: string,
): string {
  return value
    .replace(
      /\r\n/g,
      "\n",
    )
    .replace(
      /\r/g,
      "\n",
    )
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      "",
    )
    .slice(
      0,
      MAX_PRINTER_TEXT_LENGTH,
    );
}

/*
|--------------------------------------------------------------------------
| ASCII FALLBACK
|--------------------------------------------------------------------------
|
| Many inexpensive ESC/POS printers have inconsistent UTF-8 support.
| The raw adapters use a conservative printable fallback.
|
*/

export function toEscPosSafeText(
  value: string,
): string {
  return sanitizePrintableText(
    value,
  )
    .normalize(
      "NFD",
    )
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .replace(
      /[^\x09\x0A\x20-\x7E]/g,
      "?",
    );
}

/*
|--------------------------------------------------------------------------
| DEVICE VALIDATION
|--------------------------------------------------------------------------
*/

export function validatePrinterDevice(
  device: PrinterDevice,
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

    /*
    |--------------------------------------------------------------------------
    | Android usually exposes MAC as device id.
    | iOS ExternalAccessory may expose another identifier, so we do not force
    | a MAC address when the OS gives us a different device id.
    |--------------------------------------------------------------------------
    */

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
}

/*
|--------------------------------------------------------------------------
| JOB VALIDATION
|--------------------------------------------------------------------------
*/

export function validatePrintJob(
  job: PrinterPrintJob,
): void {
  const copies =
    job.copies ??
    1;

  if (
    !Number.isInteger(
      copies,
    ) ||
    copies < 1 ||
    copies >
      MAX_PRINT_COPIES
  ) {
    throw new Error(
      `La cantidad de copias debe estar entre 1 y ${MAX_PRINT_COPIES}.`,
    );
  }

  if (
    !job.html &&
    !job.text
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
}

/*
|--------------------------------------------------------------------------
| HTML ESCAPE
|--------------------------------------------------------------------------
*/

export function escapeHtml(
  value: string,
): string {
  return value
    .replace(
      /&/g,
      "&amp;",
    )
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}
