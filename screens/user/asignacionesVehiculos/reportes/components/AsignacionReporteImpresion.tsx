import {
  Printer,
} from "@/components/Printer";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  AsignacionReporteFiltros,
} from "../types/asignacion-reporte.types";

import {
  descripcionFiltrosReporteAsignacion,
  periodoReporteAsignacion,
} from "../utils/asignacion-reporte-print.utils";

interface AsignacionReporteImpresionProps {
  titulo:
    string;

  filtros:
    AsignacionReporteFiltros;
}

export function AsignacionReporteImpresion({
  titulo,

  filtros,
}: AsignacionReporteImpresionProps) {
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
          descripcionFiltrosReporteAsignacion(
            filtros,
          )
        }
      </Printer.Text>

      <Printer.Divider />

      {(filtros.fecha_inicio ||
        filtros.fecha_fin) ? (
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
              periodoReporteAsignacion(
                filtros,
              )
            }
          </Printer.Text>
        </View>
      ) : null}

      {filtros.estado_asignacion ? (
        <View
          style={
            styles.resumenItem
          }
        >
          <Printer.Text
            tone="muted"
          >
            Estado de asignación
          </Printer.Text>

          <Printer.Text
            tone="strong"
          >
            {
              filtros.estado_asignacion
            }
          </Printer.Text>
        </View>
      ) : null}

      {filtros.estado_vehiculo ? (
        <View
          style={
            styles.resumenItem
          }
        >
          <Printer.Text
            tone="muted"
          >
            Estado del vehículo
          </Printer.Text>

          <Printer.Text
            tone="strong"
          >
            {
              filtros.estado_vehiculo
            }
          </Printer.Text>
        </View>
      ) : null}

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
