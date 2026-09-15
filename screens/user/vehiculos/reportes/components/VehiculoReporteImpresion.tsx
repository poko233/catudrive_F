import {
  Printer,
} from "@/components/Printer";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  VehiculoReporteFiltros,
} from "../types/vehiculo-reporte.types";

import {
  descripcionFiltrosReporteVehiculo,
  EtiquetasFiltrosVehiculo,
  periodoReporte,
} from "../utils/vehiculo-reporte-print.utils";

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

interface VehiculoReporteImpresionProps {
  titulo:
    string;

  filtros:
    VehiculoReporteFiltros;

  etiquetas:
    EtiquetasFiltrosVehiculo;
}

export function VehiculoReporteImpresion({
  titulo,

  filtros,

  etiquetas,
}: VehiculoReporteImpresionProps) {
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
          descripcionFiltrosReporteVehiculo(
            filtros,
            etiquetas,
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

        {filtros.estado ? (
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
              {
                filtros.estado
              }
            </Printer.Text>
          </View>
        ) : null}

        {filtros.id_categoria !==
        undefined ? (
          <View
            style={
              styles.resumenItem
            }
          >
            <Printer.Text
              tone="muted"
            >
              Categoría
            </Printer.Text>

            <Printer.Text
              tone="strong"
            >
              {
                etiquetas.categoriaNombre ??
                `#${filtros.id_categoria}`
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
