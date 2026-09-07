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
  Eye,
  Package,
  PackageCheck,
  Pencil,
  RefreshCw,
  Send,
  Truck,
  XCircle,
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
  EncomiendaAsignarModal,
} from "./components/EncomiendaAsignarModal";

import {
  EncomiendaDetalleModal,
} from "./components/EncomiendaDetalleModal";

import {
  EncomiendaEntregaModal,
} from "./components/EncomiendaEntregaModal";

import {
  EncomiendaFormModal,
} from "./components/EncomiendaFormModal";

import {
  useEncomiendas,
} from "./hooks/useEncomiendas";

import {
  Encomienda,
  EstadoEncomienda,
} from "./types/encomienda.types";

/*
|--------------------------------------------------------------------------
| FILTRO
|--------------------------------------------------------------------------
*/

type Filtro =
  | "TODAS"
  | "REGISTRADAS"
  | "EN_TRANSITO"
  | "ENTREGADAS"
  | "ANULADAS";

/*
|--------------------------------------------------------------------------
| COLUMNAS
|--------------------------------------------------------------------------
*/

const columns:
  TableColumn[] = [
    {
      key:
        "guia",

      label:
        "Guía",

      flex:
        1,

      align:
        "center",
    },

    {
      key:
        "fecha",

      label:
        "Fecha",

      flex:
        0.9,

      align:
        "center",
    },

    {
      key:
        "remitente",

      label:
        "Remitente",

      flex:
        1.4,

      align:
        "center",
    },

    {
      key:
        "destinatario",

      label:
        "Destinatario",

      flex:
        1.4,

      align:
        "center",
    },

    {
      key:
        "ruta",

      label:
        "Ruta",

      flex:
        1.5,

      align:
        "center",
    },

    {
      key:
        "cantidad",

      label:
        "Cant.",

      flex:
        0.6,

      align:
        "center",
    },

    {
      key:
        "precio",

      label:
        "Precio",

      flex:
        0.85,

      align:
        "center",
    },

    {
      key:
        "estado",

      label:
        "Estado",

      flex:
        0.9,

      align:
        "center",
    },

    {
      key:
        "acciones",

      label:
        "Acciones",

      flex:
        1.35,

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
    string | null,
): string {
  if (!value) {
    return "—";
  }

  const soloFecha =
    value.split(
      "T",
    )[0];

  const [
    year,
    month,
    day,
  ] =
    soloFecha.split(
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
| ESTADO LABEL
|--------------------------------------------------------------------------
*/

function estadoLabel(
  estado:
    EstadoEncomienda,
): string {
  switch (
    estado
  ) {
    case "REGISTRADA":
      return "Registrada";

    case "EN_TRANSITO":
      return "En tránsito";

    case "ENTREGADA":
      return "Entregada";

    case "ANULADA":
      return "Anulada";

    default:
      return estado;
  }
}

/*
|--------------------------------------------------------------------------
| ESTADO VARIANT
|--------------------------------------------------------------------------
*/

function estadoVariant(
  estado:
    EstadoEncomienda,
):
  | "info"
  | "warning"
  | "success"
  | "destructive" {
  switch (
    estado
  ) {
    case "REGISTRADA":
      return "info";

    case "EN_TRANSITO":
      return "warning";

    case "ENTREGADA":
      return "success";

    case "ANULADA":
      return "destructive";
  }
}

/*
|--------------------------------------------------------------------------
| SCREEN
|--------------------------------------------------------------------------
*/

export default function EncomiendasScreen() {
  const {
    theme,
  } =
    useTheme();

  const c =
    theme.colors;

  const {
    encomiendas,

    loading,

    saving,

    processingId,

    catalogos,

    loadingCatalogos,

    resumen,

    refresh,

    crear,

    actualizar,

    cargarCatalogos,

    asignar,

    entregar,

    anular,
  } =
    useEncomiendas();

  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

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
      "REGISTRADAS",
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
      Encomienda | null
    >(
      null,
    );

  const [
    detalle,
    setDetalle,
  ] =
    useState<
      Encomienda | null
    >(
      null,
    );

  const [
    asignarItem,
    setAsignarItem,
  ] =
    useState<
      Encomienda | null
    >(
      null,
    );

  const [
    entregarItem,
    setEntregarItem,
  ] =
    useState<
      Encomienda | null
    >(
      null,
    );

  /*
  |--------------------------------------------------------------------------
  | FILTRO ESTADO
  |--------------------------------------------------------------------------
  */

  const porEstado =
    useMemo(
      () => {
        switch (
          filtro
        ) {
          case "REGISTRADAS":
            return encomiendas.filter(
              (
                item,
              ) =>
                item.estado ===
                "REGISTRADA",
            );

          case "EN_TRANSITO":
            return encomiendas.filter(
              (
                item,
              ) =>
                item.estado ===
                "EN_TRANSITO",
            );

          case "ENTREGADAS":
            return encomiendas.filter(
              (
                item,
              ) =>
                item.estado ===
                "ENTREGADA",
            );

          case "ANULADAS":
            return encomiendas.filter(
              (
                item,
              ) =>
                item.estado ===
                "ANULADA",
            );

          default:
            return encomiendas;
        }
      },

      [
        encomiendas,
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
              item.guia ??
                "",

              item.fecha ??
                "",

              item.remitente,

              item.destinatario,

              item.origen,

              item.destino,

              item.descripcion ??
                "",

              item.cantidad,

              item.precio,

              item.estado,

              item.viaje
                ?.vehiculo
                ?.placa ??
                "",

              item.viaje
                ?.chofer
                ?.nombre ??
                "",
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
      item:
        Encomienda,
    ) => {
      setEditing(
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

      setEditing(
        null,
      );
    };

  /*
  |--------------------------------------------------------------------------
  | ANULAR
  |--------------------------------------------------------------------------
  */

  const confirmarAnulacion =
    async (
      item:
        Encomienda,
    ) => {
      if (
        processingId !==
        null
      ) {
        return;
      }

      await anular(
        item,
      );
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
        title="Encomiendas"

        description="Registro, seguimiento, asignación y entrega de encomiendas."

        badge={`${filtradas.length} registros`}

        rightContent={
          <View
            style={
              styles.headerActions
            }
          >
            <Visibility
              action="Ver"

              selector=".encomiendas-refrescar"
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

                onPress={() =>
                  void refresh()
                }
              />
            </Visibility>

            <Visibility
              action="Crear"

              selector=".encomiendas-crear"
            >
              <Button
                title="Nueva encomienda"

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
      | RESUMEN
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
            <Package
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
              "REGISTRADAS",
            )
          }
        >
          <Card
            style={[
              styles.summaryCard,

              filtro ===
                "REGISTRADAS"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <Package
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
                  resumen.registradas
                }
              </ThemedText>

              <ThemedText>
                Registradas
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
              "EN_TRANSITO",
            )
          }
        >
          <Card
            style={[
              styles.summaryCard,

              filtro ===
                "EN_TRANSITO"
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
                c.warning
              }
            />

            <View>
              <ThemedText
                style={
                  styles.summaryValue
                }
              >
                {
                  resumen.enTransito
                }
              </ThemedText>

              <ThemedText>
                En tránsito
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
              "ENTREGADAS",
            )
          }
        >
          <Card
            style={[
              styles.summaryCard,

              filtro ===
                "ENTREGADAS"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <PackageCheck
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
                  resumen.entregadas
                }
              </ThemedText>

              <ThemedText>
                Entregadas
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
              "ANULADAS",
            )
          }
        >
          <Card
            style={[
              styles.summaryCard,

              filtro ===
                "ANULADAS"
                ? {
                    borderColor:
                      c.primary,

                    borderWidth:
                      2,
                  }
                : null,
            ]}
          >
            <XCircle
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
                  resumen.anuladas
                }
              </ThemedText>

              <ThemedText>
                Anuladas
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

        placeholder="Buscar por guía, remitente, destinatario, ruta..."
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
        <Table<Encomienda>
          data={
            filtradas
          }

          columns={
            columns
          }

          loading={
            loading
          }

          keyExtractor={(
            item,
          ) =>
            item.id.toString()
          }

          renderCell={(
            item,
            column,
          ) => {
            switch (
              column.key
            ) {
              case "guia":
                return (
                  <ThemedText
                    style={
                      styles.bold
                    }
                  >
                    {
                      item.guia ??
                      "—"
                    }
                  </ThemedText>
                );

              case "fecha":
                return (
                  <ThemedText
                    style={
                      styles.cellText
                    }
                  >
                    {
                      fecha(
                        item.fecha,
                      )
                    }
                  </ThemedText>
                );

              case "remitente":
                return (
                  <ThemedText
                    numberOfLines={
                      2
                    }

                    style={
                      styles.cellText
                    }
                  >
                    {
                      item.remitente
                    }
                  </ThemedText>
                );

              case "destinatario":
                return (
                  <ThemedText
                    numberOfLines={
                      2
                    }

                    style={
                      styles.cellText
                    }
                  >
                    {
                      item.destinatario
                    }
                  </ThemedText>
                );

              case "ruta":
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
                        item.origen
                      }
                    </ThemedText>

                    <ThemedText
                      style={[
                        styles.secondary,

                        {
                          color:
                            c.textSecondary,
                        },
                      ]}
                    >
                      →
                      {" "}
                      {
                        item.destino
                      }
                    </ThemedText>
                  </View>
                );

              case "cantidad":
                return (
                  <ThemedText
                    style={
                      styles.cellText
                    }
                  >
                    {
                      item.cantidad
                    }
                  </ThemedText>
                );

              case "precio":
                return (
                  <ThemedText
                    style={
                      styles.cellText
                    }
                  >
                    Bs{" "}
                    {
                      Number(
                        item.precio,
                      ).toFixed(
                        2,
                      )
                    }
                  </ThemedText>
                );

              case "estado":
                return (
                  <Badge
                    label={
                      estadoLabel(
                        item.estado,
                      )
                    }

                    variant={
                      estadoVariant(
                        item.estado,
                      )
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

                      selector=".encomiendas-ver"
                    >
                      <IconButton
                        icon={
                          Eye
                        }

                        size="sm"

                        variant="secondary"

                        accessibilityLabel="Ver encomienda"

                        onPress={() =>
                          setDetalle(
                            item,
                          )
                        }
                      />
                    </Visibility>

                    {item.estado ===
                    "REGISTRADA" ? (
                      <>
                        <Visibility
                          action="Editar"

                          selector=".encomiendas-editar"
                        >
                          <IconButton
                            icon={
                              Pencil
                            }

                            size="sm"

                            variant="secondary"

                            accessibilityLabel="Editar encomienda"

                            disabled={
                              saving ||
                              processingId !==
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
                          action="Editar"

                          selector=".encomiendas-asignar"
                        >
                          <IconButton
                            icon={
                              Send
                            }

                            size="sm"

                            variant="secondary"

                            accessibilityLabel="Asignar encomienda"

                            disabled={
                              saving ||
                              processingId !==
                                null
                            }

                            onPress={() =>
                              setAsignarItem(
                                item,
                              )
                            }
                          />
                        </Visibility>

                        <Visibility
                          action="Editar"

                          selector=".encomiendas-anular"
                        >
                          <IconButton
                            icon={
                              XCircle
                            }

                            size="sm"

                            variant="destructive"

                            accessibilityLabel="Anular encomienda"

                            loading={
                              processingId ===
                              item.id
                            }

                            disabled={
                              saving
                            }

                            onPress={() =>
                              void confirmarAnulacion(
                                item,
                              )
                            }
                          />
                        </Visibility>
                      </>
                    ) : null}

                    {item.estado ===
                    "EN_TRANSITO" ? (
                      <Visibility
                        action="Editar"

                        selector=".encomiendas-entregar"
                      >
                        <IconButton
                          icon={
                            CheckCircle2
                          }

                          size="sm"

                          variant="secondary"

                          accessibilityLabel="Entregar encomienda"

                          disabled={
                            saving ||
                            processingId !==
                              null
                          }

                          onPress={() =>
                            setEntregarItem(
                              item,
                            )
                          }
                        />
                      </Visibility>
                    ) : null}
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
      | FORM
      |--------------------------------------------------------------------------
      */}

      <EncomiendaFormModal
        visible={
          formVisible
        }

        encomienda={
          editing
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

        onUpdate={
          actualizar
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | DETALLE
      |--------------------------------------------------------------------------
      */}

      <EncomiendaDetalleModal
        visible={
          !!detalle
        }

        encomienda={
          detalle
        }

        onClose={() =>
          setDetalle(
            null,
          )
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | ASIGNAR
      |--------------------------------------------------------------------------
      */}

      <EncomiendaAsignarModal
        visible={
          !!asignarItem
        }

        encomienda={
          asignarItem
        }

        catalogos={
          catalogos
        }

        loadingCatalogos={
          loadingCatalogos
        }

        saving={
          saving
        }

        onClose={() => {
          if (!saving) {
            setAsignarItem(
              null,
            );
          }
        }}

        onLoadCatalogos={
          cargarCatalogos
        }

        onConfirm={
          asignar
        }
      />

      {/*
      |--------------------------------------------------------------------------
      | ENTREGAR
      |--------------------------------------------------------------------------
      */}

      <EncomiendaEntregaModal
        visible={
          !!entregarItem
        }

        encomienda={
          entregarItem
        }

        loading={
          entregarItem
            ? processingId ===
              entregarItem.id
            : false
        }

        onClose={() => {
          if (
            processingId ===
            null
          ) {
            setEntregarItem(
              null,
            );
          }
        }}

        onConfirm={
          entregar
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

      flexWrap:
        "wrap",

      gap:
        4,
    },
  });