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
  AsignacionReporteFiltros,
  EstadoReporteAsignacion,
  EstadoReporteVehiculo,
  TipoReporteAsignacion,
} from "../types/asignacion-reporte.types";

interface AsignacionReporteFiltrosModalProps {
  visible:
    boolean;

  tipo:
    TipoReporteAsignacion |
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
        AsignacionReporteFiltros,
    ) => Promise<void>;
}

function fechaLabel(
  value:
    string,
): string {
  if (
    !value
  ) {
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

const ESTADOS_ASIGNACION:
  EstadoReporteAsignacion[] = [
    "Activo",
    "Inactivo",
  ];

const ESTADOS_VEHICULO:
  EstadoReporteVehiculo[] = [
    "Operativo",
    "En mantenimiento",
    "Baja",
  ];

export function AsignacionReporteFiltrosModal({
  visible,

  tipo,

  titulo,

  loading,

  actionLabel,

  onClose,

  onGenerate,
}: AsignacionReporteFiltrosModalProps) {
  const mostrarFechas =
    tipo ===
      "por_chofer" ||
    tipo ===
      "historial";

  const mostrarEstadoAsignacion =
    tipo ===
    "historial";

  const mostrarEstadoVehiculo =
    tipo ===
    "sin_asignar";

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
    estadoAsignacion,
    setEstadoAsignacion,
  ] =
    useState(
      "",
    );

  const [
    estadoVehiculo,
    setEstadoVehiculo,
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

      setEstadoAsignacion(
        "",
      );

      setEstadoVehiculo(
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

  const estadoAsignacionOptions =
    useMemo(
      (): SelectOption<string>[] => [
        {
          label:
            "Todos los estados",

          value:
            "",
        },

        ...ESTADOS_ASIGNACION.map(
          (
            item,
          ) => ({
            label:
              item ===
              "Inactivo"
                ? "Finalizado / Inactivo"
                : item,

            value:
              item,
          }),
        ),
      ],

      [],
    );

  const estadoVehiculoOptions =
    useMemo(
      (): SelectOption<string>[] => [
        {
          label:
            "Todos los estados",

          value:
            "",
        },

        ...ESTADOS_VEHICULO.map(
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
        AsignacionReporteFiltros = {};

      if (
        mostrarFechas &&
        fechaInicio &&
        fechaFin
      ) {
        filtros.fecha_inicio =
          fechaInicio;

        filtros.fecha_fin =
          fechaFin;
      }

      if (
        mostrarEstadoAsignacion &&
        estadoAsignacion
      ) {
        filtros.estado_asignacion =
          estadoAsignacion as
            EstadoReporteAsignacion;
      }

      if (
        mostrarEstadoVehiculo &&
        estadoVehiculo
      ) {
        filtros.estado_vehiculo =
          estadoVehiculo as
            EstadoReporteVehiculo;
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
          {mostrarFechas ? (
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
          ) : null}

          {mostrarEstadoAsignacion ? (
            <View
              style={
                styles.field
              }
            >
              <Select<string>
                label="Estado de asignación"

                value={
                  estadoAsignacion
                }

                options={
                  estadoAsignacionOptions
                }

                onValueChange={
                  setEstadoAsignacion
                }

                disabled={
                  loading
                }
              />
            </View>
          ) : null}

          {mostrarEstadoVehiculo ? (
            <View
              style={
                styles.field
              }
            >
              <Select<string>
                label="Estado del vehículo"

                value={
                  estadoVehiculo
                }

                options={
                  estadoVehiculoOptions
                }

                onValueChange={
                  setEstadoVehiculo
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
                Sin filtro se mostrarán todos los vehículos que no tengan asignación activa.
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
