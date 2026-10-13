// screens/user/pasajes/components/FlujoTicketVistaPrevia.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";
import { Modal } from "@/components/ui/Modal";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import {
  PrinterConnectionProvider,
  PrinterSetupModal,
  usePrinterConnection,
} from "@/components/PrinterConnection";
import type { PrinterDevice } from "@/services/printer";
import {
  ThermalHtmlRasterizer,
  type ThermalHtmlRasterizerHandle,
} from "./ThermalHtmlRasterizer";
import { ModalVistaPreviaReimpresion } from "./ModalVistaPreviaReimpresion";

/*
|--------------------------------------------------------------------------
| FLUJO ÚNICO DE IMPRESIÓN DE TICKETS (58 mm)
|--------------------------------------------------------------------------
|
| Misma lógica que ViajePasajerosAction (referencia):
|
| impresora (icono) → carga HTML oficial → vista previa +
| selección de impresora → "Continuar a impresión" →
| modal animado (TicketPrintModal / ReportPrintModal).
|
| NO imprime reportes: solo tickets y comprobantes de caja.
| Requiere estar bajo PrinterConnectionProvider.
|
*/

export interface DocImprimible<E = unknown> {
  /** HTML oficial ya renderizado por el backend. */
  html: string;
  titulo: string;
  subtitulo?: string;
  extra?: E;
}

interface ApiAnimado<E> {
  doc: DocImprimible<E>;
  /** Imprime con la impresora confirmada en la vista previa. */
  imprimir: (html: string) => Promise<number>;
  cerrar: () => void;
}

interface Props<E> {
  visible: boolean;
  /** Una sola carga del HTML oficial (ticket-html / comprobante). */
  cargar: () => Promise<DocImprimible<E>>;
  /** Modal animado existente (recibe el doc + imprimir + cerrar). */
  renderAnimado: (api: ApiAnimado<E>) => React.ReactNode;
  onClose: () => void;
}

const REQUISITO = { type: "receipt", paperSize: "receipt-58" } as const;

export function FlujoTicketVistaPrevia<E>(props: Props<E>) {
  if (!props.visible) return null;

  return (
    <PrinterConnectionProvider autoConnect detectSunmiOnStart>
      <FlujoTicketVistaPreviaContenido {...props} />
    </PrinterConnectionProvider>
  );
}

function FlujoTicketVistaPreviaContenido<E>({
  visible,
  cargar,
  renderAnimado,
  onClose,
}: Props<E>) {
  const { theme } = useTheme();
  const c = theme.colors;

  const { print: printConfigurada } = usePrinterConnection();

  const solicitudRef = useRef(0);
  const impresoraRef = useRef<PrinterDevice | null>(null);
  const htmlRef = useRef<string | null>(null);
  const ventanaRef = useRef<Window | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rasterRef = useRef<ThermalHtmlRasterizerHandle | null>(null);

  const [cargando, setCargando] = useState(false);
  const [doc, setDoc] = useState<DocImprimible<E> | null>(null);
  const [confirmado, setConfirmado] = useState<DocImprimible<E> | null>(null);
  const [setupVisible, setSetupVisible] = useState(false);

  const cerrarTodo = useCallback(() => {
    ++solicitudRef.current;
    setCargando(false);
    setDoc(null);
    setConfirmado(null);
    setSetupVisible(false);
    impresoraRef.current = null;
    htmlRef.current = null;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose]);

  useEffect(() => {
    if (!visible) return;
    const solicitud = ++solicitudRef.current;
    setCargando(true);
    setDoc(null);
    setConfirmado(null);

    cargar()
      .then((documento) => {
        if (solicitud !== solicitudRef.current) return;
        if (!documento.html.trim()) {
          throw new Error("El documento está vacío.");
        }
        setDoc(documento);
      })
      .catch((err) => {
        if (solicitud !== solicitudRef.current) return;
        Toast.show({
          type: "error",
          text1: "No se pudo preparar la impresión",
          text2: err instanceof Error ? err.message : "Intenta nuevamente.",
        });
        cerrarTodo();
      })
      .finally(() => {
        if (solicitud === solicitudRef.current) setCargando(false);
      });

    return () => {
      ++solicitudRef.current;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  /** El usuario confirma vista previa + impresora antes del modal animado. */
  const confirmar = useCallback(
    (dispositivo: PrinterDevice) => {
      if (!doc) return;
      impresoraRef.current = dispositivo;
      htmlRef.current = doc.html;
      // Los navegadores suelen bloquear window.open() desde efectos
      // asíncronos. Se reserva la ventana en el clic del usuario.
      if (Platform.OS === "web" && typeof window !== "undefined") {
        ventanaRef.current = window.open("about:blank", "_blank", "width=420,height=640");
        if (ventanaRef.current) {
          ventanaRef.current.document.title = "Preparando impresión";
          ventanaRef.current.document.body.textContent = "Preparando documento para imprimir...";
        }
      }
      const documento = doc;
      setDoc(null);
      // Android necesita terminar de ocultar un RN Modal antes de abrir otro.
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(
        () => {
          timerRef.current = null;
          setConfirmado(documento);
        },
        Platform.OS === "web" ? 0 : 240,
      );
    },
    [doc],
  );

  /** Mismo flujo térmico que PasajesScreen: HTML -> raster -> impresora. */
  const imprimir = useCallback(
    async (html: string): Promise<number> => {
      const inicio = Date.now();
      // Usar exactamente el documento revisado en la vista previa.
      const htmlFinal = htmlRef.current ?? html;
      const impresora = impresoraRef.current;

      try {
        if (Platform.OS === "web") {
          const blob = new Blob([htmlFinal], { type: "text/html" });
          const url = URL.createObjectURL(blob);
          const reservada = ventanaRef.current;
          const ventana =
            reservada && !reservada.closed
              ? reservada
              : window.open(url, "_blank", "width=420,height=640");
          if (!ventana) {
            URL.revokeObjectURL(url);
            throw new Error("El navegador bloqueó la pestaña de impresión. Habilita las ventanas emergentes.");
          }
          if (ventana === reservada) ventana.location.href = url;
          ventanaRef.current = null;
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
          return Date.now() - inicio;
        }

        // La impresión del sistema acepta HTML directo. SUNMI,
        // Bluetooth y Wi-Fi térmicas necesitan raster ESC/POS.
        let rasterImage;
        if (impresora?.connectionType !== "system") {
          const rasterizador = rasterRef.current;
          if (!rasterizador) {
            throw new Error("El renderizador térmico todavía no está disponible.");
          }
          rasterImage = await rasterizador.captureHtml(htmlFinal);
        }
        await printConfigurada(
          {
            type: "receipt",
            paperSize: "receipt-58",
            html: htmlFinal,
            rasterImage,
            copies: 1,
            cutPaper: true,
            sunmi: { feedLines: 4, imageMode: "binary" },
          },
          impresora ?? undefined,
        );
      } catch (err) {
        if (Platform.OS !== "web") setSetupVisible(true);
        Toast.show({
          type: "error",
          text1: "No se pudo imprimir",
          text2: err instanceof Error ? err.message : "Revisa la impresora e inténtalo de nuevo.",
        });
        throw err;
      }

      return Date.now() - inicio;
    },
    [printConfigurada],
  );

  return (
    <>
      {/* Paso 0: cargando el HTML oficial */}
      <Modal visible={visible && cargando} onClose={() => {}} title="Preparando impresión">
        <View style={styles.cargando}>
          <ActivityIndicator color={c.primary} />
          <ThemedText style={[styles.cargandoTexto, { color: c.textSecondary }]}>
            Obteniendo el documento del servidor…
          </ThemedText>
        </View>
      </Modal>

      {/* Paso 1: vista previa + selección de impresora */}
      {doc ? (
        <ModalVistaPreviaReimpresion
          visible
          html={doc.html}
          titulo={doc.titulo}
          subtitulo={doc.subtitulo}
          onClose={cerrarTodo}
          onConfirmar={confirmar}
          onConfigurar={() => setSetupVisible(true)}
        />
      ) : null}

      {/* Solo se monta mientras se imprime: evita WebViews sueltas. */}
      {confirmado && Platform.OS !== "web" ? (
        <ThermalHtmlRasterizer ref={rasterRef} />
      ) : null}

      {/* Paso 2: modal animado existente con el documento confirmado */}
      {confirmado
        ? renderAnimado({
            doc: confirmado,
            imprimir,
            cerrar: cerrarTodo,
          })
        : null}

      <PrinterSetupModal
        visible={setupVisible}
        requirement={REQUISITO}
        required={false}
        onClose={() => setSetupVisible(false)}
        onConfigured={() => setSetupVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cargando: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 10,
  },
  cargandoTexto: {
    fontSize: 13,
  },
});

export default FlujoTicketVistaPrevia;
