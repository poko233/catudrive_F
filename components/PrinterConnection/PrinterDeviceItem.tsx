import {
  Bluetooth,
  CheckCircle2,
  MonitorCog,
  Smartphone,
  Wifi,
} from "lucide-react-native";

import {
  StyleSheet,
  View,
} from "react-native";

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
  ThemedText,
} from "@/components/ThemedText";

import {
  useTheme,
} from "@/theme/useTheme";

import type {
  PrinterDevice,
} from "@/services/printer";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface Props {
  device:
    PrinterDevice;

  connected?:
    boolean;

  isDefault?:
    boolean;

  busy?:
    boolean;

  onConnect?:
    () => void;

  onDisconnect?:
    () => void;

  onSetDefault?:
    () => void;

  onTest?:
    () => void;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function PrinterDeviceItem({
  device,

  connected =
    false,

  isDefault =
    false,

  busy =
    false,

  onConnect,

  onDisconnect,

  onSetDefault,

  onTest,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const Icon =
    device.connectionType ===
      "bluetooth"
      ? Bluetooth
      : device.connectionType ===
          "network"
        ? Wifi
        : device.connectionType ===
            "sunmi"
          ? Smartphone
          : MonitorCog;

  const detail =
    device.connectionType ===
    "network"
      ? `${device.ipAddress}:${device.port}`
      : device.connectionType ===
          "bluetooth"
        ? device.macAddress ??
          "Dispositivo emparejado"
        : device.connectionType ===
            "sunmi"
          ? `Impresora integrada · ${device.paperWidthMm ?? 58} mm`
          : "Diálogo de impresión del sistema";

  return (
    <Card
      style={
        styles.card
      }
    >
      <View
        style={
          styles.top
        }
      >
        <View
          style={[
            styles.icon,

            {
              backgroundColor:
                c.primarySubtle,
            },
          ]}
        >
          <Icon
            size={
              21
            }
            color={
              c.primary
            }
          />
        </View>

        <View
          style={
            styles.info
          }
        >
          <ThemedText
            style={
              styles.name
            }
          >
            {
              device.name
            }
          </ThemedText>

          <ThemedText
            style={[
              styles.detail,

              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            {detail}
          </ThemedText>

          {device.model ? (
            <ThemedText
              style={[
                styles.meta,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              {
                device.manufacturer ??
                ""
              }{" "}
              {
                device.model
              }
            </ThemedText>
          ) : null}
        </View>

        <View
          style={
            styles.badges
          }
        >
          {connected ? (
            <Badge
              label="Conectada"
              variant="success"
            />
          ) : (
            <Badge
              label={
                device.connectionType ===
                "sunmi"
                  ? "Disponible"
                  : "Desconectada"
              }
              variant={
                device.connectionType ===
                "sunmi"
                  ? "info"
                  : "muted"
              }
            />
          )}

          {isDefault ? (
            <Badge
              label="Predeterminada"
              variant="info"
            />
          ) : null}
        </View>
      </View>

      <View
        style={
          styles.actions
        }
      >
        {connected ? (
          <Button
            title="Desconectar"
            variant="secondary"
            disabled={
              busy
            }
            onPress={
              onDisconnect ??
              (() => {})
            }
          />
        ) : (
          <Button
            title={
              device.connectionType ===
              "sunmi"
                ? "Usar impresora"
                : "Conectar"
            }
            disabled={
              busy
            }
            loading={
              busy
            }
            onPress={
              onConnect ??
              (() => {})
            }
          />
        )}

        <Button
          title="Probar"
          variant="secondary"
          disabled={
            busy
          }
          onPress={
            onTest ??
            (() => {})
          }
        />

        {!isDefault ? (
          <Button
            title="Usar por defecto"
            variant="ghost"
            disabled={
              busy
            }
            onPress={
              onSetDefault ??
              (() => {})
            }
          />
        ) : (
          <View
            style={
              styles.defaultInfo
            }
          >
            <CheckCircle2
              size={
                16
              }
              color={
                c.success
              }
            />

            <ThemedText
              style={[
                styles.defaultText,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              Impresora guardada
            </ThemedText>
          </View>
        )}
      </View>
    </Card>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    card: {
      width:
        "100%",

      gap:
        14,
    },

    top: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,
    },

    icon: {
      width:
        42,

      height:
        42,

      borderRadius:
        11,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    info: {
      flex:
        1,

      minWidth:
        0,
    },

    name: {
      fontSize:
        14,

      fontWeight:
        "800",
    },

    detail: {
      marginTop:
        3,

      fontSize:
        12,
    },

    meta: {
      marginTop:
        2,

      fontSize:
        10,
    },

    badges: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "flex-end",

      gap:
        6,
    },

    actions: {
      flexDirection:
        "row",

      alignItems:
        "center",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    defaultInfo: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        6,

      paddingHorizontal:
        8,
    },

    defaultText: {
      fontSize:
        12,

      fontWeight:
        "600",
    },
  });
