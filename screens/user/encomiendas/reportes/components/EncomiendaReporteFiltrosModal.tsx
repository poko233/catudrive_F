import {
  Button,
} from "@/components/ui/Button";

import {
  Modal,
} from "@/components/ui/Modal";

import {
  DatePicker,
  DatePickerResult,
} from "@/components/ui/DatePicker";

import {
  Select,
  SelectOption,
} from "@/components/ui/Select";

import {
  ThemedText,
} from "@/components/ThemedText";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  StyleSheet,
  View,
} from "react-native";

import {
  EncomiendaReporteFiltros,
  TipoReporteEncomienda,
} from "../types/encmienda-reporte.types";

import {
  EncomiendaCatalogoRuta,
} from "../../types/encomienda.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface EncomiendaReporteFiltrosModalProps {
  visible: boolean;

  tipo:
    TipoReporteEncomienda | null;

  titulo: string;

  loading: boolean;

  rutas:
    EncomiendaCatalogoRuta[];

  loadingRutas:
    boolean;

  actionLabel:
    string;

  onClose:
    () => void;

  onGenerate:
    (
      filtros:
        EncomiendaReporteFiltros,
    ) => Promise<void>;
}

/*
|--------------------------------------------------------------------------
| FECHA
|--------------------------------------------------------------------------
*/

function fechaLabel(
  value: string,
): string {
  if (!value) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] =
    value.split("-");

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function EncomiendaReporteFiltrosModal({
  visible,

  tipo,

  titulo,

  loading,

  rutas,

  loadingRutas,

  actionLabel,

  onClose,

  onGenerate,
}: EncomiendaReporteFiltrosModalProps) {
  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    fechaInicio,
    setFechaInicio,
  ] =
    useState("");

  const [
    fechaFin,
    setFechaFin,
  ] =
    useState("");

  const [
    idRuta,
    setIdRuta,
  ] =
    useState<number>(
      0,
    );

  const [
    datePickerVisible,
    setDatePickerVisible,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | RESET
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (!visible) {
        return;
      }

      setFechaInicio(
        "",
      );

      setFechaFin(
        "",
      );

      setIdRuta(
        0,
      );

      setDatePickerVisible(
        false,
      );
    },

    [
      visible,
      tipo,
    ],
  );

  /*
  |--------------------------------------------------------------------------
  | OPCIONES DE RUTAS
  |--------------------------------------------------------------------------
  */

  const rutaOptions =
    useMemo(
      (): SelectOption<number>[] => [
        {
          label:
            "Todas las rutas",

          value:
            0,
        },

        ...rutas.map(
          (
            ruta,
          ) => ({
            label:
              `${ruta.origen} → ${ruta.destino}`,

            value:
              ruta.id,
          }),
        ),
      ],

      [
        rutas,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | APLICAR RANGO
  |--------------------------------------------------------------------------
  */

  const aplicarRango =
    (
      result:
        DatePickerResult,
    ) => {
      if (
        result.type !==
        "range"
      ) {
        return;
      }

      setFechaInicio(
        result.start,
      );

      setFechaFin(
        result.end,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | LIMPIAR FECHAS
  |--------------------------------------------------------------------------
  */

  const limpiarFechas =
    () => {
      setFechaInicio(
        "",
      );

      setFechaFin(
        "",
      );
    };

  /*
  |--------------------------------------------------------------------------
  | GENERAR
  |--------------------------------------------------------------------------
  */

  const generar =
    async () => {
      const filtros:
        EncomiendaReporteFiltros = {};

      if (
        fechaInicio &&
        fechaFin
      ) {
        filtros.fecha_inicio =
          fechaInicio;

        filtros.fecha_fin =
          fechaFin;
      }

      if (
        idRuta > 0
      ) {
        filtros.id_ruta =
          idRuta;
      }

      await onGenerate(
        filtros,
      );
    };

  if (!tipo) {
    return null;
  }

  return (
    <>
      <Modal
        visible={
          visible
        }

        title={
          titulo
        }

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
              title="Cancelar"

              variant="secondary"

              disabled={
                loading
              }

              onPress={
                onClose
              }
            />

            <Button
              title={
                actionLabel
              }

              loading={
                loading
              }

              disabled={
                loading
              }

              onPress={() =>
                void generar()
              }
            />
          </View>
        }
      >
        <View style={styles.content}>
          <View
            style={
              styles.field
            }
          >
            <ThemedText
              style={
                styles.label
              }
            >
              Rango de fechas
            </ThemedText>

            <View
              style={
                styles.rangeActions
              }
            >
              <View
                style={
                  styles.rangeButton
                }
              >
                <Button
                  title={
                    fechaInicio &&
                    fechaFin
                      ? `${fechaLabel(fechaInicio)} → ${fechaLabel(fechaFin)}`
                      : "Seleccionar rango de fechas"
                  }

                  variant="secondary"

                  disabled={
                    loading
                  }

                  onPress={() =>
                    setDatePickerVisible(
                      true,
                    )
                  }
                />
              </View>

              {fechaInicio &&
              fechaFin ? (
                <Button
                  title="Limpiar"

                  variant="secondary"

                  disabled={
                    loading
                  }

                  onPress={
                    limpiarFechas
                  }
                />
              ) : null}
            </View>

            <ThemedText
              style={
                styles.helper
              }
            >
              Si no selecciona fechas, el reporte incluirá todos los registros disponibles.
            </ThemedText>
          </View>

          <View
            style={
              styles.field
            }
          >
            <Select<number>
              label="Ruta"

              value={
                idRuta
              }

              options={
                rutaOptions
              }

              onValueChange={
                setIdRuta
              }

              searchable

              disabled={
                loading ||
                loadingRutas
              }
            />

            <ThemedText
              style={
                styles.helper
              }
            >
              Si selecciona todas las rutas, no se aplicará filtro por ruta.
            </ThemedText>
          </View>
        </View>
      </Modal>

      <DatePicker
        visible={
          datePickerVisible
        }

        mode="range"

        title="Rango del reporte"

        initialRange={
          fechaInicio &&
          fechaFin
            ? {
                start:
                  fechaInicio,

                end:
                  fechaFin,
              }
            : undefined
        }

        onClose={() =>
          setDatePickerVisible(
            false,
          )
        }

        onApply={
          aplicarRango
        }
      />
    </>
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
        16,

      paddingBottom:
        4,
    },

    field: {
      gap:
        6,
    },

    label: {
      fontSize:
        13,

      fontWeight:
        "700",
    },

    helper: {
      fontSize:
        12,

      opacity:
        0.7,
    },

    rangeActions: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      alignItems:
        "center",

      gap:
        8,
    },

    rangeButton: {
      flex:
        1,

      minWidth:
        230,
    },

    footer: {
      flexDirection:
        "row",

      justifyContent:
        "flex-end",

      flexWrap:
        "wrap",

      gap:
        8,
    },
  });
