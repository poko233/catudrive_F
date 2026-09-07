import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  printerService,
} from "@/services/printer";

import type {
  PrinterDevice,
  PrinterPrintJob,
} from "@/services/printer";

/*
|--------------------------------------------------------------------------
| CONTEXT TYPE
|--------------------------------------------------------------------------
*/

export interface PrinterConnectionContextValue {
  defaultPrinter:
    PrinterDevice | null;

  activePrinter:
    PrinterDevice | null;

  bluetoothDevices:
    PrinterDevice[];

  loading:
    boolean;

  searchingBluetooth:
    boolean;

  error:
    string | null;

  connect(
    device:
      PrinterDevice,
  ): Promise<PrinterDevice>;

  disconnect():
    Promise<void>;

  refreshBluetooth():
    Promise<void>;

  setDefaultPrinter(
    device:
      PrinterDevice,
  ): Promise<void>;

  clearDefaultPrinter():
    Promise<void>;

  testConnection(
    device?:
      PrinterDevice,
  ): Promise<boolean>;

  printTestPage(
    device?:
      PrinterDevice,
  ): Promise<void>;

  print(
    job:
      PrinterPrintJob,

    device?:
      PrinterDevice,
  ): Promise<void>;
}

/*
|--------------------------------------------------------------------------
| CONTEXT
|--------------------------------------------------------------------------
*/

export const PrinterConnectionContext =
  createContext<
    PrinterConnectionContextValue | null
  >(
    null,
  );

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface Props {
  children:
    ReactNode;

  /*
  |--------------------------------------------------------------------------
  | Security default:
  | Do not silently reconnect to hardware on app start.
  |--------------------------------------------------------------------------
  */

  autoConnect?:
    boolean;
}

/*
|--------------------------------------------------------------------------
| PROVIDER
|--------------------------------------------------------------------------
*/

export function PrinterConnectionProvider({
  children,

  autoConnect =
    false,
}: Props) {
  const [
    defaultPrinter,
    setDefaultPrinterState,
  ] =
    useState<
      PrinterDevice | null
    >(
      null,
    );

  const [
    activePrinter,
    setActivePrinter,
  ] =
    useState<
      PrinterDevice | null
    >(
      null,
    );

  const [
    bluetoothDevices,
    setBluetoothDevices,
  ] =
    useState<
      PrinterDevice[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    searchingBluetooth,
    setSearchingBluetooth,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | LOAD DEFAULT
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      let mounted =
        true;

      const load =
        async () => {
          setLoading(
            true,
          );

          try {
            const saved =
              await printerService.getDefaultPrinter();

            if (
              !mounted
            ) {
              return;
            }

            setDefaultPrinterState(
              saved,
            );

            if (
              saved &&
              autoConnect
            ) {
              try {
                const connected =
                  await printerService.connect(
                    saved,
                  );

                if (
                  mounted
                ) {
                  setActivePrinter(
                    connected,
                  );
                }
              } catch {
                /*
                |--------------------------------------------------------------------------
                | Saved printer remains remembered but disconnected.
                |--------------------------------------------------------------------------
                */
              }
            }
          } finally {
            if (
              mounted
            ) {
              setLoading(
                false,
              );
            }
          }
        };

      void load();

      return () => {
        mounted =
          false;
      };
    },
    [
      autoConnect,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | CONNECT
  |--------------------------------------------------------------------------
  */

  const connect =
    useCallback(
      async (
        device:
          PrinterDevice,
      ) => {
        setError(
          null,
        );

        const connecting:
          PrinterDevice = {
          ...device,

          status:
            "connecting",
        };

        setActivePrinter(
          connecting,
        );

        try {
          const connected =
            await printerService.connect(
              device,
            );

          setActivePrinter(
            connected,
          );

          return connected;
        } catch (
          cause:
            any
        ) {
          setActivePrinter(
            null,
          );

          const message =
            cause?.message ??
            "No se pudo conectar con la impresora.";

          setError(
            message,
          );

          throw cause;
        }
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | DISCONNECT
  |--------------------------------------------------------------------------
  */

  const disconnect =
    useCallback(
      async () => {
        if (
          !activePrinter
        ) {
          return;
        }

        try {
          await printerService.disconnect(
            activePrinter,
          );
        } finally {
          setActivePrinter(
            null,
          );
        }
      },
      [
        activePrinter,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | BLUETOOTH
  |--------------------------------------------------------------------------
  */

  const refreshBluetooth =
    useCallback(
      async () => {
        setError(
          null,
        );

        setSearchingBluetooth(
          true,
        );

        try {
          const devices =
            await printerService.getBondedBluetoothPrinters();

          setBluetoothDevices(
            devices,
          );
        } catch (
          cause:
            any
        ) {
          setBluetoothDevices(
            [],
          );

          setError(
            cause?.message ??
            "No se pudieron cargar los dispositivos Bluetooth emparejados.",
          );
        } finally {
          setSearchingBluetooth(
            false,
          );
        }
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | DEFAULT
  |--------------------------------------------------------------------------
  */

  const saveDefault =
    useCallback(
      async (
        device:
          PrinterDevice,
      ) => {
        const saved =
          await printerService.setDefaultPrinter(
            device,
          );

        setDefaultPrinterState(
          saved,
        );
      },
      [],
    );

  const clearDefault =
    useCallback(
      async () => {
        await printerService.clearDefaultPrinter();

        setDefaultPrinterState(
          null,
        );
      },
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | TEST CONNECTION
  |--------------------------------------------------------------------------
  */

  const testConnection =
    useCallback(
      async (
        device?:
          PrinterDevice,
      ) => {
        const target =
          device ??
          activePrinter ??
          defaultPrinter;

        if (!target) {
          throw new Error(
            "No hay una impresora seleccionada.",
          );
        }

        return printerService.testConnection(
          target,
        );
      },
      [
        activePrinter,
        defaultPrinter,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | TEST PAGE
  |--------------------------------------------------------------------------
  */

  const printTestPage =
    useCallback(
      async (
        device?:
          PrinterDevice,
      ) => {
        const target =
          device ??
          activePrinter ??
          defaultPrinter;

        if (!target) {
          throw new Error(
            "No hay una impresora seleccionada.",
          );
        }

        await printerService.printTestPage(
          target,
        );
      },
      [
        activePrinter,
        defaultPrinter,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | PRINT
  |--------------------------------------------------------------------------
  */

  const print =
    useCallback(
      async (
        job:
          PrinterPrintJob,

        device?:
          PrinterDevice,
      ) => {
        const target =
          device ??
          activePrinter ??
          defaultPrinter ??
          printerService.getSystemPrinter();

        await printerService.print(
          target,
          job,
        );
      },
      [
        activePrinter,
        defaultPrinter,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | VALUE
  |--------------------------------------------------------------------------
  */

  const value =
    useMemo<
      PrinterConnectionContextValue
    >(
      () => ({
        defaultPrinter,

        activePrinter,

        bluetoothDevices,

        loading,

        searchingBluetooth,

        error,

        connect,

        disconnect,

        refreshBluetooth,

        setDefaultPrinter:
          saveDefault,

        clearDefaultPrinter:
          clearDefault,

        testConnection,

        printTestPage,

        print,
      }),
      [
        defaultPrinter,
        activePrinter,
        bluetoothDevices,
        loading,
        searchingBluetooth,
        error,
        connect,
        disconnect,
        refreshBluetooth,
        saveDefault,
        clearDefault,
        testConnection,
        printTestPage,
        print,
      ],
    );

  return (
    <PrinterConnectionContext.Provider
      value={
        value
      }
    >
      {children}
    </PrinterConnectionContext.Provider>
  );
}
