import {
  useEffect,
  useMemo,
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
  Card,
} from "@/components/ui/Card";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  getPrinterPaperLabel,
  printerService,
} from "@/services/printer";

import type {
  PrinterDevice,
  PrinterJobRequirement,
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
   * Indica que la pantalla necesita una impresora compatible.
   *
   * Ya NO bloquea el cierre del modal: el usuario puede cerrarlo
   * y configurar la impresora después desde Perfil.
   */
  required?:
    boolean;

  requirement?:
    PrinterJobRequirement | null;

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
  requirement =
    null,
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
    requestedRequirement,
    configurationRequired,
    error,
    getDefaultPrinterForRequirement,
    cancelPrinterRequest,
  } =
    usePrinterConnection();

  const effectiveRequirement =
    requestedRequirement ??
    requirement;

  const relevantDefault =
    useMemo(
      () => {
        if (
          effectiveRequirement
        ) {
          return getDefaultPrinterForRequirement(
            effectiveRequirement,
          );
        }

        return defaultPrinter;
      },
      [
        defaultPrinter,
        effectiveRequirement,
        getDefaultPrinterForRequirement,
      ],
    );

  const compatible =
    useMemo(
      () => {
        if (
          !relevantDefault
        ) {
          return false;
        }

        if (
          !effectiveRequirement
        ) {
          return true;
        }

        return printerService.checkCompatibility(
          relevantDefault,
          effectiveRequirement,
        ).compatible;
      },
      [
        effectiveRequirement,
        relevantDefault,
      ],
    );

  const configured =
    Boolean(
      relevantDefault &&
      compatible &&
      !configurationRequired,
    );

  const paperLabel =
    effectiveRequirement
      ? getPrinterPaperLabel(
          printerService.normalizeRequirement(
            effectiveRequirement,
          ).paperSize,
        )
      : null;

  useEffect(
    () => {
      if (
        visible &&
        configured &&
        relevantDefault
      ) {
        onConfigured?.(
          relevantDefault,
        );
      }
    },
    [
      configured,
      onConfigured,
      relevantDefault,
      visible,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | CERRAR
  |--------------------------------------------------------------------------
  |
  | Antes required=true impedía cerrar si todavía no había impresora.
  | Ahora siempre limpiamos la solicitud y dejamos cerrar el modal.
  |
  */

  const handleClose =
    () => {
      cancelPrinterRequest();
      onClose?.();
    };

  const title =
    paperLabel
      ? `Seleccionar impresora · ${paperLabel}`
      : "Configurar impresora";

  return (
    <Modal
      visible={
        visible
      }

      title={
        title
      }

      onClose={
        handleClose
      }

      maxWidth={
        900
      }

      closeOnBackdropPress
    >
      <ScrollView
        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          styles.content
        }
      >
        <Card
          style={
            styles.infoCard
          }
        >
          <View
            style={
              styles.info
            }
          >
            {required ||
            error ? (
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
                style={
                  styles.infoTitle
                }
              >
                {paperLabel
                  ? `Se necesita una impresora compatible con ${paperLabel}`
                  : required
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
                {error
                  ? error
                  : effectiveRequirement?.type ===
                      "document"
                    ? "La impresora térmica guardada para pasajes no se cambiará. Selecciona la impresión del sistema para Carta/A4 y CatuDrive la guardará como predeterminada de documentos."
                    : Platform.OS ===
                        "web"
                      ? "En web se utiliza la impresión del sistema."
                      : "Puedes utilizar SUNMI, una térmica Bluetooth, una térmica Wi‑Fi/LAN o la impresión del sistema."}
              </ThemedText>

              {required &&
              !configured ? (
                <ThemedText
                  style={[
                    styles.optionalNote,

                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  Puedes cerrar esta ventana y elegir la impresora más tarde desde Perfil.
                </ThemedText>
              ) : null}

              {relevantDefault &&
              effectiveRequirement &&
              !compatible ? (
                <ThemedText
                  style={[
                    styles.incompatible,

                    {
                      color:
                        c.destructive,
                    },
                  ]}
                >
                  {`${relevantDefault.name} no es compatible con ${paperLabel}.`}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </Card>

        <PrinterConnection
          autoDiscover

          requirement={
            effectiveRequirement
          }

          initialTab={
            effectiveRequirement?.type ===
              "document" ||
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

    infoCard: {
      gap:
        0,
    },

    info: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        10,
    },

    infoText: {
      flex:
        1,

      gap:
        4,
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

    optionalNote: {
      marginTop:
        4,

      fontSize:
        11,

      lineHeight:
        16,

      fontWeight:
        "600",
    },

    incompatible: {
      marginTop:
        4,

      fontSize:
        11,

      fontWeight:
        "700",
    },
  });
