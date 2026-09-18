import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import {
  Platform,
  StyleSheet,
  View,
} from "react-native";

import {
  WebView,
  WebViewMessageEvent,
} from "react-native-webview";

import {
  captureRef,
} from "react-native-view-shot";

import type {
  PrinterRasterImage,
} from "@/services/printer/printer.types";

import {
  RECEIPT_58_DOTS,
} from "@/services/printer/printer.constants";

/*
|--------------------------------------------------------------------------
| HTML -> PNG RASTER
|--------------------------------------------------------------------------
|
| Flujo:
|
| resources/views/pasajes/ticket-thermal.blade.php
|        ↓
| backend genera HTML
|        ↓
| WebView renderiza exactamente ese HTML
|        ↓
| react-native-view-shot captura PNG
|        ↓
| PNG de 384 px reales
|        ↓
| SUNMI / Bluetooth / TCP imprimen la misma imagen
|
| Una impresora térmica de 58 mm normalmente trabaja con:
|
| 384 dots a 203 DPI
|
|--------------------------------------------------------------------------
*/

const HTML_RENDER_WIDTH =
  182;

const INITIAL_RENDER_HEIGHT =
  500;

const MAX_RENDER_HEIGHT =
  5000;

const READY_TIMEOUT_MS =
  7000;

/*
|--------------------------------------------------------------------------
| THRESHOLD
|--------------------------------------------------------------------------
|
| Menor valor:
|   impresión más fina.
|
| Mayor valor:
|   impresión más oscura/gruesa.
|
| 170 funciona mejor para texto rasterizado porque evita convertir
| demasiado antialiasing gris en negro.
|
|--------------------------------------------------------------------------
*/

const DEFAULT_THRESHOLD =
  170;

export interface ThermalHtmlRasterizerHandle {
  captureHtml(
    html: string,
  ): Promise<PrinterRasterImage>;
}

type PendingCapture = {
  requestId: number;

  resolve: (
    value: PrinterRasterImage,
  ) => void;

  reject: (
    reason?: unknown,
  ) => void;

  timeout:
    ReturnType<typeof setTimeout>;
};

/*
|--------------------------------------------------------------------------
| PREPARAR HTML
|--------------------------------------------------------------------------
*/

function prepareHtmlForRaster(
  html:
    string,
): string {
  /*
  |--------------------------------------------------------------------------
  | EVITAR window.print()
  |--------------------------------------------------------------------------
  |
  | El Blade contiene window.print() para impresión desde navegador.
  | Dentro del WebView utilizado para rasterizar no queremos abrir
  | ningún diálogo.
  |
  */

  const guard = `
<script>
  (function () {
    window.print = function () {
      return false;
    };
  })();
</script>
`;

  /*
  |--------------------------------------------------------------------------
  | VIEWPORT
  |--------------------------------------------------------------------------
  */

  const viewport =
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">';

  let output =
    html;

  /*
  |--------------------------------------------------------------------------
  | AGREGAR VIEWPORT SI NO EXISTE
  |--------------------------------------------------------------------------
  */

  if (
    !/name=["']viewport["']/i.test(
      output,
    )
  ) {
    output =
      output.replace(
        /<head([^>]*)>/i,
        `<head$1>${viewport}`,
      );
  }

  /*
  |--------------------------------------------------------------------------
  | AGREGAR BLOQUEO DE window.print
  |--------------------------------------------------------------------------
  */

  if (
    /<\/body>/i.test(
      output,
    )
  ) {
    output =
      output.replace(
        /<\/body>/i,
        `${guard}</body>`,
      );
  } else {
    output +=
      guard;
  }

  return output;
}

/*
|--------------------------------------------------------------------------
| SCRIPT DE WEBVIEW
|--------------------------------------------------------------------------
|
| Espera:
|
| - imágenes
| - fuentes
| - renderizado
|
| Luego devuelve la altura real del documento.
|
|--------------------------------------------------------------------------
*/

const injectedReadyScript = `
(function () {
  var sent = false;

  function getHeight() {
    var body =
      document.body;

    var html =
      document.documentElement;

    return Math.max(
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      html ? html.clientHeight : 0,
      html ? html.scrollHeight : 0,
      html ? html.offsetHeight : 0
    );
  }

  function sendReady() {
    if (sent) {
      return;
    }

    sent = true;

    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'ticket-ready',
        height: getHeight()
      })
    );
  }

  var images =
    Array.prototype.slice.call(
      document.images || []
    );

  var imagePromises =
    images.map(function (img) {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise(
        function (resolve) {
          img.onload =
            resolve;

          img.onerror =
            resolve;
        }
      );
    });

  var fontsReady =
    document.fonts &&
    document.fonts.ready
      ? document.fonts.ready.catch(
          function () {}
        )
      : Promise.resolve();

  Promise.all(
    imagePromises
  )
    .then(function () {
      return fontsReady;
    })
    .then(function () {
      requestAnimationFrame(
        function () {
          requestAnimationFrame(
            sendReady
          );
        }
      );
    });

  /*
  |--------------------------------------------------------------------------
  | FALLBACK
  |--------------------------------------------------------------------------
  |
  | Si algo no dispara correctamente el evento, enviamos igualmente
  | la altura después de 1.5 segundos.
  |
  */

  setTimeout(
    sendReady,
    1500
  );

  true;
})();
`;

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export const ThermalHtmlRasterizer =
  forwardRef<
    ThermalHtmlRasterizerHandle
  >(
    function ThermalHtmlRasterizer(
      _,
      ref,
    ) {
      /*
      |--------------------------------------------------------------------------
      | REFERENCIAS
      |--------------------------------------------------------------------------
      */

      const wrapperRef =
        useRef<View>(
          null,
        );

      const pendingRef =
        useRef<PendingCapture | null>(
          null,
        );

      const requestCounterRef =
        useRef(
          0,
        );

      /*
      |--------------------------------------------------------------------------
      | ESTADO
      |--------------------------------------------------------------------------
      */

      const [
        html,
        setHtml,
      ] =
        useState(
          "",
        );

      const [
        renderHeight,
        setRenderHeight,
      ] =
        useState(
          INITIAL_RENDER_HEIGHT,
        );

      /*
      |--------------------------------------------------------------------------
      | CANCELAR CAPTURA PENDIENTE
      |--------------------------------------------------------------------------
      */

      const rejectPending =
        useCallback(
          (
            reason:
              unknown,
          ) => {
            const pending =
              pendingRef.current;

            if (
              !pending
            ) {
              return;
            }

            clearTimeout(
              pending.timeout,
            );

            pendingRef.current =
              null;

            pending.reject(
              reason,
            );
          },
          [],
        );

      /*
      |--------------------------------------------------------------------------
      | CAPTURAR WEBVIEW
      |--------------------------------------------------------------------------
      */

      const captureCurrentView =
        useCallback(
          async (
            cssHeight:
              number,
          ) => {
            const pending =
              pendingRef.current;

            const captureView =
              wrapperRef.current;

            if (
              !pending ||
              !captureView
            ) {
              return;
            }

            try {
              /*
              |--------------------------------------------------------------------------
              | ESCALA
              |--------------------------------------------------------------------------
              |
              | El HTML se renderiza aproximadamente a 182 px de ancho.
              |
              | La imagen final debe terminar exactamente en:
              |
              | 384 dots
              |
              | para una impresora térmica de 58 mm.
              |
              |--------------------------------------------------------------------------
              */

              const scale =
                RECEIPT_58_DOTS /
                HTML_RENDER_WIDTH;

              const outputHeightPixels =
                Math.max(
                  1,

                  Math.ceil(
                    cssHeight *
                      scale,
                  ),
                );

              /*
              |--------------------------------------------------------------------------
              | IMPORTANTE
              |--------------------------------------------------------------------------
              |
              | captureRef recibe width y height como dimensiones FINALES
              | de la imagen.
              |
              | NO debemos dividir por PixelRatio.
              |
              | Antes:
              |
              | 384 / PixelRatio
              |
              | En un dispositivo PixelRatio 3:
              |
              | 384 / 3 = 128 px
              |
              | y luego la impresora estiraba esa imagen nuevamente a 384.
              |
              | Resultado:
              | texto borroso.
              |
              | Ahora generamos directamente:
              |
              | 384 px
              |
              |--------------------------------------------------------------------------
              */

              const captureWidth =
                RECEIPT_58_DOTS;

              const captureHeight =
                outputHeightPixels;

              /*
              |--------------------------------------------------------------------------
              | ESPERAR QUE REACT APLIQUE EL ALTO
              |--------------------------------------------------------------------------
              */

              await new Promise<void>(
                (
                  resolve,
                ) =>
                  setTimeout(
                    resolve,
                    220,
                  ),
              );

              /*
              |--------------------------------------------------------------------------
              | CAPTURA PNG
              |--------------------------------------------------------------------------
              */

              const base64 =
                await captureRef(
                  captureView,
                  {
                    format:
                      "png",

                    /*
                     * PNG es lossless.
                     * quality realmente afecta sobre todo JPG/WebP,
                     * pero lo dejamos en 1.
                     */
                    quality:
                      1,

                    result:
                      "base64",

                    width:
                      captureWidth,

                    height:
                      captureHeight,
                  },
                );

              /*
              |--------------------------------------------------------------------------
              | VERIFICAR QUE SIGA SIENDO LA MISMA SOLICITUD
              |--------------------------------------------------------------------------
              */

              const current =
                pendingRef.current;

              if (
                !current ||
                current.requestId !==
                  pending.requestId
              ) {
                return;
              }

              clearTimeout(
                current.timeout,
              );

              pendingRef.current =
                null;

              /*
              |--------------------------------------------------------------------------
              | RESULTADO
              |--------------------------------------------------------------------------
              */

              current.resolve({
                base64,

                width:
                  RECEIPT_58_DOTS,

                height:
                  outputHeightPixels,

                threshold:
                  DEFAULT_THRESHOLD,
              });
            } catch (
              error
            ) {
              rejectPending(
                error,
              );
            }
          },
          [
            rejectPending,
          ],
        );

      /*
      |--------------------------------------------------------------------------
      | MENSAJE DEL WEBVIEW
      |--------------------------------------------------------------------------
      */

      const handleMessage =
        useCallback(
          (
            event:
              WebViewMessageEvent,
          ) => {
            try {
              const message =
                JSON.parse(
                  event.nativeEvent.data,
                );

              if (
                message?.type !==
                "ticket-ready"
              ) {
                return;
              }

              /*
              |--------------------------------------------------------------------------
              | ALTURA REAL DEL HTML
              |--------------------------------------------------------------------------
              */

              const rawHeight =
                Number(
                  message.height,
                );

              if (
                !Number.isFinite(
                  rawHeight,
                ) ||
                rawHeight <=
                  0
              ) {
                throw new Error(
                  "El backend devolvió un ticket sin altura imprimible.",
                );
              }

              /*
              |--------------------------------------------------------------------------
              | EVITAR ALTURAS INVÁLIDAS
              |--------------------------------------------------------------------------
              */

              const safeHeight =
                Math.max(
                  40,

                  Math.min(
                    MAX_RENDER_HEIGHT,

                    Math.ceil(
                      rawHeight,
                    ),
                  ),
                );

              setRenderHeight(
                safeHeight,
              );

              /*
              |--------------------------------------------------------------------------
              | CAPTURAR
              |--------------------------------------------------------------------------
              */

              void captureCurrentView(
                safeHeight,
              );
            } catch (
              error
            ) {
              rejectPending(
                error,
              );
            }
          },
          [
            captureCurrentView,
            rejectPending,
          ],
        );

      /*
      |--------------------------------------------------------------------------
      | API PÚBLICA
      |--------------------------------------------------------------------------
      */

      useImperativeHandle(
        ref,
        () => ({
          captureHtml(
            sourceHtml:
              string,
          ) {
            /*
            |--------------------------------------------------------------------------
            | WEB
            |--------------------------------------------------------------------------
            */

            if (
              Platform.OS ===
              "web"
            ) {
              return Promise.reject(
                new Error(
                  "La rasterización térmica solo se utiliza en Android/iOS.",
                ),
              );
            }

            /*
            |--------------------------------------------------------------------------
            | HTML VACÍO
            |--------------------------------------------------------------------------
            */

            if (
              !sourceHtml.trim()
            ) {
              return Promise.reject(
                new Error(
                  "El HTML del ticket está vacío.",
                ),
              );
            }

            /*
            |--------------------------------------------------------------------------
            | CANCELAR IMPRESIÓN ANTERIOR
            |--------------------------------------------------------------------------
            */

            if (
              pendingRef.current
            ) {
              rejectPending(
                new Error(
                  "La impresión anterior fue reemplazada por una nueva solicitud.",
                ),
              );
            }

            /*
            |--------------------------------------------------------------------------
            | NUEVA SOLICITUD
            |--------------------------------------------------------------------------
            */

            const requestId =
              ++requestCounterRef.current;

            setRenderHeight(
              INITIAL_RENDER_HEIGHT,
            );

            setHtml(
              prepareHtmlForRaster(
                sourceHtml,
              ),
            );

            /*
            |--------------------------------------------------------------------------
            | PROMESA DE CAPTURA
            |--------------------------------------------------------------------------
            */

            return new Promise<PrinterRasterImage>(
              (
                resolve,
                reject,
              ) => {
                /*
                |--------------------------------------------------------------------------
                | TIMEOUT
                |--------------------------------------------------------------------------
                */

                const timeout =
                  setTimeout(
                    () => {
                      const current =
                        pendingRef.current;

                      if (
                        current?.requestId ===
                        requestId
                      ) {
                        pendingRef.current =
                          null;

                        reject(
                          new Error(
                            "El ticket tardó demasiado en renderizarse para impresión térmica.",
                          ),
                        );
                      }
                    },
                    READY_TIMEOUT_MS,
                  );

                pendingRef.current = {
                  requestId,
                  resolve,
                  reject,
                  timeout,
                };
              },
            );
          },
        }),
        [
          rejectPending,
        ],
      );

      /*
      |--------------------------------------------------------------------------
      | WEB
      |--------------------------------------------------------------------------
      */

      if (
        Platform.OS ===
        "web"
      ) {
        return null;
      }

      /*
      |--------------------------------------------------------------------------
      | RENDER OCULTO
      |--------------------------------------------------------------------------
      |
      | No usar:
      |
      | display: none
      | opacity: 0
      |
      | porque ViewShot necesita que el componente esté realmente renderizado.
      |
      |--------------------------------------------------------------------------
      */

      return (
        <View
          pointerEvents="none"
          style={
            styles.hiddenHost
          }
        >
          <View
            ref={
              wrapperRef
            }
            collapsable={
              false
            }
            style={[
              styles.capture,

              {
                height:
                  renderHeight,
              },
            ]}
          >
            {html ? (
              <WebView
                originWhitelist={[
                  "*",
                ]}
                source={{
                  html,
                }}
                javaScriptEnabled
                domStorageEnabled={
                  false
                }
                scrollEnabled={
                  false
                }
                bounces={
                  false
                }
                showsVerticalScrollIndicator={
                  false
                }
                showsHorizontalScrollIndicator={
                  false
                }
                automaticallyAdjustContentInsets={
                  false
                }

                /*
                 * Software layer da resultados más consistentes al capturar
                 * WebView con ViewShot en Android.
                 */
                androidLayerType="software"

                injectedJavaScript={
                  injectedReadyScript
                }

                onMessage={
                  handleMessage
                }

                onError={(
                  event,
                ) => {
                  rejectPending(
                    new Error(
                      event
                        .nativeEvent
                        .description ||
                        "No se pudo renderizar el ticket HTML.",
                    ),
                  );
                }}

                style={[
                  styles.webview,

                  {
                    height:
                      renderHeight,
                  },
                ]}
              />
            ) : null}
          </View>
        </View>
      );
    },
  );

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    hiddenHost: {
      position:
        "absolute",

      /*
       * Se mantiene fuera de pantalla,
       * pero sigue renderizado.
       */
      left:
        -1000,

      top:
        0,

      width:
        HTML_RENDER_WIDTH,

      zIndex:
        -9999,
    },

    capture: {
      width:
        HTML_RENDER_WIDTH,

      backgroundColor:
        "#FFFFFF",

      overflow:
        "hidden",
    },

    webview: {
      width:
        HTML_RENDER_WIDTH,

      backgroundColor:
        "#FFFFFF",
    },
  });