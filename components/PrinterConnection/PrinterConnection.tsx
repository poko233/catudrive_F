import {
  Bluetooth,
  MonitorCog,
  Printer as PrinterIcon,
  ShieldCheck,
  Smartphone,
  Wifi,
} from "lucide-react-native";

import {
  Platform,
  StyleSheet,
  View,
} from "react-native";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Badge,
} from "@/components/ui/Badge";

import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
} from "@/components/ui/Card";

import {
  Divider,
} from "@/components/ui/Divider";

import {
  EmptyState,
} from "@/components/ui/EmptyState";

import {
  Input,
} from "@/components/ui/Input";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  useTheme,
} from "@/theme/useTheme";

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

import {
  PrinterDeviceItem,
} from "./PrinterDeviceItem";

import {
  usePrinterConnection,
} from "./usePrinterConnection";

/*
|--------------------------------------------------------------------------
| TYPE
|--------------------------------------------------------------------------
*/

type Tab =
  PrinterConnectionType;

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface PrinterConnectionProps {
  autoDiscover?:
    boolean;

  initialTab?:
    Tab;

  /** Requisito explícito del modal/pantalla. */
  requirement?:
    PrinterJobRequirement | null;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function PrinterConnection({
  autoDiscover =
    false,
  initialTab =
    "system",
  requirement =
    null,
}: PrinterConnectionProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

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
  } =
    usePrinterConnection();

  const effectiveRequirement =
    requestedRequirement ??
    requirement;

  const [
    activeTab,
    setActiveTab,
  ] =
    useState<Tab>(
      initialTab,
    );

  const [
    networkName,
    setNetworkName,
  ] =
    useState(
      "Impresora Boletería",
    );

  const [
    ipAddress,
    setIpAddress,
  ] =
    useState(
      "192.168.1.100",
    );

  const [
    portText,
    setPortText,
  ] =
    useState(
      String(
        DEFAULT_RAW_PRINTER_PORT,
      ),
    );

  const [
    busyId,
    setBusyId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    localError,
    setLocalError,
  ] =
    useState<string | null>(
      null,
    );

  /*
  |------------------------------------------------------------------------
  | CURRENT REQUIREMENT
  |------------------------------------------------------------------------
  */

  const requiredProfile:
    PrinterProfileKey | null =
    effectiveRequirement
      ? printerService.getProfileForRequirement(
          effectiveRequirement,
        )
      : null;

  const requiredPaperLabel =
    effectiveRequirement
      ? getPrinterPaperLabel(
          printerService.normalizeRequirement(
            effectiveRequirement,
          ).paperSize,
        )
      : null;

  const profileLabel =
    requiredProfile
      ? getPrinterProfileLabel(
          requiredProfile,
        )
      : undefined;

  const documentRequired =
    effectiveRequirement?.type ===
    "document";

  /*
  |------------------------------------------------------------------------
  | AUTO DISCOVERY
  |------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      !autoDiscover ||
      Platform.OS ===
        "web" ||
      documentRequired
    ) {
      return;
    }

    void Promise.allSettled([
      refreshSunmi(),
      refreshBluetooth(),
    ]);
  }, [
    autoDiscover,
    documentRequired,
    refreshBluetooth,
    refreshSunmi,
  ]);

  /*
  |------------------------------------------------------------------------
  | TAB AUTOMATIC
  |------------------------------------------------------------------------
  */

  useEffect(() => {
    if (
      documentRequired
    ) {
      setActiveTab(
        "system",
      );
      return;
    }

    if (
      !autoDiscover
    ) {
      return;
    }

    if (
      sunmiPrinter &&
      effectiveRequirement &&
      printerService.checkCompatibility(
        sunmiPrinter,
        effectiveRequirement,
      ).compatible
    ) {
      setActiveTab(
        "sunmi",
      );
      return;
    }

    if (
      bluetoothDevices.length >
      0
    ) {
      setActiveTab(
        "bluetooth",
      );
    }
  }, [
    autoDiscover,
    bluetoothDevices.length,
    documentRequired,
    effectiveRequirement,
    sunmiPrinter,
  ]);

  /*
  |------------------------------------------------------------------------
  | SYSTEM DEVICE
  |------------------------------------------------------------------------
  */

  const systemDevice =
    useMemo(
      () =>
        printerService.getSystemPrinter(),
      [],
    );

  /*
  |------------------------------------------------------------------------
  | CURRENT DEFAULT FOR REQUEST
  |------------------------------------------------------------------------
  */

  const currentDefault =
    requiredProfile
      ? defaultPrinters[
          requiredProfile
        ] ??
        null
      : defaultPrinter;

  /*
  |------------------------------------------------------------------------
  | NETWORK DEVICE
  |------------------------------------------------------------------------
  */

  const buildNetworkDevice =
    (): PrinterDevice =>
      printerService.buildNetworkPrinter({
        name:
          networkName,
        ipAddress,
        port:
          Number(
            portText,
          ),
      });

  /*
  |------------------------------------------------------------------------
  | HELPERS
  |------------------------------------------------------------------------
  */

  const isConnected =
    (
      device:
        PrinterDevice,
    ) =>
      activePrinter?.id ===
        device.id &&
      activePrinter.status ===
        "connected";

  const isDefault =
    (
      device:
        PrinterDevice,
    ) =>
      currentDefault?.id ===
      device.id;

  const isCompatible =
    (
      device:
        PrinterDevice,
    ) => {
      if (
        !effectiveRequirement
      ) {
        return true;
      }

      return printerService.checkCompatibility(
        device,
        effectiveRequirement,
      ).compatible;
    };

  const run =
    async (
      device:
        PrinterDevice,
      action:
        () =>
          Promise<void>,
    ) => {
      setLocalError(
        null,
      );

      setBusyId(
        device.id,
      );

      try {
        await action();
      } catch (
        cause:
          any
      ) {
        setLocalError(
          cause?.message ??
            "No se pudo completar la operación.",
        );
      } finally {
        setBusyId(
          null,
        );
      }
    };

  const handleConnect =
    (
      device:
        PrinterDevice,
    ) =>
      run(
        device,
        async () => {
          await connect(
            device,
          );
        },
      );

  const handleDisconnect =
    (
      device:
        PrinterDevice,
    ) =>
      run(
        device,
        async () => {
          await disconnect();
        },
      );

  const handleDefault =
    (
      device:
        PrinterDevice,
    ) =>
      run(
        device,
        async () => {
          await setDefaultPrinter(
            device,
            requiredProfile ??
              undefined,
          );
        },
      );

  const handleTest =
    (
      device:
        PrinterDevice,
    ) =>
      run(
        device,
        async () => {
          await printTestPage(
            device,
          );
        },
      );

  /*
  |------------------------------------------------------------------------
  | RENDER DEVICE
  |------------------------------------------------------------------------
  */

  const renderDevice =
    (
      device:
        PrinterDevice,
    ) => {
      if (
        !isCompatible(
          device,
        )
      ) {
        return null;
      }

      return (
        <PrinterDeviceItem
          key={
            device.id
          }
          device={
            device
          }
          connected={
            isConnected(
              device,
            )
          }
          isDefault={
            isDefault(
              device,
            )
          }
          defaultLabel={
            profileLabel
          }
          busy={
            busyId ===
            device.id
          }
          onConnect={() =>
            void handleConnect(
              device,
            )
          }
          onDisconnect={() =>
            void handleDisconnect(
              device,
            )
          }
          onSetDefault={() =>
            void handleDefault(
              device,
            )
          }
          onTest={() =>
            void handleTest(
              device,
            )
          }
        />
      );
    };

  /*
  |------------------------------------------------------------------------
  | UI
  |------------------------------------------------------------------------
  */

  return (
    <View
      style={
        styles.container
      }
    >
      {/* CURRENT REQUIREMENT */}
      {effectiveRequirement ? (
        <Card
          style={
            styles.requirementCard
          }
        >
          <View
            style={
              styles.requirementTop
            }
          >
            <PrinterIcon
              size={22}
              color={
                c.primary
              }
            />

            <View
              style={
                styles.grow
              }
            >
              <ThemedText
                style={
                  styles.requirementTitle
                }
              >
                Formato requerido
              </ThemedText>

              <ThemedText
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                {
                  requiredPaperLabel
                }
              </ThemedText>
            </View>

            <Badge
              label={
                effectiveRequirement.type ===
                  "document"
                  ? "DOCUMENTO"
                  : "TICKET"
              }
              variant="info"
            />
          </View>
        </Card>
      ) : null}

      {/* CURRENT DEFAULT */}
      <Card
        style={
          styles.currentCard
        }
      >
        <View
          style={
            styles.currentTop
          }
        >
          <View
            style={[
              styles.currentIcon,
              {
                backgroundColor:
                  c.primarySubtle,
              },
            ]}
          >
            <PrinterIcon
              size={23}
              color={
                c.primary
              }
            />
          </View>

          <View
            style={
              styles.currentInfo
            }
          >
            <ThemedText
              style={
                styles.currentLabel
              }
            >
              {profileLabel
                ? `Predeterminada · ${profileLabel}`
                : "Impresora predeterminada"}
            </ThemedText>

            <ThemedText
              style={[
                styles.currentName,
                {
                  color:
                    currentDefault
                      ? c.text
                      : c.textSecondary,
                },
              ]}
            >
              {
                currentDefault?.name ??
                "Sin configurar"
              }
            </ThemedText>
          </View>

          {currentDefault ? (
            <Badge
              label={
                currentDefault.connectionType ===
                  "sunmi"
                  ? "SUNMI"
                  : currentDefault.connectionType
              }
              variant="info"
            />
          ) : (
            <Badge
              label="Pendiente"
              variant="muted"
            />
          )}
        </View>

        {currentDefault ? (
          <Button
            title={
              profileLabel
                ? `Quitar predeterminada de ${profileLabel}`
                : "Quitar predeterminada"
            }
            variant="ghost"
            onPress={() =>
              void clearDefaultPrinter(
                requiredProfile ??
                  undefined,
              )
            }
          />
        ) : null}
      </Card>

      {/* SECURITY */}
      <Card
        style={
          styles.securityCard
        }
      >
        <View
          style={
            styles.security
          }
        >
          <ShieldCheck
            size={20}
            color={
              c.success
            }
          />

          <ThemedText
            style={[
              styles.securityText,
              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            CatuDrive valida el formato antes de imprimir. Una impresora térmica no se utiliza para Carta/A4 y cada perfil conserva su propia predeterminada.
          </ThemedText>
        </View>
      </Card>

      {/* TABS */}
      <View
        style={
          styles.tabs
        }
      >
        <Button
          title="Sistema"
          variant={
            activeTab ===
            "system"
              ? "primary"
              : "secondary"
          }
          onPress={() =>
            setActiveTab(
              "system",
            )
          }
        />

        {!documentRequired ? (
          <>
            <Button
              title="SUNMI"
              variant={
                activeTab ===
                "sunmi"
                  ? "primary"
                  : "secondary"
              }
              onPress={() =>
                setActiveTab(
                  "sunmi",
                )
              }
            />

            <Button
              title="Wi‑Fi / LAN"
              variant={
                activeTab ===
                "network"
                  ? "primary"
                  : "secondary"
              }
              onPress={() =>
                setActiveTab(
                  "network",
                )
              }
            />

            <Button
              title="Bluetooth"
              variant={
                activeTab ===
                "bluetooth"
                  ? "primary"
                  : "secondary"
              }
              onPress={() =>
                setActiveTab(
                  "bluetooth",
                )
              }
            />
          </>
        ) : null}
      </View>

      <Divider />

      {/* ERROR */}
      {localError ||
      error ? (
        <Card
          style={[
            styles.errorCard,
            {
              borderColor:
                c.destructive,
            },
          ]}
        >
          <ThemedText
            style={{
              color:
                c.destructive,
              fontWeight:
                "700",
            }}
          >
            {
              localError ??
              error
            }
          </ThemedText>
        </Card>
      ) : null}

      {/* SYSTEM */}
      {activeTab ===
      "system" ? (
        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionTitle
            }
          >
            <MonitorCog
              size={19}
              color={
                c.primary
              }
            />

            <ThemedText
              style={
                styles.sectionTitleText
              }
            >
              Impresión del sistema
            </ThemedText>
          </View>

          <ThemedText
            style={{
              color:
                c.textSecondary,
            }}
          >
            {documentRequired
              ? "Para Carta/A4 CatuDrive abre el diálogo del sistema. Allí eliges la impresora física compatible, por ejemplo una HP, Canon o Epson de documentos."
              : "Abre el diálogo de impresión del sistema operativo."}
          </ThemedText>

          {
            renderDevice(
              systemDevice,
            )
          }
        </View>
      ) : null}

      {/* SUNMI */}
      {activeTab ===
        "sunmi" &&
      !documentRequired ? (
        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionTitle
            }
          >
            <Smartphone
              size={19}
              color={
                c.primary
              }
            />

            <ThemedText
              style={
                styles.sectionTitleText
              }
            >
              SUNMI integrada
            </ThemedText>
          </View>

          <Button
            title={
              checkingSunmi
                ? "Detectando..."
                : "Detectar SUNMI"
            }
            variant="secondary"
            disabled={
              checkingSunmi
            }
            loading={
              checkingSunmi
            }
            onPress={() =>
              void refreshSunmi()
            }
          />

          {sunmiPrinter &&
          isCompatible(
            sunmiPrinter,
          ) ? (
            renderDevice(
              sunmiPrinter,
            )
          ) : (
            <EmptyState
              icon="print-outline"
              title="SUNMI no disponible"
              subtitle="No se detectó una impresora SUNMI integrada compatible con el formato requerido."
            />
          )}
        </View>
      ) : null}

      {/* NETWORK */}
      {activeTab ===
        "network" &&
      !documentRequired ? (
        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionTitle
            }
          >
            <Wifi
              size={19}
              color={
                c.primary
              }
            />

            <ThemedText
              style={
                styles.sectionTitleText
              }
            >
              Térmica Wi‑Fi / LAN
            </ThemedText>
          </View>

          <Input
            label="Nombre"
            value={
              networkName
            }
            onChangeText={
              setNetworkName
            }
            placeholder="Impresora Boletería"
          />

          <Input
            label="IP privada"
            value={
              ipAddress
            }
            onChangeText={
              setIpAddress
            }
            placeholder="192.168.1.100"
            autoCapitalize="none"
          />

          <Input
            label="Puerto RAW"
            value={
              portText
            }
            onChangeText={
              setPortText
            }
            keyboardType="numeric"
            helperText="CatuDrive permite únicamente RAW TCP 9100."
          />

          <Button
            title="Preparar impresora de red"
            onPress={() => {
              try {
                const device =
                  buildNetworkDevice();

                void handleConnect(
                  device,
                );
              } catch (
                cause:
                  any
              ) {
                setLocalError(
                  cause?.message ??
                    "Configuración de red inválida.",
                );
              }
            }}
          />

          {(() => {
            try {
              const device =
                buildNetworkDevice();

              return renderDevice(
                device,
              );
            } catch {
              return null;
            }
          })()}
        </View>
      ) : null}

      {/* BLUETOOTH */}
      {activeTab ===
        "bluetooth" &&
      !documentRequired ? (
        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionTitle
            }
          >
            <Bluetooth
              size={19}
              color={
                c.primary
              }
            />

            <ThemedText
              style={
                styles.sectionTitleText
              }
            >
              Bluetooth emparejado
            </ThemedText>
          </View>

          <Button
            title={
              searchingBluetooth
                ? "Cargando..."
                : "Cargar emparejadas"
            }
            variant="secondary"
            disabled={
              searchingBluetooth
            }
            loading={
              searchingBluetooth
            }
            onPress={() =>
              void refreshBluetooth()
            }
          />

          {bluetoothDevices.filter(
            isCompatible,
          ).length > 0 ? (
            bluetoothDevices
              .filter(
                isCompatible,
              )
              .map(
                renderDevice,
              )
          ) : (
            <EmptyState
              icon="bluetooth-outline"
              title="Sin impresoras Bluetooth"
              subtitle="Empareja primero la impresora desde Android y vuelve a cargar la lista."
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      width:
        "100%",
      gap:
        14,
    },

    grow: {
      flex:
        1,
    },

    requirementCard: {
      gap:
        10,
    },

    requirementTop: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap:
        10,
    },

    requirementTitle: {
      fontSize:
        13,
      fontWeight:
        "800",
    },

    currentCard: {
      gap:
        10,
    },

    currentTop: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap:
        12,
    },

    currentIcon: {
      width:
        44,
      height:
        44,
      borderRadius:
        12,
      alignItems:
        "center",
      justifyContent:
        "center",
    },

    currentInfo: {
      flex:
        1,
      minWidth:
        0,
    },

    currentLabel: {
      fontSize:
        10,
      fontWeight:
        "700",
      textTransform:
        "uppercase",
    },

    currentName: {
      marginTop:
        3,
      fontSize:
        14,
      fontWeight:
        "800",
    },

    securityCard: {
      gap:
        0,
    },

    security: {
      flexDirection:
        "row",
      alignItems:
        "flex-start",
      gap:
        10,
    },

    securityText: {
      flex:
        1,
      fontSize:
        11,
      lineHeight:
        17,
    },

    tabs: {
      flexDirection:
        "row",
      flexWrap:
        "wrap",
      gap:
        8,
    },

    errorCard: {
      borderWidth:
        1,
    },

    section: {
      width:
        "100%",
      gap:
        12,
    },

    sectionTitle: {
      flexDirection:
        "row",
      alignItems:
        "center",
      gap:
        8,
    },

    sectionTitleText: {
      fontSize:
        14,
      fontWeight:
        "800",
    },
  });
