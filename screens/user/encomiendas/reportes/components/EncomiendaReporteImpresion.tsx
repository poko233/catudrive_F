import {
  Printer,
} from "@/components/Printer";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  EncomiendaCatalogoRuta,
} from "../../types/encomienda.types";

import {
  EncomiendaReporteFiltros,
  EncomiendaReporteResponse,
} from "../types/encmienda-reporte.types";

import {
  descripcionFiltrosReporte,
} from "../utils/encomienda-reporte-print.utils";

interface EncomiendaReporteImpresionProps {
  reporte:
    EncomiendaReporteResponse;

  filtros:
    EncomiendaReporteFiltros;

  rutas:
    EncomiendaCatalogoRuta[];
}

function estadoTexto(
  estado:
    string,
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

export function EncomiendaReporteImpresion({
  reporte,

  filtros,

  rutas,
}: EncomiendaReporteImpresionProps) {
  return (
    <View
      style={
        styles.container
      }
    >
      <Printer.Text
        tone="strong"

        style={
          styles.titulo
        }
      >
        {
          reporte.titulo
        }
      </Printer.Text>

      <Printer.Text
        tone="muted"

        style={
          styles.subtitulo
        }
      >
        {
          descripcionFiltrosReporte(
            filtros,
            rutas,
          )
        }
      </Printer.Text>

      <Printer.Divider />

      <View
        style={
          styles.resumen
        }
      >
        <View
          style={
            styles.resumenItem
          }
        >
          <Printer.Text
            tone="muted"
          >
            Registros
          </Printer.Text>

          <Printer.Text
            tone="strong"
          >
            {
              reporte.total_registros
            }
          </Printer.Text>
        </View>

        {reporte.total_destinos !==
        undefined ? (
          <View
            style={
              styles.resumenItem
            }
          >
            <Printer.Text
              tone="muted"
            >
              Destinos
            </Printer.Text>

            <Printer.Text
              tone="strong"
            >
              {
                reporte.total_destinos
              }
            </Printer.Text>
          </View>
        ) : null}

        {reporte.total_ingresos !==
        undefined ? (
          <View
            style={
              styles.resumenItem
            }
          >
            <Printer.Text
              tone="muted"
            >
              Total ingresos
            </Printer.Text>

            <Printer.Text
              tone="strong"
            >
              Bs {
                reporte.total_ingresos
              }
            </Printer.Text>
          </View>
        ) : null}
      </View>

      <Printer.Divider />

      {reporte.items.length ===
      0 ? (
        <Printer.Text
          tone="muted"

          style={
            styles.vacio
          }
        >
          No existen encomiendas para los filtros seleccionados.
        </Printer.Text>
      ) : (
        <View
          style={
            styles.items
          }
        >
          {reporte.items.map(
            (
              item,
              index,
            ) => (
              <View
                key={
                  item.id
                }

                style={
                  styles.item
                }
              >
                <View
                  style={
                    styles.itemCabecera
                  }
                >
                  <Printer.Text
                    tone="strong"

                    style={
                      styles.itemTitulo
                    }
                  >
                    {index + 1}. {
                      item.guia ??
                      "Sin guía"
                    }
                  </Printer.Text>

                  <Printer.Text
                    tone="strong"
                  >
                    Bs {
                      item.precio
                    }
                  </Printer.Text>
                </View>

                <Printer.Text>
                  {
                    item.origen ??
                    "-"
                  } → {
                    item.destino ??
                    "-"
                  }
                </Printer.Text>

                <Printer.Text
                  tone="muted"
                >
                  Remitente: {
                    item.remitente
                  } | Destinatario: {
                    item.destinatario
                  }
                </Printer.Text>

                <Printer.Text
                  tone="muted"
                >
                  Cantidad: {
                    item.cantidad
                  } | Estado: {
                    estadoTexto(
                      item.estado,
                    )
                  } | Viaje: {
                    item.viaje
                      ? `#${item.viaje.id}`
                      : "-"
                  }
                </Printer.Text>
              </View>
            ),
          )}
        </View>
      )}

      {reporte.tipo ===
        "por_destino" &&
      reporte.resumen_destinos &&
      reporte.resumen_destinos.length >
        0 ? (
        <View
          style={
            styles.resumenDestinos
          }
        >
          <Printer.Divider />

          <Printer.Text
            tone="strong"

            style={
              styles.seccionTitulo
            }
          >
            Resumen por destino
          </Printer.Text>

          {reporte.resumen_destinos.map(
            (
              item,
            ) => (
              <View
                key={
                  item.destino
                }

                style={
                  styles.destinoFila
                }
              >
                <Printer.Text>
                  {
                    item.destino
                  }
                </Printer.Text>

                <Printer.Text>
                  {item.cantidad} | Bs {item.total}
                </Printer.Text>
              </View>
            ),
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      gap:
        10,
    },

    titulo: {
      fontSize:
        20,

      textAlign:
        "center",
    },

    subtitulo: {
      textAlign:
        "center",

      fontSize:
        11,
    },

    resumen: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        12,
    },

    resumenItem: {
      minWidth:
        120,

      gap:
        2,
    },

    items: {
      gap:
        8,
    },

    item: {
      gap:
        3,

      paddingBottom:
        7,

      borderBottomWidth:
        StyleSheet.hairlineWidth,

      borderBottomColor:
        "#C8C8C8",
    },

    itemCabecera: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      justifyContent:
        "space-between",

      gap:
        12,
    },

    itemTitulo: {
      flex:
        1,
    },

    vacio: {
      textAlign:
        "center",

      paddingVertical:
        24,
    },

    resumenDestinos: {
      gap:
        7,
    },

    seccionTitulo: {
      fontSize:
        14,
    },

    destinoFila: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      gap:
        12,
    },
  });
