import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTheme } from "@/theme/useTheme";
import { BarcodeScanningResult, CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, StyleSheet, useWindowDimensions, View } from "react-native";

interface Props {
  visible: boolean;
  loading: boolean;
  onClose: () => void;
  onScan: (value: string) => Promise<boolean>;
}

type Size = { width: number; height: number };

export function EncomiendaQrScannerModal({ visible, loading, onClose, onScan }: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });

  const compact = windowWidth < 720;
  const cameraHeight = useMemo(() => Math.max(300, Math.min(470, windowHeight - 300)), [windowHeight]);
  const modalMaxHeight = useMemo(() => Math.max(540, windowHeight - 30), [windowHeight]);
  const frameSize = useMemo(() => {
    if (!viewport.width || !viewport.height) return 230;
    return Math.min(280, Math.max(210, Math.min(viewport.width, viewport.height) * 0.68));
  }, [viewport]);

  useEffect(() => {
    if (visible) {
      setLocked(false);
      setCameraReady(false);
      setCameraError("");
    }
  }, [visible]);

  const qrDentroDelMarco = (result: BarcodeScanningResult) => {
    if (!viewport.width || !viewport.height) return true;
    const points = result.cornerPoints;
    if (!points || points.length < 2) return true;

    const xs = points.map((p) => Number(p.x));
    const ys = points.map((p) => Number(p.y));
    if (xs.some(Number.isNaN) || ys.some(Number.isNaN)) return true;

    const maxX = Math.max(...xs), maxY = Math.max(...ys);
    // En algunos navegadores expo-camera entrega coordenadas en la resolución
    // original del video. En ese caso no bloqueamos una lectura válida.
    if (maxX > viewport.width * 1.35 || maxY > viewport.height * 1.35) return true;

    const centerX = (Math.min(...xs) + maxX) / 2;
    const centerY = (Math.min(...ys) + maxY) / 2;
    const left = (viewport.width - frameSize) / 2;
    const top = (viewport.height - frameSize) / 2;
    const tolerance = 18;
    return centerX >= left - tolerance && centerX <= left + frameSize + tolerance && centerY >= top - tolerance && centerY <= top + frameSize + tolerance;
  };

  const handleScan = async (result: BarcodeScanningResult) => {
    if (locked || loading || !qrDentroDelMarco(result)) return;
    setLocked(true);
    const ok = await onScan(result.data);
    if (!ok) setLocked(false);
  };

  const retry = () => {
    setLocked(false);
    setCameraReady(false);
    setCameraError("");
  };

  const solicitarPermiso = async () => {
    setCameraError("");
    await requestPermission();
  };

  const onViewportLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  };

  return (
    <Modal
      visible={visible}
      title="Escanear QR de encomienda"
      onClose={onClose}
      maxWidth={760}
      maxHeight={modalMaxHeight}
      scrollable
      contentPadding={compact ? 14 : 20}
      footer={<View style={styles.footer}><Button title="Cerrar" variant="secondary" onPress={onClose} /></View>}
    >
      {!permission ? (
        <View style={styles.permission}><ThemedText style={styles.message}>Consultando permiso de cámara…</ThemedText></View>
      ) : !permission.granted ? (
        <View style={styles.permission}>
          <ThemedText style={styles.permissionTitle}>Permiso de cámara requerido</ThemedText>
          <ThemedText style={[styles.message, { color: c.textSecondary }]}>Permite el acceso a la cámara para leer el código QR pegado en la encomienda.</ThemedText>
          <Button title="Permitir cámara" onPress={() => void solicitarPermiso()} />
        </View>
      ) : (
        <View style={styles.scannerContent}>
          <View onLayout={onViewportLayout} style={[styles.cameraViewport, { height: cameraHeight, borderColor: c.border }]}>
            <CameraView
              style={StyleSheet.absoluteFill}
              active={visible}
              facing="back"
              mode="picture"
              autofocus="off"
              zoom={0}
              barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              onBarcodeScanned={locked || loading ? undefined : handleScan}
              onCameraReady={() => { setCameraReady(true); setCameraError(""); }}
              onMountError={(error) => { setCameraReady(false); setCameraError(error.message || "No se pudo iniciar la cámara."); }}
            />

            <View style={styles.frameContainer} pointerEvents="none">
              <View style={[styles.frame, { width: frameSize, height: frameSize }]} />
            </View>

            {!cameraReady && !cameraError ? <View style={styles.cameraStatus} pointerEvents="none"><ThemedText style={styles.cameraStatusText}>Iniciando cámara…</ThemedText></View> : null}
          </View>

          {cameraError ? (
            <View style={[styles.errorBox, { borderColor: c.border, backgroundColor: c.backgroundSecondary }]}>
              <ThemedText style={styles.errorTitle}>No se pudo iniciar la cámara</ThemedText>
              <ThemedText style={[styles.message, { color: c.textSecondary }]}>{cameraError}</ThemedText>
              <Button title="Reintentar cámara" variant="secondary" onPress={retry} />
            </View>
          ) : (
            <View style={styles.instructions}>
              <ThemedText style={styles.instructionTitle}>{loading ? "Consultando encomienda…" : "Centra el QR dentro del recuadro"}</ThemedText>
              <ThemedText style={[styles.message, { color: c.textSecondary }]}>{loading ? "Estamos verificando la información del código escaneado." : "Mantén el QR completo dentro del marco y a una distancia donde se vea nítido. La cámara mantendrá el enfoque automático."}</ThemedText>
              {locked && !loading ? <Button title="Volver a escanear" variant="secondary" onPress={() => setLocked(false)} /> : null}
            </View>
          )}
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: "row", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" },
  scannerContent: { width: "100%", gap: 16 },
  cameraViewport: { width: "100%", minHeight: 300, overflow: "hidden", borderRadius: 16, borderWidth: 1, backgroundColor: "#000000", position: "relative" },
  frameContainer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.06)" },
  frame: { borderWidth: 3, borderColor: "#FFFFFF", borderRadius: 18, backgroundColor: "transparent" },
  cameraStatus: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.42)" },
  cameraStatusText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  instructions: { alignItems: "center", gap: 7, paddingHorizontal: 8 },
  instructionTitle: { textAlign: "center", fontSize: 15, fontWeight: "800" },
  permission: { gap: 16, alignItems: "center", paddingVertical: 28, paddingHorizontal: 16 },
  permissionTitle: { fontSize: 17, fontWeight: "800", textAlign: "center" },
  message: { textAlign: "center", fontSize: 14, lineHeight: 20 },
  errorBox: { gap: 10, alignItems: "center", borderWidth: 1, borderRadius: 12, padding: 16 },
  errorTitle: { fontSize: 15, fontWeight: "800", textAlign: "center" },
});
