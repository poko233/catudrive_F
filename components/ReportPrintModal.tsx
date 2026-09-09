import React, { useEffect, useRef, useState } from "react";
import {
  DimensionValue,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  Printer,
  PrinterStage,
} from "./Printer";
import type {
  PrinterCustomPaperConfig,
  PrinterFeedMotion,
  PrinterPaperSize,
} from "./Printer/Printer.types";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { haptics } from "@/animations/haptics";
import { useTheme } from "@/theme/useTheme";

/*
|--------------------------------------------------------------------------
| MODAL DE IMPRESIÓN GENÉRICO PARA REPORTES LARGOS
|--------------------------------------------------------------------------
|
| Hermano de TicketPrintModal pero sobre components/Printer
| (papeles carta/A4/personalizado para reportes extensos).
|
| Estandariza el flujo sin fijar el diseño:
|
| - El contenido de la hoja lo pasa el padre por children
|   (se renderiza dentro de Printer.Paper).
| - El padre también decide de dónde sale el HTML
|   (fetchHtml) y la salida real (onPrintHtml: ventana,
|   expo-print, bluetooth, red...).
| - El modal solo orquesta: processing (backend) →
|   printing (animación) → complete (salida real).
|
*/

export interface ReportPrintStatusLabels {
  processing?: string;
  printing?: string;
  complete?: string;
  error?: string;
}

interface ReportPrintModalProps {
  visible: boolean;
  onClose: () => void;

  /**
   * Cómo obtener el HTML imprimible (petición al backend).
   * Se llama al abrir y en cada "Re imprimir".
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
   * Cambia la secuencia cuando cambia (ej. otro reporte).
   */
  resetKey?: string | number;

  /**
   * Contenido libre de la hoja (diseño de cada módulo).
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
  statusLabels?: ReportPrintStatusLabels;

  /*
  |--------------------------------------------------------------------------
  | VISUAL DEL COMPONENTE IMPRESORA
  |--------------------------------------------------------------------------
  */

  paperSize?: PrinterPaperSize;
  customPaper?: PrinterCustomPaperConfig;
  printingDuration?: number;
  feedMotion?: PrinterFeedMotion;
  machineMaxWidth?: number;
  paperWidth?: DimensionValue;
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

const STATUS_POR_DEFECTO: Required<ReportPrintStatusLabels> = {
  processing: "Preparando documento…",
  printing: "Imprimiendo documento…",
  complete: "Documento impreso",
  error: "No se pudo imprimir",
};

function faseAStage(fase: Fase): PrinterStage {
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

export function ReportPrintModal({
  visible,
  onClose,
  fetchHtml,
  onPrintHtml,
  onComplete,
  onError,
  resetKey = 0,
  children,
  brandInitial = "C",
  headerTitle = "Reporte",
  screenTitle,
  screenSubtitle,
  screenTotalLabel = "Total",
  screenTotalValue,
  statusLabels,
  paperSize = "letter",
  customPaper,
  printingDuration,
  feedMotion = "smooth",
  machineMaxWidth,
  paperWidth,
  outputHeight,
  title,
  fullscreen = true,
  reprintLabel = "Re imprimir",
}: ReportPrintModalProps) {
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
  | SECUENCIA: BACKEND → VISUAL → SALIDA REAL (SIN AUTOCIERRE)
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!visible) return;

    let cancelado = false;
    const temporizadores: ReturnType<typeof setTimeout>[] = [];

    const esperar = (ms: number) =>
      new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, ms);
        temporizadores.push(timer);
      });

    const correr = async () => {
      setFase("procesando");
      setMensajeError(null);

      try {
        const html = await callbacks.current.fetchHtml();
        if (cancelado) return;

        setFase("imprimiendo");
        await esperar(
          printingDuration ?? (paperSize === "a4" ? 2700 : 2600),
        );
        if (cancelado) return;

        const elapsedMs = await callbacks.current.onPrintHtml(html);
        if (cancelado) return;

        setFase("completado");
        haptics.success();
        callbacks.current.onComplete?.(elapsedMs);
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
  }, [visible, resetKey, repeticion, printingDuration, paperSize]);

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
            onPress={() => setRepeticion((actual) => actual + 1)}
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
        <Printer.Root
          stage={faseAStage(fase)}
          paperSize={paperSize}
          customPaper={customPaper}
          feedMotion={feedMotion}
          printingDuration={printingDuration}
          machineMaxWidth={machineMaxWidth}
          paperWidth={paperWidth}
          outputHeight={outputHeight}
        >
          <Printer.Machine>
            <Printer.Header>
              <View style={[styles.marca, { backgroundColor: c.primary }]}>
                <Text
                  style={[styles.marcaTexto, { color: c.primaryForeground }]}
                >
                  {brandInitial}
                </Text>
              </View>
              <Text style={styles.pantallaClaro}>{headerTitle}</Text>
            </Printer.Header>

            <Printer.Screen>
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

              <Printer.Status>{textoEstado}</Printer.Status>
            </Printer.Screen>
          </Printer.Machine>

          <Printer.Output>
            <Printer.Paper>{children}</Printer.Paper>
          </Printer.Output>
        </Printer.Root>
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
  | La hoja es blanca: sin este fondo se funde con el modal
  | en tema claro. background + borde del tema la separan
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
