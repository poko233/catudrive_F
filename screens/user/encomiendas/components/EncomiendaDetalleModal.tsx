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
  ThemedText,
} from "@/components/ThemedText";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  Encomienda,
  EstadoEncomienda,
} from "../types/encomienda.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface EncomiendaDetalleModalProps {
  visible: boolean;

  encomienda:
    Encomienda | null;

  onClose:
    () => void;
}

/*
|--------------------------------------------------------------------------
| ESTADO
|--------------------------------------------------------------------------
*/

function estadoLabel(
  estado:
    EstadoEncomienda,
): string {
  switch (
    estado
  ) {
    case "REGISTRADA":
      return "Registrada";

    case "EN_TRANSITO":
      return "En tránsito";

    case "ENTREGADA":
      return "Entregada";

    case "ANULADA":
      return "Anulada";

    default:
      return estado;
  }
}

function estadoVariant(
  estado:
    EstadoEncomienda,
):
  | "info"
  | "warning"
  | "success"
  | "destructive" {
  switch (
    estado
  ) {
    case "REGISTRADA":
      return "info";

    case "EN_TRANSITO":
      return "warning";

    case "ENTREGADA":
      return "success";

    case "ANULADA":
      return "destructive";
  }
}

/*
|--------------------------------------------------------------------------
| FECHA
|--------------------------------------------------------------------------
*/

function fecha(
  value:
    string | null,
): string {
  if (!value) {
    return "—";
  }

  const soloFecha =
    value.split(
      "T",
    )[0];

  const [
    year,
    month,
    day,
  ] =
    soloFecha.split(
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
| ITEM
|--------------------------------------------------------------------------
*/

interface DetailItemProps {
  label: string;

  value:
    string | number | null;
}

function DetailItem({
  label,

  value,
}: DetailItemProps) {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  return (
    <View
      style={
        styles.detailItem
      }
    >
      <ThemedText
        style={[
          styles.detailLabel,

          {
            color:
              c.textSecondary,
          },
        ]}
      >
        {label}
      </ThemedText>

      <ThemedText
        style={
          styles.detailValue
        }
      >
        {
          value ===
            null ||
          value ===
            ""
            ? "—"
            : value
        }
      </ThemedText>
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function EncomiendaDetalleModal({
  visible,

  encomienda,

  onClose,
}: EncomiendaDetalleModalProps) {
  if (!encomienda) {
    return null;
  }

  return (
    <Modal
      visible={
        visible
      }

      title="Detalle de encomienda"

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
        <View
          style={
            styles.header
          }
        >
          <View
            style={
              styles.headerInfo
            }
          >
            <ThemedText
              style={
                styles.guiaLabel
              }
            >
              Número de guía
            </ThemedText>

            <ThemedText
              style={
                styles.guia
              }
            >
              {
                encomienda.guia ??
                "—"
              }
            </ThemedText>
          </View>

          <Badge
            label={
              estadoLabel(
                encomienda.estado,
              )
            }

            variant={
              estadoVariant(
                encomienda.estado,
              )
            }
          />
        </View>

        <View
          style={
            styles.grid
          }
        >
          <DetailItem
            label="Fecha"

            value={
              fecha(
                encomienda.fecha,
              )
            }
          />

          <DetailItem
            label="Cantidad"

            value={
              encomienda.cantidad
            }
          />

          <DetailItem
            label="Remitente"

            value={
              encomienda.remitente
            }
          />

          <DetailItem
            label="Destinatario"

            value={
              encomienda.destinatario
            }
          />

          <DetailItem
            label="Origen"

            value={
              encomienda.origen
            }
          />

          <DetailItem
            label="Destino"

            value={
              encomienda.destino
            }
          />

          <DetailItem
            label="Precio"

            value={`Bs ${Number(
              encomienda.precio,
            ).toFixed(
              2,
            )}`}
          />

          <DetailItem
            label="Descripción"

            value={
              encomienda.descripcion
            }
          />
        </View>

        {encomienda.viaje ? (
          <View
            style={
              styles.section
            }
          >
            <ThemedText
              style={
                styles.sectionTitle
              }
            >
              Información del viaje
            </ThemedText>

            <View
              style={
                styles.grid
              }
            >
              <DetailItem
                label="Salida"

                value={
                  encomienda
                    .viaje
                    .hora_inicio
                }
              />

              <DetailItem
                label="Ruta"

                value={
                  encomienda
                    .viaje
                    .ruta
                    ? `${
                        encomienda
                          .viaje
                          .ruta
                          .origen
                      } → ${
                        encomienda
                          .viaje
                          .ruta
                          .destino
                      }`
                    : null
                }
              />

              <DetailItem
                label="Chofer"

                value={
                  encomienda
                    .viaje
                    .chofer
                    ?.nombre ??
                  null
                }
              />

              <DetailItem
                label="Vehículo"

                value={
                  encomienda
                    .viaje
                    .vehiculo
                    ?.placa ??
                  null
                }
              />
            </View>
          </View>
        ) : null}
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
        18,
    },

    header: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      flexWrap:
        "wrap",

      gap:
        12,
    },

    headerInfo: {
      gap:
        2,
    },

    guiaLabel: {
      fontSize:
        12,

      opacity:
        0.7,
    },

    guia: {
      fontSize:
        20,

      fontWeight:
        "900",
    },

    grid: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        12,
    },

    detailItem: {
      flex:
        1,

      minWidth:
        220,

      gap:
        4,
    },

    detailLabel: {
      fontSize:
        12,

      fontWeight:
        "600",
    },

    detailValue: {
      fontSize:
        14,

      fontWeight:
        "700",
    },

    section: {
      gap:
        12,

      paddingTop:
        8,
    },

    sectionTitle: {
      fontSize:
        15,

      fontWeight:
        "800",
    },

    footer: {
      flexDirection:
        "row",

      justifyContent:
        "flex-end",
    },
  });