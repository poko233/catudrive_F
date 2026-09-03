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
  Chofer,
} from "../types/chofer.types";

type Props = {
  visible: boolean;

  chofer:
    | Chofer
    | null;

  loading: boolean;

  onClose: () => void;

  onConfirm: (
    chofer:
      Chofer,
  ) => Promise<void>;
};

export function ChoferBajaModal({
  visible,

  chofer,

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
      title="Dar de baja al chofer"
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
              loading ||
              !chofer
            }
            onPress={() => {
              if (
                chofer
              ) {
                void onConfirm(
                  chofer,
                );
              }
            }}
          />
        </View>
      }
    >
      {chofer ? (
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
            El registro no será eliminado físicamente.
            El chofer quedará inactivo y se conservará
            todo su historial de asignaciones.
          </ThemedText>

          <View
            style={[
              styles.box,

              {
                borderColor:
                  c.border,

                backgroundColor:
                  c.backgroundSecondary,
              },
            ]}
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

            <ThemedText
              style={{
                color:
                  c.textSecondary,
              }}
            >
              Carnet sindical:{" "}
              {
                chofer.carnet_sindical
              }
            </ThemedText>

            <ThemedText
              style={{
                color:
                  c.textSecondary,
              }}
            >
              C.I.:{" "}
              {
                chofer.carnet_identidad
              }
            </ThemedText>

            <View
              style={{
                alignSelf:
                  "flex-start",
              }}
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
      ) : null}
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    content: {
      gap: 14,
    },

    box: {
      borderWidth: 1,

      borderRadius: 12,

      padding: 14,

      gap: 6,
    },

    name: {
      fontSize: 16,

      fontWeight:
        "900",
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