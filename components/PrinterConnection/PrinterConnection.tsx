import React, { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  Bluetooth,
  MonitorCog,
  Printer as PrinterIcon,
  Search,
  ShieldCheck,
  Smartphone,
  Wifi,
} from "lucide-react-native";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Divider } from "@/components/ui/Divider";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/theme/useTheme";
import {
  DEFAULT_RAW_PRINTER_PORT,
  getPrinterPaperLabel,
  getPrinterProfileLabel,
  printerService,
} from "@/services/printer";
import type {
  PrinterConnectionType,
  PrinterDevice,
  PrinterJobRequirement,
  PrinterProfileKey,
} from "@/services/printer";
import { PrinterDeviceItem } from "./PrinterDeviceItem";
import { usePrinterConnection } from "./usePrinterConnection";

type Tab = PrinterConnectionType;

interface PrinterConnectionProps {
  autoDiscover?: boolean;
  initialTab?: Tab;
  requirement?: PrinterJobRequirement | null;
  /** Oculta las tarjetas informativas extensas dentro del modal compacto. */
  compact?: boolean;
}

/**
 * Android Bluetooth Classic entrega una lista de equipos EMPAREJADOS.
 * No siempre informa de forma fiable la clase del dispositivo.
 * Este filtro por nombre es una ayuda visual, NO una verificación de hardware.
 * La opción "Mostrar todos" mantiene accesibles impresoras con nombres atípicos.
 */
const PRINTER_NAME_PATTERN =
  /(?:printer|impresora|printing|thermal|receipt|ticket|esc[\s-]?pos|xprinter|gprinter|hprt|bixolon|epson|zebra|rongta|zjiang|munbyn|peripage|phomemo|star\s*micronics|pos[\s_-]?\d|rp[\s_-]?\d|rpp[\s_-]?\d|xp[\s_-]?\d|pt[\s_-]?\d|p[\s_-]?58|p[\s_-]?80|58\s?mm|80\s?mm|mtp[\s_-]?\w*|mpt[\s_-]?\w*|spp[\s_-]?\w*|tsp[\s_-]?\d|bt[\s_-]?printer)/i;

function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

export function PrinterConnection({
  autoDiscover = false,
  initialTab = "system",
  requirement = null,
  compact = false,
}: PrinterConnectionProps) {
  const { theme } = useTheme();
  const c = theme.colors;
  const {
    defaultPrinters,
    defaultPrinter,
    activePrinter,
    sunmiPrinter,
    bluetoothDevices,
    requestedRequirement,
    checkingSunmi,
    searchingBluetooth,
    error,
    connect,
    disconnect,
    refreshSunmi,
    refreshBluetooth,
    setDefaultPrinter,
    clearDefaultPrinter,
    printTestPage,
  } = usePrinterConnection();

  const effectiveRequirement = requestedRequirement ?? requirement;
  const documentRequired = effectiveRequirement?.type === "document";
  const requiredProfile: PrinterProfileKey | null = effectiveRequirement
    ? printerService.getProfileForRequirement(effectiveRequirement)
    : null;
  const requiredPaperLabel = effectiveRequirement
    ? getPrinterPaperLabel(printerService.normalizeRequirement(effectiveRequirement).paperSize)
    : null;
  const profileLabel = requiredProfile ? getPrinterProfileLabel(requiredProfile) : undefined;

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [networkName, setNetworkName] = useState("Impresora Boletería");
  const [ipAddress, setIpAddress] = useState("192.168.1.100");
  const [portText, setPortText] = useState(String(DEFAULT_RAW_PRINTER_PORT));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [bluetoothSearch, setBluetoothSearch] = useState("");
  const [showAllBluetooth, setShowAllBluetooth] = useState(false);
  const [tabTouched, setTabTouched] = useState(false);

  const systemDevice = useMemo(() => printerService.getSystemPrinter(), []);
  const currentDefault = requiredProfile ? defaultPrinters[requiredProfile] ?? null : defaultPrinter;

  useEffect(() => {
    setActiveTab(documentRequired ? "system" : initialTab);
    setTabTouched(false);
  }, [documentRequired, initialTab]);

  // La detección solo se activa cuando la pantalla/modal solicita autoDiscover.
  useEffect(() => {
    if (!autoDiscover || Platform.OS === "web" || documentRequired) return;
    void Promise.allSettled([refreshSunmi(), refreshBluetooth()]);
  }, [autoDiscover, documentRequired, refreshBluetooth, refreshSunmi]);

  // Selecciona automáticamente SUNMI si está disponible, sin interrumpir al usuario.
  useEffect(() => {
    if (!autoDiscover || tabTouched || documentRequired) return;
    if (sunmiPrinter && (!effectiveRequirement || printerService.checkCompatibility(sunmiPrinter, effectiveRequirement).compatible)) {
      setActiveTab("sunmi");
    } else if (bluetoothDevices.length > 0) {
      setActiveTab("bluetooth");
    }
  }, [autoDiscover, tabTouched, documentRequired, sunmiPrinter, bluetoothDevices.length, effectiveRequirement]);

  const isCompatible = (device: PrinterDevice): boolean =>
    !effectiveRequirement || printerService.checkCompatibility(device, effectiveRequirement).compatible;
  const isConnected = (device: PrinterDevice): boolean =>
    activePrinter?.id === device.id && activePrinter.status === "connected";
  const isDefault = (device: PrinterDevice): boolean => currentDefault?.id === device.id;

  const compatibleBluetooth = useMemo(
    () => bluetoothDevices.filter((device) =>
      !effectiveRequirement || printerService.checkCompatibility(device, effectiveRequirement).compatible,
    ),
    [bluetoothDevices, effectiveRequirement],
  );

  const printerCandidates = useMemo(
    () => compatibleBluetooth.filter((device) =>
      PRINTER_NAME_PATTERN.test(device.name) ||
      device.id === currentDefault?.id ||
      device.id === activePrinter?.id,
    ),
    [compatibleBluetooth, currentDefault?.id, activePrinter?.id],
  );

  const filteredBluetooth = useMemo(() => {
    const query = normalizeSearch(bluetoothSearch);
    // Buscar permite encontrar también impresoras cuyo nombre no sigue patrones habituales.
    const base = showAllBluetooth ? compatibleBluetooth : printerCandidates;
    if (!query) return base;
    return base.filter((device) => normalizeSearch(
      [device.name, device.macAddress ?? "", device.model ?? "", device.manufacturer ?? ""].join(" "),
    ).includes(query));
  }, [bluetoothSearch, compatibleBluetooth, printerCandidates, showAllBluetooth]);

  const buildNetworkDevice = (): PrinterDevice => printerService.buildNetworkPrinter({
    name: networkName,
    ipAddress,
    port: Number(portText),
  });

  const run = async (device: PrinterDevice, action: () => Promise<void>) => {
    setLocalError(null);
    setBusyId(device.id);
    try {
      await action();
    } catch (cause: any) {
      setLocalError(cause?.message ?? "No se pudo completar la operación.");
    } finally {
      setBusyId(null);
    }
  };

  const renderDevice = (device: PrinterDevice) => {
    if (!isCompatible(device)) return null;
    return (
      <PrinterDeviceItem
        key={device.id}
        device={device}
        connected={isConnected(device)}
        isDefault={isDefault(device)}
        defaultLabel={profileLabel}
        busy={busyId === device.id}
        onConnect={() => void run(device, async () => { await connect(device); })}
        onDisconnect={() => void run(device, async () => { await disconnect(); })}
        onSetDefault={() => void run(device, async () => {
          await setDefaultPrinter(device, requiredProfile ?? undefined);
        })}
        onTest={() => void run(device, async () => { await printTestPage(device); })}
      />
    );
  };

  const selectTab = (tab: Tab) => {
    setActiveTab(tab);
    setTabTouched(true);
    setLocalError(null);
  };

  const tabs: { id: Tab; label: string }[] = documentRequired
    ? [{ id: "system", label: "Sistema" }]
    : [
        { id: "bluetooth", label: "Bluetooth" },
        { id: "sunmi", label: "SUNMI" },
        { id: "network", label: "Wi‑Fi / LAN" },
        { id: "system", label: "Sistema" },
      ];

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {!compact && effectiveRequirement ? (
        <Card style={styles.requirementCard}>
          <View style={styles.inline}>
            <PrinterIcon size={20} color={c.primary} />
            <View style={styles.grow}>
              <ThemedText style={styles.bold}>Formato requerido</ThemedText>
              <ThemedText style={{ color: c.textSecondary }}>{requiredPaperLabel}</ThemedText>
            </View>
            <Badge label={documentRequired ? "DOCUMENTO" : "TICKET"} variant="info" />
          </View>
        </Card>
      ) : null}

      <Card padding={compact ? 12 : undefined} style={styles.currentCard}>
        <View style={styles.inline}>
          <View style={[styles.currentIcon, { backgroundColor: c.primarySubtle }]}>
            <PrinterIcon size={compact ? 18 : 22} color={c.primary} />
          </View>
          <View style={styles.grow}>
            <ThemedText style={[styles.tiny, { color: c.textSecondary }]}>
              {profileLabel ? `Predeterminada · ${profileLabel}` : "Impresora predeterminada"}
            </ThemedText>
            <ThemedText style={[styles.bold, { color: currentDefault ? c.text : c.textSecondary }]}>
              {currentDefault?.name ?? "Sin configurar"}
            </ThemedText>
          </View>
          {currentDefault ? (
            <Badge label={currentDefault.connectionType === "sunmi" ? "SUNMI" : currentDefault.connectionType} variant="info" />
          ) : (
            <Badge label="Pendiente" variant="muted" />
          )}
        </View>
        {currentDefault ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void clearDefaultPrinter(requiredProfile ?? undefined)}
            style={styles.linkButton}
          >
            <ThemedText style={[styles.linkText, { color: c.textSecondary }]}>
              {profileLabel ? `Quitar predeterminada de ${profileLabel}` : "Quitar predeterminada"}
            </ThemedText>
          </Pressable>
        ) : null}
      </Card>

      {!compact ? (
        <Card style={styles.securityCard}>
          <View style={styles.inline}>
            <ShieldCheck size={18} color={c.success} />
            <ThemedText style={[styles.securityText, { color: c.textSecondary }]}>
              CatuDrive valida el formato antes de imprimir. Las impresoras térmicas y las de documentos conservan sus propias predeterminadas.
            </ThemedText>
          </View>
        </Card>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.tabs}
      >
        {tabs.map((tab) => (
          <View key={tab.id} style={styles.tabButton}>
            <Button
              title={tab.label}
              variant={activeTab === tab.id ? "primary" : "secondary"}
              onPress={() => selectTab(tab.id)}
            />
          </View>
        ))}
      </ScrollView>

      <Divider />

      {localError || error ? (
        <Card style={[styles.errorCard, { borderColor: c.destructive }]}>
          <ThemedText style={{ color: c.destructive, fontWeight: "700" }}>
            {localError ?? error}
          </ThemedText>
        </Card>
      ) : null}

      {activeTab === "system" ? (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <MonitorCog size={19} color={c.primary} />
            <ThemedText style={styles.sectionTitleText}>Impresión del sistema</ThemedText>
          </View>
          <ThemedText style={{ color: c.textSecondary }}>
            {documentRequired
              ? "Para Carta/A4 se abrirá el diálogo del sistema, donde puedes elegir la impresora física."
              : "Utiliza el diálogo de impresión del sistema operativo."}
          </ThemedText>
          {renderDevice(systemDevice)}
        </View>
      ) : null}

      {activeTab === "sunmi" && !documentRequired ? (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Smartphone size={19} color={c.primary} />
            <ThemedText style={styles.sectionTitleText}>SUNMI integrada</ThemedText>
          </View>
          <Button
            title={checkingSunmi ? "Detectando..." : "Detectar SUNMI"}
            variant="secondary"
            disabled={checkingSunmi}
            loading={checkingSunmi}
            onPress={() => void refreshSunmi()}
          />
          {sunmiPrinter && isCompatible(sunmiPrinter) ? renderDevice(sunmiPrinter) : (
            <EmptyState
              icon="print-outline"
              title="SUNMI no disponible"
              subtitle="No se detectó una impresora SUNMI integrada compatible."
            />
          )}
        </View>
      ) : null}

      {activeTab === "network" && !documentRequired ? (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Wifi size={19} color={c.primary} />
            <ThemedText style={styles.sectionTitleText}>Térmica Wi‑Fi / LAN</ThemedText>
          </View>
          <Input compact label="Nombre" value={networkName} onChangeText={setNetworkName} placeholder="Impresora Boletería" />
          <Input compact label="IP privada" value={ipAddress} onChangeText={setIpAddress} placeholder="192.168.1.100" autoCapitalize="none" />
          <Input compact label="Puerto RAW" value={portText} onChangeText={setPortText} keyboardType="numeric" helperText="Solo RAW TCP 9100." />
          <Button
            title="Preparar impresora de red"
            onPress={() => {
              try {
                const device = buildNetworkDevice();
                void run(device, async () => { await connect(device); });
              } catch (cause: any) {
                setLocalError(cause?.message ?? "Configuración de red inválida.");
              }
            }}
          />
          {(() => {
            try { return renderDevice(buildNetworkDevice()); } catch { return null; }
          })()}
        </View>
      ) : null}

      {activeTab === "bluetooth" && !documentRequired ? (
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Bluetooth size={19} color={c.primary} />
            <View style={styles.grow}>
              <ThemedText style={styles.sectionTitleText}>Impresoras Bluetooth</ThemedText>
              <ThemedText style={[styles.tiny, { color: c.textSecondary }]}>Dispositivos previamente emparejados</ThemedText>
            </View>
          </View>

          <View style={styles.searchWrapper}>
            <Search size={18} color={c.textSecondary} />
            <View style={styles.grow}>
              <Input
                compact
                value={bluetoothSearch}
                onChangeText={setBluetoothSearch}
                placeholder="Buscar por nombre o MAC..."
                autoCapitalize="none"
                autoCorrect={false}
                accessibilityLabel="Buscar impresoras Bluetooth"
              />
            </View>
          </View>

          <View style={styles.bluetoothToolbar}>
            <View style={styles.grow}>
              <ThemedText style={[styles.tiny, { color: c.textSecondary }]}>
                {`${filteredBluetooth.length} de ${compatibleBluetooth.length} dispositivos`}
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={showAllBluetooth ? "Mostrar solo impresoras" : "Mostrar todos los dispositivos"}
              onPress={() => setShowAllBluetooth((prev) => !prev)}
              style={[styles.filterButton, { borderColor: c.border }]}
            >
              <ThemedText style={[styles.filterText, { color: c.primary }]}>
                {showAllBluetooth ? "Solo impresoras" : "Mostrar todos"}
              </ThemedText>
            </Pressable>
          </View>

          <Button
            title={searchingBluetooth ? "Buscando..." : "Actualizar emparejadas"}
            variant="secondary"
            disabled={searchingBluetooth}
            loading={searchingBluetooth}
            onPress={() => void refreshBluetooth()}
          />

          {filteredBluetooth.length > 0 ? (
            filteredBluetooth.map(renderDevice)
          ) : (
            <EmptyState
              icon="bluetooth-outline"
              title={bluetoothSearch ? "Sin coincidencias" : "Sin impresoras identificadas"}
              subtitle={bluetoothSearch
                ? "Prueba otro nombre o pulsa «Mostrar todos» para incluir dispositivos con nombres genéricos."
                : compatibleBluetooth.length > 0
                  ? "Hay equipos emparejados, pero no se identifican como impresoras. Pulsa «Mostrar todos» para revisarlos."
                  : "Empareja tu impresora en los ajustes Bluetooth de Android y vuelve a actualizar."}
            />
          )}

          <ThemedText style={[styles.bluetoothNote, { color: c.textSecondary }]}>
            La identificación es orientativa: algunos modelos usan nombres genéricos. «Mostrar todos» permite elegirlos manualmente.
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%", gap: 14 },
  containerCompact: { gap: 10 },
  grow: { flex: 1, minWidth: 0 },
  inline: { flexDirection: "row", alignItems: "center", gap: 10 },
  bold: { fontSize: 13, fontWeight: "800" },
  tiny: { fontSize: 11 },
  requirementCard: { gap: 8 },
  currentCard: { gap: 8 },
  currentIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  linkButton: { alignSelf: "flex-start", paddingVertical: 3 },
  linkText: { fontSize: 11, fontWeight: "700" },
  securityCard: { gap: 0 },
  securityText: { flex: 1, fontSize: 11, lineHeight: 16 },
  tabs: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  tabButton: { flexShrink: 0 },
  errorCard: { borderWidth: 1 },
  section: { width: "100%", gap: 10 },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitleText: { fontSize: 14, fontWeight: "800" },
  searchWrapper: { flexDirection: "row", alignItems: "center", gap: 10 },
  bluetoothToolbar: { flexDirection: "row", alignItems: "center", gap: 8 },
  filterButton: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
  filterText: { fontSize: 12, fontWeight: "800" },
  bluetoothNote: { fontSize: 11, lineHeight: 16 },
});
