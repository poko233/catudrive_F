import {
  Printer,
} from "@/components/Printer";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  VentaReporteFiltros,
} from "../types/venta-reporte.types";

import {
  descripcionFiltrosReporteVenta,
  estadoReporte,
  EtiquetasFiltrosVenta,
  periodoReporte,
} from "../utils/venta-reporte-print.utils";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
|
| Vista previa del papel dentro de ReportPrintModal. Como el backend
| no expone JSON para este módulo, la previa muestra el título, los
| filtros aplicados y el resumen; el detalle fila por fila lo trae
| el HTML del backend al imprimir.
|
*/

interface VentaReporteImpresionProps {
  titulo:
    string;

  filtros:
    VentaReporteFiltros;

  etiquetas:
    EtiquetasFiltrosVenta;

  esPlanilla:
    boolean;

  idViaje?:
    number;
}

export function VentaReporteImpresion({
  titulo,

  filtros,

  etiquetas,

  esPlanilla,

  idViaje,
}: VentaReporteImpresionProps) {
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
          titulo
        }
      </Printer.Text>

      <Printer.Text
        tone="muted"

        style={
          styles.subtitulo
        }
      >
        {
          descripcionFiltrosReporteVenta(
            filtros,
            etiquetas,
            esPlanilla,
            idViaje,
          )
        }
      </Printer.Text>

      <Printer.Divider />

      <View
        style={
          styles.resumen
        }
      >
        {esPlanilla ? (
          <View
            style={
              styles.resumenItem
            }
          >
            <Printer.Text
              tone="muted"
            >
              Viaje
            </Printer.Text>

            <Printer.Text
              tone="strong"
            >
              #{idViaje ?? "-"}
            </Printer.Text>
          </View>
        ) : (
          <View
            style={
              styles.resumenItem
            }
          >
            <Printer.Text
              tone="muted"
            >
              Periodo
            </Printer.Text>

            <Printer.Text
              tone="strong"
            >
              {
                periodoReporte(
                  filtros,
                )
              }
            </Printer.Text>
          </View>
        )}

        <View
          style={
            styles.resumenItem
          }
        >
          <Printer.Text
            tone="muted"
          >
            Estado
          </Printer.Text>

          <Printer.Text
            tone="strong"
          >
            {esPlanilla
              ? "Pagada"
              : estadoReporte(
                  filtros,
                )}
          </Printer.Text>
        </View>

        {filtros.id_ruta !==
        undefined ? (
          <View
            style={
              styles.resumenItem
            }
          >
            <Printer.Text
              tone="muted"
            >
              Ruta
            </Printer.Text>

            <Printer.Text
              tone="strong"
            >
              {
                etiquetas.rutaNombre ??
                `#${filtros.id_ruta}`
              }
            </Printer.Text>
          </View>
        ) : null}

        {filtros.id_vehiculo !==
        undefined ? (
          <View
            style={
              styles.resumenItem
            }
          >
            <Printer.Text
              tone="muted"
            >
              Vehículo
            </Printer.Text>

            <Printer.Text
              tone="strong"
            >
              {
                etiquetas.vehiculoNombre ??
                `#${filtros.id_vehiculo}`
              }
            </Printer.Text>
          </View>
        ) : null}

        {filtros.id_chofer !==
        undefined ? (
          <View
            style={
              styles.resumenItem
            }
          >
            <Printer.Text
              tone="muted"
            >
              Chofer
            </Printer.Text>

            <Printer.Text
              tone="strong"
            >
              {
                etiquetas.choferNombre ??
                `#${filtros.id_chofer}`
              }
            </Printer.Text>
          </View>
        ) : null}

        {filtros.forma_pago ? (
          <View
            style={
              styles.resumenItem
            }
          >
            <Printer.Text
              tone="muted"
            >
              Forma de pago
            </Printer.Text>

            <Printer.Text
              tone="strong"
            >
              {
                filtros.forma_pago
              }
            </Printer.Text>
          </View>
        ) : null}
      </View>

      <Printer.Divider />

      <Printer.Text
        tone="muted"

        style={
          styles.vacio
        }
      >
        El detalle del reporte se genera desde el documento del backend al imprimir.
      </Printer.Text>
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

    vacio: {
      textAlign:
        "center",

      paddingVertical:
        24,
    },
  });
