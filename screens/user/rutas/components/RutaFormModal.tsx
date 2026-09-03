import {
  DatePicker,
} from "@/components/DatePickerModal";

import {
  TimePickerModal,
} from "@/components/TimePickerModal";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
} from "@/components/ui/Card";

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

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  visible: boolean;

  ruta?:
    | Ruta
    | null;

  saving: boolean;

  onClose:
    () => void;

  onSubmit: (
    payload:
      RutaPayload,

    ruta?:
      | Ruta
      | null,
  ) => Promise<boolean>;
};

/*
|--------------------------------------------------------------------------
| PICKERS ACTIVOS
|--------------------------------------------------------------------------
*/

type DatePickerField =
  | "inicio"
  | "fin"
  | null;

type TimePickerField =
  | "inicio"
  | "fin"
  | null;

/*
|--------------------------------------------------------------------------
| ESTADOS
|--------------------------------------------------------------------------
*/

const estadoOptions:
  SelectOption<EstadoRuta>[] =
    [
      {
        label:
          "Activa",

        value:
          "ACTIVA",

        description:
          "Disponible para nuevas asignaciones.",
      },

      {
        label:
          "Inactiva",

        value:
          "INACTIVA",

        description:
          "No disponible para nuevas asignaciones.",
      },
    ];

/*
|--------------------------------------------------------------------------
| FORMULARIO VACÍO
|--------------------------------------------------------------------------
*/

const EMPTY_FORM:
  RutaForm = {
    origen:
      "",

    destino:
      "",

    fecha_inicio:
      "",

    hora_inicio:
      "",

    fecha_fin:
      "",

    hora_fin:
      "",

    tarifa:
      "0.00",

    estado:
      "ACTIVA",
  };

/*
|--------------------------------------------------------------------------
| SEPARAR DATETIME DEL BACKEND
|--------------------------------------------------------------------------
|
| Entrada:
|
| 2026-09-03 08:30
|
| Salida:
|
| fecha = 2026-09-03
| hora  = 08:30
|
*/

function separarFechaHora(
  value:
    | string
    | null
    | undefined,
): {
  fecha: string;
  hora: string;
} {
  if (!value) {
    return {
      fecha:
        "",

      hora:
        "",
    };
  }

  const normalized =
    String(
      value,
    )
      .trim()
      .replace(
        "T",
        " ",
      );

  const [
    fecha = "",
    horaCompleta = "",
  ] =
    normalized.split(
      " ",
    );

  return {
    fecha:
      /^\d{4}-\d{2}-\d{2}$/.test(
        fecha,
      )
        ? fecha
        : "",

    hora:
      horaCompleta
        ? horaCompleta.substring(
            0,
            5,
          )
        : "",
  };
}

/*
|--------------------------------------------------------------------------
| UNIR FECHA + HORA
|--------------------------------------------------------------------------
*/

function unirFechaHora(
  fecha: string,
  hora: string,
):
  | string
  | null {
  const safeFecha =
    fecha.trim();

  const safeHora =
    hora.trim();

  if (
    !safeFecha ||
    !safeHora
  ) {
    return null;
  }

  return `${safeFecha} ${safeHora}`;
}

/*
|--------------------------------------------------------------------------
| MOSTRAR FECHA
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| CAMPO SELECTOR
|--------------------------------------------------------------------------
*/

type SelectorFieldProps = {
  label: string;

  value: string;

  placeholder: string;

  icon:
    typeof CalendarDays;

  disabled?: boolean;

  onPress:
    () => void;

  onClear?:
    () => void;
};

function SelectorField({
  label,

  value,

  placeholder,

  icon:
    Icon,

  disabled =
    false,

  onPress,

  onClear,
}: SelectorFieldProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  return (
    <View
      style={
        styles.selectorWrapper
      }
    >
      <ThemedText
        style={[
          styles.selectorLabel,

          {
            color:
              c.textSecondary,
          },
        ]}
      >
        {label}
      </ThemedText>

      <Pressable
        disabled={
          disabled
        }
        onPress={
          onPress
        }
        accessibilityRole="button"
        accessibilityState={{
          disabled,
        }}
        style={({
          pressed,
        }) => [
          styles.selector,

          {
            backgroundColor:
              c.input,

            borderColor:
              c.inputBorder,

            opacity:
              disabled
                ? 0.5
                : pressed
                  ? 0.78
                  : 1,
          },
        ]}
      >
        <View
          style={[
            styles.selectorIcon,

            {
              backgroundColor:
                c.backgroundSecondary,
            },
          ]}
        >
          <Icon
            size={
              18
            }
            color={
              c.primary
            }
          />
        </View>

        <ThemedText
          numberOfLines={
            1
          }
          style={[
            styles.selectorValue,

            {
              color:
                value
                  ? c.text
                  : c.textMuted,
            },
          ]}
        >
          {
            value ||
            placeholder
          }
        </ThemedText>

        {value &&
        onClear ? (
          <Pressable
            hitSlop={
              8
            }
            disabled={
              disabled
            }
            onPress={(
              event,
            ) => {
              event.stopPropagation();

              onClear();
            }}
            style={[
              styles.clearButton,

              {
                backgroundColor:
                  c.backgroundSecondary,
              },
            ]}
          >
            <X
              size={
                15
              }
              color={
                c.textSecondary
              }
            />
          </Pressable>
        ) : null}
      </Pressable>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

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

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [
    form,
    setForm,
  ] =
    useState<RutaForm>(
      EMPTY_FORM,
    );

  const [
    error,
    setError,
  ] =
    useState("");

  /*
  |--------------------------------------------------------------------------
  | PICKERS
  |--------------------------------------------------------------------------
  */

  const [
    datePickerField,
    setDatePickerField,
  ] =
    useState<DatePickerField>(
      null,
    );

  const [
    timePickerField,
    setTimePickerField,
  ] =
    useState<TimePickerField>(
      null,
    );

  const editing =
    !!ruta;

  /*
  |--------------------------------------------------------------------------
  | CARGAR FORM
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!visible) {
        return;
      }

      const inicio =
        separarFechaHora(
          ruta?.hora_inicio,
        );

      const fin =
        separarFechaHora(
          ruta?.hora_fin,
        );

      setForm(
        ruta
          ? {
              origen:
                ruta.origen ??
                "",

              destino:
                ruta.destino ??
                "",

              fecha_inicio:
                inicio.fecha,

              hora_inicio:
                inicio.hora,

              fecha_fin:
                fin.fecha,

              hora_fin:
                fin.hora,

              tarifa:
                Number(
                  ruta.tarifa ??
                    0,
                ).toFixed(
                  2,
                ),

              estado:
                ruta.estado ??
                "ACTIVA",
            }
          : {
              ...EMPTY_FORM,
            },
      );

      setError(
        "",
      );

      setDatePickerField(
        null,
      );

      setTimePickerField(
        null,
      );
    },

    [
      visible,
      ruta,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | UPDATE
  |--------------------------------------------------------------------------
  */

  const update = <
    K extends keyof RutaForm,
  >(
    key: K,

    value:
      RutaForm[K],
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

    if (error) {
      setError(
        "",
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | FECHA INICIAL DATE PICKER
  |--------------------------------------------------------------------------
  */

  const datePickerInitial =
    useMemo(
      () => {
        if (
          datePickerField ===
          "inicio"
        ) {
          return (
            form.fecha_inicio ||
            undefined
          );
        }

        if (
          datePickerField ===
          "fin"
        ) {
          return (
            form.fecha_fin ||
            form.fecha_inicio ||
            undefined
          );
        }

        return undefined;
      },

      [
        datePickerField,
        form.fecha_inicio,
        form.fecha_fin,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | HORA INICIAL TIME PICKER
  |--------------------------------------------------------------------------
  */

  const timePickerInitial =
    useMemo(
      () => {
        if (
          timePickerField ===
          "inicio"
        ) {
          return (
            form.hora_inicio ||
            undefined
          );
        }

        if (
          timePickerField ===
          "fin"
        ) {
          return (
            form.hora_fin ||
            form.hora_inicio ||
            undefined
          );
        }

        return undefined;
      },

      [
        timePickerField,
        form.hora_inicio,
        form.hora_fin,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | VALIDAR
  |--------------------------------------------------------------------------
  */

  const validar =
    (): string | null => {
      const origen =
        form.origen
          .trim();

      const destino =
        form.destino
          .trim();

      if (!origen) {
        return "El origen es obligatorio.";
      }

      if (!destino) {
        return "El destino es obligatorio.";
      }

      if (
        origen.toLowerCase() ===
        destino.toLowerCase()
      ) {
        return "El origen y el destino deben ser diferentes.";
      }

      /*
      |--------------------------------------------------------------------------
      | HORARIO INICIO
      |--------------------------------------------------------------------------
      */

      const tieneFechaInicio =
        !!form.fecha_inicio;

      const tieneHoraInicio =
        !!form.hora_inicio;

      if (
        tieneFechaInicio !==
        tieneHoraInicio
      ) {
        return "Debe seleccionar tanto la fecha como la hora de inicio.";
      }

      /*
      |--------------------------------------------------------------------------
      | HORARIO FIN
      |--------------------------------------------------------------------------
      */

      const tieneFechaFin =
        !!form.fecha_fin;

      const tieneHoraFin =
        !!form.hora_fin;

      if (
        tieneFechaFin !==
        tieneHoraFin
      ) {
        return "Debe seleccionar tanto la fecha como la hora de finalización.";
      }

      /*
      |--------------------------------------------------------------------------
      | SI HAY INICIO DEBE HABER FIN Y VICEVERSA
      |--------------------------------------------------------------------------
      */

      const tieneInicio =
        tieneFechaInicio &&
        tieneHoraInicio;

      const tieneFin =
        tieneFechaFin &&
        tieneHoraFin;

      if (
        tieneInicio !==
        tieneFin
      ) {
        return "Debe registrar tanto el horario de inicio como el horario de finalización.";
      }

      /*
      |--------------------------------------------------------------------------
      | COMPARAR HORARIOS
      |--------------------------------------------------------------------------
      |
      | YYYY-MM-DD HH:mm puede compararse lexicográficamente.
      |
      */

      if (
        tieneInicio &&
        tieneFin
      ) {
        const inicio =
          unirFechaHora(
            form.fecha_inicio,

            form.hora_inicio,
          );

        const fin =
          unirFechaHora(
            form.fecha_fin,

            form.hora_fin,
          );

        if (
          inicio &&
          fin &&
          fin <
            inicio
        ) {
          return "La fecha y hora de finalización no puede ser anterior al inicio.";
        }
      }

      /*
      |--------------------------------------------------------------------------
      | TARIFA
      |--------------------------------------------------------------------------
      */

      const tarifa =
        Number(
          String(
            form.tarifa,
          )
            .replace(
              ",",
              ".",
            )
            .trim(),
        );

      if (
        !Number.isFinite(
          tarifa,
        )
      ) {
        return "La tarifa debe ser un número válido.";
      }

      if (
        tarifa <
        0
      ) {
        return "La tarifa no puede ser negativa.";
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

      const tarifa =
        Number(
          form.tarifa
            .replace(
              ",",
              ".",
            )
            .trim(),
        );

      /*
      |--------------------------------------------------------------------------
      | UNIMOS NUEVAMENTE FECHA + HORA
      |--------------------------------------------------------------------------
      */

      const horaInicio =
        unirFechaHora(
          form.fecha_inicio,

          form.hora_inicio,
        );

      const horaFin =
        unirFechaHora(
          form.fecha_fin,

          form.hora_fin,
        );

      const payload:
        RutaPayload = {
          origen:
            form.origen
              .trim()
              .replace(
                /\s+/g,
                " ",
              ),

          destino:
            form.destino
              .trim()
              .replace(
                /\s+/g,
                " ",
              ),

          hora_inicio:
            horaInicio,

          hora_fin:
            horaFin,

          tarifa,

          estado:
            form.estado,
        };

      const ok =
        await onSubmit(
          payload,

          ruta,
        );

      if (ok) {
        onClose();
      }
    };

  /*
  |--------------------------------------------------------------------------
  | LIMPIAR HORARIO
  |--------------------------------------------------------------------------
  */

  const limpiarHorario =
    () => {
      setForm(
        (
          current,
        ) => ({
          ...current,

          fecha_inicio:
            "",

          hora_inicio:
            "",

          fecha_fin:
            "",

          hora_fin:
            "",
        }),
      );

      setError(
        "",
      );
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

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
          820
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
          {/*
          |--------------------------------------------------------------------------
          | INFORMACIÓN
          |--------------------------------------------------------------------------
          */}

          <Card
            style={
              styles.infoCard
            }
          >
            <ThemedText
              style={
                styles.sectionTitle
              }
            >
              Información de la ruta
            </ThemedText>

            <ThemedText
              style={[
                styles.helper,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              Registra el origen, destino y tarifa de la ruta.
            </ThemedText>
          </Card>

          <View
            style={
              styles.grid
            }
          >
            <View
              style={
                styles.field
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
                styles.field
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

          {/*
          |--------------------------------------------------------------------------
          | HORARIO
          |--------------------------------------------------------------------------
          */}

          <Card
            style={
              styles.infoCard
            }
          >
            <View
              style={
                styles.sectionHeader
              }
            >
              <View
                style={
                  styles.sectionCopy
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
                    styles.helper,

                    {
                      color:
                        c.textSecondary,
                    },
                  ]}
                >
                  Selecciona la fecha y la hora utilizando los componentes generales del sistema.
                </ThemedText>
              </View>

              {(
                form.fecha_inicio ||
                form.hora_inicio ||
                form.fecha_fin ||
                form.hora_fin
              ) ? (
                <Button
                  title="Limpiar"

                  variant="secondary"

                  disabled={
                    saving
                  }

                  onPress={
                    limpiarHorario
                  }
                />
              ) : null}
            </View>
          </Card>

          {/*
          |--------------------------------------------------------------------------
          | INICIO
          |--------------------------------------------------------------------------
          */}

          <View
            style={
              styles.scheduleBlock
            }
          >
            <ThemedText
              style={
                styles.scheduleTitle
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
                  styles.field
                }
              >
                <SelectorField
                  label="Fecha de inicio"

                  value={
                    form.fecha_inicio
                      ? mostrarFecha(
                          form.fecha_inicio,
                        )
                      : ""
                  }

                  placeholder="Seleccionar fecha"

                  icon={
                    CalendarDays
                  }

                  disabled={
                    saving
                  }

                  onPress={() =>
                    setDatePickerField(
                      "inicio",
                    )
                  }

                  onClear={() =>
                    update(
                      "fecha_inicio",

                      "",
                    )
                  }
                />
              </View>

              <View
                style={
                  styles.field
                }
              >
                <SelectorField
                  label="Hora de inicio"

                  value={
                    form.hora_inicio
                  }

                  placeholder="Seleccionar hora"

                  icon={
                    Clock3
                  }

                  disabled={
                    saving
                  }

                  onPress={() =>
                    setTimePickerField(
                      "inicio",
                    )
                  }

                  onClear={() =>
                    update(
                      "hora_inicio",

                      "",
                    )
                  }
                />
              </View>
            </View>
          </View>

          {/*
          |--------------------------------------------------------------------------
          | FINALIZACIÓN
          |--------------------------------------------------------------------------
          */}

          <View
            style={
              styles.scheduleBlock
            }
          >
            <ThemedText
              style={
                styles.scheduleTitle
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
                  styles.field
                }
              >
                <SelectorField
                  label="Fecha de finalización"

                  value={
                    form.fecha_fin
                      ? mostrarFecha(
                          form.fecha_fin,
                        )
                      : ""
                  }

                  placeholder="Seleccionar fecha"

                  icon={
                    CalendarDays
                  }

                  disabled={
                    saving
                  }

                  onPress={() =>
                    setDatePickerField(
                      "fin",
                    )
                  }

                  onClear={() =>
                    update(
                      "fecha_fin",

                      "",
                    )
                  }
                />
              </View>

              <View
                style={
                  styles.field
                }
              >
                <SelectorField
                  label="Hora de finalización"

                  value={
                    form.hora_fin
                  }

                  placeholder="Seleccionar hora"

                  icon={
                    Clock3
                  }

                  disabled={
                    saving
                  }

                  onPress={() =>
                    setTimePickerField(
                      "fin",
                    )
                  }

                  onClear={() =>
                    update(
                      "hora_fin",

                      "",
                    )
                  }
                />
              </View>
            </View>
          </View>

          {/*
          |--------------------------------------------------------------------------
          | TARIFA / ESTADO
          |--------------------------------------------------------------------------
          */}

          <View
            style={
              styles.grid
            }
          >
            <View
              style={
                styles.field
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
                styles.field
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

          {/*
          |--------------------------------------------------------------------------
          | ERROR
          |--------------------------------------------------------------------------
          */}

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
              {error}
            </ThemedText>
          )}
        </View>
      </Modal>

      {/*
      |--------------------------------------------------------------------------
      | DATE PICKER
      |--------------------------------------------------------------------------
      */}

      <DatePicker
        visible={
          datePickerField !==
          null
        }

        mode="single"

        title={
          datePickerField ===
          "inicio"
            ? "Fecha de inicio"
            : "Fecha de finalización"
        }

        initialDate={
          datePickerInitial
        }

        /*
         * Si seleccionamos finalización,
         * no permitimos una fecha anterior
         * a la fecha de inicio.
         */
        minDate={
          datePickerField ===
            "fin" &&
          form.fecha_inicio
            ? form.fecha_inicio
            : undefined
        }

        onClose={() =>
          setDatePickerField(
            null,
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

          if (
            datePickerField ===
            "inicio"
          ) {
            update(
              "fecha_inicio",

              result.date,
            );

            /*
             * Si ya existía una fecha fin
             * anterior, la acomodamos.
             */
            if (
              form.fecha_fin &&
              form.fecha_fin <
                result.date
            ) {
              update(
                "fecha_fin",

                result.date,
              );
            }
          }

          if (
            datePickerField ===
            "fin"
          ) {
            update(
              "fecha_fin",

              result.date,
            );
          }

          setDatePickerField(
            null,
          );
        }}
      />

      {/*
      |--------------------------------------------------------------------------
      | TIME PICKER
      |--------------------------------------------------------------------------
      */}

      <TimePickerModal
        visible={
          timePickerField !==
          null
        }

        title={
          timePickerField ===
          "inicio"
            ? "Hora de inicio"
            : "Hora de finalización"
        }

        initialTime={
          timePickerInitial
        }

        /*
         * Si no especificamos format,
         * utiliza 24h por defecto.
         *
         * El usuario puede cambiar
         * a AM / PM.
         */
        allowFormatChange

        onClose={() =>
          setTimePickerField(
            null,
          )
        }

        onApply={(
          result,
        ) => {
          if (
            timePickerField ===
            "inicio"
          ) {
            update(
              "hora_inicio",

              result.time,
            );
          }

          if (
            timePickerField ===
            "fin"
          ) {
            update(
              "hora_fin",

              result.time,
            );
          }

          setTimePickerField(
            null,
          );
        }}
      />
    </>
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
      gap: 14,
    },

    infoCard: {
      gap: 5,
    },

    sectionHeader: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      gap: 10,
    },

    sectionCopy: {
      flex: 1,

      minWidth: 220,

      gap: 4,
    },

    sectionTitle: {
      fontSize: 15,

      fontWeight:
        "900",
    },

    helper: {
      fontSize: 11,

      lineHeight: 16,
    },

    /*
    |--------------------------------------------------------------------------
    | GRID
    |--------------------------------------------------------------------------
    */

    grid: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap: 12,
    },

    field: {
      flex: 1,

      minWidth: 240,
    },

    /*
    |--------------------------------------------------------------------------
    | HORARIO
    |--------------------------------------------------------------------------
    */

    scheduleBlock: {
      gap: 8,
    },

    scheduleTitle: {
      fontSize: 13,

      fontWeight:
        "900",
    },

    /*
    |--------------------------------------------------------------------------
    | SELECTOR FIELD
    |--------------------------------------------------------------------------
    */

    selectorWrapper: {
      gap: 6,
    },

    selectorLabel: {
      fontSize: 13,

      fontWeight:
        "600",
    },

    selector: {
      minHeight: 48,

      borderWidth: 1.5,

      borderRadius: 10,

      paddingHorizontal: 10,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 10,
    },

    selectorIcon: {
      width: 32,

      height: 32,

      borderRadius: 8,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    selectorValue: {
      flex: 1,

      fontSize: 14,

      fontWeight:
        "600",
    },

    clearButton: {
      width: 28,

      height: 28,

      borderRadius: 8,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    /*
    |--------------------------------------------------------------------------
    | ERROR
    |--------------------------------------------------------------------------
    */

    error: {
      fontSize: 12,

      fontWeight:
        "700",
    },

    /*
    |--------------------------------------------------------------------------
    | FOOTER
    |--------------------------------------------------------------------------
    */

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