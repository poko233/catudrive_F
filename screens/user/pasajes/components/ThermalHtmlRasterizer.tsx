// screens/user/pasajes/components/ThermalHtmlRasterizer.tsx
// HTML oficial -> WebView -> PNG de 384 dots -> impresora termica.
// Se mide el contenido real, NO la altura del viewport (500px).

import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { captureRef } from "react-native-view-shot";
import type { PrinterRasterImage } from "@/services/printer/printer.types";
import { RECEIPT_58_DOTS } from "@/services/printer/printer.constants";

const HTML_RENDER_WIDTH = 182;
const INITIAL_RENDER_HEIGHT = 500;
const MAX_RENDER_HEIGHT = 5000;
const READY_TIMEOUT_MS = 7000;
const DEFAULT_THRESHOLD = 170;

export interface ThermalHtmlRasterizerHandle {
  captureHtml(html: string): Promise<PrinterRasterImage>;
}

type PendingCapture = {
  requestId: number;
  resolve: (value: PrinterRasterImage) => void;
  reject: (reason?: unknown) => void;
  timeout: ReturnType<typeof setTimeout>;
};

function prepareHtmlForRaster(sourceHtml: string): string {
  // Evitar window.print() del HTML oficial en el WebView oculto.
  const printGuard = `<script>window.print = function () { return false; };</script>`;
  const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">';
  let html = sourceHtml;
  if (!/name=["']viewport["']/i.test(html)) {
    html = /<head\b/i.test(html)
      ? html.replace(/<head([^>]*)>/i, `<head$1>${viewport}`)
      : `${viewport}${html}`;
  }
  return /<head\b/i.test(html)
    ? html.replace(/<head([^>]*)>/i, `<head$1>${printGuard}`)
    : `${printGuard}${html}`;
}

// Importante: html.clientHeight / html.scrollHeight / body.offsetHeight
// incluyen los 500px iniciales del WebView, incluso con tickets cortos.
// Medimos el borde inferior de los elementos visibles del BODY.
const injectedReadyScript = `
(function () {
  var sent = false;
  function realHeight() {
    var body = document.body;
    if (!body) return 0;
    var bodyTop = body.getBoundingClientRect().top;
    var bottom = bodyTop;
    var children = body.children || [];
    for (var i = 0; i < children.length; i++) {
      var el = children[i];
      var tag = (el.tagName || '').toUpperCase();
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'LINK') continue;
      var cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.position === 'fixed') continue;
      var rect = el.getBoundingClientRect();
      if (rect.height > 0 && rect.width > 0) bottom = Math.max(bottom, rect.bottom);
    }
    var padding = parseFloat(window.getComputedStyle(body).paddingBottom) || 0;
    var height = Math.ceil(bottom - bodyTop + padding);
    if (height <= 0) {
      var range = document.createRange();
      range.selectNodeContents(body);
      height = Math.ceil(range.getBoundingClientRect().bottom - bodyTop + padding);
    }
    return Math.max(1, height);
  }
  function sendReady() {
    if (sent) return;
    sent = true;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'ticket-ready', height: realHeight() }));
  }
  var images = Array.prototype.slice.call(document.images || []);
  var imagesReady = images.map(function (img) {
    if (img.complete) return Promise.resolve();
    return new Promise(function (resolve) {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    });
  });
  var fontsReady = document.fonts && document.fonts.ready
    ? document.fonts.ready.catch(function () {}) : Promise.resolve();
  Promise.all(imagesReady).then(function () { return fontsReady; }).then(function () {
    requestAnimationFrame(function () { requestAnimationFrame(sendReady); });
  });
  setTimeout(sendReady, 1500);
  true;
})();
`;

export const ThermalHtmlRasterizer = forwardRef<ThermalHtmlRasterizerHandle, object>(
  function ThermalHtmlRasterizer(_props, ref) {
    const wrapperRef = useRef<View>(null);
    const pendingRef = useRef<PendingCapture | null>(null);
    const counterRef = useRef(0);
    const [html, setHtml] = useState("");
    const [renderHeight, setRenderHeight] = useState(INITIAL_RENDER_HEIGHT);
    const [webViewKey, setWebViewKey] = useState(0);

    const rejectPending = useCallback((error: unknown) => {
      const pending = pendingRef.current;
      if (!pending) return;
      clearTimeout(pending.timeout);
      pendingRef.current = null;
      pending.reject(error);
    }, []);

    const captureCurrentView = useCallback(async (cssHeight: number, requestId: number) => {
      const current = pendingRef.current;
      if (!current || current.requestId !== requestId) return;
      try {
        // Esperar a que React aplique el alto ajustado del WebView.
        await new Promise<void>((resolve) => setTimeout(resolve, 260));
        if (pendingRef.current?.requestId !== requestId) return;
        const wrapper = wrapperRef.current;
        if (!wrapper) throw new Error("No se pudo acceder al documento para imprimir.");
        const height = Math.max(1, Math.ceil(cssHeight * RECEIPT_58_DOTS / HTML_RENDER_WIDTH));
        const base64 = await captureRef(wrapper, {
          format: "png", quality: 1, result: "base64",
          width: RECEIPT_58_DOTS, height,
        });
        const pending = pendingRef.current;
        if (!pending || pending.requestId !== requestId) return;
        clearTimeout(pending.timeout);
        pendingRef.current = null;
        pending.resolve({ base64, width: RECEIPT_58_DOTS, height, threshold: DEFAULT_THRESHOLD });
      } catch (error) {
        if (pendingRef.current?.requestId === requestId) rejectPending(error);
      }
    }, [rejectPending]);

    const handleMessage = useCallback((event: WebViewMessageEvent) => {
      const pending = pendingRef.current;
      if (!pending) return;
      try {
        const message = JSON.parse(event.nativeEvent.data);
        if (message?.type !== "ticket-ready") return;
        const measured = Number(message.height);
        if (!Number.isFinite(measured) || measured <= 0) {
          throw new Error("El ticket no tiene contenido imprimible.");
        }
        // 3px de seguridad para no cortar la ultima linea.
        const safeHeight = Math.max(40, Math.min(MAX_RENDER_HEIGHT, Math.ceil(measured) + 3));
        setRenderHeight(safeHeight);
        void captureCurrentView(safeHeight, pending.requestId);
      } catch (error) {
        rejectPending(error);
      }
    }, [captureCurrentView, rejectPending]);

    useImperativeHandle(ref, () => ({
      captureHtml(sourceHtml: string) {
        if (Platform.OS === "web") {
          return Promise.reject(new Error("La rasterizacion termica solo se utiliza en Android/iOS."));
        }
        if (!sourceHtml.trim()) {
          return Promise.reject(new Error("El HTML del ticket esta vacio."));
        }
        if (pendingRef.current) {
          rejectPending(new Error("La impresion anterior fue reemplazada por una nueva."));
        }
        const requestId = ++counterRef.current;
        const promise = new Promise<PrinterRasterImage>((resolve, reject) => {
          const timeout = setTimeout(() => {
            if (pendingRef.current?.requestId === requestId) {
              pendingRef.current = null;
              reject(new Error("El ticket tardo demasiado en renderizarse."));
            }
          }, READY_TIMEOUT_MS);
          pendingRef.current = { requestId, resolve, reject, timeout };
        });
        setRenderHeight(INITIAL_RENDER_HEIGHT);
        setHtml(prepareHtmlForRaster(sourceHtml));
        setWebViewKey(requestId);
        return promise;
      },
    }), [rejectPending]);

    if (Platform.OS === "web") return null;
    return (
      <View pointerEvents="none" style={styles.hiddenHost}>
        <View ref={wrapperRef} collapsable={false} style={[styles.capture, { height: renderHeight }]}>
          {html ? (
            <WebView
              key={webViewKey}
              originWhitelist={["*"]}
              source={{ html }}
              javaScriptEnabled
              domStorageEnabled={false}
              scrollEnabled={false}
              bounces={false}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
              automaticallyAdjustContentInsets={false}
              androidLayerType="software"
              injectedJavaScript={injectedReadyScript}
              onMessage={handleMessage}
              onError={(event) => rejectPending(new Error(
                event.nativeEvent.description || "No se pudo renderizar el ticket HTML.",
              ))}
              style={[styles.webview, { height: renderHeight }]}
            />
          ) : null}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  hiddenHost: { position: "absolute", left: -1000, top: 0, width: HTML_RENDER_WIDTH, zIndex: -9999 },
  capture: { width: HTML_RENDER_WIDTH, backgroundColor: "#FFFFFF", overflow: "hidden" },
  webview: { width: HTML_RENDER_WIDTH, backgroundColor: "#FFFFFF" },
});
