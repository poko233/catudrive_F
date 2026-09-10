import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import { Image, StyleSheet, View } from "react-native";
import { Encomienda, EncomiendaQr } from "../types/encomienda.types";

interface Props {
  visible: boolean;
  encomienda: Encomienda | null;
  qr: EncomiendaQr | null;
  loading: boolean;
  printing: boolean;
  onClose: () => void;
  onPrint: () => void;
}

export function EncomiendaQrModal({ visible, encomienda, qr, loading, printing, onClose, onPrint }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Modal
      visible={visible}
      title="QR de encomienda"
      onClose={onClose}
      maxWidth={480}
      footer={
        <View style={styles.footer}>
          <Button title="Cerrar" variant="secondary" onPress={onClose} />
          <Button title="Imprimir etiqueta" loading={printing} disabled={loading || !qr} onPress={onPrint} />
        </View>
      }
    >
      <View style={styles.content}>
        <ThemedText style={styles.guia}>{encomienda?.guia ?? "—"}</ThemedText>
        <ThemedText style={[styles.ruta, { color: c.textSecondary }]}>
          {encomienda ? `${encomienda.origen} → ${encomienda.destino}` : ""}
        </ThemedText>

        {loading ? (
          <ThemedText style={[styles.message, { color: c.textSecondary }]}>Generando código QR…</ThemedText>
        ) : qr ? (
          <>
            <View style={[styles.qrBox, { borderColor: c.border }]}>
              <Image source={{ uri: qr.imagen }} style={styles.qrImage} resizeMode="contain" />
            </View>
            <ThemedText style={[styles.message, { color: c.textSecondary }]}>
              Imprime esta etiqueta y pégala a la encomienda para identificarla en destino.
            </ThemedText>
          </>
        ) : (
          <ThemedText style={[styles.message, { color: c.textSecondary }]}>No se pudo cargar el código QR.</ThemedText>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center", gap: 8, paddingVertical: 8 },
  guia: { fontSize: 20, fontWeight: "800" },
  ruta: { fontSize: 14, fontWeight: "600", textAlign: "center" },
  qrBox: { marginTop: 8, width: 270, height: 270, padding: 10, borderWidth: 1, borderRadius: 16, backgroundColor: "#FFFFFF" },
  qrImage: { width: "100%", height: "100%" },
  message: { marginTop: 6, fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 360 },
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" },
});
