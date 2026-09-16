import {
  Printer,
} from "@/components/Printer";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  ChoferReporteFiltros,
} from "../types/chofer-reporte.types";

import {
  descripcionFiltrosReporteChofer,
  periodoReporteChofer,
} from "../utils/chofer-reporte-print.utils";

interface ChoferReporteImpresionProps {
  titulo:
    string;

  filtros:
    ChoferReporteFiltros;
}

export function ChoferReporteImpresion({
  titulo,

  filtros,
}: ChoferReporteImpresionProps) {
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
          descripcionFiltrosReporteChofer(
            filtros,
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
              periodoReporteChofer(
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
