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
  Platform,
} from "react-native";

import {
  PrinterCompatibilityError,
  printerService,
} from "@/services/printer";

import type {
  PrinterDefaultProfiles,
  PrinterDevice,
  PrinterJobRequirement,
  PrinterPrintJob,
  PrinterProfileKey,
} from "@/services/printer";

/*
|--------------------------------------------------------------------------
| CONTEXT TYPE
|--------------------------------------------------------------------------
*/

export interface PrinterConnectionContextValue {
  /** Todas las predeterminadas guardadas por perfil. */
  defaultPrinters:
    PrinterDefaultProfiles;

  /**
   * Alias de compatibilidad con código anterior.
   * Si existe una solicitud activa devuelve la impresora de ese perfil.
   * Si no, devuelve la primera disponible.
   */
  defaultPrinter:
    PrinterDevice | null;

  activePrinter:
    PrinterDevice | null;

  sunmiPrinter:
    PrinterDevice | null;

  bluetoothDevices:
    PrinterDevice[];

  /** Formato que actualmente necesita una pantalla. */
  requestedRequirement:
    PrinterJobRequirement | null;

  loading:
    boolean;

  checkingSunmi:
    boolean;

  searchingBluetooth:
    boolean;

  configurationRequired:
    boolean;

  error:
    string | null;

  connect(
    device:
      PrinterDevice,
  ): Promise<PrinterDevice>;

  disconnect():
    Promise<void>;

  refreshSunmi():
    Promise<PrinterDevice | null>;

  refreshBluetooth():
    Promise<void>;

  getDefaultPrinterForRequirement(
    requirement:
      PrinterJobRequirement,
  ): PrinterDevice | null;

  setDefaultPrinter(
    device:
      PrinterDevice,
    profile?:
      PrinterProfileKey,
  ): Promise<PrinterDevice>;

  clearDefaultPrinter(
    profile?:
      PrinterProfileKey,
  ): Promise<void>;

  requestPrinter(
    requirement:
      PrinterJobRequirement,
    reason?:
      string,
  ): void;

  cancelPrinterRequest():
    void;

  /** Legacy: conecta una impresora sin conocer el trabajo. */
  ensureReadyPrinter(
    device?:
      PrinterDevice,
  ): Promise<PrinterDevice>;

  /** Recomendado: valida formato y conecta la impresora correcta. */
  ensureReadyPrinterForJob(
    job:
      PrinterPrintJob,
    device?:
      PrinterDevice,
  ): Promise<PrinterDevice>;

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

export const PrinterConnectionContext =
  createContext<PrinterConnectionContextValue | null>(
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

  autoConnect?:
    boolean;

  detectSunmiOnStart?:
    boolean;
}

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function firstConfiguredPrinter(
  profiles:
    PrinterDefaultProfiles,
): PrinterDevice | null {
  return (
    profiles[
      "receipt-58"
    ] ??
    profiles[
      "receipt-80"
    ] ??
    profiles.document ??
    null
  );
}

/*
|--------------------------------------------------------------------------
| PROVIDER
|--------------------------------------------------------------------------
*/

export function PrinterConnectionProvider({
  children,
  autoConnect =
    true,
  detectSunmiOnStart =
    true,
}: Props) {
  const [
    defaultPrinters,
    setDefaultPrinters,
  ] =
    useState<PrinterDefaultProfiles>(
      {},
    );

  const [
    activePrinter,
    setActivePrinter,
  ] =
    useState<PrinterDevice | null>(
      null,
    );

  const [
    sunmiPrinter,
    setSunmiPrinter,
  ] =
    useState<PrinterDevice | null>(
      null,
    );

  const [
    bluetoothDevices,
    setBluetoothDevices,
  ] =
    useState<PrinterDevice[]>(
      [],
    );

  const [
    requestedRequirement,
    setRequestedRequirement,
  ] =
    useState<PrinterJobRequirement | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true,
    );

  const [
    checkingSunmi,
    setCheckingSunmi,
  ] =
    useState(
      false,
    );

  const [
    searchingBluetooth,
    setSearchingBluetooth,
  ] =
    useState(
      false,
    );

  const [
    configurationRequired,
    setConfigurationRequired,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  /*
  |------------------------------------------------------------------------
  | GET DEFAULT FOR REQUIREMENT
  |------------------------------------------------------------------------
  */

  const getDefaultPrinterForRequirement =
    useCallback(
      (
        requirement:
          PrinterJobRequirement,
      ): PrinterDevice | null => {
        const profile =
          printerService.getProfileForRequirement(
            requirement,
          );

        return (
          defaultPrinters[
            profile
          ] ??
          null
        );
      },
      [
        defaultPrinters,
      ],
    );

  /*
  |------------------------------------------------------------------------
  | LEGACY DEFAULT ALIAS
  |------------------------------------------------------------------------
  */

  const defaultPrinter =
    useMemo(
      () => {
        if (
          requestedRequirement
        ) {
          return getDefaultPrinterForRequirement(
            requestedRequirement,
          );
        }

        return firstConfiguredPrinter(
          defaultPrinters,
        );
      },
      [
        defaultPrinters,
        getDefaultPrinterForRequirement,
        requestedRequirement,
      ],
    );

  /*
  |------------------------------------------------------------------------
  | REFRESH SUNMI
  |------------------------------------------------------------------------
  */

  const refreshSunmi =
    useCallback(
      async (): Promise<PrinterDevice | null> => {
        if (
          Platform.OS !==
          "android"
        ) {
          setSunmiPrinter(
            null,
          );

          return null;
        }

        setCheckingSunmi(
          true,
        );

        try {
          const detected =
            await printerService.detectSunmiPrinter();

          setSunmiPrinter(
            detected,
          );

          return detected;
        } catch {
          setSunmiPrinter(
            null,
          );

          return null;
        } finally {
          setCheckingSunmi(
            false,
          );
        }
      },
      [],
    );

  /*
  |------------------------------------------------------------------------
  | REFRESH BLUETOOTH
  |------------------------------------------------------------------------
  */

  const refreshBluetooth =
    useCallback(
      async (): Promise<void> => {
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
  |------------------------------------------------------------------------
  | INITIAL LOAD
  |------------------------------------------------------------------------
  |
  | Importante:
  | NO obligamos a configurar una impresora al iniciar toda la app.
  |
  | La pantalla que necesite imprimir llama requestPrinter(requirement)
  | o print(job). Así una impresora de tickets no bloquea un reporte Carta.
  |
  */

  useEffect(() => {
    let mounted =
      true;

    const load =
      async () => {
        setLoading(
          true,
        );

        setError(
          null,
        );

        try {
          const profiles =
            await printerService.getDefaultPrinters();

          if (
            !mounted
          ) {
            return;
          }

          setDefaultPrinters(
            profiles,
          );

          if (
            detectSunmiOnStart &&
            Platform.OS ===
              "android"
          ) {
            try {
              const detected =
                await printerService.detectSunmiPrinter();

              if (
                mounted
              ) {
                setSunmiPrinter(
                  detected,
                );
              }
            } catch {
              /* Android normal sin SUNMI. */
            }
          }

          if (
            !autoConnect
          ) {
            return;
          }

          const preferred =
            firstConfiguredPrinter(
              profiles,
            );

          if (
            !preferred
          ) {
            return;
          }

          try {
            const connected =
              await printerService.connect(
                preferred,
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
             * No abrimos el modal globalmente.
             * Se abrirá cuando una pantalla realmente necesite ese perfil.
             */
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
  }, [
    autoConnect,
    detectSunmiOnStart,
  ]);

  /*
  |------------------------------------------------------------------------
  | REQUEST PRINTER
  |------------------------------------------------------------------------
  */

  const requestPrinter =
    useCallback(
      (
        requirement:
          PrinterJobRequirement,
        reason?:
          string,
      ) => {
        const normalized =
          printerService.normalizeRequirement(
            requirement,
          );

        setRequestedRequirement(
          normalized,
        );

        setConfigurationRequired(
          true,
        );

        setError(
          reason ??
            null,
        );
      },
      [],
    );

  const cancelPrinterRequest =
    useCallback(
      () => {
        setConfigurationRequired(
          false,
        );

        setRequestedRequirement(
          null,
        );

        setError(
          null,
        );
      },
      [],
    );

  /*
  |------------------------------------------------------------------------
  | CONNECT
  |------------------------------------------------------------------------
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

        setActivePrinter({
          ...device,
          status:
            "connecting",
        });

        try {
          const connected =
            await printerService.connect(
              device,
            );

          setActivePrinter(
            connected,
          );

          if (
            connected.connectionType ===
            "sunmi"
          ) {
            setSunmiPrinter({
              ...connected,
              status:
                "disconnected",
            });
          }

          return connected;
        } catch (
          cause:
            any
        ) {
          setActivePrinter(
            null,
          );

          setError(
            cause?.message ??
              "No se pudo conectar con la impresora.",
          );

          throw cause;
        }
      },
      [],
    );

  /*
  |------------------------------------------------------------------------
  | DISCONNECT
  |------------------------------------------------------------------------
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
  |------------------------------------------------------------------------
  | SAVE DEFAULT BY PROFILE
  |------------------------------------------------------------------------
  */

  const saveDefault =
    useCallback(
      async (
        device:
          PrinterDevice,
        profile?:
          PrinterProfileKey,
      ): Promise<PrinterDevice> => {
        setError(
          null,
        );

        const targetProfile =
          profile ??
          (
            requestedRequirement
              ? printerService.getProfileForRequirement(
                  requestedRequirement,
                )
              : printerService.inferPreferredProfileForDevice(
                  device,
                )
          );

        /*
        |------------------------------------------------------------------
        | Si el modal fue abierto para un formato concreto, la nueva
        | impresora debe ser compatible ANTES de guardarla.
        |------------------------------------------------------------------
        */

        if (
          requestedRequirement
        ) {
          const compatibility =
            printerService.checkCompatibility(
              device,
              requestedRequirement,
            );

          if (
            !compatibility.compatible
          ) {
            const problem =
              new PrinterCompatibilityError(
                compatibility,
              );

            setError(
              problem.message,
            );

            throw problem;
          }
        }

        try {
          let connected =
            activePrinter?.id ===
                device.id &&
            activePrinter.status ===
              "connected"
              ? activePrinter
              : await printerService.connect(
                  device,
                );

          const available =
            await printerService.testConnection(
              connected,
            );

          if (
            !available
          ) {
            throw new Error(
              "La impresora no respondió a la prueba de conexión.",
            );
          }

          connected = {
            ...connected,
            status:
              "connected",
          };

          const saved =
            await printerService.setDefaultPrinterForProfile(
              targetProfile,
              connected,
            );

          setActivePrinter(
            connected,
          );

          setDefaultPrinters(
            (
              current,
            ) => ({
              ...current,
              [targetProfile]:
                saved,
            }),
          );

          setConfigurationRequired(
            false,
          );

          setRequestedRequirement(
            null,
          );

          setError(
            null,
          );

          return saved;
        } catch (
          cause:
            any
        ) {
          setConfigurationRequired(
            Boolean(
              requestedRequirement,
            ),
          );

          setError(
            cause?.message ??
              "No se pudo guardar la impresora predeterminada.",
          );

          throw cause;
        }
      },
      [
        activePrinter,
        requestedRequirement,
      ],
    );

  /*
  |------------------------------------------------------------------------
  | CLEAR DEFAULT
  |------------------------------------------------------------------------
  */

  const clearDefault =
    useCallback(
      async (
        profile?:
          PrinterProfileKey,
      ) => {
        let targetProfile =
          profile;

        if (
          !targetProfile &&
          requestedRequirement
        ) {
          targetProfile =
            printerService.getProfileForRequirement(
              requestedRequirement,
            );
        }

        if (
          !targetProfile &&
          defaultPrinter
        ) {
          const entry =
            Object.entries(
              defaultPrinters,
            ).find(
              ([, value]) =>
                value?.id ===
                defaultPrinter.id,
            );

          targetProfile =
            entry?.[0] as
              | PrinterProfileKey
              | undefined;
        }

        if (
          !targetProfile
        ) {
          return;
        }

        await printerService.clearDefaultPrinterForProfile(
          targetProfile,
        );

        setDefaultPrinters(
          (
            current,
          ) => {
            const next = {
              ...current,
            };

            delete next[
              targetProfile!
            ];

            return next;
          },
        );

        if (
          requestedRequirement
        ) {
          setConfigurationRequired(
            true,
          );
        }
      },
      [
        defaultPrinter,
        defaultPrinters,
        requestedRequirement,
      ],
    );

  /*
  |------------------------------------------------------------------------
  | LEGACY READY PRINTER
  |------------------------------------------------------------------------
  */

  const ensureReadyPrinter =
    useCallback(
      async (
        device?:
          PrinterDevice,
      ): Promise<PrinterDevice> => {
        const target =
          device ??
          defaultPrinter;

        if (
          !target
        ) {
          throw new Error(
            "No hay una impresora predeterminada configurada.",
          );
        }

        if (
          activePrinter?.id ===
            target.id &&
          activePrinter.status ===
            "connected"
        ) {
          return activePrinter;
        }

        const connected =
          await printerService.connect(
            target,
          );

        setActivePrinter(
          connected,
        );

        return connected;
      },
      [
        activePrinter,
        defaultPrinter,
      ],
    );

  /*
  |------------------------------------------------------------------------
  | READY PRINTER FOR JOB
  |------------------------------------------------------------------------
  */

  const ensureReadyPrinterForJob =
    useCallback(
      async (
        job:
          PrinterPrintJob,
        device?:
          PrinterDevice,
      ): Promise<PrinterDevice> => {
        const normalized =
          printerService.normalizeRequirement(
            job,
          );

        const profile =
          printerService.getProfileForRequirement(
            normalized,
          );

        const target =
          device ??
          defaultPrinters[
            profile
          ] ??
          null;

        if (
          !target
        ) {
          const reason =
            `No hay una impresora configurada para ${printerService.getPaperLabel(
              normalized.paperSize,
            )}.`;

          requestPrinter(
            normalized,
            reason,
          );

          throw new Error(
            reason,
          );
        }

        const compatibility =
          printerService.checkCompatibility(
            target,
            normalized,
          );

        if (
          !compatibility.compatible
        ) {
          requestPrinter(
            normalized,
            compatibility.reason,
          );

          throw new PrinterCompatibilityError(
            compatibility,
          );
        }

        if (
          activePrinter?.id ===
            target.id &&
          activePrinter.status ===
            "connected"
        ) {
          return activePrinter;
        }

        try {
          const connected =
            await printerService.connect(
              target,
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

          const reason =
            cause?.message ??
            "La impresora predeterminada no está disponible.";

          requestPrinter(
            normalized,
            reason,
          );

          throw cause;
        }
      },
      [
        activePrinter,
        defaultPrinters,
        requestPrinter,
      ],
    );

  /*
  |------------------------------------------------------------------------
  | TEST CONNECTION
  |------------------------------------------------------------------------
  */

  const testConnection =
    useCallback(
      async (
        device?:
          PrinterDevice,
      ): Promise<boolean> => {
        const target =
          device ??
          activePrinter ??
          defaultPrinter;

        if (
          !target
        ) {
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
  |------------------------------------------------------------------------
  | TEST PAGE
  |------------------------------------------------------------------------
  */

  const printTestPage =
    useCallback(
      async (
        device?:
          PrinterDevice,
      ): Promise<void> => {
        const target =
          device ??
          activePrinter ??
          defaultPrinter;

        if (
          !target
        ) {
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
  |------------------------------------------------------------------------
  | PRINT
  |------------------------------------------------------------------------
  */

  const print =
    useCallback(
      async (
        job:
          PrinterPrintJob,
        device?:
          PrinterDevice,
      ): Promise<void> => {
        const normalizedJob:
          PrinterPrintJob = {
          ...job,
          paperSize:
            printerService.normalizeRequirement(
              job,
            ).paperSize,
        };

        const target =
          await ensureReadyPrinterForJob(
            normalizedJob,
            device,
          );

        try {
          await printerService.print(
            target,
            normalizedJob,
          );

          setError(
            null,
          );
        } catch (
          cause:
            any
        ) {
          if (
            cause instanceof
            PrinterCompatibilityError
          ) {
            requestPrinter(
              normalizedJob,
              cause.message,
            );
          } else if (
            target.connectionType !==
            "system"
          ) {
            setActivePrinter(
              null,
            );

            requestPrinter(
              normalizedJob,
              cause?.message ??
                "No se pudo imprimir con la impresora configurada.",
            );
          } else {
            setError(
              cause?.message ??
                "No se pudo imprimir.",
            );
          }

          throw cause;
        }
      },
      [
        ensureReadyPrinterForJob,
        requestPrinter,
      ],
    );

  /*
  |------------------------------------------------------------------------
  | VALUE
  |------------------------------------------------------------------------
  */

  const value =
    useMemo<PrinterConnectionContextValue>(
      () => ({
        defaultPrinters,
        defaultPrinter,
        activePrinter,
        sunmiPrinter,
        bluetoothDevices,
        requestedRequirement,
        loading,
        checkingSunmi,
        searchingBluetooth,
        configurationRequired,
        error,
        connect,
        disconnect,
        refreshSunmi,
        refreshBluetooth,
        getDefaultPrinterForRequirement,
        setDefaultPrinter:
          saveDefault,
        clearDefaultPrinter:
          clearDefault,
        requestPrinter,
        cancelPrinterRequest,
        ensureReadyPrinter,
        ensureReadyPrinterForJob,
        testConnection,
        printTestPage,
        print,
      }),
      [
        defaultPrinters,
        defaultPrinter,
        activePrinter,
        sunmiPrinter,
        bluetoothDevices,
        requestedRequirement,
        loading,
        checkingSunmi,
        searchingBluetooth,
        configurationRequired,
        error,
        connect,
        disconnect,
        refreshSunmi,
        refreshBluetooth,
        getDefaultPrinterForRequirement,
        saveDefault,
        clearDefault,
        requestPrinter,
        cancelPrinterRequest,
        ensureReadyPrinter,
        ensureReadyPrinterForJob,
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
      {
        children
      }
    </PrinterConnectionContext.Provider>
  );
}
