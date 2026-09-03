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
  StyleSheet,
  View,
} from "react-native";

import Toast from "react-native-toast-message";

import {
  Chofer,
} from "../types/chofer.types";

import {
  imprimirCarnetChofer,
} from "../utils/choferCarnet";

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
  | SIN CHOFER
  |--------------------------------------------------------------------------
  |
  | No renderizamos un Modal vacío.
  |
  | Esto también evita el error:
  |
  | Property 'children' is missing in type...
  |
  */

  if (!chofer) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | IMPRIMIR
  |--------------------------------------------------------------------------
  */

  const imprimir =
    async () => {
      try {
        await imprimirCarnetChofer(
          chofer,
        );
      } catch (
        error
      ) {
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
      }
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
        onClose
      }

      closeOnBackdropPress={
        !qrLoading
      }

      width="96%"

      maxWidth={
        820
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
              qrLoading
            }

            onPress={
              onClose
            }
          />

          <Visibility
            action="Ver"

            selector=".choferes-imprimir"
          >
            <Button
              title="Imprimir carnet"

              disabled={
                qrLoading
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
              qrLoading
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
      gap: 12,
    },

    identity: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      gap: 16,
    },

    photo: {
      width: 120,

      height: 148,

      borderWidth: 1,

      borderRadius: 14,

      overflow:
        "hidden",

      alignItems:
        "center",

      justifyContent:
        "center",

      flexShrink: 0,
    },

    photoImage: {
      width:
        "100%",

      height:
        "100%",
    },

    data: {
      flex: 1,

      minWidth: 230,

      gap: 7,
    },

    name: {
      fontSize: 20,

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

      gap: 10,
    },
  });