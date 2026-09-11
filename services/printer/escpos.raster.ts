import {
  AlphaType,
  ColorType,
  Skia,
} from "@shopify/react-native-skia";

/*
|--------------------------------------------------------------------------
| ESC/POS RASTER IMAGE
|--------------------------------------------------------------------------
|
| Convierte una imagen PNG/JPG Base64 en GS v 0 (raster bit image).
| Es el formato que entienden la mayoría de impresoras ESC/POS 58/80 mm.
|
| IMPORTANTE:
| - El HTML no se interpreta aquí.
| - El HTML oficial del backend se rasteriza ANTES en ThermalHtmlRasterizer.
| - Aquí solo convertimos esa imagen a bytes ESC/POS.
|
*/

const ESC =
  0x1b;

const GS =
  0x1d;

const INIT = [
  ESC,
  0x40,
];

const ALIGN_CENTER = [
  ESC,
  0x61,
  0x01,
];

const ALIGN_LEFT = [
  ESC,
  0x61,
  0x00,
];

const CUT_FULL = [
  GS,
  0x56,
  0x00,
];

function stripDataUri(
  value:
    string,
): string {
  const comma =
    value.indexOf(
      ",",
    );

  if (
    value.startsWith(
      "data:",
    ) &&
    comma >= 0
  ) {
    return value.slice(
      comma + 1,
    );
  }

  return value;
}

function bytesToBase64(
  bytes:
    Uint8Array,
): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  let output =
    "";

  for (
    let i = 0;
    i < bytes.length;
    i += 3
  ) {
    const a =
      bytes[i] ?? 0;
    const b =
      bytes[i + 1] ?? 0;
    const c =
      bytes[i + 2] ?? 0;

    const triplet =
      (a << 16) |
      (b << 8) |
      c;

    output +=
      alphabet[
        (triplet >> 18) & 0x3f
      ];
    output +=
      alphabet[
        (triplet >> 12) & 0x3f
      ];

    output +=
      i + 1 < bytes.length
        ? alphabet[
            (triplet >> 6) & 0x3f
          ]
        : "=";

    output +=
      i + 2 < bytes.length
        ? alphabet[
            triplet & 0x3f
          ]
        : "=";
  }

  return output;
}

function decodeImage(
  base64:
    string,
) {
  const data =
    Skia.Data.fromBase64(
      stripDataUri(
        base64,
      ),
    );

  const image =
    Skia.Image.MakeImageFromEncoded(
      data,
    );

  if (!image) {
    throw new Error(
      "No se pudo decodificar la imagen térmica del ticket.",
    );
  }

  return image;
}

function getRgbaPixels(
  base64:
    string,
): {
  width: number;
  height: number;
  pixels: Uint8Array;
} {
  const image =
    decodeImage(
      base64,
    );

  const width =
    image.width();
  const height =
    image.height();

  const pixels =
    image.readPixels(
      0,
      0,
      {
        width,
        height,
        colorType:
          ColorType.RGBA_8888,
        alphaType:
          AlphaType.Unpremul,
      },
    );

  if (
    !pixels ||
    !(pixels instanceof Uint8Array)
  ) {
    throw new Error(
      "No se pudieron leer los píxeles de la imagen térmica.",
    );
  }

  return {
    width,
    height,
    pixels,
  };
}

function isBlackPixel(
  pixels:
    Uint8Array,
  index:
    number,
  threshold:
    number,
): boolean {
  const r =
    pixels[index] ?? 255;
  const g =
    pixels[index + 1] ?? 255;
  const b =
    pixels[index + 2] ?? 255;
  const a =
    pixels[index + 3] ?? 255;

  if (a < 16) {
    return false;
  }

  /* Luminancia perceptual. */
  const luminance =
    0.299 * r +
    0.587 * g +
    0.114 * b;

  return luminance <
    threshold;
}

function buildRasterBytes(
  base64:
    string,
  threshold:
    number,
): Uint8Array {
  const {
    width,
    height,
    pixels,
  } =
    getRgbaPixels(
      base64,
    );

  if (
    width <= 0 ||
    height <= 0
  ) {
    throw new Error(
      "La imagen del ticket está vacía.",
    );
  }

  if (
    width > 576
  ) {
    throw new Error(
      `La imagen del ticket tiene ${width}px de ancho. Para térmicas ESC/POS el máximo permitido es 576px.`,
    );
  }

  const bytesPerRow =
    Math.ceil(
      width / 8,
    );

  const raster =
    new Uint8Array(
      bytesPerRow *
        height,
    );

  for (
    let y = 0;
    y < height;
    y++
  ) {
    for (
      let x = 0;
      x < width;
      x++
    ) {
      const pixelIndex =
        (
          y * width +
          x
        ) * 4;

      if (
        !isBlackPixel(
          pixels,
          pixelIndex,
          threshold,
        )
      ) {
        continue;
      }

      const byteIndex =
        y * bytesPerRow +
        Math.floor(
          x / 8,
        );

      raster[byteIndex] |=
        0x80 >>
        (x % 8);
    }
  }

  const xL =
    bytesPerRow &
    0xff;
  const xH =
    (
      bytesPerRow >> 8
    ) & 0xff;
  const yL =
    height &
    0xff;
  const yH =
    (
      height >> 8
    ) & 0xff;

  /* GS v 0 m xL xH yL yH d1...dk */
  const command =
    new Uint8Array(
      8 +
        raster.length,
    );

  command.set(
    [
      GS,
      0x76,
      0x30,
      0x00,
      xL,
      xH,
      yL,
      yH,
    ],
    0,
  );

  command.set(
    raster,
    8,
  );

  return command;
}

export function buildEscPosRasterPayloadBase64(
  imageBase64:
    string,
  options?: {
    threshold?: number;
    cutPaper?: boolean;
    feedLines?: number;
  },
): string {
  const threshold =
    Math.max(
      0,
      Math.min(
        255,
        Math.round(
          options?.threshold ??
            205,
        ),
      ),
    );

  const feedLines =
    Math.max(
      0,
      Math.min(
        8,
        Math.round(
          options?.feedLines ??
            3,
        ),
      ),
    );

  const imageBytes =
    buildRasterBytes(
      imageBase64,
      threshold,
    );

  const suffixLength =
    feedLines +
    ALIGN_LEFT.length +
    (
      options?.cutPaper === false
        ? 0
        : CUT_FULL.length
    );

  const totalLength =
    INIT.length +
    ALIGN_CENTER.length +
    imageBytes.length +
    suffixLength;

  const output =
    new Uint8Array(
      totalLength,
    );

  let offset =
    0;

  output.set(
    INIT,
    offset,
  );
  offset +=
    INIT.length;

  output.set(
    ALIGN_CENTER,
    offset,
  );
  offset +=
    ALIGN_CENTER.length;

  output.set(
    imageBytes,
    offset,
  );
  offset +=
    imageBytes.length;

  for (
    let i = 0;
    i < feedLines;
    i++
  ) {
    output[offset++] =
      0x0a;
  }

  output.set(
    ALIGN_LEFT,
    offset,
  );
  offset +=
    ALIGN_LEFT.length;

  if (
    options?.cutPaper !==
    false
  ) {
    output.set(
      CUT_FULL,
      offset,
    );
  }

  return bytesToBase64(
    output,
  );
}
