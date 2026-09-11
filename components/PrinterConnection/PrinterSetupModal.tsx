import {
  useEffect,
} from "react";

import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import {
  AlertTriangle,
  Printer as PrinterIcon,
} from "lucide-react-native";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  useTheme,
} from "@/theme/useTheme";

import type {
  PrinterDevice,
} from "@/services/printer";

import {
  PrinterConnection,
} from "./PrinterConnection";

import {
  usePrinterConnection,
} from "./usePrinterConnection";

interface Props {
  visible:
    boolean;

  /**
   * Si true, el modal no se cierra mientras no exista una impresora
   * predeterminada disponible.
   */
  required?:
    boolean;

  onClose?:
    () => void;

  onConfigured?:
    (
      device:
        PrinterDevice,
    ) => void;
}

export function PrinterSetupModal({
  visible,
  required =
    false,
  onClose,
  onConfigured,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    defaultPrinter,
    activePrinter,
    configurationRequired,
  } =
    usePrinterConnection();

  /*
  |--------------------------------------------------------------------------
  | CERRAR AL TERMINAR CONFIGURACIÓN
  |--------------------------------------------------------------------------
  */

  const configured =
    Boolean(
      defaultPrinter &&
        !configurationRequired &&
        (
          activePrinter?.id ===
            defaultPrinter.id ||
          defaultPrinter.connectionType ===
            "system"
        ),
    );

  useEffect(() => {
    if (
      visible &&
      configured &&
      defaultPrinter
    ) {
      onConfigured?.(
        defaultPrinter,
      );
    }
  }, [
    configured,
    defaultPrinter,
    onConfigured,
    visible,
  ]);

  const handleClose =
    () => {
      if (
        required &&
        !configured
      ) {
        return;
      }

      onClose?.();
    };

  return (
    <Modal
      visible={
        visible
      }
      title="Configurar impresora"
      onClose={
        handleClose
      }
      maxWidth={
        900
      }
      closeOnBackdropPress={
        !required ||
        configured
      }
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }
        contentContainerStyle={
          styles.content
        }
      >
        <View
          style={[
            styles.info,
            {
              backgroundColor:
                c.backgroundSecondary,
              borderColor:
                c.border,
            },
          ]}
        >
          {required ? (
            <AlertTriangle
              size={
                21
              }
              color={
                c.warning
              }
            />
          ) : (
            <PrinterIcon
              size={
                21
              }
              color={
                c.primary
              }
            />
          )}

          <View
            style={
              styles.infoText
            }
          >
            <ThemedText
              style={[
                styles.infoTitle,
                {
                  color:
                    c.text,
                },
              ]}
            >
              {required
                ? "Se necesita una impresora"
                : "Impresora de CatuDrive"}
            </ThemedText>

            <ThemedText
              style={[
                styles.infoDescription,
                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              {Platform.OS ===
              "web"
                ? "En web utiliza la impresión del sistema."
                : "CatuDrive buscará SUNMI y dispositivos Bluetooth previamente emparejados. También puedes configurar una impresora Wi‑Fi/LAN o usar la impresión del sistema."}
            </ThemedText>
          </View>
        </View>

        <PrinterConnection
          autoDiscover
          initialTab={
            Platform.OS ===
            "web"
              ? "system"
              : "bluetooth"
          }
        />
      </ScrollView>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    content: {
      gap:
        14,
      paddingBottom:
        8,
    },

    info: {
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
        12,
    },

    infoText: {
      flex:
        1,
      gap:
        3,
    },

    infoTitle: {
      fontSize:
        14,
      fontWeight:
        "800",
    },

    infoDescription: {
      fontSize:
        12,
      lineHeight:
        18,
    },
  });
