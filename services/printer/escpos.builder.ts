import {
  toEscPosSafeText,
} from "./printer.validation";

/*
|--------------------------------------------------------------------------
| ESC/POS
|--------------------------------------------------------------------------
|
| These commands are generated internally.
| The UI never receives arbitrary ESC/POS commands from users.
|
*/

const ESC =
  "\x1B";

const GS =
  "\x1D";

/*
|--------------------------------------------------------------------------
| COMMANDS
|--------------------------------------------------------------------------
*/

const INIT =
  `${ESC}@`;

const ALIGN_LEFT =
  `${ESC}a\x00`;

const ALIGN_CENTER =
  `${ESC}a\x01`;

const BOLD_ON =
  `${ESC}E\x01`;

const BOLD_OFF =
  `${ESC}E\x00`;

const CUT_FULL =
  `${GS}V\x00`;

/*
|--------------------------------------------------------------------------
| GENERIC RAW RECEIPT
|--------------------------------------------------------------------------
*/

export function buildEscPosPayload(
  text: string,
  options?: {
    title?: string;
    cutPaper?: boolean;
  },
): string {
  const safeBody =
    toEscPosSafeText(
      text,
    );

  const safeTitle =
    options?.title
      ? toEscPosSafeText(
          options.title,
        )
      : "";

  let payload =
    INIT;

  if (safeTitle) {
    payload +=
      ALIGN_CENTER;

    payload +=
      BOLD_ON;

    payload +=
      `${safeTitle}\n`;

    payload +=
      BOLD_OFF;

    payload +=
      `${ALIGN_LEFT}\n`;
  }

  payload +=
    safeBody;

  payload +=
    "\n\n\n";

  if (
    options?.cutPaper !==
    false
  ) {
    payload +=
      CUT_FULL;
  }

  return payload;
}

/*
|--------------------------------------------------------------------------
| TEST PAGE
|--------------------------------------------------------------------------
*/

export function buildEscPosTestPage(
  printerName: string,
): string {
  const now =
    new Date();

  const date =
    now.toLocaleDateString(
      "es-BO",
    );

  const time =
    now.toLocaleTimeString(
      "es-BO",
      {
        hour:
          "2-digit",

        minute:
          "2-digit",
      },
    );

  return buildEscPosPayload(
    [
      "================================",
      "       PRUEBA DE IMPRESION",
      "================================",
      "",
      `Impresora: ${printerName}`,
      "Sistema: CatuDrive",
      `Fecha: ${date}`,
      `Hora: ${time}`,
      "",
      "Conexion correcta.",
      "",
      "================================",
    ].join(
      "\n",
    ),
    {
      title:
        "CATUDRIVE",

      cutPaper:
        true,
    },
  );
}
