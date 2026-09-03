// components/TimePickerModal.tsx

import {
  ThemedText,
} from "@/components/ThemedText";

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
  Clock3,
  RotateCcw,
} from "lucide-react-native";

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

/*
|--------------------------------------------------------------------------
| TIPOS
|--------------------------------------------------------------------------
*/

export type TimePickerFormat =
  | "24h"
  | "12h";

export type TimePickerPeriod =
  | "AM"
  | "PM";

export interface TimePickerResult {
  /*
   * SIEMPRE se devuelve en formato 24 horas.
   *
   * Ejemplo:
   *
   * 08:30
   * 14:45
   */
  time: string;

  /*
   * Texto mostrado al usuario.
   *
   * 24h:
   * 14:30
   *
   * 12h:
   * 2:30 PM
   */
  display: string;

  /*
   * Formato utilizado visualmente.
   */
  format:
    TimePickerFormat;

  /*
   * Hora normalizada de 0 a 23.
   */
  hour: number;

  /*
   * Minuto normalizado.
   */
  minute: number;

  /*
   * Solo existe realmente cuando
   * se utiliza 12 horas.
   */
  period?:
    TimePickerPeriod;
}

export interface TimePickerModalProps {
  visible: boolean;

  onClose:
    () => void;

  onApply: (
    result:
      TimePickerResult,
  ) => void;

  /*
   * Valor inicial.
   *
   * SIEMPRE:
   * HH:mm
   *
   * Ejemplo:
   * 08:30
   * 15:45
   */
  initialTime?: string;

  /*
   * Formato inicial.
   *
   * Por defecto:
   * 24 horas.
   */
  format?:
    TimePickerFormat;

  /*
   * Permite que el usuario cambie
   * entre 24h y AM/PM.
   *
   * default: true
   */
  allowFormatChange?: boolean;

  /*
   * Intervalo de minutos.
   *
   * 1  = todos los minutos
   * 5  = 00, 05, 10...
   * 10 = 00, 10, 20...
   * 15 = 00, 15, 30, 45
   *
   * default: 1
   */
  minuteStep?: number;

  /*
   * Título del modal.
   */
  title?: string;

  /*
   * Permite cerrar tocando
   * el fondo.
   *
   * default: true
   */
  closeOnBackdropPress?: boolean;
}

/*
|--------------------------------------------------------------------------
| CONSTANTES DEL WHEEL
|--------------------------------------------------------------------------
*/

const ITEM_HEIGHT =
  44;

const VISIBLE_ITEMS =
  5;

const WHEEL_HEIGHT =
  ITEM_HEIGHT *
  VISIBLE_ITEMS;

const WHEEL_PADDING =
  (
    WHEEL_HEIGHT -
    ITEM_HEIGHT
  ) / 2;

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function pad2(
  value: number,
): string {
  return String(
    value,
  ).padStart(
    2,
    "0",
  );
}

/*
|--------------------------------------------------------------------------
| HORA ACTUAL
|--------------------------------------------------------------------------
*/

function currentTime(): {
  hour: number;
  minute: number;
} {
  const now =
    new Date();

  return {
    hour:
      now.getHours(),

    minute:
      now.getMinutes(),
  };
}

/*
|--------------------------------------------------------------------------
| VALIDAR HH:mm
|--------------------------------------------------------------------------
*/

function parseTime(
  value?: string,
): {
  hour: number;
  minute: number;
} {
  if (
    !value ||
    !/^\d{2}:\d{2}$/.test(
      value,
    )
  ) {
    return currentTime();
  }

  const [
    hour,
    minute,
  ] =
    value
      .split(":")
      .map(Number);

  if (
    !Number.isFinite(
      hour,
    ) ||
    !Number.isFinite(
      minute,
    ) ||
    hour <
      0 ||
    hour >
      23 ||
    minute <
      0 ||
    minute >
      59
  ) {
    return currentTime();
  }

  return {
    hour,
    minute,
  };
}

/*
|--------------------------------------------------------------------------
| MINUTOS DISPONIBLES
|--------------------------------------------------------------------------
*/

function buildMinutes(
  step: number,
): number[] {
  const safeStep =
    Math.min(
      30,
      Math.max(
        1,
        Math.floor(
          step,
        ),
      ),
    );

  const result:
    number[] =
    [];

  for (
    let minute = 0;
    minute < 60;
    minute += safeStep
  ) {
    result.push(
      minute,
    );
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| MINUTO MÁS CERCANO
|--------------------------------------------------------------------------
*/

function nearestMinute(
  value: number,
  minutes: number[],
): number {
  if (
    minutes.length ===
    0
  ) {
    return 0;
  }

  let nearest =
    minutes[0];

  let distance =
    Math.abs(
      value -
      nearest,
    );

  for (
    const minute of
      minutes
  ) {
    const currentDistance =
      Math.abs(
        value -
        minute,
      );

    if (
      currentDistance <
      distance
    ) {
      nearest =
        minute;

      distance =
        currentDistance;
    }
  }

  return nearest;
}

/*
|--------------------------------------------------------------------------
| CONVERSIÓN 24H → 12H
|--------------------------------------------------------------------------
*/

function to12Hour(
  hour24: number,
): number {
  const hour =
    hour24 %
    12;

  return hour ===
    0
    ? 12
    : hour;
}

/*
|--------------------------------------------------------------------------
| PERÍODO
|--------------------------------------------------------------------------
*/

function periodFrom24(
  hour24: number,
): TimePickerPeriod {
  return hour24 >=
    12
    ? "PM"
    : "AM";
}

/*
|--------------------------------------------------------------------------
| CONVERSIÓN 12H → 24H
|--------------------------------------------------------------------------
*/

function to24Hour(
  hour12: number,
  period:
    TimePickerPeriod,
): number {
  if (
    period ===
    "AM"
  ) {
    return hour12 ===
      12
      ? 0
      : hour12;
  }

  return hour12 ===
    12
    ? 12
    : hour12 +
        12;
}

/*
|--------------------------------------------------------------------------
| FORMATO VISUAL
|--------------------------------------------------------------------------
*/

function formatDisplay(
  hour24: number,
  minute: number,
  format:
    TimePickerFormat,
): string {
  if (
    format ===
    "24h"
  ) {
    return `${pad2(
      hour24,
    )}:${pad2(
      minute,
    )}`;
  }

  const hour12 =
    to12Hour(
      hour24,
    );

  const period =
    periodFrom24(
      hour24,
    );

  return `${hour12}:${pad2(
    minute,
  )} ${period}`;
}

/*
|--------------------------------------------------------------------------
| WHEEL COLUMN
|--------------------------------------------------------------------------
*/

interface WheelColumnProps<T> {
  values: T[];

  value: T;

  getLabel: (
    value: T,
  ) => string;

  onChange: (
    value: T,
  ) => void;

  width?: number;
}

function WheelColumn<T>({
  values,
  value,
  getLabel,
  onChange,
  width = 86,
}: WheelColumnProps<T>) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const scrollRef =
    useRef<ScrollView>(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | ÍNDICE ACTUAL
  |--------------------------------------------------------------------------
  */

  const selectedIndex =
    Math.max(
      0,
      values.findIndex(
        (
          item,
        ) =>
          item ===
          value,
      ),
    );

  /*
  |--------------------------------------------------------------------------
  | POSICIONAR EL SCROLL
  |--------------------------------------------------------------------------
  */

  const scrollToIndex =
    (
      index: number,
      animated = true,
    ) => {
      const safeIndex =
        Math.min(
          values.length -
            1,

          Math.max(
            0,
            index,
          ),
        );

      requestAnimationFrame(
        () => {
          scrollRef.current
            ?.scrollTo({
              y:
                safeIndex *
                ITEM_HEIGHT,

              animated,
            });
        },
      );
    };

  /*
  |--------------------------------------------------------------------------
  | SINCRONIZACIÓN
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      const timeout =
        setTimeout(
          () => {
            scrollToIndex(
              selectedIndex,
              false,
            );
          },

          50,
        );

      return () =>
        clearTimeout(
          timeout,
        );
    },

    [
      selectedIndex,
      values.length,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | CALCULAR ELEMENTO SELECCIONADO
  |--------------------------------------------------------------------------
  */

  const handleScrollEnd =
    (
      event:
        NativeSyntheticEvent<NativeScrollEvent>,
    ) => {
      const offset =
        event
          .nativeEvent
          .contentOffset
          .y;

      const index =
        Math.round(
          offset /
            ITEM_HEIGHT,
        );

      const safeIndex =
        Math.min(
          values.length -
            1,

          Math.max(
            0,
            index,
          ),
        );

      const nextValue =
        values[
          safeIndex
        ];

      if (
        nextValue !==
        undefined &&
        nextValue !==
        value
      ) {
        onChange(
          nextValue,
        );
      }

      /*
       * Asegura que quede
       * perfectamente centrado.
       */
      scrollToIndex(
        safeIndex,
        true,
      );
    };

  return (
    <View
      style={[
        styles.wheelColumn,

        {
          width,
        },
      ]}
    >
      {/*
      |--------------------------------------------------------------------------
      | FRANJA SELECCIONADA
      |--------------------------------------------------------------------------
      */}

      <View
        pointerEvents="none"
        style={[
          styles.selectionBand,

          {
            backgroundColor:
              c.backgroundSecondary,

            borderColor:
              c.border,
          },
        ]}
      />

      {/*
      |--------------------------------------------------------------------------
      | LISTA
      |--------------------------------------------------------------------------
      */}

      <ScrollView
        ref={
          scrollRef
        }

        style={
          styles.wheel
        }

        contentContainerStyle={{
          paddingVertical:
            WHEEL_PADDING,
        }}

        showsVerticalScrollIndicator={
          false
        }

        snapToInterval={
          ITEM_HEIGHT
        }

        snapToAlignment="start"

        decelerationRate="fast"

        nestedScrollEnabled

        onMomentumScrollEnd={
          handleScrollEnd
        }

        onScrollEndDrag={(
          event,
        ) => {
          /*
           * En web muchas veces
           * no se dispara momentum.
           */

          if (
            !event
              .nativeEvent
              .velocity
              ?.y
          ) {
            handleScrollEnd(
              event,
            );
          }
        }}
      >
        {values.map(
          (
            item,
            index,
          ) => {
            const selected =
              item ===
              value;

            /*
             * Distancia para generar
             * el efecto visual del wheel.
             */
            const distance =
              Math.abs(
                index -
                selectedIndex,
              );

            const opacity =
              selected
                ? 1
                : distance ===
                    1
                  ? 0.55
                  : 0.22;

            const scale =
              selected
                ? 1
                : distance ===
                    1
                  ? 0.88
                  : 0.78;

            return (
              <Pressable
                key={
                  String(
                    item,
                  )
                }

                style={
                  styles.wheelItem
                }

                onPress={() => {
                  onChange(
                    item,
                  );

                  scrollToIndex(
                    index,
                    true,
                  );
                }}
              >
                <ThemedText
                  style={[
                    styles.wheelText,

                    {
                      color:
                        selected
                          ? c.text
                          : c.textSecondary,

                      opacity,

                      transform: [
                        {
                          scale,
                        },
                      ],
                    },
                  ]}
                >
                  {
                    getLabel(
                      item,
                    )
                  }
                </ThemedText>
              </Pressable>
            );
          },
        )}
      </ScrollView>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| TIME PICKER
|--------------------------------------------------------------------------
*/

export function TimePickerModal({
  visible,

  onClose,

  onApply,

  initialTime,

  format =
    "24h",

  allowFormatChange =
    true,

  minuteStep =
    1,

  title =
    "Seleccionar hora",

  closeOnBackdropPress =
    true,
}: TimePickerModalProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  /*
  |--------------------------------------------------------------------------
  | OPCIONES
  |--------------------------------------------------------------------------
  */

  const hours24 =
    useMemo(
      () =>
        Array.from(
          {
            length:
              24,
          },

          (
            _,
            index,
          ) =>
            index,
        ),

      [],
    );

  const hours12 =
    useMemo(
      () =>
        Array.from(
          {
            length:
              12,
          },

          (
            _,
            index,
          ) =>
            index +
            1,
        ),

      [],
    );

  const minutes =
    useMemo(
      () =>
        buildMinutes(
          minuteStep,
        ),

      [
        minuteStep,
      ],
    );

  const periods =
    useMemo<
      TimePickerPeriod[]
    >(
      () => [
        "AM",
        "PM",
      ],

      [],
    );

  /*
  |--------------------------------------------------------------------------
  | ESTADO
  |--------------------------------------------------------------------------
  */

  const [
    currentFormat,
    setCurrentFormat,
  ] =
    useState<TimePickerFormat>(
      format,
    );

  /*
   * Siempre guardamos internamente
   * la hora en 24 horas.
   */
  const [
    hour24,
    setHour24,
  ] =
    useState(
      0,
    );

  const [
    minute,
    setMinute,
  ] =
    useState(
      0,
    );

  /*
  |--------------------------------------------------------------------------
  | SINCRONIZAR AL ABRIR
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!visible) {
        return;
      }

      const parsed =
        parseTime(
          initialTime,
        );

      setHour24(
        parsed.hour,
      );

      setMinute(
        nearestMinute(
          parsed.minute,
          minutes,
        ),
      );

      setCurrentFormat(
        format,
      );
    },

    [
      visible,
      initialTime,
      format,
      minutes,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | VALORES 12H
  |--------------------------------------------------------------------------
  */

  const hour12 =
    to12Hour(
      hour24,
    );

  const period =
    periodFrom24(
      hour24,
    );

  /*
  |--------------------------------------------------------------------------
  | PREVIEW
  |--------------------------------------------------------------------------
  */

  const preview =
    formatDisplay(
      hour24,
      minute,
      currentFormat,
    );

  /*
  |--------------------------------------------------------------------------
  | RESTABLECER A AHORA
  |--------------------------------------------------------------------------
  */

  const setNow =
    () => {
      const now =
        currentTime();

      setHour24(
        now.hour,
      );

      setMinute(
        nearestMinute(
          now.minute,
          minutes,
        ),
      );
    };

  /*
  |--------------------------------------------------------------------------
  | APLICAR
  |--------------------------------------------------------------------------
  */

  const handleApply =
    () => {
      const normalized =
        `${pad2(
          hour24,
        )}:${pad2(
          minute,
        )}`;

      onApply({
        time:
          normalized,

        display:
          preview,

        format:
          currentFormat,

        hour:
          hour24,

        minute,

        period:
          currentFormat ===
          "12h"
            ? period
            : undefined,
      });

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

      title={
        title
      }

      onClose={
        onClose
      }

      closeOnBackdropPress={
        closeOnBackdropPress
      }

      width="94%"

      maxWidth={
        470
      }

      /*
       * Importante:
       *
       * Los wheel tienen su propio
       * scroll vertical.
       *
       * Así evitamos ScrollView anidado
       * con el Modal general.
       */
      scrollable={
        false
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

            onPress={
              onClose
            }
          />

          <Button
            title="Seleccionar"

            onPress={
              handleApply
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
        | SELECTOR DE FORMATO
        |--------------------------------------------------------------------------
        */}

        {allowFormatChange ? (
          <View
            style={[
              styles.formatContainer,

              {
                backgroundColor:
                  c.backgroundSecondary,

                borderColor:
                  c.border,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"

              accessibilityState={{
                selected:
                  currentFormat ===
                  "24h",
              }}

              onPress={() =>
                setCurrentFormat(
                  "24h",
                )
              }

              style={[
                styles.formatButton,

                currentFormat ===
                  "24h" && {
                  backgroundColor:
                    c.primary,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.formatText,

                  {
                    color:
                      currentFormat ===
                      "24h"
                        ? c.primaryForeground
                        : c.textSecondary,
                  },
                ]}
              >
                24 horas
              </ThemedText>
            </Pressable>

            <Pressable
              accessibilityRole="button"

              accessibilityState={{
                selected:
                  currentFormat ===
                  "12h",
              }}

              onPress={() =>
                setCurrentFormat(
                  "12h",
                )
              }

              style={[
                styles.formatButton,

                currentFormat ===
                  "12h" && {
                  backgroundColor:
                    c.primary,
                },
              ]}
            >
              <ThemedText
                style={[
                  styles.formatText,

                  {
                    color:
                      currentFormat ===
                      "12h"
                        ? c.primaryForeground
                        : c.textSecondary,
                  },
                ]}
              >
                AM / PM
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {/*
        |--------------------------------------------------------------------------
        | PREVIEW
        |--------------------------------------------------------------------------
        */}

        <View
          style={
            styles.preview
          }
        >
          <View
            style={[
              styles.clockIcon,

              {
                backgroundColor:
                  c.backgroundSecondary,

                borderColor:
                  c.border,
              },
            ]}
          >
            <Clock3
              size={
                20
              }

              color={
                c.primary
              }
            />
          </View>

          <View
            style={
              styles.previewTextContainer
            }
          >
            <ThemedText
              style={[
                styles.previewLabel,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              Hora seleccionada
            </ThemedText>

            <ThemedText
              style={
                styles.previewValue
              }
            >
              {
                preview
              }
            </ThemedText>
          </View>

          <Pressable
            accessibilityRole="button"

            accessibilityLabel="Usar hora actual"

            onPress={
              setNow
            }

            style={[
              styles.nowButton,

              {
                borderColor:
                  c.border,

                backgroundColor:
                  c.backgroundSecondary,
              },
            ]}
          >
            <RotateCcw
              size={
                16
              }

              color={
                c.textSecondary
              }
            />

            <ThemedText
              style={[
                styles.nowText,

                {
                  color:
                    c.textSecondary,
                },
              ]}
            >
              Ahora
            </ThemedText>
          </Pressable>
        </View>

        {/*
        |--------------------------------------------------------------------------
        | WHEEL
        |--------------------------------------------------------------------------
        */}

        <View
          style={[
            styles.pickerContainer,

            {
              backgroundColor:
                c.background,

              borderColor:
                c.border,
            },
          ]}
        >
          {/*
          |--------------------------------------------------------------------------
          | HORA
          |--------------------------------------------------------------------------
          */}

          {currentFormat ===
          "24h" ? (
            <WheelColumn
              values={
                hours24
              }

              value={
                hour24
              }

              getLabel={(
                value,
              ) =>
                pad2(
                  value,
                )
              }

              onChange={
                setHour24
              }
            />
          ) : (
            <WheelColumn
              values={
                hours12
              }

              value={
                hour12
              }

              getLabel={(
                value,
              ) =>
                pad2(
                  value,
                )
              }

              onChange={(
                value,
              ) =>
                setHour24(
                  to24Hour(
                    value,
                    period,
                  ),
                )
              }
            />
          )}

          {/*
          |--------------------------------------------------------------------------
          | DOS PUNTOS
          |--------------------------------------------------------------------------
          */}

          <View
            style={
              styles.separator
            }
          >
            <ThemedText
              style={
                styles.separatorText
              }
            >
              :
            </ThemedText>
          </View>

          {/*
          |--------------------------------------------------------------------------
          | MINUTOS
          |--------------------------------------------------------------------------
          */}

          <WheelColumn
            values={
              minutes
            }

            value={
              minute
            }

            getLabel={(
              value,
            ) =>
              pad2(
                value,
              )
            }

            onChange={
              setMinute
            }
          />

          {/*
          |--------------------------------------------------------------------------
          | AM / PM
          |--------------------------------------------------------------------------
          */}

          {currentFormat ===
          "12h" ? (
            <WheelColumn<TimePickerPeriod>
              values={
                periods
              }

              value={
                period
              }

              width={
                90
              }

              getLabel={(
                value,
              ) =>
                value
              }

              onChange={(
                value,
              ) =>
                setHour24(
                  to24Hour(
                    hour12,
                    value,
                  ),
                )
              }
            />
          ) : null}
        </View>

        {/*
        |--------------------------------------------------------------------------
        | AYUDA
        |--------------------------------------------------------------------------
        */}

        <ThemedText
          style={[
            styles.helper,

            {
              color:
                c.textSecondary,
            },
          ]}
        >
          Desliza hacia arriba o abajo para seleccionar la hora.
        </ThemedText>
      </View>
    </Modal>
  );
}

/*
|--------------------------------------------------------------------------
| EXPORT DEFAULT
|--------------------------------------------------------------------------
*/

export default TimePickerModal;

/*
|--------------------------------------------------------------------------
| ESTILOS
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    content: {
      padding: 18,

      gap: 16,
    },

    /*
    |--------------------------------------------------------------------------
    | FORMATO
    |--------------------------------------------------------------------------
    */

    formatContainer: {
      flexDirection:
        "row",

      borderWidth:
        1,

      borderRadius:
        12,

      padding:
        4,

      gap:
        4,
    },

    formatButton: {
      flex:
        1,

      minHeight:
        38,

      alignItems:
        "center",

      justifyContent:
        "center",

      borderRadius:
        9,

      paddingHorizontal:
        12,
    },

    formatText: {
      fontSize:
        13,

      fontWeight:
        "800",
    },

    /*
    |--------------------------------------------------------------------------
    | PREVIEW
    |--------------------------------------------------------------------------
    */

    preview: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,
    },

    clockIcon: {
      width:
        42,

      height:
        42,

      borderRadius:
        12,

      borderWidth:
        1,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    previewTextContainer: {
      flex:
        1,

      gap:
        2,
    },

    previewLabel: {
      fontSize:
        11,

      fontWeight:
        "600",
    },

    previewValue: {
      fontSize:
        24,

      lineHeight:
        29,

      fontWeight:
        "900",

      fontVariant: [
        "tabular-nums",
      ],
    },

    nowButton: {
      minHeight:
        36,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth:
        1,

      borderRadius:
        10,

      gap:
        6,

      paddingHorizontal:
        10,
    },

    nowText: {
      fontSize:
        12,

      fontWeight:
        "700",
    },

    /*
    |--------------------------------------------------------------------------
    | PICKER
    |--------------------------------------------------------------------------
    */

    pickerContainer: {
      height:
        WHEEL_HEIGHT,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      borderWidth:
        1,

      borderRadius:
        18,

      overflow:
        "hidden",

      paddingHorizontal:
        12,
    },

    wheelColumn: {
      height:
        WHEEL_HEIGHT,

      position:
        "relative",
    },

    wheel: {
      height:
        WHEEL_HEIGHT,

      zIndex:
        2,
    },

    selectionBand: {
      position:
        "absolute",

      top:
        WHEEL_PADDING,

      left:
        4,

      right:
        4,

      height:
        ITEM_HEIGHT,

      borderWidth:
        1,

      borderRadius:
        12,

      zIndex:
        1,
    },

    wheelItem: {
      height:
        ITEM_HEIGHT,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    wheelText: {
      fontSize:
        21,

      lineHeight:
        26,

      fontWeight:
        "700",

      fontVariant: [
        "tabular-nums",
      ],
    },

    separator: {
      width:
        22,

      height:
        ITEM_HEIGHT,

      alignItems:
        "center",

      justifyContent:
        "center",

      zIndex:
        4,
    },

    separatorText: {
      fontSize:
        22,

      lineHeight:
        27,

      fontWeight:
        "900",
    },

    /*
    |--------------------------------------------------------------------------
    | AYUDA
    |--------------------------------------------------------------------------
    */

    helper: {
      textAlign:
        "center",

      fontSize:
        11,

      lineHeight:
        16,
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

      gap:
        10,
    },
  });