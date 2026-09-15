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
  RichSelectOption,
  SelectRich,
} from "@/components/ui/SelectRich";

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
  TipoReporteVehiculo,
  VehiculoReporteFiltros,
} from "../types/vehiculo-reporte.types";

import {
  CategoriaVehiculo,
  EstadoVehiculo,
} from "../../types/vehiculo.types";

import {
  Chofer,
} from "../../../choferes/types/chofer.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface VehiculoReporteFiltrosModalProps {
  visible: boolean;

  tipo:
    TipoReporteVehiculo | null;

  titulo: string;

  loading: boolean;

  categorias:
    CategoriaVehiculo[];

  choferes:
    Chofer[];

  loadingCatalogos:
    boolean;

  actionLabel:
    string;

  onClose:
    () => void;

  onGenerate:
    (
      filtros:
        VehiculoReporteFiltros,
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

const ESTADOS: EstadoVehiculo[] = [
  "Operativo",
  "En mantenimiento",
  "Baja",
];

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function VehiculoReporteFiltrosModal({
  visible,

  tipo,

  titulo,

  loading,

  categorias,

  choferes,

  loadingCatalogos,

  actionLabel,

  onClose,

  onGenerate,
}: VehiculoReporteFiltrosModalProps) {
  /*
  |--------------------------------------------------------------------------
  | VISIBILIDAD POR TIPO (reglas reales del backend)
  |--------------------------------------------------------------------------
  */

  const mostrarEstado =
    tipo ===
    "lista";

  const mostrarCategoria =
    tipo ===
      "lista" ||
    tipo ===
      "disponibles";

  const mostrarChofer =
    tipo ===
      "asignados" ||
    tipo ===
      "por_propietario";

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
    estado,
    setEstado,
  ] =
    useState("");

  const [
    idCategoria,
    setIdCategoria,
  ] =
    useState<number>(
      0,
    );

  const [
    idChofer,
    setIdChofer,
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

      setEstado(
        "",
      );

      setIdCategoria(
        0,
      );

      setIdChofer(
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
  | OPCIONES
  |--------------------------------------------------------------------------
  */

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

  const categoriaOptions =
    useMemo(
      (): RichSelectOption<number>[] => [
        {
          value:
            0,

          title:
            "Todas las categorías",

          fields:
            [],
        },

        ...categorias.map(
          (
            categoria,
          ) => ({
            value:
              categoria.id,

            title:
              categoria.categoria,

            fields:
              [],
          }),
        ),
      ],

      [
        categorias,
      ],
    );

  const choferOptions =
    useMemo(
      (): RichSelectOption<number>[] => [
        {
          value:
            0,

          title:
            "Todos los choferes",

          fields:
            [],
        },

        ...choferes.map(
          (
            chofer,
          ) => ({
            value:
              chofer.id,

            title:
              chofer.nombre_completo,

            subtitle:
              chofer.carnet_identidad
                ? `CI ${chofer.carnet_identidad}`
                : undefined,

            fields: [
              {
                label:
                  "Licencia",

                value:
                  chofer.numero_licencia,
              },

              {
                label:
                  "Teléfono",

                value:
                  chofer.telefono,
              },
            ],
          }),
        ),
      ],

      [
        choferes,
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
        VehiculoReporteFiltros = {};

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
          estado as EstadoVehiculo;
      }

      if (
        mostrarCategoria &&
        idCategoria >
          0
      ) {
        filtros.id_categoria =
          idCategoria;
      }

      if (
        mostrarChofer &&
        idChofer >
          0
      ) {
        filtros.id_chofer =
          idChofer;
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
                Si selecciona todos los estados, no se aplicará filtro por estado.
              </ThemedText>
            </View>
          ) : null}

          {mostrarCategoria ? (
            <View
              style={
                styles.field
              }
            >
              <SelectRich<number>
                label="Categoría"

                value={
                  idCategoria
                }

                options={
                  categoriaOptions
                }

                onValueChange={
                  setIdCategoria
                }

                placeholder="Todas las categorías"

                searchable

                searchPlaceholder="Buscar categoría..."

                modalTitle="Seleccionar categoría"

                loading={
                  loadingCatalogos
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
                Si selecciona todas las categorías, no se aplicará filtro por categoría.
              </ThemedText>
            </View>
          ) : null}

          {mostrarChofer ? (
            <View
              style={
                styles.field
              }
            >
              <SelectRich<number>
                label="Chofer"

                value={
                  idChofer
                }

                options={
                  choferOptions
                }

                onValueChange={
                  setIdChofer
                }

                placeholder="Todos los choferes"

                searchable

                searchPlaceholder="Buscar por nombre o CI..."

                modalTitle="Seleccionar chofer"

                loading={
                  loadingCatalogos
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
                Si selecciona todos los choferes, no se aplicará filtro por chofer.
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
