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
  EstadoVentaReporte,
  SolicitudReporteVenta,
  TipoReporteVenta,
  VentaReporteFiltros,
} from "../types/venta-reporte.types";

import {
  Viaje,
} from "../../types/pasajes.types";

import {
  Ruta,
} from "../../../rutas/types/ruta.types";

import {
  Vehiculo,
} from "../../../vehiculos/types/vehiculo.types";

import {
  Chofer,
} from "../../../choferes/types/chofer.types";

/*
|--------------------------------------------------------------------------
| PROPS
|--------------------------------------------------------------------------
*/

interface VentaReporteFiltrosModalProps {
  visible: boolean;

  tipo:
    TipoReporteVenta | null;

  titulo: string;

  loading: boolean;

  rutas:
    Ruta[];

  vehiculos:
    Vehiculo[];

  choferes:
    Chofer[];

  loadingCatalogos:
    boolean;

  viajes:
    Viaje[];

  loadingViajes:
    boolean;

  loadingMasViajes:
    boolean;

  finViajes:
    boolean;

  onCargarMasViajes:
    () => void;

  actionLabel:
    string;

  onClose:
    () => void;

  onGenerate:
    (
      solicitud:
        SolicitudReporteVenta,
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

const ESTADOS: EstadoVentaReporte[] = [
  "Pendiente",
  "Pagada",
  "Anulada",
];

/*
|--------------------------------------------------------------------------
| HORA DE SALIDA "YYYY-MM-DD HH:MM:SS" -> "DD/MM/YYYY HH:MM"
|--------------------------------------------------------------------------
*/

function formatoHoraSalida(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return "Sin hora";
  }

  const match =
    value.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/,
    );

  if (!match) {
    return value;
  }

  return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}`;
}

/*
|--------------------------------------------------------------------------
| FORMAS DE PAGO REALES (las que guarda la venta al confirmar)
|--------------------------------------------------------------------------
*/

const FORMAS_PAGO: string[] = [
  "QR Simple",
  "Tarjeta",
  "Efectivo",
];

/*
|--------------------------------------------------------------------------
| COMPONENT
|--------------------------------------------------------------------------
*/

export function VentaReporteFiltrosModal({
  visible,

  tipo,

  titulo,

  loading,

  rutas,

  vehiculos,

  choferes,

  loadingCatalogos,

  viajes,

  loadingViajes,

  loadingMasViajes,

  finViajes,

  onCargarMasViajes,

  actionLabel,

  onClose,

  onGenerate,
}: VentaReporteFiltrosModalProps) {
  /*
  |--------------------------------------------------------------------------
  | VISIBILIDAD POR TIPO (reglas reales del backend)
  |--------------------------------------------------------------------------
  */

  const esPlanilla =
    tipo ===
    "planilla";

  const mostrarRuta =
    tipo ===
    "por_ruta";

  const mostrarVehiculo =
    tipo ===
    "por_vehiculo";

  const mostrarChofer =
    tipo ===
    "por_chofer";

  const mostrarFormaPago =
    tipo ===
    "ingresos";

  const esAnalitico =
    !!tipo &&
    !esPlanilla;

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
    idRuta,
    setIdRuta,
  ] =
    useState<number>(
      0,
    );

  const [
    idVehiculo,
    setIdVehiculo,
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
    formaPago,
    setFormaPago,
  ] =
    useState("");

  const [
    idViaje,
    setIdViaje,
  ] =
    useState<number>(
      0,
    );

  const [
    viajeError,
    setViajeError,
  ] =
    useState<
      string | undefined
    >(
      undefined,
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

      setIdRuta(
        0,
      );

      setIdVehiculo(
        0,
      );

      setIdChofer(
        0,
      );

      setFormaPago(
        "",
      );

      setIdViaje(
        0,
      );

      setViajeError(
        undefined,
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
            "Solo Pagada (por defecto)",

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

  const formaPagoOptions =
    useMemo(
      (): SelectOption<string>[] => [
        {
          label:
            "Todas las formas de pago",

          value:
            "",
        },

        ...FORMAS_PAGO.map(
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

  const rutaOptions =
    useMemo(
      (): RichSelectOption<number>[] => [
        {
          value:
            0,

          title:
            "Todas las rutas",

          fields:
            [],
        },

        ...rutas.map(
          (
            ruta,
          ) => ({
            value:
              ruta.id,

            title:
              `${ruta.origen} → ${ruta.destino}`,

            fields: [
              {
                label:
                  "Tarifa",

                value:
                  ruta.tarifa,
              },
            ],
          }),
        ),
      ],

      [
        rutas,
      ],
    );

  const vehiculoOptions =
    useMemo(
      (): RichSelectOption<number>[] => [
        {
          value:
            0,

          title:
            "Todos los vehículos",

          fields:
            [],
        },

        ...vehiculos.map(
          (
            vehiculo,
          ) => ({
            value:
              vehiculo.id,

            title:
              vehiculo.placa,

            subtitle:
              `${vehiculo.marca} ${vehiculo.modelo}`,

            fields: [
              {
                label:
                  "Tipo",

                value:
                  vehiculo.tipo,
              },

              {
                label:
                  "Capacidad",

                value:
                  vehiculo.capacidad,
              },
            ],
          }),
        ),
      ],

      [
        vehiculos,
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

  const viajeOptions =
    useMemo(
      (): RichSelectOption<number>[] =>
        viajes.map(
          (
            viaje,
          ) => ({
            value:
              viaje.id,

            title:
              `Viaje #${viaje.id} · ${viaje.origen ?? "—"} → ${viaje.destino ?? "—"}`,

            subtitle:
              `${formatoHoraSalida(viaje.hora_salida)} · ${viaje.estado ?? "—"}`,

            fields: [
              {
                label:
                  "Vehículo",

                value:
                  viaje.vehiculo,
              },

              {
                label:
                  "Chofer",

                value:
                  viaje.chofer,
              },
            ],
          }),
        ),

      [
        viajes,
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
      if (!tipo) {
        return;
      }

      if (
        esPlanilla
      ) {
        if (
          idViaje <=
          0
        ) {
          setViajeError(
            "Seleccione el viaje para generar la planilla.",
          );

          return;
        }

        setViajeError(
          undefined,
        );

        await onGenerate({
          tipo,
          filtros:
            {},
          idViaje,
        });

        return;
      }

      const filtros:
        VentaReporteFiltros = {};

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
        estado !==
        ""
      ) {
        filtros.estado =
          estado as EstadoVentaReporte;
      }

      if (
        mostrarRuta &&
        idRuta >
          0
      ) {
        filtros.id_ruta =
          idRuta;
      }

      if (
        mostrarVehiculo &&
        idVehiculo >
          0
      ) {
        filtros.id_vehiculo =
          idVehiculo;
      }

      if (
        mostrarChofer &&
        idChofer >
          0
      ) {
        filtros.id_chofer =
          idChofer;
      }

      if (
        mostrarFormaPago &&
        formaPago !==
          ""
      ) {
        filtros.forma_pago =
          formaPago;
      }

      await onGenerate({
        tipo,
        filtros,
      });
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
          {esPlanilla ? (
            <View
              style={
                styles.field
              }
            >
              <SelectRich<number>
                label="Viaje"

                value={
                  idViaje
                }

                options={
                  viajeOptions
                }

                onValueChange={(
                  value,
                ) => {
                  setIdViaje(
                    value,
                  );

                  if (
                    viajeError
                  ) {
                    setViajeError(
                      undefined,
                    );
                  }
                }}

                placeholder="Seleccionar viaje..."

                searchable

                searchPlaceholder="Buscar por destino, fecha o vehículo..."

                modalTitle="Seleccionar viaje"

                emptyText="No existen viajes disponibles."

                error={
                  viajeError
                }

                loading={
                  loadingViajes
                }

                onEndReached={
                  onCargarMasViajes
                }

                loadingMore={
                  loadingMasViajes
                }

                allLoaded={
                  finViajes
                }

                endListText="Fin de viajes."

                disabled={
                  loading
                }
              />

              <ThemedText
                style={
                  styles.helper
                }
              >
                La planilla lista los pasajeros con venta Pagada del viaje seleccionado.
              </ThemedText>
            </View>
          ) : null}

          {esAnalitico ? (
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
          ) : null}

          {esAnalitico ? (
            <View
              style={
                styles.field
              }
            >
              <Select<string>
                label="Estado de venta"

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
                Si no selecciona estado, solo se incluyen ventas Pagada.
              </ThemedText>
            </View>
          ) : null}

          {mostrarRuta ? (
            <View
              style={
                styles.field
              }
            >
              <SelectRich<number>
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

                placeholder="Todas las rutas"

                searchable

                searchPlaceholder="Buscar por origen o destino..."

                modalTitle="Seleccionar ruta"

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
                Si selecciona todas las rutas, no se aplicará filtro por ruta.
              </ThemedText>
            </View>
          ) : null}

          {mostrarVehiculo ? (
            <View
              style={
                styles.field
              }
            >
              <SelectRich<number>
                label="Vehículo"

                value={
                  idVehiculo
                }

                options={
                  vehiculoOptions
                }

                onValueChange={
                  setIdVehiculo
                }

                placeholder="Todos los vehículos"

                searchable

                searchPlaceholder="Buscar por placa..."

                modalTitle="Seleccionar vehículo"

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
                Si selecciona todos los vehículos, no se aplicará filtro por vehículo.
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

          {mostrarFormaPago ? (
            <View
              style={
                styles.field
              }
            >
              <Select<string>
                label="Forma de pago"

                value={
                  formaPago
                }

                options={
                  formaPagoOptions
                }

                onValueChange={
                  setFormaPago
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
                Si selecciona todas, no se aplicará filtro por forma de pago.
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
