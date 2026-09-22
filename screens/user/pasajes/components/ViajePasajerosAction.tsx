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
  IconButton,
} from "@/components/ui/IconButton";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  Armchair,
  IdCard,
  UsersRound,
} from "lucide-react-native";

import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getPasajerosViaje,
} from "../services/viaje-pasajeros.service";

import type {
  Viaje,
} from "../types/pasajes.types";

import type {
  ViajePasajeroItem,
  ViajePasajerosResponse,
} from "../types/viaje-pasajeros.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

type Props = {
  viaje: Viaje;
};

/*
|--------------------------------------------------------------------------
| ETIQUETA DE ASIENTO
|--------------------------------------------------------------------------
*/

function asientoLabel(
  item:
    ViajePasajeroItem,
): string {
  if (
    item.asiento
      .numero_asiento !==
      null &&
    item.asiento
      .numero_asiento !==
      undefined
  ) {
    return String(
      item.asiento
        .numero_asiento,
    );
  }

  if (
    item.asiento.fila !==
      null &&
    item.asiento.columna !==
      null
  ) {
    return `${item.asiento.fila}-${item.asiento.columna}`;
  }

  return "—";
}

/*
|--------------------------------------------------------------------------
| HORA
|--------------------------------------------------------------------------
*/

function mostrarHora(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return "—";
  }

  /*
   * Backend:
   * 2026-09-22 06:30:00
   */
  const hora =
    value.includes(
      " ",
    )
      ? value.split(
          " ",
        )[1]
      : value;

  return hora
    ? hora.substring(
        0,
        5,
      )
    : "—";
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
|
| El componente contiene:
|
| - IconButton
| - estado del modal
| - petición lazy al backend
| - listado de pasajeros
|
| Así PasajesScreen solamente necesita renderizar:
|
| <ViajePasajerosAction viaje={item} />
|
|--------------------------------------------------------------------------
*/

export function ViajePasajerosAction({
  viaje,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const [
    visible,
    setVisible,
  ] =
    useState(
      false,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      false,
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    data,
    setData,
  ] =
    useState<
      ViajePasajerosResponse | null
    >(null);

  /*
  |--------------------------------------------------------------------------
  | ABRIR
  |--------------------------------------------------------------------------
  */

  const abrir =
    useCallback(
      async () => {
        setVisible(
          true,
        );

        setLoading(
          true,
        );

        setError(
          "",
        );

        setData(
          null,
        );

        try {
          const response =
            await getPasajerosViaje(
              viaje.id,
            );

          setData(
            response,
          );
        } catch (
          err
        ) {
          setError(
            err instanceof
              Error
              ? err.message
              : "No se pudieron cargar los pasajeros.",
          );
        } finally {
          setLoading(
            false,
          );
        }
      },
      [
        viaje.id,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CERRAR
  |--------------------------------------------------------------------------
  */

  const cerrar =
    () => {
      setVisible(
        false,
      );

      setError(
        "",
      );

      setData(
        null,
      );
    };

  return (
    <>
      <IconButton
        icon={
          UsersRound
        }

        variant="secondary"

        size="sm"

        onPress={() =>
          void abrir()
        }

        accessibilityLabel={`Ver pasajeros del viaje ${viaje.origen} → ${viaje.destino}`}
      />

      <Modal
        visible={
          visible
        }

        title={`Pasajeros · ${viaje.origen} → ${viaje.destino}`}

        onClose={
          cerrar
        }

        width="95%"

        maxWidth={
          820
        }

        maxHeight={
          700
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

              onPress={
                cerrar
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
          | RESUMEN DEL VIAJE
          |--------------------------------------------------------------------------
          */}

          <View
            style={
              styles.summary
            }
          >
            <View
              style={
                styles.summaryItem
              }
            >
              <Text
                style={[
                  styles.summaryLabel,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Hora
              </Text>

              <Text
                style={[
                  styles.summaryValue,

                  {
                    color:
                      c.text,
                  },
                ]}
              >
                {
                  mostrarHora(
                    data
                      ?.viaje
                      .hora_salida ??
                    viaje.hora_salida,
                  )
                }
              </Text>
            </View>

            <View
              style={
                styles.summaryItem
              }
            >
              <Text
                style={[
                  styles.summaryLabel,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Vehículo
              </Text>

              <Text
                style={[
                  styles.summaryValue,

                  {
                    color:
                      c.text,
                  },
                ]}
              >
                {
                  data
                    ?.viaje
                    .vehiculo ??
                  viaje.vehiculo ??
                  "—"
                }
              </Text>
            </View>

            <View
              style={
                styles.summaryItem
              }
            >
              <Text
                style={[
                  styles.summaryLabel,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Chofer
              </Text>

              <Text
                numberOfLines={
                  1
                }

                style={[
                  styles.summaryValue,

                  {
                    color:
                      c.text,
                  },
                ]}
              >
                {
                  data
                    ?.viaje
                    .chofer ??
                  viaje.chofer ??
                  "—"
                }
              </Text>
            </View>

            <View
              style={
                styles.summaryItem
              }
            >
              <Text
                style={[
                  styles.summaryLabel,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Pasajeros
              </Text>

              <Badge
                label={
                  String(
                    data
                      ?.total ??
                    0,
                  )
                }

                variant="info"
              />
            </View>
          </View>

          {/*
          |--------------------------------------------------------------------------
          | CARGANDO
          |--------------------------------------------------------------------------
          */}

          {loading ? (
            <View
              style={
                styles.centerState
              }
            >
              <ActivityIndicator
                color={
                  c.primary
                }
              />

              <Text
                style={{
                  color:
                    c.textSecondary,
                }}
              >
                Cargando pasajeros...
              </Text>
            </View>
          ) : error ? (
            /*
            |--------------------------------------------------------------------------
            | ERROR
            |--------------------------------------------------------------------------
            */

            <View
              style={
                styles.centerState
              }
            >
              <Text
                style={[
                  styles.errorText,

                  {
                    color:
                      c.destructive,
                  },
                ]}
              >
                {
                  error
                }
              </Text>

              <Button
                title="Reintentar"

                variant="secondary"

                onPress={() =>
                  void abrir()
                }
              />
            </View>
          ) : !data ||
            data.pasajeros.length ===
              0 ? (
            /*
            |--------------------------------------------------------------------------
            | VACÍO
            |--------------------------------------------------------------------------
            */

            <View
              style={
                styles.centerState
              }
            >
              <UsersRound
                size={
                  34
                }

                color={
                  c.textMuted
                }
              />

              <Text
                style={[
                  styles.emptyText,

                  {
                    color:
                      c.textSecondary,
                  },
                ]}
              >
                Este viaje todavía no tiene pasajeros con venta confirmada.
              </Text>
            </View>
          ) : (
            /*
            |--------------------------------------------------------------------------
            | LISTADO
            |--------------------------------------------------------------------------
            */

            <ScrollView
              style={
                styles.scroll
              }

              contentContainerStyle={
                styles.list
              }

              showsVerticalScrollIndicator
            >
              {data.pasajeros.map(
                (
                  item,
                  index,
                ) => (
                  <Card
                    key={
                      item
                        .id_detalle_venta
                    }

                    style={
                      styles.passengerCard
                    }
                  >
                    <View
                      style={[
                        styles.seat,

                        {
                          backgroundColor:
                            c.primarySubtle,

                          borderColor:
                            c.primary,
                        },
                      ]}
                    >
                      <Armchair
                        size={
                          18
                        }

                        color={
                          c.primary
                        }
                      />

                      <Text
                        style={[
                          styles.seatNumber,

                          {
                            color:
                              c.primary,
                          },
                        ]}
                      >
                        {
                          asientoLabel(
                            item,
                          )
                        }
                      </Text>
                    </View>

                    <View
                      style={
                        styles.passengerBody
                      }
                    >
                      <View
                        style={
                          styles.nameRow
                        }
                      >
                        <Text
                          numberOfLines={
                            1
                          }

                          style={[
                            styles.passengerName,

                            {
                              color:
                                c.text,
                            },
                          ]}
                        >
                          {index +
                            1}
                          .{" "}
                          {
                            item
                              .pasajero
                              .nombre_completo
                          }
                        </Text>

                        {item
                          .asiento
                          .piso ? (
                          <Badge
                            label={
                              item
                                .asiento
                                .piso
                            }

                            variant="muted"
                          />
                        ) : null}
                      </View>

                      <View
                        style={
                          styles.ciRow
                        }
                      >
                        <IdCard
                          size={
                            15
                          }

                          color={
                            c.textSecondary
                          }
                        />

                        <Text
                          style={[
                            styles.ciText,

                            {
                              color:
                                c.textSecondary,
                            },
                          ]}
                        >
                          CI:{" "}
                          {
                            item
                              .pasajero
                              .ci ||
                            "—"
                          }
                        </Text>
                      </View>
                    </View>
                  </Card>
                ),
              )}
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles =
  StyleSheet.create({
    content: {
      gap:
        14,
    },

    summary: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        10,
    },

    summaryItem: {
      flex:
        1,

      minWidth:
        135,

      gap:
        4,
    },

    summaryLabel: {
      fontSize:
        11,

      fontWeight:
        "700",
    },

    summaryValue: {
      fontSize:
        13,

      fontWeight:
        "900",
    },

    centerState: {
      minHeight:
        180,

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        10,

      paddingHorizontal:
        20,
    },

    errorText: {
      fontSize:
        13,

      fontWeight:
        "700",

      textAlign:
        "center",
    },

    emptyText: {
      maxWidth:
        420,

      fontSize:
        13,

      lineHeight:
        19,

      textAlign:
        "center",
    },

    scroll: {
      maxHeight:
        430,
    },

    list: {
      gap:
        8,

      paddingBottom:
        4,
    },

    passengerCard: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,
    },

    seat: {
      width:
        58,

      minHeight:
        52,

      borderWidth:
        1,

      borderRadius:
        10,

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        2,

      flexShrink:
        0,
    },

    seatNumber: {
      fontSize:
        13,

      fontWeight:
        "900",
    },

    passengerBody: {
      flex:
        1,

      minWidth:
        0,

      gap:
        6,
    },

    nameRow: {
      width:
        "100%",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    passengerName: {
      flex:
        1,

      minWidth:
        180,

      fontSize:
        14,

      fontWeight:
        "900",
    },

    ciRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        5,
    },

    ciText: {
      fontSize:
        12,
    },

    footer: {
      flexDirection:
        "row",

      justifyContent:
        "flex-end",
    },
  });
