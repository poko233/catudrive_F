import type {
  PrinterCapabilities,
  PrinterCompatibilityResult,
  PrinterConnectionType,
  PrinterDevice,
  PrinterJobRequirement,
  PrinterPaperSize,
  PrinterPrintJob,
  PrinterProfileKey,
} from "./printer.types";

/*
|--------------------------------------------------------------------------
| LABELS
|--------------------------------------------------------------------------
*/

export function getPrinterPaperLabel(
  paperSize:
    PrinterPaperSize,
): string {
  switch (
    paperSize
  ) {
    case "receipt-58":
      return "Ticket 58 mm";

    case "receipt-80":
      return "Ticket 80 mm";

    case "letter":
      return "Carta 8.5 × 11";

    case "a4":
      return "A4 210 × 297 mm";

    case "custom":
      return "Formato personalizado";

    default:
      return paperSize;
  }
}

export function getPrinterProfileLabel(
  profile:
    PrinterProfileKey,
): string {
  switch (
    profile
  ) {
    case "receipt-58":
      return "Ticket 58 mm";

    case "receipt-80":
      return "Ticket 80 mm";

    case "document":
      return "Documentos Carta / A4";

    default:
      return profile;
  }
}

/*
|--------------------------------------------------------------------------
| NORMALIZE REQUIREMENT
|--------------------------------------------------------------------------
*/

export function normalizePrinterRequirement(
  requirement:
    PrinterJobRequirement,
): Required<PrinterJobRequirement> {
  const paperSize =
    requirement.paperSize ??
    (
      requirement.type ===
      "receipt"
        ? "receipt-58"
        : "letter"
    );

  return {
    type:
      requirement.type,

    paperSize,
  };
}

export function getPrinterProfileForRequirement(
  requirement:
    PrinterJobRequirement,
): PrinterProfileKey {
  const normalized =
    normalizePrinterRequirement(
      requirement,
    );

  if (
    normalized.paperSize ===
    "receipt-58"
  ) {
    return "receipt-58";
  }

  if (
    normalized.paperSize ===
    "receipt-80"
  ) {
    return "receipt-80";
  }

  return "document";
}

/*
|--------------------------------------------------------------------------
| DEFAULT CAPABILITIES BY CONNECTION TYPE
|--------------------------------------------------------------------------
|
| Bluetooth/Network son adaptadores ESC/POS genéricos. Como no tenemos una
| consulta estándar para conocer si el equipo físico es 58 u 80 mm, ambos
| tamaños de ticket se consideran potencialmente compatibles. Si luego
| configuramos paperWidthMm manualmente, esa información limita el perfil.
|
*/

export function getDefaultCapabilitiesForType(
  type:
    PrinterConnectionType,
): PrinterCapabilities {
  switch (
    type
  ) {
    case "sunmi":
      return {
        paperSizes: [
          "receipt-58",
        ],
        jobTypes: [
          "receipt",
        ],
        html:
          false,
        text:
          true,
      };

    case "bluetooth":
    case "network":
      return {
        paperSizes: [
          "receipt-58",
          "receipt-80",
        ],
        jobTypes: [
          "receipt",
        ],
        html:
          false,
        text:
          true,
      };

    case "system":
    default:
      return {
        paperSizes: [
          "receipt-58",
          "receipt-80",
          "letter",
          "a4",
          "custom",
        ],
        jobTypes: [
          "receipt",
          "document",
        ],
        html:
          true,
        text:
          true,
      };
  }
}

/*
|--------------------------------------------------------------------------
| DEVICE CAPABILITIES
|--------------------------------------------------------------------------
*/

export function getPrinterCapabilities(
  device:
    PrinterDevice,
): PrinterCapabilities {
  const base =
    device.capabilities ??
    getDefaultCapabilitiesForType(
      device.connectionType,
    );

  /*
  |------------------------------------------------------------------------
  | PAPER WIDTH OVERRIDE
  |------------------------------------------------------------------------
  */

  if (
    device.connectionType !==
      "system" &&
    typeof device.paperWidthMm ===
      "number"
  ) {
    if (
      device.paperWidthMm <=
      60
    ) {
      return {
        ...base,
        paperSizes:
          base.paperSizes.filter(
            (
              value,
            ) =>
              value ===
              "receipt-58",
          ),
      };
    }

    if (
      device.paperWidthMm >=
      70 &&
      device.paperWidthMm <=
      85
    ) {
      return {
        ...base,
        paperSizes:
          base.paperSizes.filter(
            (
              value,
            ) =>
              value ===
                "receipt-58" ||
              value ===
                "receipt-80",
          ),
      };
    }
  }

  return base;
}

/*
|--------------------------------------------------------------------------
| DEVICE -> PREFERRED PROFILE
|--------------------------------------------------------------------------
*/

export function inferPreferredProfileForDevice(
  device:
    PrinterDevice,
): PrinterProfileKey {
  const capabilities =
    getPrinterCapabilities(
      device,
    );

  if (
    capabilities.paperSizes.includes(
      "receipt-58",
    ) &&
    device.paperWidthMm !==
      undefined &&
    device.paperWidthMm <=
      60
  ) {
    return "receipt-58";
  }

  if (
    capabilities.paperSizes.includes(
      "receipt-80",
    ) &&
    device.connectionType !==
      "system"
  ) {
    return "receipt-80";
  }

  if (
    capabilities.jobTypes.includes(
      "document",
    )
  ) {
    return "document";
  }

  return "receipt-58";
}

/*
|--------------------------------------------------------------------------
| COMPATIBILITY
|--------------------------------------------------------------------------
*/

export function checkPrinterCompatibility(
  device:
    PrinterDevice,
  requirement:
    PrinterJobRequirement,
): PrinterCompatibilityResult {
  const normalized =
    normalizePrinterRequirement(
      requirement,
    );

  const profile =
    getPrinterProfileForRequirement(
      normalized,
    );

  const capabilities =
    getPrinterCapabilities(
      device,
    );

  if (
    !capabilities.jobTypes.includes(
      normalized.type,
    )
  ) {
    return {
      compatible:
        false,
      paperSize:
        normalized.paperSize,
      profile,
      reason:
        normalized.type ===
        "document"
          ? `${device.name} es una impresora térmica y no admite documentos Carta/A4.`
          : `${device.name} no admite impresión de tickets.`,
    };
  }

  if (
    !capabilities.paperSizes.includes(
      normalized.paperSize,
    )
  ) {
    return {
      compatible:
        false,
      paperSize:
        normalized.paperSize,
      profile,
      reason:
        `${device.name} no admite ${getPrinterPaperLabel(
          normalized.paperSize,
        )}.`,
    };
  }

  return {
    compatible:
      true,
    paperSize:
      normalized.paperSize,
    profile,
  };
}

/*
|--------------------------------------------------------------------------
| FULL JOB COMPATIBILITY
|--------------------------------------------------------------------------
*/

export function checkPrintJobCompatibility(
  device:
    PrinterDevice,
  job:
    PrinterPrintJob,
): PrinterCompatibilityResult {
  const basic =
    checkPrinterCompatibility(
      device,
      job,
    );

  if (
    !basic.compatible
  ) {
    return basic;
  }

  const capabilities =
    getPrinterCapabilities(
      device,
    );

  const hasText =
    Boolean(
      job.text,
    );

  const hasHtml =
    Boolean(
      job.html,
    );

  const hasSunmiNativeContent =
    Boolean(
      job.sunmi?.imageBase64 ||
      job.sunmi?.qrData,
    );

  if (
    device.connectionType ===
      "system"
  ) {
    if (
      !hasText &&
      !hasHtml
    ) {
      return {
        ...basic,
        compatible:
          false,
        reason:
          "El trabajo no contiene HTML ni texto para la impresora del sistema.",
      };
    }

    return basic;
  }

  if (
    device.connectionType ===
      "sunmi"
  ) {
    if (
      !hasText &&
      !hasSunmiNativeContent
    ) {
      return {
        ...basic,
        compatible:
          false,
        reason:
          "La impresora SUNMI necesita texto, imagen o QR. El HTML por sí solo no puede imprimirse directamente en la térmica integrada.",
      };
    }

    return basic;
  }

  if (
    !hasText
  ) {
    return {
      ...basic,
      compatible:
        false,
      reason:
        "La impresora térmica ESC/POS necesita una versión de texto del ticket.",
    };
  }

  if (
    !capabilities.text
  ) {
    return {
      ...basic,
      compatible:
        false,
      reason:
        `${device.name} no admite impresión de texto con este adaptador.`,
    };
  }

  return basic;
}
