import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import Toast from "react-native-toast-message";
import { ThemedText } from "@/components/ThemedText";
import { Modal } from "@/components/ui/Modal";
import { ReportPrintModal } from "@/components/ReportPrintModal";
import { ModalVistaPreviaReimpresion } from "@/screens/user/pasajes/components/ModalVistaPreviaReimpresion";
import type { PrinterDevice } from "@/services/printer";

interface Props {
  visible: boolean;
  title: string;
  html: string;
  loading?: boolean;
  onClose: () => void;
  onPrintHtml: (html: string, printer?: PrinterDevice) => Promise<number>;
  onConfigurar: () => void;
}

/** Vista previa oficial de Pasajes seguida de la misma animación de impresión usada por Arqueo. */
export function EncomiendaPrintPreviewModal({
  visible, title, html, loading = false, onClose, onPrintHtml, onConfigurar,
}: Props) {
  const [seleccionada, setSeleccionada] = useState<PrinterDevice | null>(null);
  const [secuencia, setSecuencia] = useState(0);
  const impresoraRef = useRef<PrinterDevice | null>(null);
  const htmlRef = useRef("");
  const imprimirRef = useRef(onPrintHtml);
  imprimirRef.current = onPrintHtml;

  useEffect(() => {
    if (!visible) {
      setSeleccionada(null);
      impresoraRef.current = null;
      htmlRef.current = "";
    }
  }, [visible]);

  const confirmar = useCallback((impresora: PrinterDevice) => {
    if (!html || loading) return;
    impresoraRef.current = impresora;
    htmlRef.current = html;
    setSecuencia(n => n + 1);
    setSeleccionada(impresora);
  }, [html, loading]);

  const imprimir = useCallback(async (_html: string): Promise<number> => {
    if (!impresoraRef.current || !htmlRef.current) {
      throw new Error("Selecciona una impresora antes de imprimir.");
    }
    return imprimirRef.current(htmlRef.current, impresoraRef.current);
  }, []);

  const cerrar = useCallback(() => {
    setSeleccionada(null);
    impresoraRef.current = null;
    htmlRef.current = "";
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <>
      {loading ? (
        <Modal visible title={title} onClose={cerrar}>
          <View style={{ padding: 24 }}>
            <ThemedText>Preparando comprobante de 58 mm…</ThemedText>
          </View>
        </Modal>
      ) : null}
      {!loading && !!html && !seleccionada ? (
        <ModalVistaPreviaReimpresion
          visible
          html={html}
          titulo={title}
          subtitulo="Ticket térmico de 58 mm"
          tipoDocumento="venta"
          onClose={cerrar}
          onConfirmar={confirmar}
          onConfigurar={onConfigurar}
        />
      ) : null}
      {seleccionada ? (
        <ReportPrintModal
          visible
          title={title}
          resetKey={secuencia}
          onClose={cerrar}
          fetchHtml={async () => htmlRef.current}
          onPrintHtml={imprimir}
          paperSize="receipt"
          printingDuration={1600}
          outputHeight={650}
          headerTitle="Encomienda"
          screenTitle="Ticket térmico 58 mm"
          screenSubtitle={title}
          statusLabels={{ processing: "Preparando ticket…", printing: "Imprimiendo ticket…", complete: "Ticket enviado a impresión" }}
          onComplete={() => Toast.show({ type: "success", text1: "Ticket enviado a impresión" })}
          onError={error => Toast.show({ type: "error", text1: "No se pudo imprimir", text2: error instanceof Error ? error.message : "Revisa la impresora." })}
        >
          <View style={styles.ticket}>
            <Text style={styles.titulo}>ENCOMIENDA</Text>
            <Text style={styles.detalle}>{title}</Text>
            <Text style={styles.aviso}>Impresión térmica de 58 mm</Text>
          </View>
        </ReportPrintModal>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  ticket: { alignItems: "center", gap: 10, padding: 12 },
  titulo: { fontWeight: "900", fontSize: 15, textAlign: "center" },
  detalle: { fontSize: 12, textAlign: "center" },
  aviso: { fontSize: 10, textAlign: "center" },
});
