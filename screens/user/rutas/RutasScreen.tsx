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
  useResponsive,
} from "@/hooks/useResponsive";

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
  UsersRound,
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
  RutaChoferesViajesModal,
} from "./components/RutaChoferesViajesModal";

import {
  RutaFormModal,
} from "./components/RutaFormModal";

import {
  useRutas,
} from "./hooks/useRutas";

import {
  Ruta,
} from "./types/ruta.types";

type FiltroResumen =
  | "TODAS"
  | "ACTIVAS"
  | "INACTIVAS"
  | "CON_VIAJES";

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
    },

    {
      key:
        "fechaInicio",

      label:
        "Fecha Inicio",

      flex:
        0.95,

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
        0.95,

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
        0.85,

      align:
        "center",
    },

    {
      key:
        "viajes",

      label:
        "Viajes",

      flex:
        0.55,

      align:
        "center",
    },

    {
      key:
        "estado",

      label:
        "Estado",

      flex:
        0.8,

      align:
        "center",
    },

    {
      key:
        "acciones",

      label:
        "Acciones",

      flex:
        1.05,

      align:
        "center",
    },
  ];

function mostrarFecha(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return "—";
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

function mostrarHora(
  value:
    | string
    | null
    | undefined,
): string {
  if (!value) {
    return "—";
  }

  return value.substring(
    0,
    5,
  );
}

export default function RutasScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    isDesktop,
  } =
    useResponsive();

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
    useState(
      false,
    );

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

  const [
    choferesRuta,
    setChoferesRuta,
  ] =
    useState<
      Ruta | null
    >(null);

  /*
  |--------------------------------------------------------------------------
  | FILTRO RESUMEN
  |--------------------------------------------------------------------------
  */

  const porResumen =
    useMemo(
      () => {
        switch (
          filtroResumen
        ) {
          case "ACTIVAS":
            return rutas.filter(
              (
                item,
              ) =>
                item.estado ===
                "ACTIVA",
            );

          case "INACTIVAS":
            return rutas.filter(
              (
                item,
              ) =>
                item.estado ===
                "INACTIVA",
            );

          case "CON_VIAJES":
            return rutas.filter(
              (
                item,
              ) =>
                Number(
                  item.viajes_count ??
                    0,
                ) >
                0,
            );

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
          return porResumen;
        }

        return porResumen.filter(
          (
            item,
          ) =>
            [
              item.origen,
              item.destino,
              item.fecha_inicio ??
                "",
              item.hora_inicio ??
                "",
              item.fecha_fin ??
                "",
              item.hora_fin ??
                "",
              item.tarifa,
              item.estado,
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
        porResumen,
        search,
      ],
    );

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

  const abrirCrear =
    () => {
      setEditing(
        null,
      );

      setFormVisible(
        true,
      );
    };

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

  const cerrarForm =
    () => {
      if (saving) {
        return;
      }

      setFormVisible(
        false,
      );

      setEditing(
        null,
      );
    };

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
      <PageHeader
        title="Rutas"

        description="Registro y administración de rutas de transporte."

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

      <View
        style={
          styles.summary
        }
      >
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

          style={[
            styles.summaryPressable,

            !isDesktop &&
              styles.summaryPressableMobile,
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
              size={
                20
              }

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
                Total
              </ThemedText>
            </View>
          </Card>
        </Pressable>

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

          style={[
            styles.summaryPressable,

            !isDesktop &&
              styles.summaryPressableMobile,
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
              size={
                20
              }

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

          style={[
            styles.summaryPressable,

            !isDesktop &&
              styles.summaryPressableMobile,
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
              size={
                20
              }

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

          style={[
            styles.summaryPressable,

            !isDesktop &&
              styles.summaryPressableMobile,
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
              size={
                20
              }

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
                  resumen.conViajes
                }
              </ThemedText>

              <ThemedText>
                Con viajes
              </ThemedText>
            </View>
          </Card>
        </Pressable>
      </View>

      <SearchBar
        value={
          search
        }

        onChangeText={
          setSearch
        }

        placeholder="Buscar por origen, destino, fecha, hora, tarifa..."
      />

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

          columnGap={
            1
          }

          horizontalPadding={
            5
          }

          cellPaddingHorizontal={
            2
          }

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
            switch (
              column.key
            ) {
              case "origen":
                return (
                  <View
                    style={
                      styles.locationCell
                    }
                  >
                    <MapPin
                      size={
                        14
                      }

                      color={
                        c.primary
                      }
                    />

                    <ThemedText
                      numberOfLines={
                        1
                      }

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

              case "destino":
                return (
                  <View
                    style={
                      styles.locationCell
                    }
                  >
                    <ArrowRight
                      size={
                        14
                      }

                      color={
                        c.textSecondary
                      }
                    />

                    <ThemedText
                      numberOfLines={
                        1
                      }

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

              case "fechaInicio":
                return (
                  <ThemedText
                    numberOfLines={
                      1
                    }

                    style={
                      styles.cellText
                    }
                  >
                    {
                      mostrarFecha(
                        item.fecha_inicio,
                      )
                    }
                  </ThemedText>
                );

              case "horaInicio":
                return (
                  <ThemedText
                    numberOfLines={
                      1
                    }

                    style={
                      styles.cellText
                    }
                  >
                    {
                      mostrarHora(
                        item.hora_inicio,
                      )
                    }
                  </ThemedText>
                );

              case "fechaFin":
                return (
                  <ThemedText
                    numberOfLines={
                      1
                    }

                    style={
                      styles.cellText
                    }
                  >
                    {
                      mostrarFecha(
                        item.fecha_fin,
                      )
                    }
                  </ThemedText>
                );

              case "horaFin":
                return (
                  <ThemedText
                    numberOfLines={
                      1
                    }

                    style={
                      styles.cellText
                    }
                  >
                    {
                      mostrarHora(
                        item.hora_fin,
                      )
                    }
                  </ThemedText>
                );

              case "tarifa":
                return (
                  <ThemedText
                    numberOfLines={
                      1
                    }

                    adjustsFontSizeToFit

                    minimumFontScale={
                      0.75
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

              case "acciones":
                return (
                  <View
                    style={
                      styles.actions
                    }
                  >
                    <Visibility
                      action="Ver"

                      selector=".rutas-choferes"
                    >
                      <IconButton
                        icon={
                          UsersRound
                        }

                        size="sm"

                        variant="secondary"

                        accessibilityLabel="Ver choferes con viajes"

                        disabled={
                          saving ||
                          deletingId !==
                            null
                        }

                        onPress={() =>
                          setChoferesRuta(
                            item,
                          )
                        }
                      />
                    </Visibility>

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

                        accessibilityLabel="Dar de baja"

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

      <RutaChoferesViajesModal
        visible={
          choferesRuta !==
          null
        }

        ruta={
          choferesRuta
        }

        onClose={() =>
          setChoferesRuta(
            null,
          )
        }
      />

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

const styles =
  StyleSheet.create({
    screen: {
      flex:
        1,

      width:
        "100%",

      minWidth:
        0,

      padding:
        18,

      gap:
        12,
    },

    headerActions: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        8,
    },

    summary: {
      width:
        "100%",

      flexDirection:
        "row",

      flexWrap:
        "wrap",

      gap:
        10,
    },

    summaryPressable: {
      flex:
        1,

      minWidth:
        160,
    },

    summaryPressableMobile: {
      flexGrow:
        0,

      flexBasis:
        "47%",

      minWidth:
        0,
    },

    summaryCard: {
      minHeight:
        78,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap:
        12,
    },

    summaryValue: {
      fontSize:
        20,

      fontWeight:
        "900",
    },

    tableContainer: {
      flex:
        1,

      width:
        "100%",

      minWidth:
        0,

      overflow:
        "hidden",
    },

    locationCell: {
      width:
        "100%",

      minWidth:
        0,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        5,
    },

    locationText: {
      flexShrink:
        1,

      minWidth:
        0,

      textAlign:
        "center",

      fontWeight:
        "800",

      fontSize:
        12,
    },

    cellText: {
      width:
        "100%",

      textAlign:
        "center",

      fontSize:
        12,

      fontVariant: [
        "tabular-nums",
      ],
    },

    tarifa: {
      width:
        "100%",

      textAlign:
        "center",

      fontSize:
        12,

      fontWeight:
        "900",

      fontVariant: [
        "tabular-nums",
      ],
    },

    actions: {
      width:
        "100%",

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap:
        4,
    },
  });
