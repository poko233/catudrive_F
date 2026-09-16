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
  ChoferReporteFiltros,
  EstadoReporteChofer,
  TipoReporteChofer,
} from "../types/chofer-reporte.types";

interface ChoferReporteFiltrosModalProps {
  visible:
    boolean;

  tipo:
    TipoReporteChofer |
    null;

  titulo:
    string;

  loading:
    boolean;

  actionLabel:
    string;

  onClose:
    () => void;

  onGenerate:
    (
      filtros:
        ChoferReporteFiltros,
    ) => Promise<void>;
}

function fechaLabel(
  value:
    string,
): string {
  if (!value) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] =
    value.split(
      "-",
    );

  if (
    !year ||
    !month ||
    !day
  ) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

const ESTADOS:
  EstadoReporteChofer[] = [
    "Activo",
    "Inactivo",
  ];

export function ChoferReporteFiltrosModal({
  visible,

  tipo,

  titulo,

  loading,

  actionLabel,

  onClose,

  onGenerate,
}: ChoferReporteFiltrosModalProps) {
  /*
  |--------------------------------------------------------------------------
  | REGLAS POR TIPO
  |--------------------------------------------------------------------------
  |
  | lista                -> fechas + estado
  | activos_inactivos    -> fechas
  | carnets_sindicales   -> fechas + estado
  |
  */

  const mostrarEstado =
    tipo ===
      "lista" ||
    tipo ===
      "carnets_sindicales";

  const [
    fechaInicio,
    setFechaInicio,
  ] =
    useState(
      "",
    );

  const [
    fechaFin,
    setFechaFin,
  ] =
    useState(
      "",
    );

  const [
    estado,
    setEstado,
  ] =
    useState(
      "",
    );

  const [
    datePickerVisible,
    setDatePickerVisible,
  ] =
    useState(
      false,
    );

  useEffect(
    () => {
      if (
        !visible
      ) {
        return;
      }

      setFechaInicio(
        "",
      );

      setFechaFin(
        "",
      );

      setEstado(
        "",
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

  const estadoOptions =
    useMemo(
      (): SelectOption<string>[] => [
        {
          label:
            "Todos los estados",

          value:
            "",
        },

        ...ESTADOS.map(
          (
            item,
          ) => ({
            label:
              item,

            value:
              item,
          }),
        ),
      ],

      [],
    );

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

  const limpiarFechas =
    () => {
      setFechaInicio(
        "",
      );

      setFechaFin(
        "",
      );
    };

  const generar =
    async () => {
      const filtros:
        ChoferReporteFiltros = {};

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
        mostrarEstado &&
        estado !==
          ""
      ) {
        filtros.estado =
          estado as
            EstadoReporteChofer;
      }

      await onGenerate(
        filtros,
      );
    };

  if (
    !tipo
  ) {
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
        <View
          style={
            styles.content
          }
        >
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
              Si no seleccionas fechas, se incluirán todos los registros.
            </ThemedText>
          </View>

          {mostrarEstado ? (
            <View
              style={
                styles.field
              }
            >
              <Select<string>
                label="Estado"

                value={
                  estado
                }

                options={
                  estadoOptions
                }

                onValueChange={
                  setEstado
                }

                disabled={
                  loading
                }
              />

              <ThemedText
                style={
                  styles.helper
                }
              >
                Si seleccionas todos los estados, no se aplicará filtro por estado.
              </ThemedText>
            </View>
          ) : null}
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
