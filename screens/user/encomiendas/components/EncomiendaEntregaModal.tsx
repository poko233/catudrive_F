import {
  Button,
} from "@/components/ui/Button";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  Encomienda,
} from "../types/encomienda.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface EncomiendaEntregaModalProps {
  visible: boolean;

  encomienda:
    Encomienda | null;

  loading: boolean;

  onClose:
    () => void;

  onConfirm:
    (
      encomienda:
        Encomienda,
    ) => Promise<boolean>;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function EncomiendaEntregaModal({
  visible,

  encomienda,

  loading,

  onClose,

  onConfirm,
}: EncomiendaEntregaModalProps) {
  /*
  |--------------------------------------------------------------------------
  | CONFIRMAR
  |--------------------------------------------------------------------------
  */

  const confirmar =
    async () => {
      if (
        !encomienda ||
        loading
      ) {
        return;
      }

      const ok =
        await onConfirm(
          encomienda,
        );

      if (ok) {
        onClose();
      }
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  if (!encomienda) {
    return null;
  }

  return (
    <Modal
      visible={
        visible
      }

      title="Confirmar entrega"

      onClose={
        onClose
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
            title="Confirmar entrega"

            loading={
              loading
            }

            disabled={
              loading
            }

            onPress={() =>
              void confirmar()
            }
          />
        </View>
      }
    >
      <View
        style={
          styles.content
        }
      >
        <ThemedText
          style={
            styles.text
          }
        >
          ¿Confirmas que la encomienda fue entregada al destinatario?
        </ThemedText>

        <View
          style={
            styles.info
          }
        >
          <View
            style={
              styles.item
            }
          >
            <ThemedText
              style={
                styles.label
              }
            >
              Guía
            </ThemedText>

            <ThemedText
              style={
                styles.value
              }
            >
              {
                encomienda.guia ??
                "—"
              }
            </ThemedText>
          </View>

          <View
            style={
              styles.item
            }
          >
            <ThemedText
              style={
                styles.label
              }
            >
              Destinatario
            </ThemedText>

            <ThemedText
              style={
                styles.value
              }
            >
              {
                encomienda.destinatario?.nombre_completo ?? "—"
              }
            </ThemedText>
          </View>

          <View
            style={
              styles.item
            }
          >
            <ThemedText
              style={
                styles.label
              }
            >
              Destino
            </ThemedText>

            <ThemedText
              style={
                styles.value
              }
            >
              {
                encomienda.destino
              }
            </ThemedText>
          </View>

          {encomienda
            .viaje
            ?.vehiculo ? (
            <View
              style={
                styles.item
              }
            >
              <ThemedText
                style={
                  styles.label
                }
              >
                Vehículo
              </ThemedText>

              <ThemedText
                style={
                  styles.value
                }
              >
                {
                  encomienda
                    .viaje
                    .vehiculo
                    .placa
                }
              </ThemedText>
            </View>
          ) : null}
        </View>

        <ThemedText
          style={
            styles.warning
          }
        >
          Esta acción cambiará el estado de la encomienda a Entregada.
        </ThemedText>
      </View>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    content: {
      gap:
        16,
    },

    text: {
      fontSize:
        14,
    },

    info: {
      gap:
        10,
    },

    item: {
      gap:
        2,
    },

    label: {
      fontSize:
        12,

      opacity:
        0.7,
    },

    value: {
      fontSize:
        14,

      fontWeight:
        "700",
    },

    warning: {
      fontSize:
        12,

      fontWeight:
        "600",
    },

    footer: {
      flexDirection:
        "row",

      justifyContent:
        "flex-end",

      flexWrap:
        "wrap",

      gap:
        8,
    },
  });