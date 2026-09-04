import {
  DatePicker,
} from "@/components/DatePickerModal";

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
  CalendarDays,
} from "lucide-react-native";

import {
  useEffect,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  Asignacion,
  FinalizarAsignacionPayload,
} from "../types/asignacionVehiculo.types";

type Props = {
  visible: boolean;

  asignacion:
    | Asignacion
    | null;

  loading: boolean;

  onClose:
    () => void;

  onConfirm: (
    asignacion:
      Asignacion,

    payload:
      FinalizarAsignacionPayload,
  ) => Promise<void>;
};

function hoy(): string {
  const date =
    new Date();

  return [
    date.getFullYear(),

    String(
      date.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    ),

    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    ),
  ].join(
    "-",
  );
}

function mostrarFecha(
  value: string,
): string {
  const [
    year,
    month,
    day,
  ] =
    value.split(
      "-",
    );

  return year &&
    month &&
    day
    ? `${day}/${month}/${year}`
    : value;
}

export function AsignacionFinalizarModal({
  visible,

  asignacion,

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

  const [
    fecha,
    setFecha,
  ] =
    useState(
      hoy(),
    );

  const [
    dateVisible,
    setDateVisible,
  ] =
    useState(
      false,
    );

  useEffect(
    () => {
      if (
        visible
      ) {
        setFecha(
          hoy(),
        );

        setDateVisible(
          false,
        );
      }
    },

    [
      visible,
      asignacion,
    ],
  );

  return (
    <>
      <Modal
        visible={
          visible
        }

        title="Finalizar asignación"

        onClose={
          onClose
        }

        closeOnBackdropPress={
          !loading
        }

        width="94%"

        maxWidth={
          540
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
              title="Finalizar"

              variant="destructive"

              loading={
                loading
              }

              disabled={
                loading ||
                !asignacion
              }

              onPress={() => {
                if (
                  asignacion
                ) {
                  void onConfirm(
                    asignacion,

                    {
                      fecha_finalizacion:
                        fecha,
                    },
                  );
                }
              }}
            />
          </View>
        }
      >
        {asignacion ? (
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
              El registro no será eliminado. Se cerrará el período de asignación y se conservará en el historial.
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
                  styles.title
                }
              >
                {
                  asignacion
                    .chofer
                    .nombre
                }
              </ThemedText>

              <ThemedText>
                {
                  asignacion
                    .vehiculo
                    .placa
                }
                {" · "}
                {
                  asignacion
                    .vehiculo
                    .marca
                }
                {" "}
                {
                  asignacion
                    .vehiculo
                    .modelo
                }
              </ThemedText>

              <View
                style={
                  styles.badge
                }
              >
                <Badge
                  label="ACTIVO"

                  variant="success"
                />
              </View>
            </View>

            <View
              style={
                styles.field
              }
            >
              <ThemedText
                style={[
                  styles.label,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Fecha de finalización
              </ThemedText>

              <Pressable
                disabled={
                  loading
                }

                onPress={() =>
                  setDateVisible(
                    true,
                  )
                }

                style={[
                  styles.dateButton,

                  {
                    backgroundColor:
                      c.input,

                    borderColor:
                      c.inputBorder,
                  },
                ]}
              >
                <CalendarDays
                  size={
                    18
                  }

                  color={
                    c.primary
                  }
                />

                <ThemedText
                  style={
                    styles.dateText
                  }
                >
                  {
                    mostrarFecha(
                      fecha,
                    )
                  }
                </ThemedText>
              </Pressable>
            </View>
          </View>
        ) : null}
      </Modal>

      <DatePicker
        visible={
          dateVisible
        }

        mode="single"

        title="Fecha de finalización"

        initialDate={
          fecha
        }

        minDate={
          asignacion
            ?.fecha_asignacion
        }

        maxDate={
          hoy()
        }

        onClose={() =>
          setDateVisible(
            false,
          )
        }

        onApply={(
          result,
        ) => {
          if (
            result.type !==
            "single"
          ) {
            return;
          }

          setFecha(
            result.date,
          );

          setDateVisible(
            false,
          );
        }}
      />
    </>
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

    field: {
      gap:
        6,
    },

    label: {
      fontSize:
        13,

      fontWeight:
        "600",
    },

    dateButton: {
      minHeight:
        46,

      borderWidth:
        1.5,

      borderRadius:
        10,

      paddingHorizontal:
        14,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        10,
    },

    dateText: {
      fontWeight:
        "700",
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