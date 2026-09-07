import {
  Printer,
} from "@/components/Printer";

import type {
  PrinterStage,
} from "@/components/Printer";

import {
  ThemedText,
} from "@/components/ThemedText";

import Visibility from "@/components/Visibility";

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
  Modal,
} from "@/components/ui/Modal";

import {
  QrState,
} from "@/components/ui/QrState";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  useEffect,
  useState,
} from "react";

import Toast from "react-native-toast-message";

import {
  Chofer,
} from "../types/chofer.types";

import {
  imprimirCarnetChofer,
} from "../utils/choferCarnet";

import {
  ChoferCarnetPreview,
} from "./ChoferCarnetPreview";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  visible: boolean;

  chofer:
    | Chofer
    | null;

  qrLoading: boolean;

  onClose: () => void;

  onRegenerarQr: (
    chofer: Chofer,
  ) => Promise<
    Chofer | null
  >;
};

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function ChoferCarnetModal({
  visible,

  chofer,

  qrLoading,

  onClose,

  onRegenerarQr,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | ESTADO DE IMPRESIÓN VISUAL
  |--------------------------------------------------------------------------
  */

  const [
    printStage,
    setPrintStage,
  ] =
    useState<PrinterStage>(
      "complete",
    );

  const [
    printing,
    setPrinting,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | RESET
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        visible
      ) {
        setPrintStage(
          "complete",
        );

        setPrinting(
          false,
        );
      }
    },

    [
      visible,
      chofer?.id,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | SIN CHOFER
  |--------------------------------------------------------------------------
  */

  if (!chofer) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | IMPRIMIR
  |--------------------------------------------------------------------------
  |
  | IMPORTANTE EN WEB:
  |
  | El popup de impresión debe abrirse como consecuencia directa
  | del click del usuario. Por eso no hacemos un delay antes de
  | llamar imprimirCarnetChofer() cuando Platform.OS === "web".
  |
  */

  const imprimir =
    async () => {
      if (
        printing ||
        qrLoading
      ) {
        return;
      }

      setPrinting(
        true,
      );

      setPrintStage(
        "processing",
      );

      try {
        /*
        |--------------------------------------------------------------------------
        | WEB
        |--------------------------------------------------------------------------
        */

        if (
          Platform.OS ===
          "web"
        ) {
          setPrintStage(
            "printing",
          );

          await imprimirCarnetChofer(
            chofer,
          );
        } else {
          /*
          |--------------------------------------------------------------------------
          | NATIVE
          |--------------------------------------------------------------------------
          |
          | Dejamos una transición visual corta.
          |
          */

          await new Promise<void>(
            (
              resolve,
            ) => {
              setTimeout(
                resolve,
                180,
              );
            },
          );

          setPrintStage(
            "printing",
          );

          await imprimirCarnetChofer(
            chofer,
          );
        }

        setPrintStage(
          "complete",
        );

        Toast.show({
          type:
            "info",

          text1:
            "Carnet enviado a impresión",

          text2:
            Platform.OS ===
            "web"
              ? "Se abrió el diálogo de impresión del navegador."
              : "Se abrió el diálogo de impresión del dispositivo.",
        });
      } catch (
        error
      ) {
        setPrintStage(
          "complete",
        );

        Toast.show({
          type:
            "error",

          text1:
            "No se pudo imprimir el carnet",

          text2:
            error instanceof
            Error
              ? error.message
              : "Intenta nuevamente.",
        });
      } finally {
        setPrinting(
          false,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR
  |--------------------------------------------------------------------------
  */

  const handleClose =
    () => {
      if (
        qrLoading ||
        printing
      ) {
        return;
      }

      onClose();
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <Modal
      visible={
        visible
      }

      title="Carnet Sindical"

      onClose={
        handleClose
      }

      closeOnBackdropPress={
        !qrLoading &&
        !printing
      }

      width="96%"

      maxWidth={
        940
      }

      footer={
        <View
          style={
            styles.footer
          }
        >
          <Button
            title="Cerrar"

            variant="secondary"

            disabled={
              qrLoading ||
              printing
            }

            onPress={
              handleClose
            }
          />

          <Visibility
            action="Ver"

            selector=".choferes-imprimir"
          >
            <Button
              title={
                printing
                  ? "Preparando impresión..."
                  : "Imprimir carnet"
              }

              loading={
                printing
              }

              disabled={
                qrLoading ||
                printing
              }

              onPress={() =>
                void imprimir()
              }
            />
          </Visibility>
        </View>
      }
    >
      <View
        style={
          styles.content
        }
      >
        {/*
        |--------------------------------------------------------------------------
        | IMPRESORA / VISTA PREVIA REAL
        |--------------------------------------------------------------------------
        */}

        <Card
          style={
            styles.previewCard
          }
        >
          <View
            style={
              styles.previewHeader
            }
          >
            <View>
              <ThemedText
                style={
                  styles.previewTitle
                }
              >
                Vista previa de impresión
              </ThemedText>

              <ThemedText
                style={[
                  styles.previewDescription,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Formato ID-1 · 85.6 × 54 mm
              </ThemedText>
            </View>

            <Badge
              label={
                printStage ===
                "complete"
                  ? "Listo"
                  : printStage ===
                      "printing"
                    ? "Imprimiendo"
                    : "Procesando"
              }
              variant={
                printStage ===
                "complete"
                  ? "success"
                  : printStage ===
                      "printing"
                    ? "info"
                    : "warning"
              }
            />
          </View>

          <View
            style={[
              styles.printerArea,

              {
                backgroundColor:
                  c.backgroundSecondary,

                borderColor:
                  c.border,
              },
            ]}
          >
            <Printer.Root
              stage={
                printStage
              }

              paperSize="custom"

              feedMotion="smooth"

              printingDuration={
                1200
              }

              machineMaxWidth={
                720
              }

              paperWidth="86%"

              outputHeight={
                430
              }

              customPaper={{
                aspectRatio:
                  85.6 /
                  54,

                minHeight:
                  260,

                serrated:
                  false,
              }}
            >
              <Printer.Machine>
                <Printer.Header>
                  <View
                    style={
                      styles.machineBrand
                    }
                  >
                    <View
                      style={
                        styles.machineLogo
                      }
                    >
                      <Text
                        style={
                          styles.machineLogoText
                        }
                      >
                        C
                      </Text>
                    </View>

                    <View>
                      <Text
                        style={
                          styles.machineTitle
                        }
                      >
                        CATUDRIVE
                      </Text>

                      <Text
                        style={
                          styles.machineSubtitle
                        }
                      >
                        Impresión de credencial
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.machineFormat
                    }
                  >
                    <Text
                      style={
                        styles.machineFormatText
                      }
                    >
                      ID-1
                    </Text>
                  </View>
                </Printer.Header>

                <Printer.Screen>
                  <View
                    style={
                      styles.screenTop
                    }
                  >
                    <View
                      style={
                        styles.screenInfo
                      }
                    >
                      <Text
                        style={
                          styles.screenTitle
                        }
                      >
                        {
                          chofer.nombre_completo
                        }
                      </Text>

                      <Text
                        style={
                          styles.screenSubtitle
                        }
                      >
                        Carnet sindical{" "}
                        {
                          chofer.carnet_sindical
                        }
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.screenSize
                      }
                    >
                      85.6 × 54 mm
                    </Text>
                  </View>

                  <Printer.Status />
                </Printer.Screen>
              </Printer.Machine>

              <Printer.Output>
                <Printer.Paper
                  padding={
                    0
                  }
                >
                  <ChoferCarnetPreview
                    chofer={
                      chofer
                    }
                  />
                </Printer.Paper>
              </Printer.Output>
            </Printer.Root>
          </View>

          <ThemedText
            style={[
              styles.printHint,

              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            En web se abrirá el diálogo de impresión del navegador. Selecciona una impresora instalada en Windows y verifica que el tamaño de papel sea 85.6 × 54 mm si utilizas una impresora de carnets.
          </ThemedText>
        </Card>

        {/*
        |--------------------------------------------------------------------------
        | INFORMACIÓN DEL CHOFER
        |--------------------------------------------------------------------------
        */}

        <Card>
          <View
            style={
              styles.identity
            }
          >
            {/*
            |--------------------------------------------------------------------------
            | FOTO
            |--------------------------------------------------------------------------
            */}

            <View
              style={[
                styles.photo,

                {
                  borderColor:
                    c.border,

                  backgroundColor:
                    c.backgroundSecondary,
                },
              ]}
            >
              {chofer.fotoUrl ? (
                <Image
                  source={{
                    uri:
                      chofer.fotoUrl,
                  }}

                  style={
                    styles.photoImage
                  }

                  resizeMode="cover"
                />
              ) : (
                <ThemedText
                  style={{
                    color:
                      c.textSecondary,
                  }}
                >
                  Sin foto
                </ThemedText>
              )}
            </View>

            {/*
            |--------------------------------------------------------------------------
            | DATOS
            |--------------------------------------------------------------------------
            */}

            <View
              style={
                styles.data
              }
            >
              <ThemedText
                style={
                  styles.name
                }
              >
                {
                  chofer.nombre_completo
                }
              </ThemedText>

              <ThemedText>
                Carnet sindical:{" "}

                <ThemedText
                  style={
                    styles.bold
                  }
                >
                  {
                    chofer.carnet_sindical
                  }
                </ThemedText>
              </ThemedText>

              <ThemedText>
                C.I.:{" "}

                <ThemedText
                  style={
                    styles.bold
                  }
                >
                  {
                    chofer.carnet_identidad
                  }
                </ThemedText>
              </ThemedText>

              <ThemedText>
                Teléfono:{" "}

                <ThemedText
                  style={
                    styles.bold
                  }
                >
                  {
                    chofer.telefono
                  }
                </ThemedText>
              </ThemedText>

              <ThemedText>
                Licencia:{" "}

                <ThemedText
                  style={
                    styles.bold
                  }
                >
                  {
                    chofer.numero_licencia
                  }

                  {" · "}

                  {
                    chofer.categoria_licencia
                  }
                </ThemedText>
              </ThemedText>

              <View
                style={
                  styles.badgeContainer
                }
              >
                <Badge
                  label={
                    chofer.estado
                  }

                  variant={
                    chofer.estado ===
                    "ACTIVO"
                      ? "success"
                      : "destructive"
                  }
                />
              </View>
            </View>
          </View>
        </Card>

        {/*
        |--------------------------------------------------------------------------
        | QR
        |--------------------------------------------------------------------------
        */}

        <Visibility
          action="Editar"

          selector=".choferes-qr"
        >
          <QrState
            qrUri={
              chofer.qrUrl
            }

            title="QR del carnet sindical"

            subtitle="Credencial QR asociada al chofer."

            emptyTitle="Sin código QR"

            emptySubtitle="Genera una credencial QR para este chofer."

            securityText="El código QR utiliza el mismo proceso de cifrado y generación configurado en el sistema."

            actionLabel={
              chofer.qrUrl
                ? "Regenerar QR"
                : "Generar QR"
            }

            actionLoading={
              qrLoading
            }

            actionDisabled={
              qrLoading ||
              printing
            }

            onAction={() =>
              void onRegenerarQr(
                chofer,
              )
            }
          />
        </Visibility>
      </View>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    content: {
      gap:
        14,
    },

    /*
    |--------------------------------------------------------------------------
    | PREVIEW
    |--------------------------------------------------------------------------
    */

    previewCard: {
      width:
        "100%",

      gap:
        14,
    },

    previewHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      flexWrap:
        "wrap",

      gap:
        10,
    },

    previewTitle: {
      fontSize:
        16,

      fontWeight:
        "900",
    },

    previewDescription: {
      marginTop:
        3,

      fontSize:
        11,
    },

    printerArea: {
      width:
        "100%",

      minHeight:
        580,

      paddingHorizontal:
        18,

      paddingTop:
        26,

      overflow:
        "hidden",

      alignItems:
        "center",

      borderWidth:
        1,

      borderRadius:
        14,
    },

    printHint: {
      fontSize:
        11,

      lineHeight:
        17,
    },

    /*
    |--------------------------------------------------------------------------
    | MACHINE
    |--------------------------------------------------------------------------
    */

    machineBrand: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        9,
    },

    machineLogo: {
      width:
        28,

      height:
        28,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius:
        5,

      backgroundColor:
        "#565656",
    },

    machineLogoText: {
      color:
        "#FFFFFF",

      fontSize:
        16,

      fontWeight:
        "900",
    },

    machineTitle: {
      color:
        "#FFFFFF",

      fontSize:
        12,

      fontWeight:
        "900",

      letterSpacing:
        0.8,
    },

    machineSubtitle: {
      marginTop:
        2,

      color:
        "#A6A6A6",

      fontSize:
        9,
    },

    machineFormat: {
      minHeight:
        28,

      paddingHorizontal:
        11,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth:
        1,

      borderColor:
        "#626262",

      borderRadius:
        14,

      backgroundColor:
        "#484848",
    },

    machineFormatText: {
      color:
        "#FFFFFF",

      fontSize:
        9,

      fontWeight:
        "900",

      letterSpacing:
        0.8,
    },

    screenTop: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      gap:
        12,
    },

    screenInfo: {
      flex:
        1,

      minWidth:
        0,
    },

    screenTitle: {
      color:
        "#FFFFFF",

      fontSize:
        13,

      fontWeight:
        "800",
    },

    screenSubtitle: {
      marginTop:
        4,

      color:
        "#A6A6A6",

      fontSize:
        10,
    },

    screenSize: {
      color:
        "#FFFFFF",

      fontSize:
        10,

      fontWeight:
        "800",
    },

    /*
    |--------------------------------------------------------------------------
    | DATOS
    |--------------------------------------------------------------------------
    */

    identity: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      gap:
        16,
    },

    photo: {
      width:
        120,

      height:
        148,

      borderWidth:
        1,

      borderRadius:
        14,

      overflow:
        "hidden",

      alignItems:
        "center",

      justifyContent:
        "center",

      flexShrink:
        0,
    },

    photoImage: {
      width:
        "100%",

      height:
        "100%",
    },

    data: {
      flex:
        1,

      minWidth:
        230,

      gap:
        7,
    },

    name: {
      fontSize:
        20,

      fontWeight:
        "900",
    },

    bold: {
      fontWeight:
        "900",
    },

    badgeContainer: {
      alignSelf:
        "flex-start",
    },

    footer: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "flex-end",

      gap:
        10,
    },
  });
