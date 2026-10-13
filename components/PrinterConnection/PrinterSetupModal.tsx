import { useEffect, useMemo } from "react";
import { Platform, StyleSheet, useWindowDimensions, View } from "react-native";
import { AlertTriangle, Printer as PrinterIcon } from "lucide-react-native";

import { Modal } from "@/components/ui/Modal";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import { getPrinterPaperLabel, printerService } from "@/services/printer";
import type { PrinterDevice, PrinterJobRequirement } from "@/services/printer";
import { PrinterConnection } from "./PrinterConnection";
import { usePrinterConnection } from "./usePrinterConnection";

interface Props {
  visible: boolean;
  /** No impide cerrar el modal; se puede configurar la impresora más tarde. */
  required?: boolean;
  requirement?: PrinterJobRequirement | null;
  onClose?: () => void;
  onConfigured?: (device: PrinterDevice) => void;
}

export function PrinterSetupModal({
  visible,
  required = false,
  requirement = null,
  onClose,
  onConfigured,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { height: screenHeight } = useWindowDimensions();
  const {
    defaultPrinter,
    requestedRequirement,
    configurationRequired,
    error,
    getDefaultPrinterForRequirement,
    cancelPrinterRequest,
  } = usePrinterConnection();

  const effectiveRequirement = requestedRequirement ?? requirement;
  const relevantDefault = useMemo(() => {
    return effectiveRequirement
      ? getDefaultPrinterForRequirement(effectiveRequirement)
      : defaultPrinter;
  }, [defaultPrinter, effectiveRequirement, getDefaultPrinterForRequirement]);

  const compatible = useMemo(() => {
    if (!relevantDefault) return false;
    if (!effectiveRequirement) return true;
    return printerService.checkCompatibility(relevantDefault, effectiveRequirement).compatible;
  }, [effectiveRequirement, relevantDefault]);

  const configured = Boolean(relevantDefault && compatible && !configurationRequired);
  const paperLabel = effectiveRequirement
    ? getPrinterPaperLabel(printerService.normalizeRequirement(effectiveRequirement).paperSize)
    : null;

  useEffect(() => {
    if (visible && configured && relevantDefault) {
      onConfigured?.(relevantDefault);
    }
  }, [configured, onConfigured, relevantDefault, visible]);

  const handleClose = () => {
    cancelPrinterRequest();
    onClose?.();
  };

  const title = paperLabel ? `Seleccionar impresora · ${paperLabel}` : "Configurar impresora";

  return (
    <Modal
      visible={visible}
      title={title}
      onClose={handleClose}
      maxWidth={560}
      maxHeight={Math.min(620, Math.round(screenHeight * 0.80))}
      contentPadding={14}
      closeOnBackdropPress
    >
      <View style={styles.content}>
        {(required || error || (relevantDefault && !compatible)) ? (
          <View style={[styles.notice, { borderColor: c.border, backgroundColor: c.backgroundSecondary }]}>
            {required || error ? (
              <AlertTriangle size={18} color={c.warning} />
            ) : (
              <PrinterIcon size={18} color={c.primary} />
            )}
            <View style={styles.grow}>
              <ThemedText style={styles.noticeTitle}>
                {error
                  ? "Revisa la configuración"
                  : relevantDefault && !compatible
                    ? "La impresora guardada no es compatible"
                    : paperLabel
                      ? `Selecciona una impresora para ${paperLabel}`
                      : "Selecciona una impresora"}
              </ThemedText>
              <ThemedText style={[styles.noticeText, { color: c.textSecondary }]}>
                {error ?? (relevantDefault && !compatible
                  ? `${relevantDefault.name} no admite ${paperLabel ?? "el formato solicitado"}.`
                  : effectiveRequirement?.type === "document"
                    ? "Para Carta/A4 utiliza la impresión del sistema."
                    : Platform.OS === "web"
                      ? "En web se utiliza la impresión del sistema."
                      : "Puedes cerrar este panel y configurar la impresora después.")}
              </ThemedText>
            </View>
          </View>
        ) : null}

        {/* Solo montar la conexión mientras el usuario tenga abierto el modal.
            Esto evita buscar Bluetooth/SUNMI al entrar a Pasajes o Perfil. */}
        {visible ? (
          <PrinterConnection
            compact
            autoDiscover
            requirement={effectiveRequirement}
            initialTab={effectiveRequirement?.type === "document" || Platform.OS === "web" ? "system" : "bluetooth"}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 4 },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1, borderRadius: 12, padding: 11 },
  grow: { flex: 1, minWidth: 0 },
  noticeTitle: { fontSize: 12, fontWeight: "800" },
  noticeText: { fontSize: 11, lineHeight: 16, marginTop: 3 },
});
