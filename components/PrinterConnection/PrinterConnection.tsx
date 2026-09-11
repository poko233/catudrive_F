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
  printerService,
} from "@/services/printer";

import type {
  PrinterConnectionType,
  PrinterDevice,
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
  autoDiscover?: boolean;
  initialTab?: Tab;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function PrinterConnection({
  autoDiscover = false,
  initialTab = "system",
}: PrinterConnectionProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    defaultPrinter,

    activePrinter,

    sunmiPrinter,

    bluetoothDevices,

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
    useState<
      string | null
    >(
      null,
    );

  const [
    localError,
    setLocalError,
  ] =
    useState<
      string | null
    >(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | AUTO DISCOVERY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    if (!autoDiscover || Platform.OS === "web") {
      return;
    }

    void Promise.allSettled([
      refreshSunmi(),
      refreshBluetooth(),
    ]);
  }, [autoDiscover, refreshBluetooth, refreshSunmi]);

  useEffect(() => {
    if (!autoDiscover || defaultPrinter) {
      return;
    }

    if (sunmiPrinter) {
      setActiveTab("sunmi");
      return;
    }

    if (bluetoothDevices.length > 0) {
      setActiveTab("bluetooth");
    }
  }, [
    autoDiscover,
    bluetoothDevices.length,
    defaultPrinter,
    sunmiPrinter,
  ]);

  /*
  |--------------------------------------------------------------------------
  | SYSTEM
  |--------------------------------------------------------------------------
  */

  const systemDevice =
    useMemo(
      () =>
        printerService.getSystemPrinter(),
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | NETWORK
  |--------------------------------------------------------------------------
  */

  const buildNetworkDevice =
    (): PrinterDevice => {
      return printerService.buildNetworkPrinter({
        name:
          networkName,

        ipAddress,

        port:
          Number(
            portText,
          ),
      });
    };

  /*
  |--------------------------------------------------------------------------
  | HELPERS
  |--------------------------------------------------------------------------
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
      defaultPrinter?.id ===
      device.id;

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
  |--------------------------------------------------------------------------
  | RENDER DEVICE
  |--------------------------------------------------------------------------
  */

  const renderDevice =
    (
      device:
        PrinterDevice,
    ) => (
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

  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={
        styles.container
      }
    >
      {/*
      |--------------------------------------------------------------------------
      | CURRENT
      |--------------------------------------------------------------------------
      */}

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
              size={
                23
              }

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
              Impresora predeterminada
            </ThemedText>

            <ThemedText
              style={[
                styles.currentName,

                {
                  color:
                    defaultPrinter
                      ? c.text
                      : c.textSecondary,
                },
              ]}
            >
              {
                defaultPrinter?.name ??
                "Sin configurar"
              }
            </ThemedText>
          </View>

          {defaultPrinter ? (
            <Badge
              label={
                defaultPrinter.connectionType ===
                "sunmi"
                  ? "SUNMI"
                  : defaultPrinter.connectionType
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

        {defaultPrinter ? (
          <Button
            title="Quitar predeterminada"

            variant="ghost"

            onPress={() =>
              void clearDefaultPrinter()
            }
          />
        ) : null}
      </Card>

      {/*
      |--------------------------------------------------------------------------
      | SECURITY
      |--------------------------------------------------------------------------
      */}

      <View
        style={[
          styles.security,

          {
            backgroundColor:
              c.backgroundSecondary,

            borderColor:
              c.border,
          },
        ]}
      >
        <ShieldCheck
          size={
            20
          }

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
          CatuDrive permite la impresora integrada SUNMI mediante su servicio local, IP privadas por el puerto 9100 y Bluetooth previamente emparejado. No se guardan contraseñas ni documentos impresos.
        </ThemedText>
      </View>

      {/*
      |--------------------------------------------------------------------------
      | TABS
      |--------------------------------------------------------------------------
      */}

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
      </View>

      {/*
      |--------------------------------------------------------------------------
      | ERRORS
      |--------------------------------------------------------------------------
      */}

      {localError ||
      error ? (
        <View
          style={[
            styles.error,

            {
              borderColor:
                c.destructive,

              backgroundColor:
                c.backgroundSecondary,
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
        </View>
      ) : null}

      {/*
      |--------------------------------------------------------------------------
      | SYSTEM
      |--------------------------------------------------------------------------
      */}

      {activeTab ===
      "system" ? (
        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <MonitorCog
              size={
                20
              }

              color={
                c.primary
              }
            />

            <View>
              <ThemedText
                style={
                  styles.sectionTitle
                }
              >
                Impresión del sistema
              </ThemedText>

              <ThemedText
                style={[
                  styles.sectionDescription,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Recomendado para hojas Carta, A4, PDF, carnets y documentos generales.
              </ThemedText>
            </View>
          </View>

          {
            renderDevice(
              systemDevice,
            )
          }
        </View>
      ) : null}

      {/*
      |--------------------------------------------------------------------------
      | SUNMI
      |--------------------------------------------------------------------------
      */}

      {activeTab ===
      "sunmi" ? (
        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <Smartphone
              size={
                20
              }

              color={
                c.primary
              }
            />

            <View
              style={
                styles.sectionHeaderInfo
              }
            >
              <ThemedText
                style={
                  styles.sectionTitle
                }
              >
                SUNMI integrada
              </ThemedText>

              <ThemedText
                style={[
                  styles.sectionDescription,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Usa directamente la impresora térmica de 58 mm integrada en SUNMI V2 PRO y otros equipos compatibles.
              </ThemedText>
            </View>

            <Button
              title="Detectar"

              variant="secondary"

              loading={
                checkingSunmi
              }

              disabled={
                checkingSunmi ||
                Platform.OS !==
                  "android"
              }

              onPress={() =>
                void refreshSunmi()
              }
            />
          </View>

          {Platform.OS !==
          "android" ? (
            <View
              style={[
                styles.empty,

                {
                  borderColor:
                    c.border,
                },
              ]}
            >
              <ThemedText
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                La impresora integrada SUNMI solo se habilita en la aplicación Android. En web continúa disponible la impresión del sistema.
              </ThemedText>
            </View>
          ) : sunmiPrinter ? (
            renderDevice(
              sunmiPrinter,
            )
          ) : (
            <View
              style={[
                styles.empty,

                {
                  borderColor:
                    c.border,
                },
              ]}
            >
              <ThemedText
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                No se detectó el servicio de impresión SUNMI. Esto es normal en un Android que no sea SUNMI o si el Development Build todavía no incluye la librería nativa.
              </ThemedText>
            </View>
          )}
        </View>
      ) : null}

      {/*
      |--------------------------------------------------------------------------
      | NETWORK
      |--------------------------------------------------------------------------
      */}

      {activeTab ===
      "network" ? (
        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <Wifi
              size={
                20
              }

              color={
                c.primary
              }
            />

            <View>
              <ThemedText
                style={
                  styles.sectionTitle
                }
              >
                Impresora de red
              </ThemedText>

              <ThemedText
                style={[
                  styles.sectionDescription,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Conexión manual segura para impresoras térmicas RAW/ESC-POS en la red local.
              </ThemedText>
            </View>
          </View>

          {Platform.OS ===
          "web" ? (
            <ThemedText
              style={{
                color:
                  c.textSecondary,
              }}
            >
              La conexión TCP directa no se habilita en navegador. En web utiliza la impresión del sistema.
            </ThemedText>
          ) : (
            <>
              <View
                style={
                  styles.form
                }
              >
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
                  label="IPv4 privada"

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

                  onChangeText={(
                    value,
                  ) =>
                    setPortText(
                      value.replace(
                        /\D/g,
                        "",
                      ),
                    )
                  }

                  keyboardType="number-pad"

                  editable={
                    false
                  }

                  helperText="Por seguridad CatuDrive utiliza únicamente el puerto 9100."
                />

                <Button
                  title="Preparar impresora"

                  onPress={() => {
                    try {
                      setLocalError(
                        null,
                      );

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
                          "Configuración inválida.",
                      );
                    }
                  }}
                />
              </View>

              {activePrinter?.connectionType ===
              "network" ? (
                renderDevice(
                  activePrinter,
                )
              ) : null}

              {defaultPrinter?.connectionType ===
                "network" &&
              defaultPrinter.id !==
                activePrinter?.id ? (
                renderDevice(
                  defaultPrinter,
                )
              ) : null}
            </>
          )}
        </View>
      ) : null}

      {/*
      |--------------------------------------------------------------------------
      | BLUETOOTH
      |--------------------------------------------------------------------------
      */}

      {activeTab ===
      "bluetooth" ? (
        <View
          style={
            styles.section
          }
        >
          <View
            style={
              styles.sectionHeader
            }
          >
            <Bluetooth
              size={
                20
              }

              color={
                c.primary
              }
            />

            <View
              style={
                styles.sectionHeaderInfo
              }
            >
              <ThemedText
                style={
                  styles.sectionTitle
                }
              >
                Bluetooth
              </ThemedText>

              <ThemedText
                style={[
                  styles.sectionDescription,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Solo mostramos dispositivos que ya fueron emparejados desde Android/iOS.
              </ThemedText>
            </View>

            <Button
              title="Cargar emparejadas"

              variant="secondary"

              loading={
                searchingBluetooth
              }

              disabled={
                searchingBluetooth
              }

              onPress={() =>
                void refreshBluetooth()
              }
            />
          </View>

          {Platform.OS ===
          "web" ? (
            <ThemedText
              style={{
                color:
                  c.textSecondary,
              }}
            >
              Bluetooth Classic no se habilita en la versión web.
            </ThemedText>
          ) : bluetoothDevices.length >
            0 ? (
            <View
              style={
                styles.devices
              }
            >
              {
                bluetoothDevices.map(
                  renderDevice,
                )
              }
            </View>
          ) : (
            <View
              style={[
                styles.empty,

                {
                  borderColor:
                    c.border,
                },
              ]}
            >
              <ThemedText
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                No hay dispositivos cargados. Empareja primero la impresora desde la configuración del sistema y luego pulsa “Cargar emparejadas”.
              </ThemedText>
            </View>
          )}
        </View>
      ) : null}
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    container: {
      width:
        "100%",

      gap:
        16,
    },

    currentCard: {
      gap:
        14,
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
        46,

      height:
        46,

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
    },

    currentLabel: {
      fontSize:
        11,

      fontWeight:
        "800",

      textTransform:
        "uppercase",
    },

    currentName: {
      marginTop:
        3,

      fontSize:
        15,

      fontWeight:
        "800",
    },

    security: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        10,

      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        13,
    },

    securityText: {
      flex:
        1,

      fontSize:
        12,

      lineHeight:
        18,
    },

    tabs: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    error: {
      borderWidth:
        1,

      borderRadius:
        10,

      padding:
        12,
    },

    section: {
      gap:
        14,
    },

    sectionHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,
    },

    sectionHeaderInfo: {
      flex:
        1,
    },

    sectionTitle: {
      fontSize:
        15,

      fontWeight:
        "900",
    },

    sectionDescription: {
      marginTop:
        3,

      fontSize:
        12,

      lineHeight:
        17,
    },

    form: {
      width:
        "100%",

      gap:
        12,
    },

    devices: {
      gap:
        10,
    },

    empty: {
      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        16,
    },
  });
