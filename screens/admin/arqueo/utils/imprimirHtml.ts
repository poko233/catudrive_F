// screens/admin/arqueo/utils/imprimirHtml.ts

import { Platform } from "react-native";
import * as Print from "expo-print";

/*
|--------------------------------------------------------------------------
| SALIDA REAL DE IMPRESIÓN (patrón imprimirHtmlReal de pasajes)
|--------------------------------------------------------------------------
|
| Se llama cuando el HTML del backend YA llegó (el modal
| esperó en loading). Flujo:
|
| Web: el HTML viaja como documento real (blob:) a una
| VENTANA NUEVA y el diálogo print() es de esa ventana,
| no de la actual.
|
| Nativo: diálogo de impresión del sistema (expo-print).
| Devuelve los ms que tomó (lo pide ReportPrintModal).
|
*/

export async function imprimirComprobanteHtml(html: string): Promise<number> {
  const inicio = Date.now();

  if (Platform.OS === "web") {
    await imprimirEnVentanaNueva(html);
  } else {
    await Print.printAsync({ html });
  }

  return Date.now() - inicio;
}

async function imprimirEnVentanaNueva(html: string): Promise<void> {
  const scope = globalThis as any;

  if (!scope?.document) {
    throw new Error("No se pudo abrir el diálogo de impresión.");
  }

  let url: string | null = null;

  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    url = URL.createObjectURL(blob);
  } catch {
    url = null;
  }

  if (!url) {
    throw new Error("No se pudo preparar el comprobante para impresión.");
  }

  const liberar = () => {
    try {
      if (url) URL.revokeObjectURL(url);
    } catch {
      // noop
    }
    url = null;
  };

  // Ventana nueva (popup con tamaño), no pestaña.
  const ventana = window.open(url, "_blank", "width=900,height=700");

  if (!ventana) {
    liberar();
    throw new Error("El navegador bloqueó la ventana. Permite ventanas emergentes e inténtalo de nuevo.");
  }

  try {
    await esperarDocumentoListo(ventana, 6000);
  } catch {
    // Timeout: se intenta imprimir lo que haya cargado.
  }

  await new Promise<void>((resolve) => setTimeout(resolve, 400));

  if (ventana.closed) {
    liberar();
    throw new Error("La ventana de impresión fue cerrada antes de imprimir.");
  }

  // La ventana queda abierta a propósito: el diálogo de impresión
  // es independiente y el usuario puede reimprimir con Ctrl/Cmd+P.
  // Solo se libera la URL del blob.
  setTimeout(liberar, 120000);
  ventana.onafterprint = () => liberar();

  try {
    ventana.focus();
    ventana.print();
  } catch (error) {
    ventana.onafterprint = null;
    throw error;
  }
}

function esperarDocumentoListo(ventana: Window, timeoutMs: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const inicio = Date.now();

    const verificar = () => {
      try {
        if (ventana.closed) {
          reject(new Error("La ventana fue cerrada."));
          return;
        }
        if (ventana.document?.readyState === "complete") {
          resolve();
          return;
        }
      } catch {
        // Acceso denegado temporal: se reintenta hasta el timeout.
      }
      if (Date.now() - inicio > timeoutMs) {
        reject(new Error("Tiempo de espera agotado."));
        return;
      }
      setTimeout(verificar, 100);
    };

    verificar();
  });
}
