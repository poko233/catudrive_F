import { ThemedText } from "@/components/ThemedText";
import { Printer } from "@/components/Printer";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

interface Props {
  visible: boolean;
  title: string;
  html: string;
  loading?: boolean;
  onClose: () => void;
}

export function EncomiendaPrintPreviewModal({ visible, title, html, loading = false, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const iframeRef = useRef<any>(null);
  const [animandoEntrada, setAnimandoEntrada] = useState(false);
  const esComprobante = html.includes("DETALLE DE ENCOMIENDA");
  const paperWidth = 302;
  const paperHeight = esComprobante ? 434 : 348;

  useEffect(() => {
    if (!visible || loading || !html) {
      setAnimandoEntrada(false);
      return;
    }

    setAnimandoEntrada(true);
    const timer = setTimeout(() => setAnimandoEntrada(false), 1750);
    return () => clearTimeout(timer);
  }, [visible, loading, html]);

  const imprimir = useCallback(() => {
    if (Platform.OS !== "web" || loading || !html) return;

    const iframe = iframeRef.current;
    const printWindow = iframe?.contentWindow;

    if (!printWindow) {
      Toast.show({ type: "error", text1: "No se pudo imprimir", text2: "No se pudo acceder a la vista previa de impresión." });
      return;
    }

    try {
      printWindow.focus();
      printWindow.print();
    } catch (error: any) {
      Toast.show({ type: "error", text1: "No se pudo imprimir", text2: error?.message || "Intenta nuevamente." });
    }
  }, [html, loading]);

  const ticketFrame = Platform.OS === "web" && html
    ? React.createElement("iframe" as any, {
        ref: iframeRef,
        srcDoc: html,
        title,
        style: {
          width: "100%",
          height: "100%",
          border: "0",
          backgroundColor: "#FFFFFF",
          display: "block",
        },
      })
    : null;

  return (
    <Modal
      visible={visible}
      title={title}
      onClose={onClose}
      maxWidth={900}
      scrollable={false}
      footer={
        <View style={styles.footer}>
          <Button title="Cerrar" variant="secondary" onPress={onClose} disabled={loading} />
          <Button title="Imprimir" onPress={imprimir} disabled={loading || !html} loading={loading} />
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Vista previa de impresión</ThemedText>
          <ThemedText style={[styles.description, { color: c.textSecondary }]}>Verifica la etiqueta antes de enviarla a la impresora.</ThemedText>
        </View>

        <View style={[styles.animationContainer, { backgroundColor: c.background, borderColor: c.border }]}>
          <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewScrollContent} showsVerticalScrollIndicator={true}>
          <Printer.Root stage={animandoEntrada ? "printing" : "done"} paperSize="custom" customPaper={{ aspectRatio: paperWidth / paperHeight, minHeight: paperHeight, serrated: true }} printingDuration={1650} machineMaxWidth={520} paperWidth={paperWidth} outputHeight={paperHeight + 150}>
            <Printer.Machine>
              <Printer.Header>
                <View style={[styles.brand, { backgroundColor: c.primary }]}>
                  <ThemedText style={[styles.brandText, { color: c.primaryForeground }]}>C</ThemedText>
                </View>
                <ThemedText style={styles.machineTitle}>Etiqueta QR de encomienda</ThemedText>
              </Printer.Header>
              <Printer.Screen>
                <Printer.Status>{animandoEntrada ? "Imprimiendo vista previa…" : "Etiqueta lista para imprimir"}</Printer.Status>
              </Printer.Screen>
            </Printer.Machine>
            <Printer.Output>
              <Printer.Paper>
                <View style={[styles.ticketPreview, { width: paperWidth, height: paperHeight }]}>{ticketFrame}</View>
              </Printer.Paper>
            </Printer.Output>
          </Printer.Root>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 14 },
  header: { gap: 4 },
  title: { fontSize: 16, fontWeight: "800" },
  description: { fontSize: 13, lineHeight: 18 },
  animationContainer: { width: "100%", height: 650, borderWidth: 1, borderRadius: 14, overflow: "hidden" },
  previewScroll: { width: "100%", height: "100%" },
  previewScrollContent: { minHeight: 650, paddingHorizontal: 18, paddingTop: 22, paddingBottom: 34, alignItems: "center", justifyContent: "flex-start" },
  brand: { width: 34, height: 34, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  brandText: { fontSize: 18, fontWeight: "900" },
  machineTitle: { fontSize: 13, fontWeight: "800" },
  ticketPreview: { alignSelf: "center", backgroundColor: "#FFFFFF", overflow: "hidden" },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" },
});
