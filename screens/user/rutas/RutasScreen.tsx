import {
  ThemedText,
} from "@/components/ThemedText";

import {
  Table,
  TableColumn,
} from "@/components/Table";

import Visibility from "@/components/Visibility";

import {
  Badge,
} from "@/components/ui/Badge";

import {
  Button,
} from "@/components/ui/Button";

import {
  Card,
} from "@/components/ui/Card";

import {
  IconButton,
} from "@/components/ui/IconButton";

import {
  PageHeader,
} from "@/components/ui/PageHeader";

import {
  SearchBar,
} from "@/components/ui/SearchBar";

import {
  useTheme,
} from "@/theme/useTheme";

import {
  ArrowRight,
  Map,
  MapPin,
  Pencil,
  Route as RouteIcon,
  Trash2,
} from "lucide-react-native";

import {
  useMemo,
  useState,
} from "react";

import {
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import {
  RutaBajaModal,
} from "./components/RutaBajaModal";

import {
  RutaFormModal,
} from "./components/RutaFormModal";

import {
  useRutas,
} from "./hooks/useRutas";

import {
  Ruta,
} from "./types/ruta.types";

/*
|--------------------------------------------------------------------------
| FILTROS
|--------------------------------------------------------------------------
*/

type FiltroResumen =
  | "TODAS"
  | "ACTIVAS"
  | "INACTIVAS"
  | "CON_VIAJES";

/*
|--------------------------------------------------------------------------
| COLUMNAS
|--------------------------------------------------------------------------
|
| No utilizamos width ni minWidth.
|
| Todo el ancho disponible se reparte
| mediante flex.
|
*/

const columns:
  TableColumn[] = [
    {
      key:
        "origen",

      label:
        "Origen",

      flex:
        1.45,

      align:
        "center",

      skeletonWidth:
        "70%",
    },

    {
      key:
        "destino",

      label:
        "Destino",

      flex:
        1.45,

      align:
        "center",

      skeletonWidth:
        "70%",
    },

    {
      key:
        "fechaInicio",

      label:
        "Fecha Inicio",

      flex:
        1,

      align:
        "center",
    },

    {
      key:
        "horaInicio",

      label:
        "Hora Inicio",

      flex:
        0.82,

      align:
        "center",
    },

    {
      key:
        "fechaFin",

      label:
        "Fecha Fin",

      flex:
        1,

      align:
        "center",
    },

    {
      key:
        "horaFin",

      label:
        "Hora Fin",

      flex:
        0.82,

      align:
        "center",
    },

    {
      key:
        "tarifa",

      label:
        "Tarifa",

      flex:
        0.88,

      align:
        "center",
    },

    {
      key:
        "viajes",

      label:
        "Viajes",

      flex:
        0.58,

      align:
        "center",
    },

    {
      key:
        "estado",

      label:
        "Estado",

      flex:
        0.82,

      align:
        "center",
    },

    {
      key:
        "acciones",

      label:
        "Acciones",

      flex:
        0.88,

      align:
        "center",
    },
  ];

/*
|--------------------------------------------------------------------------
| SEPARAR FECHA / HORA
|--------------------------------------------------------------------------
*/

function separarFechaHora(
  value:
    | string
    | null
    | undefined,
): {
  fecha: string;
  hora: string;
} {
  if (!value) {
    return {
      fecha:
        "—",

      hora:
        "—",
    };
  }

  const normalized =
    String(
      value,
    )
      .trim()
      .replace(
        "T",
        " ",
      );

  const [
    rawFecha = "",
    rawHora = "",
  ] =
    normalized.split(
      " ",
    );

  const [
    year,
    month,
    day,
  ] =
    rawFecha.split(
      "-",
    );

  const fecha =
    year &&
    month &&
    day
      ? `${day}/${month}/${year}`
      : rawFecha ||
        "—";

  const hora =
    rawHora
      ? rawHora.substring(
          0,
          5,
        )
      : "—";

  return {
    fecha,
    hora,
  };
}

/*
|--------------------------------------------------------------------------
| COMPONENTE
|--------------------------------------------------------------------------
*/

export default function RutasScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    rutas,

    loading,

    saving,

    deletingId,

    resumen,

    refresh,

    guardar,

    darBaja,
  } =
    useRutas();

  /*
  |--------------------------------------------------------------------------
  | ESTADOS
  |--------------------------------------------------------------------------
  */

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filtroResumen,
    setFiltroResumen,
  ] =
    useState<FiltroResumen>(
      "TODAS",
    );

  const [
    formVisible,
    setFormVisible,
  ] =
    useState(false);

  const [
    editing,
    setEditing,
  ] =
    useState<
      Ruta | null
    >(null);

  const [
    bajaRuta,
    setBajaRuta,
  ] =
    useState<
      Ruta | null
    >(null);

  /*
  |--------------------------------------------------------------------------
  | FILTRO RESUMEN
  |--------------------------------------------------------------------------
  */

  const rutasPorResumen =
    useMemo(
      () => {
        switch (
          filtroResumen
        ) {
          case "ACTIVAS":
            return rutas.filter(
              (
                ruta,
              ) =>
                ruta.estado ===
                "ACTIVA",
            );

          case "INACTIVAS":
            return rutas.filter(
              (
                ruta,
              ) =>
                ruta.estado ===
                "INACTIVA",
            );

          case "CON_VIAJES":
            return rutas.filter(
              (
                ruta,
              ) =>
                Number(
                  ruta.viajes_count ??
                    0,
                ) >
                0,
            );

          case "TODAS":

          default:
            return rutas;
        }
      },

      [
        rutas,
        filtroResumen,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | BUSCADOR
  |--------------------------------------------------------------------------
  */

  const filtradas =
    useMemo(
      () => {
        const q =
          search
            .trim()
            .toLowerCase();

        if (!q) {
          return rutasPorResumen;
        }

        return rutasPorResumen.filter(
          (
            ruta,
          ) =>
            [
              ruta.origen,

              ruta.destino,

              ruta.hora_inicio ??
                "",

              ruta.hora_fin ??
                "",

              String(
                ruta.tarifa ??
                  "",
              ),

              ruta.estado,
            ]
              .join(
                " ",
              )
              .toLowerCase()
              .includes(
                q,
              ),
        );
      },

      [
        rutasPorResumen,
        search,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | FILTRO TEXTO
  |--------------------------------------------------------------------------
  */

  const filtroTexto =
    useMemo(
      () => {
        switch (
          filtroResumen
        ) {
          case "ACTIVAS":
            return "Activas";

          case "INACTIVAS":
            return "Inactivas";

          case "CON_VIAJES":
            return "Con viajes";

          default:
            return "Todas";
        }
      },

      [
        filtroResumen,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CREAR
  |--------------------------------------------------------------------------
  */

  const abrirCrear =
    () => {
      setEditing(
        null,
      );

      setFormVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | EDITAR
  |--------------------------------------------------------------------------
  */

  const abrirEditar =
    (
      ruta:
        Ruta,
    ) => {
      setEditing(
        ruta,
      );

      setFormVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR FORMULARIO
  |--------------------------------------------------------------------------
  */

  const cerrarForm =
    () => {
      if (
        saving
      ) {
        return;
      }

      setFormVisible(
        false,
      );

      setEditing(
        null,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | BAJA
  |--------------------------------------------------------------------------
  */

  const confirmarBaja =
    async (
      ruta:
        Ruta,
    ) => {
      const ok =
        await darBaja(
          ruta,
        );

      if (ok) {
        setBajaRuta(
          null,
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | RENDER
  |--------------------------------------------------------------------------
  */

  return (
    <View
      style={[
        styles.screen,

        {
          backgroundColor:
            c.background,
        },
      ]}
    >
      {/*
      |--------------------------------------------------------------------------
      | HEADER
      |--------------------------------------------------------------------------
      */}

      <PageHeader
        title="Rutas"
        description="Registro, modificación y baja de rutas de transporte."
        badge={`${filtradas.length} · ${filtroTexto}`}
        rightContent={
          <View
            style={
              styles.headerActions
            }
          >
            <Visibility
              action="Ver"
              selector=".rutas-refrescar"
            >
              <Button
                title="Actualizar"
                variant="secondary"
                loading={
                  loading
                }
                disabled={
                  saving ||
                  deletingId !==
                    null
                }
                onPress={() =>
                  void refresh()
                }
              />
            </Visibility>

            <Visibility
              action="Crear"
              selector=".rutas-crear"
            >
              <Button
                title="Nueva ruta"
                disabled={
                  saving ||
                  deletingId !==
                    null
                }
                onPress={
                  abrirCrear
                }
              />
            </Visibility>
          </View>
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | TARJETAS / FILTROS
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.summary
        }
      >
        {/*
        |--------------------------------------------------------------------------
        | TODAS
        |--------------------------------------------------------------------------
        */}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            selected:
              filtroResumen ===
              "TODAS",
          }}
          onPress={() =>
            setFiltroResumen(
              "TODAS",
            )
          }
          style={({
            pressed,
          }) => [
            styles.summaryPressable,

            {
              opacity:
                pressed
                  ? 0.78
                  : 1,
            },
          ]}
        >
          <Card
            style={[
              styles.summaryCard,

              filtroResumen ===
                "TODAS"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <RouteIcon
              size={20}
              color={
                c.primary
              }
            />

            <View>
              <ThemedText
                style={
                  styles.summaryValue
                }
              >
                {
                  resumen.total
                }
              </ThemedText>

              <ThemedText>
                Total rutas
              </ThemedText>
            </View>
          </Card>
        </Pressable>

        {/*
        |--------------------------------------------------------------------------
        | ACTIVAS
        |--------------------------------------------------------------------------
        */}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            selected:
              filtroResumen ===
              "ACTIVAS",
          }}
          onPress={() =>
            setFiltroResumen(
              "ACTIVAS",
            )
          }
          style={({
            pressed,
          }) => [
            styles.summaryPressable,

            {
              opacity:
                pressed
                  ? 0.78
                  : 1,
            },
          ]}
        >
          <Card
            style={[
              styles.summaryCard,

              filtroResumen ===
                "ACTIVAS"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <MapPin
              size={20}
              color={
                c.success
              }
            />

            <View>
              <ThemedText
                style={
                  styles.summaryValue
                }
              >
                {
                  resumen.activas
                }
              </ThemedText>

              <ThemedText>
                Activas
              </ThemedText>
            </View>
          </Card>
        </Pressable>

        {/*
        |--------------------------------------------------------------------------
        | INACTIVAS
        |--------------------------------------------------------------------------
        */}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            selected:
              filtroResumen ===
              "INACTIVAS",
          }}
          onPress={() =>
            setFiltroResumen(
              "INACTIVAS",
            )
          }
          style={({
            pressed,
          }) => [
            styles.summaryPressable,

            {
              opacity:
                pressed
                  ? 0.78
                  : 1,
            },
          ]}
        >
          <Card
            style={[
              styles.summaryCard,

              filtroResumen ===
                "INACTIVAS"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <Map
              size={20}
              color={
                c.textSecondary
              }
            />

            <View>
              <ThemedText
                style={
                  styles.summaryValue
                }
              >
                {
                  resumen.inactivas
                }
              </ThemedText>

              <ThemedText>
                Inactivas
              </ThemedText>
            </View>
          </Card>
        </Pressable>

        {/*
        |--------------------------------------------------------------------------
        | VIAJES
        |--------------------------------------------------------------------------
        */}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{
            selected:
              filtroResumen ===
              "CON_VIAJES",
          }}
          onPress={() =>
            setFiltroResumen(
              "CON_VIAJES",
            )
          }
          style={({
            pressed,
          }) => [
            styles.summaryPressable,

            {
              opacity:
                pressed
                  ? 0.78
                  : 1,
            },
          ]}
        >
          <Card
            style={[
              styles.summaryCard,

              filtroResumen ===
                "CON_VIAJES"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <ArrowRight
              size={20}
              color={
                c.primary
              }
            />

            <View>
              <ThemedText
                style={
                  styles.summaryValue
                }
              >
                {
                  resumen.viajes
                }
              </ThemedText>

              <ThemedText>
                Viajes registrados
              </ThemedText>
            </View>
          </Card>
        </Pressable>
      </View>

      {/*
      |--------------------------------------------------------------------------
      | BUSCADOR
      |--------------------------------------------------------------------------
      */}

      <SearchBar
        value={
          search
        }
        onChangeText={
          setSearch
        }
        placeholder="Buscar por origen, destino, tarifa o estado..."
      />

      {/*
      |--------------------------------------------------------------------------
      | TABLE
      |--------------------------------------------------------------------------
      |
      | IMPORTANTE:
      |
      | YA NO HAY:
      |
      | ScrollView horizontal
      | tableWidth
      | minWidth 1200
      | renderRow
      |
      */}

      <View
        style={
          styles.tableContainer
        }
      >
        <Table<Ruta>
          data={
            filtradas
          }
          columns={
            columns
          }
          loading={
            loading
          }
          columnGap={1}
          horizontalPadding={5}
          cellPaddingHorizontal={2}
          keyExtractor={(
            item,
          ) =>
            String(
              item.id,
            )
          }
          emptyMessage="No existen rutas para este filtro."
          renderCell={(
            item,
            column,
          ) => {
            const inicio =
              separarFechaHora(
                item.hora_inicio,
              );

            const fin =
              separarFechaHora(
                item.hora_fin,
              );

            switch (
              column.key
            ) {
              /*
              |--------------------------------------------------------------------------
              | ORIGEN
              |--------------------------------------------------------------------------
              */

              case "origen":
                return (
                  <View
                    style={
                      styles.locationCell
                    }
                  >
                    <MapPin
                      size={14}
                      color={
                        c.primary
                      }
                    />

                    <ThemedText
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={
                        styles.locationText
                      }
                    >
                      {
                        item.origen
                      }
                    </ThemedText>
                  </View>
                );

              /*
              |--------------------------------------------------------------------------
              | DESTINO
              |--------------------------------------------------------------------------
              */

              case "destino":
                return (
                  <View
                    style={
                      styles.locationCell
                    }
                  >
                    <ArrowRight
                      size={14}
                      color={
                        c.textSecondary
                      }
                    />

                    <ThemedText
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={
                        styles.locationText
                      }
                    >
                      {
                        item.destino
                      }
                    </ThemedText>
                  </View>
                );

              /*
              |--------------------------------------------------------------------------
              | FECHA INICIO
              |--------------------------------------------------------------------------
              */

              case "fechaInicio":
                return (
                  <ThemedText
                    numberOfLines={1}
                    style={
                      styles.centerCellText
                    }
                  >
                    {
                      inicio.fecha
                    }
                  </ThemedText>
                );

              /*
              |--------------------------------------------------------------------------
              | HORA INICIO
              |--------------------------------------------------------------------------
              */

              case "horaInicio":
                return (
                  <ThemedText
                    numberOfLines={1}
                    style={
                      styles.centerCellText
                    }
                  >
                    {
                      inicio.hora
                    }
                  </ThemedText>
                );

              /*
              |--------------------------------------------------------------------------
              | FECHA FIN
              |--------------------------------------------------------------------------
              */

              case "fechaFin":
                return (
                  <ThemedText
                    numberOfLines={1}
                    style={
                      styles.centerCellText
                    }
                  >
                    {
                      fin.fecha
                    }
                  </ThemedText>
                );

              /*
              |--------------------------------------------------------------------------
              | HORA FIN
              |--------------------------------------------------------------------------
              */

              case "horaFin":
                return (
                  <ThemedText
                    numberOfLines={1}
                    style={
                      styles.centerCellText
                    }
                  >
                    {
                      fin.hora
                    }
                  </ThemedText>
                );

              /*
              |--------------------------------------------------------------------------
              | TARIFA
              |--------------------------------------------------------------------------
              */

              case "tarifa":
                return (
                  <ThemedText
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={
                      0.8
                    }
                    style={
                      styles.tarifa
                    }
                  >
                    Bs.{" "}
                    {
                      Number(
                        item.tarifa ??
                          0,
                      ).toFixed(
                        2,
                      )
                    }
                  </ThemedText>
                );

              /*
              |--------------------------------------------------------------------------
              | VIAJES
              |--------------------------------------------------------------------------
              */

              case "viajes":
                return (
                  <Badge
                    label={
                      String(
                        item.viajes_count ??
                          0,
                      )
                    }
                    variant="info"
                  />
                );

              /*
              |--------------------------------------------------------------------------
              | ESTADO
              |--------------------------------------------------------------------------
              */

              case "estado":
                return (
                  <Badge
                    label={
                      item.estado
                    }
                    variant={
                      item.estado ===
                      "ACTIVA"
                        ? "success"
                        : "muted"
                    }
                  />
                );

              /*
              |--------------------------------------------------------------------------
              | ACCIONES
              |--------------------------------------------------------------------------
              */

              case "acciones":
                return (
                  <View
                    style={
                      styles.actions
                    }
                  >
                    <Visibility
                      action="Editar"
                      selector=".rutas-editar"
                    >
                      <IconButton
                        icon={
                          Pencil
                        }
                        size="sm"
                        variant="secondary"
                        accessibilityLabel="Modificar ruta"
                        disabled={
                          saving ||
                          deletingId !==
                            null
                        }
                        onPress={() =>
                          abrirEditar(
                            item,
                          )
                        }
                      />
                    </Visibility>

                    <Visibility
                      action="Eliminar"
                      selector=".rutas-baja"
                    >
                      <IconButton
                        icon={
                          Trash2
                        }
                        size="sm"
                        variant="destructive"
                        accessibilityLabel="Dar de baja la ruta"
                        loading={
                          deletingId ===
                          item.id
                        }
                        disabled={
                          item.estado ===
                            "INACTIVA" ||
                          saving
                        }
                        onPress={() =>
                          setBajaRuta(
                            item,
                          )
                        }
                      />
                    </Visibility>
                  </View>
                );

              default:
                return null;
            }
          }}
        />
      </View>

      {/*
      |--------------------------------------------------------------------------
      | FORMULARIO
      |--------------------------------------------------------------------------
      */}

      <RutaFormModal
        visible={
          formVisible
        }
        ruta={
          editing
        }
        saving={
          saving
        }
        onClose={
          cerrarForm
        }
        onSubmit={
          guardar
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | BAJA
      |--------------------------------------------------------------------------
      */}

      <RutaBajaModal
        visible={
          !!bajaRuta
        }
        ruta={
          bajaRuta
        }
        loading={
          bajaRuta
            ? deletingId ===
              bajaRuta.id
            : false
        }
        onClose={() => {
          if (
            deletingId ===
            null
          ) {
            setBajaRuta(
              null,
            );
          }
        }}
        onConfirm={
          confirmarBaja
        }
      />
    </View>
  );
}

/*
|--------------------------------------------------------------------------
| STYLES
|--------------------------------------------------------------------------
*/

const styles =
  StyleSheet.create({
    /*
    |--------------------------------------------------------------------------
    | SCREEN
    |--------------------------------------------------------------------------
    */

    screen: {
      flex: 1,

      minWidth: 0,

      padding: 18,

      gap: 12,
    },

    /*
    |--------------------------------------------------------------------------
    | HEADER
    |--------------------------------------------------------------------------
    */

    headerActions: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap: 8,
    },

    /*
    |--------------------------------------------------------------------------
    | TARJETAS
    |--------------------------------------------------------------------------
    */

    summary: {
      width: "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap: 10,
    },

    summaryPressable: {
      flex: 1,

      minWidth: 160,
    },

    summaryCard: {
      minHeight: 78,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 12,
    },

    summaryValue: {
      fontSize: 20,

      fontWeight:
        "900",
    },

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    tableContainer: {
      flex: 1,

      width: "100%",

      minWidth: 0,

      overflow: "hidden",
    },

    /*
    |--------------------------------------------------------------------------
    | ORIGEN / DESTINO
    |--------------------------------------------------------------------------
    */

    locationCell: {
      width: "100%",

      minWidth: 0,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 5,
    },

    locationText: {
      flexShrink: 1,

      minWidth: 0,

      textAlign:
        "center",

      fontWeight:
        "800",

      fontSize: 13,
    },

    /*
    |--------------------------------------------------------------------------
    | TEXTO NORMAL
    |--------------------------------------------------------------------------
    */

    centerCellText: {
      width: "100%",

      textAlign:
        "center",

      fontSize: 12,

      fontVariant: [
        "tabular-nums",
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | TARIFA
    |--------------------------------------------------------------------------
    */

    tarifa: {
      width: "100%",

      textAlign:
        "center",

      fontWeight:
        "900",

      fontSize: 12,

      fontVariant: [
        "tabular-nums",
      ],
    },

    /*
    |--------------------------------------------------------------------------
    | ACCIONES
    |--------------------------------------------------------------------------
    */

    actions: {
      width: "100%",

      minWidth: 0,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 3,
    },
  });