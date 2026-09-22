import {
  DatePicker,
} from "@/components/DatePickerModal";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  TimePickerModal,
} from "@/components/TimePickerModal";

import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
} from "@/components/ui/Card";

import {
  IconButton,
} from "@/components/ui/IconButton";

import {
  Input,
} from "@/components/ui/Input";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  Select,
  SelectOption,
} from "@/components/ui/Select";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  CalendarDays,
  Clock3,
  X,
} from "lucide-react-native";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  EstadoRuta,
  Ruta,
  RutaForm,
  RutaPayload,
} from "../types/ruta.types";

type Props = {
  visible: boolean;

  ruta:
    | Ruta
    | null;

  saving: boolean;

  onClose:
    () => void;

  onSubmit: (
    ruta:
      | Ruta
      | null,

    payload:
      RutaPayload,
  ) => Promise<boolean>;
};

type DateTarget =
  | "fecha_inicio"
  | "fecha_fin";

type TimeTarget =
  | "hora_inicio"
  | "hora_fin";

/*
|--------------------------------------------------------------------------
| FORMULARIO NUEVO
|--------------------------------------------------------------------------
|
| La hora recomendada para una nueva ruta es 06:00.
|
| No queda bloqueada: el usuario puede abrir el TimePicker y cambiarla.
|
*/

function emptyForm():
  RutaForm {
  return {
    origen:
      "",

    destino:
      "",

    fecha_inicio:
      "",

    hora_inicio:
      "06:00",

    fecha_fin:
      "",

    hora_fin:
      "",

    tarifa:
      "0.00",

    estado:
      "ACTIVA",
  };
}

function mostrarFecha(
  value: string,
): string {
  if (!value) {
    return "Seleccionar fecha";
  }

  const [
    year,
    month,
    day,
  ] =
    value.split(
      "-",
    );

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

export function RutaFormModal({
  visible,
  ruta,
  saving,
  onClose,
  onSubmit,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const editing =
    !!ruta;

  const [
    form,
    setForm,
  ] =
    useState<RutaForm>(
      emptyForm(),
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    dateTarget,
    setDateTarget,
  ] =
    useState<
      DateTarget | null
    >(null);

  const [
    timeTarget,
    setTimeTarget,
  ] =
    useState<
      TimeTarget | null
    >(null);

  const estadoOptions =
    useMemo<
      SelectOption<EstadoRuta>[]
    >(
      () => [
        {
          value:
            "ACTIVA",

          label:
            "Activa",

          description:
            "Disponible para nuevas asignaciones.",
        },

        {
          value:
            "INACTIVA",

          label:
            "Inactiva",

          description:
            "No disponible para nuevas asignaciones.",
        },
      ],

      [],
    );

  /*
  |--------------------------------------------------------------------------
  | CARGAR FORMULARIO
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!visible) {
        return;
      }

      if (ruta) {
        setForm({
          origen:
            ruta.origen ??
            "",

          destino:
            ruta.destino ??
            "",

          fecha_inicio:
            ruta.fecha_inicio ??
            "",

          /*
           * Si editamos una ruta antigua sin hora,
           * también recomendamos 06:00.
           */
          hora_inicio:
            ruta.hora_inicio ??
            "06:00",

          fecha_fin:
            ruta.fecha_fin ??
            "",

          hora_fin:
            ruta.hora_fin ??
            "",

          tarifa:
            Number(
              ruta.tarifa ??
                0,
            ).toFixed(
              2,
            ),

          estado:
            ruta.estado,
        });
      } else {
        setForm(
          emptyForm(),
        );
      }

      setError(
        "",
      );

      setDateTarget(
        null,
      );

      setTimeTarget(
        null,
      );
    },

    [
      visible,
      ruta,
    ],
  );

  const update = <
    K extends keyof RutaForm,
  >(
    key: K,
    value: RutaForm[K],
  ) => {
    setForm(
      (
        current,
      ) => ({
        ...current,

        [key]:
          value,
      }),
    );

    setError(
      "",
    );
  };

  /*
  |--------------------------------------------------------------------------
  | VALIDAR
  |--------------------------------------------------------------------------
  */

  const validar =
    (): string | null => {
      if (
        !form.origen
          .trim()
      ) {
        return "El origen es obligatorio.";
      }

      if (
        !form.destino
          .trim()
      ) {
        return "El destino es obligatorio.";
      }

      if (
        !form.hora_inicio
      ) {
        return "La hora de inicio es obligatoria.";
      }

      const tarifa =
        Number(
          form.tarifa
            .replace(
              ",",
              ".",
            ),
        );

      if (
        !Number.isFinite(
          tarifa,
        )
      ) {
        return "La tarifa debe ser numérica.";
      }

      if (
        tarifa <
        0
      ) {
        return "La tarifa no puede ser negativa.";
      }

      if (
        form.fecha_inicio &&
        form.fecha_fin &&
        form.fecha_fin <
          form.fecha_inicio
      ) {
        return "La fecha de finalización no puede ser anterior a la fecha de inicio.";
      }

      if (
        form.fecha_inicio &&
        form.fecha_fin &&
        form.fecha_inicio ===
          form.fecha_fin &&
        form.hora_inicio &&
        form.hora_fin &&
        form.hora_fin <
          form.hora_inicio
      ) {
        return "En la misma fecha, la hora de finalización no puede ser anterior a la hora de inicio.";
      }

      return null;
    };

  /*
  |--------------------------------------------------------------------------
  | GUARDAR
  |--------------------------------------------------------------------------
  */

  const guardar =
    async () => {
      const validation =
        validar();

      if (
        validation
      ) {
        setError(
          validation,
        );

        return;
      }

      const payload:
        RutaPayload = {
          origen:
            form.origen
              .trim(),

          destino:
            form.destino
              .trim(),

          fecha_inicio:
            form.fecha_inicio ||
            null,

          hora_inicio:
            form.hora_inicio,

          fecha_fin:
            form.fecha_fin ||
            null,

          hora_fin:
            form.hora_fin ||
            null,

          tarifa:
            Number(
              form.tarifa
                .replace(
                  ",",
                  ".",
                ),
            ),

          estado:
            form.estado,
        };

      const ok =
        await onSubmit(
          ruta,
          payload,
        );

      if (ok) {
        onClose();
      }
    };

  const initialDate =
    dateTarget
      ? form[
          dateTarget
        ] ||
        undefined
      : undefined;

  const initialTime =
    timeTarget
      ? form[
          timeTarget
        ] ||
        undefined
      : undefined;

  return (
    <>
      <Modal
        visible={
          visible
        }

        title={
          editing
            ? "Modificar ruta"
            : "Registrar ruta"
        }

        onClose={
          onClose
        }

        closeOnBackdropPress={
          !saving
        }

        width="96%"

        maxWidth={
          1024
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
                saving
              }

              onPress={
                onClose
              }
            />

            <Button
              title={
                editing
                  ? "Guardar cambios"
                  : "Registrar ruta"
              }

              loading={
                saving
              }

              disabled={
                saving
              }

              onPress={
                guardar
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
          <Card
            style={
              styles.infoCard
            }
          >
            <ThemedText
              style={
                styles.infoTitle
              }
            >
              Datos de la ruta
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
              Registra el origen, destino y tarifa. La hora inicial recomendada es 06:00 y puedes cambiarla antes de guardar.
            </ThemedText>
          </Card>

          <View
            style={
              styles.grid
            }
          >
            <View
              style={
                styles.half
              }
            >
              <Input
                label="Origen"

                value={
                  form.origen
                }

                placeholder="Ej. Cochabamba"

                editable={
                  !saving
                }

                maxLength={
                  255
                }

                onChangeText={(
                  value,
                ) =>
                  update(
                    "origen",
                    value,
                  )
                }
              />
            </View>

            <View
              style={
                styles.half
              }
            >
              <Input
                label="Destino"

                value={
                  form.destino
                }

                placeholder="Ej. La Paz"

                editable={
                  !saving
                }

                maxLength={
                  255
                }

                onChangeText={(
                  value,
                ) =>
                  update(
                    "destino",
                    value,
                  )
                }
              />
            </View>
          </View>

          <Card
            style={
              styles.scheduleCard
            }
          >
            <ThemedText
              style={
                styles.sectionTitle
              }
            >
              Horario
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
              La hora de inicio se propone en 06:00. Puedes cambiarla libremente; las fechas y la finalización siguen siendo opcionales.
            </ThemedText>

            <ThemedText
              style={
                styles.subsectionTitle
              }
            >
              Inicio
            </ThemedText>

            <View
              style={
                styles.grid
              }
            >
              <View
                style={
                  styles.half
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
                  Fecha de inicio
                </ThemedText>

                <View
                  style={
                    styles.selectorRow
                  }
                >
                  <Pressable
                    disabled={
                      saving
                    }

                    onPress={() =>
                      setDateTarget(
                        "fecha_inicio",
                      )
                    }

                    style={[
                      styles.selector,

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
                        19
                      }

                      color={
                        c.primary
                      }
                    />

                    <ThemedText
                      numberOfLines={
                        1
                      }

                      style={[
                        styles.selectorText,

                        {
                          color:
                            form.fecha_inicio
                              ? c.text
                              : c.textMuted,
                        },
                      ]}
                    >
                      {
                        mostrarFecha(
                          form.fecha_inicio,
                        )
                      }
                    </ThemedText>
                  </Pressable>

                  {form.fecha_inicio ? (
                    <IconButton
                      icon={
                        X
                      }

                      size="sm"

                      variant="secondary"

                      accessibilityLabel="Quitar fecha de inicio"

                      disabled={
                        saving
                      }

                      onPress={() =>
                        update(
                          "fecha_inicio",
                          "",
                        )
                      }
                    />
                  ) : null}
                </View>
              </View>

              <View
                style={
                  styles.half
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
                  Hora de inicio
                </ThemedText>

                <View
                  style={
                    styles.selectorRow
                  }
                >
                  <Pressable
                    disabled={
                      saving
                    }

                    onPress={() =>
                      setTimeTarget(
                        "hora_inicio",
                      )
                    }

                    style={[
                      styles.selector,

                      {
                        backgroundColor:
                          c.input,

                        borderColor:
                          c.inputBorder,
                      },
                    ]}
                  >
                    <Clock3
                      size={
                        19
                      }

                      color={
                        c.primary
                      }
                    />

                    <ThemedText
                      numberOfLines={
                        1
                      }

                      style={[
                        styles.selectorText,

                        {
                          color:
                            c.text,
                        },
                      ]}
                    >
                      {
                        form.hora_inicio
                      }
                    </ThemedText>
                  </Pressable>
                </View>

                <ThemedText
                  style={[
                    styles.recommendation,

                    {
                      color:
                        c.textMuted,
                    },
                  ]}
                >
                  Hora recomendada inicial: 06:00. Toca el campo para cambiarla.
                </ThemedText>
              </View>
            </View>

            <ThemedText
              style={
                styles.subsectionTitle
              }
            >
              Finalización
            </ThemedText>

            <View
              style={
                styles.grid
              }
            >
              <View
                style={
                  styles.half
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

                <View
                  style={
                    styles.selectorRow
                  }
                >
                  <Pressable
                    disabled={
                      saving
                    }

                    onPress={() =>
                      setDateTarget(
                        "fecha_fin",
                      )
                    }

                    style={[
                      styles.selector,

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
                        19
                      }

                      color={
                        c.primary
                      }
                    />

                    <ThemedText
                      numberOfLines={
                        1
                      }

                      style={[
                        styles.selectorText,

                        {
                          color:
                            form.fecha_fin
                              ? c.text
                              : c.textMuted,
                        },
                      ]}
                    >
                      {
                        mostrarFecha(
                          form.fecha_fin,
                        )
                      }
                    </ThemedText>
                  </Pressable>

                  {form.fecha_fin ? (
                    <IconButton
                      icon={
                        X
                      }

                      size="sm"

                      variant="secondary"

                      accessibilityLabel="Quitar fecha final"

                      disabled={
                        saving
                      }

                      onPress={() =>
                        update(
                          "fecha_fin",
                          "",
                        )
                      }
                    />
                  ) : null}
                </View>
              </View>

              <View
                style={
                  styles.half
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
                  Hora de finalización
                </ThemedText>

                <View
                  style={
                    styles.selectorRow
                  }
                >
                  <Pressable
                    disabled={
                      saving
                    }

                    onPress={() =>
                      setTimeTarget(
                        "hora_fin",
                      )
                    }

                    style={[
                      styles.selector,

                      {
                        backgroundColor:
                          c.input,

                        borderColor:
                          c.inputBorder,
                      },
                    ]}
                  >
                    <Clock3
                      size={
                        19
                      }

                      color={
                        c.primary
                      }
                    />

                    <ThemedText
                      numberOfLines={
                        1
                      }

                      style={[
                        styles.selectorText,

                        {
                          color:
                            form.hora_fin
                              ? c.text
                              : c.textMuted,
                        },
                      ]}
                    >
                      {
                        form.hora_fin ||
                        "Seleccionar hora"
                      }
                    </ThemedText>
                  </Pressable>

                  {form.hora_fin ? (
                    <IconButton
                      icon={
                        X
                      }

                      size="sm"

                      variant="secondary"

                      accessibilityLabel="Quitar hora final"

                      disabled={
                        saving
                      }

                      onPress={() =>
                        update(
                          "hora_fin",
                          "",
                        )
                      }
                    />
                  ) : null}
                </View>
              </View>
            </View>
          </Card>

          <View
            style={
              styles.grid
            }
          >
            <View
              style={
                styles.half
              }
            >
              <Input
                label="Tarifa (Bs.)"

                value={
                  form.tarifa
                }

                placeholder="0.00"

                keyboardType="decimal-pad"

                editable={
                  !saving
                }

                onChangeText={(
                  value,
                ) =>
                  update(
                    "tarifa",
                    value,
                  )
                }
              />
            </View>

            <View
              style={
                styles.half
              }
            >
              <Select<EstadoRuta>
                label="Estado"

                value={
                  form.estado
                }

                options={
                  estadoOptions
                }

                disabled={
                  saving
                }

                modalTitle="Estado de la ruta"

                onValueChange={(
                  value,
                ) =>
                  update(
                    "estado",
                    value,
                  )
                }
              />
            </View>
          </View>

          {!!error && (
            <ThemedText
              style={[
                styles.error,

                {
                  color:
                    c.destructive,
                },
              ]}
            >
              {
                error
              }
            </ThemedText>
          )}
        </View>
      </Modal>

      <DatePicker
        visible={
          dateTarget !==
          null
        }

        mode="single"

        title={
          dateTarget ===
          "fecha_fin"
            ? "Fecha de finalización"
            : "Fecha de inicio"
        }

        initialDate={
          initialDate
        }

        minDate={
          dateTarget ===
            "fecha_fin" &&
          form.fecha_inicio
            ? form.fecha_inicio
            : undefined
        }

        onClose={() =>
          setDateTarget(
            null,
          )
        }

        onApply={(
          result,
        ) => {
          if (
            result.type !==
              "single" ||
            !dateTarget
          ) {
            return;
          }

          update(
            dateTarget,
            result.date,
          );

          setDateTarget(
            null,
          );
        }}
      />

      <TimePickerModal
        visible={
          timeTarget !==
          null
        }

        title={
          timeTarget ===
          "hora_fin"
            ? "Hora de finalización"
            : "Hora de inicio"
        }

        initialTime={
          initialTime
        }

        format="24h"

        allowFormatChange

        onClose={() =>
          setTimeTarget(
            null,
          )
        }

        onApply={(
          result,
        ) => {
          if (
            !timeTarget
          ) {
            return;
          }

          update(
            timeTarget,
            result.time,
          );

          setTimeTarget(
            null,
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
        16,
    },

    infoCard: {
      gap:
        4,
    },

    infoTitle: {
      fontSize:
        16,

      fontWeight:
        "900",
    },

    infoDescription: {
      fontSize:
        12,

      lineHeight:
        18,
    },

    scheduleCard: {
      gap:
        14,
    },

    sectionTitle: {
      fontSize:
        16,

      fontWeight:
        "900",
    },

    sectionDescription: {
      fontSize:
        12,

      lineHeight:
        18,
    },

    subsectionTitle: {
      fontSize:
        14,

      fontWeight:
        "900",

      marginTop:
        2,
    },

    grid: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        14,
    },

    half: {
      flex:
        1,

      minWidth:
        260,

      gap:
        6,
    },

    label: {
      fontSize:
        13,

      fontWeight:
        "600",
    },

    selectorRow: {
      width:
        "100%",

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        7,
    },

    selector: {
      flex:
        1,

      minWidth:
        0,

      minHeight:
        52,

      borderWidth:
        1.5,

      borderRadius:
        10,

      paddingHorizontal:
        16,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,
    },

    selectorText: {
      flex:
        1,

      minWidth:
        0,

      fontSize:
        14,

      fontWeight:
        "700",
    },

    recommendation: {
      fontSize:
        11,

      lineHeight:
        16,
    },

    error: {
      fontSize:
        12,

      fontWeight:
        "700",

      textAlign:
        "center",
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
