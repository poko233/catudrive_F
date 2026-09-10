import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import React, { useCallback, useRef } from "react";
import { Platform, StyleSheet, View } from "react-native";
import Toast from "react-native-toast-message";

interface Props {
  visible: boolean;
  title: string;
  html: string;
  onClose: () => void;
}

export function EncomiendaPrintPreviewModal({ visible, title, html, onClose }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const iframeRef = useRef<any>(null);

  const imprimir = useCallback(() => {
    if (Platform.OS !== "web") return;

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
  }, []);

  return (
    <Modal
      visible={visible}
      title={title}
      onClose={onClose}
      maxWidth={900}
      scrollable={false}
      footer={
        <View style={styles.footer}>
          <Button title="Cerrar" variant="secondary" onPress={onClose} />
          <Button title="Imprimir" onPress={imprimir} />
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Vista previa de impresión</ThemedText>
          <ThemedText style={[styles.description, { color: c.textSecondary }]}>Verifica el ticket antes de enviarlo a la impresora.</ThemedText>
        </View>

        <View style={[styles.previewContainer, { backgroundColor: c.background, borderColor: c.border }]}>
          {Platform.OS === "web"
            ? React.createElement("iframe" as any, {
                ref: iframeRef,
                srcDoc: html,
                title,
                style: {
                  width: "100%",
                  height: "100%",
                  border: "0",
                  backgroundColor: "#FFFFFF",
                },
              })
            : null}
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
  previewContainer: { width: "100%", height: 560, borderWidth: 1, borderRadius: 14, overflow: "hidden", padding: 10 },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" },
});
