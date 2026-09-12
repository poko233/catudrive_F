import { ThemedText } from "@/components/ThemedText";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { Encomienda } from "../types/encomienda.types";

interface Props {
  visible: boolean;
  encomienda: Encomienda | null;
  loading: boolean;
  printing: boolean;
  onClose: () => void;
  onScan: (value: string) => Promise<void>;
  onReset: () => void;
  onPrint: () => void;
  onMarkArrival: (encomienda: Encomienda) => void;
}

export function EncomiendaQrScannerModal({ visible, encomienda, loading, printing, onClose, onScan, onReset, onPrint, onMarkArrival }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const compact = windowWidth < 720;
  const cameraHeight = useMemo(() => Math.max(270, Math.min(430, windowHeight - 330)), [windowHeight]);
  const modalMaxHeight = useMemo(() => Math.max(520, windowHeight - 40), [windowHeight]);

  useEffect(() => {
    if (visible) {
      setLocked(false);
      setCameraReady(false);
      setCameraError("");
    }
  }, [visible]);

  useEffect(() => {
    if (encomienda) {
      setLocked(true);
    }
  }, [encomienda]);

  const handleScan = async (result: BarcodeScanningResult) => {
    if (locked || loading || encomienda) return;
    setLocked(true);
    await onScan(result.data);
  };

  const retry = () => {
    setLocked(false);
    setCameraReady(false);
    setCameraError("");
    onReset();
  };

  const solicitarPermiso = async () => {
    setCameraError("");
    await requestPermission();
  };

  return (
    <Modal
      visible={visible}
      title={encomienda ? "Detalle de encomienda" : "Escanear QR de encomienda"}
      onClose={onClose}
      maxWidth={760}
      maxHeight={modalMaxHeight}
      scrollable
      contentPadding={compact ? 14 : 20}
      footer={
        <View style={[styles.footer, compact && styles.footerCompact]}>
          <Button title="Cerrar" variant="secondary" onPress={onClose} />
          {encomienda ? <Button title="Escanear otra" variant="secondary" onPress={retry} /> : null}
          {encomienda ? <Button title="Imprimir detalle" loading={printing} onPress={onPrint} /> : null}
          {encomienda?.estado === "EN_TRANSITO" ? <Button title="Marcar llegada" onPress={() => onMarkArrival(encomienda)} /> : null}
        </View>
      }
    >
      {encomienda ? (
        <View style={styles.detail}>
          <View style={[styles.detailHeader, compact && styles.detailHeaderCompact]}>
            <View style={styles.detailTitleWrap}>
              <ThemedText style={styles.detailOverline}>ENCOMIENDA ENCONTRADA</ThemedText>
              <ThemedText style={styles.guia}>{encomienda.guia ?? "—"}</ThemedText>
            </View>
            <Badge label={encomienda.estado.replace("_", " ")} variant={encomienda.estado === "ENTREGADA" ? "success" : "warning"} />
          </View>

          <View style={[styles.detailCard, compact && styles.detailCardCompact, { borderColor: c.border, backgroundColor: c.backgroundSecondary }]}>
            <Detail label="Ruta" value={`${encomienda.origen} → ${encomienda.destino}`} color={c.textSecondary} />
            <Detail label="Remitente" value={encomienda.remitente} color={c.textSecondary} />
            <Detail label="Destinatario" value={encomienda.destinatario} color={c.textSecondary} />
            <Detail label="Descripción" value={encomienda.descripcion || "—"} color={c.textSecondary} />
            <Detail label="Cantidad" value={String(encomienda.cantidad)} color={c.textSecondary} />
            <Detail label="Precio" value={`Bs. ${Number(encomienda.precio).toFixed(2)}`} color={c.textSecondary} />
            <Detail label="Viaje" value={encomienda.viaje ? `#${encomienda.viaje.id}` : "—"} color={c.textSecondary} />
            <Detail label="Vehículo" value={encomienda.viaje?.vehiculo?.placa || "—"} color={c.textSecondary} />
            <Detail label="Chofer" value={encomienda.viaje?.chofer?.nombre || "—"} color={c.textSecondary} />
          </View>

          <ThemedText style={[styles.detailHint, { color: c.textSecondary }]}>Verifica los datos antes de marcar la llegada. Desde aquí también puedes imprimir el comprobante de la encomienda.</ThemedText>
        </View>
      ) : !permission ? (
        <View style={styles.permission}>
          <ThemedText style={styles.message}>Consultando permiso de cámara…</ThemedText>
        </View>
      ) : !permission.granted ? (
        <View style={styles.permission}>
          <ThemedText style={styles.permissionTitle}>Permiso de cámara requerido</ThemedText>
          <ThemedText style={[styles.message, { color: c.textSecondary }]}>Permite el acceso a la cámara para leer el código QR pegado en la encomienda.</ThemedText>
          <Button title="Permitir cámara" onPress={() => void solicitarPermiso()} />
        </View>
      ) : (
        <View style={styles.scannerContent}>
          <View style={[styles.cameraViewport, { height: cameraHeight, borderColor: c.border }]}> 
            <CameraView
              style={StyleSheet.absoluteFill}
              active={visible && !encomienda}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={locked || loading ? undefined : handleScan}
              onCameraReady={() => { setCameraReady(true); setCameraError(""); }}
              onMountError={(error) => { setCameraReady(false); setCameraError(error.message || "No se pudo iniciar la cámara."); }}
            />

            <View style={styles.cameraShade} pointerEvents="none" />
            <View style={styles.frameContainer} pointerEvents="none">
              <View style={styles.frame} />
            </View>

            {!cameraReady && !cameraError ? (
              <View style={styles.cameraStatus} pointerEvents="none">
                <ThemedText style={styles.cameraStatusText}>Iniciando cámara…</ThemedText>
              </View>
            ) : null}
          </View>

          {cameraError ? (
            <View style={[styles.errorBox, { borderColor: c.border, backgroundColor: c.backgroundSecondary }]}>
              <ThemedText style={styles.errorTitle}>No se pudo iniciar la cámara</ThemedText>
              <ThemedText style={[styles.message, { color: c.textSecondary }]}>{cameraError}</ThemedText>
              <Button title="Reintentar cámara" variant="secondary" onPress={retry} />
            </View>
          ) : (
            <View style={styles.instructions}>
              <ThemedText style={styles.instructionTitle}>{loading ? "Consultando encomienda…" : "Coloca el QR dentro del recuadro"}</ThemedText>
              <ThemedText style={[styles.message, { color: c.textSecondary }]}>{loading ? "Estamos verificando la información del código escaneado." : "Mantén el código visible y evita moverlo hasta que el sistema lo reconozca."}</ThemedText>
              {locked && !loading ? <Button title="Volver a escanear" variant="secondary" onPress={retry} /> : null}
            </View>
          )}
        </View>
      )}
    </Modal>
  );
}

function Detail({ label, value, color }: { label: string; value: string; color: string }) {
  return <View style={styles.row}><ThemedText style={[styles.label, { color }]}>{label}</ThemedText><ThemedText style={styles.value}>{value}</ThemedText></View>;
}

const styles = StyleSheet.create({
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" },
  footerCompact: { width: "100%", justifyContent: "flex-start" },
  scannerContent: { width: "100%", gap: 16 },
  cameraViewport: { width: "100%", minHeight: 270, overflow: "hidden", borderRadius: 16, borderWidth: 1, backgroundColor: "#000000", position: "relative" },
  cameraShade: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.08)" },
  frameContainer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
  frame: { width: 230, height: 230, maxWidth: "72%", maxHeight: "72%", borderWidth: 3, borderColor: "#FFFFFF", borderRadius: 18 },
  cameraStatus: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.42)" },
  cameraStatusText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  instructions: { alignItems: "center", gap: 7, paddingHorizontal: 8 },
  instructionTitle: { textAlign: "center", fontSize: 15, fontWeight: "800" },
  permission: { gap: 16, alignItems: "center", paddingVertical: 28, paddingHorizontal: 16 },
  permissionTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  message: { textAlign: "center", fontSize: 14, lineHeight: 20 },
  errorBox: { gap: 10, alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 16 },
  errorTitle: { fontSize: 15, fontWeight: "800", textAlign: "center" },
  detail: { width: "100%", gap: 14 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 12 },
  detailHeaderCompact: { alignItems: "flex-start", flexWrap: "wrap" },
  detailTitleWrap: { flex: 1, minWidth: 0 },
  detailOverline: { fontSize: 11, fontWeight: "800", opacity: 0.65, marginBottom: 3 },
  guia: { fontSize: 22, fontWeight: "800" },
  detailCard: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 8 },
  detailCardCompact: { paddingHorizontal: 12 },
  detailHint: { fontSize: 13, lineHeight: 19 },
  row: { flexDirection: "row", flexWrap: "wrap", paddingVertical: 8, gap: 6 },
  label: { width: 96, fontSize: 12, fontWeight: "700" },
  value: { flex: 1, minWidth: 150, fontSize: 13, fontWeight: "600" },
});
