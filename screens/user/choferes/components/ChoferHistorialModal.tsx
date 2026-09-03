import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Badge,
} from "@/components/ui/Badge";

import {
  Card,
} from "@/components/ui/Card";

import {
  EmptyState,
} from "@/components/ui/EmptyState";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  Skeleton,
} from "@/components/ui/Skeleton";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  useEffect,
  useState,
} from "react";

import {
  StyleSheet,
  View,
} from "react-native";

import Toast from "react-native-toast-message";

import {
  getHistorialChofer,
} from "../services/chofer.service";

import {
  Chofer,
  HistorialAsignacionChofer,
} from "../types/chofer.types";

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

  onClose:
    () => void;
};

/*
|--------------------------------------------------------------------------
| FECHA
|--------------------------------------------------------------------------
*/

function fecha(
  value?:
    | string
    | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    new Date(
      value,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleString();
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function ChoferHistorialModal({
  visible,

  chofer,

  onClose,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    historial,
    setHistorial,
  ] =
    useState<
      HistorialAsignacionChofer[]
    >([]);

  /*
  |--------------------------------------------------------------------------
  | CARGAR HISTORIAL
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        !visible ||
        !chofer
      ) {
        return;
      }

      let active =
        true;

      setLoading(
        true,
      );

      setHistorial(
        [],
      );

      getHistorialChofer(
        chofer.id,
      )
        .then(
          (
            response,
          ) => {
            if (
              active
            ) {
              setHistorial(
                response.historial ??
                  [],
              );
            }
          },
        )
        .catch(
          (
            error,
          ) => {
            Toast.show({
              type:
                "error",

              text1:
                "No se pudo cargar el historial",

              text2:
                error instanceof
                Error
                  ? error.message
                  : "Intenta nuevamente.",
            });
          },
        )
        .finally(
          () => {
            if (
              active
            ) {
              setLoading(
                false,
              );
            }
          },
        );

      return () => {
        active =
          false;
      };
    },

    [
      visible,
      chofer,
    ],
  );

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
        chofer
          ? `Historial · ${chofer.nombre_completo}`
          : "Historial de asignaciones"
      }

      onClose={
        onClose
      }

      width="96%"

      maxWidth={
        860
      }
    >
      <View
        style={
          styles.content
        }
      >
        {/*
        |--------------------------------------------------------------------------
        | LOADING
        |--------------------------------------------------------------------------
        */}

        {loading ? (
          <>
            <Skeleton
              height={
                120
              }

              borderRadius={
                12
              }
            />

            <Skeleton
              height={
                120
              }

              borderRadius={
                12
              }
            />
          </>
        ) : historial.length ===
          0 ? (
          /*
          |--------------------------------------------------------------------------
          | VACÍO
          |--------------------------------------------------------------------------
          */

          <EmptyState
            icon="time-outline"

            title="Sin asignaciones"

            subtitle="El chofer todavía no tiene asignaciones registradas."
          />
        ) : (
          /*
          |--------------------------------------------------------------------------
          | HISTORIAL
          |--------------------------------------------------------------------------
          */

          historial.map(
            (
              item,
            ) => (
              <Card
                key={
                  item.id
                }

                style={
                  styles.card
                }
              >
                {/*
                |--------------------------------------------------------------------------
                | VEHÍCULO
                |--------------------------------------------------------------------------
                */}

                <View
                  style={
                    styles.cardHeader
                  }
                >
                  <View
                    style={
                      styles.headerCopy
                    }
                  >
                    <ThemedText
                      style={
                        styles.vehicle
                      }
                    >
                      {
                        item.vehiculo.placa
                      }

                      {" · "}

                      {
                        item.vehiculo.marca
                      }

                      {" "}

                      {
                        item.vehiculo.modelo
                      }
                    </ThemedText>

                    <ThemedText
                      style={{
                        color:
                          c.textSecondary,
                      }}
                    >
                      {
                        item.vehiculo.tipo
                      }

                      {
                        item.vehiculo.color
                          ? ` · ${item.vehiculo.color}`
                          : ""
                      }
                    </ThemedText>
                  </View>

                  <Badge
                    label={
                      item.estado
                    }

                    variant={
                      item.estado ===
                      "ACTIVO"
                        ? "success"
                        : "muted"
                    }
                  />
                </View>

                {/*
                |--------------------------------------------------------------------------
                | FECHAS
                |--------------------------------------------------------------------------
                */}

                <View
                  style={
                    styles.meta
                  }
                >
                  <ThemedText
                    style={{
                      color:
                        c.textSecondary,
                    }}
                  >
                    Asignado:{" "}

                    {
                      fecha(
                        item.fecha_asignacion,
                      )
                    }
                  </ThemedText>

                  {item.fecha_actualizacion ? (
                    <ThemedText
                      style={{
                        color:
                          c.textSecondary,
                      }}
                    >
                      Actualizado:{" "}

                      {
                        fecha(
                          item.fecha_actualizacion,
                        )
                      }
                    </ThemedText>
                  ) : null}

                  {item.fecha_eliminacion ? (
                    <ThemedText
                      style={{
                        color:
                          c.textSecondary,
                      }}
                    >
                      Cerrado:{" "}

                      {
                        fecha(
                          item.fecha_eliminacion,
                        )
                      }
                    </ThemedText>
                  ) : null}
                </View>

                {/*
                |--------------------------------------------------------------------------
                | VIAJES / RUTAS
                |--------------------------------------------------------------------------
                */}

                {item.viajes.length >
                0 ? (
                  <View
                    style={[
                      styles.trips,

                      {
                        borderTopColor:
                          c.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={
                        styles.tripTitle
                      }
                    >
                      Viajes / Rutas
                    </ThemedText>

                    {item.viajes.map(
                      (
                        viaje,
                      ) => (
                        <View
                          key={
                            viaje.id
                          }

                          style={[
                            styles.trip,

                            {
                              backgroundColor:
                                c.backgroundSecondary,
                            },
                          ]}
                        >
                          <ThemedText
                            style={
                              styles.route
                            }
                          >
                            {
                              viaje.ruta.origen
                            }

                            {" → "}

                            {
                              viaje.ruta.destino
                            }
                          </ThemedText>

                          <ThemedText
                            style={{
                              color:
                                c.textSecondary,
                            }}
                          >
                            Salida:{" "}

                            {
                              fecha(
                                viaje.hora_inicio,
                              )
                            }
                          </ThemedText>

                          <ThemedText
                            style={{
                              color:
                                c.textSecondary,
                            }}
                          >
                            Tarifa: Bs.{" "}

                            {
                              Number(
                                viaje.ruta.tarifa ??
                                  0,
                              ).toFixed(
                                2,
                              )
                            }
                          </ThemedText>

                          <View
                            style={
                              styles.routeStatus
                            }
                          >
                            <Badge
                              label={
                                viaje.ruta.estado
                              }

                              variant={
                                viaje.ruta.estado ===
                                "Activo"
                                  ? "success"
                                  : "muted"
                              }
                            />
                          </View>
                        </View>
                      ),
                    )}
                  </View>
                ) : (
                  <View
                    style={[
                      styles.noTrips,

                      {
                        borderTopColor:
                          c.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        color:
                          c.textSecondary,
                      }}
                    >
                      Esta asignación no tiene viajes registrados.
                    </ThemedText>
                  </View>
                )}
              </Card>
            ),
          )
        )}
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

    card: {
      gap: 10,
    },

    cardHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap: 12,
    },

    headerCopy: {
      flex: 1,

      minWidth: 0,

      gap: 3,
    },

    vehicle: {
      fontSize: 15,

      fontWeight:
        "900",
    },

    meta: {
      gap: 3,
    },

    trips: {
      borderTopWidth: 1,

      paddingTop: 10,

      gap: 8,
    },

    tripTitle: {
      fontSize: 12,

      fontWeight:
        "900",
    },

    trip: {
      padding: 10,

      borderRadius: 10,

      gap: 4,
    },

    route: {
      fontWeight:
        "800",
    },

    routeStatus: {
      alignSelf:
        "flex-start",

      marginTop: 3,
    },

    noTrips: {
      borderTopWidth: 1,

      paddingTop: 10,
    },
  });