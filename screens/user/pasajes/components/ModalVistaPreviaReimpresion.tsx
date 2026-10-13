// screens/user/pasajes/components/ModalVistaPreviaReimpresion.tsx
// Vista previa del HTML oficial + selección de impresora ANTES de imprimir.
// No modifica la impresora predeterminada ni imprime al abrir el modal.

import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import {
  Bluetooth,
  Check,
  ChevronDown,
  ChevronUp,
  Printer,
  RefreshCw,
  Settings2,
  Wifi,
} from "lucide-react-native";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  printerService,
  type PrinterDevice,
} from "@/services/printer";
import { useTheme } from "@/theme/useTheme";
import { usePrinterConnection } from "@/components/PrinterConnection";

const REQUISITO = { type: "receipt", paperSize: "receipt-58" } as const;

interface Props {
  visible: boolean;
  html: string;
  titulo: string;
  subtitulo?: string;
  onClose: () => void;
  onConfirmar: (impresora: PrinterDevice) => void;
  onConfigurar: () => void;
}

/** Bluetooth Classic solo expone dispositivos emparejados, no su categoría real. */
function pareceImpresora(nombre: string): boolean {
  return /print|printer|impresora|thermal|receipt|ticket|esc.?pos|pos[-_\s\d]|sunmi|xprinter|xp[-_\s]?\d|rongta|rp[-_\s]?\d|zjiang|zj[-_\s]?\d|gprinter|gp[-_\s]?\d|hprt|mpt[-_\s]?\d|pt[-_\s]?\d|eppos|bt[-_\s]?printer|mini\s*printer/i.test(nombre);
}

function tipoImpresora(impresora: PrinterDevice): string {
  switch (impresora.connectionType) {
    case "bluetooth": return "Bluetooth";
    case "sunmi": return "SUNMI integrada";
    case "network": return "Wi-Fi / LAN";
    default: return "Impresión del sistema";
  }
}

function etiquetaDispositivo(impresora: PrinterDevice): string {
  if (impresora.connectionType === "bluetooth") {
    return impresora.macAddress ?? "Dispositivo emparejado";
  }
  if (impresora.connectionType === "network") {
    return `${impresora.ipAddress ?? ""}:${impresora.port ?? 9100}`;
  }
  return tipoImpresora(impresora);
}

export function ModalVistaPreviaReimpresion({
  visible,
  html,
  titulo,
  subtitulo,
  onClose,
  onConfirmar,
  onConfigurar,
}: Props) {
  const { theme } = useTheme();
  const c = theme.colors;
  const { width: anchoPantalla, height: altoPantalla } = useWindowDimensions();
  const compacto = anchoPantalla < 530;

  const {
    defaultPrinters,
    activePrinter,
    sunmiPrinter,
    bluetoothDevices,
    getDefaultPrinterForRequirement,
    refreshBluetooth,
    refreshSunmi,
    searchingBluetooth,
    checkingSunmi,
  } = usePrinterConnection();

  const predeterminada = getDefaultPrinterForRequirement(REQUISITO);
  const sistema = useMemo(() => printerService.getSystemPrinter(), []);
  const [idSeleccionado, setIdSeleccionado] = useState<string | null>(null);
  const [seleccionManual, setSeleccionManual] = useState(false);
  const [selectorAbierto, setSelectorAbierto] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [mostrarOtros, setMostrarOtros] = useState(false);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);

  // Incluye las predeterminadas (también Wi-Fi), la conectada, SUNMI y
  // las Bluetooth emparejadas. Se evita mostrar dos veces el mismo equipo.
  const impresoras = useMemo(() => {
    const candidatos: PrinterDevice[] = [
      ...(predeterminada ? [predeterminada] : []),
      ...Object.values(defaultPrinters).filter((x): x is PrinterDevice => Boolean(x)),
      ...(activePrinter ? [activePrinter] : []),
      ...(sunmiPrinter ? [sunmiPrinter] : []),
      ...bluetoothDevices,
      sistema,
    ];
    const ids = new Set<string>();
    return candidatos.filter((item) => {
      const clave = `${item.connectionType}:${item.id}`;
      if (ids.has(clave)) return false;
      ids.add(clave);
      if (!printerService.checkCompatibility(item, REQUISITO).compatible) return false;
      if (
        item.connectionType === "bluetooth" &&
        !mostrarOtros &&
        !pareceImpresora(item.name) &&
        item.id !== predeterminada?.id &&
        item.id !== activePrinter?.id
      ) return false;
      return true;
    });
  }, [predeterminada, defaultPrinters, activePrinter, sunmiPrinter, bluetoothDevices, sistema, mostrarOtros]);

  // Si se carga una predeterminada de AsyncStorage después de abrir la vista,
  // pasa a estar seleccionada automáticamente mientras el usuario no cambie.
  const idEfectivo = seleccionManual
    ? idSeleccionado
    : predeterminada?.id ?? impresoras[0]?.id ?? null;
  const seleccionada = impresoras.find((item) => item.id === idEfectivo) ?? null;

  const filtradas = impresoras.filter((item) => {
    const q = buscar.trim().toLocaleLowerCase("es");
    return !q || `${item.name} ${etiquetaDispositivo(item)} ${tipoImpresora(item)}`
      .toLocaleLowerCase("es").includes(q);
  });

  const buscarImpresoras = async () => {
    setErrorBusqueda(null);
    const resultados = await Promise.allSettled([refreshBluetooth(), refreshSunmi()]);
    const errores = resultados
      .filter((r): r is PromiseRejectedResult => r.status === "rejected")
      .map((r) => r.reason instanceof Error ? r.reason.message : "No se pudo buscar impresoras.");
    if (errores.length === resultados.length) setErrorBusqueda(errores.join(" · "));
  };

  const confirmar = () => {
    if (!seleccionada) return;
    setSelectorAbierto(false);
    onConfirmar(seleccionada);
  };

  const anchoPapel = Math.min(310, Math.max(180, anchoPantalla - 84));

  return (
    <Modal
      visible={visible}
      title="Vista previa de reimpresión"
      onClose={onClose}
      maxWidth={610}
      maxHeight={Math.min(790, Math.round(altoPantalla * 0.92))}
      contentPadding={compacto ? 12 : 16}
      footer={
        <View style={[styles.footer, compacto && styles.footerCompact]}>
          <Button
            title="Cancelar"
            variant="secondary"
            onPress={onClose}
            style={compacto ? styles.fullWidth : undefined}
          />
          <Button
            title="Continuar a impresión"
            onPress={confirmar}
            disabled={!seleccionada}
            style={compacto ? styles.fullWidth : undefined}
          />
        </View>
      }
    >
      <View style={styles.container}>
        <View style={styles.titulos}>
          <Text style={[styles.titulo, { color: c.text }]}>{titulo}</Text>
          {subtitulo ? <Text style={[styles.subtitulo, { color: c.textSecondary }]}>{subtitulo}</Text> : null}
          <Text style={[styles.aviso, { color: c.textSecondary }]}>
            Comprueba el documento y elige la impresora antes de continuar.
          </Text>
        </View>

        <View style={[styles.preview, { borderColor: c.border, backgroundColor: c.backgroundSecondary }]}>
          <View style={styles.previewHeader}>
            <Printer size={16} color={c.primary} />
            <Text style={[styles.previewHeaderText, { color: c.text }]}>Documento · Ticket 58 mm</Text>
          </View>
          <View style={[styles.paper, { width: anchoPapel }]}>
            {Platform.OS === "web" ? (
              React.createElement("iframe", {
                title: "Vista previa del documento imprimible",
                srcDoc: html,
                sandbox: "", // Bloquea scripts y window.print() del HTML del backend.
                style: { width: "100%", height: 305, border: "none", backgroundColor: "white" },
              } as any)
            ) : (
              <WebView
                source={{ html }}
                javaScriptEnabled={false}
                domStorageEnabled={false}
                originWhitelist={["*"]}
                nestedScrollEnabled
                scrollEnabled
                style={styles.webview}
              />
            )}
          </View>
        </View>

        <View style={styles.selectorArea}>
          <Text style={[styles.selectorLabel, { color: c.text }]}>Impresora de destino</Text>
          <Pressable
            onPress={() => setSelectorAbierto((actual) => !actual)}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar impresora"
            accessibilityState={{ expanded: selectorAbierto }}
            style={[styles.selector, { backgroundColor: c.card, borderColor: c.border }]}
          >
            <Printer size={19} color={c.primary} />
            <View style={styles.selectorInfo}>
              <Text style={[styles.selectorName, { color: c.text }]} numberOfLines={1}>
                {seleccionada?.name ?? "Seleccionar impresora"}
              </Text>
              <Text style={[styles.selectorSub, { color: c.textSecondary }]} numberOfLines={1}>
                {seleccionada ? `${tipoImpresora(seleccionada)}${seleccionada.id === predeterminada?.id ? " · Predeterminada" : ""}` : "No hay impresora seleccionada"}
              </Text>
            </View>
            {selectorAbierto ? <ChevronUp size={20} color={c.textSecondary} /> : <ChevronDown size={20} color={c.textSecondary} />}
          </Pressable>

          {selectorAbierto ? (
            <View style={[styles.options, { borderColor: c.border, backgroundColor: c.card }]}>
              <TextInput
                value={buscar}
                onChangeText={setBuscar}
                placeholder="Buscar impresora por nombre o MAC"
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                style={[styles.input, { borderColor: c.inputBorder, backgroundColor: c.input, color: c.text }]}
              />
              {filtradas.length ? filtradas.map((item) => (
                <Pressable
                  key={`${item.connectionType}:${item.id}`}
                  onPress={() => {
                    setIdSeleccionado(item.id);
                    setSeleccionManual(true);
                    setSelectorAbierto(false);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Elegir ${item.name}`}
                  style={[styles.option, { borderBottomColor: c.border }]}
                >
                  {item.connectionType === "bluetooth" ? <Bluetooth size={17} color={c.primary} /> : item.connectionType === "network" ? <Wifi size={17} color={c.primary} /> : <Printer size={17} color={c.primary} />}
                  <View style={styles.selectorInfo}>
                    <Text style={[styles.selectorName, { color: c.text }]}>{item.name}</Text>
                    <Text style={[styles.selectorSub, { color: c.textSecondary }]}>
                      {etiquetaDispositivo(item)}{item.id === predeterminada?.id ? " · Predeterminada" : ""}
                    </Text>
                  </View>
                  {item.id === idEfectivo ? <Check size={19} color={c.primary} /> : null}
                </Pressable>
              )) : (
                <Text style={[styles.empty, { color: c.textSecondary }]}>No se encontraron impresoras con ese nombre.</Text>
              )}
              {Platform.OS !== "web" ? (
                <>
                  <Pressable onPress={() => setMostrarOtros((v) => !v)} style={styles.secondaryAction}>
                    <Text style={[styles.secondaryActionText, { color: c.primary }]}>
                      {mostrarOtros ? "Ocultar otros dispositivos Bluetooth" : "Mostrar otros dispositivos Bluetooth"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => void buscarImpresoras()}
                    disabled={searchingBluetooth || checkingSunmi}
                    style={styles.secondaryAction}
                  >
                    {searchingBluetooth || checkingSunmi ? <ActivityIndicator size="small" color={c.primary} /> : <RefreshCw size={16} color={c.primary} />}
                    <Text style={[styles.secondaryActionText, { color: c.primary }]}>Buscar impresoras emparejadas</Text>
                  </Pressable>
                </>
              ) : null}
            </View>
          ) : null}

          {errorBusqueda ? <Text style={[styles.error, { color: c.destructive }]}>{errorBusqueda}</Text> : null}
          {Platform.OS !== "web" ? (
            <Pressable onPress={onConfigurar} style={styles.configAction}>
              <Settings2 size={16} color={c.primary} />
              <Text style={[styles.secondaryActionText, { color: c.primary }]}>Configurar otra impresora</Text>
            </Pressable>
          ) : (
            <Text style={[styles.note, { color: c.textSecondary }]}>En la web, la impresora física se elige en el diálogo del navegador.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  titulos: { gap: 4 },
  titulo: { fontSize: 15, fontWeight: "900" },
  subtitulo: { fontSize: 12 },
  aviso: { marginTop: 3, fontSize: 12, lineHeight: 18 },
  preview: { borderWidth: 1, borderRadius: 12, padding: 10, alignItems: "center", gap: 8 },
  previewHeader: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 7 },
  previewHeaderText: { fontSize: 12, fontWeight: "800" },
  paper: { height: 305, backgroundColor: "#FFFFFF", borderRadius: 5, overflow: "hidden" },
  webview: { width: "100%", height: 305, backgroundColor: "#FFFFFF" },
  selectorArea: { gap: 8 },
  selectorLabel: { fontSize: 13, fontWeight: "800" },
  selector: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 10, padding: 12 },
  selectorInfo: { flex: 1, minWidth: 0, gap: 3 },
  selectorName: { fontSize: 13, fontWeight: "800" },
  selectorSub: { fontSize: 11 },
  options: { borderWidth: 1, borderRadius: 10, padding: 8, gap: 3 },
  input: { minHeight: 42, borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, fontSize: 13 },
  option: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  empty: { fontSize: 12, textAlign: "center", padding: 10 },
  secondaryAction: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8 },
  secondaryActionText: { fontSize: 12, fontWeight: "800" },
  configAction: { flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingVertical: 6 },
  error: { fontSize: 12, lineHeight: 17 },
  note: { fontSize: 11, lineHeight: 17 },
  footer: { flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 10 },
  footerCompact: { flexDirection: "column" },
  fullWidth: { width: "100%" },
});
