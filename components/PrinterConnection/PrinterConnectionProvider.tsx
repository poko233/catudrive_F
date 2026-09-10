import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { Platform } from "react-native";

import { printerService } from "@/services/printer";
import type { PrinterDevice, PrinterPrintJob } from "@/services/printer";

export interface PrinterConnectionContextValue {
  defaultPrinter: PrinterDevice | null;
  activePrinter: PrinterDevice | null;
  sunmiPrinter: PrinterDevice | null;
  bluetoothDevices: PrinterDevice[];

  loading: boolean;
  checkingSunmi: boolean;
  searchingBluetooth: boolean;
  configurationRequired: boolean;
  error: string | null;

  connect(device: PrinterDevice): Promise<PrinterDevice>;
  disconnect(): Promise<void>;
  refreshSunmi(): Promise<PrinterDevice | null>;
  refreshBluetooth(): Promise<void>;
  setDefaultPrinter(device: PrinterDevice): Promise<PrinterDevice>;
  clearDefaultPrinter(): Promise<void>;
  ensureReadyPrinter(device?: PrinterDevice): Promise<PrinterDevice>;
  testConnection(device?: PrinterDevice): Promise<boolean>;
  printTestPage(device?: PrinterDevice): Promise<void>;
  print(job: PrinterPrintJob, device?: PrinterDevice): Promise<void>;
}

export const PrinterConnectionContext =
  createContext<PrinterConnectionContextValue | null>(null);

interface Props {
  children: ReactNode;
  autoConnect?: boolean;
  detectSunmiOnStart?: boolean;
}

function nativeNeedsPrinter(): boolean {
  return Platform.OS !== "web";
}

export function PrinterConnectionProvider({
  children,
  autoConnect = true,
  detectSunmiOnStart = true,
}: Props) {
  const [defaultPrinter, setDefaultPrinterState] =
    useState<PrinterDevice | null>(null);
  const [activePrinter, setActivePrinter] =
    useState<PrinterDevice | null>(null);
  const [sunmiPrinter, setSunmiPrinter] =
    useState<PrinterDevice | null>(null);
  const [bluetoothDevices, setBluetoothDevices] =
    useState<PrinterDevice[]>([]);

  const [loading, setLoading] = useState(true);
  const [checkingSunmi, setCheckingSunmi] = useState(false);
  const [searchingBluetooth, setSearchingBluetooth] = useState(false);
  const [configurationRequired, setConfigurationRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshSunmi = useCallback(async (): Promise<PrinterDevice | null> => {
    if (Platform.OS !== "android") {
      setSunmiPrinter(null);
      return null;
    }

    setCheckingSunmi(true);
    try {
      const detected = await printerService.detectSunmiPrinter();
      setSunmiPrinter(detected);
      return detected;
    } catch {
      setSunmiPrinter(null);
      return null;
    } finally {
      setCheckingSunmi(false);
    }
  }, []);

  const refreshBluetooth = useCallback(async (): Promise<void> => {
    setError(null);
    setSearchingBluetooth(true);

    try {
      const devices = await printerService.getBondedBluetoothPrinters();
      setBluetoothDevices(devices);
    } catch (cause: any) {
      setBluetoothDevices([]);
      setError(
        cause?.message ??
          "No se pudieron cargar los dispositivos Bluetooth emparejados.",
      );
    } finally {
      setSearchingBluetooth(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const saved = await printerService.getDefaultPrinter();
        if (!mounted) return;

        setDefaultPrinterState(saved);

        if (detectSunmiOnStart && Platform.OS === "android") {
          try {
            const detected = await printerService.detectSunmiPrinter();
            if (mounted) setSunmiPrinter(detected);
          } catch {
            // Android normal sin servicio SUNMI.
          }
        }

        if (!saved) {
          setActivePrinter(null);
          setConfigurationRequired(nativeNeedsPrinter());
          return;
        }

        if (!autoConnect) {
          setConfigurationRequired(false);
          return;
        }

        try {
          const connected = await printerService.connect(saved);
          if (!mounted) return;

          setActivePrinter(connected);
          setConfigurationRequired(false);
        } catch (cause: any) {
          if (!mounted) return;

          setActivePrinter(null);
          setConfigurationRequired(nativeNeedsPrinter());
          setError(
            cause?.message ?? "La impresora guardada no está disponible.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [autoConnect, detectSunmiOnStart]);

  const connect = useCallback(async (device: PrinterDevice) => {
    setError(null);
    setActivePrinter({ ...device, status: "connecting" });

    try {
      const connected = await printerService.connect(device);
      setActivePrinter(connected);

      if (connected.connectionType === "sunmi") {
        setSunmiPrinter({ ...connected, status: "disconnected" });
      }

      return connected;
    } catch (cause: any) {
      setActivePrinter(null);
      setError(cause?.message ?? "No se pudo conectar con la impresora.");
      throw cause;
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!activePrinter) return;

    const disconnectedId = activePrinter.id;

    try {
      await printerService.disconnect(activePrinter);
    } finally {
      setActivePrinter(null);

      if (
        defaultPrinter?.id === disconnectedId &&
        nativeNeedsPrinter()
      ) {
        setConfigurationRequired(true);
      }
    }
  }, [activePrinter, defaultPrinter]);

  /**
   * "Usar por defecto" ahora conecta, verifica y recién después guarda.
   */
  const saveDefault = useCallback(
    async (device: PrinterDevice): Promise<PrinterDevice> => {
      setError(null);

      try {
        let connected =
          activePrinter?.id === device.id &&
          activePrinter.status === "connected"
            ? activePrinter
            : await printerService.connect(device);

        const available = await printerService.testConnection(connected);
        if (!available) {
          throw new Error(
            "La impresora no respondió a la prueba de conexión.",
          );
        }

        connected = { ...connected, status: "connected" };

        const saved = await printerService.setDefaultPrinter(connected);

        setActivePrinter(connected);
        setDefaultPrinterState(saved);
        setConfigurationRequired(false);

        return saved;
      } catch (cause: any) {
        setConfigurationRequired(nativeNeedsPrinter());
        setError(
          cause?.message ??
            "No se pudo guardar la impresora predeterminada.",
        );
        throw cause;
      }
    },
    [activePrinter],
  );

  const clearDefault = useCallback(async () => {
    await printerService.clearDefaultPrinter();
    setDefaultPrinterState(null);
    setConfigurationRequired(nativeNeedsPrinter());
  }, []);

  /**
   * Devuelve la predeterminada conectada. Si estaba desconectada intenta
   * reconectarla automáticamente antes de imprimir.
   */
  const ensureReadyPrinter = useCallback(
    async (device?: PrinterDevice): Promise<PrinterDevice> => {
      const target = device ?? defaultPrinter;

      if (!target) {
        setConfigurationRequired(nativeNeedsPrinter());
        throw new Error("No hay una impresora predeterminada configurada.");
      }

      if (
        activePrinter?.id === target.id &&
        activePrinter.status === "connected"
      ) {
        return activePrinter;
      }

      try {
        const connected = await printerService.connect(target);
        setActivePrinter(connected);
        setConfigurationRequired(false);
        return connected;
      } catch (cause: any) {
        setActivePrinter(null);
        setConfigurationRequired(nativeNeedsPrinter());
        setError(
          cause?.message ?? "La impresora predeterminada no está disponible.",
        );
        throw cause;
      }
    },
    [activePrinter, defaultPrinter],
  );

  const testConnection = useCallback(
    async (device?: PrinterDevice): Promise<boolean> => {
      const target = device ?? activePrinter ?? defaultPrinter;
      if (!target) throw new Error("No hay una impresora seleccionada.");
      return printerService.testConnection(target);
    },
    [activePrinter, defaultPrinter],
  );

  const printTestPage = useCallback(
    async (device?: PrinterDevice): Promise<void> => {
      const target = device ?? activePrinter ?? defaultPrinter;
      if (!target) throw new Error("No hay una impresora seleccionada.");
      await printerService.printTestPage(target);
    },
    [activePrinter, defaultPrinter],
  );

  const print = useCallback(
    async (job: PrinterPrintJob, device?: PrinterDevice): Promise<void> => {
      const target = await ensureReadyPrinter(device);

      try {
        await printerService.print(target, job);
      } catch (cause: any) {
        if (target.connectionType !== "system") {
          setActivePrinter(null);
          setConfigurationRequired(nativeNeedsPrinter());
        }

        setError(cause?.message ?? "No se pudo imprimir.");
        throw cause;
      }
    },
    [ensureReadyPrinter],
  );

  const value = useMemo<PrinterConnectionContextValue>(
    () => ({
      defaultPrinter,
      activePrinter,
      sunmiPrinter,
      bluetoothDevices,
      loading,
      checkingSunmi,
      searchingBluetooth,
      configurationRequired,
      error,
      connect,
      disconnect,
      refreshSunmi,
      refreshBluetooth,
      setDefaultPrinter: saveDefault,
      clearDefaultPrinter: clearDefault,
      ensureReadyPrinter,
      testConnection,
      printTestPage,
      print,
    }),
    [
      defaultPrinter,
      activePrinter,
      sunmiPrinter,
      bluetoothDevices,
      loading,
      checkingSunmi,
      searchingBluetooth,
      configurationRequired,
      error,
      connect,
      disconnect,
      refreshSunmi,
      refreshBluetooth,
      saveDefault,
      clearDefault,
      ensureReadyPrinter,
      testConnection,
      printTestPage,
      print,
    ],
  );

  return (
    <PrinterConnectionContext.Provider value={value}>
      {children}
    </PrinterConnectionContext.Provider>
  );
}
