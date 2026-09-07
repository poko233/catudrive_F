import * as Print from "expo-print";

import {
  Platform,
} from "react-native";

import {
  Chofer,
} from "../types/chofer.types";

/*
|--------------------------------------------------------------------------
| MEDIDAS ID-1
|--------------------------------------------------------------------------
|
| ISO/IEC 7810 ID-1:
|
| 85.60 × 53.98 mm
|
| Utilizamos 54 mm en CSS para mantener una medida práctica
| compatible con el diseño actual.
|
*/

const CARNET_WIDTH_MM =
  85.6;

const CARNET_HEIGHT_MM =
  54;

/*
|--------------------------------------------------------------------------
| ESCAPAR HTML
|--------------------------------------------------------------------------
*/

function escapeHtml(
  value?:
    | string
    | null,
): string {
  return String(
    value ??
      "",
  )
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

/*
|--------------------------------------------------------------------------
| HTML DEL CARNET
|--------------------------------------------------------------------------
*/

export function construirCarnetChoferHtml(
  chofer:
    Chofer,
): string {
  const foto =
    chofer.fotoUrl
      ? `
        <img
          class="photo"
          src="${escapeHtml(
            chofer.fotoUrl,
          )}"
          alt="Fotografía del chofer"
        />
      `
      : `
        <div
          class="photo placeholder"
        >
          SIN FOTO
        </div>
      `;

  const qr =
    chofer.qrUrl
      ? `
        <img
          class="qr"
          src="${escapeHtml(
            chofer.qrUrl,
          )}"
          alt="Código QR del chofer"
        />
      `
      : `
        <div
          class="qr placeholder"
        >
          SIN QR
        </div>
      `;

  return `
<!doctype html>

<html lang="es">

<head>

<meta charset="utf-8" />

<meta
  name="viewport"
  content="width=device-width, initial-scale=1"
/>

<title>
  Carnet sindical · ${escapeHtml(
    chofer.nombre_completo,
  )}
</title>

<style>

@page {

  size:
    ${CARNET_WIDTH_MM}mm
    ${CARNET_HEIGHT_MM}mm;

  margin:
    0;

}

* {

  box-sizing:
    border-box;

  -webkit-print-color-adjust:
    exact !important;

  print-color-adjust:
    exact !important;

}

html,
body {

  width:
    ${CARNET_WIDTH_MM}mm;

  height:
    ${CARNET_HEIGHT_MM}mm;

  margin:
    0;

  padding:
    0;

  overflow:
    hidden;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  background:
    #ffffff;

}

body {

  display:
    block;

}

.card {

  position:
    relative;

  width:
    ${CARNET_WIDTH_MM}mm;

  height:
    ${CARNET_HEIGHT_MM}mm;

  overflow:
    hidden;

  border:
    .35mm
    solid
    #1f2937;

  background:
    linear-gradient(
      135deg,
      #ffffff
      0%,
      #f8fafc
      62%,
      #eef2ff
      100%
    );

  color:
    #111827;

  break-inside:
    avoid;

  page-break-inside:
    avoid;

}

.top {

  height:
    10.5mm;

  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  padding:
    0
    4mm;

  background:
    #111827;

  color:
    #ffffff;

}

.brand {

  font-weight:
    900;

  font-size:
    4mm;

  letter-spacing:
    .35mm;

}

.kind {

  font-size:
    2.2mm;

  font-weight:
    700;

  opacity:
    .88;

  text-transform:
    uppercase;

}

.body {

  display:
    grid;

  grid-template-columns:
    19mm
    1fr
    18mm;

  gap:
    3mm;

  padding:
    3.2mm
    3.5mm
    2.4mm;

  align-items:
    start;

}

.photo,
.qr {

  width:
    18mm;

  height:
    18mm;

  object-fit:
    cover;

  background:
    #ffffff;

  border:
    .3mm
    solid
    #d1d5db;

  border-radius:
    1.5mm;

}

.photo {

  height:
    24mm;

}

.qr {

  object-fit:
    contain;

  padding:
    .8mm;

}

.placeholder {

  display:
    flex;

  align-items:
    center;

  justify-content:
    center;

  color:
    #6b7280;

  font-size:
    1.8mm;

  text-align:
    center;

}

.data {

  min-width:
    0;

}

.name {

  margin:
    0
    0
    1.6mm;

  font-size:
    3.2mm;

  line-height:
    3.7mm;

  font-weight:
    900;

  text-transform:
    uppercase;

}

.line {

  display:
    flex;

  margin-bottom:
    .8mm;

  font-size:
    2.25mm;

  line-height:
    2.7mm;

}

.label {

  width:
    19mm;

  flex:
    0
    0
    19mm;

  color:
    #6b7280;

  font-weight:
    700;

}

.value {

  flex:
    1;

  min-width:
    0;

  overflow:
    hidden;

  text-overflow:
    ellipsis;

  white-space:
    nowrap;

  font-weight:
    800;

}

.footer {

  position:
    absolute;

  left:
    3.5mm;

  right:
    3.5mm;

  bottom:
    2.2mm;

  display:
    flex;

  align-items:
    center;

  justify-content:
    space-between;

  padding-top:
    1.5mm;

  border-top:
    .25mm
    solid
    #d1d5db;

}

.footerText {

  font-size:
    1.8mm;

  color:
    #4b5563;

}

.status {

  padding:
    .8mm
    1.7mm;

  border-radius:
    4mm;

  font-size:
    1.8mm;

  font-weight:
    900;

  color:
    ${
      chofer.estado ===
      "ACTIVO"
        ? "#065f46"
        : "#991b1b"
    };

  background:
    ${
      chofer.estado ===
      "ACTIVO"
        ? "#d1fae5"
        : "#fee2e2"
    };

}

@media print {

  html,
  body {

    width:
      ${CARNET_WIDTH_MM}mm
      !important;

    height:
      ${CARNET_HEIGHT_MM}mm
      !important;

    margin:
      0
      !important;

    padding:
      0
      !important;

  }

  .card {

    margin:
      0
      !important;

    box-shadow:
      none
      !important;

  }

}

</style>

</head>

<body>

<div
  class="card"
>

  <div
    class="top"
  >

    <div
      class="brand"
    >
      CATUDRIVE
    </div>

    <div
      class="kind"
    >
      Carnet Sindical
    </div>

  </div>

  <div
    class="body"
  >

    <div>
      ${foto}
    </div>

    <div
      class="data"
    >

      <div
        class="name"
      >
        ${escapeHtml(
          chofer.nombre_completo,
        )}
      </div>

      <div
        class="line"
      >

        <div
          class="label"
        >
          Carnet Sindical
        </div>

        <div
          class="value"
        >
          ${escapeHtml(
            chofer.carnet_sindical,
          )}
        </div>

      </div>

      <div
        class="line"
      >

        <div
          class="label"
        >
          C.I.
        </div>

        <div
          class="value"
        >
          ${escapeHtml(
            chofer.carnet_identidad,
          )}
        </div>

      </div>

      <div
        class="line"
      >

        <div
          class="label"
        >
          Teléfono
        </div>

        <div
          class="value"
        >
          ${escapeHtml(
            chofer.telefono,
          )}
        </div>

      </div>

      <div
        class="line"
      >

        <div
          class="label"
        >
          Licencia
        </div>

        <div
          class="value"
        >
          ${escapeHtml(
            chofer.numero_licencia,
          )}
        </div>

      </div>

      <div
        class="line"
      >

        <div
          class="label"
        >
          Categoría
        </div>

        <div
          class="value"
        >
          ${escapeHtml(
            String(
              chofer.categoria_licencia,
            ),
          )}
        </div>

      </div>

    </div>

    <div>
      ${qr}
    </div>

  </div>

  <div
    class="footer"
  >

    <div
      class="footerText"
    >
      Identificación sindical digital
    </div>

    <div
      class="status"
    >
      ${escapeHtml(
        chofer.estado,
      )}
    </div>

  </div>

</div>

</body>

</html>
`;
}

/*
|--------------------------------------------------------------------------
| ESPERAR IMÁGENES EN WEB
|--------------------------------------------------------------------------
*/

function esperarImagen(
  image:
    HTMLImageElement,
): Promise<void> {
  if (
    image.complete
  ) {
    return Promise.resolve();
  }

  return new Promise(
    (
      resolve,
    ) => {
      let finished =
        false;

      const finish =
        () => {
          if (
            finished
          ) {
            return;
          }

          finished =
            true;

          resolve();
        };

      image.addEventListener(
        "load",
        finish,
        {
          once:
            true,
        },
      );

      image.addEventListener(
        "error",
        finish,
        {
          once:
            true,
        },
      );

      /*
      |--------------------------------------------------------------------------
      | No bloqueamos indefinidamente la impresión si una imagen remota falla.
      |--------------------------------------------------------------------------
      */

      setTimeout(
        finish,
        3000,
      );
    },
  );
}

async function esperarImagenesVentana(
  ventana:
    Window,
): Promise<void> {
  const images =
    Array.from(
      ventana.document.images,
    );

  if (
    images.length ===
    0
  ) {
    return;
  }

  await Promise.all(
    images.map(
      esperarImagen,
    ),
  );
}

/*
|--------------------------------------------------------------------------
| IMPRESIÓN WEB
|--------------------------------------------------------------------------
*/

async function imprimirCarnetWeb(
  html:
    string,
): Promise<void> {
  /*
  |--------------------------------------------------------------------------
  | Debe ejecutarse directamente después del click del usuario para evitar
  | que Chrome/Edge lo considere un popup no solicitado.
  |--------------------------------------------------------------------------
  */

  const ventana =
    window.open(
      "",

      "_blank",

      "popup=yes,width=980,height=720",
    );

  if (!ventana) {
    throw new Error(
      "El navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes para CatuDrive.",
    );
  }

  ventana.document.open();

  ventana.document.write(
    html,
  );

  ventana.document.close();

  /*
  |--------------------------------------------------------------------------
  | Esperar fotografía y QR antes de abrir la impresión.
  |--------------------------------------------------------------------------
  */

  await esperarImagenesVentana(
    ventana,
  );

  /*
  |--------------------------------------------------------------------------
  | Pequeña espera para asegurar que el navegador termine de pintar estilos.
  |--------------------------------------------------------------------------
  */

  await new Promise<void>(
    (
      resolve,
    ) => {
      setTimeout(
        resolve,
        120,
      );
    },
  );

  ventana.focus();

  /*
  |--------------------------------------------------------------------------
  | Cerrar la ventana auxiliar después del diálogo.
  |--------------------------------------------------------------------------
  */

  ventana.addEventListener(
    "afterprint",
    () => {
      try {
        ventana.close();
      } catch {
        // No hacemos nada.
      }
    },
    {
      once:
        true,
    },
  );

  ventana.print();
}

/*
|--------------------------------------------------------------------------
| IMPRIMIR
|--------------------------------------------------------------------------
*/

export async function imprimirCarnetChofer(
  chofer:
    Chofer,
): Promise<void> {
  const html =
    construirCarnetChoferHtml(
      chofer,
    );

  /*
  |--------------------------------------------------------------------------
  | WEB
  |--------------------------------------------------------------------------
  |
  | No utilizamos Print.printAsync({ html }) aquí porque en web Expo Print
  | imprime el HTML de la página actual. Para imprimir únicamente el carnet
  | generamos una ventana aislada con el HTML exacto del carnet.
  |
  */

  if (
    Platform.OS ===
    "web"
  ) {
    await imprimirCarnetWeb(
      html,
    );

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | ANDROID / IOS
  |--------------------------------------------------------------------------
  */

  await Print.printAsync({
    html,

    orientation:
      Print.Orientation.landscape,
  });
}
