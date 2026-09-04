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
  CheckCircle2,
  RefreshCw,
  Truck,
  UserCheck,
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
  AsignacionFinalizarModal,
} from "./components/AsignacionFinalizarModal";

import {
  AsignacionFormModal,
} from "./components/AsignacionFormModal";

import {
  AsignacionHistorialModal,
} from "./components/AsignacionHistorialModal";

import {
  useAsignacionesVehiculos,
} from "./hooks/useAsignacionesVehiculos";

import {
  Asignacion,
  FinalizarAsignacionPayload,
} from "./types/asignacionVehiculo.types";

/*
|--------------------------------------------------------------------------
| FILTRO
|--------------------------------------------------------------------------
*/

type Filtro =
  | "TODAS"
  | "ACTIVAS"
  | "FINALIZADAS";

/*
|--------------------------------------------------------------------------
| COLUMNAS
|--------------------------------------------------------------------------
*/

const columns:
  TableColumn[] = [
    {
      key:
        "inicio",

      label:
        "Fecha Inicio",

      flex:
        0.95,

      align:
        "center",
    },

    {
      key:
        "chofer",

      label:
        "Chofer",

      flex:
        1.55,

      align:
        "center",
    },

    {
      key:
        "vehiculo",

      label:
        "Vehículo",

      flex:
        1.35,

      align:
        "center",
    },

    {
      key:
        "finalizacion",

      label:
        "Fecha Fin",

      flex:
        0.95,

      align:
        "center",
    },

    {
      key:
        "observacion",

      label:
        "Observación",

      flex:
        1.65,

      align:
        "center",
    },

    {
      key:
        "estado",

      label:
        "Estado",

      flex:
        0.85,

      align:
        "center",
    },

    {
      key:
        "acciones",

      label:
        "Acciones",

      flex:
        0.95,

      align:
        "center",
    },
  ];

/*
|--------------------------------------------------------------------------
| FECHA
|--------------------------------------------------------------------------
*/

function fecha(
  value:
    | string
    | null,
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

  return year &&
    month &&
    day
    ? `${day}/${month}/${year}`
    : value;
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function AsignacionesVehiculosScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    asignaciones,

    loading,

    saving,

    processingId,

    resumen,

    refresh,

    crear,

    cambiar,

    finalizar,
  } =
    useAsignacionesVehiculos();

  const [
    search,
    setSearch,
  ] =
    useState("");

  const [
    filtro,
    setFiltro,
  ] =
    useState<Filtro>(
      "ACTIVAS",
    );

  const [
    formVisible,
    setFormVisible,
  ] =
    useState(
      false,
    );

  const [
    changing,
    setChanging,
  ] =
    useState<
      Asignacion | null
    >(null);

  const [
    finalizarItem,
    setFinalizarItem,
  ] =
    useState<
      Asignacion | null
    >(null);

  const [
    historyVisible,
    setHistoryVisible,
  ] =
    useState(
      false,
    );

  /*
  |--------------------------------------------------------------------------
  | FILTRO CARDS
  |--------------------------------------------------------------------------
  */

  const porEstado =
    useMemo(
      () => {
        switch (
          filtro
        ) {
          case "ACTIVAS":
            return asignaciones.filter(
              (
                item,
              ) =>
                item.estado ===
                "ACTIVO",
            );

          case "FINALIZADAS":
            return asignaciones.filter(
              (
                item,
              ) =>
                item.estado ===
                "FINALIZADO",
            );

          default:
            return asignaciones;
        }
      },

      [
        asignaciones,
        filtro,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | SEARCH
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
          return porEstado;
        }

        return porEstado.filter(
          (
            item,
          ) =>
            [
              item.fecha_asignacion,

              item.fecha_finalizacion ??
                "",

              item.chofer.nombre,

              item.chofer.ci ??
                "",

              item.chofer.carnet_sindical ??
                "",

              item.vehiculo.placa,

              item.vehiculo.marca,

              item.vehiculo.modelo,

              item.observacion ??
                "",

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
        porEstado,
        search,
      ],
    );

  /*
  |--------------------------------------------------------------------------
  | CREAR
  |--------------------------------------------------------------------------
  */

  const abrirCrear =
    () => {
      setChanging(
        null,
      );

      setFormVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CAMBIAR
  |--------------------------------------------------------------------------
  */

  const abrirCambio =
    (
      item:
        Asignacion,
    ) => {
      setChanging(
        item,
      );

      setFormVisible(
        true,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | CERRAR FORM
  |--------------------------------------------------------------------------
  */

  const cerrarForm =
    () => {
      if (saving) {
        return;
      }

      setFormVisible(
        false,
      );

      setChanging(
        null,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | FINALIZAR
  |--------------------------------------------------------------------------
  */

  const confirmarFinalizacion =
    async (
      item:
        Asignacion,

      payload:
        FinalizarAsignacionPayload,
    ) => {
      const ok =
        await finalizar(
          item,

          payload,
        );

      if (ok) {
        setFinalizarItem(
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
      {/*
      |--------------------------------------------------------------------------
      | HEADER
      |--------------------------------------------------------------------------
      */}

      <PageHeader
        title="Asignación de Vehículos"

        description="Asignación temporal de choferes a vehículos, cambios, finalizaciones e historial."

        badge={`${filtradas.length} registros`}

        rightContent={
          <View
            style={
              styles.headerActions
            }
          >
            <Visibility
              action="Ver"

              selector=".asignaciones-historial"
            >
              <Button
                title="Historial"

                variant="secondary"

                onPress={() =>
                  setHistoryVisible(
                    true,
                  )
                }
              />
            </Visibility>

            <Visibility
              action="Ver"

              selector=".asignaciones-refrescar"
            >
              <Button
                title="Actualizar"

                variant="secondary"

                loading={
                  loading
                }

                disabled={
                  saving ||
                  processingId !==
                    null
                }

                /*
                |--------------------------------------------------------------------------
                | GET REAL
                |--------------------------------------------------------------------------
                */

                onPress={() =>
                  void refresh()
                }
              />
            </Visibility>

            <Visibility
              action="Crear"

              selector=".asignaciones-crear"
            >
              <Button
                title="Nueva asignación"

                disabled={
                  saving ||
                  processingId !==
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
      | CARDS / FILTROS
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.summary
        }
      >
        <Pressable
          style={
            styles.summaryPressable
          }

          onPress={() =>
            setFiltro(
              "TODAS",
            )
          }
        >
          <Card
            style={[
              styles.summaryCard,

              filtro ===
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
            <Truck
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
          style={
            styles.summaryPressable
          }

          onPress={() =>
            setFiltro(
              "ACTIVAS",
            )
          }
        >
          <Card
            style={[
              styles.summaryCard,

              filtro ===
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
            <UserCheck
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
          style={
            styles.summaryPressable
          }

          onPress={() =>
            setFiltro(
              "FINALIZADAS",
            )
          }
        >
          <Card
            style={[
              styles.summaryCard,

              filtro ===
                "FINALIZADAS"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <CheckCircle2
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
                  resumen.finalizadas
                }
              </ThemedText>

              <ThemedText>
                Finalizadas
              </ThemedText>
            </View>
          </Card>
        </Pressable>
      </View>

      {/*
      |--------------------------------------------------------------------------
      | SEARCH
      |--------------------------------------------------------------------------
      */}

      <SearchBar
        value={
          search
        }

        onChangeText={
          setSearch
        }

        placeholder="Buscar chofer, vehículo, placa u observación..."
      />

      {/*
      |--------------------------------------------------------------------------
      | TABLE
      |--------------------------------------------------------------------------
      */}

      <View
        style={
          styles.tableContainer
        }
      >
        <Table<Asignacion>
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

          emptyMessage="No existen asignaciones para este filtro."

          renderCell={(
            item,
            column,
          ) => {
            switch (
              column.key
            ) {
              case "inicio":
                return (
                  <ThemedText
                    style={
                      styles.cellText
                    }
                  >
                    {
                      fecha(
                        item.fecha_asignacion,
                      )
                    }
                  </ThemedText>
                );

              case "chofer":
                return (
                  <View
                    style={
                      styles.infoCell
                    }
                  >
                    <ThemedText
                      numberOfLines={
                        1
                      }

                      style={
                        styles.bold
                      }
                    >
                      {
                        item.chofer.nombre
                      }
                    </ThemedText>

                    <ThemedText
                      numberOfLines={
                        1
                      }

                      style={[
                        styles.secondary,

                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      {
                        item.chofer.carnet_sindical ??
                        item.chofer.ci ??
                        ""
                      }
                    </ThemedText>
                  </View>
                );

              case "vehiculo":
                return (
                  <View
                    style={
                      styles.infoCell
                    }
                  >
                    <ThemedText
                      style={
                        styles.bold
                      }
                    >
                      {
                        item.vehiculo.placa
                      }
                    </ThemedText>

                    <ThemedText
                      numberOfLines={
                        1
                      }

                      style={[
                        styles.secondary,

                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      {
                        item.vehiculo.marca
                      }
                      {" "}
                      {
                        item.vehiculo.modelo
                      }
                    </ThemedText>
                  </View>
                );

              case "finalizacion":
                return (
                  <ThemedText
                    style={
                      styles.cellText
                    }
                  >
                    {
                      fecha(
                        item.fecha_finalizacion,
                      )
                    }
                  </ThemedText>
                );

              case "observacion":
                return (
                  <ThemedText
                    numberOfLines={
                      2
                    }

                    ellipsizeMode="tail"

                    style={
                      styles.cellText
                    }
                  >
                    {
                      item.observacion ||
                      "—"
                    }
                  </ThemedText>
                );

              case "estado":
                return (
                  <Badge
                    label={
                      item.estado
                    }

                    variant={
                      item.estado ===
                      "ACTIVO"
                        ? "success"
                        : "muted"
                    }
                  />
                );

              case "acciones":
                if (
                  item.estado !==
                  "ACTIVO"
                ) {
                  return (
                    <ThemedText
                      style={{
                        color:
                          c.textSecondary,
                      }}
                    >
                      —
                    </ThemedText>
                  );
                }

                return (
                  <View
                    style={
                      styles.actions
                    }
                  >
                    <Visibility
                      action="Editar"

                      selector=".asignaciones-cambiar"
                    >
                      <IconButton
                        icon={
                          RefreshCw
                        }

                        size="sm"

                        variant="secondary"

                        accessibilityLabel="Cambiar asignación"

                        disabled={
                          saving ||
                          processingId !==
                            null
                        }

                        onPress={() =>
                          abrirCambio(
                            item,
                          )
                        }
                      />
                    </Visibility>

                    <Visibility
                      action="Editar"

                      selector=".asignaciones-finalizar"
                    >
                      <IconButton
                        icon={
                          CheckCircle2
                        }

                        size="sm"

                        variant="destructive"

                        accessibilityLabel="Finalizar asignación"

                        loading={
                          processingId ===
                          item.id
                        }

                        disabled={
                          saving
                        }

                        onPress={() =>
                          setFinalizarItem(
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

      <AsignacionFormModal
        visible={
          formVisible
        }

        asignacion={
          changing
        }

        saving={
          saving
        }

        onClose={
          cerrarForm
        }

        onCreate={
          crear
        }

        onChange={
          cambiar
        }
      />

      <AsignacionFinalizarModal
        visible={
          !!finalizarItem
        }

        asignacion={
          finalizarItem
        }

        loading={
          finalizarItem
            ? processingId ===
              finalizarItem.id
            : false
        }

        onClose={() => {
          if (
            processingId ===
            null
          ) {
            setFinalizarItem(
              null,
            );
          }
        }}

        onConfirm={
          confirmarFinalizacion
        }
      />

      <AsignacionHistorialModal
        visible={
          historyVisible
        }

        onClose={() =>
          setHistoryVisible(
            false,
          )
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
        170,
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

    cellText: {
      width:
        "100%",

      textAlign:
        "center",

      fontSize:
        12,
    },

    infoCell: {
      width:
        "100%",

      minWidth:
        0,

      alignItems:
        "center",

      gap:
        2,
    },

    bold: {
      width:
        "100%",

      textAlign:
        "center",

      fontSize:
        12,

      fontWeight:
        "800",
    },

    secondary: {
      width:
        "100%",

      textAlign:
        "center",

      fontSize:
        10,
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