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
  Card,
} from "@/components/ui/Card";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  Bus,
  Clock3,
  IdCard,
  Phone,
  UserRound,
} from "lucide-react-native";

import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  Image,
  StyleSheet,
  View,
} from "react-native";

import {
  getChoferesViajesRuta,
} from "../services/ruta.service";

import {
  Ruta,
  RutaChoferViaje,
} from "../types/ruta.types";

type Props = {
  visible: boolean;

  ruta:
    | Ruta
    | null;

  onClose:
    () => void;
};

function mostrarFechaHora(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return "—";
  }

  const limpio =
    value
      .replace(
        "T",
        " ",
      )
      .replace(
        "Z",
        "",
      );

  const [
    fecha = "",
    hora = "",
  ] =
    limpio.split(
      " ",
    );

  const [
    year,
    month,
    day,
  ] =
    fecha.split(
      "-",
    );

  const fechaVisible =
    year &&
    month &&
    day
      ? `${day}/${month}/${year}`
      : fecha;

  const horaVisible =
    hora
      ? hora.substring(
          0,
          5,
        )
      : "";

  return [
    fechaVisible,
    horaVisible,
  ]
    .filter(
      Boolean,
    )
    .join(
      " ",
    );
}

export function RutaChoferesViajesModal({
  visible,
  ruta,
  onClose,
}: Props) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const [
    choferes,
    setChoferes,
  ] =
    useState<
      RutaChoferViaje[]
    >([]);

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

  useEffect(
    () => {
      if (
        !visible ||
        !ruta
      ) {
        return;
      }

      let activo =
        true;

      const cargar =
        async () => {
          setLoading(
            true,
          );

          setError(
            "",
          );

          setChoferes(
            [],
          );

          try {
            const response =
              await getChoferesViajesRuta(
                ruta.id,
              );

            if (
              !activo
            ) {
              return;
            }

            setChoferes(
              response.choferes ??
                [],
            );
          } catch (
            err
          ) {
            if (
              !activo
            ) {
              return;
            }

            setError(
              err instanceof
                Error
                ? err.message
                : "No se pudieron cargar los choferes.",
            );
          } finally {
            if (
              activo
            ) {
              setLoading(
                false,
              );
            }
          }
        };

      void cargar();

      return () => {
        activo =
          false;
      };
    },
    [
      visible,
      ruta,
    ],
  );

  return (
    <Modal
      visible={
        visible
      }

      title={
        ruta
          ? `Choferes · ${ruta.origen} → ${ruta.destino}`
          : "Choferes de la ruta"
      }

      onClose={
        onClose
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
              onClose
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
          style={[
            styles.description,

            {
              color:
                c.textSecondary,
            },
          ]}
        >
          Se muestran únicamente choferes que ya tienen al menos un viaje creado para esta ruta.
        </ThemedText>

        {loading ? (
          <View
            style={
              styles.centerState
            }
          >
            <ActivityIndicator
              size="small"

              color={
                c.primary
              }
            />

            <ThemedText
              style={{
                color:
                  c.textSecondary,
              }}
            >
              Cargando choferes...
            </ThemedText>
          </View>
        ) : error ? (
          <View
            style={
              styles.centerState
            }
          >
            <ThemedText
              style={{
                color:
                  c.destructive,

                textAlign:
                  "center",
              }}
            >
              {
                error
              }
            </ThemedText>
          </View>
        ) : choferes.length ===
          0 ? (
          <View
            style={
              styles.centerState
            }
          >
            <UserRound
              size={
                32
              }

              color={
                c.textMuted
              }
            />

            <ThemedText
              style={{
                color:
                  c.textSecondary,

                textAlign:
                  "center",
              }}
            >
              Esta ruta todavía no tiene choferes con viajes asignados.
            </ThemedText>
          </View>
        ) : (
          <View
            style={
              styles.list
            }
          >
            {choferes.map(
              (
                chofer,
              ) => (
                <Card
                  key={
                    chofer.id
                  }

                  style={
                    styles.driverCard
                  }
                >
                  <View
                    style={[
                      styles.avatar,

                      {
                        backgroundColor:
                          c.backgroundSecondary,

                        borderColor:
                          c.border,
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
                          styles.avatarImage
                        }

                        resizeMode="cover"
                      />
                    ) : (
                      <UserRound
                        size={
                          24
                        }

                        color={
                          c.textSecondary
                        }
                      />
                    )}
                  </View>

                  <View
                    style={
                      styles.driverBody
                    }
                  >
                    <View
                      style={
                        styles.driverHeader
                      }
                    >
                      <View
                        style={
                          styles.driverNameBox
                        }
                      >
                        <ThemedText
                          numberOfLines={
                            1
                          }

                          style={
                            styles.driverName
                          }
                        >
                          {
                            chofer.nombre_completo
                          }
                        </ThemedText>

                        <ThemedText
                          style={[
                            styles.driverSub,

                            {
                              color:
                                c.textSecondary,
                            },
                          ]}
                        >
                          CI:{" "}
                          {
                            chofer.carnet_identidad ||
                            "—"
                          }
                        </ThemedText>
                      </View>

                      <Badge
                        label={`${chofer.viajes_count} ${
                          chofer.viajes_count ===
                          1
                            ? "viaje"
                            : "viajes"
                        }`}

                        variant="info"
                      />
                    </View>

                    <View
                      style={
                        styles.details
                      }
                    >
                      <View
                        style={
                          styles.detailItem
                        }
                      >
                        <IdCard
                          size={
                            15
                          }

                          color={
                            c.primary
                          }
                        />

                        <ThemedText
                          style={[
                            styles.detailText,

                            {
                              color:
                                c.textSecondary,
                            },
                          ]}
                        >
                          Sindicato:{" "}
                          {
                            chofer.carnet_sindical ||
                            "—"
                          }
                        </ThemedText>
                      </View>

                      <View
                        style={
                          styles.detailItem
                        }
                      >
                        <Phone
                          size={
                            15
                          }

                          color={
                            c.primary
                          }
                        />

                        <ThemedText
                          style={[
                            styles.detailText,

                            {
                              color:
                                c.textSecondary,
                            },
                          ]}
                        >
                          {
                            chofer.telefono ||
                            "Sin teléfono"
                          }
                        </ThemedText>
                      </View>

                      <View
                        style={
                          styles.detailItem
                        }
                      >
                        <Clock3
                          size={
                            15
                          }

                          color={
                            c.primary
                          }
                        />

                        <ThemedText
                          style={[
                            styles.detailText,

                            {
                              color:
                                c.textSecondary,
                            },
                          ]}
                        >
                          Primera salida:{" "}
                          {
                            mostrarFechaHora(
                              chofer.primera_salida,
                            )
                          }
                        </ThemedText>
                      </View>

                      <View
                        style={
                          styles.detailItem
                        }
                      >
                        <Bus
                          size={
                            15
                          }

                          color={
                            c.primary
                          }
                        />

                        <ThemedText
                          style={[
                            styles.detailText,

                            {
                              color:
                                c.textSecondary,
                            },
                          ]}
                        >
                          Última salida:{" "}
                          {
                            mostrarFechaHora(
                              chofer.ultima_salida,
                            )
                          }
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </Card>
              ),
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    content: {
      gap:
        14,
    },

    description: {
      fontSize:
        13,

      lineHeight:
        19,
    },

    list: {
      gap:
        10,

      paddingBottom:
        4,
    },

    centerState: {
      minHeight:
        160,

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        10,

      paddingHorizontal:
        20,
    },

    driverCard: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap:
        12,
    },

    avatar: {
      width:
        52,

      height:
        52,

      borderRadius:
        26,

      borderWidth:
        1,

      overflow:
        "hidden",

      alignItems:
        "center",

      justifyContent:
        "center",

      flexShrink:
        0,
    },

    avatarImage: {
      width:
        "100%",

      height:
        "100%",
    },

    driverBody: {
      flex:
        1,

      minWidth:
        0,

      gap:
        10,
    },

    driverHeader: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    driverNameBox: {
      flex:
        1,

      minWidth:
        180,
    },

    driverName: {
      fontSize:
        15,

      fontWeight:
        "900",
    },

    driverSub: {
      marginTop:
        2,

      fontSize:
        12,
    },

    details: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    detailItem: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        5,

      minWidth:
        210,

      flex:
        1,
    },

    detailText: {
      flexShrink:
        1,

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
