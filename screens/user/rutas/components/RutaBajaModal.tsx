import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Badge,
} from "@/components/ui/Badge";

import {
  Button,
} from "@/components/ui/Button";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  Ruta,
} from "../types/ruta.types";

type Props = {
  visible: boolean;

  ruta:
    | Ruta
    | null;

  loading: boolean;

  onClose:
    () => void;

  onConfirm: (
    ruta:
      Ruta,
  ) => Promise<void>;
};

export function RutaBajaModal({
  visible,

  ruta,

  loading,

  onClose,

  onConfirm,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  return (
    <Modal
      visible={
        visible
      }

      title="Dar de baja la ruta"

      onClose={
        onClose
      }

      closeOnBackdropPress={
        !loading
      }

      width="94%"

      maxWidth={
        520
      }

      footer={
        <View
          style={
            styles.footer
          }
        >
          <Button
            title="Cancelar"

            variant="secondary"

            disabled={
              loading
            }

            onPress={
              onClose
            }
          />

          <Button
            title="Dar de baja"

            variant="destructive"

            loading={
              loading
            }

            disabled={
              !ruta ||
              loading
            }

            onPress={() => {
              if (ruta) {
                void onConfirm(
                  ruta,
                );
              }
            }}
          />
        </View>
      }
    >
      {ruta ? (
        <View
          style={
            styles.content
          }
        >
          <ThemedText
            style={{
              color:
                c.textSecondary,
            }}
          >
            La ruta no será eliminada. Quedará inactiva para conservar su historial.
          </ThemedText>

          <View
            style={[
              styles.box,

              {
                backgroundColor:
                  c.backgroundSecondary,

                borderColor:
                  c.border,
              },
            ]}
          >
            <ThemedText
              style={
                styles.title
              }
            >
              {
                ruta.origen
              }
              {" → "}
              {
                ruta.destino
              }
            </ThemedText>

            <ThemedText>
              Tarifa: Bs.{" "}
              {
                Number(
                  ruta.tarifa,
                ).toFixed(
                  2,
                )
              }
            </ThemedText>

            <View
              style={
                styles.badge
              }
            >
              <Badge
                label={
                  ruta.estado
                }

                variant={
                  ruta.estado ===
                  "ACTIVA"
                    ? "success"
                    : "muted"
                }
              />
            </View>
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    content: {
      gap:
        14,
    },

    box: {
      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        14,

      gap:
        6,
    },

    title: {
      fontSize:
        16,

      fontWeight:
        "900",
    },

    badge: {
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