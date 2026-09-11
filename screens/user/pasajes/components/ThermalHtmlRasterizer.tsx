import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  PixelRatio,
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
| Fuente única:
|   resources/views/pasajes/ticket-thermal.blade.php
|        ↓ backend renderiza HTML
|   este componente renderiza ESE HTML en WebView
|        ↓
|   react-native-view-shot captura PNG
|        ↓
|   SUNMI / Bluetooth / TCP imprimen esa misma imagen.
|
| El Blade usa un área útil de 48 mm. A 96 CSS dpi son ~181.4 px.
| Renderizamos a 182 dp y capturamos a 384 dots físicos, que es el ancho
| estándar de una térmica 58 mm a 203 dpi.
|
*/

const HTML_RENDER_WIDTH =
  182;

const INITIAL_RENDER_HEIGHT =
  500;

const MAX_RENDER_HEIGHT =
  5000;

const READY_TIMEOUT_MS =
  7000;

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
  timeout: ReturnType<typeof setTimeout>;
};

function prepareHtmlForRaster(
  html:
    string,
): string {
  const guard = `
<script>
  (function () {
    /* En el WebView oculto jamás abrimos diálogo de impresión. */
    window.print = function () { return false; };
  })();
</script>
`;

  const viewport =
    '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">';

  let output =
    html;

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

const injectedReadyScript = `
(function () {
  var sent = false;

  function getHeight() {
    var body = document.body;
    var html = document.documentElement;

    return Math.max(
      body ? body.scrollHeight : 0,
      body ? body.offsetHeight : 0,
      html ? html.clientHeight : 0,
      html ? html.scrollHeight : 0,
      html ? html.offsetHeight : 0
    );
  }

  function sendReady() {
    if (sent) return;
    sent = true;

    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'ticket-ready',
        height: getHeight()
      })
    );
  }

  var images = Array.prototype.slice.call(document.images || []);
  var imagePromises = images.map(function (img) {
    if (img.complete) return Promise.resolve();
    return new Promise(function (resolve) {
      img.onload = resolve;
      img.onerror = resolve;
    });
  });

  var fontsReady =
    document.fonts && document.fonts.ready
      ? document.fonts.ready.catch(function () {})
      : Promise.resolve();

  Promise.all(imagePromises)
    .then(function () { return fontsReady; })
    .then(function () {
      requestAnimationFrame(function () {
        requestAnimationFrame(sendReady);
      });
    });

  setTimeout(sendReady, 1500);
  true;
})();
`;

export const ThermalHtmlRasterizer =
  forwardRef<
    ThermalHtmlRasterizerHandle
  >(
    function ThermalHtmlRasterizer(
      _,
      ref,
    ) {
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

      const [html, setHtml] =
        useState(
          "",
        );

      const [renderHeight, setRenderHeight] =
        useState(
          INITIAL_RENDER_HEIGHT,
        );

      const rejectPending =
        useCallback(
          (
            reason:
              unknown,
          ) => {
            const pending =
              pendingRef.current;

            if (!pending) {
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
              | PixelRatio:
              | captureRef trabaja en unidades de pantalla y luego rasteriza.
              | Dividimos para terminar con ~384 píxeles físicos reales.
              */
              const pixelRatio =
                PixelRatio.get();

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

              const captureWidth =
                RECEIPT_58_DOTS /
                pixelRatio;

              const captureHeight =
                outputHeightPixels /
                pixelRatio;

              /* Da tiempo a que React aplique el alto exacto del WebView. */
              await new Promise<void>(
                (
                  resolve,
                ) =>
                  setTimeout(
                    resolve,
                    180,
                  ),
              );

              const base64 =
                await captureRef(
                  captureView,
                  {
                    format:
                      "png",
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

              current.resolve({
                base64,
                width:
                  RECEIPT_58_DOTS,
                height:
                  outputHeightPixels,
                threshold:
                  205,
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

              const rawHeight =
                Number(
                  message.height,
                );

              if (
                !Number.isFinite(
                  rawHeight,
                ) ||
                rawHeight <= 0
              ) {
                throw new Error(
                  "El backend devolvió un ticket sin altura imprimible.",
                );
              }

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

      useImperativeHandle(
        ref,
        () => ({
          captureHtml(
            sourceHtml:
              string,
          ) {
            if (
              Platform.OS ===
              "web"
            ) {
              return Promise.reject(
                new Error(
                  "La rasterización térmica solo se usa en Android/iOS.",
                ),
              );
            }

            if (
              !sourceHtml.trim()
            ) {
              return Promise.reject(
                new Error(
                  "El HTML del ticket está vacío.",
                ),
              );
            }

            if (
              pendingRef.current
            ) {
              rejectPending(
                new Error(
                  "La impresión anterior fue reemplazada por una nueva solicitud.",
                ),
              );
            }

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

            return new Promise<PrinterRasterImage>(
              (
                resolve,
                reject,
              ) => {
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

      if (
        Platform.OS ===
        "web"
      ) {
        return null;
      }

      return (
        <View
          pointerEvents="none"
          style={styles.hiddenHost}
        >
          <View
            ref={wrapperRef}
            collapsable={false}
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
                domStorageEnabled={false}
                scrollEnabled={false}
                bounces={false}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                automaticallyAdjustContentInsets={false}
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
                      event.nativeEvent.description ||
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

const styles =
  StyleSheet.create({
    /*
     * Debe seguir montado/renderizado para que ViewShot pueda capturar WebView.
     * No usamos display:none ni opacity:0.
     */
    hiddenHost: {
      position:
        "absolute",
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
