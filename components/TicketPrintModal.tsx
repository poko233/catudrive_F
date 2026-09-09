import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ReceiptPrinter,
  ReceiptPrinterStage,
} from "./ReceiptPrinter";
import type { ReceiptFeedMotion } from "./ReceiptPrinter/ReceiptPrinter.types";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { haptics } from "@/animations/haptics";
import { useTheme } from "@/theme/useTheme";

/*
|--------------------------------------------------------------------------
| MODAL DE IMPRESIÓN GENÉRICO
|--------------------------------------------------------------------------
|
| Estandariza el flujo completo sin fijar el diseño:
|
| - El contenido del papel lo pasa el padre por children
|   (se renderiza dentro de ReceiptPrinter.Paper).
| - El padre también decide de dónde sale el HTML
|   (fetchHtml) y la salida real (onPrintHtml: ventana,
|   expo-print, bluetooth, red...).
| - El modal solo orquesta: processing (backend) →
|   printing (animación) → complete (salida real).
|
*/

export interface TicketPrintStatusLabels {
  processing?: string;
  printing?: string;
  complete?: string;
  error?: string;
}

interface TicketPrintModalProps {
  visible: boolean;
  onClose: () => void;

  /**
   * Cómo obtener el HTML imprimible (petición al backend).
   * Se llama al abrir; "Re imprimir" reutiliza el HTML
   * ya obtenido sin volver a pedir al backend.
   */
  fetchHtml: () => Promise<string>;

  /**
   * Salida real con el HTML listo. Devuelve los ms
   * que tomó (para reportar el tiempo real).
   */
  onPrintHtml: (html: string) => Promise<number>;

  /**
   * Se llama al completar (el modal NO se cierra solo).
   */
  onComplete?: (elapsedMs: number) => void;

  /**
   * Se llama si falla la obtención o la salida.
   * El modal además muestra el error dentro.
   */
  onError?: (error: unknown) => void;

  /**
   * Cambia la secuencia cuando cambia (ej. otra venta).
   */
  resetKey?: string | number;

  /**
   * Contenido libre del papel (diseño de cada módulo).
   */
  children: React.ReactNode;

  /*
  |--------------------------------------------------------------------------
  | PANTALLA DE LA IMPRESORA (OPCIONAL)
  |--------------------------------------------------------------------------
  */

  brandInitial?: string;
  headerTitle?: string;
  screenTitle?: string;
  screenSubtitle?: string;
  screenTotalLabel?: string;
  screenTotalValue?: string;
  statusLabels?: TicketPrintStatusLabels;

  /*
  |--------------------------------------------------------------------------
  | VISUAL DEL COMPONENTE IMPRESORA
  |--------------------------------------------------------------------------
  */

  printingDuration?: number;
  feedMotion?: ReceiptFeedMotion;
  maxWidth?: number;
  outputHeight?: number;

  /*
  |--------------------------------------------------------------------------
  | CROMO DEL MODAL
  |--------------------------------------------------------------------------
  */

  title?: string;
  fullscreen?: boolean;
  reprintLabel?: string;
}

type Fase = "procesando" | "imprimiendo" | "completado" | "error";

const STATUS_POR_DEFECTO: Required<TicketPrintStatusLabels> = {
  processing: "Obteniendo documento…",
  printing: "Imprimiendo…",
  complete: "¡Listo!",
  error: "No se pudo imprimir",
};

function faseAStage(fase: Fase): ReceiptPrinterStage {
  switch (fase) {
    case "imprimiendo":
      return "printing";
    case "completado":
      return "complete";
    case "procesando":
    case "error":
    default:
      return "processing";
  }
}

export function TicketPrintModal({
  visible,
  onClose,
  fetchHtml,
  onPrintHtml,
  onComplete,
  onError,
  resetKey = 0,
  children,
  brandInitial = "C",
  headerTitle = "Ticket",
  screenTitle,
  screenSubtitle,
  screenTotalLabel = "Total",
  screenTotalValue,
  statusLabels,
  printingDuration = 2000,
  feedMotion = "stepped",
  maxWidth = 390,
  outputHeight = 520,
  title,
  fullscreen = true,
  reprintLabel = "Re imprimir",
}: TicketPrintModalProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width: anchoVentana, height: altoVentana } = useWindowDimensions();

  const [fase, setFase] = useState<Fase>("procesando");
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [repeticion, setRepeticion] = useState(0);

  const textos = { ...STATUS_POR_DEFECTO, ...statusLabels };

  /*
  |--------------------------------------------------------------------------
  | CALLBACKS EN REF
  |--------------------------------------------------------------------------
  |
  | Evita que la secuencia se reinicie si el padre
  | re-renderiza con funciones nuevas a mitad del flujo.
  |
  */

  const callbacks = useRef({ fetchHtml, onPrintHtml, onComplete, onError });
  callbacks.current = { fetchHtml, onPrintHtml, onComplete, onError };

  /*
  |--------------------------------------------------------------------------
  | HTML CACHEADO
  |--------------------------------------------------------------------------
  |
  | "Re imprimir" NO vuelve al backend: reutiliza el HTML ya
  | obtenido, solo repite la animación y la salida real.
  |
  */

  const htmlCache = useRef<string | null>(null);
  const esReimpresion = useRef(false);

  /*
  |--------------------------------------------------------------------------
  | SECUENCIA: BACKEND → VISUAL → SALIDA REAL (SIN AUTOCIERRE)
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!visible) return;

    // Solo la apertura pide al backend; "Re imprimir"
    // reutiliza el HTML cacheado (si aún no hay, pide igual).
    const reutilizar =
      esReimpresion.current && htmlCache.current !== null;
    esReimpresion.current = false;

    let cancelado = false;
    const temporizadores: ReturnType<typeof setTimeout>[] = [];

    const esperar = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        temporizadores.push(timer);
      });

    const animarYSalir = async (html: string) => {
      setFase("imprimiendo");
      await esperar(printingDuration);
      if (cancelado) return;

      const elapsedMs = await callbacks.current.onPrintHtml(html);
      if (cancelado) return;

      setFase("completado");
      haptics.success();
      callbacks.current.onComplete?.(elapsedMs);
    };

    const correr = async () => {
      setFase("procesando");
      setMensajeError(null);

      try {
        if (reutilizar) {
          await animarYSalir(htmlCache.current as string);
          return;
        }

        const html = await callbacks.current.fetchHtml();
        if (cancelado) return;

        htmlCache.current = html;
        await animarYSalir(html);
      } catch (err: any) {
        if (cancelado) return;
        setFase("error");
        setMensajeError(err?.message || textos.error);
        haptics.error();
        callbacks.current.onError?.(err);
      }
    };

    void correr();

    return () => {
      cancelado = true;
      temporizadores.forEach(clearTimeout);
    };
    // Intencional: la secuencia solo se reinicia al abrir,
    // cambiar resetKey o pulsar Re imprimir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, resetKey, repeticion, printingDuration]);

  const reimprimiendo = fase === "procesando" || fase === "imprimiendo";

  const textoEstado =
    fase === "procesando"
      ? textos.processing
      : fase === "imprimiendo"
        ? textos.printing
        : fase === "completado"
          ? textos.complete
          : mensajeError ?? textos.error;

  const mostrarPantalla =
    screenTitle !== undefined ||
    screenSubtitle !== undefined ||
    screenTotalValue !== undefined;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      maxWidth={fullscreen ? anchoVentana : undefined}
      maxHeight={fullscreen ? altoVentana : undefined}
      contentPadding={fullscreen ? 0 : undefined}
      footer={
        <View style={styles.footer}>
          <Button
            title={reprintLabel}
            loading={reimprimiendo}
            disabled={reimprimiendo}
            onPress={() => {
              esReimpresion.current = true;
              setRepeticion((actual) => actual + 1);
            }}
          />
        </View>
      }
    >
      <View
        style={[
          styles.impresoraFondo,
          {
            backgroundColor: c.background,
            borderColor: c.border,
          },
        ]}
      >
        <ReceiptPrinter.Root
          stage={faseAStage(fase)}
          feedMotion={feedMotion}
          printingDuration={printingDuration}
          maxWidth={maxWidth}
          outputHeight={outputHeight}
        >
          <ReceiptPrinter.Machine>
            <ReceiptPrinter.Header>
              <View style={[styles.marca, { backgroundColor: c.primary }]}>
                <Text
                  style={[styles.marcaTexto, { color: c.primaryForeground }]}
                >
                  {brandInitial}
                </Text>
              </View>
              <Text style={styles.pantallaClaro}>{headerTitle}</Text>
            </ReceiptPrinter.Header>

            <ReceiptPrinter.Screen>
              {mostrarPantalla ? (
                <View style={styles.pantallaFila}>
                  <View style={styles.pantallaInfo}>
                    {screenTitle !== undefined ? (
                      <Text style={styles.pantallaTitulo}>{screenTitle}</Text>
                    ) : null}
                    {screenSubtitle !== undefined ? (
                      <Text style={styles.pantallaSubtitulo}>
                        {screenSubtitle}
                      </Text>
                    ) : null}
                  </View>
                  {screenTotalValue !== undefined ? (
                    <View style={styles.pantallaTotal}>
                      <Text style={styles.pantallaSubtitulo}>
                        {screenTotalLabel}
                      </Text>
                      <Text style={styles.pantallaTitulo}>
                        {screenTotalValue}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              <ReceiptPrinter.Status>{textoEstado}</ReceiptPrinter.Status>
            </ReceiptPrinter.Screen>
          </ReceiptPrinter.Machine>

          <ReceiptPrinter.Output>
            <ReceiptPrinter.Paper>{children}</ReceiptPrinter.Paper>
          </ReceiptPrinter.Output>
        </ReceiptPrinter.Root>
      </View>

      {fase === "error" && mensajeError ? (
        <Text style={[styles.error, { color: c.destructive }]}>
          {mensajeError}
        </Text>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  /*
  |--------------------------------------------------------------------------
  | FONDO DE CONTRASTE
  |--------------------------------------------------------------------------
  |
  | El papel es blanco: sin este fondo se funde con el modal
  | en tema claro. background + borde del tema lo separan
  | en los 3 temas sin tocar el componente impresora.
  |
  */
  impresoraFondo: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  marca: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  marcaTexto: {
    fontSize: 15,
    fontWeight: "900",
  },
  pantallaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  pantallaInfo: {
    flex: 1,
    gap: 2,
  },
  pantallaTotal: {
    alignItems: "flex-end",
    gap: 2,
  },
  /*
  |--------------------------------------------------------------------------
  | PANTALLA LCD (TINTA CLARA SOBRE FONDO OSCURO FIJO)
  |--------------------------------------------------------------------------
  |
  | Excepción justificada a theme.colors: la pantalla de la
  | impresora es siempre oscura (fija del componente),
  | así que su texto debe ser siempre claro para leerse
  | en los 3 temas.
  |
  */
  pantallaClaro: {
    color: "#F7F7F7",
    fontSize: 13,
    fontWeight: "700",
  },
  pantallaTitulo: {
    color: "#F7F7F7",
    fontSize: 14,
    fontWeight: "800",
  },
  pantallaSubtitulo: {
    color: "#A9A9A9",
    fontSize: 12,
  },
  error: {
    fontSize: 13,
    textAlign: "center",
  },
});
