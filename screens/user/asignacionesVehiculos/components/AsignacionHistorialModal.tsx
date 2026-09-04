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
  Modal,
} from "@/components/ui/Modal";

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
  getHistorialAsignaciones,
} from "../services/asignacionVehiculo.service";

import {
  Asignacion,
} from "../types/asignacionVehiculo.types";

type Props = {
  visible: boolean;

  onClose:
    () => void;
};

/*
|--------------------------------------------------------------------------
| FECHA
|--------------------------------------------------------------------------
*/

function fecha(
  value:
    | string
    | null,
): string {
  if (!value) {
    return "Actual";
  }

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

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export function AsignacionHistorialModal({
  visible,

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
    useState(
      false,
    );

  const [
    historial,
    setHistorial,
  ] =
    useState<Asignacion[]>(
      [],
    );

  /*
  |--------------------------------------------------------------------------
  | CARGAR HISTORIAL
  |--------------------------------------------------------------------------
  |
  | Primera apertura:
  | GET
  |
  | Siguientes aperturas:
  | cache
  |
  | Después de crear/cambiar/finalizar:
  | el service invalida este cache
  |
  */

  useEffect(
    () => {
      if (!visible) {
        return;
      }

      let active =
        true;

      setLoading(
        true,
      );

      getHistorialAsignaciones(
        false,
      )
        .then(
          (
            data,
          ) => {
            if (active) {
              setHistorial(
                data,
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
            if (active) {
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
    ],
  );

  return (
    <Modal
      visible={
        visible
      }

      title="Historial de asignaciones"

      onClose={
        onClose
      }

      width="96%"

      maxWidth={
        900
      }
    >
      <View
        style={
          styles.content
        }
      >
        {loading ? (
          <ThemedText
            style={[
              styles.center,

              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            Cargando historial...
          </ThemedText>
        ) : historial.length ===
          0 ? (
          <ThemedText
            style={[
              styles.center,

              {
                color:
                  c.textSecondary,
              },
            ]}
          >
            No existen asignaciones registradas.
          </ThemedText>
        ) : (
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
                <View
                  style={
                    styles.header
                  }
                >
                  <View
                    style={
                      styles.headerCopy
                    }
                  >
                    <ThemedText
                      style={
                        styles.name
                      }
                    >
                      {
                        item
                          .chofer
                          .nombre
                      }
                    </ThemedText>

                    <ThemedText
                      style={{
                        color:
                          c.textSecondary,
                      }}
                    >
                      {
                        item
                          .vehiculo
                          .placa
                      }
                      {" · "}
                      {
                        item
                          .vehiculo
                          .marca
                      }
                      {" "}
                      {
                        item
                          .vehiculo
                          .modelo
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

                <ThemedText>
                  Período:{" "}
                  {
                    fecha(
                      item.fecha_asignacion,
                    )
                  }
                  {" → "}
                  {
                    fecha(
                      item.fecha_finalizacion,
                    )
                  }
                </ThemedText>

                {item.observacion ? (
                  <View
                    style={[
                      styles.observation,

                      {
                        backgroundColor:
                          c.backgroundSecondary,
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        color:
                          c.textSecondary,

                        fontSize:
                          11,

                        fontWeight:
                          "700",
                      }}
                    >
                      OBSERVACIÓN
                    </ThemedText>

                    <ThemedText>
                      {
                        item.observacion
                      }
                    </ThemedText>
                  </View>
                ) : null}
              </Card>
            ),
          )
        )}
      </View>
    </Modal>
  );
}

const styles =
  StyleSheet.create({
    content: {
      gap:
        10,
    },

    card: {
      gap:
        10,
    },

    header: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      gap:
        12,
    },

    headerCopy: {
      flex:
        1,

      minWidth:
        0,
    },

    name: {
      fontSize:
        15,

      fontWeight:
        "900",
    },

    observation: {
      padding:
        10,

      borderRadius:
        10,

      gap:
        3,
    },

    center: {
      textAlign:
        "center",

      paddingVertical:
        30,
    },
  });